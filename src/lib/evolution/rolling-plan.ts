/** Evolve 1.9.4 — read-only planning projection. It never saves a workout, shifts
 * a commitment, adjusts calorie goals or equates food/drink with exercise debt.
 * Recompute from the source-of-truth diaries every time data changes.
 */
export type MovementLog = {id:string;occurred_at:string;activity:string;duration_minutes:number;effort:number};
export type FoodLog = {eaten_at:string;meal_type:string;kcal:number|null;entry_kind?:string|null};
export type CheckinLog = {day:string;energy:number;available_minutes:number;sleep_hours:number|null};
export type DailyProfile = {birth_date:string|null;height_cm:number|null;weight_kg:number|null};
export type WeightLog = {day:string;weight_kg:number};
export type TrainingPrefs = {preferred_activity:string;target_sessions:number;preferred_minutes:number}|null;
export type RollingInput = {today:string;profile:DailyProfile|null;weights:WeightLog[];training:MovementLog[];
 food:FoodLog[];checkins:CheckinLog[];preferences:TrainingPrefs;dailyReference:number|null;
 availability:{profile:boolean;weights:boolean;training:boolean;food:boolean;checkins:boolean;preferences:boolean;reference:boolean}};
export type RollingDay = {day:string;dateLabel:string;kind:'already'|'recovery'|'option'|'reassess';title:string;detail:string;
 minutes:number|null;isPreview:boolean};
export type RollingAssessment = {age:number|null;height:number|null;weight:number|null;weightSource:string|null;
 bmi:number|null;bmiCategory:string|null;normalBmiWeightBand:{min:number;max:number}|null;nonObeseUpperKg:number|null};
export type RollingResult = {today:string;assessment:RollingAssessment;days:RollingDay[];
 workouts7:number;minutes7:number;workoutsPrevious7:number;foodToday:number;kcalToday:number;
 unknownKcal:number;reference:number|null;difference:number|null;beerToday:number;currentCheckin:CheckinLog|null;
 notes:string[];explanation:string};
