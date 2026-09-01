-- ═══════════════════════════════════════════════════════════════════════
-- 0033 – BESTELLBESTÄTIGUNG: NUR NACH BESTÄTIGTER ZAHLUNG VERSCHICKEN
-- ═══════════════════════════════════════════════════════════════════════
--
-- Hintergrund (Zustandslogik-Audit vom 2026-09-01, echter PayPal-Live-Test,
-- vor dem geplanten Deploy der E-Mail-Konsolidierung): `beanspruche_
-- bestellbestaetigung` (Migration 0030, 2026-08-21) prüft NUR
-- `order_confirmation_sent_at IS NULL AND order_confirmation_versuch_
-- gestartet_am IS NULL` – anders als JEDE andere Claim-Funktion in diesem
-- Bereich (`beanspruche_abschluss`, Migration 0020; `beanspruche_
-- rechnungserstellung`, Migration 0026) prüft sie NICHT payment_status.
--
-- Für eine Bestellung mit Vorabzahlung (Karte/PayPal), die noch NIE über
-- Phase 2 lief (weil die Zahlung noch nicht bestätigt ist), sind beide
-- Zeitstempel ebenfalls NULL – nicht weil ein Versand fehlschlug, sondern
-- weil noch NIE einer versucht wurde. `holeOffeneBestellbestaetigungenNach`
-- (orderCompletion.ts, vom Cron-Endpunkt alle paar Minuten aufgerufen) holt
-- serverseitig GENAU diese Bestellungen und lässt `beanspruche_
-- bestellbestaetigung` den Anspruch erteilen, ohne dass die Zahlung jemals
-- bestätigt wurde.
--
-- Real reproduziert in der Produktionsdatenbank (eigene Testbestellungen,
-- keine echten Kund*innen betroffen):
--   c9b76029-fd4c-4cd9-9bc0-5d0d2ded006e (PayPal, payment_status weiterhin
--     'pending') erhielt am 2026-09-01T00:03:25Z eine Bestellbestätigung,
--     obwohl die Zahlung nie bestätigt wurde.
--   11536d70-a38c-431f-bce1-99feff7b4993 (Karte, payment_status 'failed')
--     erhielt am 2026-08-25T14:21:08Z ebenfalls eine Bestellbestätigung.
--
-- Vor der für 2026-09-01 geplanten E-Mail-Konsolidierung war der Text an
-- dieser Stelle bereits ebenso falsch ("Die Zahlung ist bereits per ...
-- bei uns eingegangen"), nur weniger prominent formuliert – dieser Fix
-- behebt die zugrunde liegende Zustandslücke, nicht nur den Text.
--
-- ── Der Fix ────────────────────────────────────────────────────────────
-- Exakt dieselbe Bedingung wie bei `beanspruche_rechnungserstellung`
-- (Migration 0026) und `holeOffeneRechnungenNach`/`holeOffeneAbschluesseNach`:
-- `payment_status in ('paid', 'not_required')`. Rechnungskauf
-- (`not_required`) bleibt dadurch unverändert sofort bestätigbar; Karte/
-- PayPal erst NACH dem bestätigenden Webhook. Rein NARROWER als vorher –
-- ein zuvor gültiger Anspruch bleibt gültig, nur ein bisher fälschlich
-- gültiger (unbezahlte Vorabzahlung) wird jetzt korrekt verweigert.

create or replace function public.beanspruche_bestellbestaetigung(p_order_id uuid)
returns table (order_id uuid)
language sql
as $$
  update public.orders
  set order_confirmation_versuch_gestartet_am = now()
  where id = p_order_id
    and order_type = 'order'
    and payment_status in ('paid', 'not_required')
    and order_confirmation_sent_at is null
    and order_confirmation_versuch_gestartet_am is null
  returning id;
$$;

revoke all on function public.beanspruche_bestellbestaetigung(uuid) from public, anon, authenticated;
