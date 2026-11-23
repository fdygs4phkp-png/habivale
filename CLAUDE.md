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
- **Konto + Abgleich (0.5.0):** Supabase-Projekt „habivale“, Ref `ivjcedxmjhnptabnrzjm`, Frankfurt, Organisation eWolfe, kostenloser Plan. Tabelle
  `public.user_data` (user_id, data jsonb, revision, updated_at; RLS nur eigene Zeile; Trigger erhöht revision), Funktion `delete_own_account()`.
  App: `src/sync/supabase.ts` (fetch, publishable Key), `src/sync/crypto.ts` (Umschlag: Datenschlüssel AES-256-GCM, mit Passwort PBKDF2 600 000 und
  Wiederherstellungs-Code verschlossen, Code selbst im Umschlag; WebCrypto – auf iPhone/Android später native Krypto), `src/state/account.tsx`
  (holen → `mergeState` → übernehmen → hochladen mit `revision=eq.X`, bis 3 Versuche; 2,5 s nach Änderungen, jede Minute, beim Zurückkehren).
  Zusammenführen `src/logic/merge.ts`: Vereinigung, neueres `mt` gewinnt, Grabsteine `state.deleted` ('h:'/'g:'/'m:' + id, 'd:' + Haken), Einstellungen
  nach `sMt`, Trophäen frühestes Datum. Konto nur ab 16 (Häkchen), Kinder später übers Familienkonto. Seite `src/app/konto.tsx`.
  Barrierefreiheit: `aria-checked`/`aria-selected`/`aria-disabled` statt `accessibilityState` (RN-Web 0.21 gibt das alte nicht weiter).
- **Familienkonto (0.6.0):** Supabase-Migration `family_account`: `families`, `family_members` (role parent/child, user_id, pub = ECDH-Schlüssel),
  `family_invites` (nur SHA-256 des Codes, Inhalt mit dem Code verschlüsselt, 24 h, einmal), `child_data` (Kinderdaten je Profil, nur das Kind liest),
  `family_shares` (je Kind und Elternteil verschlüsselt für dessen öffentlichen Schlüssel). Funktionen `family_create` (nur nicht-anonyme Konten),
  `family_add_child` (max. 8), `family_invite`, `family_redeem`, `family_remove_child`. Kinder melden sich **anonym** an (Supabase-Schalter
  „Allow anonymous sign-ins“ muss AN sein). Eltern-Schlüsselpaar liegt in `state.family` (mit dem Elternkonto verschlüsselt synchronisiert).
  Kind: eigener Datenschlüssel nur mit Wiederherstellungs-Code (Karte für die Eltern); neues Gerät = neuer Code + Wiederherstellungs-Code.
  Freigaben (`state.family.shares`, Voreinstellung nach Alter `defaultShares`), Schnappschuss `src/logic/share.ts` (Gewohnheiten 14 Tage, Ziele, Gläser – nie Tagebuch).
  Seiten `src/app/familie.tsx` (Eltern, QR-Code zum Link `verbinden?code=`), `src/app/verbinden.tsx` (Kind), Kind-Ansicht in `konto.tsx`.
  Eltern-Sperre `src/ui/gate.tsx` (Zahl in Worten) vor Premium/Backup/Löschen und Wiederherstellungs-Code auf Kindergeräten.
- **Eltern-Aktionen (0.7.0):** Tabelle `family_inbox` (Migration `family_inbox`; Eltern schreiben nur an Kinder der eigenen Familie über `ew_can_send`,
  nur das Kind liest/löscht, max. 50 offen). Inhalt `ParentMessage` (suggest/praise/allowance) mit `sealFor` für den Schlüssel des Kindes.
  Kind holt nach jedem Abgleich ab (`pullInbox`), Taschengeld wird sofort als Eintrag `in-<id>` verteilt, alles erscheint als Karte auf „Heute“
  (`state.inbox`, Grabstein 'i:'); Vorschlag annehmen (`acceptSuggestion`, beachtet 3 Gewohnheiten in Free) oder ablehnen. Sticker/Sätze `STICKERS`, `PRAISE_TEXTS`.
