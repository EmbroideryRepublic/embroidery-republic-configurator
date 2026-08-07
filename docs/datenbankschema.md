# Datenbankschema

Alle 18 Tabellen, ihre Zusammenhänge und die Migrationshistorie. Stand
2026-08-07 (Migrationen 0001–0025, alle angewendet und verifiziert).

Einstieg: [README.md](README.md). Bestellablauf:
[bestellablauf.md](bestellablauf.md).

---

## Überblick

```
KATALOG (öffentlich lesbar)          BESTELLUNG (nur serverseitig)
  categories                           orders ─── customer_id (optional)
  brands                                 ├─ order_items
  products ──┬─ product_colors           │    └─ configuration_elements
             ├─ product_sizes            └─ order_events
             ├─ print_areas
             └─ pricing_rules          supplier_orders
                                         └─ supplier_order_events

KONTO (Supabase Auth, additiv)       BETRIEB (nur serverseitig)
  auth.users                           admin_sitzungen
    ├─ customer_profiles (1:1)         rate_limit_zaehler
    └─ customer_addresses (1:n)        system_ereignisse
```

Alle Tabellen haben **Row Level Security aktiv**. Der Katalog ist öffentlich
lesbar; alles andere ist ausschließlich über den Service-Role-Client
erreichbar (siehe [architektur.md](architektur.md), Abschnitt 5).

---

## Katalog

### `categories` (3 Spalten)
Produktkategorien. Öffentlich lesbar seit Migration 0016 (war zuvor die
einzige Tabelle ohne RLS – Audit-Fund H4).

### `brands` (4 Spalten)
Marken (Fruit of the Loom, Gildan, …).

### `products` (14 Spalten, 2 FK)
Das Kernprodukt. Verweist auf `brands` und `categories`. Trägt `base_price`
(der aus `purchasePrice` + Qualitätsstufe abgeleitete Verkaufs-Grundpreis)
und `is_active`.

| verweist auf | über |
|---|---|
| `brands` | `brand_id` |
| `categories` | `category_id` |

### `product_colors` (9 Spalten, 1 FK) · `product_sizes` (4 Spalten, 1 FK)
Farben und Größen je Produkt.

### `print_areas` (10 Spalten, 1 FK)
Bedruckbare Flächen je Produkt (Brust, Rücken, Ärmel) mit Maßen. Grundlage
der Flächen- und Preisberechnung.

### `pricing_rules` (8 Spalten)
Preisregeln je Veredelungsart (DTF, Stickerei). Vom Rechenkern gelesen; die
Datenquelle ist austauschbar (heute statisch, später Tabelle).

---

## Bestellung

### `orders` (42 Spalten)
Die zentrale Tabelle. Keine FK nach außen – Bestellungen sind bewusst
eigenständig (der Katalog kann sich ändern, ohne alte Bestellungen zu
berühren; die Produktdaten liegen als Schnappschuss in `order_items`).

Wichtige Spaltengruppen:

| Gruppe | Spalten | Migration |
|---|---|---|
| Kontakt/Versand | `customer_name`, `email`, `shipping_*` | 0001 |
| **Kundenkonto** | `customer_id` (nullable, `references auth.users`; NULL = Gastbestellung) | **0023** |
| Preis (brutto) | `total_price`, `base_price` | 0001 |
| **Steuer** | `tax_rate`, `tax_amount`, `net_total`, `prices_include_tax` | **0014** |
| Status | `status`, `payment_status` | 0001 / 0010 |
| Stornofenster | `cancelled_at`, `cancellation_source` | 0009 |
| **Zahlung (neutral)** | `payment_method`, `payment_provider`, `payment_reference`, `payment_transaction_id`, `payment_started_at`, `paid_at` | **0012** |
| **Zahlungsabschluss** | `abschluss_gestartet_am` (Claim auf Phase 2: Rendering/PDF/Mails) | **0020** |
| **Idempotenz** | `client_request_id` (partieller Unique-Index) | **0011** |
| Produktion | `pdf_url`, `production_files_url`, `tracking_number`, `shipped_at` | 0002 |
| **DSGVO** | `anonymized_at` (Zeitpunkt der Anonymisierung nach Aufbewahrungsfrist) | **0022** |
| **AGB/Steuernachweis** | `terms_accepted_at`, `customer_vat_id` (nullable, aus dem Kundenprofil übernommen) | **0025** |

