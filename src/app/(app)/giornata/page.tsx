import '@/app/orchestrator.css';
import '@/app/daily-companion.css';
import '@/app/goal-journey.css';
import {loadPrograms} from '@/lib/program-data';
import {loadLife} from '@/lib/life/data';
import {loadOnboarding} from '@/lib/onboarding-data';
import {makeDayPlan} from '@/lib/life/planner';
import {guidanceCards} from '@/lib/onboarding';
import {LifeDayClient} from '@/components/life-day-client';
import {CoachCommitments} from '@/components/coach-commitments';
import {OrchestratorOverview} from '@/components/orchestrator-overview';
import {DailyCompanionClient} from '@/components/daily-companion-client';
import {GoalJourneyPanel} from '@/components/goal-journey-panel';
import {ArrowRight} from 'lucide-react';
export default async function Giornata(){
 const [life,progress,onboarding]=await Promise.all([loadLife(),loadPrograms(),loadOnboarding()]);
 const suggested=makeDayPlan({profile:life.profile,state:life.checkin,programs:progress.programs,
  plans:progress.profiles,logs:progress.checkins,scenarios:life.scenarios,actions:life.actions,day:life.day});
 const cards=onboarding?guidanceCards(suggested,onboarding.support_level):suggested;
 return <div className="evolve-day-page">
  <div className="evolve-page-intro"><p className="eyebrow">EVOLVE · OGGI</p><h1>Il tuo oggi, organizzato.</h1>
   <p>Parti dagli impegni concordati. Il Companion ti aiuta a scegliere cosa mettere in evidenza in base al tempo e alle energie, senza modificare il tuo piano.</p>
   <div className="evolve-intro-links"><a href="/evolve/coach" className="btn-secondary">Affronta un nuovo obiettivo <ArrowRight size={16}/></a><a href="/evolve/guida" className="evolve-text-help">Come funziona Evolve? →</a></div>
  </div>
  <DailyCompanionClient/>
  <GoalJourneyPanel mode="today"/>
  <section className="panel" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:18}}>
   <div><p className="eyebrow">EVOLVE CORE · NOVITÀ 1.8</p><h2 className="text-lg font-bold">Ogni passo fa parte di un percorso.</h2><p className="muted text-sm">Allenamento, Piano, check-in e diario in una cronologia condivisa. Collega le evidenze al Coach solo quando lo scegli tu.</p></div>
   <a href="/evolve/visione" className="btn-secondary">Apri Visione 360 <ArrowRight size={16}/></a>
  </section>
  <section id="evolve-checkin" aria-label="Check-in e attività facoltative">
   <LifeDayClient profile={life.profile} checkin={life.checkin} cards={cards} day={life.day}
    error={life.error||progress.error} activeCount={progress.programs.filter(x=>x.status==='active').length}/>
  </section>
  <details className="dc-secondary" id="evolve-approfondisci"><summary>Apri il quadro completo e gli impegni concordati</summary>
   <div>
    {!onboarding?<p className="muted text-sm">Prima volta su Evolve? <a href="/evolve/inizia">Personalizza il tuo percorso</a>.</p>:null}
    <OrchestratorOverview/><CoachCommitments section="today"/>
    {(!onboarding||onboarding.support_level!=='autonomo')&&<a href="/evolve/adatta" className="btn-secondary">Valuta gli adattamenti <ArrowRight size={15}/></a>}
   </div>
  </details>
 </div>;
}
