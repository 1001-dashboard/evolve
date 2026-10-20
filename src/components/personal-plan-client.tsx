'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CalendarCheck2,CheckCircle2,Clock3,Compass,Flag,Lightbulb,Pencil,RefreshCw,ShieldAlert} from 'lucide-react';
import {apiUrl} from '@/lib/config';
import {alcoholNotice, categories, isAlcohol, type Program, type Checkin} from '@/lib/programs';
import {choicesFor,focusOptions,periodStart,scheduleFor,planTip,type PlanProfile,type PlanReview,type Focus,type PreferredTime} from '@/lib/personal-plan';

type Props={programs:Program[];checkins:Checkin[];profiles:PlanProfile[];reviews:PlanReview[];day:string;error:string|null;planError:string|null;initialProgramId?:string};
const moments: {id:PreferredTime;name:string}[]=[{id:'mattina',name:'Mattina'},{id:'pranzo',name:'Pausa pranzo'},{id:'sera',name:'Sera'},{id:'flessibile',name:'Flessibile'}];
const weekday=(d:string)=>new Date(d+'T12:00:00Z').toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
const defaults=(program:Program,profile?:PlanProfile)=>({
  focus:profile?.focus??choicesFor(program.category)[0],baseline:profile?.baseline??'',obstacle:profile?.obstacle??'',successSign:profile?.success_sign??'',
  minutes:profile?.minutes??10,daysPerWeek:profile?.days_per_week??3,confidence:profile?.confidence??2,preferredTime:profile?.preferred_time??'flessibile' as PreferredTime,
});

