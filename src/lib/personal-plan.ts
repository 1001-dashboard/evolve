import type { Category, Exercise } from './programs';
import type { ExerciseGuide } from './exercise-guide';

/** Programmazione trasparente; non stima capacità, diagnosi o risultati clinici. */
export type Focus = 'ibiza' | 'spagnolo' | 'inglese' | 'stazione' | 'trasferimento' | 'movimento' | 'abitudini' | 'osservazione_alcol';
export type PreferredTime = 'mattina' | 'pranzo' | 'sera' | 'flessibile';
export type PlanProfile = {
  program_id: string;
  user_id: string;
  focus: Focus;
  baseline: string;
  obstacle: string;
  success_sign: string;
  minutes: number;
  days_per_week: number;
  confidence: number;
  preferred_time: PreferredTime;
  starts_on: string;
  updated_at: string;
};
export type PlanReview = {
  id: string; program_id: string; period_start: string; confidence: number;
  win: string | null; obstacle: string | null; adjustment: string | null;
};
export type PlanItem = { key: string; title: string; instruction: string; quick: string; check: string; minutes: number; steps: [string,string,string]; example: string; fields: [string,string]; };
export type ScheduledTask = { day: string; task: PlanItem; index: number; done: boolean; }; 

export const focusOptions: { id: Focus; label: string; intro: string }[] = [
  {id:'ibiza',label:'Ibiza: preparazione completa',intro:'Alterna spagnolo, gestione stazione e trasferimento'},
  {id:'spagnolo',label:'Spagnolo operativo',intro:'Desk, clienti e briefing in lingua'},
  {id:'inglese',label:'Inglese professionale',intro:'Dialoghi, telefonate e reclami'},
  {id:'stazione',label:'Gestione stazione e leadership',intro:'Flotta, priorità, persone e imprevisti'},
  {id:'trasferimento',label:'Preparazione del trasferimento',intro:'Casa, lavoro, famiglia e nuove abitudini'},
  {id:'movimento',label:'Movimento e benessere',intro:'Attività semplici e ripetibili'},
  {id:'abitudini',label:'Organizzazione e abitudini',intro:'Costanza e piccole azioni'},
  {id:'osservazione_alcol',label:'Osservazione del consumo di alcol',intro:'Contesti e alternative; nessun piano di riduzione automatica'},
];
export const choicesFor = (category: Category): Focus[] => {
  if (category==='lingue') return ['spagnolo','inglese'];
  if (category==='lavoro') return ['stazione','spagnolo','inglese'];
  if (category==='cambiamento') return ['ibiza','trasferimento','spagnolo','inglese','stazione','abitudini'];
  if (category==='benessere') return ['movimento','abitudini'];
  if (category==='alcol') return ['osservazione_alcol'];
  return ['abitudini','movimento','ibiza','spagnolo','inglese','stazione','trasferimento'];
};

function task(key: string, title: string, instruction: string, quick: string, check: string, minutes: number, steps: [string,string,string], example: string, field1: string, field2: string): PlanItem {
  return { key, title, instruction, quick, check, minutes, steps, example, fields:[field1,field2] };
}

