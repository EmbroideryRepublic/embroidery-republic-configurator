-- ═══════════════════════════════════════════════════════════════════════
-- 0020 – ZAHLUNGSABSCHLUSS UND VERFALL
-- ═══════════════════════════════════════════════════════════════════════
--
-- Vorbereitung der Stripe-Integration. Zwei Bausteine, beide ohne
-- Zugangsdaten nutzbar und gegen den Testanbieter prüfbar.
--
-- ── Warum eine eigene Claim-Spalte ────────────────────────────────────
-- Phase 2 (Rendering, Produktionsblatt, Bestätigungsmail) läuft künftig im
-- Zahlungs-Webhook. Stripe erwartet dort binnen ~20 Sekunden eine Antwort;
-- Rendering und PDF können länger dauern. Bei Zeitüberschreitung stellt
-- Stripe erneut zu – und die erneute Zustellung muss Phase 2 abschließen
-- können, OHNE eine zweite Bestätigungsmail auszulösen.
--
-- `payment_status` allein genügt dafür nicht: Nach der ersten Zustellung
-- steht er auf 'paid', die Idempotenzbedingung `WHERE payment_status =
-- 'pending'` würde die erneute Zustellung komplett überspringen – auch den
-- noch ausstehenden Abschluss. Deshalb ein SEPARATER Marker allein für
-- Phase 2:
--
--   abschluss_gestartet_am IS NULL   → Phase 2 noch nicht in Arbeit
--   gesetzt, pdf_url IS NULL         → in Arbeit oder abgebrochen
--   pdf_url gesetzt                  → fertig (pdf_url ist das Ergebnis)
--
-- Die beiden bestehenden Zeitspalten scheiden aus: production_started_at
-- gehört zum Status 'in_production', completed_at zum Status 'completed'.

alter table public.orders
  add column if not exists abschluss_gestartet_am timestamptz;

comment on column public.orders.abschluss_gestartet_am is
  'Anspruch (Claim) auf Phase 2 (Rendering/Produktionsblatt/Mails). Verhindert, '
  'dass zwei gleichzeitig zugestellte Webhooks den Abschluss doppelt ausfuehren. '
  'Wird bei einem Fehler zurueckgesetzt, damit ein spaeterer Versuch greift.';

/**
 * Beansprucht Phase 2 für genau einen Ausführer.
 *
 * Setzt den Claim NUR, wenn die Bestellung bezahlt ist, Phase 2 noch nicht
 * läuft und noch nicht fertig ist. Gibt die betroffene Zeile zurück – genau
 * dann darf der Aufrufer Phase 2 ausführen. Zwei gleichzeitige Webhooks:
 * einer bekommt die Zeile, der andere nichts.
 */
create or replace function public.beanspruche_abschluss(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set abschluss_gestartet_am = now()
  where id = p_order_id
    and payment_status = 'paid'
    and pdf_url is null
    and abschluss_gestartet_am is null
  returning id;
$$;

/** Gibt den Anspruch nach einem Fehlschlag wieder frei. */
create or replace function public.gib_abschluss_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set abschluss_gestartet_am = null
  where id = p_order_id and pdf_url is null;
$$;

/**
 * Findet bezahlte Bestellungen, deren Phase 2 hängengeblieben ist.
 *
 * Der Wiederherstellungspfad für den seltenen Fall, dass der Ausführer
 * mitten in Phase 2 abstürzt (harter Prozessabbruch, kein Catch möglich):
 * Der Claim bleibt gesetzt, pdf_url leer. Nach der Frist gilt der Claim als
 * verwaist und wird freigegeben, damit ein neuer Lauf ihn übernehmen kann.
 * Aufgerufen von der Cron-Route.
 */
create or replace function public.gib_haengende_abschluesse_frei(p_minuten integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set abschluss_gestartet_am = null
  where payment_status = 'paid'
    and pdf_url is null
    and abschluss_gestartet_am is not null
    and abschluss_gestartet_am < now() - make_interval(mins => p_minuten);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

/**
 * Lässt offene Zahlungen nach einer Frist verfallen.
 *
 * Eine 'pending'-Bestellung bliebe sonst unbegrenzt offen: bezahlt vielleicht
 * nie, aber auch nie abgeschlossen. Nach der Frist gilt der Bezahlvorgang als
 * gescheitert. Eine dennoch später eintreffende Zahlung wird von Stripe über
 * Tage erneut zugestellt und über den regulären Webhook-Weg verarbeitet –
 * dieser Verfall verhindert nur, dass die Bestellung ewig im Ungewissen
 * hängt. Aufgerufen von der Cron-Route.
 */
create or replace function public.verfalle_offene_zahlungen(p_stunden integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set payment_status = 'failed'
  where payment_status = 'pending'
    and payment_started_at is not null
    and payment_started_at < now() - make_interval(hours => p_stunden);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke all on function public.beanspruche_abschluss(uuid) from public, anon, authenticated;
revoke all on function public.gib_abschluss_frei(uuid) from public, anon, authenticated;
revoke all on function public.gib_haengende_abschluesse_frei(integer) from public, anon, authenticated;
revoke all on function public.verfalle_offene_zahlungen(integer) from public, anon, authenticated;
