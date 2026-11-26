-- ═══════════════════════════════════════════════════════════════════════
-- 0039 – RECHNUNG NACH EINER AUFTRAGSÄNDERUNG ERSETZEN (Historie + Ersatz)
-- ═══════════════════════════════════════════════════════════════════════
--
-- STAND: nur als Datei angelegt – NICHT angewendet. Anwenden und verifizieren
-- bleibt ein bewusster Schritt (scripts/applyMigration.mjs mit Trockenlauf).
-- Reihenfolge: 0038 (Auftragsänderung, bereits angewendet) → DIESE Migration →
-- erst danach den Anwendungscode ausliefern, der sie aufruft.
--
-- ── Wozu ─────────────────────────────────────────────────────────────────
-- Ändert der Betreiber eine Bestellung, zu der es schon eine Rechnung gibt
-- (Migration 0038), entsteht automatisch eine NEUE Rechnung mit den geänderten
-- Positionen und Beträgen. Die alte Rechnung darf dabei nicht verschwinden:
-- `orders` trägt weiterhin nur die AKTUELLE Rechnung (invoice_id,
-- invoice_number, invoice_date, invoice_pdf_url), jede abgelöste Rechnung steht
-- mit Nummer, Datum, PDF-Pfad und Nachfolgerin in `order_invoice_history`.
--
-- ── Wie „nie zwei neue Rechnungen für dieselbe Änderung“ gesichert ist ───
-- Eine Änderung wird durch die Rechnung identifiziert, die sie ablöst: pro
-- (Bestellung, abgelöste Rechnungsnummer) gibt es höchstens EINE Zeile
-- (unique). Sie entsteht beim RESERVIEREN und enthält schon die Nummer der
-- Nachfolgerin – gezogen in DERSELBEN Transaktion wie die Zeile (Zähler aus
-- 0028). Bricht irgendetwas vor dem Commit ab, wird auch die Nummer
-- zurückgerollt: keine Lücke im Nummernkreis. Ein Wiederholungsversuch
-- (Schaltfläche „Neue Rechnung erzeugen“) findet die Zeile und bekommt
-- DIESELBE Nummer und dasselbe Datum zurück; er zieht nie eine zweite.
--
-- Zusammen mit dem Anspruch (claim_started_at, 10 Minuten) und dem atomaren
-- Tausch in `ersetze_rechnung` ergibt das dieselbe Zusage wie bei der ersten
-- Rechnung (0026), nur ohne dauerhaftes „unklarer Zustand“-Flag: Der Anbieter
-- ist hier ausschließlich der interne (kein externer Beleg, der doppelt
-- entstehen könnte) – ein verlorener Lauf kostet im Zweifel ein erneutes
-- Rendern desselben PDFs, nie eine zweite Nummer.
--
-- ── Was diese Migration NICHT tut ────────────────────────────────────────
-- • Sie setzt `accounting_ready_at` NICHT neu. Die lokale Buchhaltungs-App
--   übernimmt eine Bestellung nur einmal (Abgleich über die Bestell-ID); ein
--   erneutes Ausliefern würde dort wirkungslos bleiben und als „erfolgreich“
--   erscheinen. Siehe Bericht/Dokumentation der Auftragsänderung.
-- • Sie fasst weder Zahlung noch Erstattung an.
-- • Sie ändert aendere_bestellpositionen (0038) nicht: Der Ersatz folgt als
--   eigener Schritt. Dass er aussteht, steht atomar im Ereignis der Änderung
--   (order_events 'order_items_edited', detail.rechnungErsatz = 'automatisch').

create table if not exists public.order_invoice_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,

  -- Die abgelöste Rechnung (Kopie aus `orders` zum Zeitpunkt der Reservierung).
  invoice_id text,
  invoice_number text not null,
  invoice_date date,
  invoice_pdf_url text,

  -- Ihre Nachfolgerin. Nummer und Datum stehen ab der Reservierung fest.
  replaced_by_invoice_number text not null,
  replaced_by_invoice_date date not null,
  replaced_by_invoice_id text,

  -- 'reserved' = Nummer vergeben, Tausch steht aus (oder ist gescheitert);
  -- 'completed' = `orders` trägt bereits die Nachfolgerin.
  status text not null default 'reserved' check (status in ('reserved', 'completed')),
  claim_started_at timestamptz,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,

  unique (order_id, invoice_number),
  unique (replaced_by_invoice_number)
);

create index if not exists order_invoice_history_order_idx
  on public.order_invoice_history (order_id, created_at);

-- Wie alle Bestelltabellen: nur über den Service-Role-Client erreichbar.
alter table public.order_invoice_history enable row level security;

