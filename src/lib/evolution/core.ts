/** EVOLVE 1.8 — Unified, read-only factual projection.
 * A recorded event is not proof that a Coach commitment was met.
 * Aggregates are per-domain observations, never an overall wellbeing score.
 */
export type EvolutionArea='abitudini'|'benessere'|'allenamento'|'alimentazione'|'lavoro'|'apprendimento'|'relazioni'|'organizzazione';
export type Source='workout'|'meal_plan'|'coach'|'checkin'|'focus'|'path'|'scenario'|'action'|'diary';
export type LinkableSource='workout'|'meal_plan';
export type Commitment={id:string;title:string;kind:string;status:string};
export type Link={id:string;commitment_id:string;source_kind:LinkableSource;source_key:string;evidence_day:string};
export type EvolutionInput={
 today:string;
 profile:{areas:string[];priority_areas:string[];goal:string;support_level:string}|null;
 workouts:{id:string;occurred_at:string;activity:string;duration_minutes:number}[];
 mealPlans:{week_start:string;updated_at?:string|null;menu?:unknown}[];
 coachLogs:{commitment_id:string;day:string;outcome:string}[];
 commitments:Commitment[];
 states:{day:string;energy?:number|null}[];
 focusLogs:{day:string;outcome:string}[];
 paths:{id?:string;program_id:string;day:string;outcome:string}[];
 programs:{id:string;category:string}[];
 scenarios:{id:string;day:string;outcome:string}[];
 actions:{day:string;action_key:string;status:string}[];
 legacyActions:{id:string;status:string;created_at:string;completed_at:string|null}[];
 diary:{id:string;created_at:string;kind:string}[];
 links:Link[];
};
export type Evidence={
 key:string;source:Source;sourceKey:string;day:string;area:EvolutionArea|null;
 title:string;detail:string;href:string;outcome:'done'|'skipped'|'observed';
 linkedCommitmentId?:string;linkId?:string;
};
export type Domain={area:EvolutionArea;name:string;isPriority:boolean;observations7:number;observations30:number;summary:string};
export type EvolutionResult={
 today:string;goal:string;priorityAreas:EvolutionArea[];interests:EvolutionArea[];
 domain:Domain[];events:Evidence[];commitments:Commitment[];
 stats7:Record<Source,number>;stats30:Record<Source,number>;
 linkedEvidence:number;linkableUnlinked:number;observed7:number;observed30:number;
 note:string;
};
export const areaNames:Record<EvolutionArea,string>={
 abitudini:'Abitudini',benessere:'Benessere',allenamento:'Movimento',alimentazione:'Alimentazione',
 lavoro:'Lavoro',apprendimento:'Apprendimento',relazioni:'Relazioni',organizzazione:'Organizzazione'
};
export const sourceNames:Record<Source,string>={
 workout:'Allenamento',meal_plan:'Piano pasti',coach:'Coach',checkin:'Check-in',focus:'Focus settimanale',
 path:'Percorso guidato',scenario:'Scenario',action:'Azione',diary:'Diario'
};
const allAreas=Object.keys(areaNames) as EvolutionArea[];
export function isoDay(value:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const date=new Date(value+'T12:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?value:null;
}
export function shifted(day:string,count:number):string{
 if(!isoDay(day))throw Error('Giorno non valido');
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);
}
/** Europe/Rome on the calendar even near UTC midnight and DST changes. */
export function dateInRome(value:string):string|null{
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
 return isoDay(`${get('year')}-${get('month')}-${get('day')}`);
}
function domainOfProgram(category:string):EvolutionArea|null{
 if(category==='lingue')return 'apprendimento';
 if(category==='lavoro')return 'lavoro';
 if(category==='benessere')return 'benessere';
 return null; // Never guess a sensitive category or its broader goal.
}
export function makeEvolution(input:EvolutionInput):EvolutionResult{
 const day=isoDay(input.today);if(!day)throw Error('Invalid today');
 const from30=shifted(day,-29),from7=shifted(day,-6);
 const priorities=(input.profile?.priority_areas??[]).filter((a):a is EvolutionArea=>allAreas.includes(a as EvolutionArea));
 const interests=(input.profile?.areas??[]).filter((a):a is EvolutionArea=>allAreas.includes(a as EvolutionArea));
 const unique=(items:EvolutionArea[])=>[...new Set(items)];
 const commitmentById=new Map(input.commitments.map(c=>[c.id,c]));
 const programById=new Map(input.programs.map(p=>[p.id,p]));
 const connectionBySource=new Map(input.links.map(l=>[`${l.source_kind}:${l.source_key}`,l]));
 const raw:Evidence[]=[];
 const add=(r:Evidence)=>{if(isoDay(r.day)&&r.day>=from30&&r.day<=day)raw.push(r)};
 for(const w of input.workouts){
  const date=dateInRome(w.occurred_at);if(!date||!w.id)continue;
  const duration=Number(w.duration_minutes);
  add({key:`workout:${w.id}`,source:'workout',sourceKey:w.id,day:date,area:'allenamento',
   title:'Allenamento registrato',detail:`${String(w.activity||'Attività').slice(0,60)} · ${Number.isFinite(duration)&&duration>0?Math.round(duration)+' minuti':'durata non disponibile'}`,
   href:'/allenamento',outcome:'observed'});
 }
 for(const m of input.mealPlans){
  const date=m.updated_at?dateInRome(m.updated_at):isoDay(m.week_start);
  if(!date||!isoDay(m.week_start))continue;
  add({key:`meal_plan:${m.week_start}`,source:'meal_plan',sourceKey:m.week_start,day:date,area:'alimentazione',
   title:'Piano pasti salvato',detail:`Settimana del ${m.week_start} · salvataggio del menu, non conferma dei pasti consumati`,
   href:'/mealprep',outcome:'observed'});
 }
 for(const l of input.coachLogs){
  if(l.outcome!=='done'&&l.outcome!=='skipped')continue;
  const item=commitmentById.get(l.commitment_id);
  // Never infer the goal area from a generic Coach action title.
  add({key:`coach:${l.commitment_id}:${l.day}`,source:'coach',sourceKey:l.commitment_id,day:l.day,area:null,
   title:item?.title||'Impegno del Coach',detail:l.outcome==='done'?'Completamento confermato':'Rimandato da te',href:'/piano',outcome:l.outcome});
 }
 for(const s of input.states){
  add({key:`checkin:${s.day}`,source:'checkin',sourceKey:s.day,day:s.day,area:'benessere',
   title:'Check-in registrato',detail:'Tempo ed energia indicati da te',href:'/giornata',outcome:'observed'});
 }
 for(const f of input.focusLogs){
  if(f.outcome!=='done'&&f.outcome!=='skipped')continue;
  add({key:`focus:${f.day}`,source:'focus',sourceKey:f.day,day:f.day,area:'organizzazione',
   title:'Revisione del focus',detail:f.outcome==='done'?'Focus registrato come svolto':'Focus rimandato',href:'/revisione',outcome:f.outcome});
 }
 for(const p of input.paths){
  if(!['done','difficult','skipped'].includes(p.outcome))continue;
  const area=domainOfProgram(programById.get(p.program_id)?.category??'');
  add({key:`path:${p.id??p.program_id+':'+p.day}`,source:'path',sourceKey:p.program_id,day:p.day,area,
   title:'Esercizio guidato',detail:p.outcome==='done'?'Completato':p.outcome==='difficult'?'Segnalato come difficile':'Rimandato',
   href:'/percorsi',outcome:p.outcome==='done'?'done':p.outcome==='skipped'?'skipped':'observed'});
 }
 for(const s of input.scenarios){
  add({key:`scenario:${s.id}`,source:'scenario',sourceKey:s.id,day:s.day,area:null,
   title:'Scenario rivisto',detail:'Feedback registrato',href:'/scenari',outcome:'observed'});
 }
 for(const a of input.actions){
  add({key:`action:${a.day}:${a.action_key}`,source:'action',sourceKey:a.action_key,day:a.day,area:null,
   title:'Azione quotidiana',detail:['done','completed'].includes(a.status)?'Completata':'Stato registrato',href:'/azioni',outcome:['done','completed'].includes(a.status)?'done':'observed'});
 }
 for(const a of input.legacyActions){
  if(a.status!=='completed')continue; // Pending tasks do not count as results.
  const date=dateInRome(a.completed_at||a.created_at);if(!date||!a.id)continue;
  add({key:`oldaction:${a.id}`,source:'action',sourceKey:a.id,day:date,area:null,
   title:'Azione completata',detail:'Completamento registrato nella lista delle azioni',href:'/azioni',outcome:'done'});
 }
 for(const d of input.diary){
  const date=dateInRome(d.created_at);if(!date||!d.id)continue;
  add({key:`diary:${d.id}`,source:'diary',sourceKey:d.id,day:date,area:null,
   title:'Voce di diario',detail:'Riflessione salvata (contenuto privato non incluso nel riepilogo)',href:'/diario',outcome:'observed'});
 }
 const deDuplicated=new Map<string,Evidence>();
 for(const r of raw){
  const link=(r.source==='workout'||r.source==='meal_plan')?connectionBySource.get(`${r.source}:${r.sourceKey}`):undefined;
  deDuplicated.set(r.key,{...r,...(link?{linkedCommitmentId:link.commitment_id,linkId:link.id}:{})});
 }
 const events=[...deDuplicated.values()].sort((a,b)=>b.day.localeCompare(a.day)||a.key.localeCompare(b.key));
 const sources=Object.keys(sourceNames) as Source[];
 function stats(from:string):Record<Source,number>{
  return Object.fromEntries(sources.map(s=>[s,events.filter(e=>e.day>=from&&e.source===s).length])) as Record<Source,number>;
 }
 const domain=unique(interests.concat(priorities)).map(area=>{
  const matching=events.filter(e=>e.area===area);
  const recent=matching.filter(e=>e.day>=from7).length;
  const old=matching.length;
  return {area,name:areaNames[area],isPriority:priorities.includes(area),observations7:recent,observations30:old,
   summary:old?`${old} registrazioni riferibili a questo ambito negli ultimi 30 giorni.`:
     'Non risultano registrazioni classificate per questo ambito. Gli impegni generici non vengono attribuiti automaticamente.'};
 });
 const linkable=events.filter(e=>e.source==='workout'||e.source==='meal_plan');
 return {today:day,goal:input.profile?.goal??'',priorityAreas:unique(priorities),interests:unique(interests),
  domain,events:events.slice(0,100),commitments:input.commitments.filter(c=>c.status==='active'),
  stats7:stats(from7),stats30:stats(from30),linkedEvidence:linkable.filter(e=>Boolean(e.linkId)).length,
  linkableUnlinked:linkable.filter(e=>!e.linkId).length,observed7:events.filter(e=>e.day>=from7).length,
  observed30:events.length,
  note:'I registri mostrano fatti inseriti nelle diverse sezioni. Eventi diversi non sono necessariamente attività diverse; non esiste un punteggio unico di crescita.'};
}
