'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Activity,ArrowRight,CalendarCheck,CheckCircle2,ClipboardList,RefreshCcw,Utensils} from 'lucide-react';
import {apiUrl} from '@/lib/config';

type Overview={day:string;week:string;guidance:{title:string;detail:string;href:string;label:string};facts:{checkinDays:number;workoutCount:number;workoutMinutes:number;plannedMeals:number|null;coachDone:number;coachSkipped:number};today:{energy:number|null;coachDue:number;coachDone:number;workoutToday:boolean;mealSaved:boolean};focus:null|{week_start:string;title:string;action_text:string;minutes:number};focusLogs:{day:string;outcome:'done'|'skipped'}[];notices:string[]};
export function OrchestratorOverview(){
 const [data,setData]=useState<Overview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[proof,setProof]=useState(''),[loading,setLoading]=useState(true);
 const reload=useCallback(async()=>{const r=await fetch(apiUrl('/api/orchestrator/overview'),{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Riepilogo non disponibile');setData(j);},[]);
 useEffect(()=>{let live=true;fetch(apiUrl('/api/orchestrator/overview'),{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||'Riepilogo non disponibile');if(live)setData(j)}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false};},[]);
 async function mark(outcome:'done'|'skipped'){
  setBusy(true);setError('');try{const r=await fetch(apiUrl('/api/orchestrator/focus'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'mark',outcome,note:proof.trim()})});const j=await r.json();if(!r.ok)throw Error(j.error||'Salvataggio non riuscito');await reload();setProof('');}catch(e){setError(e instanceof Error?e.message:'Errore di connessione');}finally{setBusy(false)}
 }
 return <section className="orch-panel" aria-labelledby="orch-title">
  <header className="orch-head"><div><p className="orch-eyebrow">EVOLVE · IL QUADRO COMPLETO</p><h2 id="orch-title">Prima di tutto, la tua giornata</h2><p>Allenamento, pasti e impegni: qui trovi i dati già registrati, non un punteggio inventato.</p></div><Link className="orch-link" href="/revisione">Revisione settimana <ArrowRight size={16}/></Link></header>
  {loading?<p role="status">Carico il tuo riepilogo…</p>:null}
  {error?<p role="alert" className="orch-error">{error} <button type="button" onClick={()=>{setLoading(true);reload().catch(e=>setError(e.message)).finally(()=>setLoading(false))}}>Riprova</button></p>:null}
  {data?<>
   <div className="orch-stats">
    <Link href="/piano" className="orch-stat"><CalendarCheck size={21}/><span>Impegni del Coach oggi</span><strong>{data.today.coachDone} / {data.today.coachDue}</strong><small>Esiti registrati · <span>Apri il piano →</span></small></Link>
    <Link href="/allenamento" className="orch-stat"><Activity size={21}/><span>Allenamenti negli ultimi 7 giorni</span><strong>{data.facts.workoutCount}</strong><small>{Math.round(data.facts.workoutMinutes)} min registrati · <span>Diario →</span></small></Link>
    <Link href="/mealprep" className="orch-stat"><Utensils size={21}/><span>Pranzi organizzati questa settimana</span><strong>{data.facts.plannedMeals===null?'—':data.facts.plannedMeals}</strong><small>{data.today.mealSaved?'Piano salvato':'Non risulta un piano salvato'} · <span>Meal prep →</span></small></Link>
   </div>
   <div className="orch-guidance"><div><p className="orch-eyebrow">INDICAZIONE PER OGGI</p><strong>{data.guidance.title}</strong><p>{data.guidance.detail}</p></div><Link href={data.guidance.href} className="orch-link">{data.guidance.label} <ArrowRight size={16}/></Link></div>
   <div className="orch-focus">
    <div><p className="orch-eyebrow">LA TUA PRIORITÀ SETTIMANALE</p>{data.focus?<><h3>{data.focus.title}</h3><p>{data.focus.action_text}</p><small>{data.focus.minutes} minuti · Scelta e approvata da te</small></>:<><h3>Una priorità, non dieci</h3><p>Esamina i dati della settimana e approva una singola azione da ripetere. Nessuna modifica è automatica.</p></>}</div>
    <div className="orch-focus-controls">{data.focus?(data.focusLogs.some(x=>x.day===data.day)?<span className="orch-done"><CheckCircle2 size={17}/> {data.focusLogs.find(x=>x.day===data.day)?.outcome==='done'?'Fatto oggi':'Rimandato oggi'}</span>:<><label className="orch-proof-label">Cosa hai fatto oggi? <input className="orch-proof" maxLength={260} value={proof} onChange={e=>setProof(e.target.value)} placeholder="Una riga concreta"/></label><button type="button" disabled={busy||proof.trim().length<3} onClick={()=>mark('done')} className="orch-action">Fatto oggi</button><button type="button" disabled={busy} onClick={()=>mark('skipped')} className="orch-secondary">Non oggi</button></>):<Link className="orch-action" href="/revisione">Scegli la priorità</Link>}</div>
   </div>
   <div className="orch-tail"><span><ClipboardList size={17}/> Check-in ultimi 7 giorni: {data.facts.checkinDays}/7</span><Link href="/profilo">Aggiorna il profilo <ArrowRight size={14}/></Link></div>
   {data.notices.length>0?<div className="orch-alert" role="status">{data.notices.map(n=><p key={n}>{n}</p>)}</div>:null}
  </>:null}
 </section>;
}
