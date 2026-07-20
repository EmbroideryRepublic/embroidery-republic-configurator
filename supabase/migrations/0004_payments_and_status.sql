-- ============================================================
-- Stripe-Zahlungsabwicklung + saubere Bestellstatus-Verwaltung (Phase 4).
-- ============================================================

-- --- Fulfillment-Status auf die tatsächlich genutzten Stufen reduzieren.
--     'in_review'/'confirmed' waren nie von Code referenziert. -----------
alter table orders drop constraint orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('new', 'in_production', 'shipped', 'completed', 'cancelled'));

-- --- Zahlungsstatus: bewusst eine von "status" komplett getrennte Spalte.
--     status='new' + payment_status='pending' ist kein Widerspruch,
--     sondern exakt "gerade angelegt, Stripe-Checkout noch nicht
--     abgeschlossen" - ein gemeinsames Feld könnte diesen Zustand nicht
--     eindeutig abbilden. --------------------------------------------------
alter table orders add column payment_status text not null default 'not_required'
  check (payment_status in ('not_required', 'pending', 'paid', 'failed'));
alter table orders add column stripe_checkout_session_id text;
alter table orders add column stripe_payment_intent_id text;
alter table orders add column paid_at timestamptz;

create unique index idx_orders_stripe_checkout_session_id
  on orders(stripe_checkout_session_id) where stripe_checkout_session_id is not null;

-- --- Lieferadresse: bisher nirgends persistiert, nur im transienten
--     In-Memory-OrderRecord (src/lib/actions/orders.ts). Wird gebraucht,
--     sobald Bestell-E-Mails fuer card/paypal erst im Stripe-Webhook
--     (eigener Prozessaufruf, Minuten spaeter) verschickt werden. ---------
alter table orders add column shipping_street text;
alter table orders add column shipping_zip text;
alter table orders add column shipping_city text;
alter table orders add column shipping_country text;

-- --- Fuer die Webhook-seitige Rekonstruktion des OrderRecord noetig -
--     bisher wurden beide Werte im Speicher gebraucht, aber nie
--     gespeichert. ---------------------------------------------------------
alter table order_items add column print_method text;
alter table configuration_elements add column file_name text;
