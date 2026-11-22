# Habivale – App-Code

Habit-Tracker mit Fantasy-Welt, ab 8 Jahren, mit Taschengeld nach der 3-Gläser-Methode.
Die Nutzer sind keine Entwickler: einfach und auf Deutsch erklären. Nichts hochladen oder löschen ohne Ja.

**Zuerst lesen:** Sammelordner `~/Library/Mobile Documents/com~apple~CloudDocs/Claude/Claude Code/HABIVALE/` (dort `CLAUDE.md`,
`1 Fantasy Style/C Texte/Master-Prompt v2`, `Ausgang/Ausgang 22.11.2026/Phase 1 – Plan und Designsystem`) und die Übergabe
`…/Claude Code/HandOff/Handoff-Habivale_001.md`. Siehe auch `AGENTS.md` (Expo ändert sich oft – Doku der passenden SDK-Version lesen).

## Technik
- Expo SDK 58, React Native, TypeScript, Expo Router (Seiten in `src/app/`, Leiste in `src/app/(tabs)/_layout.tsx`).
- Reine Logik ohne React in `src/logic/` (Datum, Habits, XP/Level/Wolf, Taschengeld, Trophäen) – Importe dort mit `.ts`-Endung,
  damit `npm test` sie direkt mit Node prüfen kann (`tests/logic.test.ts`).
- Stand in einem Objekt (`src/state/store.tsx`), gespeichert mit AsyncStorage (Browser: localStorage), Schlüssel `habivale_state_v1`.
  Noch kein Konto, kein Cloud-Abgleich (Phase 3).
- **Belohnungen werden berechnet, nie hochgezählt:** XP aus den Haken (10 je Haken, max. 5/Tag, +20 wenn alle fälligen erledigt),
  Level n = 50·n·(n+1) XP, Wolf nach aktiven Tagen 30/150/300. Nur das erste Erreichen von Trophäen steht in `firsts` (Bestandsschutz).
- Beträge in Cent. Kein echtes Geld, nie mit Spielwährung vermischt.
- Farben/Schriften: `src/ui/theme.ts` (Kontraste gemessen), Bausteine `src/ui/kit.tsx`. Schriften lokal in `assets/fonts/` (Cinzel,
  Atkinson Hyperlegible, OFL-Lizenzen dabei). Rückfragen über `ask()`/`tell()` – `Alert` funktioniert im Browser nicht.
- **Tablet zuerst mitdenken** (die meisten Kinder haben ein Tablet): `useLayout()` in `src/ui/kit.tsx` (Tablet ab 700 px Breite und
  kürzere Seite ≥ 600), `Grid` für Spalten (Heute 2, Sammlung 3–4, Gläser groß). Hoch- und Querformat erlaubt (`orientation: default`).
  Immer auch in 820×1180 und 1180×820 testen.
- Bilder: alle in `src/ui/images.ts` (`IMG`, `TROPHY_IMG`), Dateien in `assets/img/` als WebP (`chars/`, `wolf/`, `scene/`). Zugeschnitten mit
  `HABIVALE/Habivale-Skripte/zuschneiden.py` (teilt Blätter mit Alpha nach leeren Spalten). `assets/img/leih/` = Übergangsbilder aus der Lebensrad-App
  (A Mystery World: Trophäen, Sticker, Tagebuch-Cover), bis eigene kommen. Hauptbild Jungwolf fehlt (Prompt 4.4) – solange das Welpenbild. Fehlendes: roter Hinweis `PlaceholderNote`.
- Bei jeder Änderung `src/version.ts` erhöhen.

## Phase 3 (Stand 0.4.0)
- Tagebuch-Reiter (`src/app/(tabs)/tagebuch.tsx`): **Mein Tag** (Stimmung 1–5, „Mein Tag“ automatisch aus den Haken, vier Fragen + freier Text, je Tag
  `state.journal[tag]`), **Ziele** (`state.goals`: Bereich aus `LIFE_AREAS`, Warum, kleine Schritte, erreicht/wieder aktiv), **Meine Woche** (Mo–So,
  `weekSummary`, „besonders stolz“ in `state.weeks[montag]`). Logik in `src/logic/journal.ts`.
- Premium nur als Test-Schalter (`state.premium`, Einstellungen); ohne Premium zeigt das Tagebuch eine ruhige Vorschau.
- Einstellungen (`src/app/einstellungen.tsx`, Zahnrad oben rechts auf Heute): Name, Premium-Test, Backup als JSON (Web: Datei; Gerät: Teilen), Einspielen (nur Web), alles löschen.
- Root-Layout zeichnet erst nach dem Start (`mounted`), sonst React-Fehler 418 beim Neuladen einer Unterseite (statische Seite ≠ echte).
- Noch offen in Phase 3: Konto + verschlüsselter Abgleich (neues Supabase-Projekt), Familienkonto mit Kinderprofilen, Altersstufen, erweitertes Taschengeld.

## Befehle
- `npm test` – Logik prüfen · `npx tsc --noEmit` – Typen prüfen
- `npm run web` – Entwicklung im Browser · `npx expo start` – auf dem iPhone mit „Expo Go“
- `npm run build:web` – Web-Fassung bauen: `dist/` → `docs/` (mit `.nojekyll` und `404.html`) für GitHub Pages aus `main` / `docs`.
  `app.json` → `experiments.baseUrl` = `/habivale` (= Name des Repositorys auf GitHub).
- Browser-Test: `docs/` unter `/habivale/` ausliefern (z. B. Ordner mit Verknüpfung `habivale → docs`, `python3 -m http.server`),
  Playwright in Chromium **und WebKit**; Unterseiten über die Leiste öffnen (einfacher Python-Server kennt `/sammlung` ohne `.html` nicht – ein kleiner Server, der wie GitHub Pages `pfad → pfad.html` liefert, löst das).

## Veröffentlichen
Claude kann nicht pushen. Die Nutzer veröffentlichen über **GitHub Desktop** (Push origin). Danach ist die Web-Fassung nach ein paar Minuten
unter `https://fdygs4phkp-png.github.io/habivale/ (GitHub-Konto `fdygs4phkp-png`, nicht das eWolfe-Konto)` erreichbar (wenn Pages eingeschaltet ist).
