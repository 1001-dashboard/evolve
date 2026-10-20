export type LifeArea = 'benessere' | 'lavoro' | 'relazioni' | 'crescita';
export type LifeProfile = {
  user_id: string; display_name: string; birth_date: string | null;
  height_cm: number | null; weight_kg: number | null;
  main_goal: string; life_areas: LifeArea[]; minutes_per_day: number;
  preferred_time: 'mattina' | 'pranzo' | 'sera' | 'flessibile';
  support_style: 'pratico' | 'graduale' | 'equilibrato';
  coach_context_opt_in: boolean;
  morning_anchor: string; current_context: string; updated_at: string;
};
export type DailyState = {
  user_id: string; day: string; energy: number; mood: number;
  sleep_hours: number | null; available_minutes: number; note: string; updated_at: string;
};
export type LifeScenario = {
  id: string; user_id: string; title: string; context: 'lavoro'|'casa'|'relazioni'|'benessere'|'altro';
  trigger_text: string; response_text: string; small_step: string; fallback_text: string;
  active: boolean; created_at: string; updated_at: string;
};
export type ScenarioFeedback = {
  id: string; scenario_id: string; day: string; outcome: 'helped'|'adjust'|'rehearsed'; note: string;
};
export type DailyAction = {day:string; action_key:string; status:'done'|'skipped';note?:string};
