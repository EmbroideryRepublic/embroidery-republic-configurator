-- ═══════════════════════════════════════════════════════════════════════
-- 0009: Selbststornierung durch den Kunden innerhalb der Stornofrist
-- ═══════════════════════════════════════════════════════════════════════
-- Fachlicher Ablauf: Eine Bestellung wird sofort gespeichert, der Kunde
-- erhält sofort seine Bestätigung mit Storno-Link. Danach passiert für die
-- Dauer der Stornofrist BEWUSST nichts: keine interne Benachrichtigung,
-- kein Lieferantenauftrag, keine Sichtbarkeit im Adminbereich. Erst nach
-- Fristablauf geht die Bestellung in die Bearbeitung über.
--
-- WICHTIG – wie „Frist abgelaufen" ermittelt wird:
-- Es gibt bewusst KEIN Feld „ist_sichtbar" und keinen Hintergrundjob, der
-- zu einem Zeitpunkt etwas umschaltet. Der Zustand wird IMMER aus
-- created_at + Stornofrist BERECHNET (serverseitig). Damit kann nichts
-- hängenbleiben, es gibt keinen Wiederanlauf und keinen Zustand, der von
-- der Realität abweichen könnte.
--
-- Der Status 'cancelled' existiert bereits (0004) – hier kommen nur die
-- begleitenden Nachweis-Felder dazu.

alter table public.orders
  -- Zeitpunkt der Stornierung. NULL = nicht storniert. Dient als Nachweis;
  -- maßgeblich für die Logik bleibt status = 'cancelled'.
  add column if not exists cancelled_at timestamptz,

  -- Wer storniert hat. Heute nur 'customer' (Selbststornierung über den
  -- signierten Link); 'admin' ist für eine spätere Kulanzstornierung
  -- vorgesehen, die derzeit telefonisch läuft.
  add column if not exists cancellation_source text
    check (cancellation_source in ('customer', 'admin')),

  -- Resend-Nachrichten-ID der VERZÖGERT geplanten internen Benachrichtigung.
  -- Wird beim Stornieren genutzt, um die geplante Mail zurückzuziehen.
  -- BEWUSST nur ein Hilfsfeld: Schlägt das Zurückziehen fehl, hat das
  -- KEINERLEI Auswirkung auf den Bestellstatus oder den Bearbeitungsablauf.
  -- Führende Quelle ist ausschließlich diese Datenbank.
  add column if not exists internal_notification_email_id text;

-- Die Adminliste fragt „nicht storniert und älter als die Stornofrist" ab.
-- Der Index deckt die Sortierung (created_at) samt Statusfilter ab.
create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

-- ── Ereignis-Historie der Bestellung ───────────────────────────────────
-- Append-only, nach demselben Muster wie supplier_order_events (0006).
--
-- Zweck: jederzeit nachvollziehen, was mit einer Bestellung passiert ist –
-- storniert (wann, durch wen), Lieferantenprozess gestartet, künftig auch
-- Lagerreservierung, Rechnungsversand, Versandinformationen.
--
-- Bewusst OFFEN gehalten: `event_type` ist Freitext und `detail` ein
-- JSONB-Feld. Ein neues Ereignis braucht damit KEINE Migration – es wird
-- einfach geschrieben. Genau deshalb ist die Historie später ohne Umbau
-- erweiterbar.
--
-- Diese Tabelle wird AUSSCHLIESSLICH von orderService beschrieben; sie ist
-- die Begleiterscheinung der zentralen Geschäftslogik, kein eigener Kanal.
create table if not exists public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  at          timestamptz not null default now(),
  -- z.B. 'cancelled', 'processing_released', 'supplier_process_started',
  -- später 'stock_released', 'invoice_sent', 'shipped' – frei erweiterbar.
  event_type  text not null,
  from_status text,
  to_status   text,
  -- Menschlich lesbarer Grund für die Admin-Anzeige.
  reason      text,
  -- Strukturierte Zusatzdaten ohne Schemaänderung.
  detail      jsonb
);

create index if not exists order_events_order_id_at_idx
  on public.order_events (order_id, at desc);

-- Wie orders selbst: Zugriff ausschließlich serverseitig über den
-- Service-Role-Client. RLS aktiv OHNE Policy = Default-Deny für den
-- öffentlichen Schlüssel (siehe 0008).
alter table public.order_events enable row level security;

comment on table public.order_events is
  'Append-only Historie einer Bestellung. Wird ausschließlich von orderService geschrieben.';

comment on column public.orders.cancelled_at is
  'Zeitpunkt der Stornierung (NULL = nicht storniert). Nachweis; maßgeblich ist status.';
comment on column public.orders.cancellation_source is
  'customer = Selbststornierung über signierten Link, admin = Kulanzstornierung.';
comment on column public.orders.internal_notification_email_id is
  'Resend-ID der geplanten internen Benachrichtigung. Reines Hilfsfeld für das Zurückziehen – nie geschäftskritisch.';
