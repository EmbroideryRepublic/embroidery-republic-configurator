-- ═══════════════════════════════════════════════════════════════════════
-- 0022 – DSGVO-LÖSCHKONZEPT: automatisierte Aufbewahrung/Anonymisierung
-- ═══════════════════════════════════════════════════════════════════════
--
-- Setzt docs/dsgvo-loeschkonzept.md technisch um (Audit-Punkt H6, bislang
-- offen: "kein Löschkonzept, keine Aufbewahrungsfrist, kein Anonymisierungs-
-- lauf"). Die Fristen selbst stehen bereits im Text der Datenschutzerklärung
-- (src/app/datenschutz/page.tsx, Ziffer 10) – diese Migration setzt sie nur
-- tatsächlich durch, statt sie nur zu versprechen.
--
-- ── Zwei getrennte Mechanismen für zwei verschiedene Fälle ─────────────
--
-- 1. ANFRAGEN ohne Vertrag (order_type = 'inquiry'): Es gibt keine
--    gesetzliche Aufbewahrungspflicht. Ziffer 10 verspricht "spätestens
--    nach sechs Monaten". `loesche_alte_anfragen()` löscht sie HART
--    (cascade auf order_items/configuration_elements aus 0001). Die
--    zugehörigen Speicherdateien werden dadurch zu verwaisten Ordnern und
--    beim nächsten Lauf von `npm run dateien:pruefen` mitentfernt – dafür
--    ist kein zweiter Mechanismus nötig.
--
-- 2. BESTELLUNGEN (order_type = 'order'): Rechnungsrelevante Daten
--    (Name, Anschrift, Positionen, Preise, Steuer) müssen § 147 AO / § 257
--    HGB folgend 10 Jahre aufbewahrt werden – ein Recht auf Löschung
--    besteht in dieser Zeit NICHT (Art. 17 Abs. 3 lit. b DSGVO). Erst NACH
--    Ablauf der Frist verliert die Aufbewahrung ihre Rechtsgrundlage;
--    `anonymisiere_alte_bestellungen()` ANONYMISIERT dann die
--    personenbezogenen Felder, behält aber Zeile, Positionen und Beträge
--    für Auswertungen/Finanzarchiv (kein Fremdschlüssel bricht).
--
--    Kundenlogos/Motivdateien sind NICHT rechnungsrelevant und müssen nicht
--    10 Jahre aufbewahrt werden. Ihre (deutlich frühere) Löschung ist ein
--    Speicher-Vorgang, keine SQL-Frage – siehe scripts/dsgvoAltdateien.mts.
--
-- ── Warum hier keine automatische Ausführung erzwungen wird ────────────
-- Beide Funktionen werden von der Cron-Route aufgerufen (siehe
-- process-supplier-orders/route.ts), genau wie die bestehenden
-- raeume_*-Läufe. Das ist unkritisch: Bei den heutigen zehn Testbestellungen
-- (alle Juli/August 2026) greift keine der beiden Bedingungen – die
-- Funktionen sind bis dahin dauerhaft ein no-op. Erst mit echtem Alter der
-- Daten wird überhaupt etwas verändert, und dann nur exakt das, was Ziffer
-- 10 der Datenschutzerklärung ohnehin bereits verspricht.

-- ── Merkt, welche Bestellung bereits anonymisiert wurde (Idempotenz) ────
alter table public.orders
  add column if not exists anonymized_at timestamptz;

comment on column public.orders.anonymized_at is
  'Zeitpunkt der DSGVO-Anonymisierung (10 Jahre nach Bestelldatum). NULL = '
  'noch nicht faellig oder Anfrage (Anfragen werden geloescht, nicht '
  'anonymisiert). Verhindert, dass ein wiederholter Lauf bereits '
  'anonymisierte Zeilen erneut anfasst.';

/**
 * Löscht Anfragen (order_type = 'inquiry'), die nicht zu einem Vertrag
 * geführt haben und älter als p_monate sind. Betrifft NIEMALS
 * order_type = 'order' – die Bedingung ist Teil der WHERE-Klausel, nicht
 * optional.
 *
 * Rückgabe: Anzahl gelöschter Zeilen.
 */
create or replace function public.loesche_alte_anfragen(p_monate integer default 6)
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.orders
  where order_type = 'inquiry'
    and created_at < now() - make_interval(months => p_monate);
  get diagnostics v_entfernt = row_count;
  return v_entfernt;
end;
$$;

/**
 * Anonymisiert Bestellungen (order_type = 'order'), deren gesetzliche
 * Aufbewahrungsfrist abgelaufen ist. Ersetzt personenbezogene Felder durch
 * neutrale Platzhalter; Positionen, Preise und Steuerdaten bleiben
 * UNVERÄNDERT (kein Datenverlust für Auswertungen, keine Fremdschlüssel-
 * Verletzung in order_items/configuration_elements).
 *
 * `email` bleibt bewusst NOT NULL-konform (Schema-Vorgabe aus 0001): statt
 * NULL ein je Bestellung eindeutiger, klar erkennbarer Platzhalter.
 *
 * shipping_country bleibt bewusst erhalten – kein Personenbezug, aber
 * weiterhin nützlich für langfristige Auswertungen (z.B. Länderanteile).
 *
 * Idempotent über `anonymized_at is null`: ein wiederholter Lauf ändert
 * bereits anonymisierte Zeilen nicht erneut an.
 *
 * Rückgabe: Anzahl anonymisierter Zeilen.
 */
create or replace function public.anonymisiere_alte_bestellungen(p_jahre integer default 10)
returns integer
language plpgsql
as $$
declare
  v_betroffen integer;
begin
  update public.orders
  set customer_name = 'Anonymisiert',
      company = null,
      email = 'anonymisiert+' || id::text || '@geloescht.invalid',
      phone = null,
      message = null,
      shipping_street = null,
      shipping_zip = null,
      shipping_city = null,
      anonymized_at = now()
  where order_type = 'order'
    and anonymized_at is null
    and created_at < now() - make_interval(years => p_jahre);
  get diagnostics v_betroffen = row_count;
  return v_betroffen;
end;
$$;

revoke all on function public.loesche_alte_anfragen(integer) from public, anon, authenticated;
revoke all on function public.anonymisiere_alte_bestellungen(integer) from public, anon, authenticated;