const dateRe=/^\d{4}-\d{2}-\d{2}$/;
export function validDay(s:string){if(!dateRe.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function shiftDay(s:string,n:number):string{if(!validDay(s))throw Error('Data non valida');const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function dateInRome(iso:string):string|null{const d=new Date(iso);if(!Number.isFinite(d.getTime()))return null;const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const v=(k:string)=>parts.find(p=>p.type===k)?.value??'';const r=`${v('year')}-${v('month')}-${v('day')}`;return validDay(r)?r:null;}
export function ageAt(birth:string|null,day:string):number|null{if(!birth||!validDay(birth)||!validDay(day)||birth>day)return null;const [y,m,d]=birth.split('-').map(Number),[yr,mr,dr]=day.split('-').map(Number);const age=yr-y-(mr<m||(mr===m&&dr<d)?1:0);return age>=18&&age<=110?age:null;}
const round1=(v:number)=>Math.round(v*10)/10;
export function assess(input:RollingInput):RollingAssessment{
 const height=input.profile?.height_cm??null;
 const newest=input.weights.filter(w=>validDay(w.day)&&w.day<=input.today&&Number.isFinite(w.weight_kg)&&w.weight_kg>0).sort((a,b)=>b.day.localeCompare(a.day))[0];
 const storedWeight=input.profile?.weight_kg??null;
 const weight=newest?.weight_kg??storedWeight;
 const validHeight=height!=null&&Number.isFinite(height)&&height>=90&&height<=250?height:null;
 const validWeight=weight!=null&&Number.isFinite(weight)&&weight>=25&&weight<=450?weight:null;
 const age=ageAt(input.profile?.birth_date??null,input.today);
 if(validHeight===null||validWeight===null)return {age,height:validHeight,weight:validWeight,weightSource:newest?.day??(validWeight!=null?'profilo':null),bmi:null,bmiCategory:null,normalBmiWeightBand:null,nonObeseUpperKg:null};
 const h=validHeight/100,bmi=validWeight/(h*h);
 const category=bmi<18.5?'Sottopeso':bmi<25?'Fascia BMI usualmente nella norma':bmi<30?'Sovrappeso (categoria BMI)':bmi<35?'Obesità classe I (categoria BMI)':bmi<40?'Obesità classe II (categoria BMI)':'Obesità classe III (categoria BMI)';
 return {age,height:validHeight,weight:validWeight,weightSource:newest?.day??'profilo',bmi:round1(bmi),bmiCategory:category,
  normalBmiWeightBand:{min:round1(18.5*h*h),max:round1(24.9*h*h)},nonObeseUpperKg:round1(30*h*h)};
}
const label=(day:string)=>new Date(day+'T12:00:00Z').toLocaleDateString('it-IT',{timeZone:'UTC',weekday:'long',day:'numeric',month:'short'});
const finite=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n);
function weekStart(day:string){const wd=new Date(day+'T12:00:00Z').getUTCDay()||7;return shiftDay(day,1-wd);}
export function buildRollingPlan(input:RollingInput):RollingResult{
 if(!validDay(input.today))throw Error('Giorno non valido');
 const recent=input.training.filter(x=>{
  const d=dateInRome(x.occurred_at);return d!=null&&d<=input.today&&d>=shiftDay(input.today,-13)&&finite(x.duration_minutes)&&x.duration_minutes>0;
 });
 const sorted=[...recent].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at));
 const week7=recent.filter(x=>(dateInRome(x.occurred_at)??'')>=shiftDay(input.today,-6));
 const prev7=recent.filter(x=>{const d=dateInRome(x.occurred_at);return d!=null&&d>=shiftDay(input.today,-13)&&d<shiftDay(input.today,-6)});
 const todaySessions=sorted.filter(x=>dateInRome(x.occurred_at)===input.today);
 const yesterdaySessions=sorted.filter(x=>dateInRome(x.occurred_at)===shiftDay(input.today,-1));
 const thisWeek=sorted.filter(x=>(dateInRome(x.occurred_at)??'')>=weekStart(input.today));
 const checkin=input.checkins.find(c=>c.day===input.today)??null;
 const food=input.food.filter(x=>dateInRome(x.eaten_at)===input.today);
 const known=food.filter(x=>finite(x.kcal)&&Number(x.kcal)>=0);
 const kcalToday=Math.round(known.reduce((n,x)=>n+Number(x.kcal),0));
 const ref=finite(input.dailyReference)&&Number(input.dailyReference)>=800&&Number(input.dailyReference)<=6000?Number(input.dailyReference):null;
 const notes:string[]=[];
 if(!input.availability.training)notes.push('Diario allenamenti non disponibile: nessuna deduzione sul movimento.');
 if(!input.availability.food)notes.push('Diario alimentare non disponibile: il conteggio non è completo.');
 if(!input.availability.checkins)notes.push('Check-in non disponibili: recupero e tempo da verificare manualmente.');
 if(!input.availability.profile)notes.push('Profilo non disponibile: niente analisi del BMI.');
 if(!input.availability.weights)notes.push('Registro pesate non disponibile: si usa soltanto l’eventuale dato nel Profilo.');
 if(!input.availability.preferences)notes.push('Preferenze allenamento non disponibili: il prossimo passo non viene personalizzato sulla frequenza.');
 if(food.length>known.length)notes.push('Alcuni pasti non hanno kcal stimate: il totale è parziale.');
 if(ref===null)notes.push('Riferimento calorico non ancora confermato: nessun limite dedotto automaticamente.');
 const prefs=input.preferences;
 const effortHighYesterday=yesterdaySessions.some(w=>finite(w.effort)&&w.effort>=8);
 const lowEnergy=checkin!=null&&checkin.energy<=2;
 const lowSleep=checkin?.sleep_hours!=null&&checkin.sleep_hours<5;
 const baseMinutes=checkin?.available_minutes??prefs?.preferred_minutes??15;
 const minutes=Math.max(5,Math.min(60,Math.round(baseMinutes)));
 let kind:RollingDay['kind']='reassess',title='Parti dal tuo livello di energia',detail='Consulta come stai e scegli una possibilità leggera o il riposo.',duration:null|number=null;
 if(todaySessions.length){
  kind='already';title='Allenamento già registrato oggi';
  detail=`Risultano ${todaySessions.length} sessioni svolte oggi. Puoi valutare recupero, idratazione e attività tranquille: non serve aggiungerne altre per compensare l’alimentazione.`;
 }else if(lowEnergy||lowSleep||effortHighYesterday){
  kind='recovery';title='Oggi valuta recupero o movimento leggero';
  detail=lowEnergy?'Hai indicato energia bassa. Se ti va, una passeggiata facile di pochi minuti è un’opzione; anche riposare è appropriato.':lowSleep?'Hai annotato poco sonno. Controlla come ti senti e valuta riposo o mobilità tranquilla.':'Ieri hai registrato una sessione molto impegnativa. Valuta recupero o una breve passeggiata piacevole.';
  duration=Math.min(10,minutes);
 }else if(!input.availability.training){
  kind='reassess';title='Verifica lo storico prima di pianificare';detail='Non posso leggere gli allenamenti registrati: non presumo che tu sia inattivo.';
 }else if(prefs&&thisWeek.length>=prefs.target_sessions){
  kind='recovery';title='Hai raggiunto la frequenza scelta';
  detail=`Hai registrato ${thisWeek.length} sessioni nella settimana corrente: il riferimento scelto è ${prefs.target_sessions}. Oggi puoi scegliere riposo o una camminata comoda, senza aumentare il carico.`;
  duration=Math.min(15,minutes);
 }else if(prefs){
  kind='option';title='Un’opzione per il prossimo allenamento';
  duration=Math.min(minutes,Math.max(5,Math.min(60,prefs.preferred_minutes)));
  detail=`Se hai recuperato bene, puoi valutare ${duration} minuti di ${prefs.preferred_activity}, a una difficoltà familiare. Verifica eventuali sintomi o limitazioni prima di iniziare; il riposo resta possibile.`;
 }else{
  kind='reassess';title='Scegli una direzione, senza perdere lo storico';
  detail='Puoi fissare un riferimento di allenamento in Allenamento. Per oggi valuta una passeggiata comoda, mobilità o recupero in base alle energie.';
 }
 const today:RollingDay={day:input.today,dateLabel:'Oggi',kind,title,detail,minutes:duration,isPreview:false};
 const tomorrow=shiftDay(input.today,1),after=shiftDay(input.today,2);
 const t1:RollingDay={day:tomorrow,dateLabel:label(tomorrow),kind:'reassess',
  title:todaySessions.length||kind==='option'?'Possibile giornata di recupero':'Nuova verifica, poi un movimento a scelta',
  detail:todaySessions.length?'Se recuperi bene, una passeggiata tranquilla di 10–15 minuti può essere piacevole; altrimenti riposo. Evolve rivaluterà l’energia di domani.':kind==='option'?'Se oggi deciderai di allenarti, domani puoi valutare una passeggiata facile o riposo. Se non ti alleni, la proposta sarà rivalutata senza segnare nulla come saltato.':'Se le energie torneranno buone, puoi valutare 10–15 minuti di camminata facile o un’attività già familiare. Riposo sempre possibile.',
  minutes:null,isPreview:true};
 const t2:RollingDay={day:after,dateLabel:label(after),kind:'reassess',title:prefs?'Riconsidera la prossima sessione':'Mantieni il movimento sostenibile',
  detail:prefs?`Se starai bene e non avrai già raggiunto la frequenza scelta, potrai valutare ${prefs.preferred_activity} per un tempo compatibile con la giornata; altrimenti camminata leggera o riposo. Il piano si ricalcolerà con i nuovi dati.`:'Se ti sentirai bene, scegli una camminata comoda, mobilità dolce oppure riposo. Nessun allenamento futuro viene creato automaticamente.',minutes:null,isPreview:true};
 const assessment=assess(input);
 let explanation='Le proposte dipendono dalle sessioni registrate e dalle risorse dichiarate, non da calorie da “bruciare”.';
 if(week7.length>0)explanation=`Negli ultimi 7 giorni risultano ${week7.length} sessioni per ${Math.round(week7.reduce((s,x)=>s+x.duration_minutes,0))} minuti. Le proposte non sono obblighi e non compensano pasti o birre.`;
 return {today:input.today,assessment,days:[today,t1,t2],workouts7:week7.length,minutes7:Math.round(week7.reduce((s,x)=>s+x.duration_minutes,0)),
  workoutsPrevious7:prev7.length,foodToday:food.length,kcalToday,unknownKcal:food.length-known.length,
  reference:ref,difference:ref==null||food.length===0||known.length!==food.length||!input.availability.food?null:Math.round(ref-kcalToday),beerToday:food.filter(x=>x.entry_kind==='beer').length,
  currentCheckin:checkin,notes,explanation};
}
