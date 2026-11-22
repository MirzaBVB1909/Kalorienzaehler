import { Appearance, Platform } from 'react-native';

/** Darstellung: automatisch (wie das Handy), hell oder dunkel. */
export type ThemePref = 'auto' | 'light' | 'dark';

const THEME_KEY = 'kalorienzaehler/theme';

const light = {
  bg: '#F4F6F8',
  card: '#FFFFFF',
  input: '#FFFFFF',
  text: '#1A1D21',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#16A34A',
  primarySoft: '#DCFCE7',
  danger: '#DC2626',
  warning: '#F59E0B',
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EC4899',
  track: '#E5E7EB',
  water: '#0EA5E9',
  waterSoft: '#E0F2FE',
  segment: '#E5E7EB',
  segmentActive: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0F1115',
  card: '#1A1D23',
  input: '#22262E',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#2F343D',
  primary: '#22C55E',
  primarySoft: '#14341F',
  danger: '#F87171',
  warning: '#FBBF24',
  protein: '#60A5FA',
  carbs: '#FBBF24',
  fat: '#F472B6',
  track: '#2F343D',
  water: '#38BDF8',
  waterSoft: '#0C2A3A',
  segment: '#22262E',
  segmentActive: '#3A3F4A',
};

/** Gespeicherte Einstellung (im Web synchron lesbar, damit die Farben schon beim Start stimmen). */
export function getThemePref(): ThemePref {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  }
  return 'auto';
}

/** Speichert die Einstellung und lädt die App neu, damit alle Farben wechseln. */
export function setThemePref(pref: ThemePref) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, pref);
    window.location.reload();
  }
}

function resolveDark(): boolean {
  const pref = getThemePref();
  if (pref !== 'auto') return pref === 'dark';
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return Appearance.getColorScheme() === 'dark';
}

export const isDark = resolveDark();
export const colors = isDark ? dark : light;

export const radius = 16;
export const spacing = 16;
