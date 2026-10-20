import {loadPrograms} from '@/lib/program-data';
import {PersonalPlanClient} from '@/components/personal-plan-client';
import {CoachCommitments} from '@/components/coach-commitments';
export default async function Piano({searchParams}:{searchParams:Promise<{program?:string}>}){
  const [data,search]=await Promise.all([loadPrograms(),searchParams]);
  return <div className="coach-plan-page"><CoachCommitments section="plan"/><PersonalPlanClient {...data} initialProgramId={search.program}/></div>;
}
