'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Activity,Dumbbell,Clock3,ChartNoAxesCombined,Edit3,Trash2,Save,X} from 'lucide-react';
import {CoachCommitments} from '@/components/coach-commitments';
import {TrainingIntelligenceClient} from '@/components/training-intelligence-client';
import {ACTIVITIES,LABELS,estimateKcal,trainingSuggestion,type Activity as ActivityName} from '@/lib/training';
import {apiUrl} from '@/lib/config';

/** datetime-local is in the browser timezone; the API receives an offset-aware ISO timestamp. */
function localDateTime(date=new Date()){
 const two=(n:number)=>String(n).padStart(2,'0');
 return `${date.getFullYear()}-${two(date.getMonth()+1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}
function previousDay(){const d=new Date();d.setDate(d.getDate()-1);return localDateTime(d);}
function numOrNull(value:string):number|null{return value.trim()===''?null:Number(value);}
function filled(value:number|null|undefined){return value==null?'':String(value);}

type Workout={
 id:string;occurred_at:string;activity:ActivityName;duration_minutes:number;effort:number;
 distance_m:number|null;strokes:number|null;cadence_spm:number|null;
 estimated_kcal:number|null;machine_kcal:number|null;notes:string;
};

export function TrainingClient(){
 const [occurredAt,setOccurredAt]=useState('');
 const [activity,setActivity]=useState<ActivityName>('vogatore');
 const [minutes,setMinutes]=useState('20'),[effort,setEffort]=useState('5'),[kg,setKg]=useState('');
 const [distance,setDistance]=useState(''),[strokes,setStrokes]=useState(''),[cadence,setCadence]=useState('');
 const [machine,setMachine]=useState(''),[notes,setNotes]=useState('');
 const [energy,setEnergy]=useState(3),[sessions,setSessions]=useState<Workout[]>([]);
 const [saving,setSaving]=useState(false),[deleting,setDeleting]=useState('');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 const formRef=useRef<HTMLElement|null>(null);

 async function load(){
  const response=await fetch(apiUrl('/api/training'),{cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Diario non disponibile');
  setSessions(data.items??[]);
 }
 useEffect(()=>{
  setOccurredAt(localDateTime());
  void load().catch(e=>setError(e instanceof Error?e.message:'Connessione al diario non disponibile'));
 },[]);

 function resetForm(){
  setEditingId(null);setOccurredAt(localDateTime());setActivity('vogatore');setMinutes('20');setEffort('5');
  setKg('');setDistance('');setStrokes('');setCadence('');setMachine('');setNotes('');
 }
 function startEdit(s:Workout){
  if(saving||deleting)return;
  setError('');setSuccess('');setEditingId(s.id);
  setOccurredAt(localDateTime(new Date(s.occurred_at)));setActivity(s.activity);
  setMinutes(String(s.duration_minutes));setEffort(String(s.effort));
  setKg('');setDistance(filled(s.distance_m));setStrokes(filled(s.strokes));
  setCadence(filled(s.cadence_spm));setMachine(filled(s.machine_kcal));setNotes(s.notes||'');
  formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function cancelEdit(){resetForm();setError('');setSuccess('Modifica annullata. Nessun dato è stato cambiato.');}

 async function save(){
  setError('');setSuccess('');
  const parsedDate=new Date(occurredAt);
  if(!occurredAt||Number.isNaN(parsedDate.getTime())){setError('Seleziona una data e un’ora valide.');return;}
  if(parsedDate.getTime()>Date.now()+60000){setError('Non è possibile registrare allenamenti futuri.');return;}
  if(!Number.isFinite(Number(minutes))||Number(minutes)<1||Number(minutes)>600||!Number.isInteger(Number(effort))||Number(effort)<1||Number(effort)>10){
   setError('La durata deve essere tra 1 e 600 minuti e lo sforzo tra 1 e 10.');return;
  }
  setSaving(true);
  try{
   const payload={
    ...(editingId?{id:editingId}:{}),activity,occurred_at:parsedDate.toISOString(),
    duration_minutes:Number(minutes),effort:Number(effort),weight_kg:numOrNull(kg),
    distance_m:numOrNull(distance),strokes:activity==='vogatore'?numOrNull(strokes):null,
    cadence_spm:activity==='vogatore'?numOrNull(cadence):null,
    machine_kcal:numOrNull(machine),notes,details:{}
   };
   const response=await fetch(apiUrl('/api/training'),{
    method:editingId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Salvataggio non riuscito.');
   const modified=Boolean(editingId);
   await load();resetForm();
   window.dispatchEvent(new Event('evolve:workout-changed'));
   setSuccess(modified?'Allenamento modificato. Lo storico e i riepiloghi utilizzeranno i nuovi dati.':'Sessione salvata nel diario.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete.')}finally{setSaving(false);}
 }

 async function remove(s:Workout){
  if(saving||deleting)return;
  const when=new Date(s.occurred_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  if(!window.confirm(`Eliminare definitivamente «${LABELS[s.activity]??s.activity}» del ${when}?\n\nLa sessione sparirà dal diario e dai riepiloghi. Verranno rimossi anche i suoi collegamenti con Coach e obiettivi, senza cancellare gli impegni concordati.`))return;
  setDeleting(s.id);setError('');setSuccess('');
  try{
   const response=await fetch(apiUrl('/api/training'),{
    method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:s.id})
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Eliminazione non riuscita.');
   if(editingId===s.id)resetForm();
   await load();window.dispatchEvent(new Event('evolve:workout-changed'));
   setSuccess('Allenamento eliminato. Visione 360 e i collegamenti utilizzeranno lo storico aggiornato.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete.')}finally{setDeleting('');}
 }
 const kcal=kg&&Number(kg)>0&&Number(minutes)>0&&Number(effort)>=1&&Number(effort)<=10
  ?estimateKcal(activity,Number(minutes),Number(kg),Number(effort)):null;
 const tip=trainingSuggestion(activity,energy);
 const locked=saving||Boolean(deleting);
 return <div className="v1-stack">
  <div className="v1-heading"><div>
   <p className="eyebrow">Performance · Movimento</p><h1>Allenamento flessibile</h1>
   <p className="muted">Vogatore, kettlebell, camminata, sacco o qualsiasi attività. Registra, correggi e consulta quello che fai, senza duplicare le sessioni.</p>
  </div><Link className="btn-secondary" href="/giornata">Il piano di oggi →</Link></div>
  <TrainingIntelligenceClient mode="training"/>
  <CoachCommitments section="training"/>
  <section className="v1-grid3">
   {[
    {icon:Activity,label:'Sessioni nel diario',value:sessions.length},
    {icon:Clock3,label:'Minuti delle sessioni caricate',value:Math.round(sessions.reduce((n,s)=>n+Number(s.duration_minutes),0))},
    {icon:Dumbbell,label:'Attività differenti',value:new Set(sessions.map(s=>s.activity)).size}
   ].map(x=><article className="panel" key={x.label}><x.icon size={20}/><p className="muted v1-small">{x.label}</p><div className="v1-metric">{x.value}</div></article>)}
  </section>
  <section className="v1-grid2">
   <article className={'panel v1-training-editor'+(editingId?' is-editing':'')} ref={formRef}>
    <h2>{editingId?'1. Modifica allenamento':'1. Registra la sessione'}</h2>
    {editingId&&<div className="v1-edit-banner" role="status"><strong>Stai modificando una sessione esistente.</strong><span>Salvando aggiornerai la stessa registrazione, senza crearne una nuova.</span></div>}
    <div className="v1-safe" style={{marginTop:0}}>
     <label htmlFor="training-when">Quando hai svolto l’allenamento?</label>
     <input id="training-when" className="field" type="datetime-local" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/>
     <div className="v1-actions" style={{marginBottom:0}}>
      <button type="button" disabled={locked} className="btn-secondary" onClick={()=>setOccurredAt(localDateTime())}>Adesso</button>
      <button type="button" disabled={locked} className="btn-secondary" onClick={()=>setOccurredAt(previousDay())}>Ieri</button>
     </div><p>Puoi correggere anche data e ora. I collegamenti alla sessione seguiranno la nuova data.</p>
    </div>
    <div className="v1-grid2">
     <label>Attività<select className="field" disabled={locked} value={activity} onChange={e=>setActivity(e.target.value as ActivityName)}>{ACTIVITIES.map(x=><option key={x} value={x}>{LABELS[x]}</option>)}</select></label>
     <label>Durata (min)<input className="field" disabled={locked} type="number" min="1" max="600" step="0.5" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
     <label>Sforzo percepito (1-10)<input className="field" disabled={locked} type="number" min="1" max="10" step="1" value={effort} onChange={e=>setEffort(e.target.value)}/></label>
     <label>Peso corporeo (kg), facoltativo<input className="field" disabled={locked} type="number" min="25" max="350" step="0.1" value={kg} onChange={e=>setKg(e.target.value)} placeholder="Per ricalcolare kcal"/></label>
     <label>Distanza (m), facoltativo<input className="field" disabled={locked} type="number" min="0" value={distance} onChange={e=>setDistance(e.target.value)}/></label>
     <label>Calorie display, facoltative<input className="field" disabled={locked} type="number" min="0" value={machine} onChange={e=>setMachine(e.target.value)}/></label>
     {activity==='vogatore'&&<>
      <label>Vogate totali<input className="field" disabled={locked} type="number" min="0" value={strokes} onChange={e=>setStrokes(e.target.value)}/></label>
      <label>Vogate/min (SPM)<input className="field" disabled={locked} type="number" min="0" value={cadence} onChange={e=>setCadence(e.target.value)}/></label>
     </>}
    </div>
    <label>Note sulla sessione<textarea className="field" disabled={locked} rows={3} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Come è andata? Fastidi? Tecnica?"/></label>
    <div className="v1-safe"><strong>Stima energetica: {kcal??(editingId?'solo se inserisci il peso':'—')} {kcal===null?'':'kcal'}</strong>
     <p>{editingId?'Il vecchio peso non era salvato: per ricalcolare la stima, inseriscilo. Se cambi durata, attività o sforzo senza peso, la vecchia stima verrà azzerata.':'Stima approssimativa, solo se inserisci il peso. Le calorie del display vengono archiviate separatamente; non compensarle automaticamente con il cibo.'}</p>
    </div>
    <div className="v1-edit-actions">
     <button type="button" className="btn" disabled={locked||!occurredAt||!(Number(minutes)>0)} onClick={()=>void save()}>
      <Save size={16} style={{display:'inline',verticalAlign:'middle'}}/> {saving?'Salvataggio…':editingId?'Salva modifiche':'Salva allenamento'}
     </button>
     {editingId&&<button type="button" disabled={locked} className="btn-secondary" onClick={cancelEdit}><X size={16} style={{display:'inline',verticalAlign:'middle'}}/> Annulla modifica</button>}
    </div>
   </article>
   <article className="panel"><h2>2. Allenati con criterio</h2><p className="muted">Come ti senti oggi?</p>
    <div className="v1-actions">{[1,2,3,4,5].map(n=><button type="button" className={energy===n?'btn':'btn-secondary'} key={n} onClick={()=>setEnergy(n)}>{n}/5</button>)}</div>
    <div className="v1-safe"><strong>{tip.title}</strong><p>{tip.text}</p></div>
    <h3>Una progressione sostenibile</h3><ol className="v1-list">
     <li>Inizia con la tecnica e una durata che già tolleri.</li>
     <li>Registra durata, sforzo e sensazioni dopo ogni sessione.</li>
     <li>Aumenta una variabile per volta, soltanto se recuperi bene.</li>
     <li>Se compaiono dolore, vertigini o sintomi anomali interrompi e richiedi una valutazione.</li>
    </ol><p className="muted v1-small">Queste indicazioni non sostituiscono valutazioni professionali in presenza di condizioni mediche o limitazioni.</p>
   </article>
  </section>
  {(error||success)&&<section className="panel" aria-live="polite">{error&&<p role="alert" className="v1-error">{error}</p>}{success&&<p role="status" className="v1-success">{success}</p>}</section>}
  <section className="panel"><h2><ChartNoAxesCombined size={21}/> 3. Diario allenamenti</h2>
   <p className="muted v1-small">Puoi modificare o eliminare le sessioni già registrate. Il diario mostra fino alle 200 più recenti; gli allenamenti meno recenti non vengono cancellati.</p>
   {sessions.length===0?<p className="muted">Ancora nessuna sessione: salva il primo allenamento per iniziare lo storico.</p>:
    <div className="v1-table-wrap"><table className="v1-table">
     <thead><tr><th>Data</th><th>Attività</th><th>Durata</th><th>Sforzo</th><th>Kcal (stima / display)</th><th>Gestisci</th></tr></thead>
     <tbody>{sessions.map(s=><tr key={s.id}>
      <td>{new Date(s.occurred_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
      <td>{LABELS[s.activity]??s.activity}</td><td>{s.duration_minutes} min</td><td>{s.effort}/10</td>
      <td>{s.estimated_kcal??'—'} / {s.machine_kcal??'—'}</td>
      <td><div className="v1-workout-table-actions">
       <button type="button" className="btn-secondary" disabled={locked} onClick={()=>startEdit(s)} aria-label={`Modifica ${LABELS[s.activity]??s.activity} del ${new Date(s.occurred_at).toLocaleDateString('it-IT')}`}><Edit3 size={14} style={{display:'inline',verticalAlign:'middle'}}/> Modifica</button>
       <button type="button" className="delete-workout" disabled={locked} onClick={()=>void remove(s)} aria-label={`Elimina ${LABELS[s.activity]??s.activity} del ${new Date(s.occurred_at).toLocaleDateString('it-IT')}`}><Trash2 size={14} style={{display:'inline',verticalAlign:'middle'}}/> {deleting===s.id?'Elimino…':'Elimina'}</button>
      </div></td>
     </tr>)}</tbody>
    </table></div>}
  </section>
 </div>;
}
