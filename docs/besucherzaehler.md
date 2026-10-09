# Besucherzähler

Stand: 2026-10-08 · Migration `0037_besuchszaehler.sql`

Ein eigener, cookieloser Zähler zeigt im Adminbereich (`/admin/besucher`, Kurzfassung
oben auf `/admin`), **wie viele Menschen die Website besuchen, welche Seiten sie sehen
und über welche gekennzeichneten Links sie kommen.** Ohne diese Zahl lässt sich keine
Maßnahme – Suchmaschine, Anzeige, Flyer, Instagram – auf Wirkung prüfen.

---

## 1. Warum selbst gebaut

| | Eigener Zähler | Fremdanbieter (z. B. Google Analytics) |
|---|---|---|
| Zahlen im eigenen Adminbereich | **ja** | nein, eigenes Portal |
| Cookie-Banner nötig | **nein** | ja (Einwilligung) |
| Daten bei Dritten | **nein** (nur die ohnehin genutzten Dienste Vercel/Supabase) | ja |
| Kosten | keine | je nach Anbieter |
| Datenschutzerklärung bleibt wahr | mit kleiner Ergänzung | große Ergänzung |

Der Preis: weniger Auswertungstiefe (keine Geräte-, Standort- oder Herkunftsdetails
außer gekennzeichneten Links). Für die Frage „kommen Leute, und wovon kommen mehr?"
genügt das; für alles darüber hinaus wäre die Google Search Console die richtige
Ergänzung (kostenlos, zeigt Suchbegriffe und Klicks aus der Google-Suche).

---

## 2. Was gezählt wird – und was nicht

**Gezählt wird** jeder Aufruf einer öffentlichen Seite (alles, was in `sitemap.ts` steht).

| Nicht gezählt | Wie umgesetzt | Warum |
|---|---|---|
| Roboter, Suchmaschinen, Link-Vorschauen, Monitoring | Muster auf der Browserkennung (`istBot`), großzügig | ein mitgezählter Roboter verfälscht jede Zahl |
| „Do Not Track" (`DNT: 1`), „Global Privacy Control" (`Sec-GPC: 1`) | Kopfzeilen | Widerspruch wird respektiert, auch wo kein Gesetz es verlangt |
| Vorab-Laden durch den Browser | `Sec-Purpose`/`Purpose` | der Mensch hat die Seite nie gesehen |
| Der Betreiber selbst | Vorhandensein des Admin-Cookies | eigene Klicks sind kein Interesse |
| Entwicklung, Vorschau-Adressen (`*.vercel.app`) | `NODE_ENV` + Host-Positivliste | gleiche Datenbank wie der Betrieb |
| `/admin`, `/api`, `/bestellung/…`, `/konto`, `/auth` | Komponente **und** Server | `/bestellung/<token>` enthält ein Geheimnis und gehört in keine Statistik |
| Adressen, die nicht in der Sitemap stehen | werden unter „(sonstige Seiten)" gesammelt | der Pfad kommt nie frei vom Client in die Datenbank |

**Besucher** = verschiedene Kombinationen aus Netzwerkadresse und Browser pro Tag.
**Seitenaufrufe** = jeder einzelne Aufruf.

---

## 3. Datensparsamkeit als Bauprinzip

Gespeichert werden **Zahlen**, keine Personen:

| Tabelle | Inhalt |
|---|---|
| `besuch_summe` | Besucher und Aufrufe je Tag |
| `besuch_seiten` | Aufrufe je Tag und Seite (Pfad aus der Sitemap) |
| `besuch_quellen` | Besucher/Aufrufe je Tag und Kampagnen-Quelle (`utm_source` aus fester Liste) |
| `besuch_kennungen` | **die einzige Tabelle mit Personenbezug-Charakter:** je Besucher und Tag ein Hashwert |

**Tageskennung.** Damit mehrere Aufrufe desselben Tages als *ein* Besucher zählen,
entsteht aus IP-Adresse und Browserkennung ein Hashwert (HMAC-SHA-256):

```
zweckSchluessel = HMAC(ORDER_TOKEN_SECRET, 'besuch-v1')
tagesSchluessel = HMAC(zweckSchluessel, Kalendertag)
kennung         = HMAC(tagesSchluessel, ip + '\n' + userAgent)   → 32 Hexzeichen
```

- **Die IP-Adresse gelangt nie in die Datenbank.** Sie lebt nur für die Dauer der
  Anfrage im Arbeitsspeicher.
