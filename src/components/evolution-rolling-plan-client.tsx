'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {CalendarDays,HeartPulse,RefreshCcw,ArrowRight,Info,Activity} from 'lucide-react';
import {apiUrl} from '@/lib/config';
import type {RollingResult} from '@/lib/evolution/rolling-plan';

type Mode='today'|'training'|'nutrition'|'vision';
export function EvolutionRollingPlanClient({mode}:{mode:Mode}){
 const [plan,setPlan]=useState<RollingResult|null>(null);
 const [error,setError]=useState(''),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  const r=await fetch(apiUrl('/api/evolution/rolling-plan'),{cache:'no-store'});
  const j=await r.json() as {plan?:RollingResult;error?:string};
  if(!r.ok||!j.plan)throw Error(j.error||'Riepilogo non disponibile.');
  setPlan(j.plan);setError('');
 },[]);
 useEffect(()=>{
  let active=true;
  const reload=()=>{void refresh().catch(e=>{if(active)setError(e instanceof Error?e.message:'Errore di lettura')}).finally(()=>{if(active)setLoading(false)})};
  reload();
  window.addEventListener('evolve:checkin-changed',reload);
  window.addEventListener('evolve:food-changed',reload);
  window.addEventListener('evolve:workout-changed',reload);
  return()=>{active=false;window.removeEventListener('evolve:checkin-changed',reload);window.removeEventListener('evolve:food-changed',reload);window.removeEventListener('evolve:workout-changed',reload)};
 },[refresh]);
 if(loading&&!plan)return <section className="rp-root" role="status">Rileggo allenamenti, pasti e check-in per aggiornare la tua giornata…</section>;
 if(!plan)return <section className="rp-root" role="alert">{error||'Panoramica temporaneamente non disponibile.'}</section>;
 const a=plan.assessment;
 const fmt=(n:number)=>n.toLocaleString('it-IT',{maximumFractionDigits:1});
 return <section className={'rp-root rp-'+mode} aria-label="Punto di partenza e proposte dei prossimi giorni">
  <header className="rp-head">
   <div><p className="eyebrow">MENS SANA IN CORPORE SANO · EVOLVE</p><h2>Punto di partenza e prossimi passi</h2>
    <p>Un piano che si ricalcola dai fatti, senza spostare automaticamente gli impegni del Coach.</p></div>
   <button type="button" className="rp-refresh" onClick={()=>{setLoading(true);void refresh().catch(e=>setError(String(e))).finally(()=>setLoading(false))}} disabled={loading}><RefreshCcw size={16}/> Aggiorna</button>
  </header>
  {error&&<p className="rp-notice" role="alert">{error}</p>}
  <div className="rp-metrics">
   <div><strong>{plan.workouts7}</strong><span>Allenamenti · 7 giorni</span></div>
   <div><strong>{plan.foodToday}</strong><span>Pasti e bevande registrati oggi</span></div>
   <div><strong>{plan.kcalToday.toLocaleString('it-IT')}</strong><span>Kcal stimate oggi{plan.unknownKcal?' (totale parziale)':''}</span></div>
   <div><strong>{plan.reference==null?'—':plan.reference.toLocaleString('it-IT')}</strong><span>Riferimento alimentare confermato</span></div>
  </div>
  {a.bmi!=null?<div className="rp-baseline">
   <div><HeartPulse size={20}/><strong>Il tuo riferimento iniziale</strong></div>
   <p>{a.age!=null?`${a.age} anni · `:''}{fmt(a.weight!)} kg · {fmt(a.height!)} cm · BMI {fmt(a.bmi)} ({a.bmiCategory}).</p>
   <p>Per la tua altezza, la fascia BMI generale 18,5–24,9 corrisponde approssimativamente a {fmt(a.normalBmiWeightBand!.min)}–{fmt(a.normalBmiWeightBand!.max)} kg; sotto {fmt(a.nonObeseUpperKg!)} kg il BMI sarebbe inferiore a 30. <strong>Non sono pesi-obiettivo personali</strong>: il BMI è un indicatore di screening, non una diagnosi.</p>
   <small>Riferimento peso: {a.weightSource==='profilo'?'profilo personale':a.weightSource}. Se hai una storia clinica o bariatrica, definisci un obiettivo e il riferimento calorico con il curante.</small>
  </div>:<div className="rp-baseline"><Info size={18}/><p>Per visualizzare un riferimento basato su età, altezza e peso, completa il <Link href="/profilo">profilo</Link> e registra una pesata in <Link href="/andamento">Risultati</Link>. Nessuna fascia di peso viene ipotizzata.</p></div>}
  <div className="rp-days"><div className="rp-subhead"><CalendarDays size={20}/><h3>Oggi e i prossimi due giorni</h3></div>
   <div className="rp-day-grid">{plan.days.map((d,i)=><article className={'rp-day'+(i===0?' rp-primary':'')} key={d.day}>
    <span className="rp-day-label">{d.dateLabel}{d.isPreview?' · previsione':''}</span>
    <strong>{d.title}</strong><p>{d.detail}</p>
    {i===0&&<div className="rp-links"><Link href="/allenamento"><Activity size={16}/> Allenamento <ArrowRight size={14}/></Link><Link href="/alimentazione">Diario pasti <ArrowRight size={14}/></Link></div>}
   </article>)}</div>
  </div>
  <p className="rp-explain">{plan.explanation} {plan.unknownKcal?'Alcune calorie non sono note: la differenza giornaliera è incompleta.':''}</p>
  {plan.reference!=null&&plan.difference!=null&&<p className="rp-explain">Differenza descrittiva rispetto al riferimento calorico: {plan.difference>=0?`${fmt(plan.difference)} kcal stimate`:`circa ${fmt(Math.abs(plan.difference))} kcal oltre il riferimento`}. Non è un credito da spendere né un debito da compensare con l’esercizio.</p>}
  {plan.reference!=null&&plan.difference===null&&<p className="rp-explain">Non mostro calorie «rimaste» perché mancano registrazioni o stime complete. Puoi consultare i dati disponibili nel diario senza considerarli un limite.</p>}
  {plan.notes.map((x,i)=><p className="rp-notice" key={i}>{x}</p>)}
  {mode==='nutrition'&&<p className="rp-explain">Per una stima orientativa del fabbisogno usa il calcolatore nella sezione Alimentazione. Il valore diventa il tuo riferimento solo se lo confermi esplicitamente.</p>}
 </section>;
}
