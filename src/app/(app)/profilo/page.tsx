import {loadLife} from '@/lib/life/data';
import {LifeProfileClient} from '@/components/life-profile-client';
export default async function Profilo(){const {profile,error}=await loadLife();return <LifeProfileClient initial={profile} error={error}/>;}
