-- ═══════════════════════════════════════════════════════════════════════
-- 0028 – EIGENER RECHNUNGSNUMMERNKREIS DER WEBSITE
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bislang vergab AUSSCHLIESSLICH Lexware die Rechnungsnummer (siehe
-- lib/invoicing/types.ts, Kopfkommentar) – § 14 Abs. 4 Nr. 4 UStG verlangt
-- eine eindeutige, im Regelfall lückenlose Nummer, und diese Verantwortung
-- lag bewusst bei einem echten Buchhaltungssystem statt einer selbstgebauten
-- Zählung. Da Lexware produktiv nie lief (LEXWARE_API_KEY nie gesetzt) und
-- zugunsten der separaten lokalen Buchhaltungs-Anwendung aufgegeben wird,
-- braucht die Website jetzt eine eigene, ebenso robuste Zählung.
--
-- ── Warum keine Postgres-SEQUENCE ──────────────────────────────────────
-- Ein SEQUENCE-Objekt ist NICHT transaktionssicher rückrollbar (ein
-- fehlgeschlagener Aufruf "verbraucht" die Nummer trotzdem, ohne dass das
-- irgendwo nachvollziehbar wäre) und lässt sich schlechter mit dem Rest
-- dieses additiven, kommentierten Schemas vereinbaren. Stattdessen: eine
-- gesperrte Zählertabelle (ein Zeilen-Lock je Jahr) plus EINE atomare
-- "INSERT ... ON CONFLICT ... RETURNING"-Funktion – exakt das Muster, das
-- die separate lokale Buchhaltungs-Anwendung für ihre eigenen Rechnungen
-- bereits nutzt (Rechnungsnummernkreis, jahresbasiert).
--
-- ── Präfix bewusst "RE-", nicht "ER-" ──────────────────────────────────
-- Die lokale Buchhaltungs-Anwendung zählt für IHRE eigenen (nicht von der
-- Website übernommenen) Rechnungen bereits unabhängig mit dem Präfix
-- "ER-{jahr}-{nummer}". Beide Zähler laufen für dieselbe Rechtsperson,
-- völlig unabhängig voneinander – ein gleiches Präfix könnte zwei
-- verschiedene reale Belege auf denselben Nummernstring kollidieren lassen,
-- ein echtes Eindeutigkeitsproblem nach § 14 UStG, keine Kosmetik. "RE-"
-- ist bewusst disjunkt gewählt.
--
-- ── Wo die Nummer gezogen wird ─────────────────────────────────────────
-- Ausschließlich innerhalb von orderCompletion.ts, erzeugeRechnung() -
-- diese Funktion läuft nur, NACHDEM beanspruche_rechnungserstellung (0026)
-- bereits erfolgreich war, d.h. genau ein Ausführer je Bestellung ist hier
-- aktiv. Der Schutz gegen doppelte Vergabe INNERHALB des Nummernkreises
-- selbst (zwei verschiedene Bestellungen gleichzeitig) kommt allein vom
-- Zeilen-Lock dieser Funktion - keine zusätzliche Anwendungssperre nötig.

create table if not exists public.rechnungsnummernkreise (
  jahr integer primary key,
  letzte_nummer integer not null default 0
);

comment on table public.rechnungsnummernkreise is
  'Ein Zähler je Kalenderjahr für die eigene, von der Website vergebene '
  'Rechnungsnummer (Präfix "RE-", siehe naechste_rechnungsnummer). Nicht zu '
  'verwechseln mit dem unabhängigen lokalen Rechnungsnummernkreis der '
  'separaten Buchhaltungs-Anwendung (Präfix "ER-").';

/**
 * Zieht atomar die nächste Nummer für ein Kalenderjahr und erhöht den
 * Zähler in einem Schritt. "INSERT ... ON CONFLICT ... RETURNING" sperrt
 * die betroffene Zeile für die Dauer der Transaktion - zwei gleichzeitige
 * Aufrufe für dasselbe Jahr serialisieren sich dadurch automatisch,
 * keine höhere Isolationsstufe oder explizite Sperre nötig.
 */
create or replace function public.naechste_rechnungsnummer(p_jahr integer)
returns integer
language sql
as $$
  insert into public.rechnungsnummernkreise (jahr, letzte_nummer)
  values (p_jahr, 1)
  on conflict (jahr) do update
    set letzte_nummer = rechnungsnummernkreise.letzte_nummer + 1
  returning letzte_nummer;
$$;

revoke all on function public.naechste_rechnungsnummer(integer) from public, anon, authenticated;
