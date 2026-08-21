# Deployment-Checkliste: Live-Schaltung auf ergermany.de

Stand: 2026-08-07. Diese Checkliste ist das Ergebnis der finalen Endabnahme
(siehe `docs/entscheidungen-produktionsreife.md`, Abschnitte 11–13). Der
komplette Code ist deploybereit, lokal vollständig grün getestet und die
Migrationen sind gegen eine isolierte, frische Testdatenbank vollständig
verifiziert (siehe Abschnitt 13.2 unten). **Kein Schritt daraus wurde gegen
die echte Produktionsdatenbank ausgeführt** – das war eine bewusste
Entscheidung des Betreibers, siehe Abschnitt 13.1.

Reihenfolge einhalten. Nach jedem Schritt kurz prüfen, dass er wirklich
erfolgreich war, bevor der nächste beginnt.

---

## Vorab bestätigt (bereits vorhanden, keine Aktion nötig)

- Vercel-Projekt `ergermany` (Team `mofu61`) ist mit `https://www.ergermany.de`
  verknüpft und aktiv.
- Alle 19 Produktions-Umgebungsvariablen sind auf Vercel bereits hinterlegt
  (Supabase-URL/-Keys, `DATABASE_URL`/`DIRECT_URL`, `ADMIN_SECRET`,
  `RESEND_API_KEY` + zugehörige, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`,
  `ORDER_TOKEN_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`,
  `SUPPLIER_AUTOMATION_ENABLED`, `SUPPLIER_TG_*`). Geprüft per
  `vercel env ls production` (nur Namen, keine Werte eingesehen).
- Git-Remote `origin` zeigt auf
  `https://github.com/EmbroideryRepublic/embroidery-republic-configurator.git`,
  Push-Zugriff ist vorhanden (per `git push --dry-run` bestätigt).
- Aktueller Arbeitsstand (Branch `restore/session-recovery`) ist ein
  direkter, unveränderter Nachfahre von `origin/main` – kein Merge-Konflikt
  zu erwarten.

## ✅ Ehemaliger Nebenbefund – erledigt seit 2026-08-18

Das Vercel-Projekt läuft auf dem **Hobby-Tarif**; die geplanten nativen
Vercel-Cron-Jobs (`vercel.json`) wurden deshalb entfernt. **Das war bis
2026-08-18 ein offenes Risiko** (DSGVO-Auto-Anonymisierung,
Zahlungs-Timeout-Behandlung, Rate-Limit-Bereinigung, Lieferanten-
Automatisierung und – seit dem Rückerstattungs-Workflow – der
Cron-Reaper für hängengebliebene Erstattungs-Ansprüche hätten sonst
nicht automatisch gelaufen).

Seit Commit `0d35888d` (2026-08-18) ist das behoben: `.github/workflows/
cron-buchhaltung-sync.yml` ruft als externer GitHub-Actions-Scheduler
alle 10 Minuten (`*/10 * * * *`) denselben, per `CRON_SECRET` geschützten
Endpunkt `/api/cron/process-supplier-orders` auf – exakt der hier
ursprünglich empfohlene Lösungsweg. Ein hängengebliebener Anspruch bleibt
dadurch höchstens rund 10–25 Minuten hängen, nicht dauerhaft. Einzige
Voraussetzung, die sich aus dem Code selbst nicht prüfen lässt: Das
GitHub-Repository-Secret `CRON_SECRET` muss tatsächlich gesetzt sein und
mit dem in Vercel hinterlegten Wert übereinstimmen.

---

## Schritt 1 — Produktionsdatenbank sichern

**Warum zuerst:** einziger Weg, jederzeit einen Rollback zu ermöglichen.

Empfohlen (kein zusätzliches Tool nötig, Supabase CLI wird bei Bedarf per
`npx` automatisch geladen):

```bash
npx supabase db dump --db-url "<DATABASE_URL aus Vercel>" -f backup-vor-migration-$(date +%Y%m%d-%H%M).sql
```

- `<DATABASE_URL>`: aus dem Vercel-Dashboard (Project ergermany → Settings →
  Environment Variables → `DATABASE_URL`, Production) kopieren, oder per
  `vercel env pull --environment=production .env.production.local` lokal
  abrufen und daraus verwenden. **Diese Datei danach löschen, sie enthält
  echte Zugangsdaten.**
- Alternativ/zusätzlich: im Supabase-Dashboard unter „Database → Backups"
  prüfen, ob der aktuelle Tarif automatische tägliche Backups bzw.
  Point-in-Time-Recovery bietet (`docs/restore-drill.md`, Schritt 2c) –
  ersetzt aber nicht das gezielte Vor-Migration-Backup oben.
- **Erfolgsprüfung:** die erzeugte `.sql`-Datei ist nicht leer (mehrere
  hundert KB bis MB, je nach Datenmenge) und enthält lesbar `CREATE TABLE`-
  Anweisungen für alle 18 Tabellen.

> **Nachtrag 2026-08-18:** Seit dieser Checkliste (Stand 2026-08-07) sind drei
> weitere Migrationen entstanden: `0026_rechnung_und_versand.sql` (Lexware-
> Stilllegung/DHL-Claims), `0027_buchhaltung_sync_export.sql` (Accounting-
> Sync-Cursor) und `0028_website_rechnungsnummer.sql` (eigener
> Rechnungsnummernkreis). Vor jedem künftigen Produktions-Deploy zusätzlich zu
> Schritt 2 unten auch `0026`–`0028` gegen die Produktionsdatenbank prüfen/
> anwenden, in dieser Reihenfolge, nach demselben Vorgehen.

## Schritt 2 — Migrationen 0022–0025 anwenden

**Lokal bereits vollständig verifiziert** (siehe Abschnitt 13.2 im
Entscheidungsprotokoll) – alle 25 Migrationen (0001–0025) wurden gerade in
dieser Sitzung gegen eine frische, isolierte Test-Datenbank in exakt dieser
Reihenfolge angewendet, **ohne einen einzigen Fehler**. Die resultierende
Struktur (18 Tabellen, 13 Funktionen, 42 Spalten in `orders` inkl.
`customer_id`/`terms_accepted_at`/`customer_vat_id`/`anonymized_at`, 14
RLS-Policies, 45 Indizes, der Trigger `nach_konto_erstellung` auf
`auth.users`) stimmt exakt mit `docs/datenbankschema.md` überein.

Gegen die echte Produktionsdatenbank fehlen nur **vier** Migrationen (0001–
0021 sind laut `docs/entscheidungen-produktionsreife.md` bereits
angewendet):

```bash
node scripts/applyMigration.mjs supabase/migrations/0022_dsgvo_loeschung.sql
node scripts/applyMigration.mjs supabase/migrations/0023_kundenkonto.sql
node scripts/applyMigration.mjs supabase/migrations/0024_bestellung_kundenkonto_verknuepfung.sql
node scripts/applyMigration.mjs supabase/migrations/0025_bestellung_agb_zeitstempel.sql
```

Voraussetzung: `.env.local` enthält `DATABASE_URL`/`DIRECT_URL` mit den
echten Produktionswerten (z. B. per `vercel env pull --environment=production
.env.local` – Vorsicht, überschreibt die aktuelle lokale `.env.local`, vorher
sichern). Jede Migration läuft laut Skript-Kommentar transaktional mit
Vorher/Nachher-Zustandsabbild – bei einem Fehler wird automatisch
zurückgerollt, kein halb angewendeter Stand möglich.

**Erfolgsprüfung nach JEDER Datei:** Das Skript gibt den Vorher/Nachher-
Vergleich aus – bei additiven Migrationen (alle vier hier) müssen
`orders`/`order_items`/`configuration_elements`/`order_events`-Zeilenzahlen
und die `orders.summe_total_price` **identisch** bleiben. Weicht etwas ab,
sofort stoppen.

**Danach zusätzlich per SQL-Editor im Supabase-Dashboard verifizieren**
(oder per `psql`, falls verfügbar):

```sql
select count(*) from information_schema.tables where table_schema='public';
-- erwartet: 18
select count(*) from information_schema.routines where routine_schema='public';
-- erwartet: 13
select column_name from information_schema.columns
  where table_schema='public' and table_name='orders'
  and column_name in ('customer_id','terms_accepted_at','customer_vat_id','anonymized_at');
-- erwartet: alle 4 Zeilen
```

## Schritt 3 — Deployment auslösen

Zwei gleichwertige Wege, **nicht beide gleichzeitig**:

**Weg A (empfohlen, entspricht der bisherigen Praxis laut Git-Historie):**
```bash
git push origin restore/session-recovery:main
```
Vercel ist per GitHub-Integration an `main` gekoppelt (siehe frühere Commits
„Trigger Vercel deployment") – ein Push nach `main` löst automatisch ein
neues Produktions-Deployment aus.

**Weg B (manuell, falls die Git-Integration nicht mehr aktiv ist):**
```bash
npx vercel deploy --prod
```

**Erfolgsprüfung:** `npx vercel ls ergermany` zeigt das neue Deployment mit
Status `Ready` (nicht `Error`, nicht `Building` nach mehreren Minuten). Bei
`Error`: `npx vercel inspect <deployment-url> --logs` für die genaue
Fehlermeldung.

## Schritt 4 — Smoke-Test der Live-Seite

```bash
for p in "/" "/konto/anmelden" "/konto/registrieren" "/konto/passwort-vergessen" "/konto/profil" "/konfigurator" "/admin" "/produkt" "/kontakt" "/faq" "/impressum" "/datenschutz" "/agb"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.ergermany.de$p")
  echo "$p -> $code"
done
```
Erwartet: `200` für alle außer `/konto/profil` (dort `307`, Redirect zum
Login ohne Sitzung – das ist korrekt).

Zusätzlich empfohlen, je einmal echt im Browser:
- Startseite lädt Bilder/Stile korrekt (kein „unstyled"-Rendering).
- `/konfigurator` – ein Produkt öffnen, Logo hochladen, Warenkorb füllen.
- `/konto/registrieren` – Formular öffnen (nicht zwingend abschicken, um
  keine echte Test-Konto-Mail zu verschicken, außer das ist gewünscht).
- `/api/health` prüfen (`curl https://www.ergermany.de/api/health`) – sollte
  jetzt `200` liefern (in der lokalen Testumgebung ohne DB-Verbindung war das
  502/503, das war erwartet und kein Fehler dort).

## Schritt 5 — Abschließende Verifikation dokumentieren

In `docs/entscheidungen-produktionsreife.md` einen neuen Eintrag ergänzen:
Datum/Uhrzeit des Deployments, Ergebnis von Schritt 1–4, Deployment-URL,
Commit-Hash (`git rev-parse HEAD`). Diese Datei ist das durchgehend
geführte Protokoll der gesamten Produktionsreife-Arbeit.

---

## Rollback-Plan (falls irgendetwas nach Schritt 3 schiefgeht)

1. Vorherigen funktionierenden Deploy in Vercel reaktivieren:
   `npx vercel rollback` (setzt auf die vorherige Production-Deployment-URL
   zurück, in Sekunden wirksam, unabhängig von der Datenbank).
2. Falls die Migrationen selbst das Problem sind: die in Schritt 1 erzeugte
   Backup-Datei über den Supabase-SQL-Editor bzw.
   `psql "<DATABASE_URL>" < backup-vor-migration-*.sql` gegen eine **neue**
   Datenbank wiederherstellen und Connection-Strings umstellen – niemals
   blind über die aktuelle Datenbank drüberspielen, ohne vorher zu prüfen,
   ob seit dem Backup neue Bestellungen/Konten hinzugekommen sind.
