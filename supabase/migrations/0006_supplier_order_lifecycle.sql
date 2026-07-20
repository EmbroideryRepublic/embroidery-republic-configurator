-- ═══════════════════════════════════════════════════════════════════════
-- 0006: Produktionsreifer Lieferanten-Bestellablauf – Lebenszyklus + Audit
-- ═══════════════════════════════════════════════════════════════════════
-- Erweitert supplier_orders um Verarbeitungs-Metadaten (Versuche, Lock,
-- Fehler, Retry-Zeitpunkt) und ergänzt ein APPEND-ONLY Audit-Log, das jeden
-- Statuswechsel festhält – damit jederzeit nachvollziehbar ist, WO eine
-- Bestellung steht und WARUM sie ggf. abgebrochen/verschoben wurde.
--
-- Alles additiv: bestehende Zeilen bleiben gültig (Default-Werte), die
-- Status-Prüfung wird nur ERWEITERT (keine alten Werte entfernt).

-- ── Statusmenge erweitern (siehe src/lib/suppliers/lifecycle/status.ts) ──
alter table supplier_orders drop constraint supplier_orders_status_check;
alter table supplier_orders add constraint supplier_orders_status_check
  check (status in (
    'draft', 'queued', 'processing',
    'cart_prepared', 'ordered',
    'blocked', 'failed', 'cancelled'
  ));

-- ── Verarbeitungs-Metadaten ─────────────────────────────────────────────
alter table supplier_orders add column attempt_count  integer     not null default 0;
alter table supplier_orders add column max_attempts   integer     not null default 3;
-- Lock zur Verhinderung paralleler Verarbeitung derselben (Bestellung ×
-- Lieferant): gesetzt beim Start, geleert am Ende. locked_by = Prozess-/
-- Lauf-Kennung für die Diagnose verwaister Locks.
alter table supplier_orders add column locked_at      timestamptz;
alter table supplier_orders add column locked_by      text;
-- Letzte Fehlermeldung (Kurzfassung) für die Admin-Anzeige ohne last_run zu
-- durchsuchen.
alter table supplier_orders add column last_error     text;
-- Frühester Zeitpunkt des nächsten (Retry-)Versuchs; NULL = sofort/keiner.
alter table supplier_orders add column next_attempt_at timestamptz;

-- Schneller Zugriff des Processors auf „fällige" Jobs.
create index idx_supplier_orders_due
  on supplier_orders (status, next_attempt_at);

-- ── Append-only Audit-Log jedes Statuswechsels/Ereignisses ──────────────
create table supplier_order_events (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  supplier_id       text not null,
  at                timestamptz not null default now(),
  -- 'transition' (Statuswechsel), 'attempt' (Lauf gestartet), 'lock',
  -- 'unlock', 'error', 'note' – frei erweiterbar.
  event_type        text not null,
  from_status       text,
  to_status         text,
  -- Menschlich lesbarer Grund (z.B. "Retry 2/3 in 60s", "Warenkorb vorbereitet").
  reason            text,
  -- Strukturierte Zusatzdaten (Fehlerdetails, Selektionsmethode, Attempt-ID …).
  detail            jsonb,
  created_at        timestamptz not null default now()
);

create index idx_supplier_order_events_lookup
  on supplier_order_events (order_id, supplier_id, at desc);

-- Zugriff ausschließlich serverseitig über den Admin-Client (Service Role);
-- RLS aktiv, keine öffentlichen Policies (Default-Deny) – wie supplier_orders.
alter table supplier_order_events enable row level security;
