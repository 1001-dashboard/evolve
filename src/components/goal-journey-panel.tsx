'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,CheckCircle2,Link2,Plus,RefreshCcw,Target,Unlink2} from 'lucide-react';
import {BASE_PATH,apiUrl} from '@/lib/config';
import {areaNames} from '@/lib/evolution/core';
import {GOAL_AREAS,asEvidenceKey,goalStats,type EvolutionGoal,type GoalLink,type GoalEvidence,type GoalArea} from '@/lib/evolution/goals';

type Payload={today:string;goals:EvolutionGoal[];links:GoalLink[];evidence:GoalEvidence[];
 profile:{areas:string[];priority_areas:string[];goal:string}|null;notices:string[];error?:string};
type Mode='vision'|'training'|'today';
const sourceLabel={workout:'Allenamento',meal_plan:'Piano pasti',coach:'Coach'};
export function GoalJourneyPanel({mode}:{mode:Mode}){
 const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[area,setArea]=useState<GoalArea>('allenamento');
 const [target,setTarget]=useState<Record<string,string>>({});
 const [visibleCount,setVisibleCount]=useState(25);
 const reload=useCallback(async()=>{
  const r=await fetch(apiUrl('/api/evolution/goals'),{cache:'no-store'});
  const j=await r.json() as Payload;
  if(!r.ok)throw Error(j.error||'Obiettivi non disponibili');
  setData(j);
 },[]);
 useEffect(()=>{let mounted=true;
  fetch(apiUrl('/api/evolution/goals'),{cache:'no-store'}).then(async r=>{
   const j=await r.json() as Payload;if(!r.ok)throw Error(j.error||'Obiettivi non disponibili');
   if(mounted){setData(j);const first=j.profile?.priority_areas?.find(x=>GOAL_AREAS.includes(x as GoalArea));if(first)setArea(first as GoalArea);}
  }).catch(e=>{if(mounted)setError(e instanceof Error?e.message:'Errore di rete');})
   .finally(()=>{if(mounted)setLoading(false)});
  return()=>{mounted=false};
 },[]);
 // Keep this panel synchronized with edits and removals in the workout diary on this page.
 useEffect(()=>{
  const refresh=()=>{void reload().catch(e=>setError(e instanceof Error?e.message:'Aggiornamento non disponibile'));};
  window.addEventListener('evolve:workout-changed',refresh);
  return()=>window.removeEventListener('evolve:workout-changed',refresh);
 },[reload]);
 const stats=useMemo(()=>data?goalStats(data.goals,data.links,data.evidence,data.today):[],[data]);
 const mapped=useMemo(()=>new Map((data?.links??[]).map(l=>[asEvidenceKey(l.source_kind,l.source_key),l])),[data]);
 const eligible=useMemo(()=>data?data.evidence.filter(e=>mode==='training'?e.kind==='workout':true)
   .sort((a,b)=>b.day.localeCompare(a.day)||a.key.localeCompare(b.key)):[],[data,mode]);
 const visible=eligible.slice(0,visibleCount);
 async function send(method:'POST'|'PATCH'|'DELETE',path:string,payload:object,action:string){
  setBusy(action);setError('');setNotice('');
  try{
   const r=await fetch(apiUrl(path),{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Operazione non riuscita');
   await reload();setNotice(j.message||'Modifica salvata.');
   if(action==='create'){setTitle('');setDescription('');}
  }catch(e){setError(e instanceof Error?e.message:'Errore di connessione');}finally{setBusy('');}
 }
 async function create(e:React.FormEvent){e.preventDefault();if(busy)return;
  await send('POST','/api/evolution/goals',{title:title.trim(),description:description.trim(),area},'create');
 }
 const active=data?.goals.filter(g=>g.status==='active')??[];
 return <section className={'gj-root gj-'+mode} aria-label="Obiettivi e collegamenti del percorso">
  <div className="gj-heading"><div><p className="eyebrow">EVOLVE · OBIETTIVI CONNESSI</p>
    <h2>{mode==='training'?'Collega gli allenamenti ai tuoi obiettivi':mode==='today'?'I tuoi obiettivi in corso':'Obiettivi e risultati che si parlano'}</h2>
    <p>{mode==='training'?'Puoi associare anche sessioni registrate in passato, senza ricrearle.':mode==='today'?'Le registrazioni restano condivise con Visione 360 e gli altri diari.':'Ogni dato rimane nel suo diario originale. Decidi tu a quale obiettivo attribuirlo.'}</p>
   </div>
   <button type="button" className="gj-refresh" disabled={Boolean(busy)||loading} onClick={()=>{setLoading(true);reload().catch(e=>setError(e instanceof Error?e.message:'Errore')).finally(()=>setLoading(false));}}><RefreshCcw size={15}/> Aggiorna</button>
  </div>
  {error&&<p className="gj-error" role="alert">{error}</p>}
  {notice&&<p className="gj-ok" role="status"><CheckCircle2 size={15}/>{notice}</p>}
  {loading&&<p className="gj-muted" role="status">Carico gli obiettivi…</p>}
  {data&&<>
   {mode!=='today'&&<form className="gj-create" onSubmit={e=>void create(e)}>
    <div><strong>Un obiettivo concreto</strong><p>Parti da ciò che vuoi raggiungere. Puoi prendere spunto dall’obiettivo generale dell’onboarding, senza crearne un duplicato automaticamente.</p>
     {data.profile?.goal&&<small>Il tuo obiettivo generale: «{data.profile.goal}»</small>}</div>
    <div className="gj-fields"><label>Ambito<select value={area} onChange={e=>setArea(e.target.value as GoalArea)}>{GOAL_AREAS.map(a=><option key={a} value={a}>{areaNames[a]}</option>)}</select></label>
     <label>Obiettivo<input value={title} maxLength={120} minLength={4} placeholder="Es. Allenarmi con regolarità" onChange={e=>setTitle(e.target.value)} required/></label>
    </div>
    <label>Come riconoscerai i progressi? <span className="gj-muted">Facoltativo</span><textarea rows={2} maxLength={350} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Es. Riuscire a trovare due momenti sostenibili a settimana"/></label>
    <button className="gj-primary" disabled={Boolean(busy)||title.trim().length<4} type="submit"><Plus size={16}/> {busy==='create'?'Salvo…':'Crea obiettivo'}</button>
   </form>}
   {data.goals.length===0?<p className="gj-empty">Non hai ancora obiettivi specifici collegati alle registrazioni. Le tue attività precedenti restano nei rispettivi diari. {mode==='today'?<>Puoi <a href={BASE_PATH+'/visione'}>creare un obiettivo in Visione 360</a>.</>:'Crea un primo obiettivo quando ti è utile.'}</p>:
   <div className="gj-goal-grid">{stats.filter(s=>mode==='today'?s.goal.status==='active':true).map(s=><article className="gj-goal" key={s.goal.id}>
     <div className="gj-goal-head"><span>{areaNames[s.goal.area]}</span><span>{s.goal.status==='active'?'Attivo':s.goal.status==='paused'?'In pausa':'Concluso'}</span></div>
     <h3>{s.goal.title}</h3>{s.goal.description&&<p>{s.goal.description}</p>}
     <div className="gj-measures"><span><strong>{s.workouts30}</strong> allenamenti</span><span><strong>{Math.round(s.minutes30)}</strong> minuti</span><span><strong>{s.mealPlans30}</strong> piani pasti</span><span><strong>{s.coachDone30}</strong> esiti Coach</span></div>
     <small>Ultimi 30 giorni · solo registrazioni associate da te{ s.lastEvidenceDay?` · ultima: ${s.lastEvidenceDay}`:''}. Le categorie non sono sommate in un punteggio.</small>
     {mode!=='today'&&<div className="gj-status-actions">
      {s.goal.status==='active'?<button disabled={Boolean(busy)} type="button" onClick={()=>void send('PATCH','/api/evolution/goals',{id:s.goal.id,status:'paused'},`status:${s.goal.id}`)}>Sospendi</button>:<button disabled={Boolean(busy)} type="button" onClick={()=>void send('PATCH','/api/evolution/goals',{id:s.goal.id,status:'active'},`status:${s.goal.id}`)}>Riattiva</button>}
      {s.goal.status!=='completed'&&<button disabled={Boolean(busy)} type="button" onClick={()=>void send('PATCH','/api/evolution/goals',{id:s.goal.id,status:'completed'},`status:${s.goal.id}`)}>Concludi</button>}
     </div>}
    </article>)}</div>}
   {mode!=='today'&&<div className="gj-entries">
    <div><h3>{mode==='training'?'Sessioni disponibili nel diario':'Registrazioni da attribuire'}</h3>
     <p className="gj-muted">Mostro le registrazioni recenti disponibili, comprese quelle antecedenti alla patch. Se ne hai appena salvata una, premi Aggiorna. Un collegamento non equivale a un completamento del Coach.</p></div>
    {visible.length===0?<p className="gj-empty">Non ci sono registrazioni disponibili da collegare. Questo non significa che tu non abbia svolto attività.</p>:
     visible.map(entry=>{const key=asEvidenceKey(entry.kind,entry.key);const existing=mapped.get(key);const goal=data.goals.find(g=>g.id===existing?.goal_id);
      return <article className="gj-entry" key={key}>
       <div className="gj-entry-main"><span>{sourceLabel[entry.kind]} · {entry.day}</span><strong>{entry.label}</strong><small>{entry.detail}</small></div>
       {existing?<div className="gj-link-current"><span><Link2 size={15}/> {goal?.title??'Obiettivo non disponibile'}</span>
         <button type="button" disabled={Boolean(busy)} onClick={()=>void send('DELETE','/api/evolution/goal-links',{id:existing.id},`unlink:${key}`)}><Unlink2 size={15}/> Scollega</button></div>
       :active.length>0?<div className="gj-entry-action"><label htmlFor={'gj-'+key}>Associa a</label>
        <select id={'gj-'+key} value={target[key]??''} onChange={e=>setTarget(x=>({...x,[key]:e.target.value}))}>
         <option value="">Scegli un obiettivo</option>{active.map(g=><option value={g.id} key={g.id}>{g.title}</option>)}
        </select><button type="button" disabled={Boolean(busy)||!target[key]} onClick={()=>void send('POST','/api/evolution/goal-links',{goal_id:target[key],source_kind:entry.kind,source_key:entry.key,confirmed:true},`link:${key}`)}>{busy===`link:${key}`?'Salvo…':'Collega'}</button></div>
       :<small className="gj-muted">Per collegare una registrazione, crea o riattiva un obiettivo.</small>}
      </article>;
     })}
    {eligible.length>visibleCount&&<button type="button" className="gj-more-records" onClick={()=>setVisibleCount(n=>n+25)}>Mostra altre registrazioni ({eligible.length-visibleCount})</button>}
   </div>}
   {mode==='today'&&<a className="gj-more" href={BASE_PATH+'/visione'}><Target size={16}/> Apri Visione 360 e collega le registrazioni <ArrowRight size={15}/></a>}
   {data.notices.length>0&&<details className="gj-notices"><summary>Registri non disponibili ({data.notices.length})</summary>{data.notices.map(t=><p key={t}>{t}</p>)}</details>}
  </>}
 </section>;
}
