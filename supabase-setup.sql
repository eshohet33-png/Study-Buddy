-- Study Buddy: run this entire script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  role text not null check (role in ('student','teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  due_at date not null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_completions (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create index if not exists assignments_class_due_idx on public.assignments(class_id, due_at);
create index if not exists class_members_student_idx on public.class_members(student_id);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_completions enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "classes teacher manages own and students read joined" on public.classes;
create policy "classes teacher manages own and students read joined" on public.classes for select to authenticated using (
  teacher_id = auth.uid() or exists (select 1 from public.class_members m where m.class_id = id and m.student_id = auth.uid())
);
drop policy if exists "teachers create classes" on public.classes;
create policy "teachers create classes" on public.classes for insert to authenticated with check (teacher_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
drop policy if exists "teachers update own classes" on public.classes;
create policy "teachers update own classes" on public.classes for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "teachers delete own classes" on public.classes;
create policy "teachers delete own classes" on public.classes for delete to authenticated using (teacher_id = auth.uid());

drop policy if exists "members read own memberships or teacher classes" on public.class_members;
create policy "members read own memberships or teacher classes" on public.class_members for select to authenticated using (
 student_id = auth.uid() or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
);

 drop policy if exists "class participants read assignments" on public.assignments;
create policy "class participants read assignments" on public.assignments for select to authenticated using (
 teacher_id = auth.uid() or exists (select 1 from public.class_members m where m.class_id = assignments.class_id and m.student_id = auth.uid())
);
drop policy if exists "teachers post to own classes" on public.assignments;
create policy "teachers post to own classes" on public.assignments for insert to authenticated with check (
 teacher_id = auth.uid() and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
);
drop policy if exists "teachers update own assignments" on public.assignments;
create policy "teachers update own assignments" on public.assignments for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "teachers delete own assignments" on public.assignments;
create policy "teachers delete own assignments" on public.assignments for delete to authenticated using (teacher_id = auth.uid());

drop policy if exists "students and teachers read relevant completions" on public.assignment_completions;
create policy "students and teachers read relevant completions" on public.assignment_completions for select to authenticated using (
 student_id = auth.uid() or exists (select 1 from public.assignments a where a.id = assignment_id and a.teacher_id = auth.uid())
);
drop policy if exists "students manage own completion" on public.assignment_completions;
create policy "students manage own completion" on public.assignment_completions for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

create or replace function public.join_class_by_code(p_join_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare found_class public.classes%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student') then
    raise exception 'Only student accounts can join a class.';
  end if;
  select * into found_class from public.classes where upper(join_code) = upper(trim(p_join_code));
  if found_class.id is null then raise exception 'That class code was not found.'; end if;
  insert into public.class_members(class_id, student_id) values(found_class.id, auth.uid()) on conflict do nothing;
  return jsonb_build_object('class_id', found_class.id, 'class_name', found_class.name);
end; $$;
revoke all on function public.join_class_by_code(text) from public;
grant execute on function public.join_class_by_code(text) to authenticated;

create or replace function public.set_assignment_completion(p_assignment_id uuid, p_completed boolean)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id where a.id = p_assignment_id and m.student_id = auth.uid()) then
    raise exception 'You are not a member of this assignment class.';
  end if;
  if p_completed then
    insert into public.assignment_completions(assignment_id, student_id) values(p_assignment_id, auth.uid()) on conflict (assignment_id, student_id) do update set completed_at = now();
  else
    delete from public.assignment_completions where assignment_id = p_assignment_id and student_id = auth.uid();
  end if;
end; $$;
grant execute on function public.set_assignment_completion(uuid, boolean) to authenticated;

-- Prevent a signed-in user from changing their account role after registration.
create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql as $$
begin
  if new.role <> old.role then raise exception 'Account type cannot be changed after signup.'; end if;
  return new;
end; $$;
drop trigger if exists profile_role_immutable on public.profiles;
create trigger profile_role_immutable before update on public.profiles
for each row execute function public.prevent_profile_role_change();
