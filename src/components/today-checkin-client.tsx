'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,RefreshCcw} from 'lucide-react';
import {apiUrl} from '@/lib/config';

type Checkin={day:string;energy:number;mood:number;sleep_hours:number|null;available_minutes:number;note:string}|null;
type ResponseData={todayCheckin?:Checkin;error?:string};
const TIMES=[5,10,15,20,30,45,60] as const;

/** Edits the SAME evolve_daily_states record as the original Today check-in.
 * Never fills unseen fields with guessed defaults when loading fails. */
export function TodayCheckinClient(){
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [ready,setReady]=useState(false);
 const [energy,setEnergy]=useState<number|null>(null),[mood,setMood]=useState<number|null>(null),[minutes,setMinutes]=useState<number>(15);
 const [sleep,setSleep]=useState(''),[note,setNote]=useState('');
 useEffect(()=>{let active=true;
  fetch(apiUrl('/api/training/intelligence'),{cache:'no-store'}).then(async r=>{
   const d=await r.json() as ResponseData;
   if(!r.ok)throw Error(d.error||'Check-in non disponibile.');
   if(!Object.prototype.hasOwnProperty.call(d,'todayCheckin'))throw Error('Aggiorna il codice di Evolve: manca il check-in condiviso.');
   if(!active)return;
   const state=d.todayCheckin;
   if(state){setEnergy(state.energy);setMood(state.mood);setMinutes(state.available_minutes);
    setSleep(state.sleep_hours===null?'':String(state.sleep_hours));setNote(state.note??'');}
   setReady(true);
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:'Connessione non disponibile.');})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false};
 },[]);
 async function save(e:React.FormEvent){e.preventDefault();if(saving||!ready||energy===null||mood===null)return;
  setError('');setNotice('');setSaving(true);
  try{
   const response=await fetch(apiUrl('/api/life/checkin'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({energy,mood,available_minutes:minutes,sleep_hours:sleep===''?null:Number(sleep),note})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Salvataggio non riuscito.');
   setNotice('Check-in salvato. Il suggerimento di allenamento si aggiorna con tempo ed energia di oggi.');
   window.dispatchEvent(new Event('evolve:checkin-changed'));
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete.');}
  finally{setSaving(false);}
 }
 return <section className="tc-root" aria-label="Check-in rapido della giornata">
  <div className="tc-heading"><div><p className="eyebrow">PRIMA DI DECIDERE · 30 SECONDI</p><h2>Quanto tempo ed energia hai oggi?</h2>
   <p>Queste informazioni aggiornano la proposta di movimento. Il diario e il Piano restano invariati.</p></div>
   {ready&&<span className="tc-status">{notice?<CheckCircle2 size={16}/>:null}{notice?'Aggiornato':'Facoltativo'}</span>}
  </div>
  {loading?<p role="status">Recupero il check-in di oggi…</p>:null}
  {error?<p role="alert" className="tc-alert">{error}</p>:null}
  {ready&&<form onSubmit={save}>
   <div className="tc-fields"><fieldset><legend>Energia percepita</legend><div className="tc-scale">
    {[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={energy===n} className={energy===n?'selected':''} onClick={()=>setEnergy(n)}>{n}</button>)}
   </div><small>1 = bassa, 5 = alta</small></fieldset>
   <fieldset><legend>Umore percepito</legend><div className="tc-scale">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={mood===n} className={mood===n?'selected':''} onClick={()=>setMood(n)}>{n}</button>)}</div><small>1 = basso, 5 = buono</small></fieldset>
   <label className="tc-time">Tempo disponibile oggi
    <select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>
     {TIMES.map(n=><option key={n} value={n}>{n} minuti</option>)}
    </select></label></div>
   <details className="tc-extra"><summary>Sonno e ostacoli (facoltativi)</summary>
    <div className="tc-fields"><label className="tc-time">Sonno, ore <input type="number" min="0" max="16" step="0.5" value={sleep} onChange={e=>setSleep(e.target.value)}/></label>
    </div><label className="tc-note">Ostacolo di oggi <textarea maxLength={350} rows={2} value={note} onChange={e=>setNote(e.target.value)}/></label>
   </details>
   <div className="tc-actions">{(energy===null||mood===null)&&<small>Se vuoi salvare, scegli energia e umore. Non vengono dedotti automaticamente.</small>}<button className="btn" type="submit" disabled={saving||energy===null||mood===null}>{saving?'Salvo…':'Salva e aggiorna la giornata'}</button>
    {notice&&<p role="status" className="tc-confirmed"><CheckCircle2 size={17}/>{notice}</p>}</div>
  </form>}
 </section>;
}
