import {CoachCommitments} from '@/components/coach-commitments';
import { loadPrograms } from '@/lib/program-data';
import { ProgramsClient } from '@/components/programs-client';
export default async function Percorsi() {
  const data=await loadPrograms();
  return <div className="coach-plan-page"><CoachCommitments section="programs"/><ProgramsClient {...data} mode="all"/></div>;
}
