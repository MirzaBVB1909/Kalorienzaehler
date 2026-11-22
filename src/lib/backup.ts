import { Platform, Share } from 'react-native';

import { MEALS } from './nutrition';
import { normalizeState, State } from './store';

const APP_ID = 'kalorienzaehler';

type BackupFile = { app: typeof APP_ID; version: 1; exportedAt: string; data: State };

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Teilt eine Datei (iPhone: „Teilen“-Menü → z. B. „In Dateien sichern“) oder lädt sie herunter. */
async function shareOrDownload(filename: string, content: string, mime: string): Promise<ShareResult> {
  if (Platform.OS !== 'web') {
    // In Expo Go: Inhalt als Text teilen (z. B. per Mail an sich selbst).
    const res = await Share.share({ title: filename, message: content });
    return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
  }
  const blob = new Blob([content], { type: mime });
  const file = new File([blob], filename, { type: mime });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
      // sonst: auf Download zurückfallen
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

/** Vollständige Sicherung aller Daten als JSON-Datei (zum Wiederherstellen). */
export function exportBackup(state: State): Promise<ShareResult> {
  const file: BackupFile = { app: APP_ID, version: 1, exportedAt: new Date().toISOString(), data: state };
  return shareOrDownload(`kalorienzaehler-sicherung-${today()}.json`, JSON.stringify(file, null, 2), 'application/json');
}

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Tagebuch als CSV-Tabelle (öffnet sich in Excel/Numbers; Semikolon + Dezimalkomma). */
export function exportCsv(state: State): Promise<ShareResult> {
  const mealLabel = (m: string) => MEALS.find((x) => x.key === m)?.label ?? m;
  const header = ['Datum', 'Mahlzeit', 'Lebensmittel', 'Menge', 'Einheit', 'kcal', 'Eiweiß (g)', 'Kohlenhydrate (g)', 'Fett (g)'];
  const rows = [...state.entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((e) =>
      [e.date, mealLabel(e.meal), e.name, e.grams, e.grams != null ? (e.unit ?? 'g') : '', e.kcal, e.protein, e.carbs, e.fat]
        .map(csvCell)
        .join(';'),
    );
  const waterRows = Object.entries(state.water)
    .filter(([, ml]) => ml > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ml]) => [date, 'Wasser-Tracker', 'Wasser', ml, 'ml', 0, 0, 0, 0].map(csvCell).join(';'));
  // BOM, damit Excel Umlaute richtig anzeigt
  const csv = '﻿' + [header.join(';'), ...rows, ...waterRows].join('\r\n');
  return shareOrDownload(`kalorienzaehler-tagebuch-${today()}.csv`, csv, 'text/csv');
}

/** Liest eine Sicherungsdatei ein. Gibt null zurück, wenn abgebrochen; wirft bei ungültiger Datei. */
export function pickBackup(): Promise<State | null> {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('Wiederherstellen ist in der Web-App möglich.'));
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const parsed = JSON.parse(await file.text()) as Partial<BackupFile>;
        if (parsed.app !== APP_ID || !parsed.data || !Array.isArray(parsed.data.entries)) {
          throw new Error('Das ist keine Sicherungsdatei des Kalorienzählers.');
        }
        resolve(normalizeState(parsed.data));
      } catch (err) {
        reject(err instanceof SyntaxError ? new Error('Die Datei konnte nicht gelesen werden.') : err);
      }
    };
    input.click();
  });
}
