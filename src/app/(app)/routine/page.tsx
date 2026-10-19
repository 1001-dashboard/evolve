import { loadPrograms } from '@/lib/program-data';
import { ProgramsClient } from '@/components/programs-client';
export default async function Routine() {
  const data=await loadPrograms();
  return <ProgramsClient {...data} mode="daily"/>;
}
