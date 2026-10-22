'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,CalendarDays,CheckCircle2,ChevronDown,ClipboardCheck,Link2,RefreshCcw,ShieldCheck,Unlink2} from 'lucide-react';
import {BASE_PATH,apiUrl} from '@/lib/config';
import {areaNames,sourceNames,type Evidence,type EvolutionResult} from '@/lib/evolution/core';

type Payload={overview:EvolutionResult;notices:string[];linkingAvailable:boolean};
export function EvolutionOverviewClient(){
 const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState('');
 const [period,setPeriod]=useState<7|30>(7),[area,setArea]=useState('all');
 const [choices,setChoices]=useState<Record<string,string>>({});
 const refresh=useCallback(async()=>{
  const response=await fetch(apiUrl('/api/evolution'),{cache:'no-store'});
  const value=await response.json() as Payload&{error?:string};
  if(!response.ok)throw Error(value.error||'Visione non disponibile');
  setData(value);
 },[]);
 useEffect(()=>{let active=true;
  fetch(apiUrl('/api/evolution'),{cache:'no-store'}).then(async r=>{
   const json=await r.json();if(!r.ok)throw Error(json.error||'Visione non disponibile');
   if(active)setData(json as Payload);
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:'Errore di connessione');})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 async function connect(event:Evidence){
  const commitmentId=choices[event.key];if(!commitmentId||busy)return;
  const item=data?.overview.commitments.find(c=>c.id===commitmentId);
  if(!item||!window.confirm(`Collegare «${event.title}» del ${event.day} all’impegno «${item.title}»? Questo NON lo segnerà come completato.`))return;
  setBusy(event.key);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/evolution/links'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({commitment_id:commitmentId,source_kind:event.source,source_key:event.sourceKey,confirmed:true})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Collegamento non riuscito');
   await refresh();setNotice(json.message||'Collegamento registrato.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete')}finally{setBusy('')}
 }
 async function disconnect(event:Evidence){
  if(!event.linkId||busy)return;
  setBusy(event.key);setError('');setNotice('');
  try{
   const response=await fetch(apiUrl('/api/evolution/links'),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:event.linkId})});
   const json=await response.json();if(!response.ok)throw Error(json.error||'Impossibile scollegare');
   await refresh();setNotice('Collegamento rimosso. Lo storico originale non è stato modificato.');
  }catch(e){setError(e instanceof Error?e.message:'Errore di rete')}finally{setBusy('')}
 }
 const overview=data?.overview;
 const shown=useMemo(()=>{
  if(!overview)return [];
  const first=period===7?new Date(overview.today+'T12:00:00Z'):null;
  if(first)first.setUTCDate(first.getUTCDate()-6);
  const start=first?first.toISOString().slice(0,10):null;
  return overview.events.filter(e=>(!start||e.day>=start)&&(area==='all'||e.area===area)).slice(0,45);
 },[overview,period,area]);
 return <div className="ev-page">
  <header className="ev-hero">
   <p className="eyebrow">EVOLVE CORE · VISIONE 360</p>
   <h1>Il tuo percorso, tutto insieme.</h1>
   <p>Gli stessi fatti che registri nelle diverse schermate, raccolti in un unico posto. Senza confondere attività svolte, impegni concordati e suggerimenti.</p>
   <div className="ev-navlinks"><a href={BASE_PATH+'/giornata'}>Torna a Oggi <ArrowRight size={15}/></a><a href={BASE_PATH+'/piano'}>Il mio piano <ArrowRight size={15}/></a><a href={BASE_PATH+'/andamento'}>Grafici e misure <ArrowRight size={15}/></a></div>
  </header>
  {error&&<div className="ev-alert" role="alert">{error}</div>}
  {notice&&<div className="ev-notice" role="status"><CheckCircle2 size={17}/>{notice}</div>}
  {loading&&<section className="ev-panel" role="status">Raccolgo le registrazioni disponibili…</section>}
  {overview&&<>
   <section className="ev-panel ev-overview" aria-labelledby="ev-overview-title">
    <div className="ev-between"><div><p className="eyebrow">LA VISIONE D'INSIEME</p><h2 id="ev-overview-title">Il tuo punto di riferimento</h2></div><button type="button" className="ev-refresh" disabled={Boolean(busy)} onClick={()=>{setLoading(true);setError('');refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false))}}><RefreshCcw size={16}/> Aggiorna</button></div>
    {overview.goal?<p className="ev-goal"><strong>Obiettivo dichiarato:</strong> {overview.goal}</p>:<p className="ev-goal">Non hai ancora indicato un obiettivo principale. <a href={BASE_PATH+'/inizia'}>Personalizza il percorso →</a></p>}
    <div className="ev-range" role="group" aria-label="Periodo osservato"><button type="button" aria-pressed={period===7} className={period===7?'active':''} onClick={()=>setPeriod(7)}>Ultimi 7 giorni</button><button type="button" aria-pressed={period===30} className={period===30?'active':''} onClick={()=>setPeriod(30)}>Ultimi 30 giorni</button></div>
    <div className="ev-stats">
     <div><CalendarDays size={19}/><span>Check-in registrati</span><strong>{period===7?overview.stats7.checkin:overview.stats30.checkin}</strong></div>
     <div><ClipboardCheck size={19}/><span>Esiti del Coach</span><strong>{period===7?overview.stats7.coach:overview.stats30.coach}</strong></div>
     <div><CheckCircle2 size={19}/><span>Allenamenti nel diario</span><strong>{period===7?overview.stats7.workout:overview.stats30.workout}</strong></div>
     <div><Link2 size={19}/><span>Evidenze collegate</span><strong>{overview.linkedEvidence}</strong><small>Negli ultimi 30 giorni</small></div>
    </div>
    <p className="ev-footnote">Ogni numero conta registrazioni del rispettivo tipo. Non vengono sommate per produrre un punteggio di crescita o di benessere.</p>
   </section>
   <section className="ev-panel" aria-labelledby="ev-areas-title">
    <div className="ev-between"><div><p className="eyebrow">I TUOI AMBITI</p><h2 id="ev-areas-title">Dove stai lavorando</h2></div><a className="ev-small-link" href={BASE_PATH+'/inizia'}>Modifica priorità <ArrowRight size={14}/></a></div>
    {overview.domain.length===0?<div className="ev-empty">Scegli i tuoi interessi e fino a tre priorità da <a href={BASE_PATH+'/inizia'}>Personalizza Evolve</a>.</div>:
     <div className="ev-domain-grid">{overview.domain.map(d=><article className={'ev-domain '+(d.isPriority?'ev-domain-active':'')} key={d.area}>
      <span className="ev-kicker">{d.isPriority?'PRIORITÀ ATTIVA':'INTERESSE'}</span><h3>{d.name}</h3>
      <strong>{period===7?d.observations7:d.observations30}</strong><span className="ev-small-label">registrazioni classificabili in {period} giorni</span>
      <p>{d.summary}</p>
     </article>)}</div>}
    <p className="ev-footnote">Le attività del Coach non vengono assegnate automaticamente a un ambito solo perché il titolo sembra pertinente. Il sistema evita attribuzioni arbitrarie.</p>
   </section>
   <section className="ev-panel" aria-labelledby="ev-history-title">
    <div className="ev-between"><div><p className="eyebrow">LE SCHERMATE SI PARLANO</p><h2 id="ev-history-title">Cronologia condivisa</h2></div><label className="ev-filter">Ambito <select value={area} onChange={e=>setArea(e.target.value)}><option value="all">Tutti</option>{Object.entries(areaNames).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select><ChevronDown size={14}/></label></div>
    {shown.length===0?<p className="ev-empty">Nessuna registrazione disponibile per i filtri scelti. Questo non significa che tu non abbia svolto attività.</p>:
     <div className="ev-timeline">{shown.map(e=>{
      const possible=overview.commitments.filter(c=>c.kind===(e.source==='workout'?'allenamento':e.source==='meal_plan'?'alimentazione':'_none'));
      const linked=overview.commitments.find(c=>c.id===e.linkedCommitmentId);
      return <article className="ev-event" key={e.key}>
       <div className="ev-event-head"><span className="ev-source">{sourceNames[e.source]}</span><time dateTime={e.day}>{e.day}</time></div>
       <h3>{e.title}</h3><p>{e.detail}</p>
       {e.outcome==='skipped'&&<span className="ev-tag">Rimandato · dato registrato</span>}
       {e.outcome==='done'&&<span className="ev-tag">Completamento confermato</span>}
       <div className="ev-event-footer"><a href={BASE_PATH+e.href}>Apri schermata <ArrowRight size={14}/></a>
        {e.linkId?<span className="ev-connected"><Link2 size={15}/> Associata: {linked?.title||'Impegno non più attivo'} <button disabled={Boolean(busy)} type="button" onClick={()=>void disconnect(e)} aria-label={`Rimuovi collegamento per ${e.title}`}><Unlink2 size={15}/> Scollega</button></span>:null}
       </div>
       {!e.linkId&&possible.length>0&&data.linkingAvailable&&<div className="ev-connect"><label htmlFor={'ev-link-'+e.key}>Collega questa registrazione a un impegno del Coach (facoltativo)</label><div><select id={'ev-link-'+e.key} value={choices[e.key]??''} onChange={event=>setChoices(p=>({...p,[e.key]:event.target.value}))}><option value="">Scegli un impegno</option>{possible.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select><button type="button" disabled={!choices[e.key]||Boolean(busy)} onClick={()=>void connect(e)}>{busy===e.key?'Salvo…':'Collega'}</button></div><small>Un collegamento non segna automaticamente «Fatto» nel Piano.</small></div>}
      </article>;
     })}</div>}
    {overview.events.length>45&&<p className="ev-footnote">Per mantenere la schermata leggibile, vengono mostrate al massimo 45 registrazioni. I riepiloghi considerano fino a 30 giorni.</p>}
   </section>
   <section className="ev-panel ev-explain"><ShieldCheck size={23}/><div><h2>Il controllo rimane tuo.</h2><p>Evolve non cambia i tuoi obiettivi, le frequenze o lo stato degli impegni sulla base di una semplice correlazione. Puoi collegare una registrazione al Coach o scollegarla. Solo un’azione esplicita nel Piano registra un completamento.</p><p>Il contenuto privato delle riflessioni non compare qui. I dati mancanti vengono segnalati, mai trattati come prova di mancata attività.</p></div></section>
   {data.notices.length>0&&<section className="ev-panel" role="status"><h2>Fonti momentaneamente non disponibili</h2><div className="ev-notices">{data.notices.map(n=><p key={n}>{n}</p>)}</div></section>}
  </>}
 </div>;
}
