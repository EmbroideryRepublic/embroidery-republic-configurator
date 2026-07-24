-- ═══════════════════════════════════════════════════════════════════════
-- 0018 – ADMIN-SITZUNGEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bis hierher war das Admin-Cookie wortgleich das ADMIN_SECRET aus der
-- Umgebung. Jedes Cookie-Leck – Proxy-Log, Browser-Erweiterung,
-- Fehlerbericht, Screenshot – gab damit nicht eine Sitzung preis, sondern
-- das Betriebsgeheimnis selbst. Eine einzelne Sitzung liess sich nicht
-- beenden, ohne alle auszusperren.
--
-- ── Warum nur der Hash gespeichert wird ───────────────────────────────
-- Dieselbe Ueberlegung wie bei Passwoertern: Wer Lesezugriff auf die
-- Datenbank erlangt (Backup, geteilter Auszug, Leck), koennte sich mit
-- einem Klartext-Token sofort als Betreiber ausgeben. Aus dem Hash laesst
-- sich der Token nicht zurueckrechnen.
--
-- Ein einfacher SHA-256 genuegt, anders als bei Passwoertern: Der Token
-- besteht aus 32 Byte eines kryptografischen Zufallsgenerators und ist
-- nicht erratbar. Schluesselstreckung (bcrypt/argon2) schuetzt gegen
-- Woerterbuchangriffe auf schwache Passwoerter – dieses Problem gibt es
-- hier nicht.
--
-- Siehe docs/admin-authentifizierung.md

create table if not exists public.admin_sitzungen (
  id             uuid        primary key default gen_random_uuid(),
  -- SHA-256 des Tokens als Hexadezimaltext. NIE der Token selbst.
  token_hash     text        not null unique,
  erstellt_am    timestamptz not null default now(),
  laeuft_ab_am   timestamptz not null,
  -- Fuer die Anzeige "zuletzt aktiv" im Adminbereich.
  letzter_zugriff timestamptz not null default now(),
  -- Gesetzt beim Abmelden oder beim Beenden aller Zugaenge. Die Zeile
  -- bleibt erhalten, damit ein Zugriff danach als "widerrufen" statt als
  -- "unbekannt" erkennbar ist.
  widerrufen_am  timestamptz,
  -- Grobe Herkunft fuer die Uebersicht. BEWUSST gekuerzt: Eine vollstaendige
  -- IP-Adresse ist ein personenbezogenes Datum.
  herkunft       text
);

comment on table public.admin_sitzungen is
  'Serverseitige Admin-Sitzungen. Speichert ausschliesslich den SHA-256-Hash '
  'des Sitzungstokens, nie den Token und niemals das ADMIN_SECRET.';

-- Der Zugriffspfad: Hash nachschlagen, Gueltigkeit pruefen.
create index if not exists admin_sitzungen_hash_idx on public.admin_sitzungen (token_hash);
-- Fuer den Aufraeumlauf.
create index if not exists admin_sitzungen_ablauf_idx on public.admin_sitzungen (laeuft_ab_am);

-- Wie orders: ausschliesslich serverseitiger Zugriff.
alter table public.admin_sitzungen enable row level security;

/**
 * Entfernt abgelaufene Sitzungen.
 *
 * Erst sieben Tage NACH Ablauf: So bleibt ein Zugriff mit abgelaufenem
 * Token noch eine Weile als "abgelaufen" erkennbar statt als "unbekannter
 * Token" – das erleichtert die Fehlersuche und unterscheidet einen normalen
 * Ablauf von einem manipulierten Cookie.
 */
create or replace function public.raeume_admin_sitzungen_auf()
returns integer
language plpgsql
as $$
declare
  v_entfernt integer;
begin
  delete from public.admin_sitzungen
  where laeuft_ab_am < now() - interval '7 days';
  get diagnostics v_entfernt = row_count;
  return v_entfernt;
end;
$$;

revoke all on function public.raeume_admin_sitzungen_auf() from public, anon, authenticated;
