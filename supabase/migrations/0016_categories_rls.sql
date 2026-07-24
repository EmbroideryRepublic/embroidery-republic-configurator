-- ═══════════════════════════════════════════════════════════════════════
-- 0016 – ROW LEVEL SECURITY FÜR "categories"
-- ═══════════════════════════════════════════════════════════════════════
--
-- Beim Audit am 2026-07-22 aufgefallen: Von dreizehn Tabellen im Schema war
-- `categories` die EINZIGE ohne Row Level Security.
--
-- ── Wie es dazu kam ───────────────────────────────────────────────────
-- Migration 0001 aktiviert RLS für sechs Katalogtabellen – brands, products,
-- product_colors, product_sizes, print_areas, pricing_rules – und vergibt
-- jeweils eine öffentliche Lese-Policy. `categories` fehlt in beiden Listen.
-- Ein Versehen, kein bewusster Verzicht: Es gibt keinen Grund, warum diese
-- eine Tabelle anders behandelt werden sollte als ihre Nachbarn.
--
-- ── Warum das zählt ───────────────────────────────────────────────────
-- Ohne aktiviertes RLS greifen für eine Tabelle KEINE Policies – der
-- publizierbare Schlüssel, der im Browser liegt, hat damit vollen Zugriff.
-- Die Tabelle enthält keine personenbezogenen Daten, aber Kategorien sind
-- Katalogstruktur: Wer sie ändern kann, verändert die Navigation des Shops.
--
-- Nach dem Prinzip der geringsten Rechte gibt es keinen Grund, das offen zu
-- lassen. Änderungen erfolgen ohnehin ausschließlich serverseitig über den
-- Service-Role-Client, der RLS vollständig umgeht.
--
-- ── Wirkung ───────────────────────────────────────────────────────────
-- Lesen bleibt für alle möglich (der Shop zeigt Kategorien öffentlich an).
-- Schreiben ist von außen nicht mehr möglich. Für den Server ändert sich
-- nichts.

alter table public.categories enable row level security;

-- Dieselbe Policy wie bei brands, product_colors, product_sizes und
-- print_areas: öffentlich lesbar, nicht schreibbar.
drop policy if exists "Öffentlich lesbar" on public.categories;
create policy "Öffentlich lesbar" on public.categories for select using (true);

comment on table public.categories is
  'Produktkategorien. RLS seit Migration 0016 aktiv: oeffentlich lesbar, '
  'Aenderungen ausschliesslich serverseitig ueber den Service-Role-Client.';
