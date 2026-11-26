-- ═══════════════════════════════════════════════════════════════════════
-- 0040 – EREIGNISSE DES BESUCHERZÄHLERS („Weg zur Bestellung“)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Wozu: Der Betreiber sieht, wie viele Besucher den Konfigurator öffnen, ein Motiv hochladen oder einen Text hinzufügen und etwas in den
-- Warenkorb legen. Ohne diese Zahl lässt sich nicht erkennen, an welcher Stelle Besucher abspringen (Search Console liefert nur Klicks aus
-- Google, der Besucherzähler nur Seitenaufrufe).
--
-- ── Datensparsamkeit (wie 0037) ───────────────────────────────────────
-- Dauerhaft gespeichert werden ZAHLEN: Tag, Ereignisname (feste Liste der Anwendung), Quelle (feste Liste) und die Zahl der Besucher.
-- Nie gespeichert: Inhalt oder Name einer Datei, Produkt, Farbe, Menge, Preis, Name, E-Mail, Bestell- oder Kundendaten.
-- Einzige Ausnahme ist `besuch_ereignis_kennungen`: je Ereignis, Besucher und Tag EIN Hashwert – dieselbe nicht umkehrbare Tageskennung wie
-- im Besucherzähler (HMAC aus IP und Browserkennung mit täglich wechselndem Schlüssel; die IP selbst gelangt nie in die Datenbank) –, damit
-- ein Besucher ein Ereignis nur einmal pro Tag zählt. Die Kennungen werden nach Tagesende gelöscht: Die bestehende Aufräumfunktion des
-- Besucherzählers (raeume_besuch_kennungen_auf(), vom Cron aufgerufen – der Cron-Code bleibt unverändert) räumt sie mit ab; zusätzlich
-- geschieht es beim ersten Ereignis jedes neuen Tages.
--
-- ── Trennung ──────────────────────────────────────────────────────────
-- Die Tabellen und Funktionen haben keinen Bezug zu Bestellungen, Zahlungen, Versand oder Rechnungen und lesen nur `besuch_kennungen`
-- (um dem Ereignis die Quelle des ersten Seitenaufrufs des Tages zuzuordnen). Der Betrieb der Bestellungen ändert sich nicht.
--
-- Zugriff wie bei allen internen Tabellen: Row Level Security ohne Policy; die Anwendung greift ausschließlich über den Service-Role-Client
-- zu; die Funktionen sind für public/anon/authenticated gesperrt.

create table if not exists public.besuch_ereignisse (
  tag      date    not null,
  ereignis text    not null,
  quelle   text    not null,
  besucher integer not null default 0,
  primary key (tag, ereignis, quelle)
);

create table if not exists public.besuch_ereignis_kennungen (
  tag      date not null,
  ereignis text not null,
  kennung  text not null,
  primary key (tag, ereignis, kennung)
);

comment on table public.besuch_ereignisse is
  'Besucher je Tag, Ereignis (feste Liste) und Kampagnen-Quelle (feste Liste). Nur Zahlen. Schreiben ueber erfasse_besuchs_ereignis().';
comment on table public.besuch_ereignis_kennungen is
  'Tageskennungen je Ereignis (Hash, siehe besuch_kennungen), damit ein Besucher ein Ereignis einmal pro Tag zaehlt. Keine IP-Adresse. Wird nach Tagesende geloescht (raeume_besuch_ereignisse_auf).';

alter table public.besuch_ereignisse enable row level security;
alter table public.besuch_ereignis_kennungen enable row level security;

revoke all on table public.besuch_ereignisse, public.besuch_ereignis_kennungen from anon, authenticated;

/**
 * Zählt ein Ereignis – atomar. Ein Besucher (Tageskennung) zählt jedes Ereignis höchstens einmal pro Tag.
 *
 * p_quelle ist nur der Ersatzwert: Hat der Besucher heute schon eine Seite aufgerufen, gilt die Quelle seines ERSTEN Aufrufs
 * (besuch_kennungen) – dieselbe Zurechnung wie im Besucherzähler, damit „Pinterest“-Besucher nach einem Seitenwechsel nicht unter
 * „ohne Kennzeichnung“ landen.
 */
create or replace function public.erfasse_besuchs_ereignis(
  p_tag      date,
  p_ereignis text,
  p_kennung  text,
  p_quelle   text
)
returns void
language plpgsql
as $$
declare
  v_neu    integer;
  v_quelle text;
