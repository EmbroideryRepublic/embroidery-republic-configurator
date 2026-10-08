-- ═══════════════════════════════════════════════════════════════════════
-- 0037 – BESUCHERZÄHLER (cookielos, ohne gespeicherte IP-Adressen)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Wozu: Der Betreiber sieht im Adminbereich, wie viele Besucher die Website hat,
-- welche Seiten sie aufrufen und über welche gekennzeichneten Links (utm_source)
-- sie kommen. Ohne diese Zahl lässt sich keine Maßnahme (Suchmaschine, Anzeigen,
-- Flyer, Instagram) auf Wirkung prüfen.
--
-- ── Datensparsamkeit als Bauprinzip ───────────────────────────────────
-- Gespeichert werden ZAHLEN, keine Personen:
--   besuch_summe    Besucher und Seitenaufrufe je Tag
--   besuch_seiten   Seitenaufrufe je Tag und Seite (nur Seiten der Sitemap)
--   besuch_quellen  Besucher/Aufrufe je Tag und Kampagnen-Quelle
-- Einzige Ausnahme ist `besuch_kennungen`: Sie enthält je Besucher und Tag EINEN
-- Hashwert („Tageskennung"), damit mehrere Seitenaufrufe desselben Tages als ein
-- Besucher zählen. Die Kennung entsteht in der Anwendung aus IP-Adresse und
-- Browserkennung mit einem geheimen, täglich wechselnden Schlüssel (HMAC) – die
-- IP-Adresse selbst gelangt NIE in die Datenbank, und weil der Tag Teil des
-- Schlüssels ist, lässt sich eine Kennung nicht über Tage verknüpfen. Die
-- Kennungen werden nach Tagesende gelöscht (raeume_besuch_kennungen_auf(), vom
-- Cron aufgerufen, zusätzlich beim ersten Besucher jedes neuen Tages).
--
-- Cookies, Local Storage oder andere Informationen auf dem Endgerät werden
-- NICHT verwendet. Siehe docs/besucherzaehler.md.
--
-- ── Zugriff ───────────────────────────────────────────────────────────
-- Wie alle internen Tabellen: Row Level Security ohne Policy (Default-Deny für
-- anon/authenticated über PostgREST); die Anwendung greift ausschließlich über
-- den Service-Role-Client zu. Die Funktionen sind zusätzlich für public/anon/
-- authenticated gesperrt – sonst könnte jeder über die öffentliche RPC-
-- Schnittstelle die Zahlen verfälschen.

create table if not exists public.besuch_summe (
  tag      date    primary key,
  besucher integer not null default 0,
  aufrufe  integer not null default 0
);

create table if not exists public.besuch_seiten (
  tag     date    not null,
  pfad    text    not null,
  aufrufe integer not null default 0,
  primary key (tag, pfad)
);

create table if not exists public.besuch_quellen (
  tag      date    not null,
  quelle   text    not null,
  besucher integer not null default 0,
  aufrufe  integer not null default 0,
  primary key (tag, quelle)
);

create table if not exists public.besuch_kennungen (
  tag     date not null,
  kennung text not null,
  -- Quelle des ERSTEN Aufrufs dieses Besuchers an diesem Tag: Alle weiteren
  -- Seitenaufrufe desselben Besuchers werden ihr zugerechnet.
  quelle  text not null,
  primary key (tag, kennung)
);

comment on table public.besuch_summe is
  'Besucher und Seitenaufrufe je Tag (nur Zahlen). Schreiben ueber erfasse_besuch().';
comment on table public.besuch_seiten is
  'Seitenaufrufe je Tag und Seite. Der Pfad stammt aus einer Positivliste (Sitemap), nie frei vom Client.';
comment on table public.besuch_quellen is
  'Besucher/Aufrufe je Tag und Kampagnen-Quelle (utm_source aus einer festen Liste, sonst "sonstige").';
comment on table public.besuch_kennungen is
  'Tageskennungen (Hash aus IP+Browserkennung mit taeglich wechselndem geheimem Schluessel). '
  'Keine IP-Adresse. Wird nach Tagesende geloescht (raeume_besuch_kennungen_auf).';

alter table public.besuch_summe enable row level security;
alter table public.besuch_seiten enable row level security;
alter table public.besuch_quellen enable row level security;
alter table public.besuch_kennungen enable row level security;

revoke all on table public.besuch_summe, public.besuch_seiten, public.besuch_quellen, public.besuch_kennungen
  from anon, authenticated;

/**
 * Zählt einen Seitenaufruf – atomar, in EINER Anweisungsfolge.
 *
 * p_tag      Kalendertag in Europe/Berlin (die Anwendung bildet ihn).
 * p_pfad     bereits gegen die Positivliste geprüfter Pfad.
 * p_kennung  Tageskennung (Hash, siehe Kopfkommentar).
 * p_quelle   bereinigte Kampagnen-Quelle des Aufrufs.
 *
 * Besucher wird gezählt, wenn die Tageskennung heute NEU ist; ein bekannter
 * Besucher erhöht nur die Aufrufe – und zwar der Quelle seines ersten Aufrufs,
 * damit spätere Seitenwechsel (ohne utm_source in der Adresse) nicht fälschlich
 * unter „ohne Kennzeichnung" landen.
 */
create or replace function public.erfasse_besuch(
  p_tag     date,
  p_pfad    text,
  p_kennung text,
  p_quelle  text
)
returns void
language plpgsql
as $$
declare
  v_neu    integer;
  v_quelle text;
begin
  insert into public.besuch_kennungen (tag, kennung, quelle)
  values (p_tag, p_kennung, p_quelle)
  on conflict (tag, kennung) do nothing;
  get diagnostics v_neu = row_count;  -- 1 = erster Aufruf dieser Kennung heute, 0 = bekannt

  if v_neu = 1 then
    v_quelle := p_quelle;
    -- Erste Kennung eines neuen Tages: Kennungen früherer Tage entfernen. Das
    -- ist die zweite Sicherung neben dem Cron – die Löschung hängt so nicht
    -- allein an einem externen Zeitplaner.
    if (select count(*) from public.besuch_kennungen where tag = p_tag) = 1 then
      delete from public.besuch_kennungen where tag < p_tag;
    end if;
  else
    select k.quelle into v_quelle
    from public.besuch_kennungen k
    where k.tag = p_tag and k.kennung = p_kennung;
    -- Wurde die Kennung zwischen Einfügen und Lesen von der Aufräumung entfernt
    -- (nur denkbar um Mitternacht), gilt die Quelle dieses Aufrufs – statt eines
    -- NULL, das die NOT-NULL-Spalte der Quellentabelle verletzen würde.
    v_quelle := coalesce(v_quelle, p_quelle);
  end if;

  insert into public.besuch_summe (tag, besucher, aufrufe)
  values (p_tag, v_neu, 1)
  on conflict (tag) do update
    set besucher = public.besuch_summe.besucher + v_neu,
        aufrufe  = public.besuch_summe.aufrufe + 1;

  insert into public.besuch_seiten (tag, pfad, aufrufe)
  values (p_tag, p_pfad, 1)
  on conflict (tag, pfad) do update
    set aufrufe = public.besuch_seiten.aufrufe + 1;

  insert into public.besuch_quellen (tag, quelle, besucher, aufrufe)
  values (p_tag, v_quelle, v_neu, 1)
  on conflict (tag, quelle) do update
    set besucher = public.besuch_quellen.besucher + v_neu,
        aufrufe  = public.besuch_quellen.aufrufe + 1;
end;
$$;

comment on function public.erfasse_besuch(date, text, text, text) is
  'Zaehlt einen Seitenaufruf atomar. Besucher = neue Tageskennung. Nur ueber den Service-Role-Client aufrufbar.';

/**
 * Liefert die Admin-Auswertung ab p_von in EINEM Aufruf (Tage, meistbesuchte
 * Seiten, Quellen). Aggregation in SQL, weil PostgREST Antworten bei 1000 Zeilen
 * abschneidet – eine clientseitige Summe über besuch_seiten wäre sonst still
 * unvollständig.
 */
create or replace function public.lade_besuchsstatistik(p_von date)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'tage', coalesce((
      select jsonb_agg(jsonb_build_object('tag', s.tag, 'besucher', s.besucher, 'aufrufe', s.aufrufe) order by s.tag)
      from public.besuch_summe s
      where s.tag >= p_von
    ), '[]'::jsonb),
    'seiten', coalesce((
      select jsonb_agg(jsonb_build_object('pfad', t.pfad, 'aufrufe', t.summe) order by t.summe desc, t.pfad)
      from (
        select pfad, sum(aufrufe)::integer as summe
        from public.besuch_seiten
        where tag >= p_von
        group by pfad
        order by sum(aufrufe) desc, pfad
        limit 15
      ) t
    ), '[]'::jsonb),
    'quellen', coalesce((
      select jsonb_agg(jsonb_build_object('quelle', q.quelle, 'besucher', q.b, 'aufrufe', q.a) order by q.b desc, q.quelle)
      from (
        select quelle, sum(besucher)::integer as b, sum(aufrufe)::integer as a
        from public.besuch_quellen
        where tag >= p_von
        group by quelle
      ) q
    ), '[]'::jsonb)
  );
$$;

comment on function public.lade_besuchsstatistik(date) is
  'Admin-Auswertung des Besucherzaehlers ab einem Tag (Tage, Top-15-Seiten, Quellen) als JSON.';

/**
 * Löscht die Tageskennungen früherer Tage. Vom Cron aufgerufen (wie
 * raeume_rate_limit_auf); gibt die Zahl entfernter Zeilen zurück.
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
  return v_entfernt;
end;
$$;

comment on function public.raeume_besuch_kennungen_auf() is
  'Entfernt Tageskennungen frueherer Tage (Europe/Berlin). Die Zaehlerstaende bleiben.';

revoke all on function public.erfasse_besuch(date, text, text, text) from public, anon, authenticated;
revoke all on function public.lade_besuchsstatistik(date) from public, anon, authenticated;
revoke all on function public.raeume_besuch_kennungen_auf() from public, anon, authenticated;
