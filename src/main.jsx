import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const today = new Date();
const dateString = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const pretty = s => new Date(`${s}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});

function App() {
  const [items,setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('study-buddy-items') || '[]'); } catch { return []; }
  });
  const [view,setView] = useState('Planner');
  const [showForm,setShowForm] = useState(false);
  const [name,setName] = useState('');
  const [due,setDue] = useState(dateString(today));
  const [difficulty,setDifficulty] = useState('Medium');
  const [month,setMonth] = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [filter,setFilter] = useState('All');
  const save = next => { setItems(next); localStorage.setItem('study-buddy-items',JSON.stringify(next)); };
  const sorted = useMemo(() => [...items].sort((a,b)=>a.due.localeCompare(b.due)),[items]);
  const active = sorted.filter(x=>!x.done);
  const add = e => {
    e.preventDefault();
    if (!name.trim() || !due) return;
    save([...items,{id:crypto.randomUUID(),name:name.trim(),due,difficulty,done:false}]);
    setName(''); setDue(dateString(today)); setDifficulty('Medium'); setShowForm(false);
  };
  const toggle = id => save(items.map(x=>x.id===id?{...x,done:!x.done}:x));
  const remove = id => save(items.filter(x=>x.id!==id));
  const days = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const offset = new Date(month.getFullYear(),month.getMonth(),1).getDay();
  const monthKey = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
  const monthItems = sorted.filter(x=>x.due.startsWith(monthKey));
  const visible = filter==='All'?sorted:sorted.filter(x=>filter==='Active'?!x.done:x.done);

  return <div className="app">
    <header><div className="brand"><div className="logo">✦</div><div><h1>Study Buddy</h1><p>Your personal homework planner</p></div></div><span className="tag">STUDENT PLANNER</span></header>
    <section className="stats">
      <div><strong>{active.length}</strong><span>To do</span></div>
      <div><strong>{items.filter(x=>x.done).length}</strong><span>Completed</span></div>
      <div><strong>{active.filter(x=>x.due<dateString(today)).length}</strong><span>Overdue</span></div>
    </section>
    <nav><button className={view==='Planner'?'selected':''} onClick={()=>setView('Planner')}>☷ Planner</button><button className={view==='Calendar'?'selected':''} onClick={()=>setView('Calendar')}>▦ Calendar</button></nav>
    {view==='Planner' ? <main>
      <div className="section-head"><div><h2>My assignments</h2><p>Sorted by soonest due date</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Active</option><option>Completed</option></select></div>
      {visible.length===0 ? <div className="empty"><div>📚</div><h3>You're all caught up!</h3><p>Add an assignment to start planning your work.</p></div> :
        <div className="list">{visible.map(x=><article className={`assignment ${x.done?'completed':''}`} key={x.id}>
          <input aria-label="Mark complete" type="checkbox" checked={x.done} onChange={()=>toggle(x.id)}/>
          <div className="assignment-info"><h3>{x.name}</h3><p>Due {pretty(x.due)}</p></div>
          <span className={`difficulty ${x.difficulty.toLowerCase()}`}>{x.difficulty}</span>
          <button className="delete" title="Delete assignment" onClick={()=>remove(x.id)}>×</button>
        </article>)}</div>}
    </main> : <main>
      <div className="month-head"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><h2>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
      <div className="calendar">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><b key={d}>{d}</b>)}{Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:days},(_,i)=>{const n=i+1,key=`${monthKey}-${String(n).padStart(2,'0')}`,has=items.some(x=>x.due===key);return <div className={`day ${key===dateString(today)?'today':''}`} key={key}><span>{n}</span>{has&&<i/>}</div>})}</div>
      <h3 className="month-label">Assignments this month</h3>
      {monthItems.length?monthItems.map(x=><div className="month-item" key={x.id}><span>{x.name}</span><small>{pretty(x.due)}</small></div>):<p className="muted">No assignments due this month.</p>}
    </main>}
    <button className="fab" onClick={()=>setShowForm(true)} aria-label="Add assignment">＋</button>
    {showForm&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false)}}><form className="drawer" onSubmit={add}>
      <div className="drawer-head"><div><h2>New assignment</h2><p>Add homework to your planner</p></div><button type="button" className="close" onClick={()=>setShowForm(false)}>×</button></div>
      <label>Homework name<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Math worksheet"/></label>
      <label>Due date<input type="date" required value={due} onChange={e=>setDue(e.target.value)}/></label>
      <label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
      <div className="form-actions"><button type="button" className="cancel" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary" type="submit">Save assignment</button></div>
    </form></div>}
    <footer>Study Buddy · Stay organized, one assignment at a time.</footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
