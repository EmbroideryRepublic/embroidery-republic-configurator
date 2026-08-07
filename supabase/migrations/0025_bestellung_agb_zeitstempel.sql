-- ═══════════════════════════════════════════════════════════════════════
-- 0025 – BESTELLUNG UM USt-IdNr. UND AGB-ZUSTIMMUNGS-ZEITSTEMPEL ERGÄNZEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- Zwei additive Spalten auf `orders`, aus demselben Grund in EINER
-- Migration zusammengefasst: beide entstehen aus Angaben, die zum
-- Bestellzeitpunkt bereits vorliegen (Kundenprofil bzw. serverseitige
-- Prüfung), aber bislang nirgends auf der Bestellung selbst landen.
--
-- ── customer_vat_id ──────────────────────────────────────────────────────
-- `customer_profiles.vat_id` (Migration 0023) wird im Kundenkonto erfasst,
-- aber eine Bestellung hält bisher keine eigene Kopie davon. Genau wie bei
-- den übrigen Kontaktfeldern der Bestellung (`customer_name`, `email`, …)
-- ist das bewusst ein SCHNAPPSCHUSS, keine Live-Verknüpfung: Ändert die
-- Kundschaft später ihre USt-IdNr. im Profil, bleibt die auf einer bereits
-- aufgegebenen Bestellung/Rechnung ausgewiesene Nummer unverändert – exakt
-- das Prinzip, das docs/datenbankschema.md für `orders` als "kein FK nach
-- außen, Produktdaten liegen als Schnappschuss in order_items" beschreibt,
-- hier auf das Kundenprofil übertragen.
--
-- ── terms_accepted_at ────────────────────────────────────────────────────
-- Die Zustimmung zu AGB und Datenschutzerklärung ist serverseitig bereits
-- Pflicht (lib/orders/orderValidation.ts, Code `agb_nicht_akzeptiert`) –
-- bislang aber nirgends nachweisbar, WANN sie erteilt wurde. `NULL` bei
-- Anfragen (`order_type = 'inquiry'`), die keine Zustimmung verlangen;
-- bei echten Bestellungen der Zeitpunkt, zu dem die serverseitige Prüfung
-- die Zustimmung als erfüllt bestätigt hat (nicht irgendein Client-
-- Zeitstempel – dieselbe Server-ist-Wahrheit wie bei `tax_rate`/
-- `tax_amount`, die ebenfalls zum Bestellzeitpunkt festgehalten werden,
-- Migration 0014).

alter table public.orders
  add column if not exists customer_vat_id text;

comment on column public.orders.customer_vat_id is
  'Schnappschuss der USt-IdNr. aus customer_profiles.vat_id zum '
  'Bestellzeitpunkt (Migration 0023). NULL bei Gastbestellungen oder wenn '
  'im Profil keine USt-IdNr. hinterlegt war. Aendert sich NICHT nachtraeglich '
  'mit dem Profil.';

alter table public.orders
  add column if not exists terms_accepted_at timestamptz;

comment on column public.orders.terms_accepted_at is
  'Zeitpunkt der serverseitig bestaetigten AGB-/Datenschutz-Zustimmung '
  '(lib/orders/orderValidation.ts). NULL bei Anfragen (order_type = inquiry), '
  'die keine Zustimmung verlangen.';

-- ── create_order_atomic um beide Felder ergänzen (additiv) ─────────────
-- Dieselbe Erweiterung wie in 0024 für `customer_id`: AUSSCHLIESSLICH das
-- INSERT um zwei Spalten ergänzt, die übrige Logik (Transaktion, Idempotenz,
-- Rückgabe) bleibt unverändert. Fehlen die Felder im übergebenen JSON (z.B.
-- ältere Aufrufer), bleiben beide Spalten NULL – exakt das bisherige
-- Verhalten für jede noch nicht bekannte Spalte.

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
    terms_accepted_at
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
  'Legt Bestellung, Positionen und Konfigurationselemente in EINER Transaktion an. '
  'Entweder alles oder nichts – auch bei Absturz oder Zeitueberschreitung. '
  'Seit 0024 additiv mit customer_id (Kundenkonto) verknuepfbar, seit 0025 '
  'zusaetzlich mit customer_vat_id (Schnappschuss der USt-IdNr.) und '
  'terms_accepted_at (AGB-Zustimmungs-Zeitstempel). Bleibt bei fehlenden '
  'Angaben NULL. Datei-Uploads und Folgeprozesse gehoeren bewusst NICHT '
  'hierher. Siehe docs/bestellprozess-konsistenz.md.';

revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
