import type {PlanDraft,PlanItem} from './plan';

/** Fallback trasparente e deterministico: nessun modello AI, nessuna prescrizione. */
export function makeFallbackDraft(userMessages:string[],minutesPerDay=15):PlanDraft {
  const text=userMessages.slice(-8).join(' ').toLocaleLowerCase('it-IT');
  const budget=Math.max(5,Math.min(20,Number.isFinite(minutesPerDay)?minutesPerDay:15));
  const items:PlanItem[]=[];
  function add(kind:PlanItem['kind'],title:string,description:string,minutes:number,cadence:PlanItem['cadence']='once',days:number[]=[]):void {
    if(items.length>=4)return;
    items.push({kind,title,description,minutes:Math.max(3,Math.min(minutes,budget)),cadence,days,time_window:'flessibile'});
  }
  const change=/ibiza|trasfer|espatri|nuovo lavoro|station.manager|stazione|responsabilit|lavoro|capace|all.altezza/.test(text);
  const language=/spagnol|ingles|lingua|comunicazion/.test(text);
  const home=/casa|allogg|affitto|abitazion/.test(text);
  const fatigue=/stanch|disillus|satur|stress|energie|ansia|esaur|sopraff/.test(text);
  const nutrition=/aliment|meal.?prep|mang|dieta|dimagr|pranz|spesa|cucin/.test(text);
  const movement=/allen|vogator|kettlebell|cammin|moviment|sacco|fitness|sport/.test(text);
  const alcohol=/alcol|birra|bevo|bere meno/.test(text);

  if(change) add('azione','Verifica il ruolo con criteri concreti',
    'Scrivi tre attività fondamentali del nuovo ruolo, cosa sai già gestire e cosa devi imparare. Definisci due criteri verificabili per capire durante il periodo di prova se il lavoro è sostenibile per te.',15);
  if(language) add('routine','Una simulazione di lingua professionale',
    'Prepara una situazione reale che potresti incontrare. Pronuncia ad alta voce la risposta in spagnolo o inglese; annota una frase da migliorare, senza giudicare tutta la tua competenza.',10,'weekly',[2,4]);
  if(home) add('azione','Riduci l’incertezza sulla casa',
    'Elenca tre requisiti essenziali dell’alloggio e scegli un’unica informazione da verificare oggi. Distingui le risposte già ricevute da quelle ancora da chiedere.',10);
  if(fatigue) add('scenario','Piano minimo per le giornate difficili',
    'Definisci in anticipo: «Se dopo una giornata intensa mi sento scarico, allora riduco gli impegni opzionali, recupero e rimando le valutazioni più importanti a quando avrò più elementi». Scrivi una versione minima di cinque minuti.',5,'weekly',[1,4]);
  if(movement) add('routine','Movimento sostenibile',
    'Scegli un’attività familiare e praticabile, registrando durata e sforzo percepito. Non aumentare il carico se non recuperi bene; interrompi in caso di sintomi anomali.',10,'weekly',[2,5]);
  if(nutrition) add('alimentazione','Prepara una base per più pasti',
    'Scegli due ingredienti già disponibili e pianifica due pasti semplici con una base comune. Controlla tempi di conservazione e modalità di trasporto prima di cucinare.',10,'weekly',[7]);
  if(alcohol) add('azione','Osserva quando nasce l’abitudine',
    'Registra le situazioni in cui ti viene voglia di bere e valuta alternative pratiche. Se il consumo è elevato o quotidiano, concorda eventuali riduzioni con un professionista sanitario: l’astinenza può essere rischiosa.',5);
  if(items.length===0) add('azione','Definisci un primo passo verificabile',
    'Separa ciò che già sai da ciò che devi verificare. Scegli una sola azione entro il tuo controllo, stabilisci quando farla e come riconoscere se l’hai completata.',10);
  if(items.length===1) add('routine','Revisione breve dei risultati',
    'A fine settimana annota: cosa ha funzionato, che cosa si è rivelato difficile e quale piccolo cambiamento mantenere. Il piano non deve diventare un altro peso.',5,'weekly',[7]);
  return {summary:'Bozza guidata di riserva: il servizio AI non era disponibile. Queste attività sono esempi costruiti con regole semplici a partire dai temi che hai scritto, non una valutazione psicologica né un piano personalizzato dall’AI. Modifica o elimina tutto ciò che non ti rappresenta prima di confermare.',items};
}
