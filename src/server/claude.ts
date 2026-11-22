import Anthropic from '@anthropic-ai/sdk';

/** Gemeinsame Helfer für die Server-Funktionen (laufen auf EAS Hosting, nie im Browser). */

/** Liest eine Umgebungsvariable unabhängig von Groß-/Kleinschreibung (z. B. "Anthropic_api_key"). */
export function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const key = Object.keys(process.env).find((k) => k.toUpperCase() === name);
  return key ? process.env[key] : undefined;
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Erstellt den Claude-Client oder liefert eine fertige Fehlerantwort, wenn kein Schlüssel hinterlegt ist. */
export function getClient(): { client: Anthropic } | { error: Response } {
  const apiKey = env('ANTHROPIC_API_KEY')?.trim();
  if (!apiKey) {
    return { error: json({ error: 'not_configured', message: 'Die KI ist noch nicht eingerichtet (API-Schlüssel fehlt).' }, 503) };
  }
  return { client: new Anthropic({ apiKey }) };
}

/** Übersetzt Fehler der Claude-API in verständliche deutsche Antworten. */
export function apiErrorResponse(error: unknown): Response {
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
  return json({ error: 'server_error', message: 'Unerwarteter Fehler.' }, 500);
}

export const MODEL = 'claude-opus-5-5';
/** Bei einer Sicherheits-Ablehnung springt automatisch ein passendes anderes Modell ein. */
export const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const };

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
