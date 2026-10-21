'use client';
import {useCallback,useEffect,useMemo,useState,type FormEvent} from 'react';
import {Activity,ArrowDownToLine,CalendarDays,CheckCircle2,ClipboardCheck,RefreshCcw,Trash2,TrendingUp,Utensils,Weight} from 'lucide-react';

type Summary={days:number;first:string;last:string;trainingSessions:number;trainingMinutes:number;trainingDays:number;coachDone:number;coachSkipped:number;checkinDays:number;avgEnergy:number|null;avgSleep:number|null;mealPlanWeeks:number;firstWeight:WeightEntry|null;lastWeight:WeightEntry|null;weightChange:number|null};
type WeightEntry={id:string;day:string;weight_kg:number;note:string};
type ResponseData={today:string;seven:Summary;thirty:Summary;observations:{weights:WeightEntry[];workouts:{day:string;minutes:number}[]};insights7:string[];insights30:string[];warning:string|null;weightWritable:boolean};
function niceDate(d:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return d;return `${d.slice(8,10)}/${d.slice(5,7)}`;}
function diffText(n:number|null){if(n===null)return 'Non ancora confrontabile';return `${n>0?'+':''}${n.toFixed(1).replace('.',',')} kg`;}
function Metric({icon:Icon,title,value,caption}:{icon:typeof Activity;title:string;value:string|number;caption:string}){
 return <div className="out-metric"><Icon size={20} aria-hidden="true"/><span>{title}</span><strong>{value}</strong><small>{caption}</small></div>;
}
export function Trends360Client(){
 const [data,setData]=useState<ResponseData|null>(null);
 const [range,setRange]=useState<7|30>(7);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [weight,setWeight]=useState('');
 const [when,setWhen]=useState('');
 const [note,setNote]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const response=await fetch('/evolve/api/andamento',{cache:'no-store'});const payload=await response.json();if(!response.ok)throw Error(payload.error||'Dati non disponibili');setData(payload);setWhen(v=>v||payload.today);}
  catch(e){setError(e instanceof Error?e.message:'Errore nel caricamento');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load()},[load]);
 const current=data?(range===7?data.seven:data.thirty):null;
 const insights=data?(range===7?data.insights7:data.insights30):[];
 const days=useMemo(()=>data?.observations.workouts.slice(-range)??[],[data,range]);
 const maxValue=Math.max(30,...days.map(d=>d.minutes));
 async function saveWeight(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setNotice('');setError('');setBusy(true);
  try{const kg=Number(weight.replace(',','.'));
   if(!Number.isFinite(kg)||kg<25||kg>450)throw Error('Inserisci un peso valido in chilogrammi.');
   const response=await fetch('/evolve/api/andamento',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day:when,weight_kg:kg,note})});
   const payload=await response.json();if(!response.ok)throw Error(payload.error||'Impossibile salvare');
   setWeight('');setNote('');setNotice('Pesata registrata. Il confronto usa soltanto le misure che inserisci.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Impossibile salvare');}finally{setBusy(false)}
 }
 async function removeWeight(entry:WeightEntry){
  if(!window.confirm(`Eliminare la pesata del ${entry.day}?`))return;
  setBusy(true);setNotice('');setError('');
  try{const response=await fetch('/evolve/api/andamento',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id})});const payload=await response.json();if(!response.ok)throw Error(payload.error||'Impossibile eliminare');setNotice('Pesata eliminata.');await load();}
  catch(e){setError(e instanceof Error?e.message:'Impossibile eliminare');}finally{setBusy(false)}
 }
 function exportCsv(){
  if(!data)return;
  const rows=['giorno;peso_kg;nota',...data.observations.weights.map(w=>`${w.day};${w.weight_kg};"${w.note.replaceAll('"','""')}"`)];
  const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='evolve-pesate.csv';link.click();URL.revokeObjectURL(url);
 }
 return <div className="out-stack">
  <div className="out-toolbar"><div className="out-switch" role="group" aria-label="Intervallo da osservare"><button type="button" className={range===7?'selected':''} aria-pressed={range===7} onClick={()=>setRange(7)}>7 giorni</button><button type="button" className={range===30?'selected':''} aria-pressed={range===30} onClick={()=>setRange(30)}>30 giorni</button></div><button className="out-refresh" onClick={()=>void load()} disabled={loading} type="button"><RefreshCcw size={16}/> Aggiorna</button></div>
  {error&&<p className="out-error" role="alert">{error}</p>}{notice&&<p className="out-success" role="status">{notice}</p>}
  {loading&&!data?<div className="out-card">Caricamento del tuo andamento…</div>:null}
  {data?.warning&&<p className="out-warn" role="status">{data.warning}</p>}
  {data&&current&&<>
   <div className="out-grid"><Metric icon={Activity} title="Movimento registrato" value={`${current.trainingMinutes} min`} caption={`${current.trainingSessions} sessioni · ${current.trainingDays} giorni`}/><Metric icon={CheckCircle2} title="Impegni del Coach" value={current.coachDone} caption={`${current.coachSkipped} rimandati`}/><Metric icon={ClipboardCheck} title="Check-in del benessere" value={`${current.checkinDays}/${range}`} caption={current.avgEnergy===null?'Energia: nessun dato':`Energia media riferita: ${current.avgEnergy}/5`}/><Metric icon={Utensils} title="Settimane meal prep" value={current.mealPlanWeeks} caption="Piani salvati, non pasti consumati"/></div>
   <div className="out-two"><section className="out-card"><div className="out-card-head"><div><p className="out-kicker">ATTIVITÀ FISICA</p><h2>Minuti registrati</h2></div><small>{niceDate(current.first)}–{niceDate(current.last)}</small></div><div className="out-bars" role="img" aria-label={`Minuti registrati giorno per giorno: ${days.map(d=>`${niceDate(d.day)} ${d.minutes} minuti`).join(', ')}`}>{days.map(d=><div key={d.day} className="out-bar-col" title={`${d.day}: ${d.minutes} min`}><div className="out-bar-fill" style={{height:`${Math.max(d.minutes>0?6:0,Math.round((d.minutes/maxValue)*100))}%`}}/><span>{range===7?niceDate(d.day):d.day.slice(8)}</span></div>)}</div><p className="out-footnote">I minuti derivano dal diario. Un giorno vuoto non significa necessariamente inattività.</p></section>
    <section className="out-card"><div className="out-card-head"><div><p className="out-kicker">RECUPERO E BENESSERE</p><h2>Come ti sei sentito</h2></div><CalendarDays size={21} aria-hidden="true"/></div><div className="out-wellbeing"><div><span>Energia media riferita</span><strong>{current.avgEnergy===null?'—':`${current.avgEnergy}/5`}</strong></div><div><span>Sonno medio registrato</span><strong>{current.avgSleep===null?'—':`${current.avgSleep} ore`}</strong></div><div><span>Giorni monitorati</span><strong>{current.checkinDays}</strong></div></div><p className="out-footnote">Sono registrazioni soggettive. Non costituiscono valutazioni o diagnosi di salute.</p></section></div>
   <section className="out-card"><div className="out-card-head"><div><p className="out-kicker">COACHING BASATO SUI FATTI</p><h2>Che cosa emerge</h2></div><TrendingUp size={22} aria-hidden="true"/></div><ul className="out-insights">{insights.map((text,i)=><li key={i}>{text}</li>)}</ul><p className="out-footnote">Osservazioni descrittive sui dati disponibili: non sono conclusioni sulle cause dei cambiamenti.</p></section>
   <section className="out-card"><div className="out-card-head"><div><p className="out-kicker">MONITORAGGIO FACOLTATIVO</p><h2>Andamento del peso</h2></div><Weight size={22} aria-hidden="true"/></div><div className="out-weight-top"><div><span>Ultima pesata del periodo</span><strong>{current.lastWeight?`${current.lastWeight.weight_kg.toFixed(1).replace('.',',')} kg`:'Nessuna pesata'}</strong></div><div><span>Prima → ultima</span><strong>{diffText(current.weightChange)}</strong></div></div><p className="out-footnote">Una pesata non basta a stabilire una tendenza. Nessuna compensazione automatica con le calorie dell'allenamento.</p>
    {data?.weightWritable?<form className="out-weight-form" onSubmit={saveWeight}><label>Data<input type="date" className="field" required value={when} max={data.today} onChange={e=>setWhen(e.target.value)}/></label><label>Peso (kg)<input type="number" className="field" required min="25" max="450" step="0.1" inputMode="decimal" placeholder="Es. 128,0" value={weight} onChange={e=>setWeight(e.target.value)}/></label><label className="out-note-input">Nota facoltativa<input type="text" className="field" maxLength={160} placeholder="Stesse condizioni della misurazione…" value={note} onChange={e=>setNote(e.target.value)}/></label><button className="btn" type="submit" disabled={busy}>Salva pesata</button></form>:<p className="out-error">Per salvare le pesate occorre eseguire la migrazione SQL della v1.4.</p>}
    <div className="out-weight-list-head"><h3>Ultime registrazioni</h3><button type="button" className="out-refresh" onClick={exportCsv} disabled={!data.observations.weights.length}><ArrowDownToLine size={16}/> Esporta CSV</button></div>
    {data.observations.weights.length?<div className="out-weight-list">{[...data.observations.weights].reverse().slice(0,10).map(w=><div key={w.id} className="out-weight-row"><span>{niceDate(w.day)}</span><strong>{w.weight_kg.toFixed(1).replace('.',',')} kg</strong><span className="out-note">{w.note}</span><button type="button" onClick={()=>void removeWeight(w)} disabled={busy} className="out-delete" aria-label={`Elimina pesata del ${w.day}`}><Trash2 size={16}/></button></div>)}</div>:<p className="out-empty">Non hai ancora inserito pesate. Puoi iniziare quando vuoi, senza obbligo di registrarle ogni giorno.</p>}
   </section>
  </>}
 </div>;
}
