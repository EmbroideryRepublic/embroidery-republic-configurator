-- ═══════════════════════════════════════════════════════════════════════
-- Bestellstatus: Datenbank und Anwendungstyp in Übereinstimmung bringen
-- ═══════════════════════════════════════════════════════════════════════
--
-- BEFUND: Das bisherige Constraint erlaubte
--   ('new', 'in_review', 'confirmed', 'in_production', 'completed', 'cancelled')
-- Der Anwendungstyp OrderStatus lautet dagegen
--   'new' | 'in_production' | 'shipped' | 'completed' | 'cancelled'
--
-- Daraus folgten zwei Probleme:
--   1. 'shipped' hätte das Constraint VERLETZT – der Versandstatus war
--      technisch nicht setzbar, obwohl der Code ihn kennt.
--   2. 'in_review' und 'confirmed' existierten nur in der Datenbank und
--      wurden von keiner Zeile Anwendungscode je gesetzt oder gelesen.
--
-- Diese Migration übernimmt die Anwendungssicht als führend. Bestehende
-- Zeilen mit den beiden verwaisten Werten werden vorher überführt, damit
-- das neue Constraint greifen kann.

-- Verwaiste Werte überführen. 'in_review' und 'confirmed' beschrieben beide
-- den Zustand „liegt vor, noch nicht in Produktion" – das ist 'new'.
update public.orders set status = 'new' where status in ('in_review', 'confirmed');

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'in_production', 'shipped', 'completed', 'cancelled'));

-- ── Zeitstempel je Statuswechsel ──────────────────────────────────────
-- Bewusst eigene Spalten statt einer Ableitung aus order_events: Die
-- Historie ist Nachweis und darf lückenhaft sein (sie wird nicht-fatal
-- geschrieben). Versand- und Abschlussdatum gehören dagegen zum
-- Bestellzustand selbst und müssen verlässlich sein.
alter table public.orders
  add column if not exists production_started_at timestamptz,
  add column if not exists shipped_at            timestamptz,
  add column if not exists completed_at          timestamptz;

-- Sendungsnummer des Versanddienstleisters. Frei text, weil je Dienstleister
-- unterschiedlich aufgebaut; die Zuordnung zum Dienstleister ergibt sich aus
-- der Versandart und wird hier nicht dupliziert.
alter table public.orders
  add column if not exists tracking_number text;

-- Bestellungen nach Status filtern ist die häufigste Admin-Abfrage.
create index if not exists orders_status_idx on public.orders (status, created_at desc);

comment on column public.orders.production_started_at is
  'Zeitpunkt des Übergangs new -> in_production.';
comment on column public.orders.shipped_at is
  'Zeitpunkt des Übergangs in_production -> shipped.';
comment on column public.orders.completed_at is
  'Zeitpunkt des Übergangs shipped -> completed.';
comment on column public.orders.tracking_number is
  'Sendungsnummer, optional beim Übergang nach shipped erfasst.';
