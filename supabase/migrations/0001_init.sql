-- ============================================================
-- Bekleidungskonfigurator – Initiales Datenbankschema
-- ============================================================

-- --- Marken (z.B. Stanley/Stella, Gildan, B&C ...) -----------
create table brands (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  logo_url     text,
  created_at   timestamptz not null default now()
);

-- --- Kategorien (T-Shirt, Hoodie, Poloshirt, Arbeitskleidung) -
create table categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  slug         text not null unique
);

-- --- Produkte ---------------------------------------------------
create table products (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid not null references brands(id) on delete cascade,
  category_id        uuid not null references categories(id) on delete restrict,
  name               text not null,
  base_price         numeric(10,2) not null,           -- Grundpreis pro Stück
  material           text,                              -- Materialzusammensetzung
  weight_gsm         integer,                            -- Grammatur (g/m²)
  fit                text,                               -- Passform (z.B. "Regular", "Slim")
  target_group       text,                               -- z.B. "Unisex", "Damen", "Herren"
  care_instructions  text,                               -- Waschhinweise
  certifications     text[],                             -- z.B. {"OEKO-TEX", "GOTS"}
  description        text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

-- --- Farbvarianten je Produkt ------------------------------------
create table product_colors (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  color_name     text not null,
  color_hex      text,                                   -- für UI-Swatch
  image_front    text not null,                          -- URL Supabase Storage
  image_back     text not null,
  image_sleeve_l text,
  image_sleeve_r text,
  created_at     timestamptz not null default now()
);

-- --- Größen je Produkt --------------------------------------------
create table product_sizes (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  size_label     text not null,                          -- "S", "M", "L", "XL" ...
  in_stock       boolean not null default true
);

-- --- Druckbereiche je Produkt (Front/Back/Sleeve-L/Sleeve-R) -------
create table print_areas (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  view           text not null check (view in ('front', 'back', 'sleeve_left', 'sleeve_right')),
  -- Position & Größe des bedruckbaren Bereichs relativ zur Produktgrafik (in %)
  x_percent      numeric(5,2) not null,
  y_percent      numeric(5,2) not null,
  width_percent  numeric(5,2) not null,
  height_percent numeric(5,2) not null,
  -- Umrechnungsfaktor: wie viel cm entsprechen 100% Breite/Höhe dieses Bereichs
  max_width_cm   numeric(6,2) not null,
  max_height_cm  numeric(6,2) not null,
  seam_margin_cm numeric(5,2) not null default 1.5       -- Sicherheitsabstand zu Nähten
);

-- --- Preisregeln (zentral, admin-editierbar) -----------------------
create table pricing_rules (
  id                uuid primary key default gen_random_uuid(),
  rule_type         text not null check (rule_type in
                     ('per_logo', 'per_text', 'per_position', 'per_size_tier', 'quantity_discount')),
  -- z.B. Druckposition -> Aufpreis
  print_view        text check (print_view in ('front', 'back', 'sleeve_left', 'sleeve_right')),
  -- Staffel für Logogröße (z.B. bis 10x10cm = X €, bis 20x20cm = Y €)
  size_threshold_cm2 numeric(8,2),
  price             numeric(10,2) not null,
  label             text not null,                        -- Anzeigename im Admin
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- --- Bestellungen -----------------------------------------------
create table orders (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  company         text,
  email           text not null,
  phone           text,
  message         text,
  order_type      text not null check (order_type in ('inquiry', 'order')),
  quantity        integer not null check (quantity >= 5),   -- Mindestbestellmenge
  total_price     numeric(10,2) not null,
  status          text not null default 'new'
                  check (status in ('new', 'in_review', 'confirmed', 'in_production', 'completed', 'cancelled')),
  pdf_url         text,                                      -- generierte Zusammenfassung
  created_at      timestamptz not null default now()
);

-- --- Konfiguration je Bestellung (Produkt + Farbe + Größe) ----------
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid not null references products(id),
  color_id        uuid not null references product_colors(id),
  size_label      text not null,
  unit_price      numeric(10,2) not null,
  quantity        integer not null
);

-- --- Platzierte Elemente (Logo/Text) je order_item -------------------
create table configuration_elements (
  id              uuid primary key default gen_random_uuid(),
  order_item_id   uuid not null references order_items(id) on delete cascade,
  element_type    text not null check (element_type in ('logo', 'text')),
  view            text not null check (view in ('front', 'back', 'sleeve_left', 'sleeve_right')),
  -- Position/Größe/Rotation im Canvas
  x_cm            numeric(6,2) not null,
  y_cm            numeric(6,2) not null,
  width_cm        numeric(6,2) not null,
  height_cm       numeric(6,2) not null,
  rotation_deg    numeric(5,2) not null default 0,
  -- Logo-spezifisch
  file_url        text,
  -- Text-spezifisch
  text_content    text,
  font_family     text,
  font_size       numeric(5,2),
  font_color      text,
  font_weight     text,
  font_style      text,
  text_align      text,
  extra_price     numeric(10,2) not null default 0
);

-- --- Indizes für häufige Abfragen ------------------------------------
create index idx_products_brand on products(brand_id);
create index idx_products_category on products(category_id);
create index idx_product_colors_product on product_colors(product_id);
create index idx_print_areas_product on print_areas(product_id);
create index idx_order_items_order on order_items(order_id);
create index idx_config_elements_item on configuration_elements(order_item_id);

-- --- Row Level Security (Basis-Setup, im Admin-Bereich verfeinern) ----
alter table orders enable row level security;
alter table order_items enable row level security;
alter table configuration_elements enable row level security;

-- Öffentliche Lese-Policies für Produktdaten
alter table brands enable row level security;
alter table products enable row level security;
alter table product_colors enable row level security;
alter table product_sizes enable row level security;
alter table print_areas enable row level security;
alter table pricing_rules enable row level security;

create policy "Öffentlich lesbar" on brands for select using (true);
create policy "Öffentlich lesbar" on products for select using (is_active = true);
create policy "Öffentlich lesbar" on product_colors for select using (true);
create policy "Öffentlich lesbar" on product_sizes for select using (true);
create policy "Öffentlich lesbar" on print_areas for select using (true);
create policy "Öffentlich lesbar" on pricing_rules for select using (is_active = true);

-- Bestellungen: nur Insert von außen erlaubt (kein Lesen fremder Bestellungen)
create policy "Jeder darf Bestellung anlegen" on orders for insert with check (true);
create policy "Jeder darf Bestellposition anlegen" on order_items for insert with check (true);
create policy "Jeder darf Konfigurationselement anlegen" on configuration_elements for insert with check (true);