begin
  insert into public.besuch_ereignis_kennungen (tag, ereignis, kennung)
  values (p_tag, p_ereignis, p_kennung)
  on conflict (tag, ereignis, kennung) do nothing;
  get diagnostics v_neu = row_count;  -- 1 = erstes Mal heute, 0 = bekannt

  if v_neu = 0 then
    return;
  end if;

  -- Erstes Ereignis eines neuen Tages: Kennungen früherer Tage entfernen (zweite Sicherung neben dem Cron).
  if (select count(*) from public.besuch_ereignis_kennungen where tag = p_tag) = 1 then
    delete from public.besuch_ereignis_kennungen where tag < p_tag;
  end if;

  select k.quelle into v_quelle
  from public.besuch_kennungen k
  where k.tag = p_tag and k.kennung = p_kennung;
  v_quelle := coalesce(v_quelle, p_quelle);

  insert into public.besuch_ereignisse (tag, ereignis, quelle, besucher)
  values (p_tag, p_ereignis, v_quelle, 1)
  on conflict (tag, ereignis, quelle) do update
    set besucher = public.besuch_ereignisse.besucher + 1;
end;
$$;

comment on function public.erfasse_besuchs_ereignis(date, text, text, text) is
  'Zaehlt ein Ereignis atomar (ein Besucher zaehlt es einmal pro Tag). Nur ueber den Service-Role-Client aufrufbar.';

/**
 * Admin-Auswertung ab p_von in EINEM Aufruf: Summen je Ereignis, je Quelle und je Tag. Aggregation in SQL (PostgREST schneidet bei
 * 1000 Zeilen ab).
 */
create or replace function public.lade_ereignisstatistik(p_von date)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'summen', coalesce((
      select jsonb_agg(jsonb_build_object('ereignis', s.ereignis, 'besucher', s.b) order by s.ereignis)
      from (
        select ereignis, sum(besucher)::integer as b
        from public.besuch_ereignisse
        where tag >= p_von
        group by ereignis
      ) s
    ), '[]'::jsonb),
    'quellen', coalesce((
      select jsonb_agg(jsonb_build_object('quelle', q.quelle, 'ereignis', q.ereignis, 'besucher', q.b) order by q.quelle, q.ereignis)
      from (
        select quelle, ereignis, sum(besucher)::integer as b
        from public.besuch_ereignisse
        where tag >= p_von
        group by quelle, ereignis
      ) q
    ), '[]'::jsonb),
    'tage', coalesce((
      select jsonb_agg(jsonb_build_object('tag', t.tag, 'ereignis', t.ereignis, 'besucher', t.b) order by t.tag, t.ereignis)
      from (
        select tag, ereignis, sum(besucher)::integer as b
        from public.besuch_ereignisse
        where tag >= p_von
        group by tag, ereignis
      ) t
    ), '[]'::jsonb)
  );
$$;

comment on function public.lade_ereignisstatistik(date) is
  'Admin-Auswertung der Ereignisse ab einem Tag (Summen, Quellen, Tage) als JSON.';

/** Löscht die Tageskennungen der Ereignisse früherer Tage. Gibt die Zahl entfernter Zeilen zurück. */
create or replace function public.raeume_besuch_ereignisse_auf()
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.besuch_ereignis_kennungen
  where tag < (now() at time zone 'Europe/Berlin')::date;
  get diagnostics v_entfernt = row_count;
  return v_entfernt;
end;
$$;

comment on function public.raeume_besuch_ereignisse_auf() is
  'Entfernt Tageskennungen der Ereignisse frueherer Tage (Europe/Berlin). Die Zaehlerstaende bleiben.';

revoke all on function public.erfasse_besuchs_ereignis(date, text, text, text) from public, anon, authenticated;
revoke all on function public.lade_ereignisstatistik(date) from public, anon, authenticated;
revoke all on function public.raeume_besuch_ereignisse_auf() from public, anon, authenticated;

/**
 * Die bestehende Aufräumfunktion des Besucherzählers (Migration 0037, vom Cron aufgerufen) räumt zusätzlich die Ereignis-Kennungen ab.
 * Verhalten und Rückgabewert (Zahl entfernter Tageskennungen der Seitenaufrufe) bleiben unverändert; der Cron-Code muss nicht geändert werden.
 */
create or replace function public.raeume_besuch_kennungen_auf()
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.besuch_kennungen
  where tag < (now() at time zone 'Europe/Berlin')::date;
  get diagnostics v_entfernt = row_count;

  delete from public.besuch_ereignis_kennungen
  where tag < (now() at time zone 'Europe/Berlin')::date;

  return v_entfernt;
end;
$$;

comment on function public.raeume_besuch_kennungen_auf() is
  'Entfernt Tageskennungen frueherer Tage (Europe/Berlin) – Seitenaufrufe UND Ereignisse (ab 0040). Die Zaehlerstaende bleiben.';
