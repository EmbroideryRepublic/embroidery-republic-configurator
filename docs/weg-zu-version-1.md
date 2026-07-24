# Weg zu Version 1.0

Was fehlt, bevor Embroidery Republic echte Kunden zuverlässig bedienen kann.
Erhoben am 2026-07-22 gegen den laufenden Code und die Produktivdatenbank.

Grundlage: Migrationen 0001–0013 sind **angewendet** (geprüft gegen die DB:
`client_request_id`, `payment_provider`, `payment_reference`, `total_price`
vorhanden). 10 Bestellungen im Bestand. 368 Tests grün.

---

## A. Blocker — ohne diese Punkte darf nicht verkauft werden

### A1. Umsatzsteuer fehlt vollständig

Der schwerwiegendste Punkt. Geprüft:

| geprüft | Ergebnis |
|---|---|
| Steuerfelder in `orders` / `order_items` | **keine** |
| Steuerlogik im Bestellvorgang | **keine** |
| Auszeichnung am Preis | **keine** |
| Bestellbestätigung | ohne Steuerzeile |
| AGB § 4 (2) | offenes TODO |

Die Preisangabenverordnung verlangt gegenüber Verbrauchern Endpreise
inklusive Umsatzsteuer; eine Rechnung ohne Steuerausweis ist zudem nicht
ordnungsgemäß. `config/pricing/steuer.ts` existiert bereits, greift aber nur
in der internen Kalkulation.

**Zu tun:** Migration mit `tax_rate` und `tax_amount`, Ausweis in Checkout,
Bestätigung, Rechnung und Produktionsblatt, AGB-Angabe ergänzen.

### A2. Zahlungsabwicklung — ERLEDIGT (2026-07-23)

Der Stripe-Adapter (`providers/stripe.ts`) ist gebaut und in `registry.ts`
verdrahtet (`stripe: stripeAnbieter`); der Platzhalter `stripe: null` ist weg.
Die gesamte Architektur (Port, Webhook-Route, Idempotenz, Ereignisse) steht und
ist jetzt **gegen das echte Stripe-Testkonto** end-to-end nachgewiesen: 31/31
Prüfungen (Checkout-Eröffnung, Signaturprüfung, Bestätigung, Phase 2, doppelte
und verspätete Zustellung, Betragsabweichung, Ablauf, Erstattung). Nachweis:
[stripe-e2e-nachweis.md](stripe-e2e-nachweis.md).

**Für den Live-Betrieb verbleibt nur (durch dich):** Live-Schlüssel
(`sk_live_…`, `whsec_…`) in `.env.local`/Deployment hinterlegen und in Stripe
einen Webhook-Endpunkt auf `https://<domain>/api/webhooks/stripe` registrieren.
Code-seitig ist nichts mehr zu tun.

### A3. Rechtstexte unvollständig

Vier offene Stellen im Code, alle rechtlich relevant:

| Datei | fehlt |
|---|---|
| `impressum` | USt-IdNr. bzw. Steuernummer |
| `agb` § 4 (2) | Netto-/Bruttoangabe |
| `datenschutz` | Hosting-Anbieter und Serverstandort |
| `datenschutz` | Region des Supabase-Projekts |

**Zu tun:** Angaben eintragen. Eine anwaltliche Prüfung der AGB ist im
Dokument selbst bereits angeraten.

### A4. Verkaufspreise sind nicht festgelegt

25 von 43 Katalogpreisen weichen vom belegten Einkaufspreis ab. Zwei
Stellschrauben sind offen: der Stichsatz (0,10 € gegen 0,76 €/1,40 €) und der
Gewinnsatz (25 % ist von mir gewählt, nicht bestätigt).

**Zu tun:** Stichsatz klären, Strategie wählen (`npm run preis:strategien`),
Preise freigeben.

---

## B. Wesentlich — sollte zu 1.0 gehören

### B1. `categories` ohne RLS