comment on table public.order_invoice_history is
  'Abgeloeste Rechnungen einer Bestellung (nach einer Auftragsaenderung). orders traegt nur die '
  'aktuelle Rechnung; hier steht jede fruehere mit Nummer, Datum, PDF-Pfad und Nachfolgerin. '
  'Pro (Bestellung, abgeloeste Nummer) hoechstens eine Zeile – das ist der Schutz gegen zwei '
  'neue Rechnungen fuer dieselbe Aenderung. Append-only im Sinne der Nachvollziehbarkeit: '
  'Zeilen werden nur vervollstaendigt (status reserved -> completed), nie geloescht.';
comment on column public.order_invoice_history.invoice_pdf_url is
  'Storage-Pfad (nicht URL) des PDFs der abgeloesten Rechnung – bleibt im Speicher liegen.';
comment on column public.order_invoice_history.status is
  'reserved = Nachfolgenummer vergeben, Tausch steht aus; completed = orders traegt die Nachfolgerin.';

-- ── 1. Reservieren (Anspruch + Nummer, atomar) ──────────────────────────────
--
-- Rückgabe (jsonb), Feld `status`:
--   'reserviert'      → du darfst das PDF rendern; neue_nummer/neues_datum gelten,
--                       alte_* beschreiben die abzulösende Rechnung
--   'bereits-ersetzt' → orders trägt schon eine andere Rechnung als p_alte_nummer
--                       (die Änderung ist erledigt – nichts mehr zu tun)
--   'laeuft'          → ein anderer Lauf hält den Anspruch noch (< p_frist_minuten)
-- Fehler: raise exception 'rechnungsersatz_abgelehnt:<code>' mit
--   nicht-gefunden · nicht-ersetzbar · unklarer-zustand
create or replace function public.reserviere_ersatzrechnung(
  p_order_id uuid,
  p_alte_nummer text,
  p_jahr integer,
  p_datum date,
  p_frist_minuten integer default 10
)
returns jsonb
language plpgsql
as $$
declare
  v_order  public.orders%rowtype;
  v_hist   public.order_invoice_history%rowtype;
  v_nummer text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'rechnungsersatz_abgelehnt:nicht-gefunden';
  end if;

  -- Schon ersetzt (oder nie die erwartete Rechnung gehabt)? Dann ist nichts zu tun.
  if v_order.invoice_number is distinct from p_alte_nummer then
    return jsonb_build_object('status', 'bereits-ersetzt', 'aktuelle_nummer', v_order.invoice_number);
  end if;

  -- Nur echte, nicht stornierte Bestellungen mit geklärter Zahlung. Der manuelle
  -- Klärungsfall der ersten Rechnung (0026) sperrt auch den Ersatz.
  if v_order.order_type is distinct from 'order'
     or v_order.status = 'cancelled'
     or v_order.payment_status not in ('paid', 'not_required')
  then
    raise exception 'rechnungsersatz_abgelehnt:nicht-ersetzbar';
  end if;
  if v_order.rechnung_unklarer_zustand then
    raise exception 'rechnungsersatz_abgelehnt:unklarer-zustand';
  end if;

  select * into v_hist
    from public.order_invoice_history
   where order_id = p_order_id
     and invoice_number = p_alte_nummer
     for update;

  if found then
    -- Wiederholung: dieselbe Nummer, dasselbe Datum. Läuft ein anderer Lauf noch, nicht dazwischenfunken.
    if v_hist.claim_started_at is not null
       and v_hist.claim_started_at > now() - make_interval(mins => p_frist_minuten)
    then
      return jsonb_build_object('status', 'laeuft');
    end if;
    update public.order_invoice_history set claim_started_at = now() where id = v_hist.id;
  else
    -- Erste Reservierung: Nummer im selben Schritt ziehen (Zähler aus 0028). Format wie
    -- ziehNaechsteRechnungsnummer() in src/lib/orders/rechnungsnummer.ts: RE-{jahr}-{6 Stellen}.
    v_nummer := 'RE-' || p_jahr::text || '-' || lpad(public.naechste_rechnungsnummer(p_jahr)::text, 6, '0');
    insert into public.order_invoice_history (
      order_id, invoice_id, invoice_number, invoice_date, invoice_pdf_url,
      replaced_by_invoice_number, replaced_by_invoice_date, status, claim_started_at
    )
    values (
      p_order_id, v_order.invoice_id, v_order.invoice_number, v_order.invoice_date, v_order.invoice_pdf_url,
      v_nummer, p_datum, 'reserved', now()
    )
    returning * into v_hist;
  end if;

  return jsonb_build_object(
    'status', 'reserviert',
    'neue_nummer', v_hist.replaced_by_invoice_number,
    'neues_datum', v_hist.replaced_by_invoice_date,
    'alte_nummer', v_hist.invoice_number,
    'altes_datum', v_hist.invoice_date,
    'alte_id', v_hist.invoice_id,
    'alter_pfad', v_hist.invoice_pdf_url
  );
