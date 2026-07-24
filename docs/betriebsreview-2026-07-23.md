# Produktions- und Betriebsreview

Durchgeführt am **2026-07-23** als vollständige Prüfung der produktiven
Betriebsbereitschaft – so, als würde die Anwendung an einen Kunden übergeben,
der sie jahrelang zuverlässig betreiben möchte. **Kein Feature-Ausbau, nur
Prüfung.** Es wurden ausschließlich reale, belegte Befunde aufgenommen; wo
nichts zu beanstanden war, steht das ausdrücklich.

Prüfmethode: Quelltext, Konfiguration, CI, Migrationen **und** read-only-Abfragen
gegen die Produktivdatenbank (RLS-Policies, Grants, angewendete Migrationen,
Funktionen, Bucket, Zeilenzahlen). Keine Schreibvorgänge, keine Änderungen am
Code.

---

## Gesamturteil

**Der Produktionsbetrieb kann aus technischer Sicht noch NICHT ohne Vorbehalt
freigegeben werden.** Der Kern der Anwendung (Bestellprozess, Zahlung, Auth,
Rate-Limit, atomare Erstellung, Logging, Health) ist solide und geprüft. Es
bestanden **vier Go-live-Blocker** – einer davon ein echtes Sicherheitsloch –
sowie mehrere wichtige Betriebspunkte.

**Stand 2026-07-23:**
- **B1** (Sicherheitsloch) – behoben und verifiziert (Migration 0021).
- **B2** (Scheduler) – behoben und verifiziert (`vercel.json`, Vercel Cron).
- **B3** (Restore-Drill) – vollständig vorbereitet und read-only validiert.
  **Bleibt bewusst OFFEN** (Entscheidung 2026-07-23: kostenloser Supabase-Tarif,
  kein Testprojekt). Wird als geplanter Betriebsprozess nachgeholt und im
  Go-live-Bericht transparent als **verbleibendes Betriebsrisiko** ausgewiesen –
  ausdrücklich nicht als erledigt dargestellt.
- **B4** (Next.js-Advisories) – **entschieden und bewusst zurückgestellt**, mit
  Nachweis (Upgrade-Versuch + reproduzierbarer Funktionsbruch + Rollback);
  Restrisiko benannt und mit Maßnahmen unterlegt.

B4 wurde vom Auftraggeber am 2026-07-23 **angenommen**; das Upgrade ist als
erstes größeres Projekt nach dem Go-live eingeplant. Ab diesem Zeitpunkt gilt
für Version 1.0 ein **Architektur-Freeze**: keine weiteren Refactorings,
Upgrades oder neuen Funktionen.

### Der abschließende Go-live-Bericht

**Zeitpunkt (Festlegung 2026-07-23):** Der Bericht wird **unmittelbar vor dem
tatsächlichen Produktivstart** geschrieben – bewusst nicht früher. Er soll den
**echten Go-live-Stand** dokumentieren, keinen Zwischenstand. Voraussetzung:
Domain, produktive Umgebungsvariablen, Stripe-Live-Konfiguration und alle
organisatorischen Punkte stehen endgültig fest.

Da B3 bewusst offen bleibt, ist der Drill **keine** Bedingung mehr für den
Bericht. Bis dahin gilt der Architektur-Freeze unverändert.

> **Beim Schreiben des Berichts:** Die Prüfungen sind **frisch auszuführen**
> (tsc, eslint, Unit-Tests, Build, alle fünf E2E-Suiten, DB-/RLS-Abfragen) statt
> die Ergebnisse dieses Dokuments zu übernehmen – andernfalls dokumentierte der
> Bericht einen überholten Stand. Ebenso sind die offenen Annahmen (W7,
> Supabase-Backups) zu diesem Zeitpunkt neu zu verifizieren.

**Beweisregel für den Abschlussbericht (Vorgabe Auftraggeber 2026-07-23):**
Nur **nachweislich bestätigte** Sachverhalte erscheinen als Fakten. Alles andere
wird ausdrücklich als **Annahme** oder **offener Punkt** gekennzeichnet – auch
dann, wenn es plausibel klingt. Gemessene Prüfergebnisse (tsc, Tests, E2E,
DB-Abfragen) sind Fakten; Aussagen über Tarifbedingungen Dritter sind es nicht,
solange sie nicht verifiziert wurden. Vgl. die stehende Projektregel, Fakten und
Annahmen strikt getrennt auszuweisen.

**Offen (als Annahmen zu führen, bis verifiziert):**

