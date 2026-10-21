'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Compass,HandHeart,RefreshCcw,ShieldCheck,Sprout} from 'lucide-react';
import {AREAS,starterPlan,levelDescription,type Area,type OnboardingInput,type StoredOnboarding,type SupportLevel} from '@/lib/onboarding';

type Progress={logged:number;rate:number|null;suggest:boolean;reason:string};
type LoadResponse={profile:StoredOnboarding|null;progress:Progress|null;warning?:string;error?:string};
const DEFAULT:OnboardingInput={areas:[],priority_areas:[],goal:'',obstacle:'',minutes:15,anchor:'',support_level:'guidato',confidence:3};
const durations=[5,10,15,20,30,45,60] as const;
const steps=['Presentazione','I tuoi interessi','Le tue priorità','Il punto di partenza','Conferma il piano'];
export function SmartOnboardingClient(){
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [step,setStep]=useState(0),[saved,setSaved]=useState<StoredOnboarding|null>(null),[progress,setProgress]=useState<Progress|null>(null);
 const [editing,setEditing]=useState(true),[form,setForm]=useState<OnboardingInput>(DEFAULT);
 const [token,setToken]=useState(''),[accepted,setAccepted]=useState<number[]>([]);
 const [level,setLevel]=useState<SupportLevel>('guidato'),[confidence,setConfidence]=useState<1|2|3|4|5>(3);
 useEffect(()=>{
  let live=true;
  fetch('/evolve/api/onboarding',{cache:'no-store'}).then(async r=>{
   const d=await r.json() as LoadResponse;if(!r.ok)throw Error(d.error||'Il percorso non è disponibile');
   if(!live)return;
   setSaved(d.profile);setProgress(d.progress);setEditing(!d.profile);
   if(d.profile){const {areas,priority_areas,goal,obstacle,minutes,anchor,support_level,confidence}=d.profile;setForm({areas,priority_areas:priority_areas?.length?priority_areas:areas.slice(0,3),goal,obstacle,minutes,support_level,confidence,anchor});setLevel(support_level);setConfidence(confidence);}
   if(d.warning)setNotice(d.warning);
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:'Errore di connessione')}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[]);
 const plan=useMemo(()=>starterPlan(form),[form]);
 const update=<K extends keyof OnboardingInput>(key:K,value:OnboardingInput[K])=>{setForm(p=>({...p,[key]:value}));setError('');};
 function toggle(area:Area){
  setForm(prev=>{
   const selected=prev.areas.includes(area);
   const areas=selected?prev.areas.filter(a=>a!==area):[...prev.areas,area];
   const current=prev.priority_areas.filter(a=>areas.includes(a));
   const priority_areas=!selected&&current.length<3?[...current,area]:current;
   return {...prev,areas,priority_areas};
  });setError('');
 }
 function togglePriority(area:Area){
  if(!form.areas.includes(area))return;
  setForm(prev=>({...prev,priority_areas:prev.priority_areas.includes(area)
    ?prev.priority_areas.filter(a=>a!==area)
    :prev.priority_areas.length>=3?prev.priority_areas:[...prev.priority_areas,area]}));
  setError('');
 }
 function next(){setError('');
  if(step===1&&!form.areas.length){setError('Scegli almeno un ambito che ti interessa.');return;}
  if(step===2&&(form.priority_areas.length<1||form.priority_areas.length>3||form.priority_areas.some(a=>!form.areas.includes(a)))){
   setError('Scegli da una a tre priorità tra gli ambiti selezionati.');return;
  }
  if(step===3&&form.goal.trim().length<5){setError('Descrivi in almeno 5 caratteri ciò che vuoi migliorare.');return;}
  if(step===3){setAccepted(plan.map((_,i)=>i));setToken(crypto.randomUUID());}
  setStep(v=>Math.min(4,v+1));
 }
 function editAgain(){setEditing(true);setStep(0);setError('');setNotice('');setToken('');}
 async function approve(){if(busy)return;if(accepted.length===0){setError('Seleziona almeno una delle attività proposte.');return;}
  setBusy(true);setError('');try{
   const response=await fetch('/evolve/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,approval_token:token,accepted_indices:accepted})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Impossibile attivare il piano.');
   window.location.assign('/evolve/giornata');
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete');}finally{setBusy(false);}
 }
 async function saveLevel(){setBusy(true);setNotice('');setError('');try{
  const response=await fetch('/evolve/api/onboarding',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({support_level:level,confidence})});const data=await response.json();if(!response.ok)throw Error(data.error||'Aggiornamento non riuscito');
  setSaved(p=>p?{...p,support_level:level,confidence}:p);setNotice('Livello salvato. I tuoi impegni approvati non sono stati modificati.');
 }catch(e){setError(e instanceof Error?e.message:'Errore di rete');}finally{setBusy(false);}}
 if(loading)return <section className="ob-card"><p>Carico il tuo percorso…</p></section>;
 if(saved&&!editing)return <div className="ob-stack">
  <section className="ob-card ob-intro"><div className="ob-icon"><Sprout size={27}/></div><p className="eyebrow">IL TUO PERCORSO</p><h1>Il cambiamento deve diventare tuo.</h1><p>Obiettivo attuale: <strong>{saved.goal}</strong></p><p className="ob-muted"><strong>Ambiti d'interesse:</strong> {AREAS.filter(a=>saved.areas.includes(a.id)).map(a=>a.title).join(' · ')}</p><p className="ob-muted"><strong>Priorità attive:</strong> {AREAS.filter(a=>(saved.priority_areas??saved.areas.slice(0,3)).includes(a.id)).map(a=>a.title).join(' · ')}</p><p className="ob-muted">Evolve è uno strumento, non un obbligo quotidiano. Decidi tu quanta guida ricevere e quando farne a meno.</p></section>
  <section className="ob-card"><h2>Quanto supporto vuoi?</h2><p className="ob-muted">Modificare questa impostazione riduce soltanto i suggerimenti facoltativi. Le attività concordate nel Piano non vengono cancellate.</p>
   <div className="ob-options">{(['guidato','essenziale','autonomo'] as const).map(v=><label className={'ob-choice '+(level===v?'ob-selected':'')} key={v}><input type="radio" name="level" checked={level===v} onChange={()=>setLevel(v)}/><span><strong>{v[0].toUpperCase()+v.slice(1)}</strong><small>{levelDescription[v]}</small></span></label>)}</div>
   <label className="ob-label" htmlFor="ob-confidence">Quanto ti senti autonomo oggi? {confidence}/5</label><input id="ob-confidence" type="range" min={1} max={5} step={1} value={confidence} onChange={e=>setConfidence(Number(e.target.value) as 1|2|3|4|5)}/>
   {progress&&<div className="ob-note"><strong>Ultimi 14 giorni · {progress.logged} registrazioni</strong><p>{progress.rate===null?'Ancora nessun confronto disponibile.':`${progress.rate}% delle attività registrate come completate.`} {progress.reason}</p>{progress.suggest&&<p>Puoi provare «Essenziale» o «Autonomo», solo se lo desideri.</p>}</div>}
   <button type="button" className="btn" disabled={busy} onClick={()=>void saveLevel()}>{busy?'Salvataggio…':'Salva il livello scelto'}</button>
  </section>
  <section className="ob-card"><h2>Vuoi cambiare obiettivi?</h2><p className="ob-muted">Puoi preparare un nuovo piano; gli impegni precedenti restano nel Piano e potrai sospenderli da lì.</p><div className="ob-actions"><button className="btn-secondary" onClick={editAgain} type="button">Ripersonalizza <RefreshCcw size={16}/></button><a className="btn-secondary" href="/evolve/piano">Vai al mio piano</a></div></section>
  {notice&&<p className="ob-success" role="status">{notice}</p>}{error&&<p className="ob-error" role="alert">{error}</p>}
 </div>;
 return <div className="ob-stack">
  <div className="ob-progress"><span>EVOLVE · IL TUO INIZIO</span><span>{step+1} di {steps.length}</span></div><div className="ob-progress-track" aria-label={`Passaggio ${step+1} di ${steps.length}`}><span style={{width:`${(step+1)/steps.length*100}%`}}/></div>
  {step===0&&<section className="ob-card ob-intro"><div className="ob-icon"><Sprout size={32}/></div><p className="eyebrow">BENVENUTO IN EVOLVE</p><h1>Piccoli passi. Capacità che restano.</h1><p>Ti aiuto a scegliere un obiettivo, preparare le difficoltà, organizzare azioni concrete e imparare da ciò che fai.</p><p>Puoi lavorare su abitudini, movimento, alimentazione, lavoro, apprendimento e altre aree della vita, con lo stesso metodo.</p><div className="ob-note"><ShieldCheck size={18}/><span>Non sono uno psicologo, un medico o un dietista. Non formulo diagnosi o terapie; i dati personali restano nel tuo account.</span></div><div className="ob-principle"><HandHeart size={21}/><span><strong>Il mio obiettivo è diventare meno necessario.</strong> Quando acquisisci autonomia puoi ridurre o disattivare i suggerimenti, continuando a usare diari e strumenti solo quando servono.</span></div></section>}
  {step===1&&<section className="ob-card"><p className="eyebrow">PASSO 1 · I TUOI INTERESSI</p><h1>In quali ambiti vuoi crescere?</h1><p className="ob-muted">Puoi scegliere tutti gli ambiti che ti interessano, anche tutti e otto. Non significa doverli affrontare tutti insieme.</p><div className="ob-area-grid">{AREAS.map(a=><button className={'ob-area '+(form.areas.includes(a.id)?'ob-selected':'')} aria-pressed={form.areas.includes(a.id)} key={a.id} type="button" onClick={()=>toggle(a.id)}><span><strong>{a.title}</strong><small>{a.description}</small></span>{form.areas.includes(a.id)?<CheckCircle2 size={21}/>:<span className="ob-empty-circle"/>}</button>)}</div><p className="ob-muted" aria-live="polite">{form.areas.length} di {AREAS.length} ambiti selezionati. Saranno salvati nel tuo profilo.</p></section>}
  {step===2&&<section className="ob-card"><p className="eyebrow">PASSO 2 · LE PRIORITÀ ATTIVE</p><h1>Da dove vuoi iniziare?</h1><p className="ob-muted">Scegli da una a tre priorità su cui costruire il primo piano. Gli altri ambiti restano nel profilo e potrai attivarli in seguito.</p><div className="ob-area-grid">{AREAS.filter(a=>form.areas.includes(a.id)).map(a=><button className={'ob-area '+(form.priority_areas.includes(a.id)?'ob-selected':'')} aria-pressed={form.priority_areas.includes(a.id)} disabled={!form.priority_areas.includes(a.id)&&form.priority_areas.length>=3} key={a.id} type="button" onClick={()=>togglePriority(a.id)}><span><strong>{a.title}</strong><small>{a.description}</small></span>{form.priority_areas.includes(a.id)?<CheckCircle2 size={21}/>:<span className="ob-empty-circle"/>}</button>)}</div><p className="ob-muted" aria-live="polite">{form.priority_areas.length} di 3 priorità attive. {form.priority_areas.length===3?'Per sceglierne un’altra, deselezionane prima una.':''}</p></section>}
  {step===3&&<section className="ob-card"><p className="eyebrow">PASSO 3 · IL PUNTO A</p><h1>Partiamo dalla tua vita reale.</h1><div className="ob-fields">
   <label>Che cosa vorresti ottenere concretamente? <span className="ob-required">*</span><textarea value={form.goal} maxLength={320} placeholder="Esempio: riuscire a organizzarmi meglio e preparare i pranzi senza stress" onChange={e=>update('goal',e.target.value)} rows={3}/></label>
   <label>Qual è l'ostacolo principale? <small>Facoltativo</small><textarea value={form.obstacle} maxLength={350} placeholder="Esempio: dopo il lavoro sono troppo stanco" onChange={e=>update('obstacle',e.target.value)} rows={2}/></label>
   <label>Quanto tempo puoi dedicare ogni giorno?<select value={form.minutes} onChange={e=>update('minutes',Number(e.target.value) as OnboardingInput['minutes'])}>{durations.map(n=><option key={n} value={n}>{n} minuti</option>)}</select></label>
   <label>Un momento già presente nella tua routine <small>Facoltativo</small><input value={form.anchor} maxLength={120} placeholder="Esempio: dopo il caffè del mattino" onChange={e=>update('anchor',e.target.value)}/></label>
   <label>Come preferisci iniziare?<select value={form.support_level} onChange={e=>update('support_level',e.target.value as SupportLevel)}><option value="guidato">Guidato, con piccoli suggerimenti</option><option value="essenziale">Essenziale, con meno indicazioni</option><option value="autonomo">Autonomo, consulto Evolve quando serve</option></select></label>
   <label>Quanto ti senti già autonomo? {form.confidence}/5<input type="range" min={1} max={5} step={1} value={form.confidence} onChange={e=>update('confidence',Number(e.target.value) as OnboardingInput['confidence'])}/></label>
  </div><p className="ob-muted">Non chiediamo dati sanitari o informazioni sul corpo per iniziare. Se sceglierai funzioni specifiche potrai aggiungere soltanto le informazioni necessarie.</p></section>}
  {step===4&&<section className="ob-card"><p className="eyebrow">PASSO 4 · LA TUA SCELTA</p><h1>Il tuo primo piano, senza sovraccarico.</h1><p className="ob-muted">È una proposta iniziale basata sulle tue priorità attive, non una prescrizione. Seleziona cosa attivare: nulla viene salvato senza la tua conferma.</p><div className="ob-plan-list">{plan.map((item,i)=><label className={'ob-choice '+(accepted.includes(i)?'ob-selected':'')} key={i}><input type="checkbox" checked={accepted.includes(i)} onChange={()=>setAccepted(old=>old.includes(i)?old.filter(v=>v!==i):[...old,i])}/><span><strong>{item.title}</strong><small>{item.description}</small><small>{item.minutes} min · {item.cadence==='daily'?'Ogni giorno (modificabile)':'Alcuni giorni della settimana'}</small></span></label>)}</div><div className="ob-note"><Compass size={18}/><span>Parti da ciò che riesci a fare. Le attività rimangono modificabili nel Piano; in seguito Evolve potrà proporti meno guida, ma la decisione resta tua.</span></div><p className="ob-muted">Attività selezionate: {accepted.length}. Se hai già un piano, queste attività si aggiungeranno: potrai mettere in pausa le precedenti.</p></section>}
  {error&&<p className="ob-error" role="alert">{error}</p>}
  <div className="ob-actions"><button className="btn-secondary" type="button" onClick={()=>{if(step===0)window.location.assign('/evolve/giornata');else{setStep(s=>s-1);setError('');}}}><ArrowLeft size={16}/>{step===0?'Salta per ora':'Indietro'}</button>
   {step<4?<button className="btn" type="button" onClick={next}>{step===0?'Cominciamo':'Continua'} <ArrowRight size={17}/></button>:<button className="btn" type="button" disabled={busy||accepted.length===0} onClick={()=>void approve()}>{busy?'Attivazione…':'Conferma e attiva'} <CheckCircle2 size={17}/></button>}
  </div>
 </div>;
}
