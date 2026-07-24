# Datenfluss einer Bestellung

Der Weg vom Konfigurator bis zur Produktion, Schritt für Schritt. Stand
2026-07-22.

Verwandte Tiefendokumente:
[Konsistenz](bestellprozess-konsistenz.md) ·
[Preise](kalkulationsmodell.md) · [Steuer](steuerarchitektur.md) ·
[Upload](upload-lebenszyklus.md) · [Zahlung](zahlungsarchitektur.md).

---

## Überblick

```
KONFIGURATOR (Browser)
  Produkt wählen → Logo/Text platzieren → Live-Vorschau (Konva)
  Preis wird zur Anzeige berechnet (unverbindlich)
        │
        ▼  Warenkorb → Checkout, Absendekennung erzeugt
SERVER ACTION  submitOrder / submitInquiry
  Rate-Limit → Validierung → SERVERPREIS → Steuer
        │
        ▼
  Phase 1a  Dateien hochladen (vor der Transaktion)
  Phase 1b  create_order_atomic  (orders + items + elements, EINE Transaktion)
        │
        ▼
  Phase 2   Rendering, Produktionsblatt, E-Mails
            – bei Rechnungskauf sofort
            – bei Zahlung erst nach dem Webhook
        │
        ▼  nach Ablauf der Stornofrist, beim Öffnen im Adminbereich
  LIEFERANTENAUFTRAG  Rohtextil bestellen
```

Der rote Faden: **Nichts Nachaußenwirkendes geschieht, bevor die Bestellung
vollständig und – bei Zahlungspflicht – bezahlt ist.**

---

## 1. Konfigurator (Browser)

`components/configurator/`

Die Kundschaft wählt ein Produkt, eine Farbe, eine Ansicht (Vorne, Hinten,
Ärmel) und platziert Logos oder Texte auf dem Canvas (Konva.js). Der Zustand
liegt in einem Zustand-Store (`stores/configuratorStore.ts`).

**Logo-Upload:** `LogoUploader.tsx` prüft im Browser Typ und Größe (Komfort,
kein Schutz). `fileToImage()` wandelt jede Datei in PNG um – PDF via pdfjs,
SVG und PNG über den Canvas. Beim Server kommt deshalb ausschließlich PNG an
(siehe [upload-lebenszyklus.md](upload-lebenszyklus.md)).

**Preis-Anzeige:** `calculatePrice()` berechnet einen Preis für die Anzeige.
Dieser Wert ist **unverbindlich** – der Server rechnet ihn später neu.

---

## 2. Server Action

`lib/actions/orders.ts` – `submitOrder()` (Kauf) bzw. `submitInquiry()`
(unverbindliche Anfrage).

Die Reihenfolge ist Absicht:

```
1. Rate-Limit          pruefeRateLimit('bestellung')      → H2
2. Validierung         validateSubmission()               reiner Katalog-Check
3. SERVERPREIS         priceCart()                        Client-Preis ignoriert
4. Preisabgleich       priceClaimDeviation()              Manipulation erkennen
5. Belastbarkeit       kein Preis → Abbruch               fail-fast
6. Doppelschutz        client_request_id bereits da?      → Idempotenz
```

Erst wenn all das steht, beginnt das Speichern.

### Serverpreis – der Sicherheitskern

`lib/pricing/serverPricing.ts` berechnet jede Position neu aus
Katalogdaten + Konfiguration. Der Client-`unitPrice` geht **nicht** ein.
Die Menge kommt aus den Größen-Mengen, nicht aus dem manipulierbaren
`quantity`. Der Steuersatz kommt aus `config/pricing/steuer.ts`. Ergebnis:
`totalPrice` (brutto), `taxAmount`, `taxRate`, `netTotal`.

Details der dreistufigen Pipeline (Position → Warenkorb → Bestellung):
[kalkulationsmodell.md](kalkulationsmodell.md),
[steuerarchitektur.md](steuerarchitektur.md).

---

## 3. Phase 1a – Dateien ablegen (vor der Transaktion)

Die Bestellkennung entsteht **hier** in der Anwendung (`randomUUID()`), nicht
in der Datenbank – nur so steht der Speicherpfad fest, bevor die Transaktion
beginnt. Ab diesem Punkt trägt jeder Protokolleintrag die Bestellnummer
(`merkeBestellung()`).

`buildItemRecords()` lädt die Logos hoch. Jeder Upload durchläuft
`pruefeDataUrl()`: Größe vor dem Dekodieren, Signatur, Abmessungen. Die
Element-ID wird als Pfadkomponente geprüft.

**Warum außerhalb der Transaktion:** Uploads sind externe, nicht
zurückrollbare Wirkungen. Eine offene Transaktion, die auf einen
Netzwerkaufruf wartet, hält Sperren. Scheitert ein Upload, endet der Vorgang
hier – in der Datenbank ist noch nichts entstanden.

---

## 4. Phase 1b – die Transaktion

`create_order_atomic(p_order, p_items)` (Migration 0015) legt in **einer**
Transaktion an:

```
orders  →  order_items  →  configuration_elements
```

Entweder alles oder nichts. Postgres rollt bei jedem Fehler vollständig
zurück – auch bei Absturz oder Zeitüberschreitung. Das Rollback ist
nachgewiesen (siehe [bestellprozess-konsistenz.md](bestellprozess-konsistenz.md)).