1. **Supabase-Backup-Lage** (Dashboard → Database → Backups) – bestimmt, ob B3
   als „ungetestete Wiederherstellung" oder „kein Wiederherstellungspunkt"
   auszuweisen ist.
2. **Hosting-Tarif / Vercel-Bedingungen** (W7) – kommerzielle Nutzung und
   Cron-Takt.

**Bereits entschieden:**

- **B3** bleibt offen; im Bericht transparent als noch **nicht durchgeführter**
  Restore-Drill mit Begründung (kostenloser Tarif, kein geeignetes Testprojekt).
- **Lokale Dump-Routine**: sinnvoll, wird aber **erst nach dem Go-live**
  umgesetzt (Architektur-Freeze).

Wird der Drill später durchgeführt, gehören ins Protokoll: Dauer von Dump und
Restore, die Ausgabe von `restoreDrillVergleich.mjs` (`✅ BESTANDEN`, Exit 0),
ob die **B1-Härtung** den Restore überstand oder `0021` nachgezogen werden
musste, sowie die Bestätigung des Teardowns.

---

## 🔴 Blocker – vor Go-live beheben

### B1 · Öffentlicher Schreibweg auf Kundendaten-Tabellen (Sicherheit) — ✅ BEHOBEN (2026-07-23)

> **Erledigt durch Migration [0021_rls_insert_haertung.sql](../supabase/migrations/0021_rls_insert_haertung.sql)** –
> angewendet und verifiziert. Details, Nachweis und die technische Freigabe für
> diesen Punkt am Ende des Abschnitts.

**Beleg (Produktiv-DB):** Die Tabellen `orders`, `order_items` und
`configuration_elements` haben je eine RLS-Policy `INSERT` für die Rolle
`public` mit `WITH CHECK (true)`. Gleichzeitig besitzen die Rollen `anon` und
`authenticated` volle Tabellenrechte (`INSERT`, `SELECT`, `UPDATE`, `DELETE`, …;
Supabase-Standard-Grants).

**Wirkung:** Mit dem öffentlich ausgelieferten Publishable-Key
(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) kann **jede beliebige Person** über die
Supabase-REST-API direkt Zeilen in diese Tabellen einfügen – und umgeht damit
**vollständig** den serverseitigen Preis (`serverPricing`), die Validierung,
das Rate-Limiting und die atomare Erstellung (`create_order_atomic`). Möglich
sind gefälschte Bestellungen (z.B. `total_price` = 0, `payment_status` frei
setzbar), Spam und – da der Adminbereich solche Bestellungen anzeigt – im
schlimmsten Fall ein echter Lieferantenauftrag für eine erfundene Bestellung.

Lesen, Ändern und Löschen bestehender Bestellungen ist dagegen korrekt
gesperrt (keine SELECT/UPDATE/DELETE-Policy) – das Leck ist auf **Einfügen**
begrenzt.

**Warum das gefahrlos behebbar ist:** Der gesamte echte Bestellweg läuft über
`createAdminClient()` (Service-Role, umgeht RLS ohnehin). Der Browser-/anon-
Client (`src/lib/supabase/client.ts`) wird **nirgends** verwendet. Die drei
INSERT-Policies werden von der Anwendung also nicht gebraucht.

**Wichtige Präzisierung bei der Behebung (2026-07-23):** Ein erster REST-Test mit
`Prefer: return=representation` wurde mit *„new row violates row-level security
policy"* abgewiesen und legte kurz einen Fehlschluss nahe (Leck bereits dicht).
Das war ein Irrläufer: Diese Abweisung kommt vom **Zurücklesen** der Zeile
(`RETURNING`, das eine SELECT-Sichtbarkeit verlangt, die anon fehlt), NICHT vom
Einfügen. Der Gegentest mit `Prefer: return=minimal` (ohne `RETURNING`) legte
real eine Zeile an – **HTTP 201, nachgewiesen ausnutzbar** (Sonde sofort wieder
entfernt). Ebenso auf PG-Ebene: `set role anon; insert … (ohne RETURNING)` = OK.

Zusätzlich zeigte sich: **Migration 0008 beschrieb genau diesen Fix, war aber
nie auf die Produktiv-DB angewendet** (die Policies aus 0001 waren live) – ein
konkreter Fall der fehlenden Migrations-Nachverfolgung (W5).