- **Kinder-Modus (0.8.0):** `useMode()` in `src/ui/mode.ts`: an bei Kinderprofilen 8–11 (Geburtsjahr) oder per Test-Schalter `state.kidPreview`
  (Einstellungen, nur Erwachsene). Faktor `k` 1,15 für Schrift/Knöpfe in `kit.tsx`, größere Haken, kurze Mentorinnen-Sätze, Tagebuch mit farbigen
  Stimmungsbildern + drei Fragen (schön → `free`, gut gemacht → `win`, dankbar → `thanks`), Vorlagen `HABIT_TEMPLATES` (im Kinder-Modus große Kacheln,
  sonst „Ideen“). Leistenbeschriftung nur auf Tablets größer (sonst wird „Sammlung“ abgeschnitten).
- **Erweitertes Taschengeld (0.9.0):** `money.goals` (mehrere Sparziele; altes `money.goal` wird beim Laden zu `sg-alt`), das Sparglas füllt sie der
  Reihe nach (`allocate`), „Ich habe es mir gekauft“ = Buchung `savebuy`. Free 1 Sparziel, Premium bis 5. Wunschliste `money.wishes` („Lieber eine Woche
  warten“ im Ausgeben-Fenster, nach 7 Tagen Frage kaufen / darauf sparen / nicht mehr). Monatsübersicht `monthSummary`, Geld-Lektionen `src/logic/lessons.ts`
  nach Altersstufe (`state.lessons`). Geld-XP `moneyXp` (Verhalten, nie Betrag) zählt zum Level. Trophäen „Drei Sparziele“, „Eine Woche gewartet“.
  Grabsteine 'sg:'/'w:'. Test `t07geld.py` mit `page.clock` (Woche vorspulen: `set_system_time`, nicht `set_fixed_time`).
- **Weiße Seiten nach Updates (behoben in 0.9.0):** SDK 58 lädt Seiten im Browser als eigene Dateien (async routes). Eine alte, im Browser/Home-Bildschirm
  gespeicherte Startseite suchte nach einem Update Dateien, die es nicht mehr gab → weiß. Jetzt `["expo-router", {"asyncRoutes": {"web": false}}]` (ein Paket).
  Dazu `docs/version.json` (von `scripts/pages.mjs` geschrieben) und `useUpdate()` (`src/ui/update.ts`): Karte „Neue Version – Jetzt aktualisieren“ auf „Heute“.
- **Phase 4, Teil 1 (0.10.0):** Trophäen jetzt 18 (`src/logic/trophies.ts`, `free` = Basistrophäen), Bilder Habivale-eigen (`assets/img/trophy/`, Serie 1 nach
  Auswahl der Nutzer + Spar-Trophäen), fünf noch geliehen (`TROPHY_BORROWED`). `updateFirsts` merkt auch 'lv:N' und 'wolf:N' (Wolf nie kleiner: `keptWolf`).
  **Mentorin-Ereignisse** (`src/ui/mentorEvent.tsx`, auf „Heute“): alles in `firsts`, was nicht in `state.celebrated` steht, eins nach dem anderen, bei Level nur
  das höchste; beim ersten Start mit 0.10 gilt Vorhandenes als verkündet. **Lyra/Kael** wählen (`state.hero`), **Outfits** (`OUTFITS`, `state.outfits`, Bilder
  `OUTFIT_IMG`, bisher nur Grundausstattung) und **Gegenstände** (`ITEMS`) in `src/logic/world.ts`, freigeschaltet nur durch Fortschritt (`Rule`). Sammlung mit
  Trophäen/Kleidung/Gegenstände und großer Trophäen-Ansicht. Ohne Premium: Wolf bleibt Welpe, Kleidung/Gegenstände als Vorschau. Avatare rund freigestellt.
  Browser-Tests klicken die Mentorin per `add_locator_handler(get_by_role('alert'))` weg.
- **0.11.0:** alle Bilder vom 22./23.11. eingebaut: Gegenstände (`ITEM_IMG`), Trophäen Serie 2 (keine geliehenen mehr) + 3 neue Trophäen, Mentorin-Gesten
  und Jubel/Wolf-freut-sich in den Ereignissen, Wolfsgesichter im Kinder-Tagebuch (`MOOD_IMG`), Sparziel-Bilder (`GOAL_IMG`), Gewohnheits-Bilder
  (`HABIT_IMG`, nach Symbolname), App-Symbol (Wolf vor Sichelmond), Outfits als **Übergang** (`assets/img/outfits/`, werden ersetzt), Geschichte auf
  „Abenteuer“ (Welpe ohne Mutter → Verantwortung, dranbleiben). Raster schneiden: `HABIVALE/Habivale-Skripte/raster.py`.
