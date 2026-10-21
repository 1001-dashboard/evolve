import '@/app/orchestrator.css';
import {loadPrograms} from '@/lib/program-data';
import {loadLife} from '@/lib/life/data';
import {loadOnboarding} from '@/lib/onboarding-data';
import {makeDayPlan} from '@/lib/life/planner';
import {guidanceCards,levelDescription} from '@/lib/onboarding';
import {LifeDayClient} from '@/components/life-day-client';
import {CoachCommitments} from '@/components/coach-commitments';
import {OrchestratorOverview} from '@/components/orchestrator-overview';
import {ArrowRight} from 'lucide-react';
export default async function Giornata(){
 const [life,progress,onboarding]=await Promise.all([loadLife(),loadPrograms(),loadOnboarding()]);
 const suggested=makeDayPlan({
  profile:life.profile,
  state:life.checkin,
  programs:progress.programs,
  plans:progress.profiles,
  logs:progress.checkins,
  scenarios:life.scenarios,
  actions:life.actions,
  day:life.day,
 });
 const cards=onboarding?guidanceCards(suggested,onboarding.support_level):suggested;
 return <div className="evolve-day-page">
   <div className="evolve-page-intro"><p className="eyebrow">EVOLVE · OGGI</p><h1>Un passo alla volta</h1><p>Un quadro unico di quello che hai già registrato. Parti dalle attività <strong>concordate con il Coach</strong>, poi adatta il resto della giornata alle tue energie.</p>
    <div className="evolve-intro-links"><a href="/evolve/coach" className="btn-secondary">Ho un nuovo problema da affrontare <ArrowRight size={16}/></a><a href="/evolve/guida" className="evolve-text-help">Come funziona Evolve? →</a></div>
   </div>
   {!onboarding?<section className="panel" style={{display:'grid',gap:10,marginBottom:18}}><p className="eyebrow">IL TUO PUNTO DI PARTENZA</p><h2 className="text-xl font-bold">Scopri come Evolve può aiutarti</h2><p className="muted">Scegli gli ambiti da migliorare e prepara un piano personale. Puoi anche saltare questo passaggio e usare gli strumenti che già conosci.</p><a className="btn" href="/evolve/inizia" style={{width:'fit-content'}}>Personalizza il mio percorso <ArrowRight size={16}/></a></section>
    :<section className="panel" style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap',marginBottom:18}}><div><p className="eyebrow">IL TUO LIVELLO DI SUPPORTO</p><h2 className="text-lg font-bold">{onboarding.support_level[0].toUpperCase()+onboarding.support_level.slice(1)}</h2><p className="muted text-sm">{levelDescription[onboarding.support_level]}</p></div><a className="btn-secondary" href="/evolve/inizia">Gestisci la mia autonomia <ArrowRight size={15}/></a></section>}
   <OrchestratorOverview/>
   <CoachCommitments section="today"/>
   <LifeDayClient profile={life.profile} checkin={life.checkin} cards={cards} day={life.day} error={life.error||progress.error} activeCount={progress.programs.filter(x=>x.status==='active').length}/>
 </div>;
}