**Behebung – Migration 0021** (Trockenlauf → angewendet → verifiziert):
1. Die drei öffentlichen `INSERT`-Policies entfernt (vollendet 0008).
2. `revoke all privileges … from anon, authenticated` auf allen drei Tabellen
   (Defense in Depth). `service_role`/`postgres` behalten ihre Rechte.

**Nachweis (read-only gegen die Produktiv-DB, nach der Migration):**

| Prüfung | vorher | nachher |
|---|---|---|
| INSERT-Policies auf den 3 Tabellen | 3 | **0** |
| Grants `anon`/`authenticated` | volle Rechte | **keine** |
| anon INSERT, PG-Ebene (ohne RETURNING) | OK | **permission denied (42501)** |
| REST-Insert mit Publishable-Key, `return=minimal` | **HTTP 201 (Zeile angelegt)** | **HTTP 401 permission denied** |
| `service_role` INSERT (der echte Bestellweg) | OK | **OK** |
| anon SELECT auf öffentlichen Katalog (`products`) | 200 | **200** |

**Regression (nach der Migration, alles grün):** `tsc` 0 · `eslint` 0 · Unit
458/458 · E2E Bestellung 21/21 · Zahlung 21/21 · Rate-Limit 16/16 · Admin-Auth
19/19 · Stripe (echter Testmodus) 31/31 (zweimal isoliert bestätigt). Damit sind
Bestellprozess, Stripe, Phase 2, Rendering, PDF, E-Mail-Versand und
Lieferantenprozess nachweislich unverändert funktionsfähig.

> **Technische Freigabe B1:** Der öffentliche Direktschreibweg über den
> Publishable-Key ist geschlossen; der legitime Bestellweg (Service-Role) ist
> unberührt. **Dieser Punkt ist freigegeben.**

### B2 · Kein Scheduler konfiguriert – autonome Prozesse laufen nicht — ✅ BEHOBEN (2026-07-23)

> **Erledigt durch [`vercel.json`](../vercel.json)** – native Vercel-Cron-
> Konfiguration, keine externe Infrastruktur. Details am Ende des Abschnitts.

**Beleg (Ausgangslage):** Im Repository gab es **keine** Plattform-/Scheduler-
Konfiguration. Der einzige geplante Endpunkt `/api/cron/process-supplier-orders`
setzt einen Scheduler voraus.

**Wirkung (ohne Scheduler):** Es liefen **keine** autonomen Vorgänge:
Lieferantenverarbeitung, Verfall offener Zahlungen (`verfalle_offene_zahlungen`),
Freigabe hängengebliebener Phase-2-Ansprüche (`gib_haengende_abschluesse_frei`)
sowie das Aufräumen von Rate-Limit-Fenstern, Admin-Sitzungen und
Systemereignissen. Offene Stripe-Zahlungen wären z.B. nie verfallen, die
Betriebstabellen unbegrenzt gewachsen.

**Behebung – Vercel Cron:** `vercel.json` plant den Endpunkt alle 5 Minuten
(`*/5 * * * *`). Vercel fügt bei gesetzter `CRON_SECRET`-Env automatisch den
`Authorization: Bearer <CRON_SECRET>`-Header hinzu – exakt das, was die Route
prüft. **Keine Code-Änderung nötig.** Vollständige Doku inkl. Tarif-Hinweis in
[deployment.md](deployment.md), Abschnitt 3.

**Nachweis (Route lokal gegen die echte DB aufgerufen – der Vercel-Weg):**

| Aufruf | Ergebnis |
|---|---|
| `GET` mit korrektem `Bearer $CRON_SECRET` | **HTTP 200**, JSON mit `wartung: {rateLimitFenster, sitzungen, ereignisse, zahlungenVerfallen, abschluesseFreigegeben}` + `processed`/`reclaimed` → **alle Wartungsroutinen und die Lieferantenverarbeitung liefen durch** |
| `GET` mit falschem Bearer | **HTTP 401** |
| `GET` ohne `Authorization` | **HTTP 401** |
| ohne konfiguriertes `CRON_SECRET` | **HTTP 503** (im Code garantiert) |

`vercel.json` ist valide (5-Feld-Cron, Pfad `/api/…`). Damit werden
Lieferantenverarbeitung, Zahlungsverfall, Freigabe hängender Phase-2-Ansprüche
und die übrigen Aufräumroutinen automatisch ausgeführt.

**Voraussetzung Produktion:** `CRON_SECRET` in den Vercel-Env-Variablen
(Production) setzen; **Pro-Plan** für den 5-Minuten-Takt (Hobby = nur täglich,
ungeeignet – siehe deployment.md).

