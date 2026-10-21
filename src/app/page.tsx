import {EvolveBrand} from '@/components/evolve-brand';
import {ArrowRight,Brain,CheckCircle2,Dumbbell,HeartHandshake,Repeat2,ShoppingBasket,Target,TrendingUp} from 'lucide-react';
const AREA=[
 {title:'Mindset e coaching',desc:'Preparati ad affrontare ostacoli e cambiamenti con azioni concrete.',icon:Brain},
 {title:'Routine e costanza',desc:'Trova abitudini compatibili con la tua vita, anche nelle giornate difficili.',icon:Repeat2},
 {title:'Allenamento',desc:'Registra le attività che preferisci e osserva i progressi.',icon:Dumbbell},
 {title:'Alimentazione e spesa',desc:'Organizza ricette, meal prep e pranzi da portare con te.',icon:ShoppingBasket},
 {title:'Lavoro e apprendimento',desc:'Allena competenze e affronta nuove responsabilità.',icon:Target},
 {title:'Vita personale',desc:'Organizza ciò che conta, senza sentirti sopraffatto.',icon:HeartHandshake},
];
const b='/evolve';
export default function Home(){return <div className="marketing">
 <header className="marketing-header"><EvolveBrand href="/"/><div className="flex gap-3 items-center"><a href={b+'/login'} className="text-sm font-semibold">Accedi</a><a className="btn text-sm" href={b+'/registrati'}>Inizia <ArrowRight size={16} className="inline ml-1"/></a></div></header>
 <section className="marketing-hero"><div><p className="eyebrow mb-4">EVOLVE · PERSONAL LIFE COACHING</p>
  <h1 className="marketing-h1">Migliorare la vita. <span className="accent">Un passo alla volta.</span></h1>
  <p className="muted text-lg mt-6 mb-7 leading-relaxed">Evolve ti aiuta a scegliere cosa migliorare, preparare un piano, allenare nuove abitudini e osservare cosa funziona. L'obiettivo è renderti progressivamente più autonomo.</p>
  <div className="flex gap-3 flex-wrap"><a href={b+'/registrati'} className="btn">Crea il tuo percorso <ArrowRight size={16} className="inline ml-1"/></a><a href="#come-funziona" className="btn-secondary">Come funziona</a></div>
  <p className="text-xs muted mt-5">Versione pilota. Evolve non è uno psicologo, un medico o un dietista e non li sostituisce.</p>
 </div><div className="preview path-marketing-preview"><p className="eyebrow">IL TUO PERCORSO</p><h2 className="text-2xl font-bold mt-3 mb-5">Cominciamo da ciò che conta per te.</h2>
  <div className="path-marketing-task"><span className="path-marketing-icon"><Target size={22}/></span><div><strong>1. Scegli gli ambiti</strong><small>Benessere, costanza, lavoro, allenamento e altro.</small></div><CheckCircle2 size={21} className="text-teal-700"/></div>
  <div className="path-marketing-task"><span className="path-marketing-icon"><Repeat2 size={22}/></span><div><strong>2. Approva il tuo piano</strong><small>Piccole attività verificabili, che puoi modificare.</small></div><CheckCircle2 size={21} className="text-teal-700"/></div>
  <div className="path-marketing-task"><span className="path-marketing-icon"><TrendingUp size={22}/></span><div><strong>3. Impara a farne a meno</strong><small>Riduci la guida quando ti senti pronto.</small></div><CheckCircle2 size={21} className="text-teal-700"/></div>
 </div></section>
 <section id="come-funziona"><p className="eyebrow mb-3">COME POSSIAMO AIUTARTI</p><h2 className="text-3xl font-bold mb-7">Un solo Evolve, tanti percorsi possibili.</h2><div className="marketing-features" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))'}}>{AREA.map(x=><article className="panel" key={x.title}><x.icon size={29} className="text-teal-600 mb-4"/><h3 className="font-bold mb-2">{x.title}</h3><p className="muted text-sm">{x.desc}</p></article>)}</div></section>
 <div className="landing-footer"><h2 className="text-3xl font-bold mb-2">Non devi cambiare tutto oggi.</h2><p className="text-sm mb-6 text-slate-200">Registrati, scegli uno o più ambiti e approva il tuo primo piano. I dati sono personali e ogni obiettivo resta una tua scelta.</p><a className="btn-secondary inline-block" href={b+'/registrati'}>Inizia con Evolve <ArrowRight size={16} className="inline ml-1"/></a><p style={{marginTop:16,fontSize:12}}><a href={b+'/installa'}>Vuoi aggiungerlo alla schermata Home di Android?</a></p></div>
 </div>}
