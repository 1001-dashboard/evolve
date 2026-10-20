import {CoachCommitments} from '@/components/coach-commitments';
import {loadLife} from '@/lib/life/data';
import {LifeScenariosClient} from '@/components/life-scenarios-client';
export default async function Scenari(){const {scenarios,error}=await loadLife();return <div className="coach-plan-page"><CoachCommitments section="scenarios"/><LifeScenariosClient initial={scenarios} error={error}/></div>;}
