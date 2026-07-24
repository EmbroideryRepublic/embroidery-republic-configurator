# Backup- und Restore-Praxistest (Restore-Drill)

Vollständig reproduzierbarer Nachweis, dass sich die Produktivdatenbank aus einer
Sicherung wiederherstellen lässt – **objektgenau, mit automatischer Prüfung**.
Erfüllt Go-live-Blocker **B3** aus [betriebsreview-2026-07-23.md](betriebsreview-2026-07-23.md).

> Ein Backup gilt erst als verlässlich, wenn eine Wiederherstellung erfolgreich
> getestet wurde. Dieser Drill ist so geschrieben, dass er **ohne
> Interpretationsspielraum** ausführbar und jederzeit wiederholbar ist.

---

## 0. Umfang – was dieser Drill abdeckt (und was nicht)

**Abgedeckt (Datenbank):** Tabellen, Spalten, Constraints, Indizes, Funktionen,
Trigger, RLS-Policies, Grants (anon/authenticated/service_role),
Storage-Bucket-**Definitionen**, Extensions, alle Zeilendaten, Zeilenzahlen,
Geschäftskennzahlen und die Sicherheitshärtung (B1).

**NICHT automatisch abgedeckt – separater Schritt (siehe 4b):** die
tatsächlichen **Dateien** im Storage-Bucket `production-files` (Logos,
Produktionsblätter). Ein Datenbank-Dump enthält die Bucket-Definition und die
Objekt-**Metadaten** (`storage.objects`), aber **nicht die Dateiinhalte** – die
liegen im Objektspeicher, nicht in Postgres.

**Grundsatz:** Der gesamte Drill läuft gegen ein **separates Test-Projekt**. Die
Produktivdatenbank wird nur **lesend** angefasst (Dump + Fingerprint). Ein
Restore gegen Produktion findet **nie** statt.

---

## 1. Voraussetzungen

**Werkzeuge (auf dem ausführenden Rechner):**

| Werkzeug | Zweck | Prüfen mit |
|---|---|---|
| Supabase CLI | Dump erzeugen | `supabase --version` |
| `psql` (PostgreSQL-Clienttools ≥ 15) | Restore einspielen | `psql --version` |
| Node.js (dieses Projekt) | Prüfskripte | `node --version` |

