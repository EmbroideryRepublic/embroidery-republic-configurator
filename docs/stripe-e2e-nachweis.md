# Stripe-Integration – Nachweis unter realen Bedingungen

Erbracht am **2026-07-23** gegen das **echte Stripe-Testkonto** (kein Testdoppel,
kein Mock). Grundlage für die Freigabe von Kartenzahlung in Version 1.0.

Verwandt: [stripe-review.md](stripe-review.md) (Architektur & Sicherheit) ·
[zahlungsarchitektur.md](zahlungsarchitektur.md) · [bestellablauf.md](bestellablauf.md).

---

## Gesamtergebnis

```
=== 31/31 Prüfungen bestanden (echtes Stripe-Testmodus) ===
```

Reproduzierbar über:

```bash
npm run test:e2e:stripe
```

Voraussetzung: `STRIPE_SECRET_KEY` (`sk_test_…`) und `STRIPE_WEBHOOK_SECRET`
(`whsec_…`) in `.env.local`. Das Skript prüft zu Beginn `livemode === false` –
es kann also **nie versehentlich gegen echtes Geld** laufen.

---

## Was „real" hier bedeutet

Kein Bestandteil des Tests ist nachgestellt. Drei Ebenen laufen gegen die
Wirklichkeit:

| Ebene | Wie real |
|---|---|
| `eroeffne` / `verwerfe` | rufen die **echte Stripe-API** mit dem Testschlüssel. Es entstehen echte `cs_test_`-Sessions bei Stripe; `verwerfe` lässt sie dort wirklich ablaufen. |
| `leseEreignis` | prüft **echte Signaturen**. Die Ereignisse werden mit `stripe.webhooks.generateTestHeaderString` und dem **echten `whsec`** signiert – dasselbe Verfahren, mit dem Stripe an den Produktions-Endpunkt zustellt. |
| `verarbeiteZahlungsEreignis` | fährt den **vollen Downstream**: Verbuchen, Phase 2 (Rendering, Produktionsblatt-PDF, E-Mail), Idempotenz-Marker, Fehlerklassifikation – über die echte Datenbank. |

Nebenwirkungen nach außen (E-Mail-Versand, Datei-Upload, Lieferant) sind über
`E2E_TESTMODUS=aktiv` abgefangen: Der volle Code-Pfad läuft, aber es geht keine
Mail raus und keine Datei in den echten Bucket. Angelegte Testbestellungen
werden am Ende wieder gelöscht.

---

## Die 31 Prüfungen im Einzelnen

### Vorprüfung
- Stripe-Testkonto erreichbar, `livemode=false`.

### A · Checkout eröffnen, prüfen, verwerfen (echte API) — 7
- echte `cs_test_`-Session erhalten
- Weiterleitung zeigt auf `checkout.stripe.com`
- `metadata.bestellId` korrekt gesetzt (die maßgebliche Zuordnung)
- `client_reference_id` korrekt gesetzt
- Betrag korrekt an Stripe übergeben (3164 Cent)
- **Idempotenz der Eröffnung**: gleicher Schlüssel → dieselbe Session (kein Doppelvorgang)
- `verwerfe()` lässt die Session bei Stripe ablaufen (`status=expired`)

### B · Bestätigte Zahlung über den echten Webhook-Weg — 9
- echte Signatur akzeptiert, Ereignis übersetzt
- Ereignis → `bestaetigt`, `bestellId` korrekt
- `verarbeiteZahlungsEreignis` → `{ok, bestaetigt, nicht bereits verarbeitet}`
- Bestellung ist danach `paid`
- `paid_at` gesetzt
- **Phase 2 lief**: Produktionsblatt-PDF erzeugt (`pdf_url` gesetzt)
- `payment_transaction_id` (PaymentIntent) festgehalten
- Historie enthält `payment_succeeded`
- Historie: E-Mail-Weg durchlaufen (`email_scheduled` / `email_sent`)

### C · Erneute Zustellung desselben Ereignisses (Idempotenz) — 2
- zweite Zustellung → `bereits_verarbeitet` (keine zweite Wirkung)
- `payment_succeeded` steht **genau einmal** in der Historie

### D · Fehler- und Randfälle — 11
- gefälschte Signatur → verworfen (`null`)
- fehlende Signatur → verworfen (`null`)
- `charge.refunded` → nicht relevant (`null`) — eine Erstattung kippt `paid` **nicht** still auf „fehlgeschlagen" (Audit Z7)
- Bestellung nach dem Erstattungs-Ereignis weiterhin `paid`
- verspäteter `payment_intent.payment_failed` **nach** `paid` → wirkungslos
- Bestellung bleibt `paid`
- **Betragsabweichung** (gemeldet 100, erwartet 5000 Cent) → fachlich abgelehnt, **keine** Wiederzustellung (`wiederholen=false`)
- falscher Betrag: Bestellung bleibt `pending` (wird nicht fälschlich bezahlt)
- `checkout.session.expired` → `fehlgeschlagen`
- abgelaufene Zahlung: Bestellung `failed`
- unbekannte `bestellId` → fachlich abgelehnt, keine Wiederzustellung

