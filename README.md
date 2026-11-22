# Kalorienzähler 🥗

Eine Kalorienzähler-App mit [Expo](https://expo.dev) (SDK 58), Expo Router und TypeScript. Läuft auf iOS, Android und im Web. Alle Daten werden lokal auf dem Gerät gespeichert (AsyncStorage); es gibt kein Konto und kein Backend.

## Funktionen

- **Tagebuch:** Kalorienring mit Restkalorien, Makro-Balken (Eiweiß, Kohlenhydrate, Fett), Einträge nach Mahlzeit (Frühstück, Mittag, Abend, Snacks), Navigation zwischen Tagen
- **Hinzufügen:**
  - Suche in rund 180 Lebensmitteln, Getränken und Gerichten (u. a. österreichische, türkische und italienische Küche) (Nährwerte pro 100 g bzw. 100 ml) mit Portionsvorschlägen
  - Filter „Getränke“ (Wasser, Kaffee, Tee, Säfte, Softdrinks, Alkohol …), Mengen in ml
  - **Barcode-Scanner:** Strichcode von Verpackungen scannen (oder Nummer eintippen), Nährwerte kommen aus der freien Datenbank Open Food Facts
  - **KI-Fotoerkennung (Claude):** Teller fotografieren → Bestandteile, Mengen und Kalorien werden geschätzt; Nährwert-Etiketten werden abgelesen
  - „Zuletzt verwendet“ für schnelles Wiederholen
  - Schnelleingabe nur mit Kalorien (z. B. Restaurant)
  - Eigene Lebensmittel anlegen (werden gespeichert und tauchen in der Suche auf)
- **Bearbeiten:** Einträge antippen, um Menge, Mahlzeit oder Werte zu ändern; „Wie Vortag“ übernimmt eine Mahlzeit von gestern
- **Favoriten (⭐)** und **Rezepte** (Gericht aus Zutaten zusammenstellen, kcal pro Portion)
- **Wasser-Tracker** mit Tagesziel
- **Planer (KI):** Rezeptvorschläge passend zu den restlichen Kalorien, Vorlieben und Vorräten; Wochenplan mit Einkaufsliste
- **Angebote:** Links zu den Flugblättern österreichischer Märkte; Flugblattseiten per Foto/Screenshot auslesen und bei Rezepten berücksichtigen
- **Einkaufsliste** zum Abhaken und Teilen
- **Verlauf:** Balkendiagramm für 7 oder 30 Tage, Wochenrückblick mit Tipps, Gewichtsdiagramm mit Zielgewicht
- **Export & Sicherung:** komplette Sicherung als Datei (wiederherstellbar) und Tagebuch als Excel/CSV-Tabelle
- **Dunkelmodus** (automatisch oder manuell)
- **Profil:** Kalorienbedarf nach Mifflin-St Jeor (Geschlecht, Alter, Größe, Gewicht, Aktivität, Ziel), optional ein eigenes Kalorienziel, BMI, Gewicht loggen

Einträge löschen: auf ✕ tippen oder den Eintrag lange drücken.

## Starten

```bash
npm install
npx expo start
```

Dann den QR-Code mit der **Expo Go**-App scannen (Android/iOS), oder `w` für den Browser drücken.

## Struktur

```
src/
  app/                 # Screens (Expo Router)
    _layout.tsx        # Root-Stack + Daten-Provider
    (tabs)/            # Tagebuch, Verlauf, Profil
    add.tsx            # Modal: Lebensmittel hinzufügen
  components/ui.tsx    # Wiederverwendbare UI-Bausteine
  lib/
    foods.ts           # Lebensmittel-Datenbank
    nutrition.ts       # Bedarfsberechnung, Datums- und Makro-Helfer
    store.tsx          # Zustand + Speicherung (AsyncStorage)
    theme.ts           # Farben
```

## Prüfen

```bash
npx tsc --noEmit
```

## KI-Fotoerkennung einrichten

Die Foto-Erkennung läuft über eine Server-Funktion (`src/app/api/analyze+api.ts`, EAS Hosting), damit der API-Schlüssel geheim bleibt. Auf expo.dev unter *Projekt → Environment variables* (Umgebung **production**) anlegen:

| Name | Sichtbarkeit | Wert |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sensitive | API-Schlüssel von platform.claude.com |

Wichtig: Sichtbarkeit **Sensitive** (nicht *Secret* – Secrets erreichen den Web-Server nicht). Kostenschutz: vorausbezahltes Guthaben ohne automatische Aufladung.

Danach neu veröffentlichen: `npx expo export --platform web && npx eas-cli@latest deploy --prod --environment production`
