# DSGVO-Löschkonzept

Setzt Audit-Punkt H6 (`docs/audit-produktionsreife.md`, `docs/go-live-checkliste.md`)
um: Aufbewahrungsfrist, Anonymisierungslauf, dokumentierter Auskunfts- und
Löschprozess. Stand 2026-08-07.

Die Fristen hier sind **wortgleich** mit dem, was
`src/app/datenschutz/page.tsx` (Ziffer 10) Kundinnen und Kunden verspricht –
ein Wächter-Test (`src/config/__tests__/dsgvo.test.ts`) hält beides
zusammen.

---

## 1. Zwei grundverschiedene Fälle

### 1.1 Anfragen ohne Vertrag

Eine unverbindliche Anfrage (`order_type = 'inquiry'`), aus der keine
Bestellung wurde, unterliegt **keiner** gesetzlichen Aufbewahrungspflicht.
Es gibt keinen Grund, sie länger zu behalten als nötig, um sich zu melden.

**Frist:** 6 Monate (`ANFRAGE_LOESCHT_NACH_MONATEN`, `config/dsgvo.ts`).
**Mechanismus:** harte Löschung der Zeile (`orders`, cascade auf
`order_items`/`configuration_elements`). Zugehörige Speicherdateien werden
dadurch zu verwaisten Ordnern und beim nächsten Lauf von
`npm run dateien:pruefen` automatisch mitentfernt.

### 1.2 Bestellungen

Eine echte Bestellung erzeugt eine Rechnung. Name, Anschrift, Positionen,
Preise und Steuerdaten sind **Buchungsbelege** im Sinne von § 147 AO / § 257
HGB und müssen **10 Jahre** aufbewahrt werden – ein Recht auf vorzeitige
Löschung besteht in dieser Zeit ausdrücklich **nicht** (Art. 17 Abs. 3
lit. b DSGVO: gesetzliche Pflicht geht vor).

**Frist:** 10 Jahre (`BESTELLUNG_ANONYMISIERT_NACH_JAHREN`).
**Mechanismus:** **Anonymisierung**, nicht Löschung der Zeile. Nach Ablauf
der Frist verliert die Aufbewahrung ihre Rechtsgrundlage; die Postgres-
Funktion `anonymisiere_alte_bestellungen()` (Migration 0022) ersetzt dann
`customer_name`, `email`, `phone`, `company` und die Lieferadresse durch
neutrale Platzhalter. Positionen, Preise, Steuerbeträge und das Lieferland
bleiben **unverändert** – sie sind nicht personenbezogen und bleiben für
Finanzarchiv und langfristige Auswertungen nützlich. `anonymized_at` schützt
vor doppelter Bearbeitung.

### 1.3 Hochgeladene Motivdateien

Kundenlogos und daraus gerenderte Druckvorschauen sind **nicht** Teil der
aufbewahrungspflichtigen Rechnungsunterlage – § 147 AO betrifft Belege, keine
Werkdateien. Sie werden deutlich früher aus dem Speicher entfernt als die
Bestellzeile selbst anonymisiert wird.

**Frist:** 24 Monate nach Abschluss (`completed_at`) oder Stornierung
(`cancelled_at`) – laufende Bestellungen werden nie angefasst, unabhängig
vom Alter (`BESTELLDATEIEN_LOESCHEN_NACH_MONATEN`).
**Mechanismus:** `scripts/dsgvoAltdateien.mts` (`npm run dsgvo:altdateien`),
mit Trockenlauf als Standard und ausdrücklichem `--loeschen` für den
Ernstfall – bewusst **nicht** im automatischen Cron, weil hier anders als
beim reinen Tabellen-Aufräumen echter Dateispeicher **gültiger** Bestellungen
betroffen ist. Dieselbe Vorsicht wie beim bereits bestehenden
`scripts/verwaisteDateien.mts`, nur mit einer zusätzlichen Stufe (die
Bestellung existiert ja weiterhin – nur ihre Dateien nicht mehr).

---

## 2. Warum automatisiert UND vorsichtig zugleich