const lessons: Record<Focus, PlanItem[]> = {
  ibiza: [],
  spagnolo: [
    task('es01','Presentati al desk in spagnolo','Pronuncia un saluto, il tuo ruolo e una domanda di accoglienza.','Ripeti soltanto il saluto.','Riesci a parlare senza leggere?',7,['Leggi il modello una volta','Ripeti tre volte a voce','Pronuncia la tua versione senza guardare'],'Buenos días, bienvenido. Soy el responsable de la estación. ¿En qué puedo ayudarle?','La mia frase','Cosa migliorare'),
    task('es02','Check-in: documenti e prenotazione','Simula l’accoglienza di un cliente e la verifica dei documenti.','Allena una sola domanda.','La sequenza è comprensibile?',9,['Saluta il cliente','Chiedi patente e prenotazione','Spiega il passo successivo'],'¿Tiene el permiso de conducir? Voy a comprobar su reserva.','Una frase utile','Una parola difficile'),
    task('es03','Gestisci una richiesta sulla vettura','Spiega in spagnolo come trovare il veicolo e verificare le condizioni.','Spiega soltanto dove si trova l’auto.','Hai dato indicazioni concrete?',10,['Immagina un cliente nuovo','Spiega dove ritirare la vettura','Chiedi se sono necessarie spiegazioni'],'El coche está en la segunda planta. Podemos revisar el estado del vehículo.','La spiegazione','Cosa chiarire'),
    task('es04','Rispondi a una contestazione','Simula un cliente che segnala un addebito inatteso.','Allena le prime due frasi di risposta.','Hai ascoltato e verificato prima di promettere?',12,['Riconosci la preoccupazione','Chiedi gli elementi necessari','Descrivi una verifica concreta'],'Entiendo su preocupación. Vamos a revisar juntos la documentación.','La mia risposta','Informazione da verificare'),
    task('es05','Briefing del team in spagnolo','Dai tre priorità operative per la giornata usando frasi brevi.','Formula una priorità.','Il team capirebbe cosa fare?',10,['Scegli tre priorità reali','Pronunciale in spagnolo','Chiudi chiedendo conferma'],'Hoy tenemos tres prioridades: entregas, limpieza y disponibilidad de vehículos.','Le priorità','La frase da esercitare'),
    task('es06','Telefonata con un fornitore','Comunica un ritardo e chiedi una previsione di disponibilità.','Esercita la prima domanda.','Hai ottenuto o richiesto un dato concreto?',12,['Apri la chiamata e presentati','Descrivi il problema','Chiedi una conferma temporale'],'Buenos días, necesitamos una actualización sobre la entrega del vehículo.','La domanda','Il dato che serve'),
    task('es07','Imprevisto: vettura non pronta','Comunica un disservizio al cliente e presenta opzioni senza inventare garanzie.','Descrivi solamente il problema.','Hai spiegato il prossimo passo?',12,['Descrivi l’imprevisto con chiarezza','Evita promesse non confermate','Proponi una verifica o alternativa reale'],'El vehículo todavía no está listo. Estoy comprobando qué opciones tenemos.','La mia frase','L’alternativa da verificare'),
    task('es08','Simulazione completa da station manager','Unisci accoglienza, richiesta, imprevisto e chiusura in un dialogo.','Fai solo accoglienza e richiesta.','Quali passaggi oggi gestisci in autonomia?',15,['Avvia la conversazione','Gestisci un imprevisto','Chiudi con una conferma e prossimo passo'],'Buenos días. Voy a comprobar su reserva y confirmar la disponibilidad.','Dialogo o punti','Prossimo allenamento'),
  ],
  inglese: [
    task('en01','Presentazione professionale in inglese','Presentati come responsabile operativo di una stazione.','Usa soltanto due frasi.','Riesci a presentarti senza leggere?',7,['Scrivi una frase breve','Dilla ad alta voce tre volte','Prova senza testo'],'Good morning, I manage the rental station and support the team.','La mia frase','Parola da esercitare'),
    task('en02','Accoglienza e documenti','Simula check-in, patente e informazioni sulla prenotazione.','Allena una domanda.','È chiaro cosa chiedi al cliente?',9,['Saluta','Chiedi i documenti','Spiega cosa verifichi'],'Could I see your driving licence and booking confirmation, please?','La domanda','Dubbio linguistico'),
    task('en03','Consegna del veicolo','Spiega dove trovare l’auto e come effettuare i controlli iniziali.','Descrivi solo dove si trova.','Le istruzioni sono semplici?',10,['Indica la posizione','Descrivi un controllo','Chiedi conferma'],'Your vehicle is parked on level two. Let’s check its condition together.','La spiegazione','Termine da studiare'),
    task('en04','Reclamo sul carburante','Gestisci un cliente che contesta il livello di carburante.','Prepara l’apertura.','Hai evitato di assumere responsabilità senza verifiche?',12,['Riconosci il reclamo','Raccogli i dettagli','Spiega la verifica'],'I understand your concern. Let me check the fuel record and the agreement.','La risposta','Prossima verifica'),
    task('en05','Briefing operativo in inglese','Assegna tre priorità al team in un breve briefing.','Assegna un solo compito.','Le responsabilità sono esplicite?',10,['Scegli le priorità','Assegna i responsabili','Ripeti ad alta voce'],'Today we need to prioritise departures, cleaning and vehicle availability.','Le priorità','Punto da migliorare'),
    task('en06','Chiamata con un fornitore','Segnala un problema di preparazione e chiedi tempi di risoluzione.','Fai una domanda.','Hai chiesto una risposta verificabile?',12,['Presentati','Descrivi il problema','Chiedi conferma'],'Could you confirm when the vehicle will be ready?','La domanda','Risposta attesa'),
    task('en07','Doppia priorità al desk','Spiega a un cliente perché stai verificando una soluzione senza promettere tempi.','Usa solo l’apertura.','Hai comunicato in modo professionale?',12,['Descrivi il problema','Comunica la verifica','Conferma che aggiornerai il cliente'],'I’m checking the available options and I’ll update you shortly.','La frase','Cosa semplificare'),
    task('en08','Scenario completo in inglese','Simula dalla consegna al reclamo e alla chiusura.','Fai i primi due passaggi.','Riesci a concludere con il prossimo passo?',15,['Accoglienza e controllo','Gestione problema','Conferma soluzione o verifica'],'Thank you for your patience. Here is what I can confirm right now.','Il mio dialogo','Cosa allenare'),
  ],
  stazione: [
    task('op01','Mappa l’apertura di una stazione','Individua tre controlli indispensabili nei primi 15 minuti.','Scrivi un solo controllo.','Ciascuno riduce un rischio reale?',8,['Immagina l’arrivo in stazione','Scegli tre controlli','Ordina per rischio'],'Verifico consegne previste, vetture pronte e presenze del personale.','I controlli','Il rischio principale'),
    task('op02','Priorità con flotta incompleta','Hai 4 consegne e 2 auto pronte: stabilisci una sequenza di verifica.','Scegli il primo controllo.','Le decisioni si basano su disponibilità verificate?',10,['Identifica le informazioni mancanti','Decidi cosa verificare subito','Comunica una priorità al team'],'Confronto orari di consegna, categorie prenotate e disponibilità effettiva.','Prima decisione','Indicatore da verificare'),
    task('op03','Briefing in 5 minuti','Progetta un briefing operativo: obiettivi, criticità, responsabilità.','Scrivi un punto.','Ogni persona sa il prossimo compito?',10,['Elenca le partenze','Assegna due responsabilità','Fissa il primo controllo di avanzamento'],'Priorità: auto in consegna alle 10; controllo pulizia e carburante.','Briefing','Verifica finale'),
    task('op04','Cliente e operatore in difficoltà','Un cliente attende mentre un collega chiede aiuto: decidi delega e comunicazione.','Definisci la priorità.','Hai dato istruzioni sostenibili?',12,['Metti in ordine le urgenze','Assegna una verifica','Comunica i tempi come ipotesi da confermare'],'Delego il controllo vettura, aggiorno il cliente senza promettere disponibilità.','Decisione','Perché'),
    task('op05','Controllo qualità dei lavaggi','Imposta tre controlli rapidi prima che un’auto sia consegnabile.','Scegli un controllo.','Puoi verificarlo sul campo?',9,['Individua le non conformità','Definisci i controlli','Stabilisci chi conferma'],'Controllo interni, esterni e documentazione fotografica se prevista.','Controlli','Come verificarli'),
    task('op06','Imprevisto di personale','Due addetti assenti durante un picco: ridisegna attività e priorità.','Scegli la prima attività.','Hai protetto sicurezza e servizio?',12,['Valuta carico e copertura','Riduci attività non essenziali','Definisci comunicazioni e supporto'],'Rivedo gli slot di consegna e chiedo supporto dove disponibile.','Nuovo piano','Rischio residuo'),
    task('op07','KPI per la stazione','Scegli due indicatori misurabili che guidino il lavoro quotidiano.','Scegline uno.','Sai dove recuperare i dati?',10,['Scegli un risultato','Definisci formula e fonte','Individua una soglia da verificare'],'Auto pronte entro orario / consegne previste; dato da gestionale.','KPI','Fonte dei dati'),
    task('op08','Giornata simulata completa','Gestisci consegne, ritardi, team, customer care e imprevisto.','Affronta solo i primi 15 minuti.','Hai motivato le priorità e i controlli?',16,['Costruisci il quadro di partenza','Prendi tre decisioni','Definisci una verifica finale'],'Parto da disponibilità, prenotazioni, personale e vincoli operativi.','Piano operativo','Rischio da presidiare'),
  ],
  trasferimento: [
    task('tr01','Separa i quattro temi del trasferimento','Distingui casa, lavoro, famiglia e lingua; per ciascuno individua cosa sai.','Scegli soltanto un tema.','Hai distinto almeno un fatto da un’ipotesi?',8,['Scegli i temi che contano','Scrivi ciò che sai e non sai','Segna una verifica concreta'],'Casa: conosco il budget, devo verificare affitto annuale e deposito.','Tema e fatto','Informazione mancante'),
    task('tr02','Prima verifica reale','Scegli una domanda che puoi rivolgere a datore di lavoro o proprietario.','Scrivi soltanto la domanda.','È una domanda che produce un fatto verificabile?',8,['Identifica un’incertezza','Formula una domanda precisa','Scegli quando inviarla'],'Quali supporti sono disponibili per trovare un alloggio annuale?','Domanda','A chi chiedere'),
    task('tr03','Una giornata realistica sull’isola','Descrivi un giorno feriale possibile, inclusi spostamenti e famiglia.','Descrivi solo il mattino.','Quale elemento richiede verifica?',10,['Immagina una giornata','Inserisci lavoro e recupero','Evidenzia un’incognita'],'Mattina: spostamento e briefing; sera: chiamata con la famiglia.','La mia giornata','Incognita da verificare'),
    task('tr04','Piano dei primi tre giorni','Costruisci una mini-checklist dell’arrivo senza cercare di risolvere tutto.','Definisci il primo giorno.','Le attività sono realistiche?',10,['Elenca tre necessità','Ordinale nel tempo','Separa urgenti e rinviabili'],'Verificare alloggio, tragitto e punto di contatto del lavoro.','Prime azioni','Contatto utile'),
    task('tr05','Tre risorse già disponibili','Collega una tua esperienza passata a una difficoltà prevista.','Scrivi una sola risorsa.','È applicabile al nuovo contesto?',8,['Scegli una difficoltà','Richiama un’esperienza simile','Indica cosa puoi riutilizzare'],'Ho già gestito picchi operativi: posso partire da briefing e controlli.','Risorsa','Applicazione'),
    task('tr06','Prepara una conversazione con la famiglia','Pianifica momenti di contatto e aspetti da chiarire prima di partire.','Individua una sola domanda.','Hai rispettato necessità e autonomia di tutti?',8,['Scegli un tema pratico','Prepara una proposta concreta','Lascia spazio alle esigenze altrui'],'Potremmo sentirci dopo cena in giorni da concordare.','Proposta','Cosa chiarire insieme'),
    task('tr07','Criteri del periodo di prova','Definisci come valuterai sostenibilità economica e professionale.','Scegli un solo criterio.','I criteri dipendono da osservazioni concrete?',11,['Elenca condizioni minime','Scegli cosa misurare','Decidi quando riesaminare'],'Confronto entrate, costo dell’alloggio e carico effettivo di lavoro.','Criterio','Come verificarlo'),
    task('tr08','Punto decisionale','Raccogli fatti, ipotesi ancora aperte e prossime verifiche.','Scrivi un fatto e una verifica.','Stai decidendo con informazioni più solide?',12,['Elenca i fatti raccolti','Riconosci ciò che resta incerto','Definisci la decisione o il prossimo test'],'So come arrivare e chi contattare; devo ancora confermare i costi reali.','Fatti','Prossimo test'),
  ],
  movimento: [
    task('mv01','Trova un momento facile per muoverti','Scegli un momento ripetibile per un movimento leggero adeguato alle tue condizioni.','Prepara solo scarpe e orario.','È realizzabile nei giorni normali?',5,['Scegli un momento della giornata','Prepara il necessario','Prova qualche minuto se possibile'],'Dopo il primo caffè faccio una breve passeggiata.','Momento scelto','Ostacolo pratico'),
    task('mv02','Passeggiata breve','Prova una camminata leggera, adattando la durata alla tua situazione.','Esci per pochi minuti.','Ti è sembrata sostenibile?',10,['Scegli un percorso semplice','Muoviti senza forzare','Registra se puoi ripeterlo'],'Ho camminato nei dintorni di casa a passo comodo.','Quando','Cosa rendere più facile'),
    task('mv03','Movimento ancorato a una routine','Collega una breve attività a un evento quotidiano già stabile.','Preparati a iniziare domani.','Il collegamento è stato utile?',10,['Scegli una routine stabile','Aggiungi movimento leggero','Valuta se ripeterlo'],'Dopo pranzo faccio una pausa attiva.','Abitudine associata','Risultato'),
    task('mv04','Prepara il piano B','Progetta una versione più breve per le giornate difficili.','Scrivi una sola alternativa.','Sai ripartire anche con poco tempo?',6,['Pensa a un imprevisto','Scegli un’alternativa realistica','Prepara il necessario'],'Se piove faccio movimento leggero in casa.','Piano B','Come attivarlo'),
    task('mv05','Scegli ciò che ti piace','Prova un’attività leggera che non percepisci come un obbligo.','Scegli solo quale attività.','La rifaresti volontariamente?',12,['Elenca due opzioni','Prova quella più accessibile','Valuta il piacere oltre alla durata'],'Passeggiata in un luogo piacevole, senza obiettivi di velocità.','Attività scelta','Cosa ti piace'),
    task('mv06','Organizza due occasioni','Prepara una settimana con due occasioni semplici di movimento.','Programma una sola occasione.','Hai considerato i tuoi orari?',6,['Guarda gli impegni','Scegli due momenti','Prepara un piano B'],'Martedì dopo colazione e sabato mattina.','Occasioni','Ostacolo previsto'),
    task('mv07','Rendi semplice ricominciare','Crea una strategia per riprendere dopo un’attività saltata.','Scrivi la prima azione.','La ripartenza è realistica?',6,['Normalizza un giorno saltato','Identifica la prossima occasione','Riduci la soglia d’ingresso'],'Riparto con cinque minuti a passo comodo.','Prossima occasione','Versione minima'),
    task('mv08','Verifica la tua settimana','Rivedi cosa ha reso facile iniziare senza giudicarti.','Annota un punto positivo.','Sai cosa mantenere?',7,['Guarda i giorni in cui ti sei mosso','Individua il contesto utile','Conserva una sola abitudine'],'La passeggiata dopo colazione è più semplice della sera.','Cosa funziona','Cosa cambiare'),
  ],
  abitudini: [
    task('hb01','Rendi piccolo il cambiamento','Definisci un gesto osservabile che richieda pochi minuti.','Riduci il gesto a 1 minuto.','Puoi iniziare senza preparazioni lunghe?',6,['Scrivi un comportamento, non un risultato','Riducilo a una versione piccola','Associalo a un momento'],'Dopo colazione preparo la lista delle tre priorità.','Nuovo gesto','Quando'),
    task('hb02','Collega la nuova abitudine','Scegli un comportamento abituale come segnale d’avvio.','Individua solo il segnale.','Il segnale è abbastanza stabile?',6,['Scegli una routine esistente','Aggancia il nuovo gesto','Prova la sequenza'],'Dopo essermi lavato i denti preparo lo zaino.','Segnale','Gesto'),
    task('hb03','Riduci l’attrito','Elimina un ostacolo ambientale che rallenta la tua abitudine.','Scegli un singolo oggetto da preparare.','L’inizio è diventato più semplice?',6,['Descrivi l’ostacolo','Modifica il contesto','Prova l’avvio'],'Preparo ciò che serve la sera prima.','Ostacolo','Modifica'),
    task('hb04','Versione da giornata complicata','Definisci il minimo indispensabile per non perdere continuità.','Fai una prova di 30 secondi.','Il minimo è davvero sostenibile?',5,['Immagina una giornata difficile','Definisci il minimo','Provalo una volta'],'Anche se ho poco tempo, eseguo un solo passaggio.','Minimo','Momento'),
    task('hb05','Misura ciò che conta','Individua una prova osservabile, non un voto alla persona.','Scegli un solo indicatore.','Il criterio è verificabile?',7,['Definisci un comportamento','Scegli come registrarlo','Evita misure inutili'],'Ho preparato il materiale prima di iniziare? Sì/no.','Indicatore','Come registrarlo'),
    task('hb06','Riconosci l’ostacolo ricorrente','Esamina cosa ha bloccato un tentativo senza colpevolizzarti.','Registra solo quando è successo.','Hai identificato una condizione concreta?',7,['Identifica un blocco','Separa fatti e giudizi','Cambia una condizione'],'La sera sono troppo stanco; anticipo di 20 minuti.','Blocco','Nuova condizione'),
    task('hb07','Prova una soluzione alternativa','Testa un’altra fascia oraria o durata per la stessa abitudine.','Prova solo una modifica.','Quale versione funziona meglio?',8,['Scegli una sola variabile','Prova l’alternativa','Registra l’esito'],'Passo dal tardo pomeriggio al mattino.','Cambiamento','Risultato'),
    task('hb08','Consolida la versione utile','Conserva ciò che funziona e prepara la ripartenza.','Scrivi un promemoria per domani.','Puoi ripetere senza sforzo eccessivo?',7,['Rivedi la settimana','Elimina il superfluo','Scegli il prossimo piccolo passo'],'Mantengo la versione da cinque minuti.','Cosa mantengo','Cosa semplifico'),
  ],
  osservazione_alcol: [
    task('al01','Osserva un’occasione abituale','Nota quando e in che contesto compare il desiderio di bere, senza prescrivere riduzioni.','Annota un solo contesto.','Hai riconosciuto un trigger?',5,['Scegli un’occasione','Annota momento e contesto','Non cambiare bruscamente quantità senza consulenza se sei a rischio'],'Dopo il lavoro il momento è associato a un rituale.','Momento','Cosa ho osservato'),
    task('al02','Riconosci il segnale','Osserva quale evento precede un’abitudine legata all’alcol.','Nota solo il luogo.','Il segnale è ricorrente?',5,['Ricorda un’occasione','Individua il segnale','Registra un’osservazione'],'È una situazione sociale ricorrente.','Segnale','Contesto'),
    task('al03','Prepara un’alternativa non alcolica','Valuta un’opzione gradita senza imporre scalette quantitative.','Elenca un’alternativa.','È disponibile e praticabile?',5,['Pensa a un momento','Scegli una bevanda o attività alternativa','Registra la fattibilità'],'Acqua frizzante o una passeggiata, se appropriate.','Alternativa','Quando potrei usarla'),
    task('al04','Rivedi ciò che ti aiuta','Osserva gli automatismi che hanno influito sulla settimana.','Scrivi solo un elemento.','Hai informazioni nuove sui tuoi comportamenti?',7,['Rivedi le osservazioni','Individua uno schema','Considera se un medico può aiutarti a pianificare in sicurezza'],'Le occasioni più frequenti sono legate alla fine del turno.','Schema','Aiuto utile'),
    task('al05','Cambia il contesto, non il corpo','Individua un cambiamento ambientale sicuro senza istruzioni di riduzione autonoma.','Scegli un’idea.','È realistico e sicuro?',6,['Individua un contesto','Pensa a una modifica ambientale','Valuta un confronto medico quando necessario'],'Organizzo un’attività alternativa per parte del tempo libero.','Contesto','Alternativa'),
    task('al06','Prepara una domanda per un professionista','Se il consumo è alto o quotidiano, prepara domande per un medico prima di ridurre.','Scrivi una domanda.','Sai chi contattare?',5,['Identifica cosa vuoi chiarire','Scrivi una domanda precisa','Considera un consulto'],'Come posso valutare in sicurezza il mio consumo attuale?','Domanda','A chi rivolgerla'),
    task('al07','Riconosci i fattori di supporto','Identifica una persona o situazione che favorisce scelte sostenibili.','Nomina una risorsa.','È una risorsa accessibile?',5,['Pensa a chi può aiutarti','Identifica un’occasione sicura','Registra una risorsa'],'Parlarne con una persona fidata o con un professionista.','Risorsa','Quando cercarla'),
    task('al08','Revisione senza giudizio','Riassumi ciò che hai osservato e se desideri un piano supervisionato.','Scrivi un’osservazione.','Hai individuato una prossima verifica sicura?',7,['Rivedi i contesti','Individua le esigenze di supporto','Evita piani quantitativi improvvisati'],'Desidero chiarire con il medico quali passi sono sicuri.','Osservazione','Prossima verifica'),
  ],
};

