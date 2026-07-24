-- ═══════════════════════════════════════════════════════════════════════
-- Positionsgesamtpreis speichern statt ableiten
-- ═══════════════════════════════════════════════════════════════════════
--
-- Vorbereitung des Zahlungs-Webhooks (docs/zahlungsarchitektur.md, S5).
--
-- ── Warum diese Spalte unverzichtbar ist ──────────────────────────────
--
-- Der Webhook kennt nur die Bestell-ID und muss den Bestelldatensatz aus der
-- Datenbank rekonstruieren, um die Bestellung abzuschließen (Druckvorschauen,
-- Produktionsblatt, Bestätigungsmail). Alle dafür nötigen Felder stehen
-- bereits in `order_items` – bis auf den Positionsgesamtpreis.
--
-- Naheliegend wäre, ihn als `unit_price * quantity` abzuleiten. Das ist
-- FALSCH, und zwar messbar:
--
--   `calculatePrice` liefert als `unitPrice` den EFFEKTIVEN Stückpreis,
--   also `totalPrice / quantity`, auf Cent gerundet. Beim Zurückmultipli-
--   zieren geht der Rundungsrest verloren – multipliziert mit der Menge.
--
--   Belegt an echten Bestellungen aus unseren eigenen Testläufen:
--     7,88 € x  3 = 23,64 €  – gespeichert waren 23,65 €  (1 Cent Differenz)
--     6,69 € x 10 = 66,90 €  – gespeichert waren 66,93 €  (3 Cent Differenz)
--   Bei 90 Stück summiert sich die Abweichung auf bis zu 33 Cent.
--
-- Folge ohne diese Spalte: In Bestätigungsmail und Produktionsblatt stünde
-- ein Positionspreis, der nicht zur Gesamtsumme passt. Die Einzelposten
-- ergäben addiert nicht den Rechnungsbetrag – bei einer echten Rechnung ein
-- kaufmännischer Fehler, kein Schönheitsfehler.
--
-- ── Was hier ausdrücklich NICHT der Grund ist ─────────────────────────
-- Eine frühere Notiz nannte Rüstkosten als Grund. Das war unzutreffend:
-- Rüstkosten stecken bereits im `unit_price`, weil `calculatePrice` den
-- effektiven Stückpreis inklusive anteiliger Einrichtung zurückgibt. Der
-- Grund ist allein die Rundung.
--
-- ── Rückwärtskompatibilität ───────────────────────────────────────────
-- Die Spalte ist NULL-bar und wird von keinem bestehenden Ablauf gelesen.
-- Für die vorhandenen Positionen wird der bestmögliche Wert nachgetragen
-- (siehe unten) – diese Bestellungen sind abgeschlossen, ihr Abschluss läuft
-- nie erneut. Wiederholtes Anwenden ist wirkungslos statt fehlerhaft.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.order_items add column if not exists total_price numeric(10,2);

comment on column public.order_items.total_price is
  'Gesamtpreis dieser Position, wie er der Kundschaft bestätigt wurde. '
  'Bewusst gespeichert statt aus unit_price x quantity abgeleitet: unit_price '
  'ist der auf Cent gerundete EFFEKTIVE Stückpreis, die Rückmultiplikation '
  'weicht je nach Menge um mehrere Cent ab.';

-- ── Bestandsdaten ─────────────────────────────────────────────────────
-- Für bereits erfasste Positionen ist der exakte Wert nicht mehr
-- rekonstruierbar – er existierte nur im Speicher. Nachgetragen wird die
-- bestmögliche Näherung `unit_price * quantity`.
--
-- Das ist vertretbar, weil diese Bestellungen abgeschlossen sind: Ihre
-- Bestätigungsmails sind längst verschickt, ihre Produktionsblätter erzeugt.
-- Der Wert dient hier nur noch der Anzeige im Adminbereich. Für ALLE
-- künftigen Bestellungen wird der echte Wert geschrieben.
update public.order_items
   set total_price = round(unit_price * quantity, 2)
 where total_price is null;
