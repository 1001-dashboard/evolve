'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Activity,ArrowRight,CheckCircle2,Clock3,Leaf,RefreshCcw,ShieldCheck,SlidersHorizontal,Sprout,Utensils,CalendarCheck2} from 'lucide-react';
import {BASE_PATH,apiUrl} from '@/lib/config';
import {createAgenda,type CompanionInput,type AgendaTask} from '@/lib/daily-companion';

type CompanionResponse={input:CompanionInput;notices:string[];error?:string};
const kindName:Record<string,string>={allenamento:'Movimento',alimentazione:'Pasti e spesa',routine:'Routine',azione:'Azione',scenario:'Scenario',percorso:'Percorso',focus:'Priorità settimanale'};
function ActivityIcon({kind}:{kind:string}){
 if(kind==='allenamento')return <Activity size={19} aria-hidden="true"/>;
 if(kind==='alimentazione')return <Utensils size={19} aria-hidden="true"/>;
 if(kind==='focus')return <CalendarCheck2 size={19} aria-hidden="true"/>;
 return <CheckCircle2 size={19} aria-hidden="true"/>;
}
export function DailyCompanionClient(){
 const [data,setData]=useState<CompanionResponse|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [minutesOverride,setMinutesOverride]=useState<number|null>(null),[lighter,setLighter]=useState(false);
 const load=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/companion'),{cache:'no-store'});
  const json=await response.json() as CompanionResponse;
  if(!response.ok)throw Error(json.error||'Il programma non è disponibile.');
  setData(json);
 },[]);
 useEffect(()=>{let mounted=true;
  fetch(apiUrl('/api/companion'),{cache:'no-store'}).then(async r=>{
   const json=await r.json() as CompanionResponse;
   if(!r.ok)throw Error(json.error||'Impossibile caricare Oggi.');
   if(mounted)setData(json);
  }).catch(e=>{if(mounted)setError(e instanceof Error?e.message:'Errore di rete.');}).finally(()=>{if(mounted)setLoading(false);});
  return()=>{mounted=false};
 },[]);
 const agenda=useMemo(()=>data?createAgenda(data.input,{minutes:minutesOverride??undefined,lowEnergy:lighter}):null,[data,minutesOverride,lighter]);
 async function mark(task:AgendaTask,outcome:'done'|'skipped'){
  if(!task.commitmentId||busy)return;
  setBusy(task.id);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/coach/plan'),{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:task.commitmentId,outcome,note:''})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Registrazione non riuscita.');
   await load();setNotice(outcome==='done'?'Attività completata e registrata nel Piano.':'Impegno segnato come «Non oggi». Non devi recuperarlo automaticamente.');
  }catch(e){setError(e instanceof Error?e.message:'Problema di connessione.');}
  finally{setBusy('');}
 }
 function refresh(){setLoading(true);setError('');setNotice('');load().catch(e=>setError(e instanceof Error?e.message:'Connessione non disponibile.')).finally(()=>setLoading(false));}
 return <section className="dc-root" aria-labelledby="dc-title">
  <header className="dc-intro">
   <div><p className="eyebrow">EVOLVE 1.7 · IL TUO COMPANION</p><h2 id="dc-title">Una giornata alla volta.</h2>
    <p>Le tue priorità concordate, organizzate intorno al tempo che hai. Nessuna modifica nascosta.</p></div>
   <button type="button" className="dc-refresh" onClick={refresh} disabled={loading||Boolean(busy)}><RefreshCcw size={17}/> Aggiorna</button>
  </header>
  {error&&<p className="dc-alert" role="alert">{error}</p>}
  {notice&&<p className="dc-success" role="status"><CheckCircle2 size={17}/>{notice}</p>}
  {loading&&!data&&<div className="dc-panel" role="status">Preparo la tua giornata dai dati salvati…</div>}
  {data&&agenda&&<>
   {!data.input.onboarded&&<aside className="dc-onboarding"><Sprout size={21}/><div><strong>Vuoi un percorso su misura?</strong><p>Puoi scegliere i tuoi obiettivi in pochi minuti. Non è obbligatorio.</p><a href={BASE_PATH+'/inizia'}>Personalizza Evolve <ArrowRight size={14}/></a></div></aside>}
   <div className="dc-grid-meta">
    <div><span>Tempo disponibile</span><strong>{agenda.minutesAvailable} min</strong></div>
    <div><span>Impegni già registrati oggi</span><strong>{agenda.done} fatti · {agenda.skipped} rimandati</strong></div>
   </div>
   <div className="dc-panel dc-controls">
    <div className="dc-section-caption"><SlidersHorizontal size={18}/><div><strong>Adatta la proposta di oggi</strong><small>Queste opzioni modificano solo ciò che vedi qui, non il piano concordato.</small></div></div>
    <div className="dc-time-options" role="group" aria-label="Tempo a disposizione oggi">
     {[5,10,15,30,60].map(v=><button type="button" key={v} aria-pressed={agenda.minutesAvailable===v} className={agenda.minutesAvailable===v?'active':''} onClick={()=>setMinutesOverride(v)}>{v} min</button>)}
    </div>
    <label className="dc-light-toggle"><input type="checkbox" checked={lighter} onChange={e=>setLighter(e.target.checked)}/><span>Giornata complicata: mostrami una sola priorità</span></label>
    {(minutesOverride!==null||lighter)&&<button type="button" className="dc-reset" onClick={()=>{setMinutesOverride(null);setLighter(false);}}>Ripristina il tempo del mio profilo</button>}
   </div>
   <div className="dc-task-header"><div><p className="eyebrow">COSA CONTA OGGI</p><h3>Le attività selezionate</h3></div><span>{agenda.tasks.length} in evidenza</span></div>
   {agenda.tasks.length===0?<div className="dc-panel dc-empty"><Leaf size={26}/><div><h4>Non serve riempire ogni giornata.</h4><p>{agenda.message}</p><a href={BASE_PATH+'/piano'}>Controlla il tuo piano <ArrowRight size={14}/></a></div></div>
    :<div className="dc-tasks">{agenda.tasks.map((t,i)=><article className="dc-task" key={t.id}>
      <div className="dc-task-top"><span className="dc-task-icon"><ActivityIcon kind={t.kind}/></span><span className="dc-task-kind">{t.source==='suggestion'?'Facoltativo':t.source==='focus'?'Priorità approvata':kindName[t.kind]||'Impegno approvato'}</span><span className="dc-task-duration"><Clock3 size={14}/>{t.minutes} min</span></div>
      <h4>{i===0&&t.source!=='suggestion'?'Parti da qui · ':''}{t.title}</h4><p className="dc-details">{t.details}</p>
      <p className="dc-why"><ShieldCheck size={15}/><span><strong>Perché:</strong> {t.why}</span></p>
      <div className="dc-task-actions">
       {t.canLog&&<><button type="button" className="dc-done" disabled={Boolean(busy)} onClick={()=>void mark(t,'done')}><CheckCircle2 size={16}/>{busy===t.id?'Salvo…':'Ho completato'}</button>
        <button type="button" className="dc-skip" disabled={Boolean(busy)} onClick={()=>void mark(t,'skipped')}>Non oggi</button></>}
       <a href={BASE_PATH+t.href}>{t.label} <ArrowRight size={14}/></a>
      </div>
     </article>)}</div>}
   <p className="dc-context" role="status">{agenda.message}</p>
   {data.input.support==='autonomo'?<p className="dc-subtle">Modalità Autonomo: solo impegni già concordati, nessuna nuova attività facoltativa.</p>:null}
   {data.notices.length>0&&<details className="dc-panel dc-notices"><summary>Alcuni dati non sono disponibili</summary>{data.notices.map((s,i)=><p key={i}>{s}</p>)}</details>}
   <div className="dc-links"><a href="#evolve-checkin">Come stai oggi? <ArrowRight size={14}/></a><a href={BASE_PATH+'/piano'}>Vedi tutti gli impegni <ArrowRight size={14}/></a><a href={BASE_PATH+'/adatta'}>Rivedi le difficoltà <ArrowRight size={14}/></a></div>
   <p className="dc-subtle">L'assenza di registrazioni non significa che tu non abbia svolto un'attività. Nessun recupero forzato e nessuna prescrizione medica o nutrizionale.</p>
  </>}
 </section>;
}
