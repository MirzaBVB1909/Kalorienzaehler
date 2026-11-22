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

export type ShoppingItem = { id: string; name: string; amount: string; store: string; checked: boolean };
export type Offer = { id: string; product: string; price: string; store: string; valid: string; category: string; addedAt: number };

export type State = {
  entries: Entry[];
  profile: Profile;
  customFoods: Food[];
  weights: WeightLog[];
  /** ids von Lebensmitteln, die als Favorit markiert sind. */
  favorites: string[];
  /** Getrunkenes Wasser pro Tag in ml (YYYY-MM-DD → ml). */
  water: Record<string, number>;
  shopping: ShoppingItem[];
  offers: Offer[];
  /** Vorlieben für Rezeptvorschläge (z. B. "Österreichisch", "Schnell"). */
  recipePrefs: string[];
};

type Store = State & {
  loaded: boolean;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  addEntry: (e: Omit<Entry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, changes: Partial<Omit<Entry, 'id' | 'createdAt'>>) => void;
  removeEntry: (id: string) => void;
  /** Kopiert Einträge (z. B. das Frühstück von gestern) auf ein anderes Datum. */
  copyEntries: (ids: string[], toDate: string) => void;
  updateProfile: (p: Partial<Profile>) => void;
  /** Speichert ein eigenes Lebensmittel; mit `id` wird ein vorhandenes gleicher id ersetzt (z. B. Barcode-Produkte). */
  addCustomFood: (f: Omit<Food, 'id'> & { id?: string }) => Food;
  removeCustomFood: (id: string) => void;
  toggleFavorite: (foodId: string) => void;
  addWater: (date: string, ml: number) => void;
  logWeight: (kg: number) => void;
  addShopping: (items: Omit<ShoppingItem, 'id' | 'checked'>[]) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearCheckedShopping: () => void;
  addOffers: (offers: Omit<Offer, 'id' | 'addedAt'>[]) => void;
  removeOffer: (id: string) => void;
  clearOffers: () => void;
  setRecipePrefs: (prefs: string[]) => void;
  /** Ersetzt alle Daten (Wiederherstellen aus einer Sicherung). */
  replaceAll: (s: State) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'kalorienzaehler/v1';

const INITIAL: State = {
  entries: [],
  profile: DEFAULT_PROFILE,
  customFoods: [],
  weights: [],
  favorites: [],
  water: {},
  shopping: [],
  offers: [],
  recipePrefs: [],
};

/** Ergänzt fehlende Felder (ältere Speicherstände, Sicherungsdateien). */
export function normalizeState(parsed: Partial<State>): State {
  return {
    ...INITIAL,
    ...parsed,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
    weights: Array.isArray(parsed.weights) ? parsed.weights : [],
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    water: parsed.water && typeof parsed.water === 'object' ? parsed.water : {},
    shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
    offers: Array.isArray(parsed.offers) ? parsed.offers : [],
    recipePrefs: Array.isArray(parsed.recipePrefs) ? parsed.recipePrefs : [],
    profile: { ...DEFAULT_PROFILE, ...parsed.profile },
  };
}

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
        setState(normalizeState(JSON.parse(raw) as Partial<State>));
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

  const updateEntry = useCallback<Store['updateEntry']>((id, changes) => {
    setState((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...changes } : e)) }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const copyEntries = useCallback((ids: string[], toDate: string) => {
    setState((s) => {
      const now = Date.now();
      const copies = s.entries
        .filter((e) => ids.includes(e.id))
        .map((e, i) => ({ ...e, id: uid(), date: toDate, createdAt: now + i }));
      return { ...s, entries: [...s.entries, ...copies] };
    });
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
    setState((s) => ({
      ...s,
      customFoods: s.customFoods.filter((f) => f.id !== id),
      favorites: s.favorites.filter((f) => f !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((foodId: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(foodId) ? s.favorites.filter((f) => f !== foodId) : [foodId, ...s.favorites],
    }));
  }, []);

  const addWater = useCallback((date: string, ml: number) => {
    setState((s) => ({ ...s, water: { ...s.water, [date]: Math.max(0, (s.water[date] ?? 0) + ml) } }));
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

  const addShopping = useCallback((items: Omit<ShoppingItem, 'id' | 'checked'>[]) => {
    setState((s) => {
      const existing = new Set(s.shopping.filter((i) => !i.checked).map((i) => i.name.trim().toLowerCase()));
      const fresh = items
        .filter((i) => i.name.trim() && !existing.has(i.name.trim().toLowerCase()))
        .map((i) => ({ ...i, name: i.name.trim(), id: uid(), checked: false }));
      return { ...s, shopping: [...s.shopping, ...fresh] };
    });
  }, []);
  const toggleShopping = useCallback((id: string) => {
    setState((s) => ({ ...s, shopping: s.shopping.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }));
  }, []);
  const removeShopping = useCallback((id: string) => {
    setState((s) => ({ ...s, shopping: s.shopping.filter((i) => i.id !== id) }));
  }, []);
  const clearCheckedShopping = useCallback(() => {
    setState((s) => ({ ...s, shopping: s.shopping.filter((i) => !i.checked) }));
  }, []);
  const addOffers = useCallback((offers: Omit<Offer, 'id' | 'addedAt'>[]) => {
    const now = Date.now();
    setState((s) => ({ ...s, offers: [...offers.map((o, i) => ({ ...o, id: uid(), addedAt: now + i })), ...s.offers].slice(0, 200) }));
  }, []);
  const removeOffer = useCallback((id: string) => {
    setState((s) => ({ ...s, offers: s.offers.filter((o) => o.id !== id) }));
  }, []);
  const clearOffers = useCallback(() => setState((s) => ({ ...s, offers: [] })), []);
  const setRecipePrefs = useCallback((prefs: string[]) => setState((s) => ({ ...s, recipePrefs: prefs })), []);

  const replaceAll = useCallback((next: State) => setState(normalizeState(next)), []);
  const resetAll = useCallback(() => setState(INITIAL), []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      loaded,
      selectedDate,
      setSelectedDate,
      addEntry,
      updateEntry,
      removeEntry,
      copyEntries,
      updateProfile,
      addCustomFood,
      removeCustomFood,
      toggleFavorite,
      addWater,
      logWeight,
      addShopping,
      toggleShopping,
      removeShopping,
      clearCheckedShopping,
      addOffers,
      removeOffer,
      clearOffers,
      setRecipePrefs,
      replaceAll,
      resetAll,
    }),
    [
      state,
      loaded,
      selectedDate,
      addEntry,
      updateEntry,
      removeEntry,
      copyEntries,
      updateProfile,
      addCustomFood,
      removeCustomFood,
      toggleFavorite,
      addWater,
      logWeight,
      addShopping,
      toggleShopping,
      removeShopping,
      clearCheckedShopping,
      addOffers,
      removeOffer,
      clearOffers,
      setRecipePrefs,
      replaceAll,
      resetAll,
    ],
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