export function PersonalPlanClient({programs,checkins,profiles,reviews,day,error,planError,initialProgramId}:Props){
  const [selected,setSelected]=useState(initialProgramId&&programs.some(p=>p.id===initialProgramId)?initialProgramId:(programs.find(p=>p.status==='active')?.id??programs[0]?.id??''));
  const chosen=programs.find(p=>p.id===selected);
  return <div className="path-page space-y-5">
    <header className="path-header"><p className="eyebrow mb-2">EVOLVE · IL TUO PIANO</p><h1 className="text-3xl md:text-4xl font-bold">Dall’obiettivo all’allenamento</h1><p className="muted mt-2">Definisci cosa vuoi allenare, quanto tempo hai e quali risultati puoi verificare. Poi segui un passo alla volta.</p></header>
    {(error||planError)&&<div className="path-alert" role="alert"><ShieldAlert size={18}/>{error||planError}</div>}
    {programs.length===0?<section className="panel"><h2 className="text-xl font-bold mb-3">Prima crea un percorso</h2><p className="muted mb-5">Il piano viene collegato a un obiettivo che hai scelto.</p><Link className="btn" href="/percorsi">Crea un percorso <ArrowRight size={16} className="inline ml-1"/></Link></section>:<>
      <div className="plan-switcher"><label htmlFor="which-program" className="text-sm font-semibold">Percorso da personalizzare</label><select id="which-program" className="field" value={selected} onChange={e=>setSelected(e.target.value)}>{programs.map(p=><option value={p.id} key={p.id}>{p.title}{p.status==='paused'?' (in pausa)':''}</option>)}</select></div>
      {chosen&&<PlanForProgram key={chosen.id} program={chosen} day={day} profile={profiles.find(x=>x.program_id===chosen.id)} logs={checkins.filter(x=>x.program_id===chosen.id)} reviews={reviews.filter(x=>x.program_id===chosen.id)} disabled={Boolean(error||planError)}/>}
    </>}
  </div>;
}
function PlanForProgram({program,day,profile,logs,reviews,disabled}:{program:Program;day:string;profile?:PlanProfile;logs:Checkin[];reviews:PlanReview[];disabled:boolean}){
  const initial=defaults(program,profile);
  const [editing,setEditing]=useState(!profile);
  const [step,setStep]=useState(1);
  const [focus,setFocus]=useState<Focus>(initial.focus);
  const [baseline,setBaseline]=useState(initial.baseline);
  const [obstacle,setObstacle]=useState(initial.obstacle);
  const [successSign,setSuccessSign]=useState(initial.successSign);
  const [minutes,setMinutes]=useState(initial.minutes);
  const [daysPerWeek,setDaysPerWeek]=useState(initial.daysPerWeek);
  const [confidence,setConfidence]=useState(initial.confidence);
  const [preferredTime,setPreferredTime]=useState<PreferredTime>(initial.preferredTime);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [reviewOpen,setReviewOpen]=useState(false);
  const start=profile?periodStart(profile,day):day;
  const currentReview=reviews.find(r=>r.period_start===start);
  const [reviewConfidence,setReviewConfidence]=useState(currentReview?.confidence??profile?.confidence??2);
  const [win,setWin]=useState(currentReview?.win??'');
  const [reviewObstacle,setReviewObstacle]=useState(currentReview?.obstacle??'');
  const [adjustment,setAdjustment]=useState(currentReview?.adjustment??'');

  async function post(path:string,body:object){
    setBusy(true);setMessage('');
    try{
      const response=await fetch(apiUrl(path),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Operazione non riuscita.');
      window.location.reload();
    }catch(e){setMessage(e instanceof Error?e.message:'Errore di rete');setBusy(false);}
  }
  function submitPlan(e:React.FormEvent){
    e.preventDefault();
    if(baseline.trim().length<5||successSign.trim().length<5){setMessage('Descrivi il punto di partenza e il risultato atteso (almeno 5 caratteri).');setStep(1);return;}
    post('/api/programs/plan',{programId:program.id,focus,baseline,obstacle,successSign,minutes,daysPerWeek,confidence,preferredTime});
  }
  function submitReview(e:React.FormEvent){e.preventDefault();post('/api/programs/review',{programId:program.id,confidence:reviewConfidence,win,obstacle:reviewObstacle,adjustment});}
  const scheduled=profile?scheduleFor(profile,day,logs):[];
  const completed=scheduled.filter(x=>logs.some(c=>c.day===x.day&&c.outcome==='done')).length;
  const next=scheduled.find(x=>x.day>=day&&!logs.some(c=>c.day===x.day));
  const sessionsLogged=scheduled.filter(x=>logs.some(c=>c.day===x.day)).length;
  const heading=categories.find(c=>c.id===program.category)?.label??'Percorso';
  return <div className="space-y-5">
    <section className="panel plan-identity"><div><p className="eyebrow mb-2">{heading}</p><h2 className="text-xl font-bold">{program.title}</h2><p className="muted text-sm mt-1">{program.objective || 'Un traguardo concreto, costruito nel tempo.'}</p></div>{profile&&!editing&&<button className="btn-secondary" onClick={()=>setEditing(true)}><Pencil size={15} className="inline mr-1"/> Modifica assessment</button>}</section>
    {message&&<div role="alert" className="path-inline-alert">{message}</div>}
    {editing&&<form className="panel plan-assessment" onSubmit={submitPlan}>
      <div className="flex justify-between items-start gap-4 mb-3"><div><p className="eyebrow">ASSESSMENT · {step} DI 2</p><h2 className="text-2xl font-bold mt-2">{step===1?'Dove sei e dove vuoi arrivare':'Rendiamolo sostenibile'}</h2><p className="muted text-sm mt-2">{step===1?'Tre informazioni per evitare esercizi generici.':'Un impegno compatibile con la tua settimana reale.'}</p></div><span className="chip">{step}/2</span></div>
      {step===1?<div className="plan-fields">
        <fieldset><legend className="font-semibold text-sm mb-2">Su cosa vuoi allenarti principalmente?</legend><div className="plan-focus-grid">{choicesFor(program.category).map(id=>{const option=focusOptions.find(x=>x.id===id)!;return <button type="button" key={id} className={'plan-focus '+(focus===id?'active':'')} aria-pressed={focus===id} onClick={()=>setFocus(id)}><strong>{option.label}</strong><small>{option.intro}</small></button>})}</div></fieldset>
        <label className="plan-field"><span>Situazione attuale <strong>*</strong></span><small>Che cosa sai già fare o che cosa accade oggi?</small><textarea required minLength={5} maxLength={320} className="field" rows={3} value={baseline} onChange={e=>setBaseline(e.target.value)} placeholder="Esempio: nel noleggio ho molta esperienza, ma in spagnolo mi blocco nelle telefonate."/></label>
        <label className="plan-field"><span>L’ostacolo principale</span><small>Una cosa che rende difficile avanzare. Facoltativa.</small><textarea maxLength={320} className="field" rows={2} value={obstacle} onChange={e=>setObstacle(e.target.value)} placeholder="Esempio: paura di non trovare le parole quando c'è pressione."/></label>
        <label className="plan-field"><span>Risultato verificabile <strong>*</strong></span><small>Che cosa saprai fare di diverso tra qualche settimana?</small><textarea required minLength={5} maxLength={320} className="field" rows={2} value={successSign} onChange={e=>setSuccessSign(e.target.value)} placeholder="Esempio: gestire 5 domande tipiche al desk senza leggere uno schema."/></label>
        <button type="button" className="btn" onClick={()=>{if(baseline.trim().length>=5&&successSign.trim().length>=5){setStep(2);setMessage('')}else setMessage('Completa situazione attuale e risultato verificabile (almeno 5 caratteri).')}}>Continua: programma la settimana <ArrowRight size={16} className="inline ml-1"/></button>
      </div>:<div className="plan-fields">
        <label className="plan-field"><span>Quanto tempo puoi dedicare per allenamento?</span><select className="field" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[5,10,15,20,30].map(n=><option key={n} value={n}>{n} minuti</option>)}</select></label>
        <label className="plan-field"><span>Quanti giorni alla settimana?</span><select className="field" value={daysPerWeek} onChange={e=>setDaysPerWeek(Number(e.target.value))}>{[2,3,4,5,6,7].map(n=><option key={n} value={n}>{n} giorni</option>)}</select></label>
        <label className="plan-field"><span>Quando è più semplice?</span><select className="field" value={preferredTime} onChange={e=>setPreferredTime(e.target.value as PreferredTime)}>{moments.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <fieldset className="plan-field"><legend><strong>Quanta fiducia hai oggi nel riuscirci?</strong> (1–5)</legend><p className="muted text-xs my-2">È una percezione personale, non un voto sulle tue capacità.</p><div className="plan-rating">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={confidence===n} className={confidence===n?'active':''} onClick={()=>setConfidence(n)}>{n}</button>)}</div></fieldset>
        {isAlcohol(program.category)&&<div className="path-caution"><ShieldAlert size={18}/><p>{alcoholNotice}</p></div>}
        <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={()=>{setStep(1);setMessage('')}}>Indietro</button><button type="submit" disabled={busy||disabled} className="btn">{busy?'Salvataggio…':profile?'Aggiorna il piano':'Crea il piano personalizzato'} <ArrowRight size={15} className="inline ml-1"/></button></div>
        <p className="muted text-xs">I piani sono costruiti con esercizi e regole verificabili; non sono prescrizioni mediche né valutazioni automatiche delle tue capacità.</p>
      </div>}
    </form>}
    {profile&&!editing&&<>
      <section className="plan-summary-grid"><div className="panel plan-summary-card"><Clock3 size={19}/><strong>{profile.minutes} min</strong><span>tempo per allenamento</span></div><div className="panel plan-summary-card"><CalendarCheck2 size={19}/><strong>{profile.days_per_week}</strong><span>giorni nella settimana</span></div><div className="panel plan-summary-card"><Compass size={19}/><strong>{profile.confidence}/5</strong><span>fiducia iniziale dichiarata</span></div></section>
      <section className="panel plan-roadmap"><div className="flex justify-between items-start gap-3 flex-wrap mb-4"><div><p className="eyebrow mb-2">PROGRAMMA PERSONALIZZATO · 7 GIORNI</p><h2 className="text-xl font-bold">La tua settimana, un passo alla volta</h2><p className="muted text-sm mt-2">Dal {weekday(start)} · {focusOptions.find(x=>x.id===profile.focus)?.label} · fascia {moments.find(m=>m.id===profile.preferred_time)?.name.toLowerCase()}</p></div><span className="chip">{completed}/{scheduled.length} completati</span></div>
        <div className="plan-progress-track"><div style={{width:`${scheduled.length?completed/scheduled.length*100:0}%`}}/></div>
        <div className="plan-timeline">{scheduled.map(item=>{const log=logs.find(c=>c.day===item.day);const isToday=item.day===day;return <div className={'plan-timeline-item '+(isToday?'today':'')} key={item.day}><span className="plan-timeline-date">{weekday(item.day)}{isToday&&<em>oggi</em>}</span><span className={'plan-timeline-status '+(log?.outcome==='done'?'done':'')}>{log?.outcome==='done'?<CheckCircle2 size={18}/>:<span className="plan-dot"/>}</span><div><strong>{item.task.title}</strong><p className="muted text-xs">{Math.min(profile.minutes,item.task.minutes)} min · {log?(log.outcome==='done'?'Completato':log.outcome==='difficult'?'Troppo difficile':'Non oggi'):item.day<day?'Non registrato':isToday?'Da svolgere':'In programma'}</p></div></div>})}</div>
        <div className="plan-tip"><Lightbulb size={19}/><p>{planTip(profile)}</p></div>
        <div className="plan-action-bar"><div><strong>{next?(next.day===day?'Oggi tocca a te':`Prossimo allenamento: ${weekday(next.day)}`):'Sessioni della settimana pianificate'}</strong><p className="muted text-xs">{next?next.task.title:'Puoi fare una revisione e programmare il prossimo ciclo.'}</p></div><Link className="btn" href="/routine">Apri esercizio <ArrowRight size={15} className="inline ml-1"/></Link></div>
      </section>
      <section className="panel plan-review"><div className="flex justify-between items-center gap-3 flex-wrap"><div><p className="eyebrow mb-2">MEASURE + CONTROL</p><h2 className="text-xl font-bold">Revisione settimanale</h2><p className="muted text-sm mt-2">{sessionsLogged} sessioni registrate su {scheduled.length}. La valutazione è soggettiva e non misura da sola le competenze.</p></div><button className="btn-secondary" type="button" onClick={()=>setReviewOpen(v=>!v)}>{reviewOpen?'Chiudi':currentReview?'Modifica revisione':'Fai la revisione'} <RefreshCw size={15} className="inline ml-1"/></button></div>
        {currentReview&&!reviewOpen&&<div className="plan-reviewed"><CheckCircle2 size={19}/><div><strong>Revisione registrata · fiducia {currentReview.confidence}/5</strong><p>{currentReview.win||'Nessuna nota aggiuntiva'}</p></div></div>}
        {reviewOpen&&<form className="plan-review-form" onSubmit={submitReview}>
          <fieldset className="plan-field"><legend><strong>Quanta fiducia senti ora? (1–5)</strong></legend><div className="plan-rating mt-2">{[1,2,3,4,5].map(n=><button key={n} type="button" className={reviewConfidence===n?'active':''} aria-pressed={reviewConfidence===n} onClick={()=>setReviewConfidence(n)}>{n}</button>)}</div></fieldset>
          <label className="plan-field"><span>Che cosa ha funzionato?</span><textarea className="field" rows={2} maxLength={320} value={win} onChange={e=>setWin(e.target.value)} placeholder="Una cosa concreta, anche piccola"/></label>
          <label className="plan-field"><span>Che cosa ti ha ostacolato?</span><textarea className="field" rows={2} maxLength={320} value={reviewObstacle} onChange={e=>setReviewObstacle(e.target.value)} placeholder="Tempo, difficoltà, un evento imprevisto…"/></label>
          <label className="plan-field"><span>Che cosa vuoi modificare nel prossimo ciclo?</span><textarea className="field" rows={2} maxLength={320} value={adjustment} onChange={e=>setAdjustment(e.target.value)} placeholder="Ridurre la durata, cambiare fascia oraria, riprovare…"/></label>
          <button type="submit" className="btn" disabled={busy||disabled}>{busy?'Salvataggio…':'Salva revisione'}</button>
        </form>}
        {reviews.length>1&&<p className="muted text-xs mt-4">Ultima revisione precedente: {reviews.filter(x=>x.period_start!==start)[0]?.confidence??'—'}/5. Valori soggettivi, non punteggi di prestazione.</p>}
      </section>
      <section className="panel plan-outcome"><Flag size={22}/><div><h3 className="font-bold text-lg">Come saprai di essere migliorato?</h3><p className="mt-2">{profile.success_sign}</p><p className="muted text-xs mt-3">Verificalo con una prova concreta. Completare i check-in non garantisce il risultato.</p></div></section>
    </>}
    {!profile&&!editing&&!disabled&&<button className="btn" onClick={()=>setEditing(true)}>Configura questo piano</button>}
  </div>;
}