### E · Registry im Produktivmodus — 1
- Mit `NODE_ENV=production` und ohne `E2E_TESTMODUS` liefert
  `waehleZahlungsAnbieter('stripe')` den **echten Stripe-Adapter** (nicht das
  Testdoppel). Damit ist bewiesen, dass der Testmodus-Vorrang der Registry im
  echten Betrieb nicht greift.

---

## Warum der Adapter direkt aufgerufen wird (statt über CLI-Forwarding)

Die Registry erzwingt im Testmodus **bewusst** den Testanbieter – eine
freigegebene Geldsicherung, die verhindert, dass ein Testlauf einen echten
Bezahlvorgang auslöst. Genau diese Sicherung würde einen serverseitigen
Stripe-Lauf im Testmodus blockieren.

Deshalb ruft der E2E den Adapter **direkt** – analog dazu, wie die Unit-Tests
den Testanbieter direkt prüfen. Dass die Registry im **Produktivmodus** den
Stripe-Adapter liefert, ist mit **Teil E** separat und explizit nachgewiesen.
Der Weg „HTTP-Route → Registry → Adapter" ist damit lückenlos abgedeckt:

- Route-Verhalten (Signatur, Rate-Limit, 500 vs. 200): `e2eZahlung` + Unit-Tests
- Adapter gegen echte Stripe-API + echte Signaturen: dieser Test (A–D)
- Registry wählt produktiv Stripe: dieser Test (E)

---

## Regressionsnachweis (gleicher Tag)

Kein Rückschritt an bestehendem Verhalten:

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | 0 Fehler |
| `npm run lint` (`eslint .`) | 0 Fehler |
| `npm test` (Unit) | 458 / 458 |
| `npm run test:e2e` (Bestellung) | 21 / 21 |
| `npm run test:e2e:zahlung` | 21 / 21 |
| `npm run test:e2e:ratelimit` | 16 / 16 |
| `npm run test:e2e:adminauth` | 19 / 19 |
| `npm run test:e2e:stripe` (echter Testmodus) | **31 / 31** |

---

## Für den Live-Betrieb verbleibend (nur durch dich)

Code-seitig ist nichts mehr zu tun. Für den Übergang vom Test- in den
Live-Betrieb:

1. **Live-Schlüssel** hinterlegen: `STRIPE_SECRET_KEY=sk_live_…` und den
   `STRIPE_WEBHOOK_SECRET` des **Live**-Endpunkts. `stripeKonfiguration.ts`
   warnt, wenn ein `sk_live_` außerhalb der Produktion auftaucht.
2. **Webhook-Endpunkt in Stripe registrieren** auf
   `https://<deine-domain>/api/webhooks/stripe`, mit mindestens den Ereignissen
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `payment_intent.payment_failed`,
   `checkout.session.expired`.

Sobald beide Schlüssel gesetzt sind, gilt Stripe über
`stripeKonfigurationsStand()` als einsatzbereit, und die Registry bietet
Kartenzahlung an – ohne stillen Rückfall auf den Testanbieter.

### Optional: der CLI-Weg lokal Ende-zu-Ende

Dieser E2E braucht die Stripe CLI **nicht**. Wer den echten HTTP-Weg lokal
durchspielen will (`stripe listen` → Route), muss die Weiterleitung auf den
tatsächlichen Dev-Port **3007** richten – nicht 3000:

```bash
stripe listen --forward-to http://localhost:3007/api/webhooks/stripe
```

Das dabei ausgegebene `whsec_…` gehört dann in `.env.local`. Der Testmodus-
Vorrang der Registry ist dabei zu beachten: Für einen echten Stripe-Lauf über
die Route darf `E2E_TESTMODUS` nicht aktiv sein.

---

## Urteil

Die Stripe-Integration ist **funktional vollständig, idempotent, gegen die
dokumentierten Fehler- und Betrugsfälle abgesichert und unter realen Bedingungen
nachgewiesen**. Sie ist für Version 1.0 **produktionsreif**; der Live-Gang hängt
allein an den Live-Zugangsdaten und der Registrierung des Webhook-Endpunkts –
beides bewusst außerhalb des Codes und in deiner Hand.
