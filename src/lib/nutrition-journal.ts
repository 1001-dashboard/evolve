/** Evolve 1.9.2 — facts, uncertainty and user-controlled nutrition reference.
 * Never infer that an unlogged meal was skipped, and never prescribe a calorie deficit.
 */
export type MealType='colazione'|'pranzo'|'cena'|'spuntino'|'altro';
export type CalorieSource='etichetta'|'ai_stima'|'stima_personale'|'non_disponibile';
export type FoodEntry={
 id:string;eaten_at:string;meal_type:MealType;description:string;
 entry_kind?:'food'|'beer';beer_ml?:500|660|null;
 kcal:number|null;kcal_low:number|null;kcal_high:number|null;
 calorie_source:CalorieSource;note:string;
};
export type FoodSettings={daily_reference_kcal:number|null;avoided_foods:string};
export type FoodSummary={date:string;count:number;knownCount:number;unknownCount:number;
 estimatedTotal:number;estimatedLow:number;estimatedHigh:number;reference:number|null;remaining:number|null;aboveReference:number|null;partial:boolean};
export function romeDate(instant:string):string|null{
 const d=new Date(instant);if(Number.isNaN(d.getTime()))return null;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d);
 const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function summarizeFood(entries:FoodEntry[],date:string,reference:number|null):FoodSummary{
 const rows=entries.filter(e=>romeDate(e.eaten_at)===date);
 const known=rows.filter(e=>e.kcal!=null&&Number.isFinite(e.kcal)&&e.kcal>=0);
 const estimatedTotal=Math.round(known.reduce((n,e)=>n+Number(e.kcal),0));
 const estimatedLow=Math.round(known.reduce((n,e)=>n+(e.kcal_low??Number(e.kcal)),0));
 const estimatedHigh=Math.round(known.reduce((n,e)=>n+(e.kcal_high??Number(e.kcal)),0));
 const validRef=reference!=null&&Number.isFinite(reference)&&reference>=800&&reference<=6000?reference:null;
 const delta=validRef==null?null:Math.round(validRef-estimatedTotal);
 return {date,count:rows.length,knownCount:known.length,unknownCount:rows.length-known.length,
  estimatedTotal,estimatedLow,estimatedHigh,reference:validRef,remaining:delta==null?null:Math.max(0,delta),
  aboveReference:delta==null?null:Math.max(0,-delta),partial:known.length!==rows.length};
}
export type MaintenanceParams={age:number;heightCm:number;weightKg:number;
 equation:'plus5'|'minus161';activity:'sedentaria'|'leggera'|'moderata'};
/** Mifflin-St Jeor adult maintenance screening estimate, NOT a prescribed intake.
 * Biological equation constants are chosen for this calculation, not gender identity.
 * Input remains in the browser; only a separately confirmed reference is saved.
 */
