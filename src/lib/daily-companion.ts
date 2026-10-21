/** Evolve 1.7 — a deterministic, explainable daily agenda. No medical advice.
 * Preview selection never mutates commitments or creates completion records. */
export type CompanionLevel='guidato'|'essenziale'|'autonomo';
export type CompanionCommitment={id:string;kind:string;title:string;description:string;minutes:number;cadence:'once'|'daily'|'weekly';days:number[];status:string;created_at?:string};
export type CompanionLog={commitment_id:string;day:string;outcome:'done'|'skipped'};
export type CompanionFocus={title:string;action_text:string;minutes:number}|null;
export type CompanionInput={
 day:string;commitments:CompanionCommitment[];logs:CompanionLog[];
 onceDoneIds:string[];focus:CompanionFocus;focusLogged:boolean;
 checkin:{energy:number;available_minutes:number}|null;
 support:CompanionLevel;areas:string[];onboarded:boolean;goal:string;
 workoutToday:boolean|null;mealSaved:boolean|null;
 defaultMinutes:number;
};
export type AgendaTask={
 id:string;source:'coach'|'focus'|'suggestion';kind:string;title:string;details:string;minutes:number;
 why:string;href:string;label:string;commitmentId?:string;canLog:boolean;
};
export type AgendaResult={tasks:AgendaTask[];allApproved:number;hiddenApproved:number;dueMinutes:number;
 done:number;skipped:number;minutesAvailable:number;extraSuggested:number;message:string};
const weekday=(day:string)=>{const wd=new Date(`${day}T12:00:00Z`).getUTCDay();return wd===0?7:wd;};
export function isCompanionDue(c:CompanionCommitment,day:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 if(c.cadence==='weekly')return c.days.includes(weekday(day));
 return c.cadence==='daily'||c.cadence==='once';
}
const tools:Record<string,string>={allenamento:'/allenamento',alimentazione:'/mealprep',routine:'/routine',percorso:'/percorsi',scenario:'/scenari',azione:'/piano'};
const safeMinutes=(n:number,min=1)=>Number.isFinite(n)?Math.max(min,Math.min(120,Math.round(n))):15;

export function createAgenda(input:CompanionInput,settings?:{minutes?:number;lowEnergy?:boolean}):AgendaResult{
 const minutesAvailable=safeMinutes(settings?.minutes??input.checkin?.available_minutes??input.defaultMinutes,5);
 const lowEnergy=Boolean(settings?.lowEnergy)||((input.checkin?.energy??5)<=2);
 const logsToday=input.logs.filter(l=>l.day===input.day);
 const completed=new Set(logsToday.filter(x=>x.outcome==='done').map(x=>x.commitment_id));
 const skipped=new Set(logsToday.filter(x=>x.outcome==='skipped').map(x=>x.commitment_id));
 const alreadyLogged=new Set(logsToday.map(x=>x.commitment_id));
 const due=input.commitments.filter(c=>c.status==='active'&&isCompanionDue(c,input.day)&&
  !(c.cadence==='once'&&input.onceDoneIds.includes(c.id)));
 const pending=due.filter(c=>!alreadyLogged.has(c.id));
 const approved:AgendaTask[]=pending.map(c=>({
  id:`coach:${c.id}`,source:'coach',kind:c.kind,title:c.title,details:c.description,
  minutes:safeMinutes(c.minutes),why:'Attività approvata nel tuo Piano, prevista per oggi.',
  href:tools[c.kind]??'/piano',label:'Apri lo strumento',commitmentId:c.id,canLog:true
 }));
 if(input.focus&&!input.focusLogged)approved.push({id:'focus',source:'focus',kind:'focus',title:input.focus.title,
  details:input.focus.action_text,minutes:safeMinutes(input.focus.minutes),
  why:'Priorità settimanale che hai già scelto e approvato.',href:'/revisione',
  label:'Apri la revisione',canLog:false});
 // Shorter, already-approved items are easier to fit into a limited day.
 approved.sort((a,b)=>a.minutes-b.minutes || a.title.localeCompare(b.title,'it'));
 const selected:AgendaTask[]=[];let remaining=minutesAvailable;
 const maxCards=lowEnergy?1:3;
 for(const item of approved){
  if(selected.length>=maxCards)break;
  if(item.minutes<=remaining){selected.push(item);remaining-=item.minutes;}
 }
 const hiddenApproved=approved.length-selected.length;
 const optional:AgendaTask[]=[];
 if(input.support!=='autonomo'&&input.onboarded&&hiddenApproved===0&&!lowEnergy&&selected.length<maxCards){
  if(input.areas.includes('alimentazione')&&input.mealSaved===false&&!due.some(t=>t.kind==='alimentazione'))optional.push({
   id:'optional:meals',source:'suggestion',kind:'alimentazione',title:'Organizza un pranzo pratico',
   details:'Scegli un pasto semplice e prepara la lista della spesa, se ti è utile.',minutes:5,
   why:'Hai scelto Alimentazione. Non risulta un piano pasti salvato per questa settimana: potresti averlo organizzato altrove.',
   href:'/mealprep',label:'Apri meal prep',canLog:false
  });
  if(input.areas.includes('allenamento')&&input.workoutToday===false&&
     !due.some(t=>t.kind==='allenamento')&&!lowEnergy)optional.push({
   id:'optional:training',source:'suggestion',kind:'allenamento',title:'Valuta un momento di movimento',
   details:'Consulta le attività che conosci già oppure scegli riposo. Non è una prescrizione.',minutes:5,
   why:'Hai scelto Allenamento. Oggi non risultano sessioni nel diario, ma potresti esserti già mosso.',
   href:'/allenamento',label:'Apri allenamento',canLog:false
  });
 }
 const suggestionCap=input.support==='guidato'?1:input.support==='essenziale'?1:0;
 for(const item of optional.slice(0,suggestionCap)){
  if(selected.length>=maxCards||item.minutes>remaining)break;
  selected.push(item);remaining-=item.minutes;
 }
 let message='Le attività sono una proposta di organizzazione, non nuovi obblighi.';
 if(hiddenApproved>0)message=`${hiddenApproved} ${hiddenApproved===1?'impegno approvato non entra':'impegni approvati non entrano'} nel tempo scelto: restano nel Piano, senza essere segnati come saltati.`;
 else if(lowEnergy)message='Hai indicato poca energia: mostro al massimo una priorità. Recuperare è una scelta valida.';
 else if(selected.length===0&&approved.length===0)message='Non risultano impegni del Coach da svolgere oggi. Puoi usare Evolve solo quando ne hai bisogno.';
 else if(selected.length===0)message='Gli impegni previsti richiedono più minuti di quelli disponibili. Puoi rivederli nel Piano.';
 return {tasks:selected,allApproved:approved.length,hiddenApproved,dueMinutes:approved.reduce((sum,t)=>sum+t.minutes,0),
  done:completed.size,skipped:skipped.size,
  minutesAvailable,extraSuggested:selected.filter(x=>x.source==='suggestion').length,message};
}
