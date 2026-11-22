import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Food, Unit } from './foods';
import { DEFAULT_PROFILE, Macros, Meal, Profile, toDateKey } from './nutrition';

export type Entry = Macros & {
  id: string;
  date: string; // YYYY-MM-DD
  meal: Meal;
  name: string;
  grams: number | null; // Menge in g bzw. ml; null = Schnelleingabe ohne Menge
  unit?: Unit; // fehlt bei älteren Einträgen → 'g'
  foodId: string | null;
  createdAt: number;
};

export type WeightLog = { date: string; kg: number };

type State = {
  entries: Entry[];
  profile: Profile;
  customFoods: Food[];
  weights: WeightLog[];
};

type Store = State & {
  loaded: boolean;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  addEntry: (e: Omit<Entry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  updateProfile: (p: Partial<Profile>) => void;
  /** Speichert ein eigenes Lebensmittel; mit `id` wird ein vorhandenes gleicher id ersetzt (z. B. Barcode-Produkte). */
  addCustomFood: (f: Omit<Food, 'id'> & { id?: string }) => Food;
  removeCustomFood: (id: string) => void;
  logWeight: (kg: number) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'kalorienzaehler/v1';

const INITIAL: State = {
  entries: [],
  profile: DEFAULT_PROFILE,
  customFoods: [],
  weights: [],
};

const StoreContext = createContext<Store | null>(null);

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<State>;
        setState({
          ...INITIAL,
          ...parsed,
          profile: { ...DEFAULT_PROFILE, ...parsed.profile },
        });
      })
      .catch((err) => console.warn('Daten konnten nicht geladen werden', err))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.warn('Daten konnten nicht gespeichert werden', err),
    );
  }, [state, loaded]);

  const addEntry = useCallback<Store['addEntry']>((e) => {
    setState((s) => ({ ...s, entries: [...s.entries, { ...e, id: uid(), createdAt: Date.now() }] }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const updateProfile = useCallback((p: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  }, []);

  const addCustomFood = useCallback((f: Omit<Food, 'id'> & { id?: string }) => {
    const food: Food = { ...f, id: f.id ?? `custom-${uid()}` };
    setState((s) => ({ ...s, customFoods: [food, ...s.customFoods.filter((c) => c.id !== food.id)] }));
    return food;
  }, []);

  const removeCustomFood = useCallback((id: string) => {
    setState((s) => ({ ...s, customFoods: s.customFoods.filter((f) => f.id !== id) }));
  }, []);

  const logWeight = useCallback((kg: number) => {
    const date = toDateKey(new Date());
    setState((s) => ({
      ...s,
      profile: { ...s.profile, weightKg: kg },
      weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }));
  }, []);

  const resetAll = useCallback(() => setState(INITIAL), []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      loaded,
      selectedDate,
      setSelectedDate,
      addEntry,
      removeEntry,
      updateProfile,
      addCustomFood,
      removeCustomFood,
      logWeight,
      resetAll,
    }),
    [state, loaded, selectedDate, addEntry, removeEntry, updateProfile, addCustomFood, removeCustomFood, logWeight, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore muss innerhalb von <StoreProvider> verwendet werden');
  return ctx;
}

/** Zuletzt verwendete Lebensmittel (eindeutig, neueste zuerst). */
export function recentFoodIds(entries: Entry[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = entries.length - 1; i >= 0 && out.length < limit; i--) {
    const id = entries[i].foodId;
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}