> **Technische Freigabe B2:** Die Scheduler-Konfiguration ist vorhanden,
> valide und der Endpunkt reagiert nachweislich korrekt. **Dieser Punkt ist
> freigegeben** – betrieblich verbleibt nur das Setzen von `CRON_SECRET` in
> Vercel und die Wahl des Pro-Plans.

### B3 · Backup und Restore nie praktisch erprobt — 🟠 VORBEREITET, Ausführung durch dich offen

> **Drill vollständig vorbereitet:** Anleitung [restore-drill.md](restore-drill.md)
> + Prüfskripte `scripts/restoreDrillFingerprint.mjs` und
> `scripts/restoreDrillVergleich.mjs`, read-only gegen Produktion validiert.
> **B3 gilt erst als erledigt, wenn der Drill einmal echt durchlaufen ist.**

**Beleg:** `docs/deployment.md` (Audit M5) hält fest, dass eine Wiederherstellung
„**nie erprobt worden**" ist. In dieser Umgebung ließ sich der eigentliche
Restore **nicht** ausführen (weder `pg_dump`/`psql`/Supabase-CLI/Docker noch eine
zweite Ziel-Instanz; nur read-only-Zugriff auf Produktion). Ein Restore gegen
Produktion wäre unzulässig.

**Wirkung:** Ein nie zurückgespieltes Backup ist eine Annahme, keine Sicherung –
der einzige Punkt, der im Ernstfall **nicht mehr behebbar** wäre.

**Was vorbereitet ist (2026-07-23):**
- **[restore-drill.md](restore-drill.md)** – lückenlose Schritt-für-Schritt-
  Anleitung: Dump (Supabase CLI) → Test-Projekt anlegen → Restore (`psql`) →
  automatische Verifikation → Erfolgskriterien, Fehlerquellen, Rollback-Plan,
  Teardown, Protokoll-Vorlage.
- **`restoreDrillFingerprint.mjs`** – erfasst objektgenau Tabellen, Spalten,
  Constraints, Indizes, Funktionen, Trigger, Policies, Grants, Buckets,
  Zeilenzahlen, Integrität und eine anon-Sicherheitssonde.
- **`restoreDrillVergleich.mjs`** – prüft Restore gegen Produktions-Baseline +
  absolute Soll-Vorgaben (inkl. **B1-Härtung**), Integrität (FK-Waisen),
  Zeilenzahlen und Geschäftskennzahlen; klares `✅ BESTANDEN` / `❌ FEHLGESCHLAGEN`.
- **Validierung:** Beide Skripte read-only gegen Produktion geprüft; Selbsttest
  (Prod gegen Prod) liefert `✅ BESTANDEN` – die Prüflogik funktioniert.

**Offen (durch dich):** Den Drill nach [restore-drill.md](restore-drill.md)
einmal vollständig ausführen (Dump, Test-Projekt, Restore, Vergleich `BESTANDEN`)
und das Protokoll ausfüllen. Erst dann ist B3 freigegeben.

#### Entscheidung 2026-07-23: B3 bleibt bewusst offen

Der Auftraggeber bleibt vorerst im **kostenlosen Supabase-Tarif** und legt kein
zusätzliches Testprojekt an (beide vorhandenen Projekte werden aktiv entwickelt
und kommen als Restore-Ziel nicht infrage). **B3 wird deshalb ausdrücklich NICHT
als erledigt dargestellt**, sondern bleibt offen und wird als geplanter
Betriebsprozess nachgeholt, sobald eine geeignete Testumgebung oder ein
Pro-Plan vorhanden ist. Der Go-live-Bericht muss das transparent als
verbleibendes Betriebsrisiko ausweisen.

> **🟦 ANNAHME (nicht verifiziert) mit Auswirkung auf die Risikoformulierung:**
> Bisher lautete B3 „Sicherung vorhanden, Wiederherstellung ungetestet". Nach
> allgemeinem Kenntnisstand – **von mir nicht geprüft** – bietet der kostenlose
> Supabase-Tarif **keine automatischen Sicherungen** (tägliche Backups ab Pro,
> PITR als Zusatz). **Sollte** sich das bestätigen, lautet das Risiko nicht
> „ungetestete Wiederherstellung", sondern **„kein Wiederherstellungspunkt bei
> Datenverlust"** – eine andere Größenordnung.
>
> **Zu verifizieren:** Dashboard → Database → Backups. Bis dahin im Go-live-
> Bericht ausdrücklich als **offene Annahme** führen, nicht als Tatsache.
>
> **Kostenlose Gegenmaßnahme – beschlossen, aber ERST NACH DEM GO-LIVE:** Ein
> regelmäßiger **lokaler logischer Dump** (`supabase db dump`, Befehle stehen in
> [restore-drill.md](restore-drill.md)), offline verwahrt, kostet nichts und
> verwandelt „kein Backup" in „Backup vorhanden, Restore ungetestet". Der
> Auftraggeber hält den Vorschlag für sinnvoll, will ihn wegen des
> Architektur-Freeze aber erst nach dem Produktivstart umsetzen.

