/** Evolve 1.3 - deterministic and explainable recommendations. No health diagnosis. */
export type ReviewFacts={
  checkinDays:number;lowEnergyDays:number;workoutCount:number;workoutMinutes:number;
  plannedMeals:number|null;coachDone:number;coachSkipped:number;coachScheduled:number;
};
export type Suggestion={id:'organizzazione'|'recupero'|'movimento'|'pasti'|'continuita';title:string;action:string;reason:string;minutes:number};
export function weekMonday(day:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Invalid ISO date');
 const d=new Date(`${day}T12:00:00.000Z`);
 if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==day)throw Error('Invalid date');
 const iso=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-(iso-1));return d.toISOString().slice(0,10);
}
export function daysBefore(day:string,count:number):string{
 const d=new Date(`${day}T12:00:00.000Z`);d.setUTCDate(d.getUTCDate()-count);return d.toISOString().slice(0,10);
}
/** Always phrase missing recordings as unknown, not inactivity. */
export function suggestions(f:ReviewFacts):Suggestion[]{
 const out:Suggestion[]=[];
 if(f.lowEnergyDays>=2 && f.checkinDays>=2)out.push({id:'recupero',title:'Alleggerire la giornata',action:'Quando noto poca energia, scelgo una priorità e preparo una versione minima delle altre attività.',reason:`Hai registrato energia bassa in ${f.lowEnergyDays} check-in questa settimana.`,minutes:3});
 if(f.coachSkipped>=2)out.push({id:'organizzazione',title:'Ripartire dagli ostacoli',action:'Quando salto un impegno, individuo l’ostacolo e preparo un’alternativa realistica da 5 minuti.',reason:`Hai registrato ${f.coachSkipped} impegni rimandati, da esaminare senza giudizio.`,minutes:5});
 if(f.plannedMeals===null || f.plannedMeals===0)out.push({id:'pasti',title:'Organizzare i pranzi',action:'Scelgo due pranzi rapidi che condividono ingredienti e preparo la lista della spesa.',reason:f.plannedMeals===null?'Non risulta un piano pasti registrato per questa settimana.':'Il piano salvato non contiene ancora pranzi.',minutes:10});
 if(f.workoutCount===0)out.push({id:'movimento',title:'Preparare un’occasione di movimento',action:'Scelgo un’attività già familiare e verifico quando posso praticarla in modo adeguato alle mie condizioni.',reason:'Non risultano sessioni registrate negli ultimi sette giorni; potresti esserti mosso senza registrarle.',minutes:5});
 if(!out.length)out.push({id:'continuita',title:'Consolidare ciò che funziona',action:'Identifico una routine utile della settimana e preparo quando ripeterla.',reason:`Hai registrato ${f.workoutCount} allenamenti e ${f.coachDone} impegni completati.`,minutes:5});
 if(f.checkinDays<3&&!out.some(x=>x.id==='organizzazione'))out.push({id:'organizzazione',title:'Rendere visibili le giornate',action:'Al mattino registro energia e tempo disponibile per capire quali routine sono realistiche.',reason:`Hai inserito ${f.checkinDays} check-in negli ultimi sette giorni. Sono pochi per riconoscere una tendenza.`,minutes:2});
 return out.slice(0,4);
}
export function totalWithMinutes(input:{duration_minutes?:unknown}[]):number{
 return input.reduce((sum,item)=>{const n=Number(item.duration_minutes);return sum+(Number.isFinite(n)&&n>0&&n<=600?n:0);},0);
}

export type DayGuidance={title:string;detail:string;href:string;label:string};
export function dayGuidance(i:{energy:number|null;workoutToday:boolean;mealSaved:boolean;coachDue:number;coachDone:number}):DayGuidance{
 if(i.energy!==null&&i.energy<=2)return {title:'Giornata con poca energia',detail:'Dai priorità all’essenziale e valuta il recupero. Puoi rimandare gli impegni non urgenti senza recuperare tutto insieme.',href:'/giornata',label:'Rivedi le priorità'};
 if(i.workoutToday)return {title:'Hai già registrato movimento oggi',detail:'Osserva come recuperi e organizza il resto della giornata. Le calorie stimate non vengono trasformate automaticamente in pasti aggiuntivi.',href:'/allenamento',label:'Apri il diario'};
 if(!i.mealSaved)return {title:'Pranzi ancora da organizzare',detail:'Un breve meal prep può farti risparmiare decisioni e tempo. Valuta due pasti con ingredienti condivisi.',href:'/mealprep',label:'Prepara i pasti'};
 if(i.coachDue>i.coachDone)return {title:'Concentrati su un impegno',detail:'Hai già un piano concordato. Se il tempo è poco, parti da un solo passo realistico.',href:'/piano',label:'Vedi gli impegni'};
 return {title:'Mantieni ciò che funziona',detail:'Oggi non risultano nuove priorità urgenti dai dati registrati. Puoi consolidare una routine o dedicarti al recupero.',href:'/revisione',label:'Rivedi la settimana'};
}
