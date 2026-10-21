/** Evolve 1.6 — deterministically generated, user-controlled suggestions.
 * An empty diary is never treated as proof of inactivity or failure.
 * This module makes no medical or psychological assessment. */
export type AdaptiveCommitment = {
  id:string; title:string; kind:string; minutes:number; cadence:string; status:string; updated_at?:string;
};
export type AdaptiveLog = {commitment_id:string;day:string;outcome:'done'|'skipped'};
export type AdaptiveCheckin = {day:string;energy:number};
export type AdaptiveWorkout = {occurred_at:string;duration_minutes:number};
export type AdaptiveProfile = {areas:string[];support_level:'guidato'|'essenziale'|'autonomo';confidence:number;started_on:string};
export type AdaptiveSuggestion = {
 id:string; category:'routine'|'recupero'|'organizzazione'|'autonomia';
 title:string; evidence:string; proposed:string; action:'shorten'|'open';
 href?:string; commitment_id?:string; original_minutes?:number; proposed_minutes?:number;
};
export type AdaptiveInput = {
 today:string; commitments:AdaptiveCommitment[]; logs:AdaptiveLog[];
 checkins:AdaptiveCheckin[]; workouts:AdaptiveWorkout[];
 mealPlanSaved:boolean|null; onboarding:AdaptiveProfile|null;
};