- **Der Tag ist Teil des Schlüssels**, daher lässt sich ein Besucher nicht über Tage
  verknüpfen. Ohne das Betriebsgeheimnis lässt sich weder die Adresse zurückrechnen
  noch prüfen, ob eine bestimmte Adresse dahintersteckt.
- **Die Kennungen werden nach Tagesende gelöscht** – doppelt gesichert: durch den
  Cron (`raeume_besuch_kennungen_auf`, alle 10 Minuten über GitHub Actions) **und**
  durch die Datenbank selbst: Der erste Besucher eines neuen Tages löscht die
  Kennungen früherer Tage. Die Löschung hängt so nicht allein an einem externen
  Zeitplaner.
- **Nichts auf dem Endgerät:** kein Cookie, kein Local Storage, kein IndexedDB, kein
  `document.referrer`, keine Bildschirm- oder Geräteangaben. Die Seite meldet nur
  ihre eigene Adresse (ohne Suchteil/Anker) und – falls in derselben Adresse vorhanden –
  den Wert `utm_source`.
- **Auch das Rate-Limit speichert die Adresse nicht im Klartext.** Der zentrale
  Zähler würde sonst bei jedem Seitenaufruf `besuch:ip:<Adresse>` in die Datenbank
  schreiben. Das Limit `besuch` nutzt deshalb das Merkmal `ip_gehasht` (Kennwert statt
  Adresse, siehe [rate-limiting.md](rate-limiting.md)).

Die Zusagen sind durch Tests festgehalten (`src/lib/besuch/__tests__/`): Die
Meldekomponente darf nichts speichern oder auslesen, die Route antwortet nie mit
Inhalt, keine Spalte nimmt eine IP-Adresse auf, alle Tabellen/Funktionen sind
gesperrt – und **der Zähler kann nicht eingebunden werden, solange die
Datenschutzerklärung ihn nicht nennt** (siehe § 6).

### Rechtliche Einordnung (Einschätzung, keine Rechtsberatung)

- **§ 25 TDDDG** (Zugriff auf Endeinrichtung): Es wird nichts im Endgerät gespeichert
  und nichts aus ihm ausgelesen. IP-Adresse und Browserkennung gehen als Kopfzeilen
  ohnehin bei jeder Anfrage ein. Nach verbreiteter Auslegung braucht die Zählung
  deshalb keine Einwilligung und keinen Cookie-Banner.
- **DSGVO:** Die kurzzeitige Verarbeitung von IP-Adresse und Browserkennung im
  Arbeitsspeicher ist eine Verarbeitung personenbezogener Daten. Grundlage:
  **Art. 6 Abs. 1 lit. f** (berechtigtes Interesse an Reichweitenmessung). Zur
  Abwägung tragen bei: keine Profilbildung, kein Tracking über Seiten oder Tage,
  täglich wechselnder Schlüssel, Löschung nach Tagesende, Respektieren von DNT/GPC,
  Widerspruchsmöglichkeit (Art. 21).
- **Keine neuen Empfänger:** Verarbeitet wird in Vercel (Server-Funktion) und
  Supabase (Zahlen) – beide stehen bereits in der Datenschutzerklärung.
- Die Datenschutzerklärung enthält ohnehin den Hinweis, dass eine
  datenschutzrechtliche Prüfung vor dem Go-live empfohlen wird. **Der Wortlaut zum
  Zähler gehört in diese Prüfung.**

---

## 4. Aufbau

```
Browser                       Vercel (Node)                         Supabase
───────                       ─────────────                         ────────
Besuchszaehler.tsx            POST /api/besuch
  sendBeacon({pfad,quelle}) →   1. NODE_ENV = production?
                                2. ausschlussGrund()  (Host, GPC, DNT, Vorab, Admin, Roboter)
                                3. normalisierePfad() (Positivliste = Sitemap)
                                4. pruefeRateLimit('besuch')  (Kennwert statt IP)
                                5. bildeKennung()  (HMAC)
                                6. rpc('erfasse_besuch') ─────────→  atomarer Upsert in 4 Tabellen
                              ← 204, immer, ohne Inhalt

/admin, /admin/besucher       ladeBesuchsstatistik() ─ rpc('lade_besuchsstatistik') → eine JSON-Antwort
```

