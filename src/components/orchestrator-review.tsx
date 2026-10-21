'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,CheckCircle2,ClipboardCheck} from 'lucide-react';
import {apiUrl} from '@/lib/config';
import type {Suggestion} from '@/lib/orchestrator/core';

type Data={day:string;week:string;start:string;facts:{checkinDays:number;lowEnergyDays:number;workoutCount:number;workoutMinutes:number;coachDone:number;coachSkipped:number;plannedMeals:number|null};suggestions:Suggestion[];focus:null|{focus_id:string;title:string;action_text:string;minutes:number;review_note:string};notices:string[]};
export function OrchestratorReview(){
 const [data,setData]=useState<Data|null>(null),[selected,setSelected]=useState(''),[action,setAction]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=useCallback(async()=>{const r=await fetch(apiUrl('/api/orchestrator/overview'),{cache:'no-store'});const j:Data&{error?:string}=await r.json();if(!r.ok)throw Error(j.error||'Non disponibile');setData(j);return j;},[]);
 useEffect(()=>{let live=true;load().then(d=>{if(!live)return;const current=d.focus;const first=d.suggestions[0];const matched=d.suggestions.find(x=>x.id===current?.focus_id);setSelected(matched?.id||first?.id||'');setAction(matched?current?.action_text||matched.action:first?.action||'');setNote(current?.review_note||'');}).catch(e=>{if(live)setError(e.message)});return()=>{live=false};},[load]);
 function choose(id:string){setSelected(id);const s=data?.suggestions.find(x=>x.id===id);if(s)setAction(s.action);setSuccess('')}
 async function approve(){const s=data?.suggestions.find(x=>x.id===selected);if(!s){setError('Seleziona una proposta.');return;}setBusy(true);setError('');setSuccess('');try{const response=await fetch(apiUrl('/api/orchestrator/focus'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'approve',focus_id:s.id,title:s.title,action_text:action,minutes:s.minutes,review_note:note})});const j=await response.json();if(!response.ok)throw Error(j.error||'Salvataggio fallito');await load();setSuccess('Priorità approvata. Da oggi la trovi nella schermata Oggi.');}catch(e){setError(e instanceof Error?e.message:'Errore di connessione');}finally{setBusy(false)}}
 return <main className="orch-review">
  <Link className="orch-back" href="/giornata"><ArrowLeft size={17}/> Torna a Oggi</Link>
  <div className="orch-review-intro"><p className="orch-eyebrow">EVOLVE · MISURA → IMPARA → AGISCI</p><h1>La tua revisione settimanale</h1><p>Guarda i fatti che hai registrato. Scegli una sola modifica pratica. Il sistema non cambia automaticamente i tuoi obiettivi.</p></div>
  {!data?<p role="status">Caricamento dei dati…</p>:<>
   <div className="orch-stats" aria-label="Dati registrati questa settimana">
    <div className="orch-stat"><span>Check-in</span><strong>{data.facts.checkinDays}</strong><small>Giornate registrate su 7</small></div>
    <div className="orch-stat"><span>Attività fisica</span><strong>{data.facts.workoutCount}</strong><small>{Math.round(data.facts.workoutMinutes)} minuti nel diario</small></div>
    <div className="orch-stat"><span>Impegni Coach</span><strong>{data.facts.coachDone}</strong><small>{data.facts.coachSkipped} rimandati</small></div>
   </div>
   <div className="orch-review-grid">
    <section className="orch-panel"><h2>1. Valuta le proposte</h2><p className="orch-help">Basate solo sulle informazioni registrate. L'assenza di dati non significa che tu non abbia svolto un'attività.</p>
     <div className="orch-choices">{data.suggestions.map((s,i)=><label key={`${s.id}-${i}`} className={'orch-choice '+(selected===s.id?'selected':'')}><input type="radio" name="focus" value={s.id} checked={selected===s.id} onChange={()=>choose(s.id)}/><span><strong>{s.title}</strong><small>{s.reason}</small></span></label>)}</div>
     <div className="orch-help"><strong>Periodo:</strong> settimana del {data.week} (lunedì–domenica).</div>
    </section>
    <section className="orch-panel"><h2>2. Decidi cosa fare</h2><p className="orch-help">Modifica liberamente il testo prima di approvarlo. Deve essere una piccola azione osservabile.</p>
     <label className="orch-label">L'azione che voglio provare<textarea value={action} onChange={e=>setAction(e.target.value)} maxLength={260} rows={5} className="orch-input"/></label>
     <label className="orch-label">Che cosa ho notato questa settimana? (facoltativo)<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={600} rows={3} className="orch-input" placeholder="Cosa è stato semplice? Cosa mi ha rallentato?"/></label>
     <button type="button" className="orch-action orch-approve" disabled={busy||action.trim().length<8||!selected} onClick={approve}><ClipboardCheck size={18}/>{busy?'Salvataggio…':'Approva questa modifica'}</button>
     {error?<p role="alert" className="orch-error">{error}</p>:null}
     {success?<p role="status" className="orch-success"><CheckCircle2 size={17}/>{success}</p>:null}
     {data.focus?<p className="orch-current">Attualmente approvato: <strong>{data.focus.action_text}</strong></p>:null}
    </section>
   </div>
   {data.notices.length?<div role="status" className="orch-alert">{data.notices.map(x=><p key={x}>{x}</p>)}</div>:null}
   <p className="orch-disclaimer">Le proposte non sono diagnosi, diete o prescrizioni di allenamento. Se una riduzione dell'alcol potrebbe comportare astinenza, consulta un sanitario prima di cambiare rapidamente il consumo.</p>
  </>}
  {error&&!data?<p role="alert" className="orch-error">{error}</p>:null}
 </main>;
}
