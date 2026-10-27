'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,CheckCircle2,ChevronDown,ClipboardList,Heart,Lightbulb,Pencil,RefreshCcw,Save,Trash2} from 'lucide-react';
import {apiUrl,BASE_PATH} from '@/lib/config';
import {beerKcal,summarizeBeer,hungerSuggestions,maintenanceEstimate,romeDate,summarizeFood,
 type CalorieSource,type FoodEntry,type FoodSettings,type MaintenanceParams,type MealType} from '@/lib/nutrition-journal';

type Payload={today:string;items:FoodEntry[];settings:FoodSettings;movement?:{sessions7:number;minutes7:number;sessionsToday:number;minutesToday:number}|null;checkin?:{energy:number;available_minutes:number}|null;notices?:string[];error?:string};
type Mode='full'|'today'|'vision'|'training'|'diary';
const MEALS:[MealType,string][]=[['colazione','Colazione'],['pranzo','Pranzo'],['cena','Cena'],['spuntino','Spuntino'],['altro','Altro']];
const initialSettings:FoodSettings={daily_reference_kcal:null,avoided_foods:''};
const samplePrefs:MaintenanceParams={age:0,heightCm:0,weightKg:0,equation:'plus5',activity:'leggera'};
const format=(n:number)=>Math.round(n).toLocaleString('it-IT');
const currentLocal=()=>{const d=new Date(),pad=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const toLocal=(iso:string)=>{const d=new Date(iso);if(Number.isNaN(d.getTime()))return currentLocal();const p=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;};
function safeNumber(value:string){if(value.trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;}
function initialMeal(){return{eatenAt:'',mealType:'pranzo' as MealType,description:'',kcal:'',low:null as number|null,high:null as number|null,source:'non_disponibile' as CalorieSource,note:''};}
export function NutritionJournalClient({mode}:{mode:Mode}){
 const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [settings,setSettings]=useState<FoodSettings>(initialSettings),[meal,setMeal]=useState(initialMeal);
 const [editingId,setEditingId]=useState<string|null>(null),[consent,setConsent]=useState(false),[estimating,setEstimating]=useState(false);
 const [aiMessage,setAiMessage]=useState(''),[hunger,setHunger]=useState(false),[calculation,setCalculation]=useState(false);
 const [beerRate,setBeerRate]=useState('43'),[beerLabel,setBeerLabel]=useState(false);
 const [numbers,setNumbers]=useState<MaintenanceParams>(samplePrefs),[calculationResult,setCalculationResult]=useState<ReturnType<typeof maintenanceEstimate>>(null);
 const load=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/nutrition/journal'),{cache:'no-store'});
  const json=await response.json() as Payload;
  if(!response.ok)throw Error(json.error||'Diario alimentare non disponibile.');
  setData(json);setSettings(json.settings);return json;
 },[]);
 useEffect(()=>{let current=true;setMeal(v=>({...v,eatenAt:currentLocal()}));
  load().catch(e=>{if(current)setError(e instanceof Error?e.message:'Errore di connessione')})
   .finally(()=>{if(current)setLoading(false)});
  return()=>{current=false};
 },[load]);
 const summary=useMemo(()=>data?summarizeFood(data.items,data.today,data.settings.daily_reference_kcal):null,[data]);
 const todayEntries=useMemo(()=>data?.items.filter(e=>romeDate(e.eaten_at)===data.today)??[],[data]);
 const editingBeer=Boolean(editingId&&data?.items.find(e=>e.id===editingId)?.entry_kind==='beer');
 const beerToday=useMemo(()=>data?summarizeBeer(data.items,data.today):{count:0,kcalKnown:0},[data]);
 const hourInRome=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 // Refresh the cross-domain snapshot when a session is edited or deleted on this same page.
 useEffect(()=>{const refresh=()=>{void load().catch(e=>setError(e instanceof Error?e.message:'Riepilogo non disponibile'));};
  window.addEventListener('evolve:workout-changed',refresh);
  window.addEventListener('evolve:checkin-changed',refresh);
  return()=>{window.removeEventListener('evolve:workout-changed',refresh);window.removeEventListener('evolve:checkin-changed',refresh);};
 },[load]);
 const reset=()=>{setMeal(initialMeal());setEditingId(null);setAiMessage('');};
 const setDescription=(description:string)=>{setMeal(v=>({...v,description,kcal:'',low:null,high:null,source:'non_disponibile'}));setAiMessage('');};
 const setKcal=(kcal:string)=>setMeal(v=>({...v,kcal,low:null,high:null,source:kcal.trim()? 'stima_personale':'non_disponibile'}));
 async function calculateKcal(){
  if(!consent){setError('Per usare la stima AI devi autorizzare l’invio di questa descrizione.');return;}
  if(meal.description.trim().length<3){setError('Descrivi ciò che hai mangiato.');return;}
  setEstimating(true);setError('');setAiMessage('');
  try{
   const response=await fetch(apiUrl('/api/nutrition/estimate'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({description:meal.description,consent:true})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Stima non riuscita.');
   const e=json.estimate as {low:number;high:number;midpoint:number;explanation:string;question:string};
   setMeal(v=>({...v,kcal:String(e.midpoint),low:e.low,high:e.high,source:'ai_stima'}));
   setAiMessage(`Intervallo orientativo: ${format(e.low)}–${format(e.high)} kcal. ${e.explanation}${e.question?' Per migliorare la stima: '+e.question:''} Puoi correggere il valore prima di salvare.`);
  }catch(e){setError(e instanceof Error?e.message:'Stima AI non disponibile. Puoi registrare il pasto senza calorie.');}
  finally{setEstimating(false)}
 }
 async function saveMeal(e:React.FormEvent){e.preventDefault();if(busy)return;
  const parsedDate=new Date(meal.eatenAt);if(Number.isNaN(parsedDate.getTime())){setError('Data o ora non valida.');return;}
  const kcal=safeNumber(meal.kcal);
  if(meal.kcal.trim()&& (kcal==null||kcal<0||kcal>4000)){setError('Le kcal devono essere tra 0 e 4000.');return;}
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/nutrition/journal'),{method:editingId?'PATCH':'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...(editingId?{id:editingId}:{}),eaten_at:parsedDate.toISOString(),meal_type:meal.mealType,
     description:meal.description.trim(),kcal,kcal_low:kcal==null?null:meal.low,kcal_high:kcal==null?null:meal.high,
     calorie_source:kcal==null?'non_disponibile':meal.source,note:meal.note.trim()})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Non è stato possibile salvare.');
   await load();window.dispatchEvent(new Event('evolve:food-changed'));reset();setNotice(editingId?'Pasto aggiornato e riepiloghi ricalcolati.':'Pasto registrato. Il riepilogo si aggiorna senza duplicazioni.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di salvataggio');}finally{setBusy(false)}
 }
 function editEntry(e:FoodEntry){setEditingId(e.id);setMeal({eatenAt:toLocal(e.eaten_at),mealType:e.meal_type,
  description:e.description,kcal:e.kcal==null?'':String(e.kcal),low:e.kcal_low,high:e.kcal_high,
  source:e.calorie_source,note:e.note});setError('');setAiMessage('');
  document.getElementById('evolve-nutrition-form')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 async function deleteEntry(entry:FoodEntry){
  if(busy||!window.confirm(`Eliminare definitivamente il pasto «${entry.description.slice(0,70)}»?`))return;
  setBusy(true);setError('');
  try{
   const response=await fetch(apiUrl('/api/nutrition/journal'),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Eliminazione non riuscita.');
   if(editingId===entry.id)reset();await load();window.dispatchEvent(new Event('evolve:food-changed'));setNotice('Pasto eliminato; i riepiloghi ora escludono questa registrazione.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di eliminazione');}finally{setBusy(false)}
 }
 async function addBeer(volumeMl:500|660){
  if(busy||estimating)return;
  const rate=Number(beerRate);
  if(!Number.isFinite(rate)||rate<15||rate>120){setError('Inserisci un valore plausibile tra 15 e 120 kcal per 100 ml, oppure usa quello in etichetta.');return;}
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/nutrition/beer'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({volume_ml:volumeMl,kcal_per_100ml:rate,label_verified:beerLabel})});
   const result=await response.json() as {error?:string;kcal?:number};
   if(!response.ok)throw Error(result.error||'Registrazione non riuscita.');
   await load();window.dispatchEvent(new Event('evolve:food-changed'));
   setNotice(`Birra da ${volumeMl/10} cl registrata: circa ${result.kcal} kcal incluse nel totale di oggi. Puoi modificarla o eliminarla nel diario.`);
  }catch(e){setError(e instanceof Error?e.message:'Errore durante la registrazione');}
  finally{setBusy(false);}
 }
 async function saveSettings(e:React.FormEvent){e.preventDefault();if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/nutrition/journal'),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Preferenze non salvate.');
   await load();setNotice('Riferimento e preferenze aggiornati. Nessun obiettivo dietetico è stato impostato automaticamente.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di salvataggio')}finally{setBusy(false)}
 }
 const body=<>
  {error&&<p className="nj-error" role="alert">{error}</p>}
  {notice&&<p className="nj-ok" role="status"><CheckCircle2 size={17}/>{notice}</p>}
  {loading&&<p role="status">Carico il diario alimentare…</p>}
  {data&&summary&&<>
   <div className="nj-metrics">
    <div><strong>{summary.count}</strong><span>Pasti registrati oggi</span></div>
    <div><strong>{format(summary.estimatedTotal)}</strong><span>kcal stimate da {summary.knownCount} registrazioni</span></div>
    <div><strong>{summary.reference==null?'—':format(summary.reference)}</strong><span>Riferimento personale kcal/giorno</span></div>
   </div>
   {summary.reference!=null&&summary.count>0&&<p className="nj-info">
    {summary.aboveReference&&summary.aboveReference>0?`Totale registrato sopra il riferimento di circa ${format(summary.aboveReference)} kcal.`:
     `Differenza dal riferimento: circa ${format(summary.remaining??0)} kcal.`}
    {' '}{summary.estimatedLow!==summary.estimatedHigh?`Le stime disponibili coprono all’incirca ${format(summary.estimatedLow)}–${format(summary.estimatedHigh)} kcal. `:''}Il riferimento non è un limite oltre il quale devi ignorare la fame.{summary.partial?' Attenzione: almeno un pasto è senza stima kcal, quindi il totale è parziale.':''}
   </p>}
   {summary.reference==null&&<p className="nj-info">Per vedere una differenza giornaliera, configura prima un riferimento calorico personale nella sezione «Riferimento giornaliero e preferenze» più in basso. Non viene fissato automaticamente.</p>}
   {summary.count===0&&<p className="nj-info">Non ci sono pasti registrati oggi. Questo non significa che tu non abbia mangiato.</p>}
   <div className="nj-bridge" aria-label="Mens sana in corpore sano, dati collegati">
    <div className="nj-bridge-title"><strong>Mens sana in corpore sano</strong><span>Alimentazione e allenamento, una sola visione</span></div>
    <div className="nj-bridge-metrics">
     <span><strong>{data.movement?.sessions7??'—'}</strong> sessioni di allenamento registrate negli ultimi 7 giorni</span>
     <span><strong>{data.movement?.minutes7??'—'}</strong> minuti di movimento registrati negli ultimi 7 giorni</span>
     <span><strong>{beerToday.count}</strong> {beerToday.count===1?'birra registrata':'birre registrate'} oggi{beerToday.count>0?` · ~${format(beerToday.kcalKnown)} kcal già comprese nel totale`:''}</span>
     <span><strong>{data.checkin?.energy??'—'}</strong> energia dichiarata nel check-in di oggi (scala 1–5)</span>
    </div>
    <p>Le attività registrate aiutano a leggere la settimana nel suo insieme. Evolve non sottrae calorie dell'allenamento al cibo e non presume che le registrazioni mancanti siano pasti saltati o inattività.</p>
    <nav><a href={BASE_PATH+'/allenamento'}>Allenamento</a><a href={BASE_PATH+'/alimentazione'}>Alimentazione</a><a href={BASE_PATH+'/visione'}>Visione 360</a></nav>
    {data.notices?.map(n=><small role="status" key={n}>{n}</small>)}
   </div>
   {(mode==='full'||mode==='today')&&<div className="nj-beer-quick" aria-label="Registrazione rapida birra">
    <div><strong>Birretta · registrazione rapida</strong><p>Una pressione registra una birra già bevuta. Valore iniziale indicativo di una birra normale; usa l'etichetta per essere più preciso.</p></div>
    <label>kcal per 100 ml <input type="number" min={15} max={120} step={1} inputMode="decimal" value={beerRate} onChange={e=>{setBeerRate(e.target.value);setBeerLabel(false)}}/></label>
    <label><input type="checkbox" checked={beerLabel} onChange={e=>setBeerLabel(e.target.checked)}/> Valore verificato sull’etichetta</label>
    <div className="nj-beer-actions">
     {[500,660].map(ml=><button type="button" key={ml} disabled={busy||estimating||beerKcal(ml as 500|660,Number(beerRate))==null}
      onClick={()=>void addBeer(ml as 500|660)}>+ Birra {ml/10} cl <span>~{beerKcal(ml as 500|660,Number(beerRate))??'—'} kcal</span></button>)}
    </div>
    <small>Le calorie dell'alcol non descrivono tutti i suoi effetti, incluso il recupero dopo l'attività fisica. Non sono un invito a bere.</small>
   </div>}
   {(mode==='full'||mode==='today')&&<div className="nj-hunger">
    <button type="button" className="nj-hunger-button" aria-expanded={hunger} onClick={()=>setHunger(x=>!x)}><Heart size={19}/> Ho fame <ChevronDown size={17}/></button>
    {hunger&&<div className="nj-hunger-content">
      <p><strong>Cosa ti andrebbe di mangiare?</strong> {todayEntries.length?`Oggi hai annotato ${todayEntries.length} ${todayEntries.length===1?'pasto':'pasti'}; queste idee sono un punto di partenza, non una valutazione completa.`:'Non risultano pasti annotati oggi, ma questo non significa che tu non abbia mangiato.'} Sono opzioni indicative, non una prescrizione. Le calorie residue non devono impedirti di mangiare se hai fame.</p>
      <div className="nj-ideas">
       {hungerSuggestions(data.settings.avoided_foods,3,{hourInRome,lastLoggedMeal:todayEntries[0]?.meal_type??null}).map(o=><article key={o.id}><strong>{o.title}</strong><p>{o.description}</p><small>{o.roughKcal}</small></article>)}
      </div>
      <a href={BASE_PATH+'/alimentazione#evolve-nutrition-form'}>Registra un pasto <ArrowRight size={15}/></a>
      <p className="nj-muted">Le idee tengono conto delle esclusioni che hai indicato, non di allergie o condizioni cliniche verificate. Controlla sempre gli ingredienti.</p>
    </div>}
   </div>}
  </>}
 </>;
 if(mode!=='full'){
  if(!loading&&!data)return <section className="nj-card nj-compact" role="alert"><strong>Alimentazione non disponibile</strong><p>{error}</p></section>;
  if(mode==='vision'&&data&&!todayEntries.length&&!data.settings.daily_reference_kcal&&!data.movement?.sessions7)return null;
  return <section className="nj-card nj-compact" aria-label="Alimentazione nel percorso">
   <header className="nj-head"><div><p className="eyebrow">EVOLVE · ALIMENTAZIONE</p><h2>{mode==='today'?'Il tuo cibo, nella giornata':mode==='training'?'Cibo e movimento: il quadro insieme':mode==='diary'?'Le tue registrazioni alimentari':'Il diario nel percorso'}</h2></div>
    <a className="nj-inline-link" href={BASE_PATH+'/alimentazione'}>Apri diario <ArrowRight size={16}/></a></header>
   {body}
  </section>;
 }
 return <section className="nj-card nj-full" aria-label="Diario alimentare integrato">
  <header className="nj-head"><div><p className="eyebrow">EVOLVE · NUTRITION INTELLIGENCE · MENS SANA IN CORPORE SANO</p>
   <h2>Quello che mangi, non solo quello che pianifichi</h2>
   <p>Registra un pasto una volta: il riepilogo quotidiano e le altre schermate vedranno gli stessi dati.</p></div>
   <button type="button" className="btn-secondary" disabled={loading||busy} onClick={()=>void load().catch(e=>setError(e.message))}><RefreshCcw size={16}/> Aggiorna</button></header>
  {body}
  <div className="nj-columns">
   <form id="evolve-nutrition-form" className="nj-panel nj-editor" onSubmit={saveMeal}>
    <h3>{editingId?'Modifica registrazione':'Che cosa hai mangiato?'}</h3>
    {editingBeer&&<p className="nj-info">Questa registrazione è una birra: puoi correggere orario, calorie e nota. Per cambiare da 50 a 66 cl, eliminala e usa di nuovo «Birretta».</p>}
    <div className="nj-grid">
     <label>Quando<input className="field" type="datetime-local" value={meal.eatenAt} onChange={e=>setMeal(v=>({...v,eatenAt:e.target.value}))} required/></label>
     <label>Tipo di pasto<select className="field" value={meal.mealType} disabled={editingBeer} onChange={e=>setMeal(v=>({...v,mealType:e.target.value as MealType}))}>{MEALS.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
    </div>
    <label>Descrivi alimenti e quantità, se le conosci<textarea className="field" required minLength={3} maxLength={600} rows={3} value={meal.description} disabled={editingBeer} onChange={e=>setDescription(e.target.value)} placeholder="Es. Pranzo: 100 g pasta (peso a crudo), pomodoro, un cucchiaio d’olio e una mela"/></label>
    <div className="nj-estimate"><button type="button" className="btn-secondary" disabled={estimating||busy||!consent||meal.description.trim().length<3} onClick={()=>void calculateKcal()}><Lightbulb size={16}/>{estimating?'Sto stimando…':'Stima kcal con AI'}</button>
     <label className="nj-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Autorizzo a inviare questa descrizione al provider AI esterno per una stima indicativa. Le informazioni inviate potrebbero essere trattate secondo le condizioni del provider.</label>
    </div>
    {aiMessage&&<p className="nj-info" role="status">{aiMessage}</p>}
    <label>Calorie del pasto (facoltative; valore modificabile)<input className="field" type="number" min="0" max="4000" step="1" value={meal.kcal} placeholder="Vuoto se non conosci le kcal" onChange={e=>setKcal(e.target.value)}/></label>
    <small className="nj-muted">Se inserisci kcal da un’etichetta, indica la porzione realmente consumata. La stima AI è approssimativa: non considerarla una misura esatta.</small>
    {meal.kcal!==''&&<label>Origine delle calorie<select className="field" value={meal.source} onChange={e=>setMeal(v=>({...v,source:e.target.value as CalorieSource,low:null,high:null}))}>
      <option value="stima_personale">Inserite o corrette manualmente</option><option value="etichetta">Etichetta nutrizionale</option>{meal.source==='ai_stima'&&<option value="ai_stima">Stima AI da confermare</option>}
     </select></label>}
    <label>Nota (facoltativa)<textarea className="field" maxLength={600} rows={2} value={meal.note} placeholder="Es. Come mi sono sentito, ingredienti non indicati, porzione approssimata" onChange={e=>setMeal(v=>({...v,note:e.target.value}))}/></label>
    <div className="nj-actions"><button type="submit" className="btn" disabled={busy||estimating||meal.description.trim().length<3}><Save size={16}/>{busy?'Salvo…':editingId?'Salva modifiche':'Ho mangiato questo · Salva'}</button>
     {editingId&&<button type="button" className="btn-secondary" onClick={reset}>Annulla modifica</button>}</div>
   </form>
   <div className="nj-panel nj-history"><h3>Il diario di oggi</h3>
    {todayEntries.length===0?<p className="nj-muted">Ancora nessuna registrazione per oggi. Puoi inserire anche un pasto già consumato.</p>:
     todayEntries.map(e=><article className="nj-entry" key={e.id}>
      <div><small>{MEALS.find(m=>m[0]===e.meal_type)?.[1]??'Pasto'} · {new Date(e.eaten_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</small>
       <strong>{e.description}</strong><span>{e.kcal==null?'Kcal non disponibili':`circa ${format(e.kcal)} kcal`}{e.calorie_source==='ai_stima'?(e.kcal_low!=null&&e.kcal_high!=null?` · intervallo ${format(e.kcal_low)}–${format(e.kcal_high)}`:' · stima AI'):''}</span>
       {e.note&&<p>{e.note}</p>}</div>
      <div className="nj-entry-actions"><button type="button" disabled={busy} onClick={()=>editEntry(e)} aria-label={`Modifica ${e.description.slice(0,40)}`}><Pencil size={17}/> Modifica</button>
       <button type="button" disabled={busy} onClick={()=>void deleteEntry(e)} aria-label={`Elimina ${e.description.slice(0,40)}`}><Trash2 size={17}/> Elimina</button></div>
     </article>)}
    <details className="nj-older"><summary>Registrazioni precedenti ({Math.max(0,(data?.items.length??0)-todayEntries.length)})</summary>
     {(data?.items??[]).filter(e=>romeDate(e.eaten_at)!==data?.today).map(e=><article className="nj-entry" key={e.id}><div><small>{new Date(e.eaten_at).toLocaleDateString('it-IT')} · {MEALS.find(m=>m[0]===e.meal_type)?.[1]??'Pasto'}</small><strong>{e.description}</strong><span>{e.kcal==null?'Kcal non disponibili':`circa ${format(e.kcal)} kcal`}</span></div>
      <div className="nj-entry-actions"><button type="button" disabled={busy} onClick={()=>editEntry(e)}><Pencil size={16}/> Modifica</button><button type="button" disabled={busy} onClick={()=>void deleteEntry(e)}><Trash2 size={16}/> Elimina</button></div></article>)}
    </details>
   </div>
  </div>
  <details id="evolve-nutrition-settings" className="nj-settings"><summary><ClipboardList size={18}/> Riferimento giornaliero e preferenze <ChevronDown size={18}/></summary>
   <div className="nj-settings-content">
    <p>Il riferimento è facoltativo e non è una prescrizione. Per esigenze mediche, gravidanza, interventi bariatrici o disturbi alimentari serve un valore personalizzato da un professionista.</p>
    <form className="nj-grid" onSubmit={saveSettings}>
     <label>Riferimento personale (kcal/giorno)<input className="field" type="number" min="800" max="6000" step="1" value={settings.daily_reference_kcal??''} placeholder="Es. indicazione del dietista" onChange={e=>setSettings(v=>({...v,daily_reference_kcal:safeNumber(e.target.value)}))}/></label>
     <label>Esclusioni o preferenze (separate da virgole)<input className="field" maxLength={500} value={settings.avoided_foods} placeholder="Es. pesce, latticini" onChange={e=>setSettings(v=>({...v,avoided_foods:e.target.value}))}/></label>
     <button type="submit" className="btn-secondary" disabled={busy}>Salva riferimento e preferenze</button>
    </form>
    <details className="nj-calculator"><summary onClick={()=>setCalculation(v=>!v)}>Calcola un intervallo teorico di mantenimento (solo adulti)</summary>
     <p>Calcolo informativo Mifflin–St Jeor, con margine indicativo del 10%. Può essere molto impreciso per singole persone e in situazioni cliniche. Non definisce da solo quante calorie dovresti mangiare.</p>
     <div className="nj-grid">
      <label>Età<input className="field" type="number" min="18" max="100" value={numbers.age||''} placeholder="Anni" onChange={e=>setNumbers(v=>({...v,age:Number(e.target.value)}))}/></label>
      <label>Altezza (cm)<input className="field" type="number" min="120" max="230" value={numbers.heightCm||''} placeholder="cm" onChange={e=>setNumbers(v=>({...v,heightCm:Number(e.target.value)}))}/></label>
      <label>Peso (kg)<input className="field" type="number" min="30" max="350" value={numbers.weightKg||''} placeholder="kg" onChange={e=>setNumbers(v=>({...v,weightKg:Number(e.target.value)}))}/></label>
      <label>Equazione di riferimento (+5 o −161)<select className="field" value={numbers.equation} onChange={e=>setNumbers(v=>({...v,equation:e.target.value as MaintenanceParams['equation']}))}><option value="plus5">Costante +5 (formula tipicamente maschile)</option><option value="minus161">Costante −161 (formula tipicamente femminile)</option></select></label>
      <label>Attività abituale<select className="field" value={numbers.activity} onChange={e=>setNumbers(v=>({...v,activity:e.target.value as MaintenanceParams['activity']}))}><option value="sedentaria">Prevalentemente sedentaria</option><option value="leggera">Leggermente attiva</option><option value="moderata">Moderatamente attiva</option></select></label>
     </div>
     <button type="button" className="btn-secondary" onClick={()=>{const result=maintenanceEstimate(numbers);setCalculationResult(result);if(!result)setError('Dati del calcolo non validi.');}}>Calcola intervallo informativo</button>
     {calculationResult&&<p className="nj-info">Stima teorica di mantenimento: circa <strong>{format(calculationResult.low)}–{format(calculationResult.high)} kcal/giorno</strong> (punto centrale {format(calculationResult.center)}). Non verrà salvata né usata come obiettivo senza una tua decisione esplicita.</p>}
     {calculation&&<p className="nj-muted">I dati inseriti per questo calcolo restano in questa schermata e non vengono inviati alle API né salvati nel profilo.</p>}
    </details>
   </div>
  </details>
  <p className="nj-muted">Evolve non sostituisce un professionista sanitario. Un valore calorico stimato non dice da solo se l'alimentazione è adeguata. Non usare il conteggio per compensare esercizio o ignorare i segnali di fame.</p>
 </section>;
}
