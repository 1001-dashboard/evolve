import {loadPrograms} from '@/lib/program-data';
import {loadLife} from '@/lib/life/data';
import {makeDayPlan} from '@/lib/life/planner';
import {LifeDayClient} from '@/components/life-day-client';
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
 return <LifeDayClient profile={life.profile} checkin={life.checkin} cards={cards} day={life.day} error={life.error||progress.error} activeCount={progress.programs.filter(x=>x.status==='active').length}/>;
}
