import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { apiErrorResponse, FALLBACK, getClient, IMAGE_TYPES, ImageType, json, MAX_IMAGE_BYTES, MODEL } from '../../server/claude';

/** Liest Lebensmittel-Angebote aus einem Foto/Screenshot einer Flugblattseite aus. */

const Offer = z.object({
  product: z.string().describe('Produkt auf Deutsch inkl. Marke/Menge, z. B. "Ja! Natürlich Bio-Eier 10 Stück"'),
  price: z.string().describe('Aktionspreis wie angegeben, z. B. "2,99 €" oder "-25 %"'),
  store: z.string().describe('Markt, z. B. "BILLA", "SPAR", "HOFER" – aus Logo/Gestaltung; leer, wenn unklar'),
  valid: z.string().describe('Gültigkeit, falls lesbar (z. B. "bis 30.11."), sonst leer'),
  category: z.enum(['Obst & Gemüse', 'Fleisch & Fisch', 'Milch & Eier', 'Brot & Gebäck', 'Vorrat', 'Tiefkühl', 'Getränke', 'Süßes & Snacks', 'Sonstiges']),
});

const Result = z.object({
  recognized: z.boolean().describe('false, wenn das Bild kein Flugblatt/Angebot zeigt'),
  store: z.string().describe('Markt der Seite, falls erkennbar'),
  offers: z.array(Offer).describe('Nur Lebensmittel und Getränke, keine Haushalts-/Elektroartikel'),
});

export async function POST(request: Request) {
  const c = getClient();
  if ('error' in c) return c.error;

  let body: { image?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request', message: 'Ungültige Anfrage.' }, 400);
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const mediaType = (IMAGE_TYPES as readonly string[]).includes(body.mediaType ?? '') ? (body.mediaType as ImageType) : null;
  if (!image || !mediaType) return json({ error: 'bad_request', message: 'Kein gültiges Bild erhalten.' }, 400);
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'too_large', message: 'Das Bild ist zu groß.' }, 413);

  try {
    const response = await c.client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: 'low', format: betaZodOutputFormat(Result) },
      system:
        'Du liest Angebote aus Fotos oder Screenshots von Supermarkt-Flugblättern in Österreich aus. Erfasse alle lesbaren Lebensmittel- und Getränkeangebote mit Preis, höchstens 40. Erfinde nichts – was nicht lesbar ist, lässt du weg. Antworte auf Deutsch.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: 'Welche Lebensmittel-Angebote stehen auf dieser Flugblattseite?' },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') return json({ error: 'refused', message: 'Dieses Bild konnte nicht ausgewertet werden.' }, 422);
    if (!response.parsed_output) return json({ error: 'no_result', message: 'Keine verwertbare Antwort. Bitte nochmal versuchen.' }, 502);
    return json(response.parsed_output);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
