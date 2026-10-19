// Il piano e' deliberatamente deterministico: l'AI non prescrive interventi sanitari.
// Le attivita' suggerite sono esercizi di base, non un piano clinico.
export type Category = 'benessere' | 'alcol' | 'lingue' | 'lavoro' | 'cambiamento' | 'altro';
export type Outcome = 'done' | 'difficult' | 'skipped';

export type Program = {
  id: string;
  category: Category;
  title: string;
  objective: string | null;
  level: number;
  level_since: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
};
export type Checkin = {
  id: string;
  program_id: string;
  day: string;
  outcome: Outcome;
  exercise_key: string;
  note: string | null;
};
export type Exercise = {
  key: string;
  title: string;
  description: string;
  minutes: number;
  fallback: string;
  verify: string;
};

export const categories: {id: Category; label: string; intro: string; example: string}[] = [
  {id:'benessere',label:'Benessere e peso',intro:'Movimento leggero, alimentazione consapevole, continuita\u0300.',example:'Costruire abitudini che sostengano il mio peso e il mio benessere'},
  {id:'alcol',label:'Rapporto con l\u2019alcol',intro:'Osserva le occasioni, riconosci gli automatismi, scegli alternative.',example:'Rivedere il mio rapporto con la birra'},
  {id:'lingue',label:'Lingue e sicurezza',intro:'Esercizi pratici a difficolta\u0300 progressiva.',example:'Parlare spagnolo nel lavoro quotidiano'},
  {id:'lavoro',label:'Leadership e lavoro',intro:'Simulazioni operative, priorita\u0300, gestione imprevisti.',example:'Gestire una stazione con piu\u0300 autonomia'},
  {id:'cambiamento',label:'Affrontare una novita\u0300',intro:'Riduci le incognite con verifiche ed esperienze concrete.',example:'Prepararmi al trasferimento e adattarmi'},
  {id:'altro',label:'Un obiettivo personale',intro:'Un primo passo concreto per una nuova abitudine.',example:'Costruire una routine sostenibile'},
];

const x = (key:string,title:string,description:string,minutes:number,fallback:string,verify:string):Exercise => ({key,title,description,minutes,fallback,verify});

