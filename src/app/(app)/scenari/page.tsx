import {loadLife} from '@/lib/life/data';
import {LifeScenariosClient} from '@/components/life-scenarios-client';
export default async function Scenari(){const {scenarios,error}=await loadLife();return <LifeScenariosClient initial={scenarios} error={error}/>;}
