-- ═══════════════════════════════════════════════════════════════════════
-- 0036 – BESTELLNUMMER ALS PERSISTIERTE SPALTE (Jahreswechsel-Fix)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Hintergrund: `buildOrderNumber(dbId)` (src/lib/actions/orderTypes.ts)
-- berechnet die Bestellnummer bislang bei JEDEM Lesen neu aus
-- `new Date().getFullYear()` statt sie einmalig beim Anlegen festzulegen.
-- Ab Januar 2027 würde jede 2026 angelegte Bestellung überall (E-Mails,
-- Adminbereich, Buchhaltungs-Export, Kundenansicht) eine ANDERE Nummer
-- zeigen als die bereits an die Kundschaft verschickte – ein konkreter,
-- vorhersehbarer Fehler, der jetzt behoben wird, solange das System noch
-- überschaubar ist.
--
-- Der Fix: die Nummer wird ab sofort EINMALIG bei der Bestellerzeugung
-- berechnet und in dieser neuen Spalte gespeichert (src/lib/actions/orders.ts).
-- Lesepfade nutzen ab jetzt den gespeicherten Wert, mit `buildOrderNumber(id)`
-- nur noch als Rückfall für den theoretischen Fall einer Zeile ohne Wert.
--
-- Backfill: exakt derselbe Algorithmus wie buildOrderNumber(), nur mit dem
-- Jahr aus `created_at` statt `now()` – da jede bestehende Zeile bislang
-- ausschließlich 2026 angelegt UND bislang auch nur 2026 gelesen wurde,
-- ändert der Backfill keinen einzigen bereits angezeigten Wert.
alter table public.orders
  add column if not exists order_number text;

update public.orders
set order_number = 'ER-' || extract(year from created_at)::int || '-' ||
  upper(left(replace(id::text, '-', ''), 6))
where order_number is null;

comment on column public.orders.order_number is
  'Einmalig bei der Bestellerzeugung berechnete, dauerhafte Bestellnummer (Format ER-<Jahr>-<6 Zeichen der ID>) - siehe buildOrderNumber() in orderTypes.ts. Nullable: fehlt sie ausnahmsweise, fallen alle Lesepfade auf buildOrderNumber(id) zurueck.';

-- create_order_atomic (zuletzt neu definiert in 0032) fuehrt neue Spalten
-- NICHT automatisch mit, ihre Insert-Spaltenliste ist explizit – ohne diese
-- Ergaenzung wuerde orders.ts das neue order_number-Feld im JSON-Payload
-- mitschicken, die Funktion wuerde es aber stillschweigend ignorieren und
-- jede NEUE Bestellung liefe ueber den NULL-Faellback statt die Nummer
-- tatsaechlich zu persistieren.
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
    id, order_number, customer_id, customer_vat_id, customer_name, company, email, phone,
    message, order_type, quantity, total_price, tax_rate, tax_amount,
    net_total, prices_include_tax, shipping_street, shipping_zip,
    shipping_city, shipping_country, client_request_id, payment_method,
    payment_status, terms_accepted_at
  )
  values (
    v_order_id,
    p_order->>'order_number',
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
  'Fix 0036: order_number wird jetzt aus p_order uebernommen (Bestellnummer-Jahreswechsel-Fix, siehe Kopfkommentar der Migration).';

revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