/** ISO YYYY-MM-DD arithmetic in UTC noon, independent of runtime locale. */
export function minusDays(today:string,days:number):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Invalid day');
 const d=new Date(`${today}T12:00:00Z`);
 if(Number.isNaN(d.getTime()))throw Error('Invalid day');
 d.setUTCDate(d.getUTCDate()-days);
 return d.toISOString().slice(0,10);
}
export function monday(today:string):string{
 const d=new Date(`${today}T12:00:00Z`);
 if(Number.isNaN(d.getTime()))throw Error('Invalid day');
 const day=d.getUTCDay();return minusDays(today,day===0?6:day-1);
}
export function computeAdaptive(input:AdaptiveInput){
 const start=minusDays(input.today,13), startWeek=minusDays(input.today,6);
 const logs=input.logs.filter(l=>l.day>=start&&l.day<=input.today);
 const weekCheckins=input.checkins.filter(c=>c.day>=startWeek&&c.day<=input.today);
 const completed=logs.filter(x=>x.outcome==='done').length;
 const skipped=logs.filter(x=>x.outcome==='skipped').length;
 const observations=completed+skipped;
 const observedDays=new Set(logs.map(x=>x.day)).size;
 const lowEnergy=weekCheckins.filter(c=>c.energy<=2).length;
 const suggestions:AdaptiveSuggestion[]=[];

 // A specific repeated obstacle, never a general moral judgement about discipline.
 for(const item of input.commitments.filter(c=>c.status==='active' && c.minutes>5)){
   const relevant=logs.filter(l=>l.commitment_id===item.id && (!item.updated_at || l.day>item.updated_at.slice(0,10)));
   const misses=relevant.filter(l=>l.outcome==='skipped').length;
   const successes=relevant.filter(l=>l.outcome==='done').length;
   if(misses<2 || misses<=successes)continue;
   const proposedMinutes=Math.max(3,Math.floor(item.minutes/2));
   if(proposedMinutes>=item.minutes)continue;
   suggestions.push({id:`shorten:${item.id}`,category:'routine',title:`Rendi più semplice: ${item.title}`,
    evidence:`Negli ultimi 14 giorni hai registrato ${misses} rinvii e ${successes} completamenti per questa attività.`,
    proposed:`Se vuoi, prova a riservarle ${proposedMinutes} minuti invece di ${item.minutes}. Restano invariati obiettivo, giorni e descrizione.`,
    action:'shorten',commitment_id:item.id,original_minutes:item.minutes,proposed_minutes:proposedMinutes});
   if(suggestions.filter(x=>x.category==='routine').length>=2)break;
 }

 if(lowEnergy>=2 && weekCheckins.length>=3){
  suggestions.push({id:'recupero',category:'recupero',title:'Considera il recupero nella pianificazione',
   evidence:`Hai registrato energia bassa in ${lowEnergy} dei ${weekCheckins.length} check-in degli ultimi 7 giorni.`,
   proposed:'Puoi scegliere una giornata più leggera o parlarne con il Coach. Nessun impegno viene modificato automaticamente.',
   action:'open',href:'/coach'});
 }
 if(input.onboarding?.areas.includes('alimentazione') && input.mealPlanSaved===false){
  suggestions.push({id:'spesa',category:'organizzazione',title:'Semplifica la preparazione dei pasti',
   evidence:'Non risulta salvato un piano meal prep per la settimana in corso. Questo non dice nulla su come hai mangiato.',
   proposed:'Se ti è utile, prepara uno o due pranzi e una lista della spesa. Non serve cambiare il tuo regime alimentare.',
   action:'open',href:'/mealprep'});
 }
 if(input.onboarding?.areas.includes('allenamento') && input.workouts.length===0 && weekCheckins.length>=2){
  suggestions.push({id:'movimento',category:'organizzazione',title:'Tieni traccia del movimento che fai',
   evidence:'Non risultano sessioni nel diario degli ultimi 14 giorni. Potresti esserti mosso senza registrarlo.',
   proposed:'Se vuoi, registra una camminata o un’attività già svolta; non è una richiesta di aumentare l’allenamento.',
   action:'open',href:'/allenamento'});
 }
 const elapsed=Math.floor((Date.parse(input.today+'T12:00:00Z')-Date.parse((input.onboarding?.started_on??input.today)+'T12:00:00Z'))/86400000);
 const ratio=observations?completed/observations:0;
 const autonomous=Boolean(input.onboarding&&elapsed>=14&&observations>=5&&observedDays>=4&&ratio>=.8&&input.onboarding.confidence>=4);
 if(autonomous && input.onboarding?.support_level==='guidato'){
  suggestions.push({id:'autonomia',category:'autonomia',title:'Vuoi provare con meno suggerimenti?',
   evidence:`Negli ultimi 14 giorni hai registrato ${completed} attività completate su ${observations}, distribuite su ${observedDays} giornate; riferisci autonomia ${input.onboarding.confidence}/5.`,
   proposed:'Puoi passare al livello Essenziale. Il cambiamento è facoltativo e i tuoi impegni restano invariati.',
   action:'open',href:'/inizia'});
 }
 // Respect the self-selected degree of support. No unsolicited actions in autonomous mode.
 const visible=input.onboarding?.support_level==='autonomo'?[]:
  input.onboarding?.support_level==='essenziale'?suggestions.slice(0,1):suggestions.slice(0,3);
 return {suggestions:visible,metrics:{completed,skipped,observations,observedDays,checkins:weekCheckins.length,lowEnergy,workouts:input.workouts.length,mealPlanSaved:input.mealPlanSaved},
  supportLevel:input.onboarding?.support_level??'guidato',note:'Sono osservazioni sulle registrazioni disponibili, non giudizi sulle attività non registrate. Le modifiche richiedono la tua conferma.'};
}
/** Validate the only automatic proposal that is allowed to modify a commitment. */
export function shorterDuration(item:Pick<AdaptiveCommitment,'minutes'|'id'|'status'|'updated_at'>,logs:AdaptiveLog[]):number|null{
 if(item.status!=='active'||item.minutes<=5)return null;
 const relevant=logs.filter(l=>l.commitment_id===item.id && (!item.updated_at || l.day>item.updated_at.slice(0,10)));
 const missed=relevant.filter(l=>l.outcome==='skipped').length;
 const done=relevant.filter(l=>l.outcome==='done').length;
 return missed>=2 && missed>done?Math.max(3,Math.floor(item.minutes/2)):null;
}
