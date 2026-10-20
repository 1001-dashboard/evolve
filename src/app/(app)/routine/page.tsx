import {CoachCommitments} from '@/components/coach-commitments';
import { loadPrograms } from '@/lib/program-data';
import { ProgramsClient } from '@/components/programs-client';
export default async function Routine() {
  const data=await loadPrograms();
  return <div className="coach-plan-page"><CoachCommitments section="routines"/><ProgramsClient {...data} mode="daily"/></div>;
}
