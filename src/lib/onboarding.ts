/** Evolve 1.5: a single onboarding for every adult user, no gendered paths. */
export const AREAS = [
  {id:'abitudini',title:'Abitudini e costanza',description:'Organizzazione, piccoli passi, motivazione'},
  {id:'benessere',title:'Benessere quotidiano',description:'Riposo, equilibrio, consapevolezza'},
  {id:'allenamento',title:'Allenamento e movimento',description:'Attività flessibili e diario'},
  {id:'alimentazione',title:'Alimentazione e spesa',description:'Pasti pratici, meal prep, risparmio'},
  {id:'lavoro',title:'Lavoro e sfide',description:'Competenze, leadership, cambiamenti'},
  {id:'apprendimento',title:'Imparare qualcosa',description:'Lingue, studio e pratica'},
  {id:'relazioni',title:'Famiglia e relazioni',description:'Tempo, comunicazione e legami'},
  {id:'organizzazione',title:'Tempo e priorità',description:'Meno sovraccarico, più chiarezza'},
] as const;
export type Area = typeof AREAS[number]['id'];
export type SupportLevel = 'guidato'|'essenziale'|'autonomo';
export type OnboardingInput = {areas:Area[];priority_areas:Area[];goal:string;obstacle:string;minutes:5|10|15|20|30|45|60;anchor:string;support_level:SupportLevel;confidence:1|2|3|4|5};
export type StoredOnboarding = OnboardingInput & {user_id:string;approval_token:string;started_on:string;updated_at:string};
export type StarterItem = {kind:'azione'|'routine'|'allenamento'|'alimentazione'|'percorso'|'scenario';title:string;description:string;minutes:number;cadence:'daily'|'weekly';days:number[];time_window:'flessibile'};

const templates:Record<Area, Omit<StarterItem,'minutes'>>={
 abitudini:{kind:'routine',title:'Una piccola abitudine ripetibile',description:'Scegli un gesto semplice collegato a un momento già esistente della giornata. Registra cosa lo ha reso possibile; se salti, riparti senza recuperare tutto.',cadence:'daily',days:[],time_window:'flessibile'},
 benessere:{kind:'routine',title:'Un minuto per orientarti',description:'Fai una breve pausa per riconoscere come stai e scegliere una priorità fattibile. È una riflessione pratica, non una valutazione psicologica.',cadence:'weekly',days:[2,5],time_window:'flessibile'},
 allenamento:{kind:'allenamento',title:'Muoviti con un’attività a tua scelta',description:'Scegli un movimento già conosciuto e compatibile con le tue condizioni. Registra durata e sforzo nel diario Allenamento; se hai sintomi o limitazioni chiedi una valutazione professionale.',cadence:'weekly',days:[2,5],time_window:'flessibile'},
 alimentazione:{kind:'alimentazione',title:'Prepara pasti semplici per la settimana',description:'Apri Meal prep, scegli pranzi pratici e genera una lista della spesa dagli ingredienti. Non servono restrizioni drastiche né contare ogni caloria.',cadence:'weekly',days:[1],time_window:'flessibile'},
 lavoro:{kind:'azione',title:'Prepara una situazione professionale',description:'Identifica un ostacolo prevedibile e scrivi un piano se-allora. Prova una frase o un primo passo pratico, poi annota cosa miglioreresti.',cadence:'weekly',days:[2,4],time_window:'flessibile'},
 apprendimento:{kind:'percorso',title:'Esercitati su una competenza',description:'Scegli una sola micro-competenza e allenala con un esercizio pratico. Segna cosa hai capito e cosa riprendere la prossima volta.',cadence:'weekly',days:[2,4],time_window:'flessibile'},
 relazioni:{kind:'azione',title:'Dedica attenzione a una relazione',description:'Scegli un gesto di ascolto o un momento di qualità compatibile con la tua giornata. Nessun obbligo di condividere dettagli personali.',cadence:'weekly',days:[3],time_window:'flessibile'},
 organizzazione:{kind:'routine',title:'Scegli una priorità sostenibile',description:'Identifica la singola attività che renderebbe utile la giornata. Prepara una versione minima per quando tempo ed energia scarseggiano.',cadence:'daily',days:[],time_window:'flessibile'},
};
/** Stable preview and server-side source of truth; user approves explicit indices. */
export function starterPlan(input:Pick<OnboardingInput,'areas'|'priority_areas'|'minutes'|'anchor'|'obstacle'>):StarterItem[]{
 // Only explicitly active priorities generate a starter plan; all other interests remain in the profile.
 const selected=input.priority_areas.filter(a=>input.areas.includes(a)).slice(0,3);
 const mins=input.minutes;
 return selected.map((area,i)=>{
  const v=templates[area];
  const minutes=Math.max(3,Math.min(mins, area==='allenamento'?15:area==='alimentazione'?15:area==='apprendimento'?10:5));
  const cadence=(selected.length>1&&mins<=10&&v.cadence==='daily')?'weekly':v.cadence;
  const days=cadence==='weekly'?[[1,4],[2,5],[3,6]][i]:[];
  const extra=(i===0&&input.anchor.trim()?` Momento suggerito: dopo «${input.anchor.trim().slice(0,80)}».`:'')+(i===0&&input.obstacle.trim()?` Se compare l’ostacolo «${input.obstacle.trim().slice(0,120)}», prova prima una versione di due minuti.`:'');
  return {...v,minutes,cadence,days,title:area==='alimentazione'&&mins<=10?'Scegli un pranzo e prepara la lista spesa':v.title,description:(v.description+extra).slice(0,650)};
 });
}
/** Data are observational, never a health or psychological assessment. */
export function autonomyInsight(completed:number,skipped:number,confidence:number,daysSinceStart:number,activeDays=5){
 const logged=completed+skipped;
 const rate=logged>0?Math.round(completed/logged*100):null;
 const suggest=daysSinceStart>=14 && logged>=5 && activeDays>=4 && rate!==null && rate>=80 && confidence>=4;
 return {logged,rate,suggest,reason:suggest?'Hai registrato diverse azioni e riferisci buona autonomia: puoi provare a ricevere meno suggerimenti facoltativi.':daysSinceStart<14?'Prima osserviamo almeno due settimane, senza fretta.':(logged<5 || activeDays<4)?'Ci sono ancora poche giornate con attività registrate per proporre meno guida in base ai dati.':'Se vuoi, puoi continuare con il livello attuale o regolarlo manualmente.'};
}
export function guidanceCards<T extends {kind:string;key:string}>(cards:T[],level:SupportLevel):T[]{
 if(level==='guidato')return cards;
 // Don't alter Coach commitments; these are only optional Life Planner cards.
 if(level==='autonomo')return [];
 const main=cards.find(c=>c.kind==='program')??cards.find(c=>c.key==='start-day')??cards[0];
 return main?[main]:[];
}
export const levelDescription:Record<SupportLevel,string>={
 guidato:'Piccoli suggerimenti facoltativi, oltre agli impegni che hai approvato.',
 essenziale:'Solo un suggerimento facoltativo alla volta, con gli impegni concordati invariati.',
 autonomo:'Nessun suggerimento quotidiano facoltativo. Piani, diari e Coach restano disponibili quando li vuoi.'
};
