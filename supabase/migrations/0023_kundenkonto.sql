-- ═══════════════════════════════════════════════════════════════════════
-- 0023 – KUNDENKONTO (additiv, verändert den bestehenden Gastkauf NICHT)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Löst die Spannung zwischen der früheren bewussten Entscheidung „kein
-- Kundenkonto" (docs/go-live-checkliste.md, B2) und dem neuen ausdrücklichen
-- Wunsch nach einem vollwertigen Konto auf: Das Konto kommt ADDITIV hinzu.
-- Der bestehende Gast-/Token-Checkout (bestellung/[token], orderAccess.ts)
-- bleibt vollständig unverändert nutzbar – ein Konto ist eine ZUSÄTZLICHE,
-- optionale Möglichkeit, keine Pflicht zum Bestellen.
--
-- Genau der Erweiterungsweg, den orderAccess.ts bereits am 2026-07-xx als
-- Kommentar vorgezeichnet hatte: „Erweiterung um ein Kundenkonto sähe so
-- aus: 1. Bestellzugriff um { art: 'konto'; kundenId } erweitern, 2. prüfen,
-- ob die Bestellung diesem Kunden gehört (… künftige customer_id), 3. fertig
-- – kein weiterer Code ändert sich." Genau das setzt diese Migration um.
--
-- ── Auth: Supabase Auth, kein zweites System ────────────────────────────
-- Supabase ist bereits der Datenbank-/Storage-Anbieter dieses Projekts;
-- Supabase Auth (auth.users, GoTrue) ist Teil desselben Kontos – kein
-- neuer externer Dienst, keine neue Kontoanlage nötig (dieselbe Begründung,
-- mit der das Projekt Redis/Sentry bereits abgelehnt hat, docs/architektur.md
-- §1). Passwort-Hashing, E-Mail-Bestätigung und Passwort-Reset-Tokens
-- übernimmt Supabase selbst – kein Grund, das selbst zu bauen.
--
-- ── Zugriffsmuster: server-only, wie überall sonst im Projekt ──────────
-- docs/architektur.md §5 legt fest: aller Datenbankzugriff läuft serverseitig
-- über den Service-Role-Client. Dieselbe Regel gilt hier: Profil und
-- Adressen werden AUSSCHLIESSLICH über Server Actions gelesen/geschrieben,
-- die zuerst `auth.uid()` über den SSR-Client prüfen und danach mit dem
-- Admin-Client lesen/schreiben (lib/actions/konto.ts). RLS unten ist
-- Verteidigung in der Tiefe (falls der Anon-/Publishable-Key je direkt
-- verwendet würde), nicht der primäre Zugriffsweg.
--
-- `orders.customer_id` ist bewusst NULLABLE: Gastbestellungen (der
-- Normalfall bis heute) haben weiterhin `customer_id = null`. Nur wer beim
-- Checkout eingeloggt ist, bekommt seine Bestellung verknüpft.

-- ── Profil: 1:1 zu auth.users ────────────────────────────────────────────
create table public.customer_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text,
  phone                 text,
  company               text,
  vat_id                text,
  avatar_url            text,
  -- DSGVO-Einwilligungen getrennt geführt (Zweckbindung: Newsletter ist ein
  -- eigener Zweck, nicht Teil der Vertragsdurchführung).
  newsletter_opt_in     boolean not null default false,
  newsletter_opt_in_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.customer_profiles is
  'Zusatzprofil zu auth.users (Supabase Auth). Additiv zum bestehenden '
  'Gastkauf – ein Konto ist optional, kein Zwang zum Bestellen. Zugriff '
  'ausschliesslich ueber Server Actions mit Admin-Client, siehe '
  'lib/actions/konto.ts.';

-- ── Adressbuch: mehrere Adressen, eine davon Standard ───────────────────
create table public.customer_addresses (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references auth.users(id) on delete cascade,
  label         text,                         -- z.B. "Zuhause", "Büro" – rein zur Orientierung
  first_name    text not null,
  last_name     text not null,
  company       text,
  street        text not null,
  zip           text not null,
  city          text not null,
  country       text not null,
  phone         text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.customer_addresses is
  'Adressbuch je Kundenkonto. Hoechstens eine Zeile je Kunde mit '
  'is_default = true, durchgesetzt durch den unten stehenden Unique-Index.';

-- Höchstens EINE Standardadresse je Kunde. Ein partieller Unique-Index statt
-- einer Anwendungsprüfung – kann unter keiner Bedingung auseinanderlaufen.
create unique index customer_addresses_ein_standard_je_kunde
  on public.customer_addresses (customer_id)
  where is_default;

create index customer_addresses_kunde_idx on public.customer_addresses (customer_id);

-- ── Bestellungen: additive, nullable Verknüpfung ────────────────────────
alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;

comment on column public.orders.customer_id is
  'NULL = Gastbestellung (weiterhin der Normalfall). Gesetzt, wenn beim '
  'Checkout ein Kundenkonto angemeldet war. Aendert NICHTS am bestehenden '
  'Token-Zugriffsweg (orderAccess.ts) – beide Wege bleiben nutzbar.';

create index orders_customer_id_idx on public.orders (customer_id) where customer_id is not null;

-- ── RLS: Verteidigung in der Tiefe (Server Actions bleiben der Weg) ─────
alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;

create policy "Eigenes Profil lesen" on public.customer_profiles
  for select using (auth.uid() = id);
create policy "Eigenes Profil anlegen" on public.customer_profiles
  for insert with check (auth.uid() = id);
create policy "Eigenes Profil aktualisieren" on public.customer_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Eigene Adressen lesen" on public.customer_addresses
  for select using (auth.uid() = customer_id);
create policy "Eigene Adressen anlegen" on public.customer_addresses
  for insert with check (auth.uid() = customer_id);
create policy "Eigene Adressen aktualisieren" on public.customer_addresses
  for update using (auth.uid() = customer_id) with check (auth.uid() = customer_id);
create policy "Eigene Adressen loeschen" on public.customer_addresses
  for delete using (auth.uid() = customer_id);

-- Kein Grant an anon/authenticated: Der App-Zugriff läuft über den
-- Service-Role-Client (umgeht RLS), exakt wie orders/order_items seit 0021.
-- Die Policies oben greifen nur, falls je der Publishable-Key direkt
-- verwendet würde – dann korrekt auf "nur eigene Zeilen" begrenzt.
revoke all privileges on public.customer_profiles  from anon, authenticated;
revoke all privileges on public.customer_addresses from anon, authenticated;

-- ── Profil automatisch anlegen, sobald ein Konto entsteht ───────────────
-- Trigger auf auth.users statt Anwendungscode: Ein Profil OHNE zugehöriges
-- Konto kann so nicht entstehen, und ein Konto ohne Profil auch nicht –
-- unabhängig davon, über welchen Weg das Konto angelegt wurde (eigene
-- Registrierung, Admin-Einladung, o.ä.).
create or replace function public.lege_kundenprofil_an()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger nach_konto_erstellung
  after insert on auth.users
  for each row execute function public.lege_kundenprofil_an();

revoke all on function public.lege_kundenprofil_an() from public, anon, authenticated;
