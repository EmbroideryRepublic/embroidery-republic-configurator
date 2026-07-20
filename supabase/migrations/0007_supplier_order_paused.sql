-- ═══════════════════════════════════════════════════════════════════════
-- 0007: Admin-Pause für Lieferantenbestellungen
-- ═══════════════════════════════════════════════════════════════════════
-- Ergänzt den Status 'paused' (bewusster Admin-Halt, wieder aufnehmbar) –
-- additiv, bestehende Werte bleiben gültig. Siehe
-- src/lib/suppliers/lifecycle/status.ts.

alter table supplier_orders drop constraint supplier_orders_status_check;
alter table supplier_orders add constraint supplier_orders_status_check
  check (status in (
    'draft', 'queued', 'processing',
    'cart_prepared', 'ordered',
    'blocked', 'paused', 'failed', 'cancelled'
  ));
