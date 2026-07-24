-- ═══════════════════════════════════════════════════════════════════════
-- Bestellabschluss härten: Mindestmenge entfernen + Doppelabsendung sperren
-- ═══════════════════════════════════════════════════════════════════════
--
-- ── BEFUND 1: Die Mindestbestellmenge lebte noch in der Datenbank ──────
--
-- 0001 legte an:   check (quantity >= 5)              -- "Mindestbestellmenge"
-- 0002 lockerte:   check (order_type = 'inquiry' or quantity >= 5)
--
-- Für echte BESTELLUNGEN galt damit weiterhin eine Mindestmenge von 5.
-- Inzwischen ist die Mindestbestellmenge fachlich abgeschafft (Privatkunden
-- sind ausdrückliche Zielgruppe; die Wirtschaftlichkeit kleiner Auflagen wird
-- über Rüstkosten und Mengenstaffeln geregelt, nicht über einen Ausschluss).
-- Anwendungsseitig ist das umgesetzt (MINIMUM_QUANTITY = 1), in der Datenbank
-- nicht: eine Bestellung über 1–4 Stück wäre beim Speichern an genau diesem
-- Constraint gescheitert – nach vollständig durchlaufenem Checkout, mit einer
-- nichtssagenden Fehlermeldung und ohne Bestellung.
--
-- Neue Regel: mindestens 1 Stück je Bestellung. Eine unverbindliche Anfrage
-- darf weiterhin ohne Warenkorb-Inhalt gesendet werden (Menge 0).
--
-- ── BEFUND 2: Nichts verhinderte doppelte Bestellungen ────────────────
--
-- Doppelklick, erneutes Absenden nach Zeitüberschreitung oder ein vom Browser
-- wiederholter Request erzeugten jeweils eine ZWEITE echte Bestellung – mit
-- eigener Bestellnummer, eigener Bestätigungsmail und doppelter Fertigung.
--
-- Der Client erzeugt jetzt je Absendevorgang eine unveränderliche Kennung
-- (client_request_id) und schickt sie bei jedem Versuch identisch mit. Der
-- eindeutige Index macht die Datenbank zum letzten Schiedsrichter: selbst bei
-- exakt gleichzeitigen Requests kann nur EINER die Zeile anlegen, der andere
-- läuft in die Verletzung und bekommt die bereits existierende Bestellung
-- zurückgemeldet. Anwendungsseitige Prüfungen allein genügen dafür nicht,
-- weil zwischen "prüfen" und "einfügen" immer eine Lücke bleibt.
--
-- Der Index ist partiell (where client_request_id is not null), damit
-- Altbestellungen ohne Kennung und Bestellungen aus anderen Kanälen (z.B.
-- manuell im Adminbereich angelegt) davon unberührt bleiben.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Mindestmenge: 5 → 1 ────────────────────────────────────────────
alter table orders drop constraint if exists orders_quantity_check;
alter table orders add constraint orders_quantity_check
  check (order_type = 'inquiry' or quantity >= 1);

-- ── 2. Idempotenzkennung je Absendevorgang ────────────────────────────
alter table orders add column if not exists client_request_id text;

comment on column orders.client_request_id is
  'Vom Client je Absendevorgang erzeugte, über Wiederholungen hinweg stabile '
  'Kennung. Verhindert, dass Doppelklick, Zeitüberschreitung oder ein '
  'wiederholter Request eine zweite Bestellung erzeugen.';

create unique index if not exists orders_client_request_id_unique
  on orders (client_request_id)
  where client_request_id is not null;
