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
  const [cards,setCards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('study-buddy-flashcards') || '[]'); } catch { return []; }
  });
  const [view,setView] = useState('Planner');
  const [showForm,setShowForm] = useState(false);
  const [name,setName] = useState('');
  const [due,setDue] = useState(dateString(today));
  const [difficulty,setDifficulty] = useState('Medium');
  const [month,setMonth] = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [filter,setFilter] = useState('All');
  const [deck,setDeck] = useState('All');
  const [showCardForm,setShowCardForm] = useState(false);
  const [cardSubject,setCardSubject] = useState('');
  const [question,setQuestion] = useState('');
  const [answer,setAnswer] = useState('');
  const [flipped,setFlipped] = useState(false);
  const [cardIndex,setCardIndex] = useState(0);

  const save = next => { setItems(next); localStorage.setItem('study-buddy-items',JSON.stringify(next)); };
  const saveCards = next => { setCards(next); localStorage.setItem('study-buddy-flashcards',JSON.stringify(next)); };
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
  const addCard = e => {
    e.preventDefault();
    if (!cardSubject.trim() || !question.trim() || !answer.trim()) return;
    saveCards([...cards,{id:crypto.randomUUID(),subject:cardSubject.trim(),question:question.trim(),answer:answer.trim()}]);
    setDeck(cardSubject.trim()); setCardIndex(0); setQuestion(''); setAnswer(''); setShowCardForm(false); setFlipped(false);
  };
  const removeCard = id => {
    const next=cards.filter(c=>c.id!==id); saveCards(next);
    setCardIndex(Math.max(0,Math.min(cardIndex,next.filter(c=>deck==='All'||c.subject===deck).length-1)));
    setFlipped(false);
  };
  const subjects = [...new Set(cards.map(c=>c.subject))].sort((a,b)=>a.localeCompare(b));
  const shownCards = cards.filter(c=>deck==='All'||c.subject===deck);
  const currentCard = shownCards[cardIndex];
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
    <nav>
      <button className={view==='Planner'?'selected':''} onClick={()=>setView('Planner')}>☷ Planner</button>
      <button className={view==='Calendar'?'selected':''} onClick={()=>setView('Calendar')}>▦ Calendar</button>
      <button className={view==='Flashcards'?'selected':''} onClick={()=>{setView('Flashcards');setFlipped(false);}}>▤ Flashcards</button>
    </nav>
    {view==='Planner' ? <main>
      <div className="section-head"><div><h2>My assignments</h2><p>Sorted by soonest due date</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Active</option><option>Completed</option></select></div>
      {visible.length===0 ? <div className="empty"><div>📚</div><h3>You're all caught up!</h3><p>Add an assignment to start planning your work.</p></div> :
        <div className="list">{visible.map(x=><article className={`assignment ${x.done?'completed':''}`} key={x.id}>
          <input aria-label="Mark complete" type="checkbox" checked={x.done} onChange={()=>toggle(x.id)}/>
          <div className="assignment-info"><h3>{x.name}</h3><p>Due {pretty(x.due)}</p></div>
          <span className={`difficulty ${x.difficulty.toLowerCase()}`}>{x.difficulty}</span>
          <button className="delete" title="Delete assignment" onClick={()=>remove(x.id)}>×</button>
        </article>)}</div>}
    </main> : view==='Calendar' ? <main>
      <div className="month-head"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><h2>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
      <div className="calendar">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><b key={d}>{d}</b>)}{Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:days},(_,i)=>{const n=i+1,key=`${monthKey}-${String(n).padStart(2,'0')}`,has=items.some(x=>x.due===key);return <div className={`day ${key===dateString(today)?'today':''}`} key={key}><span>{n}</span>{has&&<i/>}</div>})}</div>
      <h3 className="month-label">Assignments this month</h3>
      {monthItems.length?monthItems.map(x=><div className="month-item" key={x.id}><span>{x.name}</span><small>{pretty(x.due)}</small></div>):<p className="muted">No assignments due this month.</p>}
    </main> : <main className="flashcards-main">
      <div className="section-head flash-head"><div><h2>My flashcards</h2><p>Practice a little at a time</p></div><button className="primary add-card-button" onClick={()=>setShowCardForm(true)}>＋ Create flashcard</button></div>
      {cards.length===0 ? <div className="empty"><div>🧠</div><h3>No flashcards yet</h3><p>Create your first card to start studying.</p><button className="primary empty-create" onClick={()=>setShowCardForm(true)}>Create flashcard</button></div> :
      <>
        <div className="deck-row"><label htmlFor="deck-select">Subject / deck</label><select id="deck-select" value={deck} onChange={e=>{setDeck(e.target.value);setCardIndex(0);setFlipped(false);}}><option value="All">All subjects</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select><span>{shownCards.length} {shownCards.length===1?'card':'cards'}</span></div>
        {currentCard ? <div className="study-area">
          <button className={`flashcard ${flipped?'is-flipped':''}`} onClick={()=>setFlipped(!flipped)} aria-label="Flip flashcard">
            <span className="card-label">{flipped?'ANSWER':'QUESTION'}</span>
            <strong>{flipped?currentCard.answer:currentCard.question}</strong>
            <small>Click to {flipped?'see question':'reveal answer'}</small>
          </button>
          <div className="card-controls">
            <button className="secondary" onClick={()=>{setCardIndex((cardIndex-1+shownCards.length)%shownCards.length);setFlipped(false);}}>← Previous</button>
            <span>{cardIndex+1} / {shownCards.length}</span>
            <button className="secondary" onClick={()=>{setCardIndex((cardIndex+1)%shownCards.length);setFlipped(false);}}>Next →</button>
          </div>
          <div className="card-meta"><span>{currentCard.subject}</span><button className="delete-card" onClick={()=>removeCard(currentCard.id)}>Delete this card</button></div>
        </div> : <div className="empty"><h3>No cards in this subject</h3><p>Choose another subject or create a card.</p></div>}
      </>}
    </main>}
    {view==='Planner' && <button className="fab" onClick={()=>setShowForm(true)} aria-label="Add assignment">＋</button>}
    {showForm&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false)}}><form className="drawer" onSubmit={add}>
      <div className="drawer-head"><div><h2>New assignment</h2><p>Add homework to your planner</p></div><button type="button" className="close" onClick={()=>setShowForm(false)}>×</button></div>
      <label>Homework name<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Math worksheet"/></label>
      <label>Due date<input type="date" required value={due} onChange={e=>setDue(e.target.value)}/></label>
      <label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
      <div className="form-actions"><button type="button" className="cancel" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary" type="submit">Save assignment</button></div>
    </form></div>}
    {showCardForm&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowCardForm(false)}}><form className="drawer" onSubmit={addCard}>
      <div className="drawer-head"><div><h2>New flashcard</h2><p>Add a question and its answer</p></div><button type="button" className="close" onClick={()=>setShowCardForm(false)}>×</button></div>
      <label>Subject / deck<input autoFocus required value={cardSubject} onChange={e=>setCardSubject(e.target.value)} placeholder="e.g. Biology"/></label>
      <label>Question (front)<textarea required rows="4" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Type your question"/></label>
      <label>Answer (back)<textarea required rows="4" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type the answer"/></label>
      <div className="form-actions"><button type="button" className="cancel" onClick={()=>setShowCardForm(false)}>Cancel</button><button className="primary" type="submit">Save flashcard</button></div>
    </form></div>}
    <footer>Study Buddy · Stay organized, one assignment at a time.</footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