### `order_items` (13 Spalten, 1 FK → orders)
Positionen. Enthält den **Schnappschuss** von Produktname, Farbe, Größen-
Mengen und den serverseitig berechneten Preisen. `total_price` wird
gespeichert, nicht abgeleitet (Migration 0013: `unit_price × quantity`
weicht wegen Rundung um Cent ab). Netto je Position seit 0014
(`net_total_price`, `tax_rate`).

### `configuration_elements` (25 Spalten, 1 FK → order_items)
Die platzierten Logos und Texte je Position: Ansicht, Koordinaten, Maße,
Rotation, Schriftattribute, Speicherpfade der beiden Logo-Versionen
(Original + angezeigt). Grundlage des Vorschau-Renderings.

### `order_events` (8 Spalten, 1 FK → orders)
Ereignisprotokoll je Bestellung: `event_type`, `from_status`, `to_status`,
`reason`, `detail` (jsonb). Nutzt u.a. `tax_backfilled` (0014),
`email_sent`, `status_changed`.

---

## Lieferanten

### `supplier_orders` (16 Spalten, 1 FK → orders)
Lieferantenbestellung je Bestellung und Lieferant, mit Status und
Fälligkeit. Details: [lieferanten-architektur.md](lieferanten-architektur.md).

### `supplier_order_events` (10 Spalten, 1 FK → supplier_orders)
Lebenslauf einer Lieferantenbestellung: Statuswechsel, Läufe, Sperren,
Fehler.

---

## Betrieb

### `admin_sitzungen` (7 Spalten) — Migration 0018
Serverseitige Admin-Sitzungen. Speichert **nur den SHA-256-Hash** des
Sitzungstokens, nie den Token und niemals das Secret. Felder:
`token_hash`, `laeuft_ab_am`, `letzter_zugriff`, `widerrufen_am`,
`herkunft` (gekürzte IP). Siehe
[admin-authentifizierung.md](admin-authentifizierung.md).

### `rate_limit_zaehler` (3 Spalten) — Migration 0017
`(schluessel, fenster_start, anzahl)`, Primärschlüssel über die ersten
beiden. Gezählt wird atomar über `pruefe_rate_limit()`. Siehe
[rate-limiting.md](rate-limiting.md).

### `system_ereignisse` (9 Spalten) — Migration 0019
Kritische Betriebsereignisse ab `WARNING`. Feste Kategorien und Schweregrade
als `check`-Bedingung. Enthält **keine** personenbezogenen Daten – die
Bereinigung erfolgt vor dem Schreiben. Siehe
[betriebsbeobachtung.md](betriebsbeobachtung.md).

---

## Datenbankfunktionen

Reine Logik gehört in die Anwendung; diese Funktionen stehen in der DB, weil
nur dort **Atomarität** über gleichzeitige Anfragen garantiert ist.

| Funktion | Migration | Zweck |
|---|---|---|
| `create_order_atomic(jsonb, jsonb)` | 0015 / 0024 / 0025 | Bestellung + Positionen + Elemente in einer Transaktion; seit 0024 mit optionalem `customer_id`, seit 0025 mit `terms_accepted_at`/`customer_vat_id` |
| `beanspruche_abschluss(uuid)` | 0020 | Claim auf Phase 2 (Rendering/PDF/Mails) atomar sichern, gegen doppelte Webhook-Zustellung |
| `gib_abschluss_frei(uuid)` | 0020 | Claim nach einem Fehlschlag zurücksetzen |
| `gib_haengende_abschluesse_frei(int)` | 0020 | verwaiste Claims (Absturz während Phase 2) nach Frist freigeben |
| `verfalle_offene_zahlungen(int)` | 0020 | `payment_status = 'pending'` nach Frist auf `'failed'` setzen |
| `pruefe_rate_limit(text, int, int)` | 0017 | atomar zählen und prüfen |
| `raeume_rate_limit_auf()` | 0017 | alte Fenster entfernen |
| `raeume_admin_sitzungen_auf()` | 0018 | abgelaufene Sitzungen entfernen |
| `ereignis_haeufungen(int)` | 0019 | Häufungen gegen den 7-Tage-Schnitt |
| `raeume_system_ereignisse_auf()` | 0019 | Ereignisse > 90 Tage entfernen |
| `loesche_alte_anfragen(int)` | 0022 | Anfragen (`order_type = 'inquiry'`) ohne Vertrag nach Frist hart löschen (DSGVO) |
| `anonymisiere_alte_bestellungen(int)` | 0022 | Bestellungen nach Ablauf der Aufbewahrungsfrist (§ 147 AO) anonymisieren (DSGVO) |
| `lege_kundenprofil_an()` | 0023 | Trigger auf `auth.users`: legt automatisch ein `customer_profiles`-Profil an |

