import '@/app/training-intelligence.css';
import '@/app/goal-journey.css';
import '@/app/training-editor.css';
import {TrainingClient} from '@/components/training-client';
import {GoalJourneyPanel} from '@/components/goal-journey-panel';
export default function Page(){return <><TrainingClient/><GoalJourneyPanel mode="training"/></>}