// Combinazione integrata: ogni settimana propone esercizi su tre competenze,
// non una sola lista di attività generiche.
lessons.ibiza = [
  lessons.trasferimento[0], lessons.spagnolo[0], lessons.stazione[0],
  lessons.trasferimento[1], lessons.spagnolo[1], lessons.stazione[1],
  lessons.trasferimento[2], lessons.spagnolo[2], lessons.stazione[2],
  lessons.trasferimento[3], lessons.spagnolo[3], lessons.stazione[3],
  lessons.trasferimento[4], lessons.spagnolo[4], lessons.stazione[4],
  lessons.trasferimento[5], lessons.spagnolo[5], lessons.stazione[5],
  lessons.trasferimento[6], lessons.spagnolo[6], lessons.stazione[6],
  lessons.trasferimento[7], lessons.spagnolo[7], lessons.stazione[7],
];

export function dayDiff(a:string,b:string) {
  return Math.floor((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
}
export function addDays(day:string,offset:number):string {
  const d=new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+offset); return d.toISOString().slice(0,10);
}
const rhythm:Record<number,number[]>={2:[0,3],3:[0,2,4],4:[0,2,4,6],5:[0,1,3,4,6],6:[0,1,2,3,4,5],7:[0,1,2,3,4,5,6]};

export function periodStart(profile:Pick<PlanProfile,'starts_on'>,today:string):string {
  const passed=Math.max(0,dayDiff(today,profile.starts_on));
  return addDays(profile.starts_on,7*Math.floor(passed/7));
}
export function scheduleFor(profile:PlanProfile,today:string,logs:Pick<{day:string;outcome:string},'day'|'outcome'>[]=[]):ScheduledTask[] {
  const start=periodStart(profile,today);
  const period=Math.max(0,Math.floor(dayDiff(start,profile.starts_on)/7));
  const previousStart=addDays(start,-7);
  const previous=logs.filter(x=>x.day>=previousStart&&x.day<start);
  const difficult=previous.filter(x=>x.outcome==='difficult').length;
  const completed=previous.filter(x=>x.outcome==='done').length;
  // Only prior-cycle observations influence current-cycle tasks. No moving targets midweek.
  const adjustment=period===0?0:difficult>=2?-1:completed>=Math.min(3,profile.days_per_week)?1:0;
  const offset=Math.max(0,(profile.confidence>=4?1:0)+period*profile.days_per_week+adjustment);
  return (rhythm[profile.days_per_week]??rhythm[3]).map((n,i)=>({
    day:addDays(start,n),task:lessons[profile.focus][(offset+i)%lessons[profile.focus].length],index:i+1,done:dayDiff(addDays(start,n),today)<0,
  }));
}
export function taskForDay(profile:PlanProfile,today:string,logs:Pick<{day:string;outcome:string},'day'|'outcome'>[]=[]):PlanItem|null {
  return scheduleFor(profile,today,logs).find(x=>x.day===today)?.task??null;
}
export function personalizedExercise(item:PlanItem,profile:PlanProfile):Exercise {
  return {key:item.key,title:item.title,description:item.instruction,minutes:Math.min(profile.minutes,item.minutes),fallback:item.quick,verify:item.check};
}
export function personalizedGuide(item:PlanItem,profile:PlanProfile):ExerciseGuide {
  return {
    intro:`${item.instruction} Il tuo punto di partenza: ${profile.baseline.slice(0,160)}`,
    steps:item.steps,example:item.example,
    fields:item.fields.map(x=>({label:x,placeholder:x==='Cosa migliorare'?'Una cosa concreta che vorrei allenare…':'Scrivi una risposta concreta…',maxLength:160})),
    required:profile.focus==='osservazione_alcol'?0:1,quickRequired:0,
    prompt:profile.focus==='osservazione_alcol'?'La nota è facoltativa. Nessun obiettivo quantitativo di riduzione.':'Esegui prima l’attività. Poi registra almeno una breve risposta (puoi usare la versione breve).',
  };
}

export function planTip(profile:PlanProfile):string {
  if (profile.obstacle.trim()) return `Ostacolo che hai segnalato: ${profile.obstacle}. Se compare, prova una versione più semplice e rivaluta la frequenza.`;
  return 'Se l’attività risulta difficile, usa la versione breve: la continuità conta più della perfezione.';
}
