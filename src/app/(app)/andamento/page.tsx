import Link from 'next/link';
import {Activity,ArrowRight,ChartNoAxesCombined} from 'lucide-react';
import {Trends360Client} from '@/components/trends-360-client';
import '@/app/outcomes.css';
export default function AndamentoPage(){
 return <main className="out-page">
  <header className="out-page-head"><div><p className="eyebrow">EVOLVE · MISURA</p><h1>Andamento 360</h1><p className="muted">Unisci dati reali di attività, benessere e abitudini. Non un punteggio: una panoramica di ciò che hai registrato e puoi migliorare.</p></div><ChartNoAxesCombined size={34} aria-hidden="true"/></header>
  <Trends360Client/>
  <div className="out-bottom-nav"><Link href="/allenamento"><Activity size={17}/> Diario allenamenti <ArrowRight size={15}/></Link><Link href="/mealprep">Meal prep <ArrowRight size={15}/></Link><Link href="/piano">Il mio piano <ArrowRight size={15}/></Link></div>
 </main>;
}
