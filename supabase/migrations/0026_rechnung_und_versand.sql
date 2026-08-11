-- ═══════════════════════════════════════════════════════════════════════
-- 0026 – RECHNUNGSERSTELLUNG (LEXWARE) UND VERSANDLABEL (DHL)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Zwei unabhängige, additive Erweiterungen in einer Migration, weil beide
-- reine Schema-Vorbereitung für noch zu bauenden Code sind (wie 0020 vor der
-- Stripe-Anbindung) und keine voneinander abhängt.
--
-- ── Rechnung ────────────────────────────────────────────────────────────
-- Die Rechnungsnummer wird NICHT hier vergeben, sondern von Lexware beim
-- Erstellen des Belegs (siehe lib/invoicing/). Diese Spalten speichern nur,
-- was Lexware zurückliefert. `invoice_number` dient zugleich als "fertig"-
-- Marker, exakt wie `pdf_url` das bei Phase 2 schon tut (siehe 0020).
--
-- ── Versand ─────────────────────────────────────────────────────────────
-- Keine neue Spalte für die Sendungsnummer – `tracking_number` (0002)
-- existiert bereits und wird direkt mit der von DHL vergebenen `shipmentNo`
-- befüllt; `carrier` (0002, bislang nie beschrieben) bekommt hier seinen
-- ersten echten Schreiber. Bewusst KEIN eigenes shipping_status-Feld: "hat
-- ein Label" ist orthogonal zum Erfüllungsstatus (status), genau wie
-- payment_status es schon ist – tracking_number IS NOT NULL ist der
-- Sentinel "Label existiert", der bestehende Übergang setzeBestellstatus(
-- 'shipped', {trackingNummer}) bleibt weiterhin die einzige Quelle für
-- "tatsächlich verschickt".
--
-- ── Claim-Muster ────────────────────────────────────────────────────────
-- Beide externen APIs (Lexware, DHL) bieten KEINE eigene Idempotenz für
-- "lege das genau einmal an" – anders als Stripe/PayPal, die einen
-- Idempotenzschlüssel je Aufruf akzeptieren. Der Schutz gegen doppelte
-- Rechnungs-/Label-Erstellung muss deshalb vollständig hier in der
-- Datenbank stehen: dieselbe atomare "UPDATE ... WHERE Claim IS NULL AND
-- NICHT fertig RETURNING id"-Form wie beanspruche_abschluss (0020), inkl.
-- Reaper-Funktion für den Absturz-mitten-in-Arbeit-Fall.

alter table public.orders
  add column if not exists invoice_id text,
  add column if not exists invoice_number text,
  add column if not exists invoice_pdf_url text,
  add column if not exists rechnung_erstellung_gestartet_am timestamptz,
  add column if not exists dhl_label_url text,
  add column if not exists label_erstellung_gestartet_am timestamptz;

comment on column public.orders.invoice_id is
  'Lexware-Beleg-ID (UUID), fuer spaetere GET /v1/invoices/{id} oder /file-Aufrufe.';
comment on column public.orders.invoice_number is
  'Von Lexware beim Erstellen vergebene fortlaufende Rechnungsnummer. '
  'Dient zugleich als Fertig-Marker fuer den Erstellungs-Claim unten.';
comment on column public.orders.invoice_pdf_url is
  'Storage-Pfad (nicht URL) zum von Lexware gerenderten Rechnungs-PDF, '
  'gleicher Bucket wie orders.pdf_url (Produktionsblatt).';
comment on column public.orders.rechnung_erstellung_gestartet_am is
  'Anspruch (Claim) auf die Rechnungserstellung. Verhindert, dass zwei '
  'gleichzeitige Laeufe (z.B. erneut zugestellter Zahlungs-Webhook) '
  'doppelt bei Lexware anlegen. Wird bei einem Fehler zurueckgesetzt.';
comment on column public.orders.dhl_label_url is
  'Storage-Pfad zur eigenen Kopie des DHL-Label-PDFs. DHLs eigene '
  'Label-URL kann verfallen, unsere gespeicherte Kopie nicht.';
