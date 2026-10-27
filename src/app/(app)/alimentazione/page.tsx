import '@/app/evolution-rolling-plan.css';
import {EvolutionRollingPlanClient} from '@/components/evolution-rolling-plan-client';
import '@/app/nutrition-journal.css';
import {NutritionJournalClient} from '@/components/nutrition-journal-client';
import {NutritionClient} from '@/components/nutrition-client';
export default function AlimentazionePage(){return <div className="nj-page"><EvolutionRollingPlanClient mode="nutrition"/><NutritionJournalClient mode="full"/><details className="nj-tools"><summary>Ricette da ingredienti e analisi indicativa da foto</summary><div><p className="nj-info">Le ricette suggerite e le analisi delle foto non sono pasti consumati: per inserirle nel conteggio giornaliero, registra il pasto nel diario qui sopra e conferma quantità e kcal.</p><NutritionClient/></div></details></div>}