| Datei | Aufgabe |
|---|---|
| `supabase/migrations/0037_besuchszaehler.sql` | Tabellen, `erfasse_besuch`, `lade_besuchsstatistik`, `raeume_besuch_kennungen_auf`; RLS, Funktionen gesperrt |
| `src/config/besuch.ts` | Ausschlüsse, Quellenliste (`BESUCH_QUELLEN`) mit Anzeigenamen |
| `src/lib/besuch/erfassen.ts` | reine Entscheidungen: Tag, Pfad, Quelle, Roboter, Kennung, Ausschlussgrund |
| `src/lib/besuch/statistik.ts` | Auswertung: Lücken füllen, Summen, Datenbankaufruf |
| `src/lib/besuch/anzeige.ts` | Achsenskala, Datums-/Prozentformate |
| `src/app/api/besuch/route.ts` | der Eingang (siehe Diagramm) |
| `src/components/layout/Besuchszaehler.tsx` | die Meldung im Browser |
| `src/app/admin/besucher/page.tsx`, `src/components/admin/BesucherStreifen.tsx` | die Anzeige |

**Aggregation in SQL**, nicht im Browser/Server: PostgREST schneidet Antworten bei 1 000
Zeilen ab – eine Summe über `besuch_seiten` im Anwendungscode wäre sonst *still*
unvollständig.

