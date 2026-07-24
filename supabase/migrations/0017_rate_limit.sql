-- ═══════════════════════════════════════════════════════════════════════
-- 0017 – ZENTRALES RATE-LIMIT
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bis hierher gab es genau ein Limit, im Prozessspeicher (contact.ts). Auf
-- einer serverlosen Plattform ist das wirkungslos: Jede Instanz zählt für
-- sich, Kaltstarts löschen den Zähler. Der Bestellvorgang und der
-- Admin-Login – die beiden lohnendsten Ziele – waren ungeschützt.
--
-- ── Warum Postgres und nicht Redis ────────────────────────────────────
-- Ein zentraler Zähler ist zwingend. Redis wäre schneller (~2 ms gegen
-- ~30 ms), erfordert aber einen weiteren Dienst mit eigenem Zugang. Bei der
-- erwarteten Last ist der Unterschied bedeutungslos – der Bestellvorgang
-- selbst dauert Sekunden. Siehe docs/rate-limiting.md.
--
-- ── Warum eine Funktion und kein Update aus der Anwendung ─────────────
-- „Lesen, prüfen, schreiben" aus dem Anwendungscode hat eine Lücke: Zwei
-- gleichzeitige Anfragen lesen denselben Stand und lassen beide durch.
-- `insert … on conflict do update … returning` erledigt Zählen und Lesen in
-- EINER Anweisung – atomar, auch bei paralleler Last.

create table if not exists public.rate_limit_zaehler (
  -- Fachlicher Schlüssel, z.B. 'admin_login:ip:203.0.113.7'.
  schluessel     text        not null,
  -- Beginn des Zeitfensters, auf die Fensterlänge abgerundet.
  fenster_start  timestamptz not null,
  anzahl         integer     not null default 0,
  primary key (schluessel, fenster_start)
);

comment on table public.rate_limit_zaehler is
  'Zentrale Zaehler fuer alle Rate-Limits. Einziger Zugriff ueber '
  'pruefe_rate_limit(). Alte Fenster entfernt raeume_rate_limit_auf().';

-- Für das Aufräumen: alte Fenster in einem Zug finden.
create index if not exists rate_limit_fenster_idx
  on public.rate_limit_zaehler (fenster_start);

-- Wie orders: kein Zugriff von außen, ausschließlich serverseitig.
alter table public.rate_limit_zaehler enable row level security;

/**
 * Zählt einen Zugriff und meldet, ob er noch erlaubt ist.
 *
 * Gibt zurück:
 *   erlaubt         – false, sobald das Limit überschritten ist
 *   anzahl          – Zählerstand NACH diesem Zugriff
 *   zuruecksetzen_in – Sekunden bis zum nächsten Fenster
 *
 * Der Zugriff wird IMMER gezählt, auch wenn er abgewiesen wird. Sonst
 * könnte man durch fortgesetzte Versuche das Fenster künstlich frei halten.
 */
create or replace function public.pruefe_rate_limit(
  p_schluessel       text,
  p_fenster_sekunden integer,
  p_max              integer
)
returns table (erlaubt boolean, anzahl integer, zuruecksetzen_in integer)
language plpgsql
as $$
declare
  v_start timestamptz;
  v_stand integer;
begin
  -- Fensterbeginn: die aktuelle Zeit auf ein Vielfaches der Fensterlänge
  -- abrunden. Alle Instanzen kommen damit auf dasselbe Fenster.
  v_start := to_timestamp(
    floor(extract(epoch from now()) / p_fenster_sekunden) * p_fenster_sekunden
  );

  insert into public.rate_limit_zaehler (schluessel, fenster_start, anzahl)
  values (p_schluessel, v_start, 1)
  on conflict (schluessel, fenster_start)
    do update set anzahl = public.rate_limit_zaehler.anzahl + 1
  returning public.rate_limit_zaehler.anzahl into v_stand;

  return query select
    v_stand <= p_max,
    v_stand,
    greatest(0, ceil(extract(epoch from (v_start + make_interval(secs => p_fenster_sekunden)) - now()))::integer);
end;
$$;

comment on function public.pruefe_rate_limit(text, integer, integer) is
  'Zaehlt atomar und meldet, ob das Limit eingehalten ist. Zaehlt auch '
  'abgewiesene Zugriffe – sonst liesse sich das Fenster freihalten.';

/**
 * Entfernt abgelaufene Fenster.
 *
 * Ohne diesen Lauf wüchse die Tabelle unbegrenzt. Alles, was älter als
 * 24 Stunden ist, kann weg – das längste verwendete Fenster ist eine Stunde.
 */
create or replace function public.raeume_rate_limit_auf()
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.rate_limit_zaehler
  where fenster_start < now() - interval '24 hours';
  get diagnostics v_entfernt = row_count;
  return v_entfernt;
end;
$$;

revoke all on function public.pruefe_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.raeume_rate_limit_auf() from public, anon, authenticated;
