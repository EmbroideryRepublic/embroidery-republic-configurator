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
-- was Lexware zurückliefert. `invoice_id` dient zugleich als "bereits real
-- angelegt"-Marker fuer den Erstellungs-Claim unten (nicht `invoice_number`:
-- Lexware kann einen Beleg anlegen, ohne die Nummer in derselben Antwort
-- zurueckzugeben, siehe lib/invoicing/providers/lexware.ts,
-- RechnungsTeilerfolgFehler) -- exakt wie `pdf_url` das bei Phase 2 schon
-- tut (siehe 0020).
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
--
-- ── "Unklarer Zustand" (Review vom 2026-08-12, zweite Runde) ─────────────
-- Ursprünglich prüften Claim/Freigabe/Reaper ausschließlich invoice_id bzw.
-- tracking_number. Lücke: Ruft die Anwendung Lexware/DHL erfolgreich auf,
-- scheitert aber die ANSCHLIESSENDE Persistierung von invoice_id/
-- tracking_number vollständig (z.B. anhaltender DB-Ausfall), bleibt dieses
-- Feld NULL – exakt derselbe Zustand wie "Anbieter nie erreicht". Der
-- 15-Minuten-Reaper konnte diese beiden Fälle nicht unterscheiden und hätte
-- den Claim fälschlich freigegeben, was einen zweiten echten (abrechnungs-
-- wirksamen) Aufruf ermöglicht hätte. `rechnung_unklarer_zustand` /
-- `label_unklarer_zustand` schließen das: Sobald die Anwendung weiß, dass
-- der externe Anbieter etwas angelegt hat (Ergebnis vorhanden ODER
-- RechnungsTeilerfolgFehler/VersandTeilerfolgFehler), aber die primäre
-- Kennung nicht gespeichert werden konnte, wird dieses Flag als LETZTE
-- Rettungsleine gesetzt (eigener, unabhängiger Schreibversuch, siehe
-- persistiereKritischMitWiederholung in orderService.ts). Ist es `true`,
-- geben WEDER die Freigabe-Funktion NOCH der Reaper NOCH der Claim selbst
-- den Anspruch je wieder her – das ist der Punkt, an dem die Datenbank
-- allein keine Sicherheit mehr garantieren kann und ein Mensch bei Lexware/
-- DHL nachsehen muss (siehe orderCompletion.ts/shippingService.ts). Wird
-- ausschließlich von Hand nach manueller Prüfung zurückgesetzt, nie vom
-- Code. Der "gar nicht erreicht/vor Erstellung abgelehnt"-Fall bleibt davon
-- unberührt und weiterhin automatisch freigebbar und wiederholbar.

alter table public.orders
  add column if not exists invoice_id text,
  add column if not exists invoice_number text,
  add column if not exists invoice_pdf_url text,
  add column if not exists rechnung_erstellung_gestartet_am timestamptz,
  add column if not exists rechnung_unklarer_zustand boolean not null default false,
  add column if not exists dhl_label_url text,
  add column if not exists label_erstellung_gestartet_am timestamptz,
  add column if not exists label_unklarer_zustand boolean not null default false;

comment on column public.orders.invoice_id is
  'Lexware-Beleg-ID (UUID), fuer spaetere GET /v1/invoices/{id} oder /file-Aufrufe. '
  'Dient zugleich als Marker "bei Lexware bereits real angelegt" fuer den '
  'Erstellungs-Claim unten -- wird SOFORT nach dem erstelle()-Aufruf persistiert, '
  'noch bevor PDF-Upload/E-Mail laufen, damit ein nachgelagerter Fehler den Claim '
  'nicht mehr freigeben kann (siehe orderCompletion.ts, erzeugeRechnung).';
comment on column public.orders.invoice_number is
  'Von Lexware beim Erstellen vergebene fortlaufende Rechnungsnummer. '
  'Kann in seltenen Faellen (Antwort ohne Nummer) kurzzeitig hinter invoice_id '
  'zurueckbleiben -- der Claim-Schutz haengt an invoice_id, nicht an diesem Feld.';
