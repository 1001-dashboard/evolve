/** Evolve 1.8.1 — explicit goals and independently verified evidence.
 * Observations and Coach outcomes are different facts. Neither is a wellbeing score.
 * A source event can be associated with at most one goal, preventing double counting. */
export const GOAL_AREAS=['abitudini','benessere','allenamento','alimentazione','lavoro','apprendimento','relazioni','organizzazione'] as const;
export type GoalArea=typeof GOAL_AREAS[number];
export type GoalStatus='active'|'paused'|'completed';
export type GoalSource='workout'|'meal_plan'|'coach';
export type EvolutionGoal={id:string;area:GoalArea;title:string;description:string;status:GoalStatus;created_at:string};
export type GoalLink={id:string;goal_id:string;source_kind:GoalSource;source_key:string;evidence_day:string};
export type GoalEvidence={kind:GoalSource;key:string;day:string;label:string;detail:string;href:string;minutes?:number};
export type GoalProgress={goal:EvolutionGoal;workouts7:number;workouts30:number;minutes7:number;minutes30:number;mealPlans30:number;coachDone30:number;totalRecorded30:number;lastEvidenceDay:string|null};
export function dateShift(day:string,count:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Giorno non valido');
 const d=new Date(`${day}T12:00:00Z`);
 if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==day)throw Error('Giorno non valido');
 d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);
}
export function goalStats(goals:EvolutionGoal[],links:GoalLink[],evidence:GoalEvidence[],today:string):GoalProgress[]{
 const from30=dateShift(today,-29),from7=dateShift(today,-6);
 // Different source kinds remain independent: a workout and its Coach confirmation
 // are not summed as two workouts or conflated into one implicit confirmation.
 const available=new Map(evidence.map(e=>[`${e.kind}:${e.key}`,e]));
 const unique=new Map<string,GoalLink>();
 for(const link of links){
  const key=`${link.source_kind}:${link.source_key}`;
  if(!unique.has(key))unique.set(key,link);
 }
 return goals.map(goal=>{
  const matched=[...unique.values()].filter(l=>l.goal_id===goal.id && l.evidence_day>=from30 && l.evidence_day<=today)
   .map(link=>({link,event:available.get(`${link.source_kind}:${link.source_key}`)}))
   .filter((v):v is {link:GoalLink;event:GoalEvidence}=>Boolean(v.event && v.event.day===v.link.evidence_day));
  const workouts=matched.filter(x=>x.event.kind==='workout');
  const recent=matched.filter(x=>x.event.day>=from7);
  const minutes=(items:typeof matched)=>items.filter(x=>x.event.kind==='workout').reduce((s,x)=>s+(Number.isFinite(Number(x.event.minutes))&&Number(x.event.minutes)>0?Number(x.event.minutes):0),0);
  return {goal,workouts7:recent.filter(x=>x.event.kind==='workout').length,workouts30:workouts.length,
   minutes7:minutes(recent),minutes30:minutes(workouts),mealPlans30:matched.filter(x=>x.event.kind==='meal_plan').length,
   coachDone30:matched.filter(x=>x.event.kind==='coach').length,totalRecorded30:matched.length,
   lastEvidenceDay:matched.length?matched.map(x=>x.event.day).sort().at(-1)??null:null};
 });
}
export function asEvidenceKey(kind:GoalSource,key:string):string{return `${kind}:${key}`;}