comment on column public.orders.label_erstellung_gestartet_am is
  'Anspruch (Claim) auf die Versandlabel-Erstellung, gleiches Prinzip wie '
  'rechnung_erstellung_gestartet_am. DHL bietet keinen eigenen '
  'Idempotenzschluessel fuer die Label-Erstellung.';

-- ── Rechnung: Claim-Funktionen ───────────────────────────────────────────

/**
 * Beansprucht die Rechnungserstellung für genau einen Ausführer.
 *
 * Gilt für Rechnungskauf UND vorab bezahlte Bestellungen gleichermaßen
 * (payment_status 'paid' oder 'not_required') – Lexware wird das führende
 * Rechnungssystem für jede verbindliche Bestellung, nicht nur für neu
 * hinzukommende Zahlarten. Anfragen (order_type 'inquiry') sind über die
 * erste Bedingung ausgeschlossen.
 */
create or replace function public.beanspruche_rechnungserstellung(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set rechnung_erstellung_gestartet_am = now()
  where id = p_order_id
    and order_type = 'order'
    and payment_status in ('paid', 'not_required')
    and invoice_number is null
    and rechnung_erstellung_gestartet_am is null
  returning id;
$$;

/** Gibt den Anspruch nach einem Fehlschlag wieder frei. */
create or replace function public.gib_rechnungserstellung_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set rechnung_erstellung_gestartet_am = null
  where id = p_order_id and invoice_number is null;
$$;

/**
 * Findet Bestellungen, deren Rechnungserstellung hängengeblieben ist
 * (harter Absturz mitten in der Bearbeitung, kein Catch möglich). Aufgerufen
 * von der Cron-Route, gleiches Prinzip wie gib_haengende_abschluesse_frei.
 */
create or replace function public.gib_haengende_rechnungserstellung_frei(p_minuten integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set rechnung_erstellung_gestartet_am = null
  where invoice_number is null
    and rechnung_erstellung_gestartet_am is not null
    and rechnung_erstellung_gestartet_am < now() - make_interval(mins => p_minuten);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

-- ── Versand: Claim-Funktionen ────────────────────────────────────────────

/**
 * Beansprucht die Versandlabel-Erstellung für genau einen Ausführer.
 *
 * Nur möglich, wenn eine Lieferadresse vorliegt und noch kein Label
 * existiert (tracking_number IS NULL) – ein zweiter Klick auf "Label
 * erstellen" oder eine Wiederholung derselben Admin-Anfrage trifft danach
 * ins Leere statt ein zweites DHL-Label zu erzeugen.
 */
create or replace function public.beanspruche_versandlabel(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set label_erstellung_gestartet_am = now()
  where id = p_order_id
    and status <> 'cancelled'
    and payment_status in ('paid', 'not_required')
    and shipping_street is not null
    and tracking_number is null
    and label_erstellung_gestartet_am is null
  returning id;
$$;

/** Gibt den Anspruch nach einem Fehlschlag wieder frei. */
create or replace function public.gib_versandlabel_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set label_erstellung_gestartet_am = null
  where id = p_order_id and tracking_number is null;
$$;

/** Findet hängengebliebene Label-Erstellungen. Aufgerufen von der Cron-Route. */
create or replace function public.gib_haengende_versandlabel_frei(p_minuten integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set label_erstellung_gestartet_am = null
  where tracking_number is null
    and label_erstellung_gestartet_am is not null
    and label_erstellung_gestartet_am < now() - make_interval(mins => p_minuten);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke all on function public.beanspruche_rechnungserstellung(uuid) from public, anon, authenticated;
revoke all on function public.gib_rechnungserstellung_frei(uuid) from public, anon, authenticated;
revoke all on function public.gib_haengende_rechnungserstellung_frei(integer) from public, anon, authenticated;
revoke all on function public.beanspruche_versandlabel(uuid) from public, anon, authenticated;
revoke all on function public.gib_versandlabel_frei(uuid) from public, anon, authenticated;
revoke all on function public.gib_haengende_versandlabel_frei(integer) from public, anon, authenticated;
