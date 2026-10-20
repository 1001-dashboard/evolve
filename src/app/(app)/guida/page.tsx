import Link from 'next/link';
import {ArrowRight,BrainCircuit,CalendarCheck2,ChartNoAxesCombined,Dumbbell,UtensilsCrossed,UserRound,CheckCircle2,HelpCircle} from 'lucide-react';

const steps=[
 {number:1,title:'Parti da un problema',text:'Apri il Coach e scrivi cosa vuoi cambiare: dubbi sul lavoro, forma fisica, abitudini o organizzazione. Non serve sapere già la soluzione.',href:'/coach',action:'Apri il Coach'},
 {number:2,title:'Valuta la proposta',text:'Dopo uno o più messaggi premi «Crea una proposta di piano». Modifica durata, frequenza e singole attività. Finché non confermi non viene salvato niente.',href:'/coach',action:'Prepara un piano'},
 {number:3,title:'Mettilo in pratica',text:'Premi «Conferma e attiva». In Oggi trovi le attività previste. Apri Il mio piano per sospendere o consultare gli impegni.',href:'/giornata',action:'Vai a Oggi'},
 {number:4,title:'Registra cosa è successo',text:'Spunta «Fatto» o «Non oggi», usa il diario allenamenti o il meal prep. Torna dal Coach quando vuoi cambiare strategia.',href:'/piano',action:'Apri il piano'},
];
const pages=[
 {title:'Oggi',why:'Cosa devo fare adesso?',what:'Le attività concordate per la giornata, il check-in e i suggerimenti facoltativi.',href:'/giornata',icon:CalendarCheck2},
 {title:'Coach',why:'Non so come affrontare un problema.',what:'Ne parli, ottieni una proposta e decidi se attivarla. Non è una seduta terapeutica.',href:'/coach',icon:BrainCircuit},
 {title:'Il mio piano',why:'Che cosa abbiamo concordato?',what:'Gli impegni confermati: puoi completarli, sospenderli o consultarli.',href:'/piano',icon:CheckCircle2},
 {title:'Risultati',why:'Cosa ho effettivamente fatto?',what:'Gli esercizi guidati, con link ai registri degli altri strumenti.',href:'/progressi',icon:ChartNoAxesCombined},
 {title:'Profilo',why:'Cosa deve sapere Evolve di me?',what:'Obiettivi, tempo e preferenze, con informazioni sensibili facoltative.',href:'/profilo',icon:UserRound},
 {title:'Diario allenamenti',why:'Ho fatto sport: dove lo registro?',what:'Vogatore, kettlebell, sacco, camminata e altre attività, anche dei giorni passati.',href:'/allenamento',icon:Dumbbell},
 {title:'Meal prep e spesa',why:'Cosa mangio al lavoro questa settimana?',what:'Pranzi pronti, ingredienti riutilizzati e lista della spesa.',href:'/mealprep',icon:UtensilsCrossed},
];
export default function Guida(){return <div className="evolve-guide-page">
 <header className="evolve-page-intro"><p className="eyebrow"><HelpCircle size={16}/> GUIDA PRATICA</p><h1>Come usare Evolve, in quattro passi</h1><p>Evolve non è una raccolta di schermate da compilare. <strong>Tu scegli un problema, il Coach ti aiuta a preparare un piano, tu lo approvi e poi lo metti in pratica.</strong></p><Link href="/coach" className="btn">Inizia dal Coach <ArrowRight size={16}/></Link></header>
 <section className="evolve-guide-steps" aria-label="I quattro passaggi">{steps.map(s=><article className="panel" key={s.number}><div className="evolve-guide-count">{s.number}</div><h2>{s.title}</h2><p>{s.text}</p><Link href={s.href} className="life-link">{s.action} <ArrowRight size={15}/></Link></article>)}</section>
 <section className="panel"><div className="evolve-guide-section"><h2>Quale schermata devo aprire?</h2><p className="muted">Scegli in base a quello che vuoi fare, non al nome della funzione.</p></div><div className="evolve-guide-directory">{pages.map(({title,why,what,href,icon:Icon})=><Link href={href} className="evolve-guide-link" key={href}><Icon size={23}/><span><strong>{title}</strong><em>{why}</em><small>{what}</small></span><ArrowRight size={18}/></Link>)}</div></section>
 <section className="panel evolve-guide-example"><p className="eyebrow">ESEMPIO CONCRETO</p><h2>«Ho paura di non farcela a Ibiza»</h2><p>Scrivilo nel Coach. Potrà proporti verifiche sul ruolo, simulazioni lavorative e piccole azioni di preparazione. Non deve convincerti a partire: deve aiutarti a valutare meglio.</p><p><strong>Attenzione:</strong> una proposta del Coach non equivale automaticamente a una scheda sportiva o a una dieta. I moduli specialistici hanno registri propri.</p><Link href="/coach" className="btn-secondary">Prova con un problema reale <ArrowRight size={16}/></Link></section>
 </div>}
