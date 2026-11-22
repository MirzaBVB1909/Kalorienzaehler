import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { apiErrorResponse, FALLBACK, getClient, json, MODEL } from '../../server/claude';

/**
 * Rezeptvorschläge bzw. Wochenplan mit Einkaufsliste – passend zu den restlichen
 * Kalorien des Tages, Vorlieben, Vorräten und erfassten Flugblatt-Angeboten.
 */

const Ingredient = z.object({
  name: z.string().describe('Zutat auf Deutsch, z. B. "Hühnerbrust"'),
  amount: z.string().describe('Menge für das ganze Rezept, z. B. "300 g", "2 Stück", "1 EL"'),
});

const Recipe = z.object({
  name: z.string(),
  description: z.string().describe('Ein Satz, warum das Rezept passt'),
  servings: z.number().describe('Anzahl Portionen'),
  minutes: z.number().describe('Gesamtzeit in Minuten'),
  grams_per_serving: z.number().describe('Gewicht einer Portion in Gramm'),
  kcal_per_serving: z.number(),
  protein_per_serving: z.number().describe('Eiweiß in g pro Portion'),
  carbs_per_serving: z.number().describe('Kohlenhydrate in g pro Portion'),
  fat_per_serving: z.number().describe('Fett in g pro Portion'),
  ingredients: z.array(Ingredient),
  steps: z.array(z.string()).describe('Zubereitungsschritte, kurz und klar'),
  uses_offers: z.array(z.string()).describe('Namen der verwendeten Angebote aus der Liste (leer, wenn keine)'),
  day: z.string().describe('Nur beim Wochenplan: Wochentag, z. B. "Montag"; sonst leer'),
});

const ShoppingItem = z.object({
  name: z.string(),
  amount: z.string().describe('Gesamtmenge für alle Rezepte'),
  store: z.string().describe('Markt, wenn es ein passendes Angebot gibt (z. B. "BILLA"), sonst leer'),
});

const Result = z.object({
  recipes: z.array(Recipe),
  shopping_list: z.array(ShoppingItem).describe('Beim Wochenplan: zusammengefasste Einkaufsliste; sonst leer'),
  tip: z.string().describe('Ein kurzer Hinweis auf Deutsch (max. 2 Sätze)'),
});

type Offer = { product: string; price: string; store: string };

const SYSTEM = `Du bist eine kreative, alltagstaugliche Köchin und Ernährungsberaterin für eine Kalorienzähler-App in Österreich.
- Verwende in Österreich übliche Zutaten und Begriffe (Topfen, Obers, Erdäpfel, Faschiertes, Paradeiser usw.).
- Rezepte sollen realistisch, für Anfänger machbar und gut einkaufbar sein.
- Kalorien und Nährwerte pro Portion realistisch berechnen.
- Wenn Angebote aus Flugblättern angegeben sind, nutze sie bevorzugt, aber nur, wenn sie sinnvoll passen.
- Wenn Vorräte angegeben sind, nutze sie möglichst und ergänze nur wenige Zutaten.
- Antworte immer auf Deutsch.`;

export async function POST(request: Request) {
  const c = getClient();
  if ('error' in c) return c.error;

  let body: {
    mode?: string;
    kcalLeft?: number;
    proteinLeft?: number;
    dailyKcal?: number;
    preferences?: string[];
    pantry?: string;
    offers?: Offer[];
    days?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request', message: 'Ungültige Anfrage.' }, 400);
  }

  const weekplan = body.mode === 'weekplan';
  const days = Math.min(7, Math.max(2, Math.round(body.days ?? 5)));
  const prefs = (body.preferences ?? []).filter((p) => typeof p === 'string').slice(0, 10);
  const pantry = typeof body.pantry === 'string' ? body.pantry.slice(0, 500) : '';
  const offers = (Array.isArray(body.offers) ? body.offers : []).slice(0, 60);

  const lines: string[] = [];
  if (weekplan) {
    lines.push(
      `Erstelle einen Wochenplan mit ${days} Hauptgerichten (Abendessen) für ${days} Tage, je 2 Portionen, und eine zusammengefasste Einkaufsliste.`,
      `Tageskalorienziel: ${Math.round(body.dailyKcal ?? 2000)} kcal – ein Hauptgericht sollte etwa 30–40 % davon pro Portion haben.`,
    );
  } else {
    lines.push(
      'Schlage 3 unterschiedliche Rezepte für die nächste Mahlzeit vor.',
      `Heute noch übrig: ${Math.round(body.kcalLeft ?? 600)} kcal und ${Math.round(body.proteinLeft ?? 30)} g Eiweiß – eine Portion soll da hineinpassen (eher etwas darunter).`,
      'shopping_list leer lassen.',
    );
  }
  if (prefs.length) lines.push(`Vorlieben: ${prefs.join(', ')}.`);
  if (pantry) lines.push(`Vorhanden zu Hause: ${pantry}`);
  if (offers.length) {
    lines.push('Aktuelle Angebote aus Flugblättern:');
    for (const o of offers) lines.push(`- ${String(o.product).slice(0, 80)} – ${String(o.price).slice(0, 30)} (${String(o.store).slice(0, 30)})`);
  }

  try {
    const response = await c.client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: 'medium', format: betaZodOutputFormat(Result) },
      system: SYSTEM,
      messages: [{ role: 'user', content: lines.join('\n') }],
    });
    if (response.stop_reason === 'refusal') return json({ error: 'refused', message: 'Dazu konnten keine Vorschläge erstellt werden.' }, 422);
    if (!response.parsed_output) return json({ error: 'no_result', message: 'Keine verwertbare Antwort. Bitte nochmal versuchen.' }, 502);
    return json(response.parsed_output);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
