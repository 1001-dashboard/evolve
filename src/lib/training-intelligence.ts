/** Evolve 1.9: explainable training review, never a clinical or performance diagnosis.
 * Observed sessions are not completed Coach tasks. Missing entries are unknown, not inactivity.
 */
export type TrainingFocus='continuita'|'resistenza'|'tecnica'|'equilibrio';
export type TrainingProfile={
 preferred_activity:string;focus:TrainingFocus;target_sessions:number;preferred_minutes:number;
 goal_id:string|null;
};
export type TrainingWorkout={
 id:string;occurred_at:string;activity:string;duration_minutes:number;effort:number;
 distance_m:number|null;
};
export type TrainingCheckin={day:string;energy:number|null;available_minutes:number|null};
export type TrainingInput={today:string;workouts:TrainingWorkout[];profile:TrainingProfile|null;
 checkin:TrainingCheckin|null;support_level:'guidato'|'essenziale'|'autonomo';
 training_priority:boolean};
export type TrainingSummary={sessions:number;minutes:number;days:number;effortAverage:number|null};
export type TrainingNext={kind:'setup'|'start'|'rest'|'review'|'repeat';title:string;reason:string;action:string;href:string;
 minutes:number|null;optional:boolean};
export type TrainingTrend={title:string;detail:string;certainty:'limited'|'observed'};
export type TrainingInsight={today:string;weekStart:string;profile:TrainingProfile|null;
 period7:TrainingSummary;previous7:TrainingSummary;period28:TrainingSummary;
 thisWeek:TrainingSummary;lastWorkout:TrainingWorkout|null;
 topActivities:{activity:string;sessions:number;minutes:number}[];
 comparable:TrainingTrend|null;review:string;next:TrainingNext;
 confidence:'initial'|'developing'|'descriptive';support_level:TrainingInput['support_level'];
};
export function isoDay(day:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const d=new Date(day+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===day;
}
export function dayShift(day:string,n:number):string{
 if(!isoDay(day))throw Error('Data non valida');
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);
}
export function monday(day:string):string{
 const wd=new Date(day+'T12:00:00Z').getUTCDay()||7;return dayShift(day,1-wd);
}
export function romeDate(value:string):string|null{
 const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d);
 const get=(part:string)=>parts.find(p=>p.type===part)?.value??'';
 const day=`${get('year')}-${get('month')}-${get('day')}`;
 return isoDay(day)?day:null;
}
function finite(n:unknown,min:number,max:number):n is number{
 return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
}
function summary(workouts:TrainingWorkout[]):TrainingSummary{
 const minutes=Math.round(workouts.reduce((sum,w)=>sum+w.duration_minutes,0)*10)/10;
 const efforts=workouts.map(w=>w.effort).filter((x):x is number=>finite(x,1,10));
 return {sessions:workouts.length,minutes,days:new Set(workouts.map(w=>romeDate(w.occurred_at))).size,
  effortAverage:efforts.length?Math.round(efforts.reduce((a,b)=>a+b,0)/efforts.length*10)/10:null};
}
/** Only compare same activity and comparable durations and perceived effort.
 * The observed pace difference is descriptive, not proven fitness improvement. */
