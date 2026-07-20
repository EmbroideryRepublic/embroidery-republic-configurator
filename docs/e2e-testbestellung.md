# End-to-End-Testbestellung — reale Pipeline

Stand: Juli 2026. Durchgeführt gegen die **reale** Infrastruktur (Supabase-DB +
textil-grosshandel.eu), Modus **prepare-cart** – es wurde **kein Checkout und
kein Kauf** ausgelöst (garantiert durch `createSupplierOrder` default
`mode: 'prepare-cart'`; der Worker führt `checkout` nur bei `mode === 'checkout'`
aus, was im gesamten Bestellfluss nie gesetzt wird).

## Testfall

| Feld | Wert |
|---|---|
| Produkt | `gildan-heavy-t` (Heavy Cotton T-Shirt, Art. G5000) |
| Farbe | `navy` |
| Größen/Mengen | M×6, L×4 (gesamt 10) |
| Veredelung | DTF |
| Zahlungsart | Rechnung (invoice) |
| **Client-Preis (absichtlich manipuliert)** | **1,00 €** |

## Ablauf & Ergebnis

### 1. Kundenbestellung (`submitOrder`) — ✅
- Ergebnis: `success: true`, Bestellnummer `ER-2026-0DE6F1`.
- **Serverseitige Preisberechnung greift:** der manipulierte Client-Preis (1,00 €)
  wird ignoriert, serverseitig **66,93 €** aus Katalog + Konfiguration berechnet
  (Log: „Client-Preis weicht ab … behauptet 1.00 €, serverseitig 66.93 €").

### 2. Persistenz (Supabase) — ✅
- `orders`: status `new`, payment_status `not_required` (= Rechnung), quantity 10,
  total_price **66,93 €**.
- `order_items`: `gildan-heavy-t` / `navy` / size_quantities `{L:4, M:6}` /
  unit_price 6,69 € / product_name „Heavy Cotton T-Shirt" / color_name „Navy".

### 3. Automatische Lieferanten-Einreihung (`enqueueSupplierOrdersForOrder`) — ✅
- `supplier_orders`: supplier `textil-grosshandel`, status `queued`, **mode
  `prepare-cart`**, Position mit korrekter Art.-Nr. `G5000`, Farbe navy,
  Größen L:4/M:6, verifizierter Produkt-URL.

### 4. Lieferantenprozess (`processSupplierOrder`, echtes Chromium) — teilweise
Schrittprotokoll des Worker-Laufs:

| Schritt | Ergebnis |
|---|---|
| login | ❌ failed (siehe Blocker unten) |
| resolveVariants #0 | ✅ ok |
| openProduct #0 | ✅ ok |
| selectColor #0 | ✅ ok `[variant-id=263147]` (Navy) |
| setQuantity #0/L | ✅ ok `[label=L]` |
| setQuantity #0/M | ✅ ok `[label=M]` |
| addToCart #0 | ✅ ok |

Da der Login fehlschlägt, ist das Gesamt-Outcome `partial` → Status `blocked`
(korrekt klassifiziert). Der Warenkorb wird als **Gast** vollständig befüllt
(TG erlaubt das) – Produkt, Farbe und Mengen stimmen.

### 5. Fidelitäts-Prüfung (Anforderung ↔ Persistenz) — ✅ ALLE BESTANDEN
- Produkt ✓ · Farbe ✓ · Menge gesamt (10) ✓ · Client-Preis ignoriert
  (66,93 > 1) ✓ · Rechnung (payment_status `not_required`) ✓.

### Audit-Trail (`supplier_order_events`, Auszug)
```
draft→queued     Automatisch nach Bestelleingang eingereiht.
—→processing     Verarbeitung übernommen (Lock …), Versuch N.
attempt          Lauf beendet: partial → blocked.
processing→blocked  Blockiert – braucht Klärung (Daten/Zugangsdaten/Variante).
```
Lock-/Retry-/Reclaim-Mechanik, Statusmaschine und Event-Log funktionieren wie
vorgesehen (mehrere Versuche sauber protokolliert, keine Doppelbestellung).

## Dabei behobene Fehler (Code)

1. **Fehlerisolierung E-Mail/Produktionsblatt** (`orders.ts`, `sendEmail.ts`):
   Ein Fehler beim Rendern/Versenden der Bestätigungs-E-Mail ließ zuvor eine
   **bereits persistierte** Bestellung als `success:false` melden. Jetzt sind der
   E-Mail-Versand in `orders.ts` und das Rendern in `sendEmail` in try/catch
   gekapselt → eine gespeicherte Bestellung schlägt nie mehr an einem
   nachgelagerten Schritt fehl (DB ist Quelle der Wahrheit).
2. **Cookie-Consent-Overlay (Usercentrics)** (`shopActions.dismissConsent`):
   Das Consent-Overlay fing die Login-/Warenkorb-Klicks ab („intercepts pointer
   events"). Neu: datensparsame Verwerfung via offizieller API
   `UC_UI.denyAllConsents()` (lehnt alle Dienste ab, setzt Cookie, schließt das
   Overlay), mit Deny-Button- und DOM-Entfernungs-Fallback. Aufruf nach jeder
   Navigation (Login + Produktseite).
3. **Farb-Swatch im Karussell nicht klickbar** (`selectionEngine`): TG-Farb-
   Swatches außerhalb des sichtbaren Swiper-Fensters fallen auf 0×0 zusammen und
   gelten für Playwright als „nicht sichtbar". Neu: Sichtbarkeits-Fallback –
   schlägt der normale Klick fehl, wird das Element per JS geklickt
   (verifiziert: löst denselben Farbwechsel + Größen-Matrix-Update aus).

## Verbleibender Blocker (kein Code)

**TG-Login schlägt fehl.** Nach dem Absenden bleibt `#loginUser` bestehen (Auth
nicht erfolgreich). Der Button-Klick landet (kein Intercept-Fehler mehr), das
Formular wird abgeschickt – die Anmeldung wird aber nicht akzeptiert. Die
hinterlegten `SUPPLIER_TG_USERNAME`/`SUPPLIER_TG_PASSWORD` sind beide exakt 8
Zeichen lang, was auf **Platzhalter-/ungültige Zugangsdaten** hindeutet.
→ **Aktion (Nutzer):** gültige TG-B2B-Zugangsdaten in `.env.local` hinterlegen.
Danach ist ein vollständig grüner Lauf (inkl. Login, mit B2B-Preisen) zu
erwarten; die restliche Kette (openProduct→Farbe→Menge→Warenkorb) ist bereits
verifiziert.

## Reproduktion
Einmalige Test-Harness (nicht im Repo belassen, da sie reale Bestellungen anlegt
und den echten TG-Login auslöst): `.env.local` laden, `SUPPLIER_AUTOMATION_ENABLED=1`,
`submitOrder(...)` mit obigem Warenkorb, dann `processSupplierOrder(orderId,
'textil-grosshandel')`. Die dabei entstandenen Test-Bestellungen (E-Mail
`e2e-*@embroidery-republic.test`) verbleiben als Nachweis in der DB.
