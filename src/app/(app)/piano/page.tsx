import {loadPrograms} from '@/lib/program-data';
import {PersonalPlanClient} from '@/components/personal-plan-client';
import {CoachCommitments} from '@/components/coach-commitments';
import Link from 'next/link';
import {ArrowRight,Dumbbell,UtensilsCrossed,Target,ShieldCheck} from 'lucide-react';
export default async function Piano({searchParams}:{searchParams:Promise<{program?:string}>}){
  const [data,search]=await Promise.all([loadPrograms(),searchParams]);
  return <div className="coach-plan-page">
   <header className="evolve-page-intro"><p className="eyebrow">EVOLVE · IL MIO PIANO</p><h1>Le cose che hai deciso di fare</h1><p>Qui trovi le attività concordate con il Coach. Da questa pagina puoi seguirle, completarle o sospenderle. Non devi creare un piano da zero.</p><Link href="/coach" className="btn-secondary">Voglio affrontare un nuovo problema <ArrowRight size={16}/></Link></header>
   <CoachCommitments section="plan"/>
   <section className="panel evolve-tool-hub"><div><p className="eyebrow">VUOI FARE QUALCOSA DI SPECIFICO?</p><h2>Gli strumenti per mettere in pratica il piano</h2><p className="muted text-sm">Sono diari e strumenti operativi. Puoi utilizzarli anche senza creare una nuova conversazione.</p></div><div className="evolve-tool-grid">
    <Link href="/allenamento"><Dumbbell size={24}/><strong>Allenamento</strong><span>Registra vogatore, kettlebell, camminate e altre attività.</span><span className="evolve-link-more">Apri il diario <ArrowRight size={15}/></span></Link>
    <Link href="/mealprep"><UtensilsCrossed size={24}/><strong>Meal prep e spesa</strong><span>Organizza pranzi, ingredienti e preparazioni settimanali.</span><span className="evolve-link-more">Prepara i pasti <ArrowRight size={15}/></span></Link>
    <Link href="/percorsi"><Target size={24}/><strong>Percorsi guidati</strong><span>Allenati con esercizi già pronti, oltre al piano del Coach.</span><span className="evolve-link-more">Vedi gli esercizi <ArrowRight size={15}/></span></Link>
    <Link href="/scenari"><ShieldCheck size={24}/><strong>Se succede X, faccio Y</strong><span>Prepara risposte pratiche a imprevisti e momenti difficili.</span><span className="evolve-link-more">Apri gli scenari <ArrowRight size={15}/></span></Link>
   </div></section>
   <details className="panel evolve-advanced"><summary><span><strong>Percorsi guidati già presenti</strong><small>Funzione facoltativa: aprila solo per modificare i vecchi percorsi e i loro esercizi.</small></span><span aria-hidden="true">Mostra / nascondi</span></summary><div className="evolve-advanced-content"><PersonalPlanClient {...data} initialProgramId={search.program}/></div></details>
  </div>;
}