Die reinen Tabellen-Operationen (1.1, 1.2) laufen automatisch über die
bestehende Cron-Route (`src/app/api/cron/process-supplier-orders/route.ts`,
Abschnitt „Wartung") – im selben Muster wie die bereits vorhandenen
Aufräumläufe für Rate-Limits, Admin-Sitzungen und Systemereignisse. Beides
sind reine, durch Fremdschlüssel und `on delete cascade` abgesicherte
Datenbankoperationen ohne Rückwirkung auf laufende Vorgänge.

Die Datei-Operation (1.3) bleibt **manuell auslösbar**, nicht automatisch:
Sie entfernt Bytes aus einem externen Speicherdienst, was sich nicht per
Datenbank-Transaktion zurückrollen lässt. Genau dieselbe Vorsicht gilt
bereits für den bestehenden Aufräumlauf verwaister Dateien – hier wird sie
konsequent fortgeführt.

**Wichtig für die Einschätzung des heutigen Standes:** Alle bestehenden
Testbestellungen sind aus Juli/August 2026. Keine der drei Fristen greift
also aktuell irgendwo – alle drei Mechanismen sind heute geschriebene,
aber noch nie ausgelöste Funktionen. Das ist beabsichtigt: Sie sollen
bereitstehen, bevor sie gebraucht werden, nicht nachträglich entstehen,
wenn die ersten Daten tatsächlich alt genug sind.

---

## 3. Auskunfts- und Löschprozess (Art. 15 / Art. 17 DSGVO)

Betrifft Anfragen, die **außerhalb** der automatisierten Fristen bei uns
eingehen – z. B. „Welche Daten haben Sie über mich gespeichert?" oder „Bitte
löschen Sie meine Daten" per E-Mail an die in Ziffer 1 der
Datenschutzerklärung genannte Adresse.

### 3.1 Auskunft (Art. 15)

1. Identität der anfragenden Person plausibilisieren (i. d. R. genügt die
   Bestellbestätigung oder die bei uns hinterlegte E-Mail-Adresse als
   Absender – bei Zweifeln telefonisch rückfragen).
2. Im Adminbereich (`/admin`) nach der E-Mail-Adresse suchen. **Heutiger
   Stand:** Die Bestellliste kennt noch keine Suche (siehe `M1` in
   `docs/audit-produktionsreife.md` bzw. die Erweiterung des Adminbereichs
   in diesem Durchlauf) – bis dahin genügt bei der heutigen Datenmenge das
   Durchsuchen der Liste bzw. eine direkte Abfrage über den
   Supabase-Dashboard-SQL-Editor: `select * from orders where email =
   '...'`.
3. Alle betroffenen Bestellungen (inkl. Positionen, Konfigurationselemente,
   Nachrichten) zusammenstellen und der anfragenden Person in verständlicher
   Form mitteilen (Kopie der gespeicherten Daten genügt, kein bestimmtes
   Format vorgeschrieben).
4. Antwortfrist: unverzüglich, spätestens innerhalb eines Monats
   (Art. 12 Abs. 3 DSGVO).

### 3.2 Löschung (Art. 17)

1. Identität wie unter 3.1 prüfen.
2. **Prüfen, ob eine Aufbewahrungspflicht entgegensteht:**
   - Handelt es sich um eine **Anfrage ohne Bestellung** → sofort löschbar,
     unabhängig von der 6-Monats-Frist (die Frist ist eine Obergrenze, keine
     Wartezeit für einen ausdrücklichen Wunsch).
   - Handelt es sich um eine **abgeschlossene Bestellung** innerhalb der
     10-Jahres-Frist → die Rechnungsdaten dürfen **nicht** gelöscht werden
     (Art. 17 Abs. 3 lit. b DSGVO). Der anfragenden Person ist das mit
     Verweis auf § 147 AO zu erklären. Was **sofort** möglich ist: die
     Motivdateien vorzeitig aus dem Speicher entfernen (unabhängig von der
     24-Monats-Frist, manuell über den Supabase-Storage-Bereich oder durch
     Ausführen von `npm run dsgvo:altdateien -- --loeschen` nach
     vorübergehendem Herabsetzen der Frist für den Einzelfall).
3. Löschung/Teillöschung durchführen, Vorgang mit Datum und Umfang
   dokumentieren (z. B. als Notiz im Ticketsystem/E-Mail-Ablage – ein
   eigenes Protokollfeld im Adminbereich ist für die heutige Größenordnung
   nicht erforderlich).

### 3.3 Was sich mit dem Kundenkonto ändert

Mit der additiven Kontofunktion (siehe `docs/entscheidungen-produktionsreife.md`,
Abschnitt Kundenkonto) entstehen zusätzliche personenbezogene Daten
(Kontoprofil, gespeicherte Adressen, Favoriten). Diese sind **nicht**
rechnungsrelevant und unterliegen keiner 10-Jahres-Pflicht – ein
Konto-Löschwunsch kann sie sofort entfernen, auch wenn zugehörige
**Bestellungen** weiterhin aufbewahrt bleiben müssen (die Bestellzeile
bleibt dann ohne verknüpftes Konto bestehen, exakt wie ein Gastkauf). Die
Selbstlöschfunktion des Kontos wird das dort bereits automatisch richtig
umsetzen; dieser Abschnitt wird ergänzt, sobald das Konto umgesetzt ist,
falls sich am Prozess etwas ändert.

---

## 4. Verwandte Dokumente

- `docs/upload-lebenszyklus.md` – der Speicherweg von Motivdateien insgesamt;
  verweist für die Aufbewahrungsfrist auf dieses Dokument.
- `docs/audit-produktionsreife.md` (H6) und `docs/go-live-checkliste.md` –
  ursprüngliche Prüfbefunde.
- `supabase/migrations/0022_dsgvo_loeschung.sql` – die technische Umsetzung.
- `src/config/dsgvo.ts` – die Fristen als Konstanten.

## 5. Umsetzungsstand (2026-08-07)

| Baustein | Stand |
|---|---|
| Fristen als Konstanten, mit Wächter-Test gegen die Datenschutzerklärung | **fertig** |
| Migration 0022 (RPCs + `anonymized_at`-Spalte) | **geschrieben**, noch **nicht angewendet** – braucht eine echte Datenbankverbindung (`DIRECT_URL`/`DATABASE_URL`), die in dieser Umgebung nicht hinterlegt ist |
| Automatischer Aufruf über die Cron-Route | **fertig verdrahtet** |
| `scripts/dsgvoAltdateien.mts` (Motivdateien, manuell) | **fertig**, ungetestet gegen eine echte Bestellung (keine DB-Verbindung verfügbar) |
| Auskunfts-/Löschprozess dokumentiert | **fertig** |
| Automatisierte Prüfung gegen eine echte Datenbank | **offen** – nachzuholen, sobald Supabase-Zugangsdaten hinterlegt sind (siehe `docs/entscheidungen-produktionsreife.md`, Abschnitt Umgebungsvariablen) |

**Wichtiger Hinweis für den Go-live:** Migration 0022 muss wie jede andere
Migration angewendet und gegen die echte Datenbank verifiziert werden (die
in diesem Projekt etablierte Praxis: „geschrieben, angewendet, verifiziert"
sind drei getrennte, jeweils zu bestätigende Schritte). Das war in dieser
Umgebung mangels Datenbankverbindung nicht möglich.