- **Phase 5, Teil 1 (0.12.0): Refugium und Hexenhaus.** `src/logic/refuge.ts`: Ausbaustufen nach aktiven Tagen (1 alte Hütte, 2 Häuschen ab 21,
  3 großes Haus ab 90), erreichte Stufe als 'ref:N' in `firsts` (nie kleiner, `keptRefuge`), Mentorin verkündet sie (`eventFor`, Art 'refuge').
  Jahreszeit nach Datum (`seasonOf`: Frühling 3–5, Sommer 6–8, Herbst 9–11, Winter 12–2), **Weihnachtszeit 1.12.–6.1.** (`sceneOf` → 'xmas'): nur dann
  das Bild mit Kranz; Winter ohne Schmuck fehlt noch (`REFUGE_WINTER_PLAIN` = null → Weihnachtsbild mit rotem Hinweis). Bilder `assets/img/refuge/`
  (`out-<spring|summer|autumn|xmas>-1…3`, `in-1…3`, `witch-*`; Sommer aus dem Drei-Stufen-Bild geschnitten, fast quadratisch). Seite `refugium.tsx`:
  Außen/Innen, Jahreszeiten zum Ansehen (● = jetzt), Stufen mit Vorschau, im großen Haus „Lyras Zimmer“/„Kaels Zimmer“ (Bilder fehlen, `ROOM_IMG`),
  Einrichtung als Sammlung (`DECOR` in `world.ts`, 12 Teile, Regel-Art 'refuge', Bilder `assets/img/decor/`, Bücherregal = Übergang wegen Kerze),
  Kaminsims, Weg zum Hexenhaus (`src/app/hexenhaus.tsx`: außen/innen, Mentorin, Erinnerungen aus `celebrated`). Ohne Premium bleibt es die alte Hütte.
  Geschichte in 9 Kapiteln (`STORY_CHAPTERS`, Bilder `STORY_IMG`), 5–9 öffnen sich mit Refugium-Stufe und Wolf. Leiste mit den goldenen Symbolen der
  Nutzer (`NAV_IMG`, `assets/img/nav/`). Beim Öffnen trägt der Speicher fehlende `firsts` nach (vorher erst nach der nächsten Änderung).
  **Bildregeln Haus:** Kranz nur Weihnachtszeit, höchstens ein Nest pro Baum, Kerzen nie im Regal / auf der Fensterbank am Vorhang / unter Pflanzen,
  Fenster innen = außen, im großen Haus Betten oben (eigene Zimmer). Prompts: `HABIVALE/Ausgang/Ausgang 23.11.2026/Bild-Prompts Teil 4 …`.
  Browser-Test `HABIVALE/Habivale-Skripte/t09refugium.py` + `testserver.py` (Server wie GitHub Pages, Port 8790; Zustand vollständig in localStorage legen,
  Haken-Schlüssel `habitId|Tag`; Mentorin per Schleife wegklicken, nicht mit `add_locator_handler`).
- **Besuche im Hexenhaus (0.13.0):** `src/logic/mentor.ts`: **Rat des Tages** (`adviceFor`: erst die Lage – keine Gewohnheit, heute alles geschafft,
  3+ Tage Pause, Wunsch nach 7 Tagen fällig, Haus/Wolf wachsen bald –, sonst jeder dritte Tag ein Gedanke zur Jahreszeit, sonst `ADVICE_POOL`; am selben Tag
  immer gleich) und **12 Geschichten** (`TALES`, eigene Texte mit einem Satz als Lehre): je Besuchstag öffnet sich die nächste (`state.visits`: Tag → erster
  Besuch, gesetzt beim Öffnen von `/hexenhaus` über `visit(today)`, beim Abgleich vereinigt mit frühestem Zeitpunkt). Seite zeigt Besuch des Tages, neue
  Geschichte, Geschichtenbuch (aufklappbar), Erinnerungen. Refugium-Karte sagt „Heute wartet eine neue Geschichte“. Besuche zählen nicht als aktive Tage.
  Test `HABIVALE/Habivale-Skripte/t10hexenhaus.py`.