Einzige Tabelle im Schema ohne Row Level Security. Alle anderen zwölf haben
sie. Vermutlich ein Versehen aus Migration 0008.

### B2. Kein Kundenkonto

Es gibt keinen Bereich, in dem Kundschaft Bestellungen einsieht oder den
Status verfolgt. Bestellungen laufen ausschließlich über E-Mail-Bestätigung.

Für 1.0 vertretbar, wenn bewusst entschieden — dann sollte die
Bestellverfolgung über einen Link mit Token in der Bestätigung möglich sein.
Andernfalls ist es ein eigener Baustein.

### B3. Lieferantenbestellung läuft manuell

Bewusste Festlegung (Admin-Karte + Direktlink). Für 1.0 tragfähig, sollte
aber im Adminbereich vollständig abgebildet sein: Was ist bestellt, was
steht aus, was ist eingetroffen.

### B4. Rücksendungen und Stornierungen

Migration 0009 bringt ein Stornofenster, 0010 den Statuslebenszyklus. Zu
prüfen ist, ob der Ablauf im Adminbereich vollständig bedienbar ist —
insbesondere Teilstornierung und Erstattung nach Zahlungseingang.

### B5. Produktionsprozess

Produktionsblatt und Vorschauen werden erzeugt. Offen ist, ob der
Adminbereich den Weg von „bezahlt" bis „versandt" lückenlos führt, inklusive
Sendungsnummer und Versandbenachrichtigung.

---

## C. Betrieb und Absicherung

### C1. Fehlerüberwachung

Kein Monitoring. Ein Fehler im Bestellvorgang fällt derzeit nur auf, wenn
Kundschaft sich meldet.

### C2. Sicherung der Datenbank

Zu klären: Reicht die Supabase-Sicherung des gewählten Tarifs, und ist eine
Wiederherstellung erprobt?

### C3. E2E deckt nicht den Zahlungsweg mit echtem Anbieter

`e2eBestellung` (21 Prüfungen) und `e2eZahlung` (20 Prüfungen) laufen gegen
den Testanbieter. Nach A2 gehört ein Durchlauf gegen Stripe im Testmodus
dazu.

### C4. Lasttest fehlt

Nie unter Last geprüft. Bei erwarteter Bestellzahl unkritisch, aber der
Konfigurator ist rechenintensiv.

---

## Was bereits steht

Damit der Blick nicht schief wird — diese Bausteine sind fertig und geprüft:

- **Konfigurator** mit Druckflächen, Motiv- und Textplatzierung, visuell
  durchgeprüft über den gesamten Bestand
- **Preispipeline** in drei Stufen, serverseitig nachgerechnet, keine
  Client-Preise
- **Bestellvorgang** gehärtet: Idempotenz, Doppelklick-Schutz, Zeitüberschreitung,
  vollständige serverseitige Prüfung
- **Zahlungsarchitektur** anbieterneutral, mit Testanbieter als
  Referenzimplementierung
- **Kalkulation** vollständig: Selbstkosten, Folienbelegung, Kostenebenen,
  Steuer, Preisstrategie — alles über Konfigurationswerte steuerbar
- **Adminbereich** für Bestellungen, Lieferanten und Lieferantenbestellungen
- **E-Mail** für Bestätigung, Stornierung, Versand, interne Benachrichtigung,
  Kontaktformular
- **Testmodus**, der den echten Serverweg fährt und nur externe Wirkungen
  abfängt

---

## Vorschlag zur Reihenfolge

1. **A1 Umsatzsteuer** — betrifft Datenbank, Anzeige, Rechnung und Recht
   zugleich; je später, desto mehr Bestellungen ohne Steuerausweis
2. **A3 Rechtstexte** — kleiner Aufwand, blockiert sonst den Start
3. **A4 Preise** — braucht Ihre zwei Entscheidungen
4. **A2 Stripe** — braucht Zugangsdaten von Ihnen
5. **B1 RLS** — kleine Korrektur
6. **B2–B5** nach Ihrer Priorität
7. **C** begleitend
