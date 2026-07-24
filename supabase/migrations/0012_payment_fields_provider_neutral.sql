-- ═══════════════════════════════════════════════════════════════════════
-- Zahlungsfelder: anbieterneutral benennen + fehlende Angaben ergänzen
-- ═══════════════════════════════════════════════════════════════════════
--
-- Vorbereitung der Zahlungsabwicklung (docs/zahlungsarchitektur.md, Stufe S1).
--
-- ── Was diese Migration BEWUSST NICHT tut ─────────────────────────────
-- Keine neue Tabelle. Die zunächst vorgeschlagenen Tabellen `payments` und
-- `payment_events` wurden nach Prüfung verworfen: Der aktuelle Zahlungszustand
-- gehört an `orders`, der Verlauf nach `order_events` – dasselbe Verhältnis
-- wie zwischen `orders.status` und der Statushistorie. Die Begründung samt
-- der Punkte, an denen diese Entscheidung kippen würde, steht in
-- docs/zahlungsarchitektur.md, Abschnitt 4a.
--
-- ── Rückwärtskompatibilität ───────────────────────────────────────────
-- Diese Migration ändert KEIN Verhalten. Alle drei neuen Spalten sind
-- NULL-bar und werden von keinem bestehenden Ablauf gelesen. Die beiden
-- umbenannten Spalten sind nachweislich leer: sie wurden mit 0004 angelegt,
-- aber nie beschrieben (im Code geprüft – keine einzige Fundstelle). Ein
-- Rollback wäre eine reine Rückbenennung.
--
-- Alle Schritte sind wiederholbar: Ein zweiter Durchlauf ist wirkungslos
-- statt fehlerhaft. Die Migrationen werden hier von Hand angewendet
-- (kein Supabase-CLI in dieser Umgebung), deshalb darf ein versehentlich
-- doppelter Lauf nichts kaputtmachen.
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. Anbieterneutrale Benennung ─────────────────────────────────────
--
-- BEFUND: Die Spalten aus 0004 hießen `stripe_*`. Damit wäre das Datenmodell
-- an einen einzigen Anbieter gebunden gewesen; PayPal hätte eigene Spalten
-- gebraucht und jede Auswertung eine Fallunterscheidung.
--
-- Die beiden Felder bezeichnen zwei VERSCHIEDENE Dinge, die beide gebraucht
-- werden – es ist keine Verdopplung:
--   payment_reference      = der VORGANG   (Stripe-Session, PayPal-Order)
--                            → nötig, um einen Bezahlvorgang fortzusetzen
--   payment_transaction_id = die BUCHUNG   (PaymentIntent, Capture)
--                            → nötig, um später zu erstatten
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'orders'
       and column_name = 'stripe_checkout_session_id'
  ) then
    alter table public.orders rename column stripe_checkout_session_id to payment_reference;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'orders'
       and column_name = 'stripe_payment_intent_id'
  ) then
    alter table public.orders rename column stripe_payment_intent_id to payment_transaction_id;
  end if;

  -- Der eindeutige Index wandert bei einer Spaltenumbenennung automatisch
  -- mit, behält aber seinen alten Namen. Ohne diese Umbenennung hieße er
  -- weiterhin idx_orders_stripe_* und wäre irreführend.
  if exists (select 1 from pg_class where relname = 'idx_orders_stripe_checkout_session_id') then
    alter index idx_orders_stripe_checkout_session_id rename to idx_orders_payment_reference;
  end if;
end $$;


-- ── 2. Gewählte Zahlungsart festhalten ────────────────────────────────
--
-- BEFUND: Die Zahlungsart wurde NIRGENDS gespeichert. Sie lag nur im
-- transienten Datensatz für die Bestätigungsmail und war danach verloren.
-- Solange es ausschließlich Rechnungskauf gab, fiel das nicht auf; sobald
-- mehrere Zahlungsarten existieren, kann ohne diese Angabe weder der
-- Adminbereich noch ein Mahnlauf noch eine Erstattung entscheiden, wie
-- verfahren werden muss.
alter table public.orders add column if not exists payment_method text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    -- NULL bleibt zulässig: Anfragen (order_type='inquiry') haben keine
    -- Zahlungsart, und für sie soll auch keine erfunden werden.
    alter table public.orders add constraint orders_payment_method_check
      check (payment_method is null or payment_method in ('invoice', 'card', 'paypal'));
  end if;
end $$;

-- Bestandsdaten: Bis heute war im Checkout `paymentMethod = 'invoice'` fest
-- verdrahtet (CartDrawer.tsx) – jede bereits erfasste Bestellung IST ein
-- Rechnungskauf. Das Nachtragen ist damit keine Annahme, sondern eine im
-- Code belegte Tatsache. Es werden ausschließlich leere Felder gefüllt,
-- keine vorhandenen Werte verändert.
update public.orders
   set payment_method = 'invoice'
 where payment_method is null
   and order_type = 'order';


-- ── 3. Wer die Zahlung abgewickelt hat ────────────────────────────────
--
-- 'card' sagt nicht, WER abgewickelt hat. Für eine Erstattung Jahre später
-- ist genau das die entscheidende Angabe: ohne sie ist `payment_reference`
-- nicht deutbar. Bleibt NULL beim Rechnungskauf – dort gibt es keinen
-- Zahlungsdienstleister.
alter table public.orders add column if not exists payment_provider text;


-- ── 4. Beginn des laufenden Bezahlvorgangs ────────────────────────────
--
-- Wird für den Verfall unbezahlter Bezahlvorgänge gebraucht.
--
-- Warum eine eigene Spalte und nicht wie sonst aus `created_at` berechnet
-- (Muster: orderVisibility): Nach einer Wiederaufnahme ist `created_at` alt,
-- der neue Versuch aber frisch – er würde sofort als verfallen gelten.
-- Und warum nicht aus `order_events` ableiten: Die Historie ist laut eigener
-- Festlegung „Nachweis, nicht Steuerung" und darf keinen Ablauf steuern.
alter table public.orders add column if not exists payment_started_at timestamptz;


comment on column public.orders.payment_method is
  'Vom Kunden gewählte Zahlungsart. NULL bei Anfragen.';
comment on column public.orders.payment_provider is
  'Abwickelnder Dienstleister (z.B. stripe). NULL beim Rechnungskauf. Macht payment_reference deutbar.';
comment on column public.orders.payment_reference is
  'Referenz des Bezahl-VORGANGS beim Dienstleister – zum Fortsetzen einer unterbrochenen Zahlung.';
comment on column public.orders.payment_transaction_id is
  'Referenz der BUCHUNG beim Dienstleister – Grundlage für Erstattungen.';
comment on column public.orders.payment_started_at is
  'Beginn des laufenden Bezahlvorgangs. Grundlage für den Verfall; wird bei jeder Wiederaufnahme neu gesetzt.';
