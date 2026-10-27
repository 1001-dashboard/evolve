import '@/app/evolution-rolling-plan.css';
import {EvolutionRollingPlanClient} from '@/components/evolution-rolling-plan-client';
import '@/app/training-intelligence.css';
import '@/app/goal-journey.css';
import '@/app/training-editor.css';
import '@/app/nutrition-journal.css';
import {TrainingClient} from '@/components/training-client';
import {GoalJourneyPanel} from '@/components/goal-journey-panel';
import {NutritionJournalClient} from '@/components/nutrition-journal-client';
/** The same confirmed food diary facts shown on Oggi and Visione 360 appear here.
 * No energy expenditure is subtracted from food intake: these are different estimates.
 */
export default function Page(){return <><EvolutionRollingPlanClient mode="training"/><TrainingClient/><NutritionJournalClient mode="training"/><GoalJourneyPanel mode="training"/></>}
