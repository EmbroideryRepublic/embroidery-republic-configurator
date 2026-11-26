-- ═══════════════════════════════════════════════════════════════════════
-- 0038 – BESTELLPOSITIONEN NACHTRÄGLICH VERRINGERN ODER ENTFERNEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- STAND: nur als Datei angelegt – NICHT angewendet. Anwenden und verifizieren
-- bleibt ein bewusster Schritt (scripts/applyMigration.mjs mit Trockenlauf).
--
-- ── Wozu ─────────────────────────────────────────────────────────────────
-- Der Betreiber soll im Adminbereich bei einer bestehenden Bestellung eine
-- Position entfernen oder ihre Stückzahl verringern können („der Kunde hat
-- versehentlich 2 Hoodies bestellt“). Preis, Positionen, Bestellsumme und der
-- Historien-Eintrag müssen dabei ENTWEDER ALLE oder GAR NICHT geändert werden:
-- dieselbe Überlegung wie bei create_order_atomic (Migration 0015). Der
-- Supabase-Client kennt keine Transaktionen – nur eine Datenbankfunktion
-- garantiert, dass nach einem Abbruch nicht „Position weg, Summe alt“ übrig
-- bleibt.
--
-- ── Was die Funktion NICHT tut ───────────────────────────────────────────
-- Sie rechnet nichts. Der neue Preis kommt fertig aus der Anwendung (reine
-- Fachlogik in src/lib/orders/orderEdit.ts über die bestehende serverseitige
-- Preisberechnung); die Datenbank ist hier nur der atomare Schreibweg. Sie
-- fasst auch nichts Externes an: keine Rechnung, keine Zahlung, keine Erstattung,
-- keine E-Mail, keine Dateien im Speicher (die Logodateien einer entfernten
-- Position bleiben bewusst liegen und stehen im Historien-Eintrag).
--
-- ── Schutz gegen veraltete Vorschau ──────────────────────────────────────
-- Der Betreiber sieht erst eine Vorschau („alter Preis, neuer Preis“) und
-- bestätigt dann. Zwischen beiden Schritten kann sich die Bestellung ändern
-- (zweiter Browser-Tab, Statuswechsel, Stornierung, Zahlungseingang). Deshalb
-- sperrt die Funktion Bestellung und Positionen (FOR UPDATE) und vergleicht
-- den übergebenen Zustand `stand` mit der Datenbank. Weicht irgendetwas ab,
-- bricht sie mit 'aenderung_abgelehnt:stand-geaendert' ab – dann gälte der
-- berechnete Preis nicht mehr.
--
-- Zusätzlich prüft sie, dass das Ergebnis in sich stimmt (Summe der
-- Positionsmengen = Bestellmenge; Positionssumme + Versand = Endsumme), damit
-- ein Fehler in der Anwendung nicht eine inkonsistente Bestellung hinterlässt.
--
-- ── Eingabe p_aenderung (jsonb) ──────────────────────────────────────────
--   stand:       { status, payment_status, total_price, quantity,
--                  invoice_number,
--                  positionen: [ { id, size_quantities, total_price } … ] }
--                (ALLE Positionen der Bestellung, wie beim Berechnen gelesen)
--   bestellung:  { quantity, total_price, tax_amount, net_total }
--   aenderungen: [ { id, aktion: 'entfernen' }
--                | { id, aktion: 'aendern', size_quantities, quantity,
--                    unit_price, total_price, net_total_price } … ]
--   ereignis:    { reason, detail }  → order_events (event_type
--                'order_items_edited')
--
-- Fehler: raise exception 'aenderung_abgelehnt:<code>' mit den Codes
--   nicht-gefunden · keine-bestellung · stand-geaendert · ungueltige-aktion ·
--   letzte-position · summe-unstimmig

