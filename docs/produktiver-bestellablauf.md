# Produktiver Bestellablauf – Analyse, Roadmap & Umsetzungsstand

Stand: Juli 2026 · Ziel: eine reale Kundenbestellung zuverlässig,
nachvollziehbar und ohne manuelle Eingriffe bis zur erfolgreichen
Lieferantenbestellung verarbeiten.

## 1. Ist-Analyse (End-to-End)

```
Kunde ─▶ Konfigurator ─▶ Warenkorb ─▶ Checkout
        submitOrder() [orders.ts]
          • Validierung (Pflichtfelder, client+server)                     ✅
          • orders/order_items/configuration_elements speichern            ✅
          • Druckvorschau-PNGs + Produktionsblatt-PDF (Storage)            ✅
          • Bestell-/interne E-Mail (Resend, Testmodus vorhanden)          ✅
          • orders.status='new'                                            ✅
                    │
                    ▼   ⚠️ BISHER: keine automatische Verknüpfung
        Lieferantenbestellung (nur MANUELL per Admin-Button)
          createSupplierOrder() → buildSupplierPositions() → Snapshot       ✅
          Playwright-Worker → Auswahl-Engine (Farbe verifiziert bei needen) ✅
          Mapping/Coverage/Per-Produkt-Overrides                           ✅
```

Kern-Lücke war: der Kundenauftrag und die Lieferantenbestellung waren
**entkoppelt**, und die Lieferantenverarbeitung war ein einmaliger,
manueller Aufruf ohne Statusmaschine, Lock, Retry, Idempotenz oder
Audit-Trail.

## 2. Fehlende Bausteine (vollständig)

| # | Baustein | Zweck | Status |
| --- | --- | --- | --- |
| A | **Lebenszyklus-Statusmaschine** | eindeutige Zustände + erlaubte Übergänge | ✅ umgesetzt |
| B | **Audit-Log jedes Statuswechsels** | jederzeit sichtbar wo/warum | ✅ umgesetzt |
| C | **Lock gegen parallele Verarbeitung** | keine Doppelbestellung | ✅ umgesetzt |
| D | **Retry-Policy (transient/permanent/blocked)** | Selbstheilung bei Netzfehlern | ✅ umgesetzt |
| E | **Idempotenz** | Re-Runs sicher, ordered bleibt ordered | ✅ umgesetzt |
| F | **Test/Prod-Trennung** | kein echter Kauf im Dev | ✅ umgesetzt |
| G | **Orchestrator** (Lock→Run→Klassifikation→Transition) | robuster Verarbeitungspfad | ✅ umgesetzt |
| H | **Aussagekräftige Fehler-/Statusprotokolle** | Diagnose | ✅ umgesetzt |
| I | **Automatischer Trigger** Bestellung→Verarbeitung | „ohne manuelle Eingriffe" | ✅ umgesetzt |
| J | **Hintergrund-Processor / Cron** (fällige Jobs, Retries) | echte Automatik | ✅ umgesetzt |
| K | **Admin-Monitoring** (Pipeline, stuck/failed, Retry/Cancel/Pause) | Betrieb | ✅ umgesetzt |
| M | **Verwaiste-Lock-Reaper** (Crash/Neustart-Recovery) | Selbstheilung | ✅ umgesetzt |
| L | **Adapter vervollständigen** (login/Farbe/Größe/Warenkorb) | echter Kauf | ✅ needen + TG (prepare-cart, E2E), siehe `lieferanten-integrationen.md`; produktiv nur noch Zugangsdaten/Farbdaten offen |

## 3. Autonomer Ablauf (umgesetzt)

```
submitOrder (Rechnung → not_required)          [actions/orders.ts]
   └─ enqueueSupplierOrdersForOrder()          [lifecycle/enqueue.ts]
        createSupplierOrder (Snapshot, idempotent) → je Lieferant draft→queued
                    │  (Karte/PayPal: erst aus künftigem Stripe-Webhook bei 'paid')
                    ▼
Scheduler ─▶ GET /api/cron/process-supplier-orders  (Bearer CRON_SECRET)
   └─ processDueSupplierOrders()               [lifecycle/orchestrator.ts]
        1. reclaimStaleLocks() – verwaiste 'processing' (>10 min) → 'queued'
        2. fällige 'queued' (next_attempt_at≤now) laden
        3. je Eintrag processSupplierOrder() – atomarer Lock überspringt Laufende
```

Kein Admin-Klick mehr nötig. Der Admin-Button und die Monitoring-Aktionen
(Retry/Pause/Cancel) nutzen exakt denselben Orchestrator-Pfad.

### Scheduler einrichten

Einen beliebigen Cron (Vercel Cron, GitHub Actions, systemd-timer, Supabase
pg_cron mit http) alle paar Minuten aufrufen lassen:
```
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/process-supplier-orders
```
Ohne gesetztes `CRON_SECRET` ist der Endpoint deaktiviert (503).

## 4. Umgesetzte Architektur

