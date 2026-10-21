import '@/app/orchestrator.css';
import {loadPrograms} from '@/lib/program-data';
import {loadLife} from '@/lib/life/data';
import {makeDayPlan} from '@/lib/life/planner';
import {LifeDayClient} from '@/components/life-day-client';
import {CoachCommitments} from '@/components/coach-commitments';
import {OrchestratorOverview} from '@/components/orchestrator-overview';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default async function Giornata(){
 const [life,progress]=await Promise.all([loadLife(),loadPrograms()]);
 const cards=makeDayPlan({
  profile:life.profile,
  state:life.checkin,
  programs:progress.programs,
  plans:progress.profiles,
  logs:progress.checkins,
  scenarios:life.scenarios,
  actions:life.actions,
  day:life.day,
 });
 return <div className="evolve-day-page"><div className="evolve-page-intro"><p className="eyebrow">EVOLVE · OGGI</p><h1>Un passo alla volta</h1><p>Un quadro unico di quello che hai già registrato. Parti dalle attività <strong>concordate con il Coach</strong>, poi adatta il resto della giornata alle tue energie.</p><div className="evolve-intro-links"><Link href="/coach" className="btn-secondary">Ho un nuovo problema da affrontare <ArrowRight size={16}/></Link><Link href="/guida" className="evolve-text-help">Come funziona Evolve? →</Link></div></div><OrchestratorOverview/><CoachCommitments section="today"/><LifeDayClient profile={life.profile} checkin={life.checkin} cards={cards} day={life.day} error={life.error||progress.error} activeCount={progress.programs.filter(x=>x.status==='active').length}/></div>;
}
