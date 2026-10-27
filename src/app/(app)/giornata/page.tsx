import '@/app/nutrition-journal.css';
import {NutritionJournalClient} from '@/components/nutrition-journal-client';
import '@/app/orchestrator.css';
import '@/app/daily-companion.css';
import '@/app/goal-journey.css';
import '@/app/training-intelligence.css';
import '@/app/today-focus.css';
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
import {TrainingIntelligenceClient} from '@/components/training-intelligence-client';
import {TodayCheckinClient} from '@/components/today-checkin-client';
import {ArrowRight,ClipboardList,Network,NotebookPen} from 'lucide-react';

/** Evolve 1.9.1: make Today a decision workspace, not a stack of eight dashboards.
 * Previously approved commitments and tools remain available under explicit disclosures.
 */
export default async function Giornata(){
 const [life,progress,onboarding]=await Promise.all([loadLife(),loadPrograms(),loadOnboarding()]);
 const suggested=makeDayPlan({profile:life.profile,state:life.checkin,programs:progress.programs,
  plans:progress.profiles,logs:progress.checkins,scenarios:life.scenarios,actions:life.actions,day:life.day});
 const cards=onboarding?guidanceCards(suggested,onboarding.support_level):suggested;
 return <div className="evolve-day-page today-focus-page">
  <header className="evolve-page-intro today-focus-intro">
   <p className="eyebrow">EVOLVE · OGGI</p>
   <h1>Il prossimo passo parte da ciò che hai già fatto.</h1>
   <p>Un check-in breve, le evidenze dei tuoi allenamenti e gli impegni che hai scelto. Nessun obbligo inventato e nessun progresso azzerato.</p>
   <nav className="today-focus-jumps" aria-label="Vai alle sezioni della giornata">
    <a href="#evolve-movimento">Il mio movimento</a><a href="#evolve-checkin">Come sto oggi</a>
    <a href="#evolve-coach">Impegni concordati</a>
   </nav>
  </header>
  <section className="today-focus-primary" id="evolve-movimento" aria-label="Il prossimo passo e le evidenze del movimento">
   <TrainingIntelligenceClient mode="today"/>
  </section>
  <section id="evolve-checkin"><TodayCheckinClient/></section>
  <section id="evolve-alimentazione" aria-label="Diario alimentare e suggerimenti se hai fame"><NutritionJournalClient mode="today"/></section>
  <details className="today-focus-disclosure" id="evolve-coach">
   <summary><span className="today-focus-icon"><ClipboardList size={20}/></span><span><strong>Impegni concordati con il Coach</strong><small>Consulta le attività approvate e registra ciò che hai davvero svolto</small></span><ArrowRight size={18} className="today-chevron"/></summary>
   <div className="today-focus-detail"><DailyCompanionClient/></div>
  </details>
  <details className="today-focus-disclosure" id="evolve-obiettivi">
   <summary><span className="today-focus-icon"><Network size={20}/></span><span><strong>Obiettivi connessi e Visione 360</strong><small>Collegamenti espliciti fra allenamento, piano e risultati</small></span><ArrowRight size={18} className="today-chevron"/></summary>
   <div className="today-focus-detail"><GoalJourneyPanel mode="today"/>
    <a className="btn-secondary today-focus-link" href="/evolve/visione">Apri tutta la panoramica <ArrowRight size={16}/></a></div>
  </details>
  <details className="today-focus-disclosure" id="evolve-approfondisci">
   <summary><span className="today-focus-icon"><NotebookPen size={20}/></span><span><strong>Altre routine e strumenti della giornata</strong><small>Esercizi guidati, riflessioni e quadro completo, quando ti servono</small></span><ArrowRight size={18} className="today-chevron"/></summary>
   <div className="today-focus-detail">
    <section id="evolve-checkin-completo" aria-label="Check-in completo e attività facoltative">
     <LifeDayClient profile={life.profile} checkin={life.checkin} cards={cards} day={life.day}
      error={life.error||progress.error} activeCount={progress.programs.filter(x=>x.status==='active').length}/>
    </section>
    <OrchestratorOverview/><CoachCommitments section="today"/>
    {!onboarding&&<p className="muted text-sm">Puoi <a href="/evolve/inizia">scegliere interessi e priorità</a>; il diario Allenamento continua a funzionare anche senza onboarding.</p>}
    {(!onboarding||onboarding.support_level!=='autonomo')&&<a href="/evolve/adatta" className="btn-secondary today-focus-link">Valuta gli adattamenti <ArrowRight size={16}/></a>}
   </div>
  </details>
 </div>;
}
