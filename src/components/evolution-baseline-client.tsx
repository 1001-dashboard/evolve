'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,RefreshCcw,Scale} from 'lucide-react';
import {apiUrl,BASE_PATH} from '@/lib/config';
import {baselineFacts,weightLine,type Baseline} from '@/lib/evolution/baseline';
import {maintenanceEstimate,type MaintenanceParams} from '@/lib/nutrition-journal';

type Mode='full'|'today'|'vision';
const fmt=(n:number)=>n.toLocaleString('it-IT',{maximumFractionDigits:1});
export function EvolutionBaselineClient({mode}:{mode:Mode}){
 const [data,setData]=useState<Baseline|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[weight,setWeight]=useState('');
 const [equation,setEquation]=useState<MaintenanceParams['equation']|''>(''),[activity,setActivity]=useState<MaintenanceParams['activity']>('leggera');
 const refresh=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/evolution/baseline'),{cache:'no-store'});
  const json=await response.json() as Baseline&{error?:string};if(!response.ok)throw Error(json.error||'Dati iniziali non disponibili.');
  setData(json);return json;
 },[]);
 useEffect(()=>{let live=true;refresh().catch(e=>{if(live)setError(e instanceof Error?e.message:'Errore di connessione');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false};},[refresh]);
 useEffect(()=>{const handler=()=>void refresh().catch(()=>{});window.addEventListener('evolve:weight-changed',handler);return()=>window.removeEventListener('evolve:weight-changed',handler)},[refresh]);
 const f=useMemo(()=>data?baselineFacts(data):null,[data]);
 const chart=useMemo(()=>data?weightLine(data.entries):null,[data]);
 const maintenance=useMemo(()=>f?.age!=null&&f.latestWeight!=null&&data?.height_cm!=null&&equation
  ?maintenanceEstimate({age:f.age,heightCm:data.height_cm,weightKg:f.latestWeight,equation,activity}):null,[f,data,equation,activity]);
 async function saveWeight(e:React.FormEvent){e.preventDefault();if(!data||busy)return;
  const numeric=Number(weight);if(!Number.isFinite(numeric)||numeric<25||numeric>450){setError('Controlla il peso indicato.');return;}
  setBusy(true);setError('');setNotice('');try{
   const r=await fetch(apiUrl('/api/andamento'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day:data.today,weight_kg:numeric,note:''})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Non è stato possibile salvare la pesata.');
   await refresh();setWeight('');setNotice('Peso registrato nello storico già esistente.');
   window.dispatchEvent(new Event('evolve:weight-changed'));
  }catch(e){setError(e instanceof Error?e.message:'Salvataggio non riuscito.');}finally{setBusy(false)}
 }
 return <section className={'eb-card eb-'+mode} aria-label="Punto di partenza e progressi di peso">
  <header className="eb-heading"><div><p className="eyebrow">EVOLVE · PUNTO DI PARTENZA</p><h2>{mode==='today'?'Il tuo percorso, nel tempo':'Da dove parti e come cambia il percorso'}</h2>
   <p>Età, altezza, peso e storico provengono dal tuo profilo e dalle pesate già registrate.</p></div>
   {mode!=='today'&&<button className="eb-refresh" type="button" onClick={()=>void refresh().catch(e=>setError(e.message))}><RefreshCcw size={16}/> Aggiorna</button>}</header>
  {loading&&<p role="status">Recupero i dati già salvati…</p>}
  {error&&<p role="alert" className="eb-warning">{error}</p>}
  {notice&&<p role="status" className="eb-notice">{notice}</p>}
  {data&&f&&<>
   <div className="eb-metrics">
    <div><strong>{f.age??'—'}</strong><span>Età (anni)</span></div>
    <div><strong>{data.height_cm??'—'}</strong><span>Altezza (cm)</span></div>
    <div><strong>{f.latestWeight==null?'—':fmt(f.latestWeight)}</strong><span>Peso più recente (kg)</span></div>
    <div><strong>{f.bmi==null?'—':fmt(f.bmi)}</strong><span>BMI indicativo</span></div>
   </div>
   {(!f.hasProfile||f.latestWeight==null)&&<p className="eb-warning">Mancano dati di partenza. <a href={BASE_PATH+'/profilo'}>Completa data di nascita, altezza e peso nel profilo <ArrowRight size={14}/></a>. Non devi reinserire quelli già presenti.</p>}
   {f.bmiCategory&&mode!=='today'&&<p className="eb-muted">{f.bmiCategory}. Il BMI è una classificazione statistica, non indica da solo un peso sano o un obiettivo personale.</p>}
   {mode==='full'&&f.age!=null&&data.height_cm!=null&&f.latestWeight!=null&&<div className="eb-calculator">
    <strong>Stima informativa delle calorie di mantenimento</strong>
    <p className="eb-muted">Uso i dati del profilo: scegli solo la costante della formula e l'attività abituale. Questa NON è una prescrizione per dimagrire, né un riferimento salvato automaticamente.</p>
    <div className="eb-calculator-fields"><label>Costante biologica della formula<select value={equation} onChange={e=>setEquation(e.target.value as MaintenanceParams['equation']|'')}><option value="">Scegli</option><option value="plus5">Formula con +5</option><option value="minus161">Formula con −161</option></select></label>
    <label>Attività abituale<select value={activity} onChange={e=>setActivity(e.target.value as MaintenanceParams['activity'])}><option value="sedentaria">Prevalentemente sedentaria</option><option value="leggera">Leggermente attiva</option><option value="moderata">Moderatamente attiva</option></select></label></div>
    {maintenance&&<p className="eb-result">Stima teorica di mantenimento: <strong>{fmt(maintenance.low)}–{fmt(maintenance.high)} kcal/giorno</strong>. Il valore serve per orientarsi, non definisce un obiettivo dietetico. Eventuali bisogni clinici o post-bariatrici vanno valutati individualmente.</p>}
    </div>}
   {mode!=='today'&&<>
    {chart&&<div className="eb-chart" role="img" aria-label={`Andamento di ${data.entries.length} pesate, dalla prima ${fmt(data.entries[0].weight_kg)} kg all'ultima ${fmt(data.entries[data.entries.length-1].weight_kg)} kg`}>
     <svg viewBox="0 0 300 110" preserveAspectRatio="xMidYMid meet"><title>Andamento del peso</title><polyline points={chart.points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {chart.dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill="currentColor"><title>{p.label}</title></circle>)}</svg>
     <div className="eb-chart-labels"><span>{data.entries[0].day}</span><span>{data.entries[data.entries.length-1].day}</span></div>
    </div>}
    {f.netChangeKg!==null&&<p className="eb-muted">Variazione tra prima e ultima pesata disponibile: <strong>{f.netChangeKg>0?'+':''}{fmt(f.netChangeKg)} kg</strong>. Una variazione nel breve periodo non indica da sola progresso o regressione.</p>}
    {!chart&&<p className="eb-muted">Con almeno due pesate in giorni differenti vedrai qui un grafico reale del tuo andamento, senza risultati inventati.</p>}
   </>}
   {f.nextWeighIn?<div className="eb-reminder"><Scale size={18}/><span>{f.latestDay?`L'ultima pesata registrata è del ${f.latestDay}.`:'Non risultano pesate nello storico recente.'} Quando ti è comodo puoi aggiornare il peso; non serve farlo ogni giorno.</span></div>
    :mode!=='today'&&<p className="eb-muted">Ultima pesata del {f.latestDay}. Un aggiornamento settimanale è facoltativo, non un obbligo.</p>}
   {mode!=='vision'&&<form onSubmit={saveWeight} className="eb-form"><label>Registra una nuova pesata (kg)<input className="field" type="number" min="25" max="450" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Peso rilevato oggi"/></label>
    <button className="btn-secondary" disabled={busy||!weight} type="submit">{busy?'Salvo…':'Salva peso'}</button></form>}
   {mode==='vision'&&<a className="eb-link" href={BASE_PATH+'/progressi'}>Apri lo storico dettagliato <ArrowRight size={15}/></a>}
   {data.notices.map(note=><p className="eb-warning" key={note}>{note}</p>)}
  </>}
 </section>;
}
