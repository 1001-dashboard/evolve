import type {Category,Exercise} from './programs';

export type GuideField={label:string;placeholder:string;maxLength?:number};
export type ExerciseGuide={intro:string;steps:[string,string,string];example?:string;fields:GuideField[];required:number;quickRequired:number;prompt:string};

/** All guidance is written for action; no generated clinical advice or invented measurements. */
export function guideFor(exercise:Exercise,category:Category):ExerciseGuide {
  if(exercise.key==='c1a')return {
    intro:'Non devi risolvere il trasferimento. Devi soltanto separarlo in tre pezzi gestibili.',
    steps:['Scegli tre aspetti concreti: per esempio casa, lavoro, famiglia o lingua.','Per ciascuno scrivi che cosa sai già e quale informazione ti manca.','Rileggi le tre righe. Cerchia mentalmente quella che puoi verificare per prima.'],
    example:'CASA — So il mio budget; devo verificare gli affitti annuali.\nLAVORO — Conosco il ruolo; devo capire le procedure locali.\nFAMIGLIA — So quando partirei; devo concordare orari per sentirci.',
    fields:[{label:'1 · Primo aspetto',placeholder:'Casa — So che… / Devo verificare…',maxLength:110},{label:'2 · Secondo aspetto',placeholder:'Lavoro — So che… / Devo verificare…',maxLength:110},{label:'3 · Terzo aspetto',placeholder:'Famiglia — So che… / Devo verificare…',maxLength:110}],
    required:3,quickRequired:1,prompt:'Scrivi qui le tue risposte: saranno salvate con il check-in.'
  };
  if(exercise.key==='c1b')return {
    intro:'Prendi UNA preoccupazione e separa ciò che conosci da ciò che stai ipotizzando.',
    steps:['Scrivi una preoccupazione specifica.','Trasforma il pensiero in due righe: FATTO e IPOTESI.','Indica una verifica concreta che puoi fare, senza decidere tutto oggi.'],
    example:'Preoccupazione: non gestirò la stazione. Fatto: ho già coordinato team nel noleggio. Ipotesi: non riuscirò a gestire il nuovo contesto. Verifica: chiedere come funziona il supporto del team.',
    fields:[{label:'Fatto verificato',placeholder:'Ciò che so con certezza…',maxLength:120},{label:'Ipotesi o dubbio',placeholder:'Ciò che temo, ma non so ancora…',maxLength:120},{label:'Una verifica possibile',placeholder:'Per scoprirlo posso…',maxLength:120}],required:3,quickRequired:1,prompt:'Non devi avere già una risposta definitiva.'
  };
  if(exercise.key==='c1c')return {
    intro:'Non parti da zero: riconosci una risorsa che possiedi già.',
    steps:['Pensa a una competenza, esperienza o persona utile.','Scrivila in modo specifico, non generico.','Indica quando potrai usarla.'],
    example:'Ho già gestito picchi di noleggio e coordinato operatori; posso usare questa esperienza per strutturare il briefing mattutino.',
    fields:[{label:'La mia risorsa',placeholder:'So già fare / ho già affrontato…',maxLength:160},{label:'Quando la userò',placeholder:'Mi sarà utile quando…',maxLength:160}],required:2,quickRequired:1,prompt:'Basta anche una sola risorsa concreta.'
  };
  if(exercise.key==='l1a')return {
    intro:'Oggi non serve studiare grammatica. Ti alleni su frasi professionali pronte all’uso.',
    steps:['Leggi le cinque frasi dell’esempio a voce alta.','Ripetile lentamente, cercando di pronunciarle senza leggere.','Immagina di essere al desk e pronuncia almeno una frase come a un cliente.'],
    example:'1. Buenos días, ¿en qué puedo ayudarle?\n2. ¿Tiene su permiso de conducir?\n3. Voy a comprobar su reserva.\n4. El coche está en el aparcamiento.\n5. ¿Tiene alguna pregunta?',
    fields:[{label:'La frase che voglio ricordare (facoltativo)',placeholder:'Scrivi qui la frase più utile o difficile…',maxLength:180}],required:0,quickRequired:0,prompt:'È un esercizio a voce: non devi compilare nulla per segnarlo come fatto.'
  };
  if(category==='lingue')return {
    intro:'Questo è un allenamento pratico: parla ad alta voce, anche se commetti errori.',
    steps:['Leggi la situazione descritta nell’esercizio.','Simulala a voce almeno due volte; alla seconda evita di leggere.','Individua una parola o un passaggio da migliorare domani.'],
    example:'Se è un check-in: saluta, chiedi la patente, descrivi dove si trova l’auto e come riconsegnarla.',
    fields:[{label:'Parola o frase da ripassare (facoltativo)',placeholder:'Mi sono bloccato su…',maxLength:180}],required:0,quickRequired:0,prompt:'Dopo aver parlato ad alta voce, registra l’esito. La nota è facoltativa.'
  };
  if(category==='benessere')return {
    intro:'L’obiettivo non è essere perfetto, ma trovare una versione dell’azione che puoi ripetere.',
    steps:['Scegli quando farai l’attività e prepara il necessario.','Esegui l’azione descritta, a un’intensità adeguata alle tue condizioni.','Chiediti se potresti ripeterla in una giornata normale.'],
    example:'Se devi camminare: dopo il caffè metti le scarpe, esci per 8 minuti a passo comodo e rientra.',
    fields:[{label:'Quando o come l’ho fatta (facoltativo)',placeholder:'Dopo colazione, per qualche minuto…',maxLength:180}],required:0,quickRequired:0,prompt:'Non occorrono misurazioni o una nota: conta la pratica eseguita.'
  };
  if(category==='alcol')return {
    intro:'Questa attività serve a osservare i comportamenti, non a stabilire riduzioni di consumo.',
    steps:['Osserva quando compare l’abitudine o il desiderio.','Prendi nota del contesto, senza giudicarti.','Valuta se un’alternativa non alcolica o un confronto sanitario potrebbe aiutarti.'],
    example:'Dopo cena, mentre guardo la TV, mi viene voglia di una birra: riconosco il momento senza cambiare bruscamente le quantità.',
    fields:[{label:'Un’osservazione (facoltativa)',placeholder:'Ho notato che…',maxLength:180}],required:0,quickRequired:0,prompt:'Evita dati che non vuoi conservare. Non eseguire riduzioni improvvise in caso di possibile dipendenza.'
  };
  if(category==='lavoro')return {
    intro:'Ragiona come in una vera esercitazione operativa: scegli, motiva, verifica.',
    steps:['Leggi lo scenario e identifica il problema principale.','Scrivi quale decisione prenderesti per prima e perché.','Controlla quale informazione o indicatore ti servirebbe per confermare la scelta.'],
    example:'In una stazione con più consegne imminenti, verifico prima le auto pronte e i tempi di ciascuna consegna; poi assegno priorità al team.',
    fields:[{label:'La mia prima azione',placeholder:'Come responsabile farei per prima cosa…',maxLength:180},{label:'Come ne verifico il risultato',placeholder:'Controllerei…',maxLength:150}],required:2,quickRequired:1,prompt:'Metti per iscritto almeno una decisione operativa.'
  };
  if(category==='cambiamento')return {
    intro:'Riduci una grande decisione a un’informazione o un passo che puoi gestire.',
    steps:['Leggi il compito e scegli un solo ambito da affrontare.','Scrivi ciò che sai e ciò che manca, evitando previsioni assolute.','Definisci un prossimo gesto concreto e fattibile.'],
    example:'Casa: conosco il budget; posso contattare un proprietario per verificare disponibilità e durata del contratto.',
    fields:[{label:'Quello che so o posso fare',placeholder:'Un elemento concreto…',maxLength:170},{label:'Prossimo passo',placeholder:'La prima verifica che posso fare…',maxLength:160}],required:2,quickRequired:1,prompt:'Usa queste risposte come un piccolo piano, non come un giudizio su te stesso.'
  };
  return {
    intro:'Non serve cambiare tutto: rendi il comportamento abbastanza semplice da poter iniziare.',
    steps:['Identifica il momento preciso in cui svolgerai il compito.','Esegui una versione piccola e concreta dell’attività descritta.','Verifica cosa ti ha aiutato a partire e cosa puoi ripetere.'],
    example:'Dopo il caffè del mattino dedico due minuti all’attività scelta, prima di aprire il telefono.',
    fields:[{label:'Quando lo farò o cosa ho provato',placeholder:'Dopo… per qualche minuto…',maxLength:180}],required:1,quickRequired:0,prompt:'Scrivi una frase breve; nella versione minima puoi limitarti alla prova pratica.'
  };
}

export function countAnswered(guide:ExerciseGuide|null,answers:Record<string,string>):number {
  return guide?.fields.filter(f=>Boolean((answers[f.label]||'').trim())).length??0;
}
export function requiredAnswers(guide:ExerciseGuide|null,shortVersion:boolean):number {
  return guide?(shortVersion?guide.quickRequired:guide.required):0;
}
export function formatGuidedNote(guide:ExerciseGuide|null,answers:Record<string,string>,comment:string):string {
  const result=guide?.fields.filter(f=>Boolean((answers[f.label]||'').trim())).map(f=>`${f.label}: ${answers[f.label].trim()}`)??[];
  if(comment.trim()) result.push(`Nota: ${comment.trim()}`);
  return result.join(' | ');
}