comment on column public.orders.invoice_pdf_url is
  'Storage-Pfad (nicht URL) zum von Lexware gerenderten Rechnungs-PDF, '
  'gleicher Bucket wie orders.pdf_url (Produktionsblatt).';
comment on column public.orders.rechnung_erstellung_gestartet_am is
  'Anspruch (Claim) auf die Rechnungserstellung. Verhindert, dass zwei '
  'gleichzeitige Laeufe (z.B. erneut zugestellter Zahlungs-Webhook) '
  'doppelt bei Lexware anlegen. Wird bei einem Fehler zurueckgesetzt -- '
  'AUSSER rechnung_unklarer_zustand ist gesetzt, siehe dort.';
comment on column public.orders.rechnung_unklarer_zustand is
  'Manueller Klaerungsfall: Lexware hat vermutlich/sicher bereits eine echte '
  'Rechnung angelegt, invoice_id konnte aber trotz mehrerer Versuche NICHT '
  'gespeichert werden. Dauerhafte Sperre gegen jede weitere automatische '
  'Freigabe/Beanspruchung -- wird NIE vom Code zurueckgesetzt, nur von Hand '
  'nach Abgleich mit dem echten Lexware-Konto (siehe order_events, '
  'event_type invoice_creation_partial_failure, fuer die Bestellnummer).';
comment on column public.orders.dhl_label_url is
  'Storage-Pfad zur eigenen Kopie des DHL-Label-PDFs. DHLs eigene '
  'Label-URL kann verfallen, unsere gespeicherte Kopie nicht.';
comment on column public.orders.label_erstellung_gestartet_am is
  'Anspruch (Claim) auf die Versandlabel-Erstellung, gleiches Prinzip wie '
  'rechnung_erstellung_gestartet_am (inkl. der Ausnahme bei '
  'label_unklarer_zustand). DHL bietet keinen eigenen Idempotenzschluessel '
  'fuer die Label-Erstellung.';
comment on column public.orders.label_unklarer_zustand is
  'Manueller Klaerungsfall, Pendant zu rechnung_unklarer_zustand: DHL hat '
  'vermutlich/sicher bereits eine echte, abrechnungswirksame Sendung '
  'angelegt, tracking_number konnte aber trotz mehrerer Versuche NICHT '
  'gespeichert werden. Nie vom Code zurueckgesetzt.';

-- ── Rechnung: Claim-Funktionen ───────────────────────────────────────────

/**
 * Beansprucht die Rechnungserstellung für genau einen Ausführer.
 *
 * Gilt für Rechnungskauf UND vorab bezahlte Bestellungen gleichermaßen
 * (payment_status 'paid' oder 'not_required') – Lexware wird das führende
 * Rechnungssystem für jede verbindliche Bestellung, nicht nur für neu
 * hinzukommende Zahlarten. Anfragen (order_type 'inquiry') sind über die
 * erste Bedingung ausgeschlossen. `rechnung_unklarer_zustand = false` ist
 * die entscheidende zusätzliche Bedingung: Ist der manuelle Klärungsfall
 * einmal markiert, ist eine erneute Beanspruchung STRUKTURELL unmöglich --
 * unabhängig davon, was mit rechnung_erstellung_gestartet_am sonst passiert.
 * Das ist die stärkste der drei Sperren (siehe auch die beiden Funktionen
 * unten) und die einzige, die selbst einen Fehler in den anderen beiden
 * abfangen würde.
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
    and invoice_id is null
    and rechnung_unklarer_zustand = false
    and rechnung_erstellung_gestartet_am is null
  returning id;
$$;

/**
 * Gibt den Anspruch nach einem Fehlschlag wieder frei.
 *
 * Wird von orderCompletion.ts NUR im Zweig "Lexware wurde nie erreicht oder
 * hat vor jeder Anlage abgelehnt" aufgerufen -- dort ist rechnung_unklarer_
 * zustand konstruktionsbedingt niemals gesetzt. Die Bedingung hier ist
 * trotzdem defensiv mit aufgeführt (nicht nur invoice_id): sollte diese
 * Funktion je aus einem anderen Zweig aufgerufen werden, verhindert sie
 * dort ebenfalls zuverlässig die Freigabe eines echten Klärungsfalls.
 */
