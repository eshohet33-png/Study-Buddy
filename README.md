# Study Buddy — Combined Edition

This is the combined Study Buddy project: the newest games/boss-battles version plus the classroom and account features discussed in Study Buddy App Plan 2.

## Features

- Homework planner with personal assignments, due dates, difficulty, priority, early reminders, completion checkboxes, and configurable completed-work auto-hide (Never, 1, 3, 7, 14, or 30 days).
- Completed History and monthly calendar.
- Teacher and student accounts using Supabase Auth (email/password).
- Teachers can create classrooms and share join codes, then post homework with instructions, due dates, and priority.
- Students can join multiple classes. Homework from every joined class appears together in their planner; each student's completion is tracked separately. Teachers see completion counts.
- Flashcards.
- Grade-based Math, trivia, spelling, and science games (Kindergarten through Grade 12); perfect five-question rounds earn 10 coins.
- Much harder grade-based boss battles: 10 advanced questions, three hearts, a 5-coin entry fee, and a 15-coin victory reward. Boss questions are designed to be more challenging than regular games.
- Adjustable study timer; a completed session longer than 45 minutes earns 5 coins.
- Coin leagues based on total coins earned and a theme shop.

## Run locally

1. Install Node.js LTS.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown.

The planner, games, flashcards, timer, coins, and themes work locally without Supabase. Local data is saved in that browser on that device.

## Enable accounts and shared classrooms

1. Open your Supabase project.
2. In **SQL Editor**, run the complete `supabase-setup.sql` file (it adds the grade column to existing profiles too).
3. In **Authentication → Providers → Email**, enable Email sign-in. For easier testing you may turn off email confirmation; for a public school app, keep confirmation and set up appropriate guardian/school consent.
4. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and **publishable** key. Never put a `service_role` or secret key in this app.
5. Restart the dev server. For Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Project → Settings → Environment Variables, then redeploy.
6. Create a teacher account, create a class, and share its join code with students. Students create student accounts, choose their grade (Kindergarten through Grade 12), and enter each class code in the Classes tab. The grade can be updated later in Account settings. A student can join multiple classes.

## Important notes

- The role selector is for a prototype. Before using this with a real school, add teacher verification/invitations so students cannot register themselves as teachers.
- Coins, purchased themes, personal homework, and flashcards currently remain in the local browser. Shared classroom assignments and each student's completion status sync through Supabase. Cloud syncing of coins, timer rewards, flashcards, and personal homework is not included yet.
- The UI currently shows teachers completion counts per assignment; a detailed roster/progress dashboard is a next enhancement.
- This is a prototype, not a school-compliance-certified product. Avoid collecting unnecessary student information and obtain required school/parent permissions before public use.
