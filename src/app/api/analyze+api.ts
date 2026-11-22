import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

/**
 * Server-Funktion (läuft auf EAS Hosting, nicht im Browser): analysiert ein Foto
 * von Essen oder einem Nährwert-Etikett mit Claude und gibt Nährwerte als JSON zurück.
 *
 * Benötigte Umgebungsvariablen (auf expo.dev unter Projekt → Environment variables):
 *   ANTHROPIC_API_KEY  – API-Schlüssel von platform.claude.com (Sichtbarkeit „Sensitive“)
 * Kostenschutz: vorausbezahltes Guthaben ohne automatische Aufladung.
 */

const FoodItem = z.object({
  name: z.string().describe('Deutscher Name des Lebensmittels/Gerichts, z. B. "Wiener Schnitzel" oder "Pommes frites"'),
  grams: z.number().describe('Menge in g (bzw. ml bei Getränken). Beim Etikett: 100'),
  unit: z.enum(['g', 'ml']),
  kcal: z.number().describe('Kalorien für genau diese Menge'),
  protein: z.number().describe('Eiweiß in g für diese Menge'),
  carbs: z.number().describe('Kohlenhydrate in g für diese Menge'),
  fat: z.number().describe('Fett in g für diese Menge'),
  portion_grams: z.number().describe('Typische Portion in g/ml (beim Etikett z. B. Packungsgröße oder angegebene Portion, sonst gleich grams)'),
});

const Analysis = z.object({
  recognized: z.boolean().describe('false, wenn auf dem Bild kein Essen, Getränk oder Nährwert-Etikett zu erkennen ist'),
  kind: z.enum(['meal', 'label']).describe('meal = Foto von Essen/Getränk, label = Nährwerttabelle/Etikett'),
  items: z.array(FoodItem),
  confidence: z.enum(['hoch', 'mittel', 'niedrig']),
  note: z.string().describe('Ein kurzer deutscher Hinweis an den Nutzer (max. 2 Sätze), z. B. Annahmen zu Öl, Soße oder Portionsgröße'),
});

const SYSTEM = `Du bist eine erfahrene Ernährungsberaterin und schätzt Nährwerte aus Fotos für eine Kalorienzähler-App (Nutzer in Österreich).

Bei einem Foto von Essen (kind = "meal"):
- Zerlege die Mahlzeit in ihre sichtbaren Bestandteile (z. B. Schnitzel, Pommes, Salat, Soße) – höchstens 8 Einträge.
- Schätze die Menge jedes Bestandteils in Gramm anhand von Tellergröße, Besteck und typischen Portionen. Getränke in ml.
- Rechne Kalorien und Makronährstoffe für genau diese Menge, inklusive üblicher Zubereitung (Frittierfett, Butter, Öl, Panier).
- Wenn du unsicher bist, nimm eine realistische Durchschnittsportion und sag das im Hinweis.

Bei einem Foto eines Nährwert-Etiketts (kind = "label"):
- Lies die Werte "pro 100 g" bzw. "pro 100 ml" ab und gib genau einen Eintrag mit grams = 100 zurück.
- Name: Produktname, falls lesbar, sonst eine passende Beschreibung.
- portion_grams: angegebene Portionsgröße oder Packungsinhalt, falls lesbar, sonst 100.
- Rechne kJ nur dann um, wenn keine kcal angegeben sind (1 kcal = 4,184 kJ).

Antworte immer auf Deutsch. Ist nichts davon zu erkennen, setze recognized = false und items = [].`;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof ALLOWED_TYPES)[number];

/** Liest eine Umgebungsvariable unabhängig von Groß-/Kleinschreibung (z. B. "Anthropic_api_key"). */
function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const key = Object.keys(process.env).find((k) => k.toUpperCase() === name);
  return key ? process.env[key] : undefined;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const apiKey = env('ANTHROPIC_API_KEY')?.trim();
  if (!apiKey) {
    return json({ error: 'not_configured', message: 'Die KI-Erkennung ist noch nicht eingerichtet (API-Schlüssel fehlt).' }, 503);
  }

  let body: { image?: string; mediaType?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request', message: 'Ungültige Anfrage.' }, 400);
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const mediaType = (ALLOWED_TYPES as readonly string[]).includes(body.mediaType ?? '') ? (body.mediaType as MediaType) : null;
  if (!image || !mediaType) return json({ error: 'bad_request', message: 'Kein gültiges Bild erhalten.' }, 400);
  if (image.length * 0.75 > MAX_BYTES) return json({ error: 'too_large', message: 'Das Bild ist zu groß.' }, 413);

  const hint =
    body.mode === 'label'
      ? 'Das Foto zeigt vermutlich ein Nährwert-Etikett. Lies die Werte pro 100 g/ml ab.'
      : 'Das Foto zeigt vermutlich eine Mahlzeit oder ein Getränk. Schätze Bestandteile, Mengen und Nährwerte.';

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      // Fällt bei einer Sicherheits-Ablehnung automatisch auf ein passendes anderes Modell zurück.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(Analysis) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: hint },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'refused', message: 'Dieses Bild konnte nicht ausgewertet werden.' }, 422);
    }
    const result = response.parsed_output;
    if (!result) return json({ error: 'no_result', message: 'Die KI hat keine verwertbare Antwort geliefert. Bitte nochmal versuchen.' }, 502);
    return json(result);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: 'bad_key', message: 'Der API-Schlüssel ist ungültig.' }, 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'rate_limited', message: 'Gerade zu viele Anfragen. Bitte kurz warten.' }, 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      // z. B. kein Guthaben mehr auf dem API-Konto
      return json({ error: 'api_rejected', message: `Die KI hat die Anfrage abgelehnt: ${error.message}` }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      return json({ error: 'api_error', message: 'Die KI ist gerade nicht erreichbar. Bitte später nochmal versuchen.' }, 502);
    }
    return json({ error: 'server_error', message: 'Unerwarteter Fehler bei der Auswertung.' }, 500);
  }
}