create or replace function public.aendere_bestellpositionen(
  p_order_id uuid,
  p_aenderung jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_order      public.orders%rowtype;
  v_stand      jsonb := p_aenderung -> 'stand';
  v_neu        jsonb := p_aenderung -> 'bestellung';
  v_pos        jsonb;
  v_item       public.order_items%rowtype;
  v_erwartet   integer;
  v_zeilen     integer;
  v_rest       integer;
  v_menge      bigint;
  v_warenwert  numeric;
  v_neu_total  numeric := (v_neu ->> 'total_price')::numeric;
begin
  -- ── 1. Bestellung sperren ───────────────────────────────────────────────
  -- Ab hier warten gleichzeitige Statuswechsel, Stornierungen und Zahlungs-
  -- ereignisse auf das Ende dieser Transaktion.
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'aenderung_abgelehnt:nicht-gefunden';
  end if;
  if v_order.order_type is distinct from 'order' then
    raise exception 'aenderung_abgelehnt:keine-bestellung';
  end if;

  -- ── 2. Ist es noch dieselbe Bestellung wie bei der Vorschau? ───────────
  if v_order.status is distinct from (v_stand ->> 'status')
     or v_order.payment_status is distinct from (v_stand ->> 'payment_status')
     or v_order.total_price is distinct from (v_stand ->> 'total_price')::numeric
     or v_order.quantity is distinct from nullif(v_stand ->> 'quantity', '')::integer
     or v_order.invoice_number is distinct from nullif(v_stand ->> 'invoice_number', '')
  then
    raise exception 'aenderung_abgelehnt:stand-geaendert';
  end if;

  -- ── 3. Positionen sperren und mit dem Stand vergleichen ────────────────
  v_erwartet := jsonb_array_length(coalesce(v_stand -> 'positionen', '[]'::jsonb));
  if v_erwartet < 1 then
    raise exception 'aenderung_abgelehnt:stand-geaendert';
  end if;

  for v_pos in select * from jsonb_array_elements(v_stand -> 'positionen')
  loop
    select * into v_item
      from public.order_items
     where id = (v_pos ->> 'id')::uuid
       and order_id = p_order_id
       for update;
    if not found
       or v_item.size_quantities is distinct from (v_pos -> 'size_quantities')
       or v_item.total_price is distinct from (v_pos ->> 'total_price')::numeric
    then
      raise exception 'aenderung_abgelehnt:stand-geaendert';
    end if;
  end loop;

  -- Eine zwischenzeitlich hinzugekommene Position würde hier auffallen.
  select count(*) into v_zeilen from public.order_items where order_id = p_order_id;
  if v_zeilen <> v_erwartet then
    raise exception 'aenderung_abgelehnt:stand-geaendert';
  end if;

  -- ── 4. Änderungen anwenden ─────────────────────────────────────────────
  -- Das Entfernen einer Position löscht ihre configuration_elements per
  -- „on delete cascade“ (0001) mit.
  for v_pos in select * from jsonb_array_elements(coalesce(p_aenderung -> 'aenderungen', '[]'::jsonb))
  loop
    if v_pos ->> 'aktion' = 'entfernen' then
      delete from public.order_items
       where id = (v_pos ->> 'id')::uuid
         and order_id = p_order_id;
    elsif v_pos ->> 'aktion' = 'aendern' then
      update public.order_items
         set size_quantities = v_pos -> 'size_quantities',
             quantity        = (v_pos ->> 'quantity')::integer,
             unit_price      = (v_pos ->> 'unit_price')::numeric,
             total_price     = (v_pos ->> 'total_price')::numeric,
             net_total_price = nullif(v_pos ->> 'net_total_price', '')::numeric
       where id = (v_pos ->> 'id')::uuid
         and order_id = p_order_id;
    else
      raise exception 'aenderung_abgelehnt:ungueltige-aktion';
    end if;

    get diagnostics v_zeilen = row_count;
    if v_zeilen <> 1 then
      raise exception 'aenderung_abgelehnt:stand-geaendert';
    end if;
  end loop;

  -- ── 5. Ergebnis auf Stimmigkeit prüfen ─────────────────────────────────
  select count(*), coalesce(sum(quantity), 0), coalesce(sum(total_price), 0)
    into v_rest, v_menge, v_warenwert
    from public.order_items
   where order_id = p_order_id;

  if v_rest < 1 then
    raise exception 'aenderung_abgelehnt:letzte-position';
  end if;
  if v_menge <> (v_neu ->> 'quantity')::bigint then
    raise exception 'aenderung_abgelehnt:summe-unstimmig';
  end if;
  -- Endsumme = Warenwert + Versand. Der Versand ist 0 oder ein fester Satz;
  -- 20 € ist dieselbe großzügige Obergrenze wie bei der Rechnungserstellung
  -- (orderCompletion.ts, VERSANDREST_OBERGRENZE_CENT).
  if v_neu_total - v_warenwert < -0.01 or v_neu_total - v_warenwert > 20 then
    raise exception 'aenderung_abgelehnt:summe-unstimmig';
  end if;

  -- ── 6. Bestellung aktualisieren ────────────────────────────────────────
  -- tax_rate bleibt unverändert: der Satz zum Kaufzeitpunkt (0014). Fehlt ein
  -- Wert in der Eingabe (Bestellung aus der Zeit vor 0014), bleibt der alte.
  update public.orders
     set quantity    = (v_neu ->> 'quantity')::integer,
         total_price = v_neu_total,
         tax_amount  = coalesce(nullif(v_neu ->> 'tax_amount', '')::numeric, tax_amount),
         net_total   = coalesce(nullif(v_neu ->> 'net_total', '')::numeric, net_total)
   where id = p_order_id;

  -- ── 7. Historie – in DERSELBEN Transaktion ──────────────────────────────
  -- Anders als protokolliereBestellereignis() (nicht-fatal, Nachweis) ist der
  -- Eintrag hier Teil der Änderung: Eine Preisänderung ohne Spur gibt es nicht.
  insert into public.order_events (order_id, event_type, from_status, to_status, reason, detail)
  values (
    p_order_id,
    'order_items_edited',
    v_order.status,
    v_order.status,
    p_aenderung -> 'ereignis' ->> 'reason',
    p_aenderung -> 'ereignis' -> 'detail'
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'total_price', v_neu_total,
    'quantity', (v_neu ->> 'quantity')::integer,
    'positionen', v_rest
  );
end;
$$;

comment on function public.aendere_bestellpositionen(uuid, jsonb) is
  'Verringert oder entfernt Positionen einer bestehenden Bestellung ATOMAR: Positionen, '
  'Bestellsumme/-menge/-steuer und der order_events-Eintrag entstehen gemeinsam oder gar nicht. '
  'Rechnet nichts (der Preis kommt fertig aus src/lib/orders/orderEdit.ts), erstattet nichts, '
  'versendet nichts. Vergleicht den uebergebenen Stand unter Zeilensperre mit der Datenbank '
  '(Fehler aenderung_abgelehnt:stand-geaendert bei Abweichung). Siehe Migration 0038.';

revoke all on function public.aendere_bestellpositionen(uuid, jsonb) from public, anon, authenticated;
