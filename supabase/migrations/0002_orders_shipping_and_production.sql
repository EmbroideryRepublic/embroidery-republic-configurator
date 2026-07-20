-- ============================================================
-- Bestellautomatisierung: Versand-Vorbereitung + Produktionsdateien
-- ============================================================

-- --- Versand (vorbereitet, wird erst mit echter Carrier-Anbindung
--     befüllt – DHL/DPD/UPS-Business-API-Zugang lag zum Zeitpunkt dieser
--     Migration noch nicht vor) --------------------------------------
alter table orders add column tracking_number text;
alter table orders add column carrier text;
alter table orders add column shipped_at timestamptz;

-- --- Link zum erzeugten Produktionspaket (Produktionsblatt-PDF +
--     hochgeladene Original-Logodateien liegen im selben Bestell-Ordner
--     im "production-files"-Storage-Bucket, siehe unten) ---------------
alter table orders add column production_files_url text;

-- --- order_items: von "eine Zeile pro Größe" auf "eine Zeile pro
--     Warenkorb-Position mit Größenverteilung" umstellen. Grund: das
--     tatsächliche App-Datenmodell (CartItem.sizeQuantities, siehe
--     src/types/index.ts) bildet eine Warenkorb-Position mit MEHREREN
--     Größen gleichzeitig ab (ein Design, eine Zeile, Größenverteilung
--     als Map) – das ursprüngliche Schema hätte dieselben
--     configuration_elements (Logo/Text-Platzierung) unnötig einmal pro
--     Größe duplizieren müssen. -----------------------------------------
alter table order_items drop column size_label;
alter table order_items add column size_quantities jsonb not null default '{}'::jsonb;
alter table order_items alter column size_quantities drop default;

-- --- product_id/color_id: Fremdschlüssel auf products/product_colors
--     entfernen. Der Produktkatalog lebt aktuell ausschließlich in
--     src/config/products.ts (noch keine Migration nach Supabase, siehe
--     Projekt-Historie) – ein "not null references products(id)" würde
--     JEDEN Bestell-Insert scheitern lassen, weil die products-Tabelle
--     leer ist. Stattdessen werden Produkt-/Farb-ID und -Name als
--     Snapshot zum Bestellzeitpunkt gespeichert (Text statt UUID-FK) –
--     das ist für eine Bestellhistorie ohnehin robuster: ändert sich der
--     Katalog später (Umbenennung, Produkt entfernt), bleiben bereits
--     aufgegebene Bestellungen unverändert lesbar. -----------------------
alter table order_items drop constraint order_items_product_id_fkey;
alter table order_items drop constraint order_items_color_id_fkey;
alter table order_items alter column product_id type text using product_id::text;
alter table order_items alter column color_id type text using color_id::text;
alter table order_items add column product_name text not null default '';
alter table order_items alter column product_name drop default;
alter table order_items add column color_name text not null default '';
alter table order_items alter column color_name drop default;

-- --- orders.quantity: die Mindestbestellmenge (5 Stück) gilt für ECHTE
--     Bestellungen, nicht für unverbindliche Anfragen – die bestehende
--     InquiryForm (src/components/layout/CartDrawer.tsx) erlaubt bewusst
--     das Absenden einer Anfrage OHNE Warenkorb-Inhalt ("Noch nichts im
--     Warenkorb — ihr könnt die Anfrage trotzdem senden"). Die ursprüngliche
--     Check-Constraint hätte jede leere Anfrage abgelehnt. --------------
alter table orders drop constraint orders_quantity_check;
alter table orders add constraint orders_quantity_check
  check (order_type = 'inquiry' or quantity >= 5);

-- --- Storage-Bucket für Produktionsunterlagen (Original-Logos +
--     Produktionsblatt-PDF) – bewusst PRIVAT: interne Produktionsdaten,
--     kein öffentlicher Kundenzugriff. Nur über den Service-Role-Key
--     (createAdminClient(), ausschließlich serverseitig) erreichbar. -----
insert into storage.buckets (id, name, public)
values ('production-files', 'production-files', false)
on conflict (id) do nothing;
