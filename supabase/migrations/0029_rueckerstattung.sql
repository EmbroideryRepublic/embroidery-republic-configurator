-- ═══════════════════════════════════════════════════════════════════════
-- 0029 – RÜCKERSTATTUNG (STRIPE/PAYPAL) BEI STORNIERTEN, BEZAHLTEN BESTELLUNGEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- Hintergrund: Weder die Kunden-Selbststornierung (storniereBestellungDurchKunden)
-- noch die Admin-Kulanzstornierung (setzeBestellstatus) prüften bislang den
-- Zahlungsstatus. Eine bereits bezahlte Bestellung konnte dadurch storniert
-- werden, ohne dass irgendwo vermerkt wurde, dass eine Rückerstattung
-- aussteht -- und `orderVisibility.ts` blendet stornierte Bestellungen im
-- Adminbereich vollständig aus (`status === 'cancelled' -> false`), wodurch
-- der Fall komplett aus dem Blick geriet.
--
-- ── Nur volle Erstattung, kein Teilbetrag ─────────────────────────────────
-- Die Selbststornierung kennt nur "ganz oder gar nicht" -- es gibt keinen
-- Teilstorno. refund_amount_cent wird deshalb immer mit orders.total_price
-- befüllt, nie mit einem frei eingegebenen Betrag (siehe refundService.ts).
--
-- ── Warum HIER kein "unklarer Zustand"-Flag wie bei Rechnung/Label (0026) ──
-- Lexware und DHL bieten KEINE eigene Idempotenz -- ein blinder Retry nach
-- einem Absturz zwischen erfolgreichem Aufruf und Persistierung hätte dort
-- eine zweite, echte Rechnung/Sendung erzeugt. Deshalb brauchen sie das
-- dauerhafte, nur manuell rücksetzbare *_unklarer_zustand-Flag.
--
-- Stripe UND PayPal akzeptieren dagegen beide einen Idempotenzschlüssel je
-- Erstattungsaufruf (Stripe: `idempotencyKey`-Option, bereits für
-- eroeffne() genutzt; PayPal: Header `PayPal-Request-Id`, ebenfalls bereits
-- genutzt). refundService.ts verwendet dafür einen STABILEN, NIE wechselnden
-- Schlüssel (`refund-${orderId}`) -- anders als bei der Zahlungseröffnung,
-- wo bewusst JEDER Versuch einen neuen Schlüssel bekommt. Ruft die Anwendung
-- nach einem Absturz denselben Refund-Endpunkt mit demselben Schlüssel
-- erneut auf, liefert der Anbieter das Ergebnis des ursprünglichen Aufrufs
-- zurück, statt ein zweites Mal echtes Geld zu bewegen -- unabhängig davon,
-- ob die erste Antwort bei uns je ankam. Ein einfacher Zeitstempel-Reaper
-- (wie bei Rechnung/Label) genügt deshalb hier bereits als sicherer
-- Mechanismus; die zusätzliche, nur manuell lösbare Dauersperre ist nicht
-- nötig.
--
-- PRÄZISIERUNG (Review vom 2026-08-20): Der Idempotenzschlüssel selbst ist
-- NICHT unbegrenzt gültig -- Stripe hält ihn laut eigener Dokumentation ca.
-- 24 Stunden vor, PayPals PayPal-Request-Id ein ähnlich begrenztes Fenster.
-- Bleibt ein Anspruch länger als dieses Fenster hängen (z.B. weil der externe
-- Cron-Aufrufer selbst länger als 24h ausfällt) und wird DANACH erneut
-- versucht, behandelt der Anbieter den Aufruf als NEUEN Request -- der
-- Schlüssel schützt dann nicht mehr. Die Sicherheit gegen eine zweite ECHTE
-- Erstattung kommt in diesem Randfall stattdessen von einer zweiten,
-- unabhängigen Ebene: Weder Stripe noch PayPal erstatten eine Charge/Capture
-- ein zweites Mal, die bereits vollständig erstattet ist (unser System kennt
-- ohnehin keine Teilerstattung) -- der Anbieter lehnt den zweiten Aufruf mit
-- einem eigenen Fehler ab. `stelleErstattungSicher()` (refundService.ts)
-- wertet diesen Fehler wie jeden anderen Anbieter-Fehlschlag und setzt
-- refund_status auf 'failed' -- finanziell ungefährlich, aber der Datensatz
-- zeigt dann fälschlich "fehlgeschlagen" statt "erstattet", bis das manuell
-- richtiggestellt wird. Innerhalb des üblichen Zeitfensters (Cron läuft alle
-- paar Minuten) ist dieser Randfall praktisch ausgeschlossen.
--
-- ── Sichtbarkeit im Adminbereich ───────────────────────────────────────────
-- orderVisibility.ts wird in derselben Umsetzung (nicht Teil dieser
-- Migration) um eine Ausnahme ergänzt: eine stornierte Bestellung bleibt
-- sichtbar, solange refund_status NICHT 'refunded' oder 'not_applicable'
-- ist -- also während 'required', 'processing' oder 'failed'.

