/** Evolve v0.7: deterministic, auditable suggestions. No clinical inference. */
export type LifeArea='benessere'|'lavoro'|'relazioni'|'crescita';
export type LifeProfile={
 user_id:string;display_name:string;birth_date:string|null;height_cm:number|null;weight_kg:number|null;
 main_goal:string;life_areas:LifeArea[];minutes_per_day:number;preferred_time:'mattina'|'pranzo'|'sera'|'flessibile';
 support_style:'pratico'|'graduale'|'equilibrato';coach_context_opt_in:boolean;morning_anchor:string;current_context:string;updated_at?:string
};
export type DailyState={day:string;energy:number;mood:number;sleep_hours:number|null;available_minutes:number;note:string};
export type Scenario={id:string;title:string;context:'lavoro'|'casa'|'relazioni'|'benessere'|'altro';trigger_text:string;response_text:string;small_step:string;fallback_text:string;active:boolean;created_at:string};
export type DailyAction={day:string;action_key:string;status:'done'|'skipped'};
export type CoachAction={key:string;eyebrow:string;title:string;detail:string;short:string;minutes:number;href?:string;priority:'core'|'optional'};

export const LIFE_AREAS: {id:LifeArea;label:string;description:string}[]=[
 {id:'benessere',label:'Benessere psicofisico',description:'Movimento, recupero, energia e abitudini'},
 {id:'lavoro',label:'Lavoro e competenze',description:'Preparazione, lingue e leadership'},
 {id:'relazioni',label:'Famiglia e relazioni',description:'Tempo, presenza e contatti significativi'},
 {id:'crescita',label:'Crescita personale',description:'Autonomia, organizzazione e nuove capacità'},
];
export const SCENARIO_STARTERS=[
 {title:'Quando mi manca casa',context:'casa',trigger_text:'Se alla sera mi sento lontano dalla famiglia e mi manca casa',response_text:'Riconosco la nostalgia senza usarla per giudicare l’intera esperienza. Valuto un contatto concordato con le persone care.',small_step:'Faccio una piccola attività già pianificata per la serata.',fallback_text:'Se sono molto stanco, mi limito a preparare il giorno successivo.'},
 {title:'Quando mi blocco in spagnolo',context:'lavoro',trigger_text:'Se al banco non capisco subito una richiesta in spagnolo',response_text:'Chiedo con calma di ripetere più lentamente; riassumo ciò che ho compreso prima di decidere.',small_step:'Ripeto una frase professionale utile e registro quale parola non conoscevo.',fallback_text:'Chiedo supporto a un collega per evitare equivoci con il cliente.'},
 {title:'Quando il lavoro mi sovrasta',context:'lavoro',trigger_text:'Se contemporaneamente arrivano clienti, imprevisti e richieste dal team',response_text:'Separo sicurezza, urgenza operativa e attività rinviabili; individuo una priorità e una persona di supporto.',small_step:'Scrivo o comunico le prime due azioni operative.',fallback_text:'Se non ho le informazioni necessarie, faccio una verifica prima di promettere una soluzione.'},
 {title:'Quando salto la routine',context:'benessere',trigger_text:'Se salto un allenamento o un’abitudine prevista',response_text:'Evito di compensare con uno sforzo eccessivo. Identifico che cosa mi ha impedito di farlo.',small_step:'Preparo una versione minima e sostenibile per la prossima occasione.',fallback_text:'Se ho dolore, sintomi o un problema di salute, interrompo l’esercizio e chiedo consiglio appropriato.'},
 {title:'Quando devo prendere una decisione difficile',context:'altro',trigger_text:'Se penso a troppe conseguenze insieme e rimando la decisione',response_text:'Distinguo fatti confermati, cose da verificare e aspetti fuori dal mio controllo.',small_step:'Scelgo una sola informazione verificabile da ottenere oggi.',fallback_text:'Se non ho nuovi elementi, stabilisco quando rivalutare, senza forzare una scelta immediata.'},
] as const;

export function buildLifePlan(profile:LifeProfile|null,state:DailyState|null,scenarios:Scenario[],day:string):CoachAction[]{
 const budget=Math.min(state?.available_minutes??profile?.minutes_per_day??15, profile?.minutes_per_day??15);
 const low=state!==null&&(state.energy<=2||state.mood<=2);
 const anchor=profile?.morning_anchor?.trim()||'la prima pausa della mattina';
 const mindful:CoachAction={key:'start-day',eyebrow:'PARTENZA · 2 MINUTI',title:low?'Parti dalla versione minima':'Prepara la tua giornata',detail:low?'Oggi hai segnalato meno energie: scegli una sola priorità ragionevole e proteggi le pause. Non è una valutazione clinica.':`Dopo ${anchor}, scegli la cosa più utile da fare oggi e il momento in cui iniziarla.`,short:'Nomina una sola priorità e quando iniziarla.',minutes:2,priority:'core'};
 const active=scenarios.filter(s=>s.active);
 const match=active.find(s=>profile?.life_areas?.includes(s.context==='casa'?'relazioni':s.context as LifeArea))??active[0];
 const practice:CoachAction|null=match?{key:`scenario-${match.id}`,eyebrow:'SCENARIO · ALLENAMENTO',title:`Se succede: ${match.title}`,detail:`Immagina per 30 secondi: «${match.trigger_text}». Poi ripeti la risposta: ${match.response_text}`,short:match.small_step,minutes:low?3:Math.min(6,Math.max(3,budget-4)),href:'/scenari',priority:'optional'}:null;
 const review:CoachAction={key:'end-day',eyebrow:'SERA · 2 MINUTI',title:'Consolida un miglioramento',detail:'Che cosa è funzionato oggi? Quale azione vuoi rendere più semplice domani? Puoi annotarlo nel Diario.',short:'Registra una cosa utile appresa oggi.',minutes:2,href:'/diario',priority:'core'};
 // The profile and check-in set a capacity budget; never assign an excessive load.
 const plan=[mindful];
 if(practice&&budget>=8&&!low)plan.push(practice);
 if(budget>=5)plan.push(review);
 return plan;
}
export function checkinSummary(state:DailyState|null):string{
 if(!state)return 'Prima di iniziare, registra come stai e quanto tempo hai davvero.';
 if(state.energy<=2||state.mood<=2)return 'Oggi riduciamo il carico: una priorità e una versione minima.';
 return 'Piano pronto: pochi passi sostenibili, senza riempire la giornata.';
}
export function planMinutes(items:CoachAction[]):number{return items.reduce((n,x)=>n+x.minutes,0)}
