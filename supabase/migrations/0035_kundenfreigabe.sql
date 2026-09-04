-- Kundenfreigabe der Druckvorschau vor Produktionsstart.
--
-- FAQ und "Über uns" versprechen der Kundschaft wörtlich eine "finale
-- Vorschau zur Freigabe" vor Produktionsbeginn (src/app/faq/page.tsx,
-- src/app/ueber-uns/page.tsx) – dieser Schritt existierte bislang nirgends
-- im Code. Die Druckvorschauen selbst werden bereits seit Phase 2 des
-- Bestellabschlusses automatisch gerendert (orderCompletion.ts); es fehlte
-- nur die Anzeige an die Kundschaft und ein echter Bestätigungsschritt.
--
-- Zwei nullable Zeitstempel genügen. Bewusst KEINE dritte Spalte für einen
-- "Änderung gewünscht"-Kommentar: der landet als `reason` in einem
-- order_events-Eintrag (eventType 'proof_change_requested') – dieselbe
-- Historie, die die Bestell-Verlaufsansicht im Admin ohnehin zeigt, statt
-- denselben Inhalt an zwei Stellen zu pflegen.
alter table public.orders
  add column if not exists freigabe_angefragt_am timestamptz,
  add column if not exists freigabe_erteilt_am timestamptz;

comment on column public.orders.freigabe_angefragt_am is
  'Zeitpunkt, zu dem der Betreiber die Druckvorschau zur Kundenfreigabe verschickt hat (kann bei erneutem Versand ueberschrieben werden). null = noch nicht angefragt.';
comment on column public.orders.freigabe_erteilt_am is
  'Zeitpunkt, zu dem die Kundschaft die Vorschau freigegeben hat. Zusaetzliche, von produktionsfreigabeErlaubt() unabhaengige Bedingung fuer den Uebergang new -> in_production, siehe orderService.ts::setzeBestellstatus.';
