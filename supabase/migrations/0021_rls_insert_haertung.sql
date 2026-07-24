-- ═══════════════════════════════════════════════════════════════════════
-- 0021: RLS-Härtung – öffentlichen Direktschreibweg auf die Bestell-Tabellen
--        vollständig entfernen (Policies UND Grants)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Befund (Betriebsreview 2026-07-23, B1):
-- `orders`, `order_items` und `configuration_elements` trugen aus 0001 je eine
-- INSERT-Policy `with check (true)` für die Rolle `public`. Zusammen mit den
-- Supabase-Standard-Grants (anon/authenticated haben INSERT) konnte damit JEDE
-- Person mit dem öffentlich ausgelieferten Publishable-Key direkt über die
-- Supabase-REST-API Zeilen einfügen – vorbei an Serverpreis, Validierung,
-- Rate-Limit und `create_order_atomic`.
--
-- NACHGEWIESEN ausnutzbar: Ein INSERT ohne RETURNING (REST `Prefer:
-- return=minimal`) legte real eine Zeile an (HTTP 201). Die „violates RLS"-
-- Abweisung trat nur bei `return=representation` auf – sie kam vom Zurücklesen
-- (fehlende SELECT-Policy), nicht vom Einfügen.
--
-- Migration 0008 beschrieb genau diesen Fix (Drop der Policies), wurde aber nie
-- auf die Produktiv-DB angewendet (die Policies waren beim Review noch live).
-- 0021 zieht den Drop idempotent nach UND ergänzt den Widerruf der Grants.
--
-- ── Warum das gefahrlos ist ───────────────────────────────────────────
-- Der gesamte Anwendungscode fügt diese drei Tabellen AUSSCHLIESSLICH über den
-- Service-Role-Client (`createAdminClient`) ein – geprüft im Review:
--   • einziger Schreibweg = `create_order_atomic` (RPC, via Service-Role)
--   • kein `.insert()`/`.upsert()` auf diese Tabellen im übrigen Code
--   • der Browser-/anon-Client (src/lib/supabase/client.ts) wird NIRGENDS genutzt
-- Der Service-Role-Key umgeht RLS und Grants ohnehin (rolbypassrls). Nach dieser
-- Migration bleibt RLS aktiv OHNE INSERT-Policy = Default-Deny; zusätzlich fehlt
-- anon/authenticated jedes Tabellenrecht. Der normale Bestellweg ist unberührt.
--
-- Rein additiv/sicher: kein Datenverlust, keine Schema-Änderung.

-- ── 1. Öffentliche INSERT-Policies entfernen (vollendet 0008) ──────────
drop policy if exists "Jeder darf Bestellung anlegen"            on public.orders;
drop policy if exists "Jeder darf Bestellposition anlegen"       on public.order_items;
drop policy if exists "Jeder darf Konfigurationselement anlegen" on public.configuration_elements;

-- ── 2. Nicht benötigte Tabellenrechte widerrufen (Defense in Depth) ────
-- anon/authenticated haben auf diesen Tabellen nichts zu suchen: keine
-- Lese-Policy (Kundendaten sind nicht öffentlich), kein Schreibweg (nur
-- serverseitig). Der Entzug wirkt zusätzlich zum Policy-Drop: Ein versehentlich
-- später wieder angelegter permissiver Policy-Eintrag liefe damit weiterhin ins
-- Leere, weil schon das Tabellenrecht fehlt.
revoke all privileges on public.orders                 from anon, authenticated;
revoke all privileges on public.order_items            from anon, authenticated;
revoke all privileges on public.configuration_elements from anon, authenticated;

-- Hinweis: `service_role` und `postgres` behalten ihre Rechte; der Bestellweg
-- (Service-Role) funktioniert unverändert. RLS bleibt auf allen drei Tabellen
-- aktiviert (aus 0001).
