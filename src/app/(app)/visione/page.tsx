import '@/app/evolution-rolling-plan.css';
import {EvolutionRollingPlanClient} from '@/components/evolution-rolling-plan-client';
import '@/app/training-intelligence.css';
import {TrainingIntelligenceClient} from '@/components/training-intelligence-client';
import '@/app/nutrition-journal.css';
import {NutritionJournalClient} from '@/components/nutrition-journal-client';
import '@/app/evolution.css';
import '@/app/goal-journey.css';
import {EvolutionOverviewClient} from '@/components/evolution-overview-client';
import {GoalJourneyPanel} from '@/components/goal-journey-panel';
export default function VisionePage(){return <><EvolutionRollingPlanClient mode="vision"/><GoalJourneyPanel mode="vision"/><TrainingIntelligenceClient mode="vision"/><NutritionJournalClient mode="vision"/><EvolutionOverviewClient/></>}
