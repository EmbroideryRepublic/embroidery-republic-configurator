# Stripe-Adapter: Abbildung auf den Port

> **Stand 2026-07-21. Analyse und Konfiguration fertig, Adapter noch nicht
> implementiert.** Grundlage: `docs/zahlungsarchitektur.md`.

---

## 1. Die Regel, die alles bestimmt

**Außerhalb von `lib/payments/providers/stripe.ts` kennt niemand Stripe.**
Keine Stripe-Objekte, keine Stripe-IDs als solche, keine Stripe-Typen. Was
den Adapter verlässt, sind ausschließlich unsere eigenen Begriffe aus
`lib/payments/types.ts`.

Ein Architekturtest hält das fest (`payments/__tests__/architektur.test.ts`):
SDKs nur unter `providers/`, keine Bezeichner wie `stripeSession` im übrigen
Code, und nur `registry.ts` darf einen Anbieter überhaupt kennen.

---

## 2. Die drei Portmethoden

### 2.1 `eroeffne(auftrag) → { referenz, weiterleitungUrl }`

**Stripe-API:** `stripe.checkout.sessions.create(params, { idempotencyKey })`

Gewählt wird **Stripe Checkout** (gehostete Bezahlseite mit Weiterleitung),
nicht Stripe Elements. Gründe: Der Port gibt bereits eine
`weiterleitungUrl` zurück – die Form passt also genau; Kartendaten berühren
unsere Anwendung nie; und es wird kein veröffentlichbarer Schlüssel
gebraucht.

**Hinein:**

| Unser Feld | Stripe-Parameter | Anmerkung |
|---|---|---|
| `betragCent` | `line_items[0].price_data.unit_amount` | ganze Cent, wie Stripe es erwartet |
| `waehrung` | `line_items[0].price_data.currency` | `'EUR'` → `'eur'` |
| `beschreibung` | `line_items[0].price_data.product_data.name` | erscheint auf der Bezahlseite |
| – | `line_items[0].quantity` | fest `1` – siehe unten |
| – | `mode` | fest `'payment'` (einmalige Zahlung) |
| `rueckkehrUrl` | `success_url` | |
| `abbruchUrl` | `cancel_url` | |
| `bestellId` | `metadata.bestellId` **und** `client_reference_id` | **entscheidend**, siehe 2.2 |
| `bestellnummer` | `metadata.bestellnummer` | zur Zuordnung im Stripe-Dashboard |
| `idempotenzSchluessel` | `{ idempotencyKey }` (zweites Argument) | verhindert zwei Vorgänge bei wiederholtem Aufruf |

**Warum ein einziger Posten mit dem Gesamtbetrag:** Die Aufschlüsselung
(Produkt, Veredelung, Versand, Rabatte) entsteht in unserer Preispipeline und
steht in Bestätigung, Produktionsblatt und später auf der Rechnung. Sie ein
zweites Mal an Stripe zu übergeben hieße, dieselbe fachliche Information an
zwei Stellen zu führen – mit der sicheren Aussicht, dass sie irgendwann
auseinanderlaufen. Stripe braucht nur zu wissen, **wie viel** einzuziehen
ist.

**Heraus:**

| Stripe | Unser Feld |
|---|---|
| `session.id` (`cs_test_…`) | `referenz` → `orders.payment_reference` |
| `session.url` | `weiterleitungUrl` |

### 2.2 `leseEreignis(rohBody, signatur) → ZahlungsEreignis | null`

**Stripe-API:** `stripe.webhooks.constructEvent(rohBody, signatur, whsec)`

Diese Funktion prüft die Signatur **und** entschlüsselt in einem Schritt.
Schlägt sie fehl, wirft sie – wir fangen das und geben `null` zurück, wie
der Port es verlangt.

Der **Rohtext** wird unverändert durchgereicht. Jede Umformung – auch
`JSON.parse` mit anschließendem `JSON.stringify` – ändert Zeichenfolge und
Reihenfolge und macht die Signatur ungültig. Die Route liest deshalb
`request.text()`, nie `request.json()`.

**Relevante Ereignistypen** – alles andere ergibt `null`:

| Stripe-Ereignis | Unsere Art | Bedingung |
|---|---|---|
| `checkout.session.completed` | `bestaetigt` | nur wenn `payment_status === 'paid'` |
| `checkout.session.completed` | *(ignoriert)* | bei `unpaid` – z.B. Lastschrift noch offen |
| `checkout.session.async_payment_succeeded` | `bestaetigt` | verzögerte Verfahren |
| `checkout.session.async_payment_failed` | `fehlgeschlagen` | |
| `checkout.session.expired` | `abgelaufen` | |
| `payment_intent.payment_failed` | `fehlgeschlagen` | |

**Abbildung:**

| Stripe | Unser Feld | Warum wir es brauchen |
|---|---|---|
| `event.id` (`evt_…`) | `ereignisId` | Nachvollziehbarkeit in der Historie |
| `session.metadata.bestellId` | `bestellId` | **die Zuordnung** – siehe unten |
| `session.id` | `referenz` | Bezug zum Vorgang |
| `session.amount_total` | `betragCent` | wird **abgeglichen**, nie übernommen |
| `session.currency` | `waehrung` | Abgleich |
| `session.payment_intent` | `transaktionId` | Grundlage späterer Erstattungen |
| `event.type` bzw. Fehlermeldung | `grund` | Klartext für die Historie |