**Atomar:** `erfasse_besuch` ist eine einzige Funktion mit `insert … on conflict do
update`. Parallele Aufrufe verlieren keine Zählung; ein bekannter Besucher erhöht nur
die Aufrufe – und zwar die der Quelle seines **ersten** Aufrufs des Tages (sonst würde
der Seitenwechsel ohne `utm_source` den Besuch unter „ohne Kennzeichnung" verbuchen).

---

## 5. Zahlen lesen

- **„Letzte 7/30 Tage" sind Summen von Tageswerten.** Wer an zwei Tagen kommt, zählt
  zweimal – das ist die Folge der bewusst fehlenden Wiedererkennung über Tage.
- **Größenordnung, nicht Personenzahl:** Zwei Menschen hinter derselben Netzwerkadresse
  (Büro, Mobilfunk) mit gleichem Browser können als einer zählen; eine Person mit
  Handy *und* Computer zählt zweimal. Blocklisten im Browser können die Meldung
  unterdrücken – die Zahlen sind eher zu niedrig als zu hoch.
- **Die Zählung beginnt am Tag der Aktivierung.** Davor gibt es keine Zahlen; der
  Adminbereich sagt das, solange noch nichts gezählt wurde.
- **Herkunft nur bei gekennzeichneten Links.** Es wird bewusst kein Verweis
  (`document.referrer`) ausgelesen. Wie viele über Google kommen und mit welchen
  Suchbegriffen, zeigt die **Google Search Console** unter „Leistung".
- **Kleine Zahlen schwanken stark.** Ein einzelner Tag mit 3 Besuchern sagt nichts;
  die Entwicklung über Wochen schon.

### Links kennzeichnen

Jeder Link, den Sie verteilen, bekommt `?utm_source=<Kanal>`:

```
https://www.ergermany.de/?utm_source=instagram        Instagram-Profil
https://www.ergermany.de/?utm_source=gbp               Google-Unternehmensprofil
https://www.ergermany.de/?utm_source=qr                QR-Code (Flyer, Fahrzeug, Schaufenster)
https://www.ergermany.de/produkt?utm_source=flyer      Flyer mit direktem Sprung ins Sortiment
```

Erlaubt sind die Kanäle aus `BESUCH_QUELLEN` (`src/config/besuch.ts`); alles andere
zählt als „Sonstige Kennzeichnung". **Neuen Kanal ergänzen:** Eintrag in
`BESUCH_QUELLEN` **und** Anzeigename in `BESUCH_QUELLEN_NAMEN` (der Build bricht
sonst ab – so erscheint nie ein rohes Kürzel im Adminbereich).

---

## 6. Aktivieren (Reihenfolge einhalten)

**Stand: am 2026-10-09 nach Freigabe des Wortlauts durchgeführt** (alle Schritte unten
erledigt, Migration angewendet, Zähler eingebunden). Die Anleitung bleibt für Neuaufbau
und Nachvollziehbarkeit stehen.

Der Zähler darf nur laufen, wenn die Datenschutzerklärung ihn nennt. Ein Wächter-Test
(`besuchWaechter.test.ts`) schlägt an, sobald `<Besuchszaehler />` im Layout steht, die
Datenschutzerklärung aber keine „Reichweitenmessung" nennt oder weiterhin „keine
Analyse-Werkzeuge" behauptet.

1. **Wortlaut freigeben:** `docs/seo/datenschutz-besucherzaehler-wortlaut.md` prüfen
   (Textfreigabepflicht), Änderung in `src/app/datenschutz/page.tsx` einarbeiten
   (Ziffer 2, 3, 7, 13, „Stand").
2. **Migration anwenden:** `node scripts/applyMigration.mjs supabase/migrations/0037_besuchszaehler.sql`
3. **Verifizieren:** `npm run besuch:pruefen` (40 Prüfungen, rollt in jedem Fall
   zurück) und `node scripts/pruefeMigrationen.mjs`.
4. **Einbinden** in `src/app/layout.tsx`:
   ```tsx
   import { Besuchszaehler } from '@/components/layout/Besuchszaehler';
   // … am Ende von <body>, nach <CartDrawerHost />:
   <Besuchszaehler />
   ```
5. Green Gate (`tsc`, `lint`, `npm test`, `npm run build`), deployen.
6. **Prüfen:** in einem privaten Fenster (ohne Admin-Anmeldung, ohne Do-Not-Track)
   die Startseite öffnen – nach wenigen Sekunden steht unter `/admin/besucher` ein
   Besucher mehr. Erscheint nichts: Werbeblocker im Testfenster aus; im Server-Protokoll
   nach `[besuch]` suchen.

**Zurückbauen:** Zeile im Layout entfernen – der Zähler ist aus. Die gesammelten Zahlen
bleiben (sie enthalten keine Personen); die Tageskennungen verschwinden von selbst.

---

## 7. Betrieb

| Thema | Stand |
|---|---|
| `ORDER_TOKEN_SECRET` (≥ 16 Zeichen) | Pflicht in Produktion. Fehlt es, wird **nicht gezählt** (lieber keine Zahl als eine erratbare Kennung). Ein Wechsel des Geheimnisses lässt Tageskennungen einmalig neu entstehen – ein Besucher kann dann an diesem Tag doppelt zählen; unkritisch. |
| `BESUCH_ZUSATZ_HOSTS` | nur für lokale Tests (z. B. `localhost:3100`); zusätzlich zu Produktionsdomain erlaubte Hosts. In Produktion nicht setzen. |
| Aufräumen | `raeume_besuch_kennungen_auf` im Cron (`process-supplier-orders`, Feld `besuchKennungen` im Ergebnis) |
| Last | zwei Datenbankaufrufe je gezähltem Seitenaufruf (Rate-Limit + Zählung); Roboter, Widersprüche und ungültige Pfade scheiden **vorher** aus |
| Adminbereich zeigt „nicht geladen" | Migration 0037 fehlt oder Datenbank nicht erreichbar → Server-Protokoll (`[besuch] Auswertung nicht ladbar`) |
| Lokal ausprobieren | `NODE_ENV=production`-Build (`next build && next start`) mit `BESUCH_ZUSATZ_HOSTS=localhost:<Port>` und einer Browserkennung, die kein Roboter ist; danach Testzeilen löschen |

---

## 8. Umsetzungsstand (2026-10-09)

| Baustein | Stand |
|---|---|
| Migration 0037 geschrieben | **fertig** |
| Migration gegen die echte Datenbank geprüft (zurückgerollt, 40 Prüfungen) | **fertig** (`npm run besuch:pruefen`) |
| Migration **angewendet** | **fertig** (2026-10-09; Bestand vorher/nachher identisch: 25 Bestellungen, 1 891,71 €) |
| Migration nach dem Anwenden verifiziert | **fertig** (40 von 40 Prüfungen, Migrationsfolge 0001–0037 lückenlos) |
| Erfassung, Route, Meldekomponente, Auswertung, Admin-Anzeige | **fertig** |
| Rate-Limit ohne Klartext-IP (`ip_gehasht`) | **fertig** |
| Tests (Erfassung, Auswertung, Anzeige, Wächter, Rate-Limit-Schlüssel) | **fertig** |
| Datenschutz-Wortlaut | **freigegeben 2026-10-09**, wortgleich eingearbeitet (Ziffer 2, 3, 7, 13, „Stand") |
| Einbindung ins Layout (= Aktivierung) | **fertig** – mit der Veröffentlichung am 2026-10-09 |