end;
$$;

comment on function public.reserviere_ersatzrechnung(uuid, text, integer, date, integer) is
  'Beansprucht den Ersatz einer Rechnung und reserviert deren Nachfolgenummer ATOMAR (Nummer wird in '
  'derselben Transaktion gezogen wie die Historienzeile – kein Nummernverlust bei Abbruch). Wiederholungen '
  'liefern dieselbe Nummer. Migration 0039.';

-- ── 2. Anspruch freigeben (nach einem Fehlschlag) ───────────────────────────
-- Ohne das müsste ein Wiederholungsversuch bis zum Ablauf der Frist warten. Die
-- reservierte Nummer bleibt erhalten und wird beim nächsten Versuch wiederverwendet.
create or replace function public.gib_ersatzrechnung_frei(p_order_id uuid, p_alte_nummer text)
returns void
language sql
as $$
  update public.order_invoice_history
     set claim_started_at = null
   where order_id = p_order_id
     and invoice_number = p_alte_nummer
     and status = 'reserved';
$$;

-- ── 3. Tauschen (atomar) ────────────────────────────────────────────────────
-- Stellt `orders` auf die neue Rechnung um, schließt die Historienzeile ab und
-- schreibt den Eintrag 'invoice_replaced' – alles in einer Transaktion.
-- Idempotent: War der Tausch schon erfolgt, meldet sie 'bereits-ersetzt'.
-- Fehler: 'rechnungsersatz_abgelehnt:' nicht-gefunden · keine-reservierung · stand-geaendert
create or replace function public.ersetze_rechnung(
  p_order_id uuid,
  p_alte_nummer text,
  p_neue_id text,
  p_neue_nummer text,
  p_neuer_pfad text
)
returns jsonb
language plpgsql
as $$
declare
  v_order public.orders%rowtype;
  v_hist  public.order_invoice_history%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'rechnungsersatz_abgelehnt:nicht-gefunden';
  end if;

  select * into v_hist
    from public.order_invoice_history
   where order_id = p_order_id
     and invoice_number = p_alte_nummer
     for update;
  if not found or v_hist.replaced_by_invoice_number is distinct from p_neue_nummer then
    raise exception 'rechnungsersatz_abgelehnt:keine-reservierung';
  end if;

  if v_hist.status = 'completed' then
    return jsonb_build_object('status', 'bereits-ersetzt');
  end if;

  if v_order.invoice_number is distinct from p_alte_nummer then
    raise exception 'rechnungsersatz_abgelehnt:stand-geaendert';
  end if;

  -- accounting_ready_at bleibt UNVERÄNDERT (siehe Kopfkommentar). Noch nicht synchronisierte Bestellungen
  -- liefern ab jetzt die neue Rechnung samt neuem Betrag – konsistent; bereits übernommene bleiben beim
  -- Stand der Buchhaltung, bis diese den Ersatz kennt.
  update public.orders
     set invoice_id      = p_neue_id,
         invoice_number  = p_neue_nummer,
         invoice_date    = v_hist.replaced_by_invoice_date,
         invoice_pdf_url = p_neuer_pfad
   where id = p_order_id;

  update public.order_invoice_history
     set status = 'completed',
         replaced_by_invoice_id = p_neue_id,
         superseded_at = now(),
         claim_started_at = null
   where id = v_hist.id;

  insert into public.order_events (order_id, event_type, reason, detail)
  values (
    p_order_id,
    'invoice_replaced',
    'Rechnung ' || p_neue_nummer || ' ersetzt Rechnung ' || p_alte_nummer || '.',
    jsonb_build_object(
      'neueNummer', p_neue_nummer,
      'neuesDatum', v_hist.replaced_by_invoice_date,
      'neuerPfad', p_neuer_pfad,
      'alteNummer', p_alte_nummer,
      'altesDatum', v_hist.invoice_date,
      'alterPfad', v_hist.invoice_pdf_url
    )
  );

  return jsonb_build_object('status', 'ersetzt');
end;
$$;

comment on function public.ersetze_rechnung(uuid, text, text, text, text) is
  'Tauscht die aktuelle Rechnung einer Bestellung gegen die reservierte Nachfolgerin ATOMAR aus: '
  'orders, order_invoice_history und der order_events-Eintrag invoice_replaced entstehen gemeinsam oder '
  'gar nicht. Idempotent. Setzt accounting_ready_at bewusst NICHT. Migration 0039.';

revoke all on function public.reserviere_ersatzrechnung(uuid, text, integer, date, integer) from public, anon, authenticated;
revoke all on function public.gib_ersatzrechnung_frei(uuid, text) from public, anon, authenticated;
revoke all on function public.ersetze_rechnung(uuid, text, text, text, text) from public, anon, authenticated;
