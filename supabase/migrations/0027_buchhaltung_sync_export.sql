-- ═══════════════════════════════════════════════════════════════════════
-- 0027 – EXPORT-CURSOR FÜR DIE BUCHHALTUNGS-SYNCHRONISIERUNG
-- ═══════════════════════════════════════════════════════════════════════
--
-- Rein additiv, reine Schema-Vorbereitung für die neue lokale
-- Buchhaltungs-Anwendung (Schritt 6 dort), die Bestellungen über
-- GET /api/accounting/v1/orders pull-synchronisiert. Ändert nichts an der
-- bestehenden Lexware-/DHL-/Claim-Logik aus 0026 – nur zwei zusätzliche
-- Schreibzugriffe in orderCompletion.ts (siehe dort), keine geänderte
-- Bedingung in irgendeiner Claim-/Freigabe-Funktion.
--
-- ── Warum kein Cursor auf `created_at` ────────────────────────────────
-- `orders` hat keine generische `updated_at`-Spalte (geprüft: einzige
-- Treffer für `updated_at` in allen Migrationen betreffen `customer_profiles`/
-- `customer_addresses` (0023) und `supplier_orders` (0005), nicht `orders`).
-- `created_at` korreliert nicht mit dem Zeitpunkt, an dem eine Bestellung
-- buchhaltungsreif wird: eine Kartenzahlung kann von `pending` zu `paid`
-- wechseln, Minuten oder Stunden nach der Bestellung; die Lexware-Rechnung
-- entsteht erst danach. Ein Cursor auf `created_at` würde eine solche
-- Bestellung nach Ablauf des Synchronisierungsfensters dauerhaft übersehen.
--
-- ── invoice_date ────────────────────────────────────────────────────────
-- Das an Lexware übergebene Rechnungsdatum (`auftrag.rechnungsdatum` in
-- orderCompletion.ts) wurde bisher nur für die Bestätigungs-E-Mail
-- verwendet, nie persistiert. Die Buchhaltungs-Synchronisierung braucht ein
-- echtes Belegdatum für die lokal übernommene Rechnung, kein Approximat aus
-- dem Abrufzeitpunkt.
--
-- ── accounting_ready_at ───────────────────────────────────────────────
-- Gesetzt im selben Schritt wie `invoice_pdf_url` (orderCompletion.ts) –
-- der frühestmögliche Zeitpunkt, an dem eine Bestellung sowohl
-- Rechnungsnummer als auch PDF hat und damit vollständig für den Export
-- ist. `(accounting_ready_at, id)` zusammen ist ein stabiler, monoton
-- wachsender Paginierungsschlüssel für den neuen Endpunkt.

alter table public.orders
  add column if not exists invoice_date date,
  add column if not exists accounting_ready_at timestamptz;

comment on column public.orders.invoice_date is
  'Rechnungsdatum, wie es an Lexware übergeben wurde (auftrag.rechnungsdatum in '
  'orderCompletion.ts). Bisher nirgends persistiert – wird für die Buchhaltungs-'
  'Synchronisierung (Schritt 6, embroidery-republic-buchhaltung) gebraucht, da '
  'dort ein echtes Belegdatum benötigt wird, kein Approximat.';
comment on column public.orders.accounting_ready_at is
  'Zeitpunkt, ab dem diese Bestellung für die Buchhaltungs-Synchronisierung '
  'vollständig ist (invoice_number UND invoice_pdf_url gesetzt). Dient als '
  'monotoner Cursor für GET /api/accounting/v1/orders, weil orders keine '
  'generische updated_at-Spalte hat und created_at nicht mit dem Zeitpunkt '
  'korreliert, an dem eine Bestellung buchhaltungsreif wird.';

create index if not exists idx_orders_accounting_ready_at
  on public.orders (accounting_ready_at, id)
  where accounting_ready_at is not null;
