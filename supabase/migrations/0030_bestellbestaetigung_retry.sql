-- ═══════════════════════════════════════════════════════════════════════
-- 0030 – BESTELLBESTÄTIGUNG: EIGENSTÄNDIGE NACHVERFOLGBARKEIT + RETRY
-- ═══════════════════════════════════════════════════════════════════════
--
-- Hintergrund: Eine echte Produktionsbestellung (2026-08-21, Stripe-Zahlung,
-- ER-2026-A4E747) wurde korrekt angelegt und bezahlt, die Kundschaft erhielt
-- aber NIE die Bestellbestätigung -- Resend lehnte den Versand ab
-- (order_events zeigt zwei email_failed-Einträge, order_confirmation UND
-- internal_order_notification, beide "vom Versanddienst abgelehnt"). Es gab
-- keinen automatischen Wiederholungsversuch: sendEmail() ist bewusst
-- "best effort, nie fatal" (siehe Kopfkommentar dort), aber ohne einen
-- Nachhol-Mechanismus bedeutet ein Fehlschlag beim ersten Versuch "für immer
-- verloren", bis jemand manuell eingreift.
--
-- Zusätzlich deckte die Untersuchung eine zweite, unabhängige Lücke auf: Die
-- bisherige Idempotenzprüfung in verarbeiteBestelleingang() (orderIntake.ts)
-- hing AUSSCHLIESSLICH an internal_notification_email_id (der INTERNEN
-- Meldung) -- schlägt nur die KUNDEN-Bestätigung fehl, während die interne
-- Meldung durchkommt, hätte ein Retry die ganze Funktion als "bereits
-- erledigt" übersprungen und der Kundschaft dauerhaft keine Bestätigung mehr
-- zugestellt. Die Bestellbestätigung braucht deshalb ihren EIGENEN,
-- unabhängigen Erfolgsnachweis -- exakt dasselbe Prinzip wie paid_at/
-- shipped_at/refunded_at an anderer Stelle dieser Tabelle.
--
-- ── Muster ──────────────────────────────────────────────────────────────
-- Identisch zu Migration 0026 (Rechnung/Versandlabel) und 0029 (Erstattung):
-- additive Spalten, ein atomarer Claim gegen Doppelversand, ein Reaper gegen
-- einen verwaisten Anspruch nach einem Absturz mitten im Versuch.

alter table public.orders
  add column if not exists order_confirmation_sent_at timestamptz,
  add column if not exists order_confirmation_versuch_gestartet_am timestamptz;

comment on column public.orders.order_confirmation_sent_at is
  'Zeitpunkt, an dem die Bestellbestaetigung NACHWEISLICH erfolgreich an die '
  'Kundschaft zugestellt wurde (sendEmail() lieferte success:true). Der '
  'ALLEINIGE Erfolgsnachweis fuer DIESE eine E-Mail -- unabhaengig von '
  'internal_notification_email_id, das ausschliesslich die interne, '
  'stornierbare Meldung betrifft.';
comment on column public.orders.order_confirmation_versuch_gestartet_am is
  'Claim-Zeitstempel gegen einen doppelten gleichzeitigen Versandversuch '
  '(Erstversuch und Cron-Retry, oder zwei parallele Retry-Laeufe). Gleiches '
  'Prinzip wie abschluss_gestartet_am/rechnung_erstellung_gestartet_am.';

-- ── Claim-Funktionen ────────────────────────────────────────────────────

create or replace function public.beanspruche_bestellbestaetigung(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set order_confirmation_versuch_gestartet_am = now()
  where id = p_order_id
    and order_type = 'order'
    and order_confirmation_sent_at is null
    and order_confirmation_versuch_gestartet_am is null
  returning id;
$$;

create or replace function public.gib_bestellbestaetigung_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set order_confirmation_versuch_gestartet_am = null
  where id = p_order_id and order_confirmation_sent_at is null;
$$;

create or replace function public.gib_haengende_bestellbestaetigungen_frei(p_minuten integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set order_confirmation_versuch_gestartet_am = null
  where order_confirmation_sent_at is null
    and order_confirmation_versuch_gestartet_am is not null
    and order_confirmation_versuch_gestartet_am < now() - make_interval(mins => p_minuten);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke all on function public.beanspruche_bestellbestaetigung(uuid) from public, anon, authenticated;
revoke all on function public.gib_bestellbestaetigung_frei(uuid) from public, anon, authenticated;
revoke all on function public.gib_haengende_bestellbestaetigungen_frei(integer) from public, anon, authenticated;