alter table public.orders
  add column if not exists refund_status text not null default 'not_applicable',
  add column if not exists refund_amount_cent integer,
  add column if not exists refund_reference text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_erstattung_gestartet_am timestamptz;

alter table public.orders
  add constraint orders_refund_status_check
  check (refund_status in ('not_applicable', 'required', 'processing', 'refunded', 'failed'));

comment on column public.orders.refund_status is
  'not_applicable (Standard: Rechnungskauf oder nie bezahlt) | required '
  '(bezahlt und storniert, Ruckerstattung noch nicht ausgeloest) | processing '
  '(Anspruch beansprucht, Anbieter-Aufruf laeuft) | refunded (abgeschlossen, '
  'refund_reference/refunded_at gesetzt) | failed (Versuch gescheitert, '
  'erneut versuchbar). Gesetzt beim Uebergang zu status=cancelled, wenn '
  'payment_status zu diesem Zeitpunkt paid war (siehe orderService.ts).';
comment on column public.orders.refund_amount_cent is
  'Tatsaechlich erstatteter Betrag in Cent -- ausschliesslich vollstaendig, '
  'entspricht bei jeder Erstattung total_price. Eigenes Feld statt einer '
  'Wiederverwendung von total_price als reiner Nachweis, was tatsaechlich '
  'erstattet wurde.';
comment on column public.orders.refund_reference is
  'Erstattungs-ID des Zahlungsanbieters (Stripe re_... bzw. PayPal Refund-ID), '
  'erst bei erfolgreichem Abschluss gesetzt.';
comment on column public.orders.refunded_at is
  'Zeitpunkt des erfolgreichen Abschlusses, gleiches Muster wie paid_at/shipped_at.';
comment on column public.orders.refund_erstattung_gestartet_am is
  'Claim-Zeitstempel gegen parallele Ausloesung (Doppelklick, zwei Admin-Tabs). '
  'Sicherheit gegen eine doppelte ECHTE Erstattung nach einem Absturz kommt '
  'nicht von diesem Feld, sondern vom stabilen Idempotenzschluessel '
  '(refund-${orderId}) bei jedem Anbieter-Aufruf -- siehe Kopfkommentar.';

-- ── Claim-Funktionen ────────────────────────────────────────────────────

/**
 * Beansprucht die Rückerstattung für genau einen Ausführer.
 *
 * Zusätzlich zum Claim-Zeitstempel-Schutz greifen zwei fachliche Wächter:
 * `status = 'cancelled'` und `payment_status = 'paid'` -- eine Rückerstattung
 * darf strukturell nie für eine nicht-stornierte oder nie bezahlte Bestellung
 * beansprucht werden, selbst wenn refund_status durch einen Programmierfehler
 * anderswo fälschlich gesetzt würde.
 */
create or replace function public.beanspruche_erstattung(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set refund_status = 'processing', refund_erstattung_gestartet_am = now()
  where id = p_order_id
    and status = 'cancelled'
    and payment_status = 'paid'
    and refund_status in ('required', 'failed')
    and refund_erstattung_gestartet_am is null
  returning id;
$$;

/**
 * Gibt den Anspruch nach einem EINDEUTIGEN Fehlschlag frei (der Anbieter hat
 * den Aufruf synchron abgelehnt, z.B. ungültige Transaktions-ID). Setzt
 * refund_status explizit auf 'failed' statt zurück auf 'required', damit der
 * Admin-Bereich zwischen "noch nie versucht" und "Versuch ist gescheitert"
 * unterscheiden kann. Nur aus dem Zustand 'processing' heraus wirksam.
 */
create or replace function public.gib_erstattung_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set refund_status = 'failed', refund_erstattung_gestartet_am = null
  where id = p_order_id and refund_status = 'processing';
$$;

/**
 * Findet Rückerstattungen, deren Bearbeitung hängengeblieben ist (Absturz
 * zwischen Anbieter-Aufruf und DB-Update, kein synchroner Fehler). Setzt
 * refund_status zurück auf 'required', damit ein regulärer Retry über
 * beanspruche_erstattung wieder greift -- sicher dank des stabilen
 * Idempotenzschlüssels (siehe Kopfkommentar), NICHT weil genug Zeit
 * vergangen wäre. Aufgerufen vom bestehenden Cron-Job, gleiches Prinzip wie
 * gib_haengende_rechnungserstellung_frei/gib_haengende_versandlabel_frei.
 */
create or replace function public.gib_haengende_erstattungen_frei(p_minuten integer)
returns integer
language plpgsql
as $$
declare
  v_anzahl integer;
begin
  update public.orders
  set refund_status = 'required', refund_erstattung_gestartet_am = null
  where refund_status = 'processing'
    and refund_erstattung_gestartet_am is not null
    and refund_erstattung_gestartet_am < now() - make_interval(mins => p_minuten);
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke all on function public.beanspruche_erstattung(uuid) from public, anon, authenticated;
revoke all on function public.gib_erstattung_frei(uuid) from public, anon, authenticated;
revoke all on function public.gib_haengende_erstattungen_frei(integer) from public, anon, authenticated;
