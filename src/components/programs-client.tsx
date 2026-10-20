'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,BookOpenCheck,CheckCircle2,Clock3,Footprints,Languages,Pause,Play,Plus,ShieldAlert,Sparkles,Target,TrendingUp,Utensils,Workflow} from 'lucide-react';
import {alcoholNotice,categories,exerciseFor,isAlcohol,type Category,type Checkin,type Outcome,type Program} from '@/lib/programs';
import {apiUrl} from '@/lib/config';
import {countAnswered,formatGuidedNote,guideFor,requiredAnswers} from '@/lib/exercise-guide';
import {personalizedExercise,personalizedGuide,taskForDay,scheduleFor,type PlanProfile} from '@/lib/personal-plan';

const CalendarDaysIcon=()=> <Clock3 size={27} className="text-teal-700"/>;
type Props={programs:Program[];checkins:Checkin[];profiles:PlanProfile[];day:string;error:string|null;mode:'all'|'daily'};
const icons: Record<Category,typeof Footprints> = {benessere:Footprints,alcol:Utensils,lingue:Languages,lavoro:Workflow,cambiamento:TrendingUp,altro:Target};
const outcomes:Record<Outcome,string>={done:'Completato',difficult:'Troppo difficile',skipped:'Non oggi'};

export function ProgramsClient({programs,checkins,profiles,day,error,mode}:Props){
  const [category,setCategory]=useState<Category>('lingue');
  const [title,setTitle]=useState(categories.find(c=>c.id==='lingue')!.example);
  const [objective,setObjective]=useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [selected,setSelected]=useState<string|null>(programs.find(p=>p.status==='active')?.id??programs[0]?.id??null);
  const [note,setNote]=useState('');
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [shortVersion,setShortVersion]=useState(false);
  const [busy,setBusy]=useState(false);
  const [localError,setLocalError]=useState('');

  const active=programs.filter(p=>p.status==='active');
  const selectedProgram=mode==='daily'?(active.find(p=>p.id===selected)??active[0]):(programs.find(p=>p.id===selected)??active[0]??programs[0]);
  const sorted=mode==='daily'?[...active]:programs;
  const totalDone=checkins.filter(c=>c.outcome==='done').length;
  const doneByProgram=useMemo(()=>new Map(programs.map(p=>[p.id,checkins.filter(c=>c.program_id===p.id)])),[programs,checkins]);

  async function call(path:string,method:'POST'|'PATCH',body:object){
    setBusy(true);setLocalError('');
    try{
      const response=await fetch(apiUrl(path),{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Operazione non riuscita');
      // Una ricarica richiede a Supabase la versione effettivamente salvata, non una spunta provvisoria.
      window.location.reload();
    }catch(e){setLocalError(e instanceof Error?e.message:'Errore di rete');setBusy(false)}
  }
  function submitProgram(e:React.FormEvent){e.preventDefault();if(!title.trim())return;call('/api/programs','POST',{category,title,objective})}
  const currentLogs=selectedProgram?(doneByProgram.get(selectedProgram.id)??[]):[];
  const todayLog=currentLogs.find(c=>c.day===day);
  const currentProfile=profiles.find(p=>p.program_id===selectedProgram?.id);
  const personalTask=currentProfile?taskForDay(currentProfile,day,currentLogs):null;
  const upcomingTask=currentProfile?scheduleFor(currentProfile,day,currentLogs).find(x=>x.day>day):null;
  const currentExercise=selectedProgram?(currentProfile?(personalTask?personalizedExercise(personalTask,currentProfile):null):exerciseFor(selectedProgram,Math.max(0,currentLogs.length-(todayLog?1:0)))):null;
  const statusCount=active.filter(p=>checkins.some(c=>c.program_id===p.id&&c.day===day)).length;
  const guide = currentExercise && selectedProgram ? (personalTask&&currentProfile?personalizedGuide(personalTask,currentProfile):guideFor(currentExercise,selectedProgram.category)) : null;
  const filled=countAnswered(guide,answers);
  const needed=requiredAnswers(guide,shortVersion);
  const payloadNote=formatGuidedNote(guide,answers,note);
  function saveOutcome(outcome:Outcome){
    if(!selectedProgram||busy||!currentExercise)return;
    if(outcome==='done'&&!todayLog&&filled<needed){
      setLocalError(`Per completare l’esercizio, compila ${needed===1?'almeno un campo':`i ${needed} campi`}. Oppure scegli «Versione breve».`);
      document.getElementById('exercise-fields')?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if(payloadNote.length>500){setLocalError('Le risposte sono troppo lunghe per essere salvate. Accorciale un po’ (massimo 500 caratteri complessivi).');return;}
    // Editing a saved check-in with blank fields must never erase the earlier work.
    call('/api/programs/checkin','POST',{programId:selectedProgram.id,outcome,note:payloadNote||(todayLog?.note??'')});
  }

  return <div className="path-page space-y-6">
    <header className="path-header">
      <div><p className="eyebrow mb-2">EVOLVE · CHANGE ENGINE</p><h1 className="text-3xl md:text-4xl font-bold">{mode==='daily'?'Il tuo allenamento':'I tuoi percorsi'}</h1>
        <p className="muted mt-2">{mode==='daily'?'Un esercizio alla volta. Scegli, prova, registra, adatta.':'Trasforma un obiettivo complesso in pratica quotidiana sostenibile.'}</p></div>
      {mode==='all'?<button className="btn" type="button" onClick={()=>setShowCreate(s=>!s)}><Plus size={17} className="inline mr-1"/> Nuovo percorso</button>:<Link href="/percorsi" className="btn-secondary">Gestisci i percorsi <ArrowRight size={15} className="inline ml-1"/></Link>}
    </header>
    {(error||localError)&&<div role="alert" className="path-alert"><ShieldAlert size={19}/><span>{error||localError}</span></div>}

    {mode==='all'&&showCreate&&<section className="panel path-create" aria-label="Nuovo percorso">
      <div className="flex justify-between items-center gap-3 mb-4"><div><p className="eyebrow">DEFINE</p><h2 className="text-xl font-bold">Da dove vuoi iniziare?</h2></div><button type="button" className="btn-secondary" onClick={()=>setShowCreate(false)}>Chiudi</button></div>
      <div className="path-category-grid">
        {categories.map(c=>{const Icon=icons[c.id];return <button type="button" aria-pressed={category===c.id} className={'path-category '+(category===c.id?'active':'')} key={c.id} onClick={()=>{setCategory(c.id);setTitle(c.example)}}><Icon size={20}/><strong>{c.label}</strong><small>{c.intro}</small></button>})}
      </div>
      <form onSubmit={submitProgram} className="grid gap-3 mt-5">
        <label className="text-sm font-semibold">Il tuo obiettivo<input className="field mt-2" value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={120} required placeholder="Voglio riuscire a..."/></label>
        <label className="text-sm font-semibold">Da dove parti? (facoltativo)<textarea className="field mt-2" rows={2} maxLength={500} value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Un punto di partenza concreto, senza dati medici sensibili"/></label>
        {isAlcohol(category)&&<div className="path-caution"><ShieldAlert size={19}/><p>{alcoholNotice}</p></div>}
        <div className="flex flex-wrap gap-3 items-center"><button className="btn" disabled={busy}>{busy?'Salvataggio…':'Crea il mio percorso'}</button><span className="muted text-xs">Il primo esercizio sarà semplice. Potrai fermarti o mettere in pausa.</span></div>
      </form>
    </section>}

    {programs.length===0&&!error&&<section className="path-empty"><Target size={33}/><h2>Inizia da un solo obiettivo</h2><p>Il primo passo non è fare tutto. È scegliere una competenza o un’abitudine da allenare.</p><Link href="/percorsi" className="btn">{mode==='daily'?'Crea il primo percorso':'Vai ai percorsi'}</Link>{mode==='all'&&<button className="btn-secondary" onClick={()=>setShowCreate(true)}>Configura un obiettivo</button>}</section>}
    {programs.length>0&&<div className="path-content">
      <aside className="path-list" aria-label="Elenco percorsi"><h2 className="font-bold text-lg mb-3">{mode==='all'?'Percorsi':'Routine attive'}</h2>
        {sorted.map(p=>{const Icon=icons[p.category];const list=doneByProgram.get(p.id)??[];const todayCheck=list.find(x=>x.day===day);return <button type="button" key={p.id} onClick={()=>{setSelected(p.id);setNote('');setAnswers({});setShortVersion(false);setLocalError('')}} className={'path-list-item '+(selectedProgram?.id===p.id?'selected':'')}><div className="path-list-icon"><Icon size={20}/></div><div className="text-left min-w-0 flex-1"><strong>{p.title}</strong><small>Livello {p.level} / 4 · {list.filter(c=>c.outcome==='done').length} completati</small></div>{todayCheck?.outcome==='done'?<CheckCircle2 size={19} className="text-teal-700"/>:<ArrowUpRight size={17}/>}</button>})}
        {sorted.length===0&&<p className="muted text-sm">Nessun percorso attivo. Riattivane uno dalla sezione Percorsi.</p>}
      </aside>
      {selectedProgram&&<div className="space-y-4 min-w-0">
        <div className="plan-inline"><div><p className="eyebrow mb-1">IL TUO PIANO</p><strong>{currentProfile?'Allenamenti su misura dei tuoi vincoli':'Personalizza questo percorso'}</strong><p className="muted text-xs">{currentProfile?`${currentProfile.days_per_week} giorni a settimana · ${currentProfile.minutes} minuti`: 'Definisci priorità, tempo e risultato atteso in 2 minuti.'}</p></div><Link href={`/piano?program=${selectedProgram.id}`} className="btn-secondary">{currentProfile?'Apri il piano':'Personalizza'} <ArrowRight size={15} className="inline"/></Link></div>
        {currentExercise?<section className="path-workout">
          <div className="path-workout-top"><span className="path-tag"><Sparkles size={15}/> ESERCIZIO DI OGGI</span><span className="path-date">{new Date(day+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</span></div>
          <p className="eyebrow mt-6">{categories.find(c=>c.id===selectedProgram.category)?.label} · Livello {selectedProgram.level} di 4</p>
          <h2 className="path-workout-title">{currentExercise?.title}</h2>
          <p className="path-workout-desc">{currentExercise?.description}</p>
          <div className="path-understand"><span className="path-understand-num">1</span><p><strong>Il tuo compito:</strong> {guide?.intro}</p></div>
          <div className="flex flex-wrap gap-2 mt-5"><span className="path-pill"><Clock3 size={15}/>{currentExercise?.minutes} min circa</span><span className="path-pill"><Target size={15}/>Un solo passo oggi</span></div>
          {guide&&<div className="path-guide">
            <div className="path-guide-heading"><span className="path-guide-number">2</span><div><p className="eyebrow">COME SVOLGERLO</p><h3>Segui questi 3 passaggi</h3></div></div>
            <ol className="path-guide-steps">{guide.steps.map((step,index)=><li key={index}><span>{index+1}</span><p>{step}</p></li>)}</ol>
            {guide.example&&<details className="path-example"><summary>Mostrami un esempio pratico</summary><p>{guide.example}</p></details>}
            <div className="path-easier"><div><strong>Hai poco tempo o ti sembra troppo?</strong><p>{currentExercise?.fallback}</p></div><button type="button" aria-pressed={shortVersion} onClick={()=>{setShortVersion(v=>!v);setLocalError('')}} className={shortVersion?'path-easier-toggle active':'path-easier-toggle'}>{shortVersion?'Versione breve attiva':'Usa versione breve'}</button></div>
          </div>}
          <div className="path-verify"><BookOpenCheck size={19}/><span><strong>Come capisci se hai fatto il passo:</strong> {currentExercise?.verify}</span></div>
          {isAlcohol(selectedProgram.category)&&<div className="path-caution mt-5"><ShieldAlert size={18}/><p>{alcoholNotice}</p></div>}
          {todayLog?<div className="path-completed"><CheckCircle2 size={21}/><div><strong>Check-in registrato: {outcomes[todayLog.outcome]}</strong><p>Domani Evolve proporrà l’esercizio successivo. Puoi modificare la valutazione di oggi.</p></div></div>:null}
          {selectedProgram.status==='active'?<div className="path-actions" id="exercise-fields">
            <div className="path-guide-heading"><span className="path-guide-number">3</span><div><p className="eyebrow">METTILO IN PRATICA</p><h3>Registra quello che hai fatto</h3></div></div>
            {guide&&<p className="path-form-instruction">{guide.prompt}</p>}
            {localError&&<div className="path-inline-alert" role="alert">{localError}</div>}
            {guide&&guide.fields.length>0&&<div className="path-answer-grid">{guide.fields.map((field,index)=><label className="path-answer" key={field.label}><span>{field.label}{(needed===0||index>=needed)&&<small> · facoltativo</small>}</span><textarea className="field" rows={2} value={answers[field.label]??''} maxLength={field.maxLength??180} placeholder={field.placeholder} onChange={e=>{setAnswers(prev=>({...prev,[field.label]:e.target.value}));if(localError)setLocalError('')}}/></label>)}</div>}
            <label className="path-note-label">Una riflessione in più (facoltativa)<textarea className="field mt-2" rows={2} maxLength={160} value={note} onChange={e=>setNote(e.target.value)} placeholder="Cosa ha funzionato? Cosa vorresti rendere più facile?"/></label>
            <div className="path-result-footer"><div><strong>Hai provato l’esercizio?</strong><p>Scegli come è andata. Se non è riuscito, il percorso si adatta: non perdi i progressi.</p></div><small className={payloadNote.length>500?'path-over-limit':''}>{payloadNote.length}/500 caratteri salvabili</small></div>
            <div className="path-buttons"><button type="button" disabled={busy} onClick={()=>saveOutcome('done')} className="btn"><CheckCircle2 size={17} className="inline mr-2"/>{busy?'Salvataggio…':'Ho svolto l’esercizio'}</button><button type="button" disabled={busy} onClick={()=>saveOutcome('difficult')} className="btn-secondary">Troppo difficile</button><button type="button" disabled={busy} onClick={()=>saveOutcome('skipped')} className="btn-secondary">Non oggi</button></div>
          </div>:<div className="path-paused"><Pause size={18}/><span>Percorso {selectedProgram.status==='paused'?'in pausa':'completato'}.</span></div>}
        </section>:<section className="panel plan-rest"><CalendarDaysIcon/><h2 className="text-xl font-bold mt-2">Oggi è un giorno libero dal piano</h2><p className="muted mt-2">Non devi completare esercizi ogni giorno per progredire. {upcomingTask?`Il prossimo allenamento è previsto per ${upcomingTask.day}.`:'Il prossimo ciclo comincerà dopo questa settimana.'}</p><Link href={`/piano?program=${selectedProgram.id}`} className="btn-secondary inline-block mt-4">Rivedi la settimana <ArrowRight size={15} className="inline"/></Link></section>}
        <section className="panel">
          <div className="flex justify-between gap-4 flex-wrap"><div><p className="eyebrow mb-2">ADATTAMENTO</p><h3 className="text-xl font-bold">Il metodo è progressivo</h3></div><span className="chip">Livello {selectedProgram.level}/4</span></div>
          <div className="path-stages" aria-label="Livelli del percorso">{[1,2,3,4].map(l=><div key={l} className={'path-stage '+(selectedProgram.level>=l?'filled':'')}><span>{l}</span></div>)}</div>
          <p className="muted text-sm mt-3">Dopo tre esercizi completati consecutivamente allo stesso livello, il prossimo diventa più impegnativo. Due valutazioni «Troppo difficile» consecutive possono semplificarlo. Saltare un giorno non annulla il percorso.</p>
          {mode==='all'&&<div className="flex flex-wrap gap-2 mt-5">{selectedProgram.status==='active'?<button className="btn-secondary" disabled={busy} onClick={()=>call('/api/programs','PATCH',{id:selectedProgram.id,status:'paused'})}><Pause size={15} className="inline mr-1"/>Metti in pausa</button>:<button className="btn-secondary" disabled={busy} onClick={()=>call('/api/programs','PATCH',{id:selectedProgram.id,status:'active'})}><Play size={15} className="inline mr-1"/>Riattiva</button>}{selectedProgram.status==='active'&&<button className="btn-secondary" disabled={busy} onClick={()=>{if(window.confirm('Segnare questo percorso come completato?'))call('/api/programs','PATCH',{id:selectedProgram.id,status:'completed'})}}>Segna come concluso</button>}</div>}
        </section>
        <section className="panel"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-lg">Diario degli esercizi</h3><span className="muted text-xs">{currentLogs.length} check-in</span></div><div className="path-history">{currentLogs.slice(0,7).map(c=><div key={c.id} className="path-history-item"><span>{new Date(c.day+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}</span><strong>{outcomes[c.outcome]}</strong><span className="muted">{c.note||'Nessuna nota'}</span></div>)}{currentLogs.length===0&&<p className="muted text-sm py-3">Non hai ancora registrato esercizi. Il primo check-in sarà qui.</p>}</div></section>
      </div>}
    </div>}
    {programs.length>0&&<section className="path-summary path-summary-bottom" aria-label="Riepilogo progressi">
      <div className="path-stat"><span>Percorsi attivi</span><strong>{active.length}</strong><small>Il tuo impegno attuale</small></div>
      <div className="path-stat"><span>Allenamenti completati</span><strong>{totalDone}</strong><small>Risultati salvati</small></div>
      <div className="path-stat"><span>Check-in oggi</span><strong>{statusCount}<small>/{active.length}</small></strong><small>Inclusi esercizi da riprovare</small></div>
    </section>}
    <p className="notice">Evolve registra solo le azioni che confermi. Non formula diagnosi, non prescrive dimagrimenti o riduzioni di alcol e non garantisce risultati. L’allenamento può essere sospeso o adattato.</p>
  </div>
}
