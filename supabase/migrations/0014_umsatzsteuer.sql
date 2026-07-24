-- ═══════════════════════════════════════════════════════════════════════
-- 0014 – UMSATZSTEUER
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bis hierher speicherte das System ausschließlich Bruttobeträge, ohne die
-- enthaltene Umsatzsteuer auszuweisen. Für Rechnungen, Stornierungen,
-- Auswertungen und die Buchhaltung reicht das nicht: Eine Rechnung muss
-- Nettobetrag, Steuersatz und Steuerbetrag getrennt zeigen.
--
-- ── Warum netto UND brutto gespeichert wird ───────────────────────────
-- Aus einem Bruttobetrag den Nettobetrag zurückzurechnen erzeugt bei mehreren
-- Positionen Rundungsdifferenzen: Die Summe der einzeln gerundeten
-- Nettobeträge stimmt nicht zwingend mit dem gerundeten Netto der Summe
-- überein. Beide Werte festzuhalten macht jede Rechnung reproduzierbar.
--
-- ── Warum der Satz je Bestellung UND je Position gespeichert wird ─────
-- Der Satz zum KAUFZEITPUNKT. Ändert der Gesetzgeber ihn, dürfen alte
-- Bestellungen sich nicht rückwirkend verändern – eine Stornierung von 2026
-- muss 2028 noch denselben Betrag ergeben. Je Position zusätzlich, damit
-- gemischte Sätze (Regel- und ermäßigter Satz in einer Bestellung) später
-- ohne Schemaänderung möglich sind.
--
-- ── Rückwärtskompatibel ───────────────────────────────────────────────
-- Alle Spalten sind NULL-fähig bzw. haben Vorgabewerte. Bestehender Code
-- läuft unverändert weiter.

-- ── orders ────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists tax_rate numeric(5,2),
  add column if not exists tax_amount numeric(10,2),
  add column if not exists net_total numeric(10,2),
  add column if not exists prices_include_tax boolean not null default true;

comment on column public.orders.tax_rate is
  'Umsatzsteuersatz in Prozent zum Kaufzeitpunkt. Spätere Gesetzesänderungen berühren diesen Wert nicht.';
comment on column public.orders.tax_amount is
  'Ausgewiesener Umsatzsteuerbetrag der gesamten Bestellung.';
comment on column public.orders.net_total is
  'Nettosumme. total_price minus tax_amount – gespeichert statt gerechnet, um Rundungsdifferenzen zu vermeiden.';
comment on column public.orders.prices_include_tax is
  'true = die gespeicherten Preise sind Bruttopreise, die Steuer ist enthalten und wird nur ausgewiesen.';

-- Ein Steuersatz ist ein Prozentwert zwischen 0 und 100.
alter table public.orders
  drop constraint if exists orders_tax_rate_check;
alter table public.orders
  add constraint orders_tax_rate_check
  check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100));

-- Netto und Steuer müssen zusammen den Bruttobetrag ergeben. Ein Cent
-- Toleranz für Rundung. Greift nur, wenn beide Werte gesetzt sind.
alter table public.orders
  drop constraint if exists orders_tax_sum_check;
alter table public.orders
  add constraint orders_tax_sum_check
  check (
    net_total is null or tax_amount is null
    or abs((net_total + tax_amount) - total_price) <= 0.01
  );

-- ── order_items ───────────────────────────────────────────────────────

alter table public.order_items
  add column if not exists tax_rate numeric(5,2),
  add column if not exists net_total_price numeric(10,2);

comment on column public.order_items.tax_rate is
  'Steuersatz dieser Position zum Kaufzeitpunkt. Ermöglicht gemischte Sätze ohne Schemaänderung.';
comment on column public.order_items.net_total_price is
  'Nettobetrag der Position. Gegenstück zum bereits vorhandenen total_price (brutto).';

alter table public.order_items
  drop constraint if exists order_items_tax_rate_check;
alter table public.order_items
  add constraint order_items_tax_rate_check
  check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100));

-- ── Bestandsdaten ─────────────────────────────────────────────────────
--
-- Die vorhandenen Bestellungen entstanden unter `pricesIncludeTax: true` bei
-- einem Regelsteuersatz von 19 %. Die Werte werden aus dem gespeicherten
-- BRUTTObetrag zurückgerechnet.
--
-- Das ist eine Ableitung, keine Erhebung: Zum Kaufzeitpunkt wurde keine
-- Steuer erfasst. Deshalb wird jede betroffene Bestellung zusätzlich in
-- order_events vermerkt – Festlegung des Betreibers vom 2026-07-22, damit
-- Auswertungen keinen Sonderfall kennen müssen und die Herkunft trotzdem
-- nachvollziehbar bleibt.

update public.orders
set
  tax_rate = 19.00,
  tax_amount = round(total_price - (total_price / 1.19), 2),
  net_total = round(total_price / 1.19, 2),
  prices_include_tax = true
where tax_rate is null;

update public.order_items
set
  tax_rate = 19.00,
  net_total_price = round(total_price / 1.19, 2)
where tax_rate is null;

-- Nachweis je betroffener Bestellung.
insert into public.order_events (order_id, event_type, reason, detail)
select
  o.id,
  'tax_backfilled',
  'Umsatzsteuer nachtraeglich aus dem Bruttobetrag abgeleitet (Migration 0014)',
  jsonb_build_object(
    'migration', '0014_umsatzsteuer',
    'satz_prozent', 19.00,
    'grundlage', 'brutto',
    'brutto', o.total_price,
    'netto', o.net_total,
    'steuer', o.tax_amount,
    'hinweis',
      'Nachtraeglich aus dem gespeicherten Bruttobetrag abgeleitet. Zum Kaufzeitpunkt wurde keine Umsatzsteuer erfasst.'
  )
from public.orders o
where o.tax_rate = 19.00
  and not exists (
    select 1 from public.order_events e
    where e.order_id = o.id and e.event_type = 'tax_backfilled'
  );