`payment_status` wird gesetzt: `not_required` beim Rechnungskauf, `pending`
bei Zahlungspflicht.

### Idempotenz

Zwei gleichzeitige Absendungen mit derselben `client_request_id` treffen auf
den partiellen Unique-Index (Migration 0011). Die zweite blockiert, bis die
erste fertig ist, und sieht danach entweder eine **vollständige** Bestellung
(Konflikt → bestehende zurückgeben) oder **gar keine** (die erste wurde
zurückgerollt → selbst anlegen). Ein Torso ist nicht mehr beobachtbar.

---

## 5. Phase 2 – Abschluss

`lib/orders/orderCompletion.ts` – `schliesseBestellungAb()`:

- **Druckvorschauen** je Position und Ansicht (lädt die Logos wieder herunter,
  rendert das Motiv auf das Kleidungsstück)
- **Produktionsblatt** als PDF
- **Bestellbestätigung** an die Kundschaft
- **interne Benachrichtigung** an den Betrieb

Die Funktion **wirft nicht, sie berichtet**. Eine gespeicherte Bestellung
darf hier nicht mehr scheitern – ein misslungenes Vorschaubild ändert nichts
an ihrer Gültigkeit. Probleme werden protokolliert.

**Zeitpunkt:**

| Zahlungsart | Phase 2 läuft |
|---|---|
| Rechnungskauf (`not_required`) | sofort nach Phase 1 |
| Stripe (`pending`) | erst nach dem Bestätigungs-Webhook |

> **Z1 erledigt:** Die Phase-2-Weiche steht. `submitOrder` führt Phase 2 bei
> Rechnungskauf sofort aus, bei Vorabzahlung (`brauchtVorabZahlung`) kehrt es
> nach Phase 1 zurück; der Bestätigungs-Webhook stößt Phase 2 später an. Ein
> Wächter-Test hält das fest. Siehe [stripe-review.md](stripe-review.md).

---

## 6. Zahlung (Stripe integriert, im Testmodus nachgewiesen)

`lib/orders/paymentService.ts`

```
starteZahlung()  eröffnet den Vorgang beim Anbieter, Weiterleitung
      ↓
Kundschaft zahlt bei Stripe
      ↓
Webhook  /api/webhooks/stripe
  Signatur prüfen → Betrag gegen gespeicherten Wert prüfen
  UPDATE ... WHERE payment_status = 'pending'   ← die Idempotenz
  0 Zeilen? bereits verarbeitet, fertig
  1 Zeile?  Phase 2 anstoßen
      ↓
Rückleitung in den Shop  (liest nur, löst nichts aus)
```

Nur der Webhook ändert den Zustand. Die Rückleitung ist Anzeige. Alle
Fehlerfälle – verspäteter Webhook, doppelter Webhook, Browser geschlossen –
sind dadurch unkritisch. Vollständig in
[zahlungsarchitektur.md](zahlungsarchitektur.md) und
[stripe-review.md](stripe-review.md).

---

## 7. Lieferantenauftrag

**Bewusst nicht** Teil des Bestellvorgangs. Während der Stornofrist darf kein
Lieferantenauftrag entstehen – der Kunde kann noch selbst stornieren, und für
eine stornierte Bestellung soll gar kein Auftrag anfallen.

Der Auftrag entsteht, wenn der Betrieb die Bestellung im Adminbereich öffnet
(frühestens nach Fristablauf). Damit ist die Reihenfolge ohne Scheduler
garantiert. Der Lebenszyklus steht in
[lieferanten-architektur.md](lieferanten-architektur.md); der aktuell gelebte
manuelle Weg in [manueller-lieferantenprozess.md](manueller-lieferantenprozess.md).

---

## 8. Statusübergänge

`config/orderStatus.ts` (rein) definiert die erlaubten Übergänge,
`lib/orders/orderService.ts` führt sie aus – mit `.eq('status', von)` gegen
gleichzeitige Wechsel.

```
new → in_production → shipped → completed
 └────────┴───────────┴──────► cancelled  (nur vor Fristablauf)
```

`completed` und `cancelled` sind Endzustände. Jeder Wechsel geht genau einen
Schritt, wird gegen `ERLAUBTE_UEBERGAENGE` geprüft und atomar mit
`.eq('status', von)` ausgeführt – zwei gleichzeitige Wechsel: der erste
gewinnt, der zweite wird abgewiesen.

Zahlungsstatus getrennt davon: `not_required` · `pending` · `paid` · `failed`,
nur über `WHERE pending`-Bedingungen bewegt, nie rückwärts.

---

## Was wo passiert – die Kurzreferenz

| Frage | Antwort |
|---|---|
| Wann entsteht die Bestellung? | Phase 1b, atomar |
| Wann wird bezahlt? | Rechnungskauf: nach Lieferung. Stripe: zwischen Phase 1 und 2 |
| Wann entstehen Produktionsdaten? | Phase 2 |
| Wann gehen E-Mails raus? | Phase 2 |
| Wann startet der Lieferant? | nach der Stornofrist, beim Öffnen im Admin |
| Wer bestimmt den Preis? | ausschließlich der Server |
| Wer darf produziert werden? | nur bezahlte bzw. rechnungsfreigegebene Bestellungen |
