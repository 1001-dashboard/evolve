import '@/app/training-intelligence.css';
import {TrainingIntelligenceClient} from '@/components/training-intelligence-client';
import '@/app/evolution.css';
import '@/app/goal-journey.css';
import {EvolutionOverviewClient} from '@/components/evolution-overview-client';
import {GoalJourneyPanel} from '@/components/goal-journey-panel';
export default function VisionePage(){return <><GoalJourneyPanel mode="vision"/><TrainingIntelligenceClient mode="vision"/><EvolutionOverviewClient/></>}