export function comparableTrend(workouts:TrainingWorkout[],preferredActivity?:string|null):TrainingTrend|null{
 const byActivity=new Map<string,TrainingWorkout[]>();
 for(const w of workouts){
  if(!finite(w.duration_minutes,1,600)||!finite(w.effort,1,10))continue;
  const arr=byActivity.get(w.activity)??[];arr.push(w);byActivity.set(w.activity,arr);
 }
 const order=[...(preferredActivity?[preferredActivity]:[]),...byActivity.keys()].filter((x,i,a)=>a.indexOf(x)===i);
 for(const activity of order){
  const entries=[...(byActivity.get(activity)??[])].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at));
  if(entries.length<4)continue;
  // Inspect pairs of consecutive 2+2 entries; avoid cherry-picking arbitrary historic records.
  const recent=entries.slice(-2),older=entries.slice(-4,-2);
  const all=[...recent,...older];
  if(all.some(w=>!finite(w.distance_m,1,200000)))continue;
  const avgDuration=all.reduce((s,w)=>s+w.duration_minutes,0)/4;
  const maxDurationDelta=Math.max(...all.map(w=>Math.abs(w.duration_minutes-avgDuration)/avgDuration));
  const effortValues=all.map(w=>w.effort);
  if(maxDurationDelta>0.2 || Math.max(...effortValues)-Math.min(...effortValues)>2)continue;
  const pace=(a:TrainingWorkout[])=>a.reduce((s,w)=>s+Number(w.distance_m)/w.duration_minutes,0)/a.length;
  const before=pace(older),after=pace(recent);
  const pct=Math.round((after-before)/before*100);
  if(!Number.isFinite(pct))continue;
  const wording=Math.abs(pct)<=2?'sostanzialmente simile':pct>0?`superiore di circa ${pct}%`:`inferiore di circa ${Math.abs(pct)}%`;
  return {title:`Confronto ${activity}: ritmo ${wording}`,
   detail:'Confronto delle ultime due sessioni con le due precedenti, della stessa attività, con durata e sforzo dichiarato simili. È un’osservazione iniziale, non prova di miglioramento o peggioramento fisico.',
   certainty:'limited'};
 }
 return null;
}
export function trainingReview(input:TrainingInput):TrainingInsight{
 if(!isoDay(input.today))throw Error('Giorno non valido');
 const cutoff=dayShift(input.today,-89);
 const recorded=input.workouts.filter(w=>{
  const d=romeDate(w.occurred_at);
  return d!==null&&d>=cutoff&&d<=input.today&&finite(w.duration_minutes,1,600);
 }).sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at));
 const date=(w:TrainingWorkout)=>romeDate(w.occurred_at)!;
 const span=(from:string,to:string)=>recorded.filter(w=>date(w)>=from&&date(w)<=to);
 const start7=dayShift(input.today,-6),prev7=dayShift(input.today,-13),prevEnd=dayShift(input.today,-7);
 const start28=dayShift(input.today,-27),weekStart=monday(input.today);
 const period7=summary(span(start7,input.today));
 const previous7=summary(span(prev7,prevEnd));
 const period28=summary(span(start28,input.today));
 const thisWeek=summary(span(weekStart,input.today));
 const activities=new Map<string,{activity:string;sessions:number;minutes:number}>();
 for(const w of span(start28,input.today)){
  const row=activities.get(w.activity)??{activity:w.activity,sessions:0,minutes:0};
  row.sessions++;row.minutes+=w.duration_minutes;activities.set(w.activity,row);
 }
 const topActivities=[...activities.values()].sort((a,b)=>b.sessions-a.sessions||b.minutes-a.minutes).slice(0,5)
  .map(x=>({...x,minutes:Math.round(x.minutes*10)/10}));
 const lastWorkout=recorded[0]??null;
 const count=period28.sessions;
 const confidence:TrainingInsight['confidence']=count<4?'initial':count<10?'developing':'descriptive';
 const comparable=comparableTrend(span(start28,input.today),input.profile?.preferred_activity);
 const profile=input.profile;
 const hasLowEnergy=input.checkin?.day===input.today&&finite(input.checkin.energy,1,5)&&input.checkin.energy<=2;
 const lastDay=lastWorkout?date(lastWorkout):null;
 const lastEffort=lastWorkout&&finite(lastWorkout.effort,1,10)?lastWorkout.effort:null;
 const veryRecent=lastDay===input.today||lastDay===dayShift(input.today,-1);
 const highEffortYesterday=lastDay===dayShift(input.today,-1)&&lastEffort!==null&&lastEffort>=8;
 let next:TrainingNext;
 if(!profile){next={kind:'setup',title:'Dai una direzione ai tuoi allenamenti',
  reason:`Risultano ${count} sessioni negli ultimi 28 giorni, ma non hai ancora scelto frequenza e attività di riferimento.`,
  action:'Scegli un obiettivo pratico e quante sessioni vuoi programmare, senza cambiare il tuo diario.',href:'/allenamento',minutes:null,optional:true};}
 else if(!lastWorkout){next={kind:'start',title:'Comincia dal tuo punto di partenza',
  reason:'Non risultano allenamenti nello storico recente. Questo non significa che tu non ti sia allenato.',
  action:`Quando ti è utile, scegli ${profile.preferred_activity} o un’altra attività che conosci e registra la sessione dopo averla svolta.`,
  href:'/allenamento',minutes:null,optional:true};}
 else if(lastDay===input.today){next={kind:'review',title:'Hai già registrato movimento oggi',
  reason:`È presente una sessione di ${lastWorkout.activity} di ${lastWorkout.duration_minutes} minuti oggi.`,
  action:'Puoi dedicarti al recupero oppure semplicemente chiudere Evolve. Non aggiungo altri allenamenti.',href:'/visione',minutes:null,optional:true};}
 else if(hasLowEnergy||highEffortYesterday){next={kind:'rest',title:'Valuta recupero o movimento leggero',
  reason:hasLowEnergy?'Oggi hai indicato poca energia.':`Ieri hai registrato uno sforzo percepito di ${lastEffort}/10.`,
  action:'Riposo o un’attività leggera già familiare sono possibilità valide; evita di aumentare automaticamente il carico.',href:'/giornata',minutes:null,optional:true};}
 else if(thisWeek.sessions>=profile.target_sessions){next={kind:'review',title:'La frequenza scelta risulta già raggiunta',
  reason:`Questa settimana hai registrato ${thisWeek.sessions} sessioni su ${profile.target_sessions} previste.`,
  action:'Rivedi le sensazioni e organizza il recupero, senza trasformare il traguardo in nuovi obblighi.',href:'/visione',minutes:null,optional:true};}
 else if(veryRecent){next={kind:'rest',title:'Considera il recupero prima di ripetere',
  reason:`L’ultima sessione risulta di ieri (${lastWorkout.activity}).`,
  action:'Scegli liberamente se recuperare o svolgere un’attività familiare leggera, secondo come ti senti.',href:'/allenamento',minutes:null,optional:true};}
 else {
  const available=input.checkin?.day===input.today&&finite(input.checkin.available_minutes,5,120)?input.checkin.available_minutes:null;
  const minutes=available?Math.min(profile.preferred_minutes,available):profile.preferred_minutes;
  const focusAction:Record<TrainingFocus,string>={
   continuita:'L’obiettivo è trovare una routine ripetibile, non aumentare il carico.',
   resistenza:'Osserva le sensazioni a parità di attività senza forzare durata o intensità.',
   tecnica:'Concentrati su gesti familiari e tecnica, senza inseguire numeri.',
   equilibrio:'Valuta la sostenibilità con i tuoi altri impegni e il recupero.'
  };
  next={kind:'repeat',title:'Una possibilità per il prossimo allenamento',
   reason:`Questa settimana risultano ${thisWeek.sessions} sessioni su ${profile.target_sessions} che hai scelto. ${available?'Oggi hai indicato '+available+' minuti disponibili.':'Non hai indicato il tempo disponibile oggi.'}`,
   action:`Se ti senti bene, puoi valutare ${minutes} minuti di ${profile.preferred_activity}, mantenendo una difficoltà familiare, oppure scegliere riposo. ${focusAction[profile.focus]} Non è un allenamento prescritto.`,
   href:'/allenamento',minutes,optional:true};
 }
 let review='Le registrazioni sono ancora poche per confronti affidabili. Continua a segnare attività, durata e sforzo solo quando ti è utile.';
 if(period7.sessions>0&&previous7.sessions===0)review=`Negli ultimi sette giorni risultano ${period7.sessions} sessioni. Nei sette giorni precedenti non ci sono registrazioni: questo non prova inattività.`;
 else if(period7.sessions>0&&previous7.sessions>0)review=`Ultimi sette giorni: ${period7.sessions} sessioni e ${period7.minutes} minuti; sette giorni precedenti: ${previous7.sessions} sessioni e ${previous7.minutes} minuti. Un confronto descrittivo, non una misura della tua forma fisica.`;
 else if(period7.sessions===0)review='Nessuna sessione registrata negli ultimi sette giorni. Potresti aver svolto attività senza registrarla; non è un giudizio sulla tua continuità.';
 if(comparable)review+=' '+comparable.title+'. La differenza va interpretata con cautela.';
 return {today:input.today,weekStart,profile,period7,previous7,period28,thisWeek,lastWorkout,
  topActivities,comparable,review,next,confidence,support_level:input.support_level};
}
