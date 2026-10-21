'use client';
import {useCallback,useEffect,useState} from 'react';
import {Activity,ArrowRight,CheckCircle2,RefreshCcw,ShieldCheck,Sprout,TimerReset,Utensils} from 'lucide-react';
import {apiUrl,BASE_PATH} from '@/lib/config';
import type {AdaptiveSuggestion} from '@/lib/adaptive-engine';

type AdaptiveResponse={
 today:string;supportLevel:'guidato'|'essenziale'|'autonomo';
 metrics:{completed:number;skipped:number;observations:number;observedDays:number;checkins:number;lowEnergy:number;workouts:number;mealPlanSaved:boolean|null};
 suggestions:AdaptiveSuggestion[];notes:string[];note:string;
};
const categoryLabel:Record<AdaptiveSuggestion['category'],string>={
 routine:'ROUTINE',recupero:'BENESSERE',organizzazione:'ORGANIZZAZIONE',autonomia:'AUTONOMIA'
};

export function AdaptiveCoachClient(){
 const [data,setData]=useState<AdaptiveResponse|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/adaptive'),{cache:'no-store'});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Suggerimenti non disponibili');
  setData(result as AdaptiveResponse);
 },[]);
 useEffect(()=>{let active=true;(async()=>{try{await load()}catch(e){if(active)setError(e instanceof Error?e.message:'Problema di connessione')}finally{if(active)setLoading(false)}})();return()=>{active=false};},[load]);
 async function apply(s:AdaptiveSuggestion){
  if(s.action!=='shorten'||!s.commitment_id||s.original_minutes==null||s.proposed_minutes==null)return;
  if(!window.confirm(`Confermi di cambiare solo il tempo previsto da ${s.original_minutes} a ${s.proposed_minutes} minuti per «${s.title.replace(/^Rendi più semplice: /,'')}»?`))return;
  setBusy(s.id);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/adaptive'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'shorten',commitment_id:s.commitment_id,original_minutes:s.original_minutes,
      proposed_minutes:s.proposed_minutes,confirmed:true})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Modifica non riuscita');
   setNotice(result.message||'Modifica salvata.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete')}finally{setBusy('')}
 }
 return <div className="ad-wrap">
  <header className="ad-head"><p className="eyebrow">EVOLVE · COACH ADATTIVO</p>
   <h1>Impara da quello che succede.</h1>
   <p>Osserviamo gli esiti che hai registrato e prepariamo piccoli aggiustamenti. <strong>Non cambiamo nulla senza una tua scelta.</strong></p>
  </header>
  <div className="ad-links"><a href={BASE_PATH+'/giornata'}>← Torna a Oggi</a><a href={BASE_PATH+'/piano'}>Il mio piano <ArrowRight size={15}/></a></div>
  {error&&<p className="ad-alert" role="alert">{error}</p>}
  {notice&&<p className="ad-success" role="status"><CheckCircle2 size={16}/>{notice}</p>}
  {loading?<section className="ad-panel" role="status">Carico le osservazioni disponibili…</section>:null}
  {data&&<>
   <section className="ad-panel ad-overview" aria-labelledby="ad-overview-title">
    <div className="ad-section-top"><div><p className="eyebrow">ULTIMI 14 GIORNI</p><h2 id="ad-overview-title">Cosa risulta dal diario</h2></div><button className="ad-reload" type="button" onClick={()=>{setLoading(true);setError('');load().catch(e=>setError(e.message)).finally(()=>setLoading(false))}} disabled={loading||Boolean(busy)}><RefreshCcw size={16}/> Aggiorna</button></div>
    <div className="ad-stats">
     <div><CheckCircle2 size={19}/><span>Attività completate</span><strong>{data.metrics.completed}</strong></div>
     <div><TimerReset size={19}/><span>Rimandate</span><strong>{data.metrics.skipped}</strong></div>
     <div><Activity size={19}/><span>Sessioni nel diario</span><strong>{data.metrics.workouts}</strong></div>
     <div><Utensils size={19}/><span>Meal prep questa settimana</span><strong>{data.metrics.mealPlanSaved===null?'—':data.metrics.mealPlanSaved?'Salvato':'Non salvato'}</strong></div>
    </div>
    <p className="ad-help">Check-in negli ultimi sette giorni: {data.metrics.checkins}. I numeri descrivono soltanto ciò che hai registrato.</p>
   </section>
   <section className="ad-panel" aria-labelledby="ad-insights-title">
    <div className="ad-section-top"><div><p className="eyebrow">CONSIGLI BASATI SUI FATTI</p><h2 id="ad-insights-title">Cosa potresti modificare</h2></div><span className="ad-level">{data.supportLevel}</span></div>
    {data.supportLevel==='autonomo'?<div className="ad-empty"><Sprout size={23}/><p>Hai scelto la modalità Autonomo: Evolve non propone attività aggiuntive. Puoi sempre consultare il tuo Piano e cambiare livello quando vuoi.</p><a href={BASE_PATH+'/inizia'}>Gestisci il supporto <ArrowRight size={15}/></a></div>
    :data.suggestions.length===0?<div className="ad-empty"><ShieldCheck size={23}/><p>Non ci sono ancora osservazioni sufficienti per un suggerimento specifico. Non significa che devi fare di più. Continua a utilizzare Evolve solo quando ti è utile.</p><a href={BASE_PATH+'/piano'}>Rivedi il piano <ArrowRight size={15}/></a></div>
    :<div className="ad-list">{data.suggestions.map(s=><article className="ad-suggestion" key={s.id}>
      <p className="ad-category">{categoryLabel[s.category]}</p><h3>{s.title}</h3>
      <p className="ad-evidence"><strong>Perché te lo propongo:</strong> {s.evidence}</p>
      <p className="ad-proposal"><strong>Una possibilità:</strong> {s.proposed}</p>
      {s.action==='shorten'?<div className="ad-actions"><button type="button" className="btn" onClick={()=>void apply(s)} disabled={Boolean(busy)}>{busy===s.id?'Aggiorno…':`Conferma ${s.proposed_minutes} minuti`}</button><a href={BASE_PATH+'/piano'} className="btn-secondary">Lascio tutto com’è</a></div>
      :<div className="ad-actions"><a className="btn-secondary" href={BASE_PATH+(s.href||'/giornata')}>Vai allo strumento <ArrowRight size={15}/></a></div>}
     </article>)}</div>}
    <p className="ad-help">{data.note}</p>
   </section>
   <section className="ad-panel ad-autonomy"><Sprout size={24}/><div><h2>Il traguardo è la tua autonomia.</h2><p>Quando le tue abitudini diventano più stabili, puoi ridurre il supporto oppure interrompere i promemoria. Se serve, puoi sempre tornare a una modalità più guidata.</p><a href={BASE_PATH+'/inizia'}>Scegli il mio livello di supporto <ArrowRight size={15}/></a></div></section>
   {data.notes.length>0&&<section className="ad-panel" role="status"><h2>Informazioni non disponibili</h2>{data.notes.map(note=><p key={note}>{note}</p>)}</section>}
   <p className="ad-disclaimer">Evolve non è uno psicologo, medico o dietista. Queste osservazioni non sono diagnosi, prescrizioni, né valutazioni del tuo valore. In caso di difficoltà cliniche rivolgiti a un professionista.</p>
  </>}
 </div>;
}