export function maintenanceEstimate(input:MaintenanceParams):{center:number;low:number;high:number}|null{
 const {age,heightCm,weightKg,equation,activity}=input;
 if(!Number.isFinite(age)||age<18||age>100||!Number.isFinite(heightCm)||heightCm<120||heightCm>230||
    !Number.isFinite(weightKg)||weightKg<30||weightKg>350||
    !['plus5','minus161'].includes(equation)||!['sedentaria','leggera','moderata'].includes(activity))return null;
 const bmr=10*weightKg+6.25*heightCm-5*age+(equation==='plus5'?5:-161);
 const multiplier={sedentaria:1.2,leggera:1.375,moderata:1.55}[activity];
 const raw=bmr*multiplier;
 if(!Number.isFinite(raw)||raw<=0)return null;
 const round=(v:number)=>Math.round(v/50)*50;
 return {center:round(raw),low:round(raw*.9),high:round(raw*1.1)};
}
export type HungerOption={id:string;title:string;description:string;roughKcal:string;keywords:string[]};
const ideas:HungerOption[]=[
 {id:'yogurt',title:'Yogurt e frutta',description:'Yogurt bianco e un frutto; aggiungi cereali se desideri un pasto più sostanzioso.',roughKcal:'circa 160–280 kcal, secondo porzioni e prodotto',keywords:['yogurt','latticini','latte']},
 {id:'hummus',title:'Pane e hummus',description:'Pane e crema di ceci, con pomodori o carote.',roughKcal:'circa 230–380 kcal, secondo le quantità',keywords:['ceci','legumi','glutine','pane']},
 {id:'frutta',title:'Frutta e frutta secca',description:'Un frutto insieme a una porzione di frutta secca; sazietà e gusto senza preparazione.',roughKcal:'circa 180–320 kcal, secondo le quantità',keywords:['frutta','frutta secca','noci','mandorle']},
 {id:'uova',title:'Toast con uova',description:'Uova cotte bene e pane, con verdure se ti va.',roughKcal:'circa 230–370 kcal, secondo le quantità',keywords:['uova','glutine','pane']},
 {id:'pasto',title:'Un pasto semplice',description:'Se è ora di un pasto o senti fame intensa, scegli una combinazione che ti soddisfi: cereale, proteina e verdura.',roughKcal:'La quota varia: inserisci ingredienti e quantità per stimarla.',keywords:[]},
];
export type HungerContext={hourInRome?:number;lastLoggedMeal?:MealType|null};
export function hungerSuggestions(avoidedFood:string,limit=3,context:HungerContext={}):HungerOption[]{
 const excluded=avoidedFood.toLocaleLowerCase('it').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
 const acceptable=ideas.filter(i=>!i.keywords.some(k=>excluded.some(x=>x===k||x.includes(k)||k.includes(x))));
 // Keep the full-meal choice available; a calorie reference must never block eating.
 const nonMeal=acceptable.filter(i=>i.id!=='pasto').slice(0,Math.max(0,limit-1));
 const mealMoment=(context.hourInRome!=null&&((context.hourInRome>=11&&context.hourInRome<15)||(context.hourInRome>=18&&context.hourInRome<22)));
 // Prefer a substantial option near main meal times or after a logged snack; never bar food by kcal.
 return (mealMoment||context.lastLoggedMeal==='spuntino'?[ideas[ideas.length-1],...nonMeal]:[...nonMeal,ideas[ideas.length-1]]).slice(0,limit);
}
export function approx(n:number|null):string{return n==null?'—':Math.round(n).toLocaleString('it-IT')+' kcal';}

/** Values for a regular beer are indicative. Use label kcal per 100 ml when known. */
export const REGULAR_BEER_KCAL_PER_100ML=43;
export function beerKcal(ml:500|660,kcalPer100ml:number=REGULAR_BEER_KCAL_PER_100ML):number|null{
 if(![500,660].includes(ml)||!Number.isFinite(kcalPer100ml)||kcalPer100ml<15||kcalPer100ml>120)return null;
 return Math.round(ml*kcalPer100ml/100);
}
export type MovementObservation={occurred_at:string;activity:string;duration_minutes:number};
export type MovementSummary={sessions7:number;minutes7:number;sessionsToday:number;minutesToday:number};
/** Descriptive only: observed activity does NOT add kcal to a person's daily food allowance. */
export function summarizeMovement(rows:MovementObservation[],today:string):MovementSummary{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today))return {sessions7:0,minutes7:0,sessionsToday:0,minutesToday:0};
 const from=new Date(today+'T12:00:00Z');from.setUTCDate(from.getUTCDate()-6);
 const first=from.toISOString().slice(0,10);
 const valid=rows.filter(r=>{
  const date=romeDate(r.occurred_at);
  return date!=null&&date>=first&&date<=today&&Number.isFinite(Number(r.duration_minutes))&&Number(r.duration_minutes)>0;
 });
 const daily=valid.filter(x=>romeDate(x.occurred_at)===today);
 const minutes=(v:MovementObservation[])=>Math.round(v.reduce((a,x)=>a+Number(x.duration_minutes),0));
 return {sessions7:valid.length,minutes7:minutes(valid),sessionsToday:daily.length,minutesToday:minutes(daily)};
}
export type BeerSummary={count:number;kcalKnown:number};
export function summarizeBeer(entries:FoodEntry[],today:string):BeerSummary{
 const beers=entries.filter(e=>e.entry_kind==='beer'&&romeDate(e.eaten_at)===today);
 return {count:beers.length,kcalKnown:Math.round(beers.reduce((a,e)=>a+(typeof e.kcal==='number'?e.kcal:0),0))};
}
