'use client';
import {useCallback,useEffect,useState} from 'react';
import {Activity,ArrowRight,BarChart3,CheckCircle2,RefreshCcw,ShieldCheck,SlidersHorizontal} from 'lucide-react';
import {apiUrl,BASE_PATH} from '@/lib/config';
import {ACTIVITIES,LABELS,type Activity as ActivityName} from '@/lib/training';
import type {TrainingFocus,TrainingInsight,TrainingProfile} from '@/lib/training-intelligence';

type ResponseData={insight:TrainingInsight;goals:{id:string;title:string}[];
 trainingPriority:boolean;settingsAvailable:boolean;notices:string[];error?:string};
const focusLabel:Record<TrainingFocus,string>={
 continuita:'Costruire regolarità',resistenza:'Osservare la resistenza',tecnica:'Lavorare sulla tecnica',equilibrio:'Allenamento sostenibile'
};
const INITIAL:TrainingProfile={preferred_activity:'vogatore',focus:'continuita',target_sessions:2,preferred_minutes:20,goal_id:null};
const MINUTES=[5,10,15,20,25,30,40,45,60,75,90];
type Mode='training'|'today'|'vision';
function plural(n:number,one:string,many:string){return n===1?one:many;}

export function TrainingIntelligenceClient({mode}:{mode:Mode}){
 const [data,setData]=useState<ResponseData|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [form,setForm]=useState<TrainingProfile>(INITIAL);
 const reload=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/training/intelligence'),{cache:'no-store'});
  const json=await response.json() as ResponseData;
  if(!response.ok)throw Error(json.error||'Analisi allenamento non disponibile.');
  setData(json);
  if(json.insight.profile)setForm(json.insight.profile);
  return json;
 },[]);
 useEffect(()=>{let active=true;
  reload().catch(e=>{if(active)setError(e instanceof Error?e.message:'Connessione non disponibile')})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[reload]);
 // Refresh after a workout is added, changed, or removed on the Training page.
 useEffect(()=>{
  const handler=()=>{void reload().catch(e=>setError(e instanceof Error?e.message:'Ricaricamento non riuscito'))};
  window.addEventListener('evolve:workout-changed',handler);
  window.addEventListener('evolve:checkin-changed',handler);
  return()=>{window.removeEventListener('evolve:workout-changed',handler);window.removeEventListener('evolve:checkin-changed',handler);};
 },[reload]);
 async function save(e:React.FormEvent){e.preventDefault();if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/training/intelligence'),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Salvataggio non riuscito');
   setNotice(result.message??'Preferenze salvate.');await reload();
  }catch(e){setError(e instanceof Error?e.message:'Connessione non disponibile');}
  finally{setBusy(false)}
 }
 if(loading)return mode==='training'||mode==='today'?<section className="ti-panel" role="status">Analizzo gli allenamenti già registrati…</section>:null;
 if(!data)return mode==='training'||mode==='today'?<section className="ti-panel" role="alert">{error||'Analisi non disponibile. Il diario Allenamento continua a funzionare.'}</section>:null;
 const {insight:i}=data;
 const sessionsExist=i.period28.sessions>0;
 // 'Autonomo' suppresses unsolicited suggestions, NOT factual data the user recorded.
 if(mode==='today'&&!i.profile&&!sessionsExist&&!data.trainingPriority)return null;
 const showSuggestion=mode==='training'||(mode==='today'&&Boolean(i.profile));
 if(mode==='vision'&&!i.profile&&!sessionsExist)return null;
 return <section className={'ti-root ti-'+mode} aria-label="Analisi del percorso di allenamento">
   <header className="ti-head"><div><p className="eyebrow">EVOLVE · TRAINING INTELLIGENCE</p>
    <h2>{mode==='training'?'Il tuo allenamento diventa un percorso':mode==='today'?'Movimento: cosa emerge oggi':'Il tuo movimento nel percorso'}</h2>
    <p>{mode==='training'?'Usiamo le sessioni già salvate per proporre passi realistici. Non modifichiamo il Piano senza di te.':
      'La sintesi usa le sessioni registrate; le attività non registrate non vengono considerate assenti.'}</p>
   </div><button type="button" className="ti-refresh" disabled={busy} onClick={()=>void reload().catch(e=>setError(e.message))}>
    <RefreshCcw size={15}/> Aggiorna</button></header>
   {error&&<p className="ti-alert" role="alert">{error}</p>}
   {notice&&<p className="ti-success" role="status"><CheckCircle2 size={16}/>{notice}</p>}
   <div className="ti-metrics">
    <div><strong>{i.period7.sessions}</strong><span>{plural(i.period7.sessions,'sessione','sessioni')} negli ultimi 7 giorni</span></div>
    <div><strong>{i.period28.minutes}</strong><span>minuti registrati in 28 giorni</span></div>
    <div><strong>{i.profile?`${i.thisWeek.sessions}/${i.profile.target_sessions}`:'—'}</strong><span>sessioni questa settimana / obiettivo scelto</span></div>
   </div>
   {mode!=='today'&&<p className="ti-help">{i.period28.sessions} sessioni negli ultimi 28 giorni, distribuite su {i.period28.days} {plural(i.period28.days,'giorno','giorni')}. Sono dati osservati, non un voto sulla tua disciplina.</p>}
   {i.profile?.goal_id&&data.goals.some(g=>g.id===i.profile?.goal_id)&&<p className="ti-help">Obiettivo di Visione 360: <strong>{data.goals.find(g=>g.id===i.profile?.goal_id)?.title}</strong>. La tua scelta di riferimento è «{focusLabel[i.profile?.focus??'continuita']}».</p>}
   {showSuggestion&&<article className="ti-next">
    <div className="ti-heading"><Activity size={20}/><strong>{i.next.title}</strong></div>
    <p><b>Perché:</b> {i.next.reason}</p><p>{i.next.action}</p>
    {mode==='today'&&i.support_level==='autonomo'&&<p className="ti-help">Hai scelto tu la direzione di allenamento: questa è una possibilità facoltativa, non un nuovo impegno del Coach.</p>}
    {mode==='today'&&<a href={BASE_PATH+'/allenamento'} className="ti-link">Apri il tuo allenamento <ArrowRight size={16}/></a>}
   </article>}
   {mode==='today'&&!i.profile&&<article className="ti-next">
    <div className="ti-heading"><Activity size={20}/><strong>{sessionsExist?'Il tuo prossimo passo: dare una direzione allo storico':'Scegli da dove iniziare'}</strong></div>
    <p>{sessionsExist?`Hai già ${i.period28.sessions} ${plural(i.period28.sessions,'allenamento','allenamenti')} registrati: non ricominci da zero.`:'Nessun piano di allenamento è stato ancora concordato.'}</p>
    <p>Per ricevere un suggerimento basato sul tuo percorso scegli liberamente una frequenza e un’attività di riferimento. Nessun obbligo automatico.</p>
    <a href={BASE_PATH+'/allenamento'} className="ti-link">Configura il tuo percorso allenante <ArrowRight size={16}/></a>
   </article>}
   {(mode==='vision'||mode==='training'||mode==='today')?<article className="ti-review">
    <div className="ti-heading"><BarChart3 size={20}/><strong>{mode==='today'?'Cosa raccontano i tuoi allenamenti':'Revisione dei tuoi ultimi 7 giorni'}</strong></div>
    <p>{i.review}</p>
    {i.comparable&&<p className="ti-help">{i.comparable.detail}</p>}
    {i.topActivities.length>0&&<div className="ti-activities">{i.topActivities.map(a=><span key={a.activity}>{LABELS[a.activity as ActivityName]??a.activity}: {a.sessions} {plural(a.sessions,'sessione','sessioni')}</span>)}</div>}
    <p className="ti-help">Storico iniziale: {i.confidence==='initial'?'poche registrazioni':i.confidence==='developing'?'prime tendenze descrittive':'serie descrittiva più ampia'}. Evolve non deduce capacità fisiche, diagnosi né risultati non misurati.</p>
   </article>:null}
   {mode==='training'&&<form className="ti-form" onSubmit={e=>void save(e)}>
    <div className="ti-heading"><SlidersHorizontal size={20}/><strong>Imposta la tua direzione</strong></div>
    <p>Definisci una frequenza di riferimento, senza obblighi. La proposta di oggi userà queste scelte e il check-in quando disponibile.</p>
    <div className="ti-fields">
     <label>Attività preferita<select value={form.preferred_activity} onChange={e=>setForm(v=>({...v,preferred_activity:e.target.value}))}>
      {ACTIVITIES.map(a=><option key={a} value={a}>{LABELS[a]}</option>)}</select></label>
     <label>Obiettivo allenante<select value={form.focus} onChange={e=>setForm(v=>({...v,focus:e.target.value as TrainingFocus}))}>
      {(Object.keys(focusLabel) as TrainingFocus[]).map(a=><option key={a} value={a}>{focusLabel[a]}</option>)}</select></label>
     <label>Sessioni di riferimento a settimana<select value={form.target_sessions} onChange={e=>setForm(v=>({...v,target_sessions:Number(e.target.value)}))}>
      {[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
     <label>Durata di riferimento<select value={form.preferred_minutes} onChange={e=>setForm(v=>({...v,preferred_minutes:Number(e.target.value)}))}>
      {MINUTES.map(n=><option key={n} value={n}>{n} minuti</option>)}</select></label>
     <label className="ti-span">Collega a un obiettivo di Visione 360 (facoltativo)
      <select value={form.goal_id??''} onChange={e=>setForm(v=>({...v,goal_id:e.target.value||null}))}>
       <option value="">Nessun collegamento</option>
       {data.goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}
      </select></label>
    </div>
    <div className="ti-bottom"><button className="btn" type="submit" disabled={busy||!data.settingsAvailable}>
      {busy?'Salvo…':'Conferma la mia direzione'}</button>
     <span>Se non hai ancora un obiettivo, puoi <a href={BASE_PATH+'/visione'}>crearlo in Visione 360</a>.</span></div>
    <p className="ti-help"><ShieldCheck size={15}/> Salvare queste preferenze non cambia le sessioni già registrate, non crea nuovi impegni del Coach e non collega automaticamente gli allenamenti storici agli obiettivi.</p>
   </form>}
   {mode==='vision'&&<a href={BASE_PATH+'/allenamento'} className="ti-link">Apri la direzione di allenamento <ArrowRight size={16}/></a>}
   {(mode==='training'||mode==='today')&&data.notices.map(x=><p className="ti-alert" role="status" key={x}>{x}</p>)}
  </section>;
}