const catalog: Record<Category, Exercise[][]> = {
  benessere: [
    [x('w1a','Una passeggiata breve','Cammina a passo comodo in un momento che puoi ripetere domani.',8,'Esci per 3 minuti.','Hai trovato un orario realistico?'),x('w1b','Prepara il momento della camminata','Scegli luogo, scarpe e orario: rendi la prossima uscita semplice da iniziare.',5,'Metti le scarpe vicino alla porta.','Quale ostacolo hai eliminato?'),x('w1c','Osserva un pasto','Registra con parole semplici cosa hai mangiato e quando avevi fame, senza contare calorie.',3,'Nota un solo pasto.','Cosa hai osservato?')],
    [x('w2a','Muoviti dopo una routine','Collega 10 minuti di camminata a un\u2019azione che fai ogni giorno.',10,'Cammina 5 minuti.','Il collegamento alla routine ha aiutato?'),x('w2b','Prepara un\u2019alternativa alimentare','Individua un\u2019opzione semplice e soddisfacente da tenere disponibile per un pasto.',6,'Scrivi solo un\u2019opzione.','Ti sembra sostenibile?'),x('w2c','Una pausa attiva','Interrompi un periodo sedentario con movimento leggero.',10,'Alzati e muoviti per 3 minuti.','Quando potresti ripeterlo?')],
    [x('w3a','Consolida il movimento','Ripeti 15 minuti di attivita\u0300 che senti adeguata alle tue condizioni.',15,'Fai 7 minuti.','Quanto e\u0300 stato impegnativo?'),x('w3b','Pianifica due occasioni','Scegli quando muoverti in due momenti dei prossimi giorni.',7,'Pianifica un momento.','Hai scelto momenti realistici?'),x('w3c','Rivedi una scelta abituale','Trova un piccolo aggiustamento nella preparazione dei pasti, senza divieti rigidi.',8,'Annota solo l\u2019idea.','Lo vorresti ripetere?')],
    [x('w4a','Costruisci autonomia','Scegli e svolgi da solo un\u2019attivita\u0300 piacevole di 20 minuti.',20,'Riduci a 10 minuti.','Lo rifaresti volontariamente?'),x('w4b','Rendi stabile l\u2019abitudine','Prepara una soluzione per un giorno impegnativo.',8,'Scrivi una versione di 3 minuti.','Sapresti riprendere dopo un imprevisto?'),x('w4c','Rivedi la settimana','Riconosci cosa e\u0300 stato facile e cosa migliorare senza giudicarti.',8,'Scrivi una sola cosa che ha funzionato.','Quale abitudine vuoi mantenere?')]
  ],
  alcol: [
    [x('a1a','Osserva senza giudizio','Annota quando emerge il desiderio di bere, il contesto e le sensazioni. Non cambiare bruscamente le quantita\u0300.',3,'Registra un solo momento.','Hai individuato un\u2019occasione ricorrente?'),x('a1b','Riconosci l\u2019automatismo','Individua un momento tipico associato alla birra e cosa lo precede.',4,'Scrivi un solo trigger.','E\u0300 un momento, un luogo o un\u2019emozione?'),x('a1c','Individua un\u2019alternativa','Elenca una bevanda analcolica o un\u2019attivita\u0300 che potresti scegliere in un\u2019occasione abituale.',4,'Scegli un\u2019alternativa.','Ti sembra realistica?')],
    [x('a2a','Prepara un\u2019alternativa','Rendi disponibile un\u2019opzione analcolica gradita per un\u2019occasione futura, senza imporre riduzioni.',5,'Annota cosa acquistare.','E\u0300 semplice da usare?'),x('a2b','Cambia il contesto','Identifica una situazione abituale e una piccola modifica dell\u2019ambiente che puo\u0300 aiutarti a scegliere.',5,'Scrivi una modifica.','Cosa puoi controllare?'),x('a2c','Osserva la risposta','Prendi nota di come e\u0300 andato un momento in cui hai valutato un\u2019alternativa.',4,'Registra soltanto il contesto.','Che cosa hai imparato?')],
    [x('a3a','Prepara un piano per un\u2019occasione','Descrivi una situazione sociale e una scelta che rispetti i tuoi obiettivi e la tua sicurezza.',6,'Scegli una situazione.','Di cosa avresti bisogno?'),x('a3b','Attivita\u0300 alternativa','Prova una pausa, una passeggiata leggera o una bevanda diversa in un momento appropriato.',8,'Prepara soltanto un\u2019alternativa.','E\u0300 stata utile?'),x('a3c','Riconosci i segnali','Osserva se il consumo e\u0300 legato a disagio, abitudine o contesto, senza autodiagnosi.',5,'Annota un\u2019osservazione.','Serve parlarne con un professionista?')],
    [x('a4a','Rivedi il percorso','Individua gli accorgimenti che hanno aiutato e quelli da modificare.',8,'Elenca un solo accorgimento.','Quale scelta vuoi mantenere?'),x('a4b','Proteggi la continuita\u0300','Pianifica come affrontare una ricorrenza o un\u2019occasione a rischio.',7,'Individua un solo supporto.','Chi o cosa puo\u0300 aiutarti?'),x('a4c','Verifica i limiti del fai-da-te','Valuta se serve un confronto con il medico per un piano personalizzato.',5,'Annota una domanda per il medico.','Hai sufficienti informazioni per procedere in sicurezza?')]
  ],
  lingue: [
    [x('l1a','Cinque frasi utili','Ripeti ad alta voce 5 frasi in spagnolo o inglese legate al tuo lavoro.',7,'Pronuncia 2 frasi.','Riesci a dirle senza leggere?'),x('l1b','Presentati in 30 secondi','Descrivi ruolo, esperienza e una tua responsabilita\u0300 in un\u2019altra lingua.',6,'Di\u0300 solo nome e ruolo.','Hai esitato su qualche parola?'),x('l1c','Ascolta e ripeti','Ascolta un breve dialogo professionale e ripeti tre frasi.',8,'Ripeti una frase.','Quale parola vuoi allenare?')],
    [x('l2a','Simula un check-in','Descrivi a voce il ritiro di un veicolo, i documenti e le condizioni di noleggio.',10,'Simula il saluto e la richiesta documenti.','Quale passaggio e\u0300 stato difficile?'),x('l2b','Rispondi a tre domande','Simula risposte su carburante, franchigia e restituzione.',9,'Rispondi a una domanda.','Cosa hai dovuto cercare?'),x('l2c','Spiega una procedura','Illustra una consegna in modo chiaro in spagnolo o inglese.',10,'Spiega solo il primo passaggio.','Le istruzioni sono comprensibili?')],
    [x('l3a','Gestisci un reclamo','Simula un cliente che contesta un danno: ascolta, chiarisci e proponi il passo operativo.',12,'Prepara solo due frasi iniziali.','Hai mantenuto un tono chiaro?'),x('l3b','Spiega un imprevisto','Descrivi un ritardo o un cambio veicolo e un\u2019alternativa praticabile.',12,'Spiega soltanto il ritardo.','Sei riuscito a essere preciso?'),x('l3c','Allena una telefonata','Simula una telefonata con un fornitore su una vettura non pronta.',12,'Prepara l\u2019apertura della chiamata.','Quali parole mancavano?')],
    [x('l4a','Simulazione completa','Unisci accoglienza, problema e risoluzione in una conversazione di 15 minuti.',15,'Riduci a una parte di 5 minuti.','Quale parte gestisci meglio?'),x('l4b','Briefing al team','Prepara e pronuncia un breve briefing operativo in lingua straniera.',12,'Di\u0300 tre priorita\u0300.','Quali concetti riesci a esprimere con sicurezza?'),x('l4c','Valuta un caso complesso','Spiega una decisione operativa e le sue motivazioni in modo comprensibile.',15,'Racconta una sola decisione.','Cosa migliorare nella prossima simulazione?')]
  ],
  lavoro: [
    [x('o1a','Definisci tre priorita\u0300','Immagina l\u2019apertura della stazione: scrivi le tre verifiche piu\u0300 importanti.',7,'Scrivi una priorita\u0300.','Quale rischio riduce?'),x('o1b','Chiarisci una responsabilita\u0300','Scegli un compito del responsabile stazione e definisci cosa significa svolgerlo bene.',6,'Nomina il compito.','Come riconosci un buon risultato?'),x('o1c','Disegna il flusso','Descrivi i passaggi minimi dalla riconsegna all\u2019auto pronta.',10,'Descrivi 3 passaggi.','Dove sono i punti critici?')],
    [x('o2a','Gestisci la priorita\u0300','Hai 4 vetture da preparare e 2 operatori: ordina le attivita\u0300 e spiega perche\u0301.',12,'Scegli la prima attivita\u0300.','Hai usato criteri espliciti?'),x('o2b','Simula un briefing','Prepara un briefing di 5 minuti su consegne, criticita\u0300 e responsabilita\u0300.',10,'Definisci 2 priorita\u0300.','Quale informazione manca?'),x('o2c','Pensa ai KPI','Scegli un indicatore utile e spiega come lo misureresti davvero.',9,'Nomina un indicatore.','E\u0300 misurabile?')],
    [x('o3a','Gestisci un imprevisto','Simula un guasto, un arrivo in anticipo e personale assente; stabilisci una sequenza di risposta.',15,'Affronta solo il guasto.','Quale decisione prenderesti per prima?'),x('o3b','Dai feedback operativo','Simula un colloquio costruttivo su una procedura non rispettata.',12,'Prepara la frase iniziale.','Quale comportamento concreto vuoi modificare?'),x('o3c','Analizza una causa','Applica tre perche\u0301 a un ritardo ricorrente, senza fermarti alla colpa individuale.',14,'Scrivi il primo perche\u0301.','Cosa puoi davvero verificare?')],
    [x('o4a','Esercitazione completa','Crea un piano di turno, gestisci due imprevisti e definisci un report finale.',20,'Gestisci solo il piano iniziale.','Quali trade-off hai considerato?'),x('o4b','Retrospettiva settimanale','Scegli un processo da mantenere e uno da migliorare.',12,'Descrivi un solo cambiamento.','Come ne verificherai l\u2019impatto?'),x('o4c','Piano di continuita\u0300','Definisci come la stazione puo\u0300 funzionare durante la tua assenza.',15,'Descrivi un backup.','I ruoli sono chiari?')]
  ],
  cambiamento: [
    [x('c1a','Dividi il cambiamento','Scrivi tre aspetti distinti del trasferimento: cosa sai e cosa resta da verificare.',7,'Scrivi un solo aspetto.','Quale incertezza e\u0300 verificabile?'),x('c1b','Separa fatti e ipotesi','Per una preoccupazione, distingui cio\u0300 che sai da cio\u0300 che immagini.',7,'Scrivi una sola certezza.','Quale dato ti manca?'),x('c1c','Identifica una risorsa','Nomina una competenza o un contatto che puoi gia\u0300 utilizzare.',5,'Trova una risorsa.','Come potrebbe servirti?')],
    [x('c2a','Verifica una condizione concreta','Controlla una condizione pratica importante: alloggio, contratto o logistica.',12,'Annota il prossimo contatto.','Hai ottenuto un fatto nuovo?'),x('c2b','Prepara il primo giorno','Scrivi una semplice scaletta dell\u2019arrivo e dei primi compiti.',10,'Scrivi il primo passaggio.','Che cosa manca per partire?'),x('c2c','Crea un piano B','Definisci una soluzione per un imprevisto realistico e reversibile.',10,'Nomina una persona di supporto.','Che cosa puoi predisporre?')],
    [x('c3a','Esplora il contesto','Individua luoghi e servizi utili nella nuova zona; quando sei sul posto, prova un breve giro.',12,'Salva due punti su una mappa.','Quale incertezza si e\u0300 ridotta?'),x('c3b','Allenati a una conversazione','Simula una domanda pratica in lingua locale: indicazioni, affitto o lavoro.',10,'Prepara una frase.','Dove ti sei bloccato?'),x('c3c','Pianifica un contatto familiare','Stabilisci un momento realistico per sentirvi, compatibile con gli impegni.',6,'Proponi un orario.','E\u0300 sostenibile per tutti?')],
    [x('c4a','Rivedi le evidenze','Scrivi cosa hai scoperto davvero e cosa non puoi ancora sapere.',12,'Riporta un fatto nuovo.','Cambia qualcosa nella decisione?'),x('c4b','Consolida le nuove abitudini','Scegli una routine di adattamento che puoi sostenere senza sacrificare il riposo.',10,'Scegli un solo gesto.','Ti aiuta davvero?'),x('c4c','Valuta il prossimo passo','Definisci criteri e data per rivalutare la scelta, senza imporre una decisione.',12,'Scrivi un criterio.','Quali informazioni ti serviranno?')]
  ],
  altro: [
    [x('g1a','La versione minima','Definisci una versione da 2 minuti dell\u2019abitudine che vuoi costruire.',4,'Scrivi solo quando provarla.','E\u0300 realistica?'),x('g1b','Scegli il segnale','Collega la nuova azione a una cosa che fai gia\u0300.',4,'Individua una routine esistente.','Qual e\u0300 il momento preciso?'),x('g1c','Rimuovi un ostacolo','Prepara l\u2019ambiente affinche\u0301 iniziare sia facile.',5,'Elimina un ostacolo.','Cosa e\u0300 cambiato?')],
    [x('g2a','Ripeti una piccola azione','Esegui per 5 minuti il comportamento scelto.',5,'Bastano 2 minuti.','Dove hai incontrato resistenza?'),x('g2b','Progetta un imprevisto','Decidi cosa farai quando non avrai tempo.',5,'Prepara un piano minimo.','E\u0300 davvero fattibile?'),x('g2c','Osserva il contesto','Prendi nota del momento in cui iniziare e\u0300 piu\u0300 semplice.',5,'Registra un\u2019occasione.','Cosa facilita l\u2019azione?')],
    [x('g3a','Aumenta di poco','Ripeti la tua attivita\u0300 per 10 minuti, se e\u0300 appropriato.',10,'Torna a 3 minuti.','Rimane sostenibile?'),x('g3b','Mantieni la continuita\u0300','Pianifica due occasioni realistiche nei prossimi giorni.',6,'Pianifica una sola occasione.','Quanto sono protetti quegli orari?'),x('g3c','Rivedi un ostacolo','Cambia una condizione che ti ha frenato.',8,'Scrivi un\u2019alternativa.','Il nuovo piano e\u0300 piu\u0300 semplice?')],
    [x('g4a','Agisci in autonomia','Svolgi un\u2019attivita\u0300 senza promemoria aggiuntivi.',12,'Fai 3 minuti.','Quanto hai dovuto sforzarti per iniziare?'),x('g4b','Gestisci una ricaduta','Prepara una ripartenza realistica dopo un giorno saltato.',6,'Scrivi una sola frase pratica.','Che cosa ti fara\u0300 ripartire?'),x('g4c','Mantieni cio\u0300 che funziona','Seleziona la parte piu\u0300 utile della routine e semplifica il resto.',8,'Nomina solo la parte utile.','Quale minimo vuoi conservare?')]
  ]
};

export function exerciseFor(program: Pick<Program,'category'|'level'>, previousCount: number): Exercise {
  const category = Object.prototype.hasOwnProperty.call(catalog, program.category) ? program.category : 'altro';
  const stage = Math.max(0, Math.min(3, program.level - 1));
  const pool = catalog[category][stage];
  return pool[Math.max(0, previousCount) % pool.length];
}

export function romeDay(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'}).format(date);
}

export const isAlcohol = (category: Category) => category === 'alcol';
export const alcoholNotice = 'Se bevi molto o quotidianamente, o hai avuto sintomi di astinenza, non ridurre rapidamente né interrompere senza un confronto medico: l’astinenza può essere pericolosa. Evolve non stabilisce quantità o scalette di riduzione.';
