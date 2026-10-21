/** Evolve 1.4 — aggregated observations, not medical or psychological scores. */
export type WorkoutObservation = { day: string; duration_minutes: number; activity: string };
export type DailyObservation = { day: string; energy: number; mood: number; sleep_hours: number | null };
export type CoachObservation = { day: string; outcome: string };
export type MealObservation = { week_start: string };
export type WeightObservation = { id: string; day: string; weight_kg: number; note: string };
export type Observations = {
  workouts: WorkoutObservation[];
  states: DailyObservation[];
  coach: CoachObservation[];
  meals: MealObservation[];
  weights: WeightObservation[];
};
export type WindowSummary = {
  days: number;
  first: string;
  last: string;
  trainingSessions: number;
  trainingMinutes: number;
  trainingDays: number;
  coachDone: number;
  coachSkipped: number;
  checkinDays: number;
  avgEnergy: number | null;
  avgSleep: number | null;
  mealPlanWeeks: number;
  firstWeight: WeightObservation | null;
  lastWeight: WeightObservation | null;
  weightChange: number | null;
};

export function validIsoDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}
export function shiftIsoDay(day: string, delta: number): string {
  if (!validIsoDay(day) || !Number.isInteger(delta) || Math.abs(delta) > 3650) throw new Error('Data non valida');
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
function round1(n: number): number { return Math.round(n * 10) / 10; }
function average(values: number[]): number | null {
  return values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}
function inRange(day: string, first: string, last: string): boolean {
  return validIsoDay(day) && day >= first && day <= last;
}
export function summarize(observations: Observations, days: 7 | 30, end: string): WindowSummary {
  if (!validIsoDay(end)) throw new Error('Data finale non valida');
  const first = shiftIsoDay(end, 1 - days);
  const workouts = observations.workouts.filter(x => inRange(x.day, first, end) && Number.isFinite(x.duration_minutes) && x.duration_minutes >= 1 && x.duration_minutes <= 600);
  const states = observations.states.filter(x => inRange(x.day, first, end));
  const coach = observations.coach.filter(x => inRange(x.day, first, end));
  const mealPlans = observations.meals.filter(x => validIsoDay(x.week_start) && shiftIsoDay(x.week_start, 6) >= first && x.week_start <= end);
  const weights = observations.weights.filter(x => inRange(x.day, first, end) && Number.isFinite(x.weight_kg) && x.weight_kg >= 25 && x.weight_kg <= 450).sort((a, b) => a.day.localeCompare(b.day));
  const firstWeight = weights[0] ?? null;
  const lastWeight = weights.at(-1) ?? null;
  const energy = states.map(x => x.energy).filter(x => Number.isInteger(x) && x >= 1 && x <= 5);
  const sleep = states.map(x => x.sleep_hours).filter((x): x is number => x !== null && Number.isFinite(x) && x >= 0 && x <= 16);
  return {
    days, first, last: end,
    trainingSessions: workouts.length,
    trainingMinutes: Math.round(workouts.reduce((total, x) => total + x.duration_minutes, 0)),
    trainingDays: new Set(workouts.map(x => x.day)).size,
    coachDone: coach.filter(x => x.outcome === 'done').length,
    coachSkipped: coach.filter(x => x.outcome === 'skipped').length,
    checkinDays: new Set(states.map(x => x.day)).size,
    avgEnergy: average(energy),
    avgSleep: average(sleep),
    mealPlanWeeks: new Set(mealPlans.map(x => x.week_start)).size,
    firstWeight,
    lastWeight,
    weightChange: firstWeight && lastWeight && firstWeight.day !== lastWeight.day ? round1(lastWeight.weight_kg - firstWeight.weight_kg) : null,
  };
}
export function dailyMovement(observations: Observations, days: 7 | 30, end: string): {day: string; minutes: number}[] {
  const first = shiftIsoDay(end, 1 - days);
  return Array.from({length: days}, (_, i) => {
    const day = shiftIsoDay(first, i);
    const minutes = observations.workouts.filter(w => w.day === day && Number.isFinite(w.duration_minutes) && w.duration_minutes > 0 && w.duration_minutes <= 600).reduce((sum, w) => sum + w.duration_minutes, 0);
    return {day, minutes: Math.round(minutes)};
  });
}
export function factualInsights(current: WindowSummary, previous: WindowSummary): string[] {
  const result: string[] = [];
  if (current.trainingSessions > 0) {
    const comparison = previous.trainingMinutes > 0
      ? ` (periodo precedente: ${previous.trainingMinutes} min)` : '';
    result.push(`Hai registrato ${current.trainingSessions} sessioni per ${current.trainingMinutes} minuti${comparison}. Sono attività registrate, non una valutazione della forma fisica.`);
  } else result.push('Non risultano allenamenti registrati nel periodo. Potresti averne svolti senza inserirli.');
  if (current.checkinDays >= 2 && current.avgEnergy !== null) result.push(`Energia media dichiarata ${current.avgEnergy}/5 su ${current.checkinDays} giorni con check-in. È una percezione personale, non un indicatore clinico.`);
  if (current.coachSkipped > current.coachDone && current.coachSkipped >= 2) result.push(`Hai registrato ${current.coachSkipped} impegni rimandati e ${current.coachDone} completati: può essere utile rivedere frequenza e difficoltà, senza recuperare tutto insieme.`);
  if (!current.mealPlanWeeks) result.push('Nessun piano meal prep salvato nel periodo. Se organizzi già i pasti fuori da Evolve, questo dato non li rappresenta.');
  if (current.weightChange !== null) result.push(`Tra le prime e ultime pesate del periodo risultano ${current.weightChange > 0 ? '+' : ''}${current.weightChange} kg. Le oscillazioni di breve periodo non dimostrano variazioni di grasso corporeo.`);
  return result;
}