### B4 · Next.js-Advisories — ✅ ENTSCHIEDEN (2026-07-23): bewusst zurückgestellt

> **Vollständige Analyse und Begründung: [next-upgrade-entscheidung.md](next-upgrade-entscheidung.md)**
> – inkl. Advisory-für-Advisory-Betroffenheitsprüfung, real durchgeführtem
> Upgrade-Versuch, reproduzierbarem Funktionsbruch und verifiziertem Rollback.
>
> **Kurz:** Der Großteil der Advisories ist nachweislich **nicht anwendbar**
> (keine Middleware, kein Pages Router/i18n, keine rewrites, kein custom server,
> keine Edge-Runtime, keine CSP-Nonce). Das anwendbare Restrisiko ist ganz
> überwiegend **DoS** – kein Datenabfluss, keine Codeausführung. Ein Upgrade auf
> `next@15.5.21` schließt zwar alle Advisories und baut sauber (tsc/lint/458
> Tests/Build grün, Audit 0), **bricht aber nachweislich den Konfigurator-Canvas**
> (`ReactCurrentOwner`-Fehler: react-konva 18 ist mit der von Next 15 genutzten
> React-Fassung unverträglich). Die Reparatur erzwingt React 19 + react-konva 19
> und damit die Neuvalidierung des visuell eingefrorenen Konfigurators –
> unmittelbar vor dem Go-live unverhältnismäßig. Rollback auf 14.2.35 ist
> erfolgt und vollständig verifiziert (alle fünf E2E-Suiten grün).

**Beleg (Ausgangslage):** Installiert ist `next@14.2.35` (das neueste der
14.x-Reihe). `npm audit --audit-level=high` meldet **4 hohe + 1 moderate**
Schwachstelle; innerhalb 14.x gibt es **keinen** Patch mehr.

**Korrektur:** Die ursprüngliche Aussage „Behebung erst in `next@16.2.11`" war
**falsch**. Die Obergrenzen aller Advisory-Bereiche liegen in der **15.5.x**-Linie
(höchste: `<15.5.21`); npm schlägt 16.2.11 nur als neueste Version vor.

**Korrektur zur bisherigen Einschätzung:** Die Notiz N1 in `docs/deployment.md`
bezeichnet die Funde als reine **Bauzeit**-Abhängigkeiten (glob/postcss) und
„nicht ausnutzbar". Das trifft auf den heutigen Stand **nicht** zu: Die vier
Highs sind **Next.js-Laufzeit-Advisories** und betreffen genau die hier
genutzten Bausteine – u.a. „DoS in App Router using Server Actions" und
„Unauthenticated disclosure of internal Server Function endpoints", dazu
Cache-Poisoning in RSC-Antworten und SSRF in Server Actions.

**Nebenwirkung:** Der CI-Schritt `npm audit --audit-level=high` schlägt dadurch
**derzeit fehl** – die Pipeline ist an dieser Stelle rot.

**Entscheidung:** Upgrade **zurückgestellt** – Roadmap-Platz seit 2026-07-23:
**zweites** Projekt nach dem Go-live, nach der Filterleiste
([filterleiste-konzept.md](filterleiste-konzept.md)). Pfad ist vermessen:
Next 15.5.x + React 19 + react-konva 19 + visuelle Neuvalidierung, ~1–2 Tage. Bis dahin gelten die Maßnahmen aus
[next-upgrade-entscheidung.md](next-upgrade-entscheidung.md) Abschnitt 4 – u.a.
der CI-Audit-Schritt als **datierte, begründete Ausnahme**, nicht stillschweigend.
Sofortiges Vorziehen, sobald ein anwendbares Advisory auf Datenabfluss oder
Codeausführung lautet.

---

## 🟡 Wichtig – zeitnah, aber kein harter Blocker

