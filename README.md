# Kalorienzähler 🥗

Eine Kalorienzähler-App mit [Expo](https://expo.dev) (SDK 58), Expo Router und TypeScript. Läuft auf iOS, Android und im Web. Alle Daten werden lokal auf dem Gerät gespeichert (AsyncStorage); es gibt kein Konto und kein Backend.

## Funktionen

- **Tagebuch:** Kalorienring mit Restkalorien, Makro-Balken (Eiweiß, Kohlenhydrate, Fett), Einträge nach Mahlzeit (Frühstück, Mittag, Abend, Snacks), Navigation zwischen Tagen
- **Hinzufügen:**
  - Suche in rund 60 gängigen Lebensmitteln (Nährwerte pro 100 g) mit Portionsvorschlägen
  - „Zuletzt verwendet“ für schnelles Wiederholen
  - Schnelleingabe nur mit Kalorien (z. B. Restaurant)
  - Eigene Lebensmittel anlegen (werden gespeichert und tauchen in der Suche auf)
- **Verlauf:** Balkendiagramm für 7 oder 30 Tage, Durchschnitt, Tage im Ziel, Gewichtsverlauf
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