```
Admin-Button / (künftig) Auto-Trigger
   └─ prepareSupplierOrderAction()               [actions/admin.ts]
        createSupplierOrder()  – Snapshot, Status NICHT überschrieben (idempotent)
        requeueForProcessing() – re-runnable → 'queued'; ordered/cancelled geschützt
        processSupplierOrder() [lifecycle/orchestrator.ts]
          1. acquireLock()      – atomar: status→processing, attempt++, Lock  (store.ts)
          2. Snapshot laden → Job rekonstruieren (DB = Quelle der Wahrheit)
          3. Test/Prod: Automatisierung aus → Dry-Run → 'blocked'
             (kein Browser, nichts real bestellt)
          4. runSupplierJob() → Auswahl-Engine (Playwright)
          5. classifyRunFailure() + decideOutcome()                          (status.ts)
             → cart_prepared/ordered | queued(+Retry-Delay) | blocked | failed
          6. transition() – optimistische Sperre + Audit-Event               (store.ts)
          7. releaseLock() (finally)
```

**Statusmodell** (`lifecycle/status.ts`): `draft → queued → processing →
{cart_prepared | ordered | blocked | failed}`; `failed/blocked/cart_prepared
→ queued` (Retry/Weiterverarbeitung), alles → `cancelled`. `canTransition()`
verhindert ungültige Sprünge. Retry-Policy: transiente Fehler mit
exponentiellem Backoff bis `MAX_ATTEMPTS`, danach `failed`; Daten-/
Zugangsdaten-/Stub-Fehler → `blocked` (kein sinnloser Retry).

**Persistenz** (Migration 0006): `supplier_orders` um `attempt_count`,
`max_attempts`, `locked_at`, `locked_by`, `last_error`, `next_attempt_at`;
neue append-only Tabelle `supplier_order_events` (jeder Statuswechsel/jedes
Ereignis mit from/to/reason/detail). Alles additiv, RLS-geschützt.

**Test/Prod:** `SUPPLIER_AUTOMATION_ENABLED` (Default aus) – nur bei `=1`
läuft echte Browser-Automatisierung; sonst Dry-Run ohne Nebenwirkungen.

## 5. Verifikation

- 65 Unit-Tests grün (inkl. Lifecycle: Übergänge inkl. paused, Backoff,
  Fehlerklassifikation, Outcome), `tsc` + `eslint` sauber.
- **Live-E2E des Ablaufs** (echte Rechnungs-Bestellung über den
  Konfigurator-Checkout): Bestellung → je Lieferant `draft→queued` (Audit
  „Nach Ablauf der Stornofrist beim Öffnen im Adminbereich eingereiht") →
  Processor („Fällige jetzt verarbeiten") verarbeitet beide → `blocked`
  (Dry-Run) mit Lock + Audit.

  > **Stand seit Einführung der Stornofrist:** Die Einreihung erfolgt NICHT
  > mehr beim Bestelleingang, sondern erst beim Öffnen der Bestellung im
  > Adminbereich – und die ist für Bestellungen erst nach Ablauf der
  > zweistündigen Stornofrist erreichbar. Für stornierte Bestellungen
  > entsteht dadurch nie ein Lieferantenauftrag. Die eigentliche Bestellung
  > beim Lieferanten läuft derzeit bewusst manuell.
- **Crash-Recovery live:** ein künstlich verwaister Lock (`processing`,
  10+ min alt) wurde vom Reaper erkannt, zurückgesetzt (`[unlock]
  processing→queued`) und automatisch neu verarbeitet.
- **Admin-Aktionen:** Abbrechen live geprüft (`→cancelled`); Retry/Pause
  über denselben statusmaschinensicheren Pfad.
- Idempotenz: `createSupplierOrder` überschreibt den Status nicht mehr;
  `ordered`/`cancelled` werden nicht erneut eingereiht; der atomare Lock
  verhindert parallele Verarbeitung.

## 6. Nächste (letzte) Schritte

- **Adapter (L) – erledigt:** needen und textil-grosshandel sind für
  `prepare-cart` vollständig implementiert und im echten-Chromium-Dry-Run
  bewiesen (Login/Farbe/Größe/Warenkorb, nur verifizierte Selektoren). Details
  + verbleibende Datenpunkte je Lieferant: `docs/lieferanten-integrationen.md`.
- **Produktiv aktivieren:** Zugangsdaten (`SUPPLIER_NEEDEN_*` / `SUPPLIER_TG_*`,
  bestehende Konten) setzen, für TG je Produkt die Farb-Hex pflegen bzw.
  mehrdeutige Farben entscheiden, dann `SUPPLIER_AUTOMATION_ENABLED=1`.
- **checkout (echte Bestellung):** je Lieferant separat abzusichern (aktuell
  bewusst `notImplemented`; Standard-Modus ist `prepare-cart`).
- **Stripe-Pfad:** bei Karte/PayPal `enqueueSupplierOrdersForOrder(orderId)`
  aus dem `paid`-Webhook aufrufen (eine Zeile – Hook steht bereit).
- Optional: Alarmierung bei `failed`/dauerhaft `blocked`.
