-- Erlaubt dem Admin-Bereich, eine stornierte Bestellung ECHT zu löschen –
-- aber nur, wenn dafür nie eine Rechnungsnummer vergeben wurde. Bestellungen
-- mit Rechnungsnummer bleiben absichtlich unlöschbar (nur "Stornieren"), um
-- die fortlaufende Rechnungsnummerierung/den Prüfpfad nicht zu zerstören –
-- exakt das Muster, das diese Anwendung für Testbestellungen die ganze Zeit
-- schon per Konvention einhält (storniert statt gelöscht), jetzt als
-- erzwungene DB-Bedingung statt reiner Disziplin.
--
-- Die Bedingung sitzt IM selben DELETE-Statement (kein vorheriges SELECT +
-- späteres DELETE) – kein TOCTOU-Fenster, in dem sich der Zustand zwischen
-- Prüfung und Löschung ändern könnte.
--
-- Kaskadierende Löschung: order_items, configuration_elements, order_events,
-- supplier_orders (und darüber supplier_order_events) hängen alle bereits
-- mit "on delete cascade" an orders(id) (siehe 0001, 0005, 0006, 0009) – ein
-- einzelnes DELETE auf orders genügt, keine manuellen Einzel-Deletes nötig.
create or replace function public.loesche_stornierte_bestellung(p_order_id uuid)
returns table (order_id uuid) language sql as $$
  delete from public.orders
  where id = p_order_id
    and status = 'cancelled'
    and invoice_number is null
  returning id;
$$;

revoke all on function public.loesche_stornierte_bestellung(uuid) from public, anon, authenticated;
