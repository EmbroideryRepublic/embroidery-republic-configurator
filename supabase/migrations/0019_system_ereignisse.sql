-- ═══════════════════════════════════════════════════════════════════════
-- 0019 – SYSTEMEREIGNISSE
-- ═══════════════════════════════════════════════════════════════════════
--
-- Beantwortet die Frage "SEIT WANN tritt das auf?".
--
-- ── Warum eine eigene Tabelle und kein externer Dienst ────────────────
-- Sentry o.ae. waere bequemer und erfordert ein neues Konto – im Projekt
-- eine stehende Regel, fuer Sentry bereits einmal ausdruecklich bestaetigt.
--
-- Das Plattformprotokoll allein genuegt nicht: Es haelt je nach Tarif nur
-- Stunden bis Tage vor. Fuer "seit wann?" und "haeuft sich das?" braucht es
-- Persistenz.
--
-- ── Nur KRITISCHE Ereignisse ──────────────────────────────────────────
-- Nicht jede Protokollzeile landet hier, sonst waechst die Tabelle sinnlos
-- und das Wichtige geht unter. Geschrieben wird ab WARNING – also das, was
-- jemand sehen sollte.
--
-- ── Bauart wie order_events ───────────────────────────────────────────
-- Dasselbe Muster, das im Projekt bereits etabliert ist: feste Kennung,
-- Klartextgrund, strukturierte Zusatzdaten in jsonb.

create table if not exists public.system_ereignisse (
  id            uuid        primary key default gen_random_uuid(),
  zeit          timestamptz not null default now(),
  -- Geschlossene Listen statt Freitext: nur so laesst sich filtern, ohne
  -- Zeichenketten zu durchsuchen.
  schwere       text        not null check (schwere in ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  kategorie     text        not null check (kategorie in (
                  'AUTH', 'ORDER', 'PAYMENT', 'UPLOAD', 'STORAGE',
                  'SUPPLIER', 'EMAIL', 'CRON', 'RATE_LIMIT', 'SYSTEM')),
  -- Maschinenlesbare Kennung, z.B. 'transaktion_fehlgeschlagen'.
  ereignis      text        not null,
  -- Fuer Menschen. BEREITS BEREINIGT von personenbezogenen Angaben – die
  -- Bereinigung erfolgt in lib/observability/log.ts, nicht hier.
  meldung       text,
  -- Verbindet alle Eintraege einer Anfrage.
  anfrage_id    text,
  -- Verbindet alle Eintraege einer Bestellung, ueber Anfragen hinweg.
  bestellnummer text,
  detail        jsonb
);

comment on table public.system_ereignisse is
  'Kritische Betriebsereignisse ab WARNING. Beantwortet "seit wann?" und '
  '"haeuft sich das?". Enthaelt KEINE personenbezogenen Daten – die '
  'Bereinigung erfolgt in lib/observability/log.ts vor dem Schreiben.';

-- Die drei Abfragen, die tatsaechlich vorkommen:
-- "was war zuletzt?", "was in dieser Kategorie?", "was bei dieser Bestellung?"
create index if not exists system_ereignisse_zeit_idx on public.system_ereignisse (zeit desc);
create index if not exists system_ereignisse_kategorie_idx on public.system_ereignisse (kategorie, schwere, zeit desc);
create index if not exists system_ereignisse_bestellung_idx on public.system_ereignisse (bestellnummer) where bestellnummer is not null;

alter table public.system_ereignisse enable row level security;

/**
 * Haeufungen erkennen.
 *
 * Vergleicht die letzte Stunde mit dem Stundendurchschnitt der letzten
 * sieben Tage. Ein Faktor deutlich ueber 1 heisst: hier passiert gerade
 * etwas Ungewoehnliches.
 */
create or replace function public.ereignis_haeufungen(p_stunden integer default 1)
returns table (
  kategorie text,
  ereignis text,
  schwere text,
  anzahl_aktuell bigint,
  schnitt_je_stunde numeric,
  faktor numeric
)
language sql
as $$
  with aktuell as (
    select e.kategorie, e.ereignis, e.schwere, count(*) as n
    from public.system_ereignisse e
    where e.zeit > now() - make_interval(hours => p_stunden)
    group by 1, 2, 3
  ),
  verlauf as (
    select e.kategorie, e.ereignis, e.schwere, count(*)::numeric / (7 * 24) as schnitt
    from public.system_ereignisse e
    where e.zeit between now() - interval '7 days' and now() - make_interval(hours => p_stunden)
    group by 1, 2, 3
  )
  select
    a.kategorie, a.ereignis, a.schwere, a.n,
    round(coalesce(v.schnitt, 0), 2),
    -- Ohne Vergangenheitswert ist alles neu: Faktor = Anzahl.
    case when coalesce(v.schnitt, 0) = 0 then a.n::numeric
         else round(a.n / v.schnitt, 1) end
  from aktuell a
  left join verlauf v
    on v.kategorie = a.kategorie and v.ereignis = a.ereignis and v.schwere = a.schwere
  order by 6 desc, 4 desc;
$$;

/**
 * Entfernt alte Ereignisse.
 *
 * 90 Tage: lang genug, um Muster ueber ein Quartal zu erkennen, kurz genug,
 * dass die Tabelle handhabbar bleibt. Wird von der Cron-Route mit
 * aufgerufen.
 */
create or replace function public.raeume_system_ereignisse_auf()
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.system_ereignisse where zeit < now() - interval '90 days';
  get diagnostics v_entfernt = row_count;
  return v_entfernt;
end;
$$;

revoke all on function public.ereignis_haeufungen(integer) from public, anon, authenticated;
revoke all on function public.raeume_system_ereignisse_auf() from public, anon, authenticated;