Die Aufräum-, Verfalls- und Löschfunktionen laufen über die Cron-Route
(siehe [deployment.md](deployment.md)).

---

## Migrationshistorie

Fortlaufend nummeriert, lückenlos (geprüft durch `pruefeMigrationen.mjs`).
Jede gilt erst als angewendet, wenn sie über `applyMigration.mjs` mit
Trockenlauf ausgeführt **und** verifiziert wurde – siehe die Lehre aus 0011.

| # | Name | Kern |
|---|---|---|
| 0001 | init | Katalog, orders, order_items, configuration_elements, RLS |
| 0002 | orders_shipping_and_production | Versand- und Produktionsfelder |
| 0006 | supplier_order_lifecycle | supplier_orders + events |
| 0008 | orders_rls_hardening | RLS-Verschärfung |
| 0009 | order_cancellation_window | Stornofenster + order_events |
| 0010 | order_status_lifecycle | Statuslebenszyklus |
| **0011** | order_submission_hardening | `client_request_id` + Unique-Index (Idempotenz) |
| 0012 | payment_fields_provider_neutral | anbieterneutrale Zahlungsfelder |
| 0013 | order_items_total_price | gespeicherter Positionsgesamtpreis |
| **0014** | umsatzsteuer | Steuerfelder + Bestandsrückrechnung |
| **0015** | bestellung_atomar | `create_order_atomic` |
| 0016 | categories_rls | RLS für `categories` |
| **0017** | rate_limit | Zähler + Prüf-/Aufräumfunktionen |
| **0018** | admin_sitzungen | Sitzungstabelle |
| **0019** | system_ereignisse | Ereignistabelle + Häufungen |
| **0020** | zahlung_abschluss | Claim-Mechanik für Phase 2 (`beanspruche_abschluss`/`gib_abschluss_frei`) + Verfall offener Zahlungen |
| **0021** | rls_insert_haertung | **Sicherheitsfix**: öffentliche INSERT-Policies auf `orders`/`order_items`/`configuration_elements` entfernt (Policies **und** Grants); Nachzug von 0008, das nie angewendet worden war |
| **0022** | dsgvo_loeschung | DSGVO-Löschkonzept: `loesche_alte_anfragen`, `anonymisiere_alte_bestellungen` |
| **0023** | kundenkonto | Kundenkonto (additiv): `customer_profiles`, `customer_addresses`, `orders.customer_id` |
| **0024** | bestellung_kundenkonto_verknuepfung | `create_order_atomic` um `customer_id` ergänzt |
| **0025** | bestellung_agb_zeitstempel | `orders.terms_accepted_at` + `orders.customer_vat_id`; `create_order_atomic` entsprechend erweitert |

Lücken bei 0003–0005 und 0007 stammen aus der frühen Projektphase und sind in
0006/0008 zusammengeführt worden; `pruefeMigrationen.mjs` prüft ab dem
tatsächlichen Bestand auf Lückenlosigkeit und Doppelnummern.

---

## Prüfung des Schemas

```bash
node scripts/pruefeMigrationen.mjs   # Nummernfolge, Doppelnummern, Benennung
```

Der Live-Zustand (welche Tabellen, Funktionen, RLS-Flags tatsächlich
existieren) lässt sich jederzeit gegen die DB abfragen; die
[Go-live-Checkliste](go-live-checkliste.md) enthält ein solches
Verifikationsskript.