**Warum die Zuordnung über `metadata.bestellId` läuft und nicht über die
gespeicherte Referenz:** Nach einer Wiederaufnahme zeigt
`orders.payment_reference` auf den **neueren** Vorgang. Ein Ereignis zum
älteren wäre über die Referenz keiner Bestellung mehr zuzuordnen – die
Zahlung wäre erfolgt, aber verwaist. Über die Metadaten findet der Webhook
die Bestellung immer.

### 2.3 `verwerfe(referenz)`

**Stripe-API:** `stripe.checkout.sessions.expire(sessionId)`

**Hinein:** die Sitzungskennung. **Heraus:** nichts – die Antwort wird
verworfen.

Der Port sagt zu, **nicht zu werfen**. Stripe wirft aber, wenn eine Sitzung
bereits abgelaufen oder abgeschlossen ist. Genau das ist hier der Normalfall
und kein Fehler: Wir wollten sie ohnehin entwerten. Der Adapter fängt das
und protokolliert es höchstens.

---

## 3. Was Stripe-intern bleibt

Diese Dinge verlassen den Adapter **nie**:

- **Kartendaten** – wir sehen sie zu keinem Zeitpunkt (das ist der
  wesentliche Vorteil der gehosteten Bezahlseite)
- `Stripe.Checkout.Session`, `Stripe.PaymentIntent`, `Stripe.Event`,
  `Stripe.Charge`, `Stripe.Customer` – sämtliche SDK-Objekte
- Stripe-Fehlercodes und -Typen (`StripeCardError` …)
- `balance_transaction`, Gebühren, Auszahlungsläufe
- `customer_details`, `payment_method_types`, `livemode`

Unsere Geschäftslogik braucht davon **sieben Felder** – die von
`ZahlungsEreignis`. Mehr nicht.

---

## 4. Konfiguration – fertig und getestet

`lib/payments/providers/stripeKonfiguration.ts`, 13 Tests.

| Variable | Wofür | Wann verfügbar |
|---|---|---|
| `STRIPE_SECRET_KEY` | `eroeffne`, `verwerfe` | sofort nach Kontoanlage |
| `STRIPE_WEBHOOK_SECRET` | `leseEreignis` | **erst nach** Anlegen des Endpunkts |

**Gestaffelt geprüft.** Jede Fähigkeit prüft nur, was sie braucht. Das ist
kein Detail: Zwischen Kontoanlage und Webhook-Einrichtung liegt ein Zustand,
in dem Zahlungen bereits eröffnet werden können – und genau das braucht man,
um den Endpunkt überhaupt zu erproben. Eine Rundum-Prüfung beim Start würde
die Einrichtung blockieren.

**Keine stillen Ausweichwege.** Kein Standardwert, keine Notlösung. Fehlt
etwas, wird gesagt was fehlt und wo es herkommt. Zusätzlich abgefangen:

- der veröffentlichbare Schlüssel (`pk_…`) an geheimer Stelle – die
  häufigste Verwechslung
- ein Wert, der nicht wie ein Signaturschlüssel aussieht
- leere Zeichenketten und umgebende Leerzeichen (Kopierfehler)
- **`sk_live_` außerhalb des Produktivbetriebs** – sonst bewegen Testläufe
  echtes Geld, und das fällt erst bei der Abrechnung auf

**Schlüssel erscheinen in keiner Meldung** – auch nicht gekürzt. Ein Test
prüft das.

**Ein `pk_…` wird nicht gebraucht.** Der Checkout ist eine Weiterleitung,
kein eigenes Kartenformular. Erst wenn Karten direkt bei uns eingegeben
werden sollen, käme er dazu.

---

## 5. Einrichtung – die Reihenfolge

1. Stripe-Konto anlegen, **Testmodus** einschalten
2. `sk_test_…` aus „Entwickler → API-Schlüssel" in `STRIPE_SECRET_KEY`
3. Adapter implementieren (siehe 2.1–2.3)
4. Webhook-Endpunkt in Stripe anlegen:
   `https://<domain>/api/webhooks/stripe` – die Route **existiert bereits**
5. Den dabei erzeugten `whsec_…` in `STRIPE_WEBHOOK_SECRET`
6. `npm run test:e2e:zahlung -- --anbieter stripe`

Schritt 6 ist der eigentliche Nachweis: **dieselbe Prüfstrecke**, die heute
gegen den Testanbieter läuft. Weichen die Ergebnisse ab, liegt der Fehler im
Adapter – nicht im Test.

---

## 6. Was sich dabei NICHT ändert

Keine Zeile in `paymentService.ts`, `orderCompletion.ts`, der Preispipeline,
der Webhook-Route oder der Oberfläche. Die Route kennt `stripe` bereits als
Wegsegment und weiß, in welcher Kopfzeile die Signatur steht; die Registry
hat den Platz reserviert (`stripe: null`).

Es entsteht **eine** neue Datei: `lib/payments/providers/stripe.ts`.