create or replace function public.gib_rechnungserstellung_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set rechnung_erstellung_gestartet_am = null
  where id = p_order_id and invoice_id is null and rechnung_unklarer_zustand = false;
$$;

/**
 * Findet Bestellungen, deren Rechnungserstellung hängengeblieben ist
 * (harter Absturz mitten in der Bearbeitung, kein Catch möglich). Aufgerufen
 * von der Cron-Route, gleiches Prinzip wie gib_haengende_abschluesse_frei.
 *
 * `rechnung_unklarer_zustand = false` ist die kritische Bedingung: Ohne sie
 * kann dieser Reaper NICHT zwischen "Lexware nie erreicht" (invoice_id NULL,
 * sicher freigebbar) und "Lexware erfolgreich, invoice_id-Persistierung
 * scheiterte vollständig" (invoice_id ebenfalls NULL, aber ein echter Beleg
 * existiert bereits) unterscheiden -- beide erzeugen ansonsten dasselbe
 * Muster (invoice_id NULL, Claim-Zeitstempel abgelaufen). Genau das war die
 * ursprüngliche Lücke (Review vom 2026-08-12): dieser Reaper hätte einen
 * echten Klärungsfall fälschlich freigegeben und einen zweiten Lexware-Beleg
 * ermöglicht. Ist rechnung_unklarer_zustand gesetzt, rührt dieser Reaper den
 * Claim NIE an -- der Fall bleibt bis zur manuellen Prüfung dauerhaft
 * hängen, das ist hier ausdrücklich das gewünschte (sichere) Verhalten.
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
  where invoice_id is null
    and rechnung_unklarer_zustand = false
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
 * ins Leere statt ein zweites DHL-Label zu erzeugen. `label_unklarer_
 * zustand = false` sperrt zusätzlich strukturell jede erneute Beanspruchung,
 * sobald ein manueller Klärungsfall markiert wurde -- unabhängig vom
 * Zeitstempel-Zustand, dieselbe Logik wie bei beanspruche_rechnungserstellung.
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
    and label_unklarer_zustand = false
    and label_erstellung_gestartet_am is null
  returning id;
$$;

/**
 * Gibt den Anspruch nach einem Fehlschlag wieder frei.
 *
 * Wird von shippingService.ts NUR im Zweig "DHL wurde nie erreicht oder hat
 * vor jeder Anlage abgelehnt" aufgerufen -- dort ist label_unklarer_zustand
 * konstruktionsbedingt niemals gesetzt. Defensiv trotzdem mit geprüft, siehe
 * Begründung bei gib_rechnungserstellung_frei.
 */
create or replace function public.gib_versandlabel_frei(p_order_id uuid)
returns void
language sql
as $$
  update public.orders
  set label_erstellung_gestartet_am = null
  where id = p_order_id and tracking_number is null and label_unklarer_zustand = false;
$$;

/**
 * Findet hängengebliebene Label-Erstellungen. Aufgerufen von der Cron-Route.
 *
 * `label_unklarer_zustand = false` ist hier -- anders als bei Lexware --
 * die EINZIGE Absicherung gegen eine fälschliche Freigabe: DHL kennt anders
 * als Lexware keine zweite Kennung (kein Äquivalent zu invoice_id vs.
 * invoice_number), tracking_number ist das einzige Feld, das sowohl "nie
 * erreicht" als auch "erreicht, Sendung angelegt, Persistierung gescheitert"
 * gleichermaßen als NULL zeigt. Ohne label_unklarer_zustand konnte dieser
 * Reaper die beiden Fälle nicht unterscheiden (Review vom 2026-08-12,
 * konkret bestätigter Duplikat-Erzeugungspfad) -- mit diesem Flag hält er
 * einen echten Klärungsfall dauerhaft, statt ihn nach Ablauf der Frist an
 * einen erneuten (dann tatsächlich einen ZWEITEN, abrechnungswirksamen)
 * DHL-Aufruf freizugeben.
 */
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
    and label_unklarer_zustand = false
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
