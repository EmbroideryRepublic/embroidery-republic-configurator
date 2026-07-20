-- ═══════════════════════════════════════════════════════════════════════
-- 0005: Lieferanten-Bestellungen (Supplier Engine, src/lib/suppliers/)
-- ═══════════════════════════════════════════════════════════════════════
-- Eine Zeile je (Bestellung × Lieferant): der von createSupplierOrder()
-- erzeugte Positions-Snapshot plus Statusverfolgung der Automatisierung.
-- Bewusst ein jsonb-Snapshot statt normalisierter Positions-Tabellen:
--  - der Playwright-Worker bekommt exakt dieses Objekt übergeben – was
--    gespeichert ist, ist garantiert das, was ausgeführt wurde (Audit),
--  - Katalogänderungen NACH der Job-Erzeugung verändern einen bereits
--    erzeugten Job nicht rückwirkend.
-- Zugriff ausschließlich serverseitig über den Admin-Client (Service
-- Role) – daher RLS aktiv ohne öffentliche Policies (Default-Deny), wie
-- bei den Produktions-Spalten aus Migration 0002.

create table supplier_orders (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  -- Text statt Enum: die SupplierId-Union lebt in TypeScript
  -- (src/lib/suppliers/types.ts); neue Lieferanten sollen keinen
  -- DB-Eingriff erfordern.
  supplier_id   text not null,
  status        text not null default 'draft'
                check (status in ('draft', 'cart_prepared', 'ordered', 'failed')),
  -- 'prepare-cart' (Standard: Worker füllt nur den Warenkorb) oder
  -- 'checkout' (Worker schließt die Bestellung ab).
  mode          text not null default 'prepare-cart'
                check (mode in ('prepare-cart', 'checkout')),
  -- SupplierOrderPosition[] (siehe src/lib/suppliers/types.ts)
  positions     jsonb not null,
  -- UnresolvedSupplierPosition[]: Positionen ohne Bezugsquelle – werden
  -- dem Admin angezeigt, statt still zu fehlen.
  unresolved    jsonb not null default '[]'::jsonb,
  -- Schrittprotokoll des letzten Worker-Laufs (SupplierWorkerRunResult).
  last_run      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Ein Draft je (Bestellung × Lieferant) – erneutes createSupplierOrder()
-- aktualisiert den bestehenden Snapshot (Upsert), statt Duplikate zu
-- erzeugen.
alter table supplier_orders
  add constraint supplier_orders_order_supplier_unique unique (order_id, supplier_id);

alter table supplier_orders enable row level security;