### W1 · E-Mail-Testmodus ist standardmäßig AN
`src/lib/email/sendEmail.ts`: `isTestMode()` liefert `true`, außer
`EMAIL_TEST_MODE` ist **exakt** `"false"`. Sicherer Default – aber in der
Produktion **zwingend** auf `false` zu setzen, zusammen mit einer bei Resend
verifizierten Absender-Domain (`RESEND_FROM_EMAIL`). Sonst gehen **alle**
Kundenmails an `EMAIL_TEST_RECIPIENT` statt an die Kundschaft.

### W2 · Pflicht-Umgebungsvariablen mit stillem Fehlverhalten
`NEXT_PUBLIC_SITE_URL` fällt bei Fehlen auf `http://localhost:3007` zurück
(`robots.ts`, `sitemap.ts`, `orderIntake.ts`, `paymentService.ts`) – Kunden-
und Zahlungslinks wären dann unbrauchbar, ohne Fehlermeldung. Muss produktiv
gesetzt sein. Ebenso Pflicht: `ADMIN_SECRET`, `ORDER_TOKEN_SECRET`,
`CRON_SECRET`, `SUPABASE_SECRET_KEY`, Stripe-Live-Schlüssel. `E2E_TESTMODUS`
darf produktiv **nicht** gesetzt sein. (Der Health-Check `/api/health` prüft
die Pflichtvariablen und ist das richtige Werkzeug direkt nach dem Deploy.)

### W3 · Verwaiste-Dateien-Bereinigung nur manuell
`scripts/verwaisteDateien.mts` (`npm run dateien:pruefen -- --loeschen`) ist
nicht im Cron eingehängt. Verwaiste Uploads (aus fehlgeschlagenen
Transaktionen) belegen Storage, bis jemand den Lauf manuell startet. Volumen
gering, aber über Jahre stetig. Könnte an die Cron-Wartung angehängt werden.

### W4 · `playwright` als Laufzeit-Abhängigkeit
`package.json` führt `playwright` unter `dependencies`, nicht `devDependencies`.
Es wird nur von Skripten/Tests gebraucht (kein Import in `src/`). Damit wird ein
schweres Test-Paket in den Produktions-Install gezogen (`npm ci --omit=dev`
würde es sonst weglassen). Gehört zu `devDependencies`.

### W5 · Kein Migrations-Ledger
Migrationen werden über `scripts/applyMigration.mjs` manuell eingespielt; die DB
führt **keine** Tabelle darüber, welche Migrationen gelaufen sind. Der
angewendete Stand lässt sich nur durch Objekt-Inspektion ermitteln – genau die
Lücke, die beim Ausfall von 0011 wochenlang unbemerkt blieb. (Im Review
verifiziert: 0001–0020 sind faktisch angewendet, siehe unten. Das behebt den
strukturellen Mangel aber nicht.)

### W7 · 🟦 ANNAHME (nicht verifiziert) · Vercel-Tarif: kommerzielle Nutzung und Cron-Takt

> **Beweislage:** Dies ist **keine** von mir gemessene Tatsache, sondern eine
> Annahme aus allgemeinem Kenntnisstand zu Vercels Tarifbedingungen. Sie ist
> **vor der Freigabe an Vercels aktuellen Bedingungen zu verifizieren** und bis
> dahin im Go-live-Bericht als offener Punkt zu führen – nicht als Fakt.

**Angenommener Sachverhalt:** Vercels Hobby-Plan ist auf persönliche,
nicht-kommerzielle Nutzung beschränkt; ein Shop, der Zahlungen entgegennimmt,
fiele nicht darunter (Risiko: Sperrung im laufenden Betrieb). Ferner sind
Cron-Jobs auf Hobby auf **einmal täglich** begrenzt – damit liefen
Zahlungsverfall, Freigabe hängender Phase-2-Ansprüche (15-Minuten-Schwelle, B2)
und Lieferantenverarbeitung stark verzögert.

**Wenn sich das bestätigt:** Der Wunsch „ohne weitere Kosten betreiben" wäre auf
der **Hosting**-Seite nicht erreichbar (anders als bei Supabase, wo der freie
Tarif für den Start tragfähig ist). Optionen dann: Vercel Pro, bewusst Hobby mit
ausgewiesenem Risiko und `vercel.json` ehrlich auf täglich gestellt, oder
Alternativhosting. **Entscheidung steht aus.**

### W8 · 🟦 ANNAHME (nicht verifiziert) · Kapazitätsgrenzen des freien Supabase-Tarifs

