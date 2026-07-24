-- ═══════════════════════════════════════════════════════════════════════
-- 0015 – BESTELLUNG ATOMAR ANLEGEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bis hierher entstand eine Bestellung in DREI getrennten Aufrufen:
-- orders, order_items, configuration_elements. Ohne Transaktion.
--
-- ── Der Schaden ───────────────────────────────────────────────────────
-- Schlug der zweite oder dritte Aufruf fehl, blieb ein Torso zurück: eine
-- Bestellung ohne Positionen oder ohne Motivdaten. Die Anwendung meldete
-- einen Fehler, die Kundschaft versuchte es erneut – und traf auf die
-- Idempotenzsperre aus 0011. Die lieferte die KAPUTTE Bestellung als
-- Erfolg zurück. Bestätigungsmail raus, Produktion unmöglich, und
-- auffallen konnte es erst beim Öffnen des Produktionsblatts.
--
-- ── Warum eine Datenbankfunktion und kein Kompensationspfad ───────────
-- Ein Aufräumen im Anwendungscode („bei Fehler die Bestellung wieder
-- löschen") hilft nur, solange der Prozess lebt. Genau bei einem Absturz,
-- einer Zeitüberschreitung oder einem Neustart mitten im Ablauf greift es
-- nicht – und das sind die Fälle, um die es geht. Eine Funktion läuft in
-- EINER Transaktion: Postgres rollt vollständig zurück, auch wenn die
-- Verbindung stirbt.
--
-- ── Nebeneffekt: die Idempotenz wird race-frei ────────────────────────
-- Der partielle Unique-Index auf client_request_id (0011) wirkt jetzt
-- INNERHALB der Transaktion. Treffen zwei Anfragen mit derselben Kennung
-- gleichzeitig ein, blockiert die zweite am Index, bis die erste
-- abgeschlossen ist. Danach sieht sie entweder eine VOLLSTÄNDIGE
-- Bestellung (Konflikt 23505 → bestehende zurückgeben) oder gar keine
-- (die erste wurde zurückgerollt → selbst anlegen). Ein Zwischenzustand
-- ist nicht mehr beobachtbar.
--
-- ── Was bewusst NICHT in der Transaktion liegt ────────────────────────
-- Datei-Uploads, E-Mail-Versand, Vorschau-Rendering, Produktionsblatt und
-- Lieferantenprozesse. Sie sind externe Wirkungen: nicht zurückrollbar und
-- teils langsam. Eine offene Datenbanktransaktion, die auf einen
-- Netzwerkaufruf wartet, hält Sperren und Verbindungen – bei paralleler
-- Last ist das der nächste Ausfall. Siehe docs/bestellprozess-konsistenz.md.

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
  -- Die Kennung kommt vom Aufrufer, damit Datei-Uploads bereits VOR der
  -- Transaktion unter dem endgültigen Pfad ablegen können.
  v_order_id := (p_order->>'id')::uuid;

  insert into public.orders (
    id, customer_name, company, email, phone, message, order_type,
    quantity, total_price, tax_rate, tax_amount, net_total, prices_include_tax,
    shipping_street, shipping_zip, shipping_city, shipping_country,
    client_request_id, payment_method
  )
  values (
    v_order_id,
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
    p_order->>'payment_method'
  )
  returning id, created_at into v_order_id, v_created_at;

  -- Positionen samt ihrer Konfigurationselemente. Die Reihenfolge des
  -- Arrays bestimmt die Zuordnung – dieselbe wie im Anwendungscode.
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
  'Legt Bestellung, Positionen und Konfigurationselemente in EINER Transaktion an. '
  'Entweder alles oder nichts – auch bei Absturz oder Zeitueberschreitung. '
  'Datei-Uploads und Folgeprozesse gehoeren bewusst NICHT hierher (externe, '
  'nicht zurueckrollbare Wirkungen). Siehe docs/bestellprozess-konsistenz.md.';

-- Nur der Service-Role darf Bestellungen anlegen; anonyme Clients nie.
revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
