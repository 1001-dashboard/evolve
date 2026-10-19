import type {LifeProfile,DailyState,LifeScenario,DailyAction} from './types';
import type {Program,Checkin} from '@/lib/programs';
import type {PlanProfile} from '@/lib/personal-plan';
import {taskForDay} from '@/lib/personal-plan';
export type TodayCard={key:string;label:string;detail:string;minutes:number;kind:'habit'|'program'|'scenario';href?:string;completed?:boolean;completion_note?:string;reason:string};
export const scenarioTemplates: Omit<LifeScenario,'id'|'user_id'|'created_at'|'updated_at'|'active'>[] = [
 {title:'La prima sera in un luogo nuovo',context:'casa',trigger_text:'Se mi sento spaesato o solo dopo essere arrivato in un posto nuovo',response_text:'Allora riconosco che è una sensazione temporanea, preparo un pasto semplice e seguo il contatto familiare che ho concordato.',small_step:'Esco per conoscere una strada vicina o un servizio utile, se le condizioni lo consentono.',fallback_text:'Se sono molto stanco, sistemo un angolo della casa e faccio una breve pausa.'},
 {title:'Una richiesta difficile al banco',context:'lavoro',trigger_text:'Se un cliente parla velocemente e non comprendo tutto',response_text:'Allora chiedo gentilmente di ripetere più lentamente, confermo ciò che ho capito e verifico i dati prima di rispondere.',small_step:'Ripeto ad alta voce una frase utile in spagnolo o inglese.',fallback_text:'Chiedo aiuto a un collega o utilizzo una procedura scritta.'},
 {title:'Pressione durante il turno',context:'lavoro',trigger_text:'Se più problemi operativi arrivano contemporaneamente',response_text:'Allora verifico prima le urgenze che riguardano sicurezza, clienti e operatività, poi assegno un responsabile alla prossima azione.',small_step:'Scrivo le prime due priorità e una decisione verificabile.',fallback_text:'Chiedo supporto e riduco le attività non urgenti.'},
 {title:'Salto una routine',context:'benessere',trigger_text:'Se non riesco a svolgere la routine che avevo previsto',response_text:'Allora evito di recuperare tutto insieme. Rivedo l’ostacolo e preparo una versione più semplice per il prossimo momento.',small_step:'Riduco l’azione a due minuti di preparazione.',fallback_text:'Riprogrammo senza interpretare l’episodio come un fallimento.'},
];
/** Rules-based, day-stable plan. Never invents health prescriptions or alcohol taper schedules. */
export function makeDayPlan(args:{profile:LifeProfile|null;state:DailyState|null;programs:Program[];plans:PlanProfile[];logs:Checkin[];scenarios:LifeScenario[];actions:DailyAction[];day:string}):TodayCard[]{
 const {profile,state,programs,plans,logs,scenarios,actions,day}=args;
 const budget=Math.min(state?.available_minutes??profile?.minutes_per_day??15,profile?.minutes_per_day??60);
 const low=Boolean(state && (state.energy<=2 || state.mood<=2));
 const cards:TodayCard[]=[];
 const recorded=new Map(actions.filter(x=>x.status==='done').map(x=>[x.action_key,x.note??'']));
 const anchor=profile?.morning_anchor?.trim();
 cards.push({key:'start-day',label:low?'Partenza leggera':'Un minuto per orientarti',
  detail:low?'Scegli una priorità essenziale e un ritmo sostenibile. Non cercare di recuperare tutto.':
  anchor?`Dopo «${anchor.slice(0,90)}», scegli il piccolo passo più utile della giornata.`:'Scegli una priorità concreta e il momento in cui affrontarla.',
  minutes:2,kind:'habit',completed:recorded.has('start-day'),completion_note:recorded.get('start-day'),reason:'Routine di avvio, senza sovraccaricare la giornata.'});
 let used=2;
 const available=programs.filter(x=>x.status==='active');
 const todays=available.map(program=>{
  const plan=plans.find(x=>x.program_id===program.id);
  const task=plan?taskForDay(plan,day,logs.filter(x=>x.program_id===program.id)):null;
  if(!task || logs.some(x=>x.program_id===program.id && x.day===day)) return null;
  return {program,plan:plan!,task};
 }).filter((x):x is NonNullable<typeof x>=>Boolean(x));
 // No more than one scheduled program on a crowded day; individual programs remain available in Piano.
 if(!low && todays.length>0){
  const selected=todays.find(x=>x.task.minutes<=Math.max(5,budget-used-2))??todays[0];
  const minutes=Math.min(selected.plan.minutes,selected.task.minutes,profile?.support_style==='graduale'?10:60);
  if(used+minutes<=budget){
   cards.push({key:'program-'+selected.program.id,label:selected.task.title,detail:selected.task.instruction,
    minutes,kind:'program',href:'/routine',reason:`Dal percorso «${selected.program.title}».`});
   used+=minutes;
  }
 }
 const activeScenarios=scenarios.filter(x=>x.active).sort((a,b)=>{
  const pref=(v:LifeScenario)=>profile?.life_areas.includes(v.context==='casa'?'relazioni':v.context==='altro'?'crescita':v.context==='benessere'?'benessere':'lavoro')?0:1;
  return pref(a)-pref(b)||a.id.localeCompare(b.id);
 });
 if(activeScenarios.length && used+3<=budget){
  const ordinal=Number(day.replace(/-/g,''));
  const scenario=activeScenarios[ordinal%activeScenarios.length];
  cards.push({key:'scenario-'+scenario.id,label:'Allenati a una situazione',detail:`Se ${scenario.trigger_text.replace(/^se\s+/i,'')}, allora: ${scenario.response_text.replace(/^allora\s+/i,'')}`,
   minutes:3,kind:'scenario',href:`/scenari?scenario=${scenario.id}`,completed:recorded.has('scenario-'+scenario.id),completion_note:recorded.get('scenario-'+scenario.id),reason:`Scenario «${scenario.title}».`});
  used+=3;
 }
 if(used+2<=budget && cards.length<3){
   cards.push({key:'end-day',label:'Revisione di fine giornata',detail:'Nota una cosa che ha funzionato e un ostacolo. Domani puoi correggere il piano senza ricominciare da zero.',
     minutes:2,kind:'habit',completed:recorded.has('end-day'),completion_note:recorded.get('end-day'),reason:'Consolidamento di ciò che hai imparato.'});
 }
 return cards.slice(0,3);
}
