# ADR 0007 – Cursor-Mechanismus für die Buchhaltungs-Synchronisierung

**Status:** Entschieden und umgesetzt (Migration `0027_buchhaltung_sync_export.sql`).
**Kontext:** Schritt 6 der lokalen Buchhaltungs-Anwendung
(`embroidery-republic-buchhaltung`) braucht einen zuverlässigen "seit dem
letzten Lauf"-Abruf über `GET /api/accounting/v1/orders`
([OpenAPI](../openapi/accounting-sync-v1.yaml)), der keine Bestellung je
dauerhaft übersieht.

## Problem

`orders` hat keine generische `updated_at`-Spalte (geprüft: die einzigen
Treffer für `updated_at` in allen Migrationen betreffen `customer_profiles`/
`customer_addresses` (0023) und `supplier_orders` (0005) – nicht `orders`).

`created_at` korreliert nicht mit dem Zeitpunkt, an dem eine Bestellung
**buchhaltungsreif** wird: Eine Kartenzahlung kann Minuten oder Stunden nach
`created_at` von `pending` zu `paid` wechseln; die Lexware-Rechnung
(Migration 0026) entsteht erst danach, asynchron in Phase 2 des
Bestellabschlusses. Ein Cursor auf `created_at` würde eine solche Bestellung
nach Ablauf des Synchronisierungsfensters dauerhaft überspringen – ein
stiller Datenverlust, der erst auffällt, wenn eine Bestellung in der
Buchhaltung fehlt.

## Erwogene Optionen

1. **Kleine additive Migration** – zwei neue Spalten (`invoice_date`,
   `accounting_ready_at`) plus zwei Zeilen Schreiblogik in der bestehenden
   Rechnungsabschluss-Funktion (`orderCompletion.ts`).
2. **Bounded-Rescan-Fallback** – bei jedem Lauf ein festes Zeitfenster
   zurück (z. B. die letzten 30 Tage) erneut nach `created_at` abfragen,
   ohne Schemaänderung, verlassen auf die bestehende Sync-Dedup
   (`Sync.Quelle`/`Sync.ExterneId`) der Buchhaltung, um Doppelungen zu
   vermeiden.

Option 2 vermeidet eine Schemaänderung an der Website, ist aber **nicht
exakt**: Eine Bestellung, deren Zahlung erst nach Ablauf des Rescan-Fensters
bestätigt wird (denkbar bei Rechnungskauf mit verzögertem Zahlungseingang,
oder einer sehr späten Stripe-Bestätigung), würde weiterhin übersehen –
das Fenster verschiebt das Problem nur, löst es nicht. Zusätzlich wächst die
pro Lauf abgefragte Datenmenge mit der Fenstergröße statt mit der Anzahl
tatsächlich neuer Bestellungen.

## Entscheidung

**Option 1** – der Nutzer hat dieser kleinen, additiven Migration nach
Abwägung beider Optionen explizit zugestimmt.

`accounting_ready_at` wird genau einmal gesetzt, im selben Schritt wie
`invoice_pdf_url` (`orderCompletion.ts`) – dem Moment, ab dem eine
Bestellung sowohl Rechnungsnummer als auch PDF hat und damit vollständig für
den Export ist. `invoice_date` wird im selben Codepfad, aber früher (beim
`invoice_id`/`invoice_number`-Schreibzugriff) mitgeschrieben – die Variable
`auftrag.rechnungsdatum` existierte bereits, wurde bisher aber nur für die
Bestätigungs-E-Mail verwendet, nie persistiert.

`(accounting_ready_at, id)` zusammen ist ein stabiler, monoton wachsender
Keyset-Paginierungsschlüssel: `accounting_ready_at` allein reicht nicht, weil
zwei Bestellungen theoretisch denselben Zeitstempel tragen können (gleiche
Sekunde bei parallelem Abschluss); `id` als Tie-Breaker macht die
Reihenfolge total.

## Konsequenzen

- **Rein additiv, keine Rückwirkung:** Bestehende Bestellungen vor dem
  Deployment dieser Migration haben `accounting_ready_at = NULL` und werden
  vom Sync-Endpunkt dadurch automatisch ausgeschlossen – kein Backfill
  nötig, keine Gefahr, alte Bestellungen versehentlich erneut zu
  synchronisieren, sobald die lokale Buchhaltung zum ersten Mal läuft.
- **Kein Risiko für die bestehende Lexware-/Claim-Logik aus Migration 0026**
  – die beiden neuen Spalten werden ausschließlich zusätzlich zu den
  bestehenden Schreibzugriffen gesetzt, keine bestehende Bedingung in einer
  Claim-/Freigabe-Funktion ändert sich.
- **Der Sync-Endpunkt filtert zusätzlich auf `invoice_number is not null`**
  als Konsistenz-Absicherung, auch wenn `accounting_ready_at` allein
  praktisch dieselbe Menge beschreiben sollte.
- Ein zukünftiger Datentyp mit einer ähnlichen "wann ist er
  synchronisierbar"-Frage (z. B. Gutschriften) kann demselben Muster folgen:
  eine eigene `*_ready_at`-Spalte statt eines Versuchs, eine gemeinsame
  generische `updated_at`-Spalte für `orders` nachzurüsten (die hätte einen
  deutlich größeren, hier nicht gerechtfertigten Migrationsradius über den
  gesamten Bestellabschluss-Code).