> **Beweislage:** Zahlenwerte aus allgemeinem Kenntnisstand, **nicht** am
> Projekt gemessen. Vor der Freigabe im Supabase-Dashboard gegenprüfen.

**Angenommener Sachverhalt:** rund **500 MB Datenbank** und **1 GB Storage** im
freien Tarif; Projekte pausieren nach längerer Inaktivität (im laufenden
Shopbetrieb inkl. Cron praktisch ausgeschlossen).

**Gesicherter Teil:** Unabhängig von den genauen Grenzwerten wächst der private
Bucket `production-files` mit **jeder** Bestellung (Logos + Produktionsblätter) –
das ist am Datenmodell belegt. Der Speicherverbrauch gehört damit in die
Betriebsüberwachung, und der Aufräumlauf für verwaiste Dateien (W3) sollte
regelmäßig laufen.

### W6 · Keine Content-Security-Policy
`next.config.js` setzt bewusst keine CSP (Kommentar: erst gegen Konva/Canvas/
data:-URLs/Supabase zu testen). Alle übrigen Sicherheitsheader (HSTS,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
sind gesetzt. Bekannte, dokumentierte Lücke – vor Go-live als eigener
getesteter Schritt nachziehen.

---

## 🟢 Gering / Aufräumen (kein Betriebsrisiko)

- **Toter Code:** `src/lib/supabase/client.ts` (Browser-/anon-Client) wird
  nirgends importiert.
- **Leere, ungenutzte Katalogtabellen:** `products`, `categories`, `brands`,
  `product_colors`, `product_sizes`, `print_areas`, `pricing_rules` haben 0
  Zeilen; der Katalog lebt im Code und wird zur Laufzeit **nicht** aus der DB
  gelesen (Grep bestätigt). Kein Laufzeitrisiko, aber relevant für das geplante
  Filter-Projekt (dort soll der Markenfilter aus der DB kommen).
- **Doku-Abweichungen:** Cron-Beispielkommentar nennt Port `3001` (dieses
  Projekt läuft auf `3007`); `deployment.md` listet in der Cron-Wartungstabelle
  `verfalle_offene_zahlungen` und `gib_haengende_abschluesse_frei` nicht auf,
  obwohl der Code sie ausführt; Testanzahl „451" statt aktuell 458.
- **`package.json` ohne `engines`-Feld:** Node-Version für die Laufzeit nicht
  gepinnt (CI nutzt Node 20).
- **Restliche `console.info/warn/error`** (~40) umgehen die zentrale
  PII-Bereinigung des strukturierten Loggers; der Wächter-Test verbietet nur
  `console.log(`. Bekannte, dokumentierte Alt-Last; der Kopfkommentar in
  `log.ts` („Kein console.* mehr im Projekt") ist überzeichnet.
- **Interne Kostendaten im Repo:** `ek-preise-erfassung.csv` ist versioniert
  (kein Geheimnis, aber Geschäftsdaten – nur relevant, falls das Repo je
  öffentlich würde).
- **Uncommittete Änderungen** im Arbeitsverzeichnis (Produktbilder + Docs) –
  ein Deploy aus Git würde sie nicht enthalten; vor Auslieferung committen oder
  bewusst verwerfen.

---

## ✅ Geprüft und in Ordnung

- **Git-Hygiene:** `.env.local` ist **nicht** versioniert; `.gitignore` deckt
  Env, Build, Logs, QA-Screenshots, `_tmp_`-Skripte ab.
- **Umgebungsvariablen-Konsistenz:** Die im Code gelesenen Namen stimmen mit
  `.env.local.example` und den CI-Build-Platzhaltern überein (keine
  Namensabweichung, die im Deploy auffiele).
- **RLS flächendeckend:** Alle 16 public-Tabellen haben RLS aktiv. Kundendaten
  (`orders`/`order_items`/`configuration_elements`) sind für anon **nicht
  lesbar**; interne Tabellen (Sitzungen, Ereignisse, Rate-Limit, Lieferanten)
  haben bewusst keine Policy = nur Service-Role. Katalogtabellen: öffentliches
  Lesen (`is_active`), unkritisch. (Einzige Ausnahme: B1.)
- **Angewendete Migrationen (gegen Produktiv-DB verifiziert):** 0001–0020
  faktisch vorhanden – alle erwarteten Funktionen (`create_order_atomic`,
  `beanspruche_abschluss`, `gib_abschluss_frei`, `gib_haengende_abschluesse_frei`,
  `verfalle_offene_zahlungen`, `raeume_rate_limit_auf`,
  `raeume_admin_sitzungen_auf`, `raeume_system_ereignisse_auf`), alle kritischen
  `orders`-Spalten (Zahlung, Steuer, `client_request_id`,
  `abschluss_gestartet_am`, Versand …) und der private Bucket sind da.
  PostgreSQL 17.6.
- **Storage-Bucket** `production-files`: `public = false`, ausschließlich
  serverseitig über die Service-Role erreichbar. Pfadsicherheit (B6) durch
  Tests abgesichert.
- **Admin-Authentifizierung:** serverseitige Sitzungen (32-Byte-Token,
  gehasht), Cookie `httpOnly` + `sameSite=lax` + `secure` in Produktion,
  Ablauf/Widerruf vorhanden. `ADMIN_SECRET` nur in `auth.ts` (Wächter-Test).
- **Cron-Absicherung:** ohne `CRON_SECRET` → 503; Vergleich zeitkonstant, nur
  über `Authorization`-Header (Query-Weg entfernt); Wartung einzeln abgefangen.
- **Health-Check:** öffentlich wortkarg, Details nur für Admins; prüft DB,
  Storage, Pflichtvariablen, Dienste mit Zeitlimits; 503 bei kritisch.
- **Logging:** zentrale, strukturierte JSON-Ausgabe mit PII-Bereinigung
  (E-Mails, IPs gekürzt, Schlüssel/Token, lange Zufallsstrings); in Produktion
  keine Stacktraces/Debug; Persistenz ab WARNING in `system_ereignisse`.
- **Testmodus (`E2E_TESTMODUS`):** verlangt exakt `aktiv`, nur aus der
  Umgebung, nie aus einem Request – nicht versehentlich aktivierbar.
- **Keine Reste in Produktion:** keine Test-/Debug-Routen unter `/api`, keine
  `TODO/FIXME/HACK`, kein `console.log`, keine hartkodierten Secrets
  (`pruefeSecrets.mjs` in CI). Stripe läuft über Konfigurations-Gate, kein
  stiller Rückfall auf den Testanbieter im Produktivmodus.
- **CI:** tsc, lint, Unit-Tests (mit Wächtern), Build (mit Platzhalter-Env),
  Secret-Scan, Migrations-Struktur – alle blockierend. E2E und Migrations-
  Anwendung bewusst lokal (begründet). Einzige Ausnahme: der Audit-Schritt
  (siehe B4).

---

## Was der Reviewer NICHT abschließend prüfen konnte

- **Praktischer Restore-Test (B3):** mangels Werkzeugen/Ziel-Instanz in dieser
  Umgebung nicht durchführbar. Muss mit Supabase-Zugang durch dich erfolgen.
- **Supabase-Backup-Konfiguration/Tarif:** nur im Supabase-Dashboard sichtbar,
  nicht aus dem Code ableitbar.
- **Tatsächlich gesetzte Produktions-Umgebungsvariablen:** werden auf der
  Hosting-Plattform gepflegt, nicht im Repo; hier nur gegen `.env.local`
  (Entwicklung) und die Code-Erwartung geprüft.

---

## Kurz-Checkliste bis zur Freigabe

1. ~~**B1** – öffentliche INSERT-Policies entfernen (+ Grants widerrufen)~~
   **✅ ERLEDIGT (Migration 0021, verifiziert 2026-07-23).**
2. ~~**B2** – Scheduler einrichten, ersten Lauf verifizieren~~
   **✅ ERLEDIGT (`vercel.json`, Endpunkt-Nachweis 2026-07-23).** Betrieblich:
   `CRON_SECRET` in Vercel setzen + Pro-Plan.
3. **B3** – 🟠 Drill **vorbereitet** ([restore-drill.md](restore-drill.md) +
   Skripte, read-only validiert). Offen: einmal echt ausführen + Protokoll.
4. ~~**B4** – Next.js aktualisieren~~ **✅ ENTSCHIEDEN: zurückgestellt**
   ([next-upgrade-entscheidung.md](next-upgrade-entscheidung.md)). Offen nur:
   CI-Audit-Schritt als datierte Ausnahme führen.
5. **W1/W2** – Produktions-Env setzen (`EMAIL_TEST_MODE=false` + verifizierte
   Domain, `NEXT_PUBLIC_SITE_URL`, Secrets, Stripe-Live), danach `/api/health`.