- **Sommer neu (0.13.1, 23.11.2026):** `out-summer-1/2` = eigene 16:9-Bilder der Nutzerin (Sommernacht Waldhäuschen/Cottage, je ein Nest, kein Kranz); Stufe 3 Sommer noch das alte quadratische Bild. Innen Stufe 2: Fenster außen = Rundbogen oben, unten gerade, mit Läden (Prompt korrigiert). Probe Einrichtung im Raum: `Ausgang/Ausgang 23.11.2026/Einrichtung im Raum – Probe`.
- **Innenräume passend zu außen (0.13.2, 23.11.2026):** Regel: innen schaut man auf die Vorderwand, Tür und Fenster wie außen, aber seitenverkehrt, Tür zu. `in-1` Hütte (Ofen mit Rohr gerade durchs Dach, rechts neben der Tür ein Wandbrett mit 2 Kerzen), `in-2` Steinhaus (Rundbogenfenster mit Blumenkasten links, Kamin rechts), `in-3` großes Haus (Wohnraum ohne Betten, Treppe links, Kamin rechts = außen links). Sommer: `out-summer-1` mit Ofenrohr, `out-summer-3` großes Haus. Die anderen Jahreszeiten der Hütte haben außen noch kein Ofenrohr (Hinweis in der App). Räume sind leer genug für die Einrichtung; Einrichtungsteile müssen dafür neu in derselben Perspektive (gerade, Augenhöhe) gemalt werden.
- **Konto ab 16 (0.14.0, 23.11.2026):** Kind mit Jahrgang ab 16 (`ageStage` = erwachsen) sieht auf `konto.tsx` „Dein eigenes Konto“: E-Mail, Passwort (Regeln), 16+ und Einwilligung, Rückfrage. `becomeOwn` in `account.tsx`: zuerst neues E-Mail-Konto (`signUp`) mit allen Daten ohne Familie (`family: null`) neu verschlüsselt in `user_data` (neuer Datenschlüssel, neuer Wiederherstellungs-Code), erst danach `rpc family_child_leave` mit der alten Kindersitzung, dann Gerät umstellen. Supabase-Migration `family_child_leave` (live seit 23.11.2026): löscht das eigene `family_members`-Kind (Daten, Freigaben, Eingang, Einladungen per Cascade) und das anonyme Konto; wirkt nur auf `auth.uid()`, sonst `not_child`. Eltern: Profil ohne Server-Zeile = `left` → „Eigenes Konto“, nur „Aus der Liste nehmen“ (`removeChild` ruft den Server nur, wenn es das Profil dort noch gibt). Alter prüft nur die App (der Server kennt das Geburtsjahr nicht, es ist verschlüsselt). Test `Habivale-Skripte/t11konto16.py` (nachgebautes Supabase, Chromium + WebKit, 18 Prüfungen je Browser); Probe auf dem echten Server in einer Transaktion, zurückgerollt.
- **Kindergerät wechseln ohne Wiederherstellungs-Code (0.14.1, 23.11.2026):** Das Kindergerät schickt seinen Wiederherstellungs-Code immer mit der Freigabe an die Eltern (`Snapshot.rc`, verschlüsselt für jeden Elternteil, auch wenn sonst nichts geteilt wird – die Eltern haben ihn ohnehin auf der Karte). `loadChildren` merkt ihn in den Elterndaten (`ChildProfile.rc`). „Neues Gerät verbinden“ legt ihn in die Einladung (`inviteFor`, mit dem Einladungscode verschlüsselt). `joinFamily`: gibt es schon Daten und liegt `rc` bei, entsperrt sich das neue Gerät selbst („Geschafft! … alle deine Sachen sind wieder da“), sonst wie bisher Code-Eingabe. Test `Habivale-Skripte/t12geraetwechsel.py` (importiert das nachgebaute Supabase aus `t11konto16.py`).
- Noch offen im Familienkonto: Familien-Abo mit Kinderprofilen, erweitertes Taschengeld.

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
