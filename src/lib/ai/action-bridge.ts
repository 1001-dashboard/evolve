/** Non sostituisce un consiglio clinico: interrompe soltanto le domande ripetitive nei casi ordinari. */
export function shouldBridgeToAction(answer:string,userTurns:number,userMessage:string):boolean {
 if(userTurns<2||!answer.includes('?'))return false;
 if(/suicid|autolesion|farmi del male|emergenza sanitaria|violenza|astinenza|overdose|dolore al petto/i.test(userMessage))return false;
 if(/prepara il piano|prima azione|primo passo|prova a|verifica|scrivi|esercizio pratico|entro (?:oggi|domani|la settimana)/i.test(answer))return false;
 return true;
}
export function operationalBridge(userMessages:string[]):string {
 const text=userMessages.slice(-8).join(' ').toLowerCase();
 if(/ibiza|trasfer|station.manager|stazione|nuovo lavoro|lavoro|all.altezza/.test(text)) {
  return 'Abbiamo già individuato il punto centrale: non sai ancora se il ruolo sarà sostenibile e soddisfacente. Non serve continuare a scomporre la paura: servono verifiche.\n\n1. Oggi, 15 minuti: elenca tre responsabilità concrete della stazione (personale, contratti, outsourcing). Per ciascuna segna ciò che sai già gestire e quale informazione o supporto ti manca.\n2. Prima di giudicare la scelta: definisci due condizioni osservabili per valutare il lavoro durante il periodo di prova, e una condizione che renderebbe ragionevole cambiare strada.\n\nPuoi selezionare «Prepara il piano» per trasformare queste verifiche in attività modificabili. Non c’è nessun obbligo di partire o di restare: stiamo aumentando le informazioni su cui decidere.';
 }
 return 'Abbiamo già abbastanza elementi per provare qualcosa, invece di proseguire soltanto con domande.\n\n1. Oggi, 10 minuti: separa in due colonne quello che già sai e quello che ti serve verificare.\n2. Scegli un esperimento concreto: una piccola azione che puoi svolgere entro due giorni e un criterio semplice per dire se è stata utile.\n\nSe vuoi, premi «Prepara il piano»: la proposta rimarrà modificabile e nulla verrà salvato senza la tua conferma.';
}
