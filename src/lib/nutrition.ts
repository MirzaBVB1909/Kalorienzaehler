export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  /** Manuelles Kalorienziel; überschreibt die Berechnung, wenn gesetzt. */
  customKcal: number | null;
  /** Tagesziel Wasser in ml. */
  waterGoalMl: number;
  /** Optionales Zielgewicht in kg (für das Gewichtsdiagramm). */
  targetWeightKg: number | null;
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const MEALS: { key: Meal; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Frühstück', icon: '🌅' },
  { key: 'lunch', label: 'Mittagessen', icon: '☀️' },
  { key: 'dinner', label: 'Abendessen', icon: '🌙' },
  { key: 'snack', label: 'Snacks', icon: '🍎' },
];

export const ACTIVITIES: { key: Activity; label: string; factor: number }[] = [
  { key: 'sedentary', label: 'Kaum aktiv (Bürojob)', factor: 1.2 },
  { key: 'light', label: 'Leicht aktiv (1–3× Sport/Woche)', factor: 1.375 },
  { key: 'moderate', label: 'Mäßig aktiv (3–5× Sport/Woche)', factor: 1.55 },
  { key: 'active', label: 'Sehr aktiv (6–7× Sport/Woche)', factor: 1.725 },
  { key: 'very_active', label: 'Extrem aktiv (körperliche Arbeit)', factor: 1.9 },
];

export const GOALS: { key: Goal; label: string; delta: number }[] = [
  { key: 'lose', label: 'Abnehmen', delta: -500 },
  { key: 'maintain', label: 'Gewicht halten', delta: 0 },
  { key: 'gain', label: 'Zunehmen', delta: 300 },
];

export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  age: 30,
  heightCm: 178,
  weightKg: 80,
  activity: 'light',
  goal: 'maintain',
  customKcal: null,
  waterGoalMl: 2000,
  targetWeightKg: null,
};

/** Grundumsatz nach Mifflin-St Jeor. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

/** Gesamtumsatz inkl. Aktivität. */
export function tdee(p: Profile): number {
  const factor = ACTIVITIES.find((a) => a.key === p.activity)?.factor ?? 1.2;
  return bmr(p) * factor;
}

export function calculatedKcal(p: Profile): number {
  const delta = GOALS.find((g) => g.key === p.goal)?.delta ?? 0;
  return Math.max(1200, Math.round((tdee(p) + delta) / 10) * 10);
}

/** Tagesziele: Kalorien + Makros (25 % Protein, 50 % Kohlenhydrate, 25 % Fett). */
export function dailyTargets(p: Profile): Macros {
  const kcal = p.customKcal ?? calculatedKcal(p);
  return {
    kcal,
    protein: Math.round((kcal * 0.25) / 4),
    carbs: Math.round((kcal * 0.5) / 4),
    fat: Math.round((kcal * 0.25) / 9),
  };
}

export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}

export function scaleMacros(per100: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: round1(per100.protein * f),
    carbs: round1(per100.carbs * f),
    fat: round1(per100.fat * f),
  };
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: round1(acc.protein + m.protein),
      carbs: round1(acc.carbs + m.carbs),
      fat: round1(acc.fat + m.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Datum als YYYY-MM-DD in lokaler Zeit. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatDateLabel(key: string): string {
  const today = toDateKey(new Date());
  if (key === today) return 'Heute';
  if (key === addDays(today, -1)) return 'Gestern';
  if (key === addDays(today, 1)) return 'Morgen';
  return fromDateKey(key).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

/** Meal-Vorschlag nach Uhrzeit. */
export function mealForNow(date = new Date()): Meal {
  const h = date.getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
}
