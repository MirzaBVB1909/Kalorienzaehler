import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Unit } from './foods';

/** Ein von der KI erkannter Bestandteil (Werte gelten für `grams`). */
export type AiItem = {
  name: string;
  grams: number;
  unit: Unit;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion_grams: number;
};

export type AiAnalysis = {
  recognized: boolean;
  kind: 'meal' | 'label';
  items: AiItem[];
  confidence: 'hoch' | 'mittel' | 'niedrig';
  note: string;
};

export type AiMode = 'meal' | 'label';

const CODE_KEY = 'kalorienzaehler/ai-code';

export async function getAiCode(): Promise<string> {
  return (await AsyncStorage.getItem(CODE_KEY)) ?? '';
}

export async function setAiCode(code: string): Promise<void> {
  await AsyncStorage.setItem(CODE_KEY, code.trim());
}

export type Photo = { base64: string; mediaType: 'image/jpeg'; previewUri: string };

/**
 * Öffnet Kamera bzw. Fotoauswahl (Web/iPhone) und verkleinert das Bild auf max. 1280 px als JPEG –
 * das macht die Analyse schneller und günstiger. Gibt null zurück, wenn abgebrochen.
 */
export function takePhoto(options: { camera?: boolean } = { camera: true }): Promise<Photo | null> {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('Die Foto-Erkennung ist in der Web-App verfügbar.'));
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Ohne capture bietet das iPhone Kamera, Fotomediathek (z. B. Screenshots) und Dateien an.
    if (options.camera) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Bild konnte nicht verarbeitet werden.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg', previewUri: dataUrl });
      };
      img.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
      img.src = url;
    };
    input.click();
  });
}

/** POST an eine eigene Server-Funktion; wirft Fehler mit deutscher Meldung. */
async function post<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Keine Internetverbindung. Bitte nochmal versuchen.');
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string; message?: string }) | null;
  if (!res.ok || !data || data.error) {
    const err = new Error(data?.message ?? `Fehler ${res.status}`);
    (err as Error & { code?: string }).code = data?.error;
    throw err;
  }
  return data;
}

/** Schickt das Foto an die eigene Server-Funktion (/api/analyze), die Claude fragt. */
export function analyzePhoto(photo: Photo, mode: AiMode, code: string): Promise<AiAnalysis> {
  return post<AiAnalysis>('/api/analyze', { image: photo.base64, mediaType: photo.mediaType, mode }, { 'x-app-code': code });
}

export type RecipeSuggestion = {
  name: string;
  description: string;
  servings: number;
  minutes: number;
  grams_per_serving: number;
  kcal_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  ingredients: { name: string; amount: string; price_eur: number }[];
  cost_per_serving_eur: number;
  steps: string[];
  uses_offers: string[];
  day: string;
  image_query: string;
  emoji: string;
  /** Foto von Pexels (kostenlos), null wenn keines gefunden/eingerichtet. */
  photo?: { url: string; photographer: string; photographerUrl: string; pexelsUrl: string; alt: string } | null;
};

export type RecipeResult = {
  recipes: RecipeSuggestion[];
  shopping_list: { name: string; amount: string; store: string; price_eur: number }[];
  tip: string;
  total_cost_eur: number;
};

export function suggestRecipes(input: {
  mode: 'recipes' | 'weekplan';
  kcalLeft: number;
  proteinLeft: number;
  dailyKcal: number;
  preferences: string[];
  pantry: string;
  offers: { product: string; price: string; store: string }[];
  days?: number;
  diet: string[];
  budgetPerServing: number | null;
  budgetWeekly: number | null;
  adults: number;
  kids: number;
}): Promise<RecipeResult> {
  return post<RecipeResult>('/api/recipes', input);
}

export type FlyerResult = {
  recognized: boolean;
  store: string;
  offers: { product: string; price: string; store: string; valid: string; category: string }[];
};

export function readFlyer(photo: Photo): Promise<FlyerResult> {
  return post<FlyerResult>('/api/flyer', { image: photo.base64, mediaType: photo.mediaType });
}