- Supabase CLI: Installation siehe `https://supabase.com/docs/guides/cli`.
- `psql`/PostgreSQL-Clienttools: unter Windows z.B. über den offiziellen
  PostgreSQL-Installer (nur „Command Line Tools" genügen).
- Die Prüfskripte (`scripts/restoreDrill*.mjs`) laufen mit dem `pg`-Paket aus
  `node_modules` – **aus dem Projektverzeichnis** ausführen.

**Zugänge:**

- **Produktions-Verbindungsstring** (`$PROD_DB_URL`): Supabase-Dashboard →
  Project Settings → Database → **Connection string → URI**. Die **direkte**
  Verbindung auf **Port 5432** verwenden (nicht den Pooler auf 6543).
- Berechtigung, im selben Supabase-Konto ein **neues Projekt** anzulegen.

> **Sicherheitshinweis:** Dump-Dateien und Fingerprints enthalten **Kundendaten**
> (Namen, E-Mail-Adressen, Anschriften) bzw. Betriebskennzahlen. Sie sind in
> `.gitignore` ausgeschlossen. Nach dem Drill **sicher löschen** (siehe 8). Nie
> in ein Repo, einen Chat oder geteilten Speicher legen.

---

## 2. Zeitbudget (Richtwerte, aktueller Datenbestand)

| Schritt | Dauer |
|---|---|
| Baseline-Fingerprint | < 1 min |
| Dump erzeugen | 1–5 min |
| Test-Projekt anlegen (Provisionierung) | 3–6 min |
| Restore einspielen | 1–5 min |
| Automatische Verifikation | < 1 min |
| **Gesamt** | **~15–30 min** |

---

## 3. Ablauf

Alle Befehle im **Projektverzeichnis** ausführen. Zuerst die beiden
Verbindungsstrings bereitlegen (nicht ins Repo schreiben):

```bash
# Produktions-URI (Port 5432, direkte Verbindung). Beispiel-Form:
export PROD_DB_URL="postgresql://postgres:<PW>@db.<prod-ref>.supabase.co:5432/postgres?sslmode=require"
# Arbeitsordner AUSSERHALB des Repos (enthält sensible Dateien):
mkdir -p ../restore-drill && cd ../restore-drill
```

### Schritt 1 – Baseline-Fingerprint der Produktion (read-only)

Erfasst den Soll-Zustand. **Unmittelbar vor dem Dump** ausführen, damit
Zeilenzahlen zum Dump passen.

```bash
node <projektpfad>/scripts/restoreDrillFingerprint.mjs --url "$PROD_DB_URL" --out fingerprint-prod.json
```

> Alternativ ohne `--url` aus dem Projektverzeichnis: dann wird `DIRECT_URL` aus
> `.env.local` verwendet (das ist die Produktion). Für den Drill ist der
> explizite `--url` klarer.

Erwartete Ausgabe: `Tabellen=16  Funktionen=10  Policies=7  Buckets=1`.

### Schritt 2 – Logischen Dump erzeugen (Supabase CLI)

Drei Dateien: Rollen, Schema, Daten. `--use-copy` macht den Datenimport schnell
und robust.

```bash
supabase db dump --db-url "$PROD_DB_URL" -f roles.sql  --role-only
supabase db dump --db-url "$PROD_DB_URL" -f schema.sql
supabase db dump --db-url "$PROD_DB_URL" -f data.sql   --data-only --use-copy
```

Dauer notieren (für das Protokoll). Prüfen, dass alle drei Dateien > 0 Byte sind.

### Schritt 2b – Storage-Dateien sichern (separater Schritt)

Der DB-Dump enthält **nicht** die Bucket-Dateien. Für eine vollständige
Sicherung die Objekte des privaten Buckets `production-files` kopieren – z.B. mit
`rclone` gegen den S3-kompatiblen Storage-Endpunkt (Dashboard → Storage →
Settings → S3 Connection) oder einem Skript, das über den Service-Role-Client
`list` + `download` ausführt. Für den **Datenbank**-Restore-Drill ist dieser
Schritt optional; für ein echtes Voll-Backup ist er Pflicht. Ergebnis (Anzahl
Dateien, Größe) im Protokoll festhalten.

### Schritt 2c – Managed Backup / PITR prüfen (Info, kein Blocker)

Im Dashboard (Database → Backups) festhalten, was der Tarif leistet: tägliche
Sicherung und/oder Point-in-Time-Recovery, Aufbewahrungsdauer. Dieser Drill
ersetzt das nicht, sondern **ergänzt** es um den Nachweis, dass ein Rückspielen
tatsächlich funktioniert.

### Schritt 3 – Separates Test-Projekt anlegen

1. Dashboard → **New project** (gleiche Organisation).
2. **Region identisch zur Produktion** wählen (vergleichbares Verhalten).
3. Starkes DB-Passwort vergeben und notieren.
4. Provisionierung abwarten (Status „Healthy").
5. Verbindungsstring des Test-Projekts holen (Port 5432, direkte Verbindung):

```bash
export TEST_DB_URL="postgresql://postgres:<PW>@db.<test-ref>.supabase.co:5432/postgres?sslmode=require"
```

> **Doppelte Kontrolle:** Vor dem nächsten Schritt sicherstellen, dass
> `$TEST_DB_URL` die **Test**-Referenz enthält – niemals die Produktion.

### Schritt 4 – Restore in das Test-Projekt einspielen

In **einer** Transaktion, mit hartem Abbruch bei Fehler; `session_replication_role
= replica` deaktiviert Trigger/FK während des Datenimports.

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$TEST_DB_URL"
```

Dauer notieren. Der Lauf muss **ohne Fehler** enden (dank `ON_ERROR_STOP`).

### Schritt 4b – (optional) Storage-Dateien ins Test-Projekt

Nur nötig, wenn die Dateiwiederherstellung mitgetestet werden soll: die in 2b
gesicherten Dateien in den Bucket `production-files` des Test-Projekts
hochladen (gleicher Weg, umgekehrte Richtung).

### Schritt 5 – Automatische Verifikation

Fingerprint des **wiederhergestellten** Projekts erfassen und gegen die Baseline
prüfen:

```bash
node <projektpfad>/scripts/restoreDrillFingerprint.mjs --url "$TEST_DB_URL" --out fingerprint-restore.json
node <projektpfad>/scripts/restoreDrillVergleich.mjs   --restore fingerprint-restore.json --baseline fingerprint-prod.json
```

Das Vergleichsskript prüft in einem Durchlauf:

1. **Pflicht-Objekte** (16 Tabellen, 8 Kernfunktionen aus den Migrationen 0001–0021)
2. **RLS** auf allen public-Tabellen aktiv
3. **Storage-Bucket** `production-files` vorhanden und **privat**
4. **Sicherheitshärtung B1** überlebt: keine öffentlichen INSERT-Policies und
   keine anon/authenticated-Grants auf `orders`/`order_items`/`configuration_elements`
5. **Integrität**: keine FK-Waisen
6. **Sicherheitssonde**: anon-INSERT auf `orders` ist blockiert
7. **Struktur** identisch zur Baseline (Extensions, Spalten, Constraints,
   Indizes, Funktionen, Trigger, Policies, Grants, Buckets)
8. **Zeilenzahlen** je Tabelle identisch
9. **Geschäftskennzahlen** identisch (Summe `total_price`, `net_total`,
   Bestellungen je Status)

Ergebnis am Ende: `✅ RESTORE-DRILL BESTANDEN` (Exit 0) oder
`❌ … FEHLGESCHLAGEN` (Exit 1) mit aufgelisteten Ursachen.

### Schritt 6 – Falls B1-Prüfung (Abschnitt 4) fehlschlägt

Supabase legt für neue Tabellen per `ALTER DEFAULT PRIVILEGES` automatisch
anon/authenticated-Grants an. Sollte der Restore diese wieder eingeführt haben,
meldet das Skript Abschnitt 4 als Fehler. Dann auf dem **Test-Projekt** die
Härtung erneut anwenden und erneut prüfen:

```bash
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file <projektpfad>/supabase/migrations/0021_rls_insert_haertung.sql \
  --dbname "$TEST_DB_URL"
```

Diese Erkenntnis ist selbst ein wertvolles Drill-Ergebnis: Sie zeigt, dass nach
einem echten Restore ggf. `0021` nachgezogen werden muss – im Protokoll vermerken.

---

## 4. Erfolgskriterien

Der Drill gilt als **bestanden**, wenn **alle** zutreffen:

- [ ] Dump erzeugt (roles/schema/data, alle > 0 Byte), Dauer notiert.
- [ ] Restore in das Test-Projekt **ohne Fehler** (`ON_ERROR_STOP`).
- [ ] `restoreDrillVergleich.mjs` endet mit **`✅ BESTANDEN` (Exit 0)**.
- [ ] Insbesondere grün: Pflicht-Objekte, RLS, privater Bucket, **B1-Härtung**,
      FK-Integrität, anon-Sonde blockiert, **Zeilenzahlen identisch**,
      Geschäftskennzahlen identisch.
- [ ] Wiederherstellungsdauer dokumentiert (Protokoll unten).
- [ ] (Bei Voll-Backup) Storage-Dateien gesichert und Anzahl dokumentiert.

Warnungen (z.B. Extension-Versionsdrift) sind zulässig und kein Fehlschlag.

---

## 5. Mögliche Fehlerquellen und Lösungen

| Symptom | Ursache | Lösung |
|---|---|---|
| `psql: connection refused` / Timeout | Pooler-Port 6543 statt direkt | Port **5432**, `sslmode=require` |
| Restore bricht mittendrin ab, Teilzustand | `ON_ERROR_STOP` fehlte | Skript exakt wie in Schritt 4 verwenden |
| Abschnitt 4 (B1) FAIL: anon-Grants zurück | Supabase Default Privileges | Schritt 6: `0021` nachziehen |
| Sonde: `rolle_fehlt` | `roles.sql` nicht eingespielt | `roles.sql` zuerst restoren |
| Extensions als Versionsdrift (Warnung) | Test-Projekt neuer als Prod | unkritisch, nur Warnung |
| Zeilenzahl weicht um wenige ab | Prod hat zwischen Dump und Baseline geschrieben | Baseline direkt beim Dump erfassen; erneut vergleichen |
| `data.sql` sehr langsam | ohne `--use-copy` gedumpt | mit `--use-copy` neu dumpen |
| Bucket-**Dateien** fehlen im Test | Dump enthält keine Dateiinhalte | Schritt 2b/4b (separate Storage-Sicherung) |

---

## 6. Rollback-Plan

Der Drill kann Produktion **nicht** beschädigen: Produktion wird ausschließlich
gelesen (Dump + Fingerprint; die Sicherheitssonde läuft in einer zurückgerollten
Transaktion). Alle Schreibvorgänge treffen ausschließlich das **Test-Projekt**.

Wenn während des Tests etwas schiefgeht:

1. **Restore fehlerhaft/halb:** Test-Projekt löschen (Schritt 8) und ab
   Schritt 3 neu beginnen – oder das Schema im Test-Projekt leeren
   (`drop schema public cascade; create schema public;`) und Restore wiederholen.
2. **Zweifel an der Ziel-DB:** Sofort stoppen und `$TEST_DB_URL` prüfen. Solange
   die Referenz nicht die Produktion ist, ist kein Schaden möglich.
3. **Versehentlich Produktion adressiert:** Ausgeschlossen, solange nur die
   read-only-Befehle (Fingerprint, `supabase db dump`) gegen `$PROD_DB_URL`
   laufen. Es gibt in dieser Anleitung **keinen** schreibenden Befehl gegen
   `$PROD_DB_URL`.

---

## 7. Teardown (nach dem Drill – wichtig)

1. **Test-Projekt löschen:** Dashboard → Test-Projekt → Settings → General →
   *Delete project*. (Spart Kosten und entfernt die dort liegenden Kundendaten.)
2. **Lokale Dateien sicher löschen** – sie enthalten Kundendaten:
   ```bash
   # aus ../restore-drill
   rm -f roles.sql schema.sql data.sql fingerprint-prod.json fingerprint-restore.json
   ```
   (Auf Windows: Dateien löschen und Papierkorb leeren; bei erhöhtem Bedarf
   sicheres Löschen verwenden.)
3. Storage-Sicherung (falls erstellt) ebenso sicher entfernen.

---

## 8. Protokoll-Vorlage (bei jedem Drill ausfüllen)

```
Restore-Drill-Protokoll
- Datum/Uhrzeit      : __________
- Durchgeführt von   : __________
- Prod-Projekt-Ref   : __________         Test-Projekt-Ref: __________
- Dump-Dauer         : ____ min           Restore-Dauer   : ____ min
- Gesamtdauer        : ____ min
- Vergleichsergebnis : BESTANDEN / FEHLGESCHLAGEN   (Exit ____)
- Warnungen          : __________
- B1 nach Restore    : ok / musste 0021 nachziehen
- Storage-Dateien    : nicht getestet / gesichert (___ Dateien, ___ MB)
- Besonderheiten     : __________
- Test-Projekt gelöscht + Dateien entfernt: ja / nein
```

Abgeschlossene Protokolle in `docs/` ablegen (z.B. `restore-drill-2026-08.md`),
damit die Wiederholbarkeit belegt ist.

---

## 9. Status

Die Werkzeuge sind erstellt und **read-only gegen die Produktion validiert**
(`restoreDrillFingerprint.mjs` erfasst 16 Tabellen/10 Funktionen/7 Policies/
1 Bucket; `restoreDrillVergleich.mjs` liefert im Selbsttest Prod-gegen-Prod
`✅ BESTANDEN`). **B3 gilt erst als erledigt, wenn dieser Drill einmal
vollständig mit einem echten Restore in ein Test-Projekt durchlaufen und das
Protokoll ausgefüllt wurde.**
