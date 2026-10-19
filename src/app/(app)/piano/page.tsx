import {loadPrograms} from '@/lib/program-data';
import {PersonalPlanClient} from '@/components/personal-plan-client';
export default async function Piano({searchParams}:{searchParams:Promise<{program?:string}>}){
  const [data,search]=await Promise.all([loadPrograms(),searchParams]);
  return <PersonalPlanClient {...data} initialProgramId={search.program}/>;
}
