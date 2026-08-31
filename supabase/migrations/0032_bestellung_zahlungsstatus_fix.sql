-- ═══════════════════════════════════════════════════════════════════════
-- FIX: create_order_atomic setzte payment_status nie
-- ═══════════════════════════════════════════════════════════════════════
--
-- Fund vom 2026-08-31 (echter PayPal-Live-Test): `orders.payment_status`
-- (Migration 0004) hat `not null default 'not_required'`. Das INSERT in
-- create_order_atomic (zuletzt neu definiert in 0025) führte payment_status
-- NIE in seiner Spaltenliste – jede Bestellung, unabhängig von der
-- Zahlungsart, erhielt deshalb stillschweigend den Tabellen-Default
-- 'not_required', statt des in lib/actions/orders.ts korrekt berechneten
-- Werts (anfangsZahlungsstatus(): 'pending' für Karte/PayPal, 'not_required'
-- nur für Rechnungskauf).
--
-- Für Rechnungskauf blieb der Fehler unsichtbar (der Default ist dort
-- ohnehin richtig). Für Karte/PayPal war er es nicht: Die serverseitige
-- Weiche in orders.ts (`brauchtVorabZahlung`) prüft zwar weiterhin korrekt
-- payment_METHOD und eröffnet trotzdem starteZahlung() – das Problem zeigt
-- sich erst NACHGELAGERT, bei den Cron-Nachhol-Funktionen
-- (holeOffeneRechnungenNach/holeOffeneBestellbestaetigungenNach,
-- orderCompletion.ts): Beide wählen Bestellungen mit
-- `payment_status in ('paid','not_required')` – fachlich richtig gedacht
-- ("kein Zahlungsvorbehalt mehr offen"), aber durch diesen Bug erhielt JEDE
-- Karte/PayPal-Bestellung, deren Zahlung nie abgeschlossen wurde (z.B. weil
-- eroeffne() fehlschlägt, siehe den separaten PayPal-Fix im selben Batch),
-- fälschlich eine echte Rechnung UND eine Bestellbestätigung – obwohl nie
-- bezahlt wurde. Live reproduziert (Bestellung 645550d1-25c3-4b81-8728-
-- 21de263d47ed, RE-2026-000004, nachträglich manuell korrigiert).
--
-- Der Fix ist bewusst minimal: NUR die fehlende Spalte ergänzen, keine
-- andere Zeile der Funktion verändert.

create or replace function public.create_order_atomic(
  p_order jsonb,
  p_items jsonb
)
returns table (order_id uuid, order_created_at timestamptz)
language plpgsql
as $$
declare
  v_order_id uuid;
  v_created_at timestamptz;
  v_item jsonb;
  v_item_id uuid;
  v_element jsonb;
begin
  v_order_id := (p_order->>'id')::uuid;

  insert into public.orders (
    id, customer_id, customer_vat_id, customer_name, company, email, phone,
    message, order_type, quantity, total_price, tax_rate, tax_amount,
    net_total, prices_include_tax, shipping_street, shipping_zip,
    shipping_city, shipping_country, client_request_id, payment_method,
    payment_status, terms_accepted_at
  )
  values (
    v_order_id,
    nullif(p_order->>'customer_id', '')::uuid,
    p_order->>'customer_vat_id',
    p_order->>'customer_name',
    p_order->>'company',
    p_order->>'email',
    p_order->>'phone',
    p_order->>'message',
    p_order->>'order_type',
    (p_order->>'quantity')::int,
    (p_order->>'total_price')::numeric,
    (p_order->>'tax_rate')::numeric,
    (p_order->>'tax_amount')::numeric,
    (p_order->>'net_total')::numeric,
    coalesce((p_order->>'prices_include_tax')::boolean, true),
    p_order->>'shipping_street',
    p_order->>'shipping_zip',
    p_order->>'shipping_city',
    p_order->>'shipping_country',
    p_order->>'client_request_id',
    p_order->>'payment_method',
    -- Fehlt der Wert (älterer Aufrufer), greift weiterhin der Tabellen-
    -- Default 'not_required' – coalesce statt eines harten NOT NULL-Fehlers,
    -- exakt dieselbe Rückwärtskompatibilitäts-Haltung wie bei den übrigen,
    -- additiv ergänzten Spalten dieser Funktion (siehe Kommentar in 0025).
    coalesce(p_order->>'payment_status', 'not_required'),
    nullif(p_order->>'terms_accepted_at', '')::timestamptz
  )
  returning id, created_at into v_order_id, v_created_at;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.order_items (
      order_id, product_id, product_name, color_id, color_name,
      size_quantities, print_method, quantity, unit_price, total_price,
      tax_rate, net_total_price
    )
    values (
      v_order_id,
      v_item->>'product_id',
      v_item->>'product_name',
      v_item->>'color_id',
      v_item->>'color_name',
      v_item->'size_quantities',
      v_item->>'print_method',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      (v_item->>'tax_rate')::numeric,
      (v_item->>'net_total_price')::numeric
    )
    returning id into v_item_id;

    for v_element in select * from jsonb_array_elements(coalesce(v_item->'elements', '[]'::jsonb))
    loop
      insert into public.configuration_elements (
        order_item_id, element_type, view, x_cm, y_cm, width_cm, height_cm,
        rotation_deg, original_file_url, display_file_url, file_name,
        text_content, font_family, font_size, font_color, font_weight,
        font_style, text_align, letter_spacing, line_height,
        has_shadow, has_outline, outline_color
      )
      values (
        v_item_id,
        v_element->>'element_type',
        v_element->>'view',
        (v_element->>'x_cm')::numeric,
        (v_element->>'y_cm')::numeric,
        (v_element->>'width_cm')::numeric,
        (v_element->>'height_cm')::numeric,
        (v_element->>'rotation_deg')::numeric,
        v_element->>'original_file_url',
        v_element->>'display_file_url',
        v_element->>'file_name',
        v_element->>'text_content',
        v_element->>'font_family',
        (v_element->>'font_size')::numeric,
        v_element->>'font_color',
        v_element->>'font_weight',
        v_element->>'font_style',
        v_element->>'text_align',
        (v_element->>'letter_spacing')::numeric,
        (v_element->>'line_height')::numeric,
        coalesce((v_element->>'has_shadow')::boolean, false),
        coalesce((v_element->>'has_outline')::boolean, false),
        v_element->>'outline_color'
      );
    end loop;
  end loop;

  return query select v_order_id, v_created_at;
end;
$$;

comment on function public.create_order_atomic(jsonb, jsonb) is
  'Legt eine Bestellung inkl. Positionen und Konfigurationselementen atomar an. '
  'Fix 0032: payment_status wird jetzt aus p_order uebernommen statt stillschweigend '
  'auf den Tabellen-Default zu fallen (siehe Kopfkommentar der Migration).';

revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
