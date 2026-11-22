import type { Food, Unit } from './foods';
import { round1 } from './nutrition';

/** Ergebnis einer Barcode-Suche: ein Lebensmittel (ohne id) oder ein Grund, warum es nicht geklappt hat. */
export type LookupResult =
  | { ok: true; food: Omit<Food, 'id'> }
  | { ok: false; reason: 'not_found' | 'no_nutrition' | 'network' };

type OffProduct = {
  product_name?: string;
  product_name_de?: string;
  brands?: string;
  quantity?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

const FIELDS = 'product_name,product_name_de,brands,quantity,serving_quantity,nutriments';

/** Nur Ziffern, 8–14 Stellen (EAN-8, UPC, EAN-13, GTIN-14). */
export function cleanBarcode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Erkennt Getränke an der Packungsangabe ("330 ml", "1,5 l", "33 cl"). */
function unitFromQuantity(quantity?: string): Unit {
  return quantity && /\d\s*(ml|cl|l)\b/i.test(quantity) ? 'ml' : 'g';
}

/** Packungsgröße in g bzw. ml aus "500 g", "1,5 l", "33 cl". */
function amountFromQuantity(quantity?: string): number | null {
  const m = quantity?.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i);
  if (!m) return null;
  const value = parseFloat(m[1].replace(',', '.'));
  const factor = { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 }[m[2].toLowerCase() as 'kg' | 'g' | 'l' | 'cl' | 'ml'];
  return Math.round(value * factor);
}

/** Wandelt ein Open-Food-Facts-Produkt in unser Food-Format (Werte pro 100 g/ml). */
export function productToFood(p: OffProduct): Omit<Food, 'id'> | null {
  const n = p.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) != null ? num(n['energy_100g'])! / 4.184 : null);
  if (kcal == null) return null;

  const baseName = (p.product_name_de || p.product_name || '').trim() || 'Unbekanntes Produkt';
  const brand = p.brands?.split(',')[0]?.trim();
  const b = brand?.toLowerCase() ?? '';
  const n0 = baseName.toLowerCase();
  const name = brand && !n0.includes(b) && !b.includes(n0) ? `${baseName} (${brand})` : baseName;

  const unit = unitFromQuantity(p.quantity);
  const serving = num(p.serving_quantity);
  const pack = amountFromQuantity(p.quantity);
  let portion = 100;
  let portionLabel: string | undefined;
  if (serving && serving > 0 && serving <= 2000) {
    portion = Math.round(serving);
    portionLabel = '1 Portion';
  } else if (pack && pack > 0 && pack <= 1000) {
    portion = pack;
    portionLabel = '1 Packung';
  }

  return {
    name,
    kcal: Math.round(kcal),
    protein: round1(num(n['proteins_100g']) ?? 0),
    carbs: round1(num(n['carbohydrates_100g']) ?? 0),
    fat: round1(num(n['fat_100g']) ?? 0),
    portion,
    portionLabel,
    unit,
  };
}

/** Sucht einen Barcode in der freien Datenbank Open Food Facts. */
export async function lookupBarcode(code: string): Promise<LookupResult> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`);
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const data = (await res.json()) as { status?: number; product?: OffProduct };
    if (data.status !== 1 || !data.product) return { ok: false, reason: 'not_found' };
    const food = productToFood(data.product);
    return food ? { ok: true, food } : { ok: false, reason: 'no_nutrition' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
