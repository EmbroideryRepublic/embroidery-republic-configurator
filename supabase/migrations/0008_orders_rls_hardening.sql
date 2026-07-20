-- ═══════════════════════════════════════════════════════════════════════
-- 0008: RLS-Härtung – öffentliche INSERT-Policies auf Bestell-Tabellen
--        entfernen (Defense in Depth)
-- ═══════════════════════════════════════════════════════════════════════
-- Ausgangslage (0001): orders/order_items/configuration_elements hatten je eine
-- INSERT-Policy `with check (true)`. Damit konnte JEDER mit dem öffentlichen
-- Publishable-Key (steht im Client-Bundle) direkt gegen die Supabase-REST-API
-- Bestellungen einfügen – UNTER UMGEHUNG der Server Action (submitOrder) und
-- damit ohne Validierung/Preisberechnung.
--
-- Der Anwendungscode fügt Bestellungen AUSSCHLIESSLICH serverseitig über den
-- Service-Role-Client (createAdminClient, umgeht RLS) ein – die öffentlichen
-- INSERT-Policies werden also nie benötigt und sind reine Angriffsfläche.
-- Nach dem Entfernen bleibt RLS aktiv OHNE Policy = Default-Deny für den
-- anon/Publishable-Key; der Service-Role-Client funktioniert unverändert weiter.
--
-- Rein additiv/sicher: kein Datenverlust, keine Schema-Änderung.

drop policy if exists "Jeder darf Bestellung anlegen"          on orders;
drop policy if exists "Jeder darf Bestellposition anlegen"     on order_items;
drop policy if exists "Jeder darf Konfigurationselement anlegen" on configuration_elements;

-- Hinweis: RLS bleibt auf allen drei Tabellen aktiviert (aus 0001). Ohne
-- verbleibende Policy ist damit jeder Zugriff über den anon-Key verweigert;
-- Lesen/Schreiben erfolgt nur noch serverseitig über den Service-Role-Key.
