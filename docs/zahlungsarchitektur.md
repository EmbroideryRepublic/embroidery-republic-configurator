# Zahlungsabwicklung – Analyse und Architekturplan

> **Stand 2026-07-21. Analyse, noch keine Umsetzung.**
> Grundlage: `docs/geschaeftsarchitektur.md` (Stufenmuster, reine Logik,
> keine doppelte Geschäftslogik, Nachvollziehbarkeit) und
> `docs/roadmap-go-live.md` (B1).
>
> **Zweite Fassung.** Der erste Entwurf schlug zwei neue Tabellen und eine
> eigene Zustandsmaschine vor. Eine kritische Gegenprüfung (Abschnitt 4a)
> hat gezeigt, dass das bestehende Modell den Fall trägt. Übrig bleiben drei
> neue Spalten und zwei Umbenennungen an `orders`. Die verworfenen Vorschläge
> sind mit Begründung dokumentiert, damit die Entscheidung überprüfbar bleibt.

---

## 1. Der Bestellablauf heute – vollständig geprüft

Alles Folgende ist im Code nachgelesen, nicht geschätzt.

```
KUNDE                          SERVER                            DANACH
─────                          ──────                            ──────
Warenkorb
   │
"Zahlungspflichtig bestellen"
   │  submitOrder(items, contact, shipping,
   │              paymentMethod, clientRequestId)
   ▼
                    ① validateSubmission()      ← Katalogprüfung
                    ② priceCart()               ← AUTORITATIVER Preis
                    ③ Abweisung bei unpriceable /
                      shippingUnavailable / blocked /
                      Menge ≤ 0
                    ④ Idempotenzprüfung (client_request_id)
                    ⑤ INSERT orders             ← status='new'
                                                  payment_status='not_required'
                    ⑥ INSERT order_items,
                      configuration_elements
                    ⑦ Druckvorschauen rendern + hochladen
                    ⑧ Produktionsblatt-PDF
                    ⑨ verarbeiteBestelleingang():
                        • Kundenbestätigung SOFORT
                        • interne Meldung GEPLANT auf +2 h
   ◄── orderNumber
Bestätigungsansicht
                                                  2 h Stornofrist
                                                  (Kunde kann per Token
                                                   selbst stornieren)
                                                        │
                                                  Admin sieht die Bestellung
                                                        │
                                                  Lieferantenauftrag beim
                                                  Öffnen im Adminbereich
                                                        │
                                                  new → in_production
                                                      → shipped → completed
```

**Tragende Bausteine, die erhalten bleiben:**

| Baustein | Rolle |
|---|---|
| `lib/pricing/pipeline.ts` | einzige Preisquelle, dreistufig, liefert `grandTotal` |
| `lib/orders/orderValidation.ts` | serverseitige Katalogprüfung des Bestelleingangs |
| `lib/orders/orderService.ts` | **einziger** Mutationspunkt für den Bestellstatus |
| `config/orderStatus.ts` | Zustandsmaschine Fulfillment (rein, getestet) |
| `order_events` | append-only Historie, generisch über `event_type` |
| `lib/orders/orderVisibility.ts` | wann eine Bestellung im Admin erscheint |

---

## 2. Was an Zahlungs-Infrastruktur schon existiert

Migration `0004` hat vorgearbeitet – aber **kein einziges Feld wird heute
geschrieben oder gelesen**, und es gibt weder das Stripe-SDK noch eine
Webhook-Route.

| Vorhanden | Zustand |
|---|---|
| `orders.payment_status` (`not_required`/`pending`/`paid`/`failed`) | immer Vorgabewert `not_required` |
| `orders.stripe_checkout_session_id` (unique) | nie gesetzt |
| `orders.stripe_payment_intent_id` | nie gesetzt |
| `orders.paid_at` | nie gesetzt |
| `OrderPaymentMethod = 'card' \| 'paypal' \| 'invoice'` | Typ vorhanden |
| `SubmitResult.checkoutUrl` | deklariert, nie befüllt |
| Stripe-SDK, Webhook-Route, `.env`-Variablen | **fehlen vollständig** |

Die Grundentscheidung von 0004 ist richtig und wird beibehalten:
**Zahlungsstatus und Bestellstatus sind getrennte Felder.**
`status='new'` + `payment_status='pending'` ist kein Widerspruch, sondern
genau „angelegt, Bezahlvorgang läuft noch".

---

## 3. Befunde

Sortiert nach Schwere. B1–B4 sind echte Blocker, B5–B9 Fehlerquellen im
Betrieb, B10–B13 Entscheidungen bzw. Folgearbeiten.

### B1 — Die gewählte Zahlungsart wird nirgends gespeichert 🔴

Es gibt **keine Spalte `payment_method`**. Der Wert wandert durch
`submitOrder` in den transienten `OrderRecord`, wird für die E-Mail benutzt
und ist danach verloren. Heute unschädlich (nur Rechnungskauf), für die
Zahlungsabwicklung ein Blocker: Webhook, Adminbereich und Mahnlauf können
nicht wissen, wie bezahlt werden sollte.

### B2 — Wiederaufnahme braucht zwei Verhaltensregeln 🔴

`stripe_checkout_session_id` ist **eine Spalte**. Beim zweiten Versuch würde
die erste Referenz überschrieben. Zwei Gefahren:

1. Ein Webhook zum **ersten** Versuch ließe sich keinem Vorgang mehr zuordnen.
2. In einem alten Browser-Tab könnte der erste Vorgang noch bezahlt werden –
   die Zahlung wäre erfolgt, würde aber keiner Bestellung zugerechnet.

Der erste Entwurf löste das über eine Tabelle `payments`. Die Prüfung in
Abschnitt 4a zeigt: Beide Gefahren verschwinden durch zwei Verhaltensregeln
(Bestell-ID als Metadatum beim Anbieter; alten Vorgang vor der Wiederaufnahme
verwerfen) – **ohne zusätzliche Tabelle**. Die Versuchshistorie trägt
`order_events`.

### B3 — Die Spalten heißen `stripe_*` 🔴

Genau die Anbieterabhängigkeit, die Sie ausgeschlossen haben. PayPal bräuchte
`paypal_*`-Spalten, jede Auswertung eine Fallunterscheidung.

→ Anbieterneutral: `provider`, `provider_reference`, `provider_payment_id`.

### B4 — Der Bestelleingang ist ein einziger langer Vorgang 🔴

`persistAndNotifyCore` erledigt Anlegen, Rendern aller Druckvorschauen,
Hochladen, PDF-Erzeugung und E-Mail-Versand in einem Durchlauf. Bei
Kartenzahlung liegt zwischen „Bestellung angelegt" und „bezahlt" aber ein
Wechsel zu Stripe und zurück.

Ohne Trennung würden für **jeden abgebrochenen Bezahlvorgang** vollständige
Druckdaten erzeugt und hochgeladen – Rechenzeit und Speicher für
Bestellungen, die nie zustande kommen. Zusätzlich wartet die Kundschaft
diese Zeit, bevor sie überhaupt zur Bezahlseite kommt.

### B5 — Die Bestätigungsmail geht sofort raus 🟠

`verarbeiteBestelleingang` verschickt die Kundenbestätigung unmittelbar nach
dem Anlegen. Bei Kartenzahlung bekäme die Kundschaft eine Bestellbestätigung,
**bevor** sie bezahlt hat – und auch dann, wenn sie den Bezahlvorgang
abbricht. Fachlich und rechtlich falsch.

### B6 — Die Admin-Sichtbarkeit kennt keinen Zahlungsstatus 🟠

`imAdminSichtbar` prüft nur Stornofrist und Storno. Eine **unbezahlte**
Kartenbestellung erschiene nach zwei Stunden im Adminbereich – und beim
Öffnen entsteht der Lieferantenauftrag. Es würde Ware für eine nie bezahlte
Bestellung beschafft.

### B7 — Webhooks kommen mehrfach und ohne garantierte Reihenfolge 🟠

Stripe stellt mindestens einmal zu, nicht genau einmal, und ohne
Reihenfolgegarantie. `payment_intent.succeeded` kann vor
`checkout.session.completed` eintreffen; ein Ereignis kann Stunden später
erneut kommen. Ohne Schutz entstehen doppelte Bestätigungsmails oder ein
Zurückfallen von „bezahlt" auf „offen".

Der erste Entwurf sah dafür eine Ereignistabelle und eine Zustandsmaschine
vor. Beides ist entbehrlich: Eine bedingte Aktualisierung
(`where payment_status = 'pending'`) löst beide Fälle – siehe Abschnitt 4a.

### B8 — Die Rückkehr der Kundschaft und der Webhook laufen gegeneinander 🟠

Nach der Zahlung landet die Kundschaft auf unserer Erfolgsseite, oft
**bevor** der Webhook eingetroffen ist. Die Seite darf dann weder „nicht
bezahlt" behaupten noch die Zahlung selbst als bestätigt in die Datenbank
schreiben – sonst gäbe es zwei Wahrheitsquellen.

### B9 — Verwaiste Bezahlvorgänge 🟠

Kundschaft legt an, wird weitergeleitet, bricht ab, kommt nie zurück. Die
Bestellung bliebe dauerhaft auf `pending` und verstopfte jede Auswertung.
Es braucht eine Verfallsregel.

### B10 — Stornofrist trifft auf bezahlte Bestellung 🟡

Heute kann die Kundschaft zwei Stunden lang selbst stornieren. Hat sie
bereits per Karte bezahlt, muss dieselbe Aktion künftig eine
**Rückerstattung** auslösen. `storniereBestellungDurchKunden` kennt das
Konzept nicht.

### B11 — Der Betrag könnte sich zwischen Anlage und Zahlung ändern 🟡

Ändert sich ein Katalogpreis, während ein Bezahlvorgang läuft, ergäbe eine
Neuberechnung einen anderen Betrag als den bestätigten. Beides stillschweigend
zu nehmen wäre falsch – siehe Abschnitt 5.

### B12 — CHF-Anzeige mit fest verdrahtetem Näherungskurs 🟡

`currencyStore` rechnet Preise über eine statische Konstante in CHF um. Eine
Kundin in der Schweiz sieht CHF, bezahlt und schuldet aber EUR. Für eine
verbindliche Zahlung ist das eine Preisangabe, die wir nicht einhalten.
**Empfehlung:** Zahlung ausschließlich in EUR, CHF sichtbar als
unverbindliche Orientierung kennzeichnen. Geschäftsentscheidung – siehe
Abschnitt 9.

### B13 — Steuerausweis fehlt noch 🟡

`OrderConfig.taxPercent` steht auf 0. Zahlbar ist der Betrag trotzdem, eine
korrekte Rechnung ist er nicht. Abhängigkeit zu A2 (Steuerentscheidung),
kein Blocker für die technische Integration.

---

## 4. Zielarchitektur

### Grundgedanke: Stripe ist ein Adapter, kein Bestandteil der Geschäftslogik

```
      ┌──────────────────────────────────────────────┐
      │  BESTELLPROZESS (lib/orders, lib/actions)    │
      │  kennt: „eine Zahlung eröffnen",             │
      │         „eine Zahlung ist bestätigt"         │
      │  kennt NICHT: Stripe, PaymentIntent, Webhook │
      └───────────────────┬──────────────────────────┘
                          │  spricht nur über
                          ▼
      ┌──────────────────────────────────────────────┐
      │  lib/payments/   REINE ZAHLUNGSLOGIK         │
      │  • Zustandsmaschine (config/paymentStatus)   │
      │  • Betragsermittlung + Abgleich              │
      │  • Auswertung normalisierter Ereignisse      │
      │  • KEIN Anbieter-Import (Architekturtest)    │
      └───────────────────┬──────────────────────────┘
                          │  Port: ZahlungsAnbieter
            ┌─────────────┴─────────────┐
            ▼                           ▼
   providers/stripe.ts          providers/paypal.ts
   (kennt das Stripe-SDK)       (später, ohne Umbau)
```

Der Port – die einzige Schnittstelle, die der Bestellprozess kennt. Bewusst
auf **drei Methoden** beschränkt; alles Weitere kommt erst, wenn es gebraucht
wird:

```ts
interface ZahlungsAnbieter {
  readonly id: ZahlungsAnbieterId;              // 'stripe' | 'paypal' | …
  /** Eröffnet einen Bezahlvorgang. Betrag kommt vom Aufrufer, nie vom Client. */
  eroeffne(auftrag: Zahlungsauftrag): Promise<Zahlungseroeffnung>;
  /** Prüft die Signatur und normalisiert das Ereignis. null = ungültig. */
  leseEreignis(rohBody: string, signatur: string): ZahlungsEreignis | null;
  /** Erklärt einen offenen Vorgang für ungültig – Voraussetzung dafür,
   *  dass eine Wiederaufnahme ohne zweite Datensatzzeile sicher ist. */
  verwerfe(referenz: string): Promise<void>;
}
```

`ladeStand()` und `erstatte()` aus dem ersten Entwurf sind **entfallen**:
Ersteres wurde durch nichts belegt (Stripe stellt Webhooks bis zu drei Tage
lang erneut zu), Letzteres wird erst in S7 gebraucht und kommt dann dazu.

`ZahlungsEreignis` ist **normalisiert** – der Bestellprozess sieht nie einen
Stripe-Typ:

```ts
interface ZahlungsEreignis {
  ereignisId: string;        // zur Deduplizierung
  bestellId: string;         // aus den Metadaten des Anbieters
  art: 'bestaetigt' | 'fehlgeschlagen' | 'abgebrochen' | 'abgelaufen' | 'erstattet';
  betragCent: number;        // zum Abgleich, NICHT zur Übernahme
  waehrung: string;
  anbieterZahlungId?: string;
  grund?: string;
}
```

Damit erfüllt die Zahlung dasselbe Muster wie Preise (`StageResult`) und
Statuswechsel (`StatusErgebnis`) – ein Ergebnisobjekt mit Grund, keine
Ausnahmen als Steuerfluss.

### Zahlungsstatus – die vorhandenen vier Werte genügen

```
  not_required ← Rechnungskauf: es steht nichts aus
       │
    pending ──┬──► paid     (Endzustand, kein Rückschritt)
              └──► failed ──► pending   (Wiederaufnahme)
```

**Die eine Regel:** Ein Übergang ist nur aus `pending` heraus zulässig, und
`paid` ist endgültig. Sie steht ausschließlich in der WHERE-Bedingung der
Aktualisierung (Abschnitt 4a) – nicht zusätzlich als Modul, das mit ihr
auseinanderlaufen könnte.

Abbruch und Zeitablauf sind eigene *Gründe*, keine eigenen *Zustände*: sie
landen als `payment_abandoned` bzw. `payment_expired` in `order_events`,
während der Status `failed` lautet und eine Wiederaufnahme erlaubt.

### Datenmodell – siehe Abschnitt 4a

Der ursprüngliche Entwurf sah zwei neue Tabellen vor (`payments`,
`payment_events`). Diese Empfehlung wurde nach kritischer Prüfung
**zurückgezogen**. Die Begründung steht in Abschnitt 4a; das tatsächliche
Datenmodell ist dort beschrieben.

---

## 4a. Prüfung: Reicht das bestehende Modell?

Geprüft wurde jede vorgeschlagene Struktur einzeln gegen die Frage: *Lässt
sich die Anforderung mit dem lösen, was schon da ist?*

### Ergebnis vorweg

| Ursprünglich vorgeschlagen | Ergebnis der Prüfung |
|---|---|
| Tabelle `payments` | **verworfen** – `orders` + `order_events` tragen den Fall |
| Tabelle `payment_events` | **verworfen** – bedingte Aktualisierung genügt |
| Modul „Zahlungs-Zustandsmaschine" | **verworfen** – wäre doppelte Regel (G3) |
| Spalte `payment_method` | **beibehalten** – B1, ohne Alternative |
| Anbieterneutrale Benennung | **beibehalten** – B3, reine Umbenennung |
| Spalte `payment_started_at` | **neu begründet** – siehe unten |
| Port `ZahlungsAnbieter` | **beibehalten, aber verkleinert** auf zwei Methoden |

Statt zweier Tabellen mit rund fünfzehn Feldern bleiben **drei Spalten und
zwei Umbenennungen** an einer bestehenden Tabelle.

### Warum keine Tabelle `payment_events`

Ihr Zweck wäre, erneut zugestellte Webhooks nicht doppelt zu verarbeiten.
Dasselbe leistet eine **bedingte Aktualisierung** – das Muster, das
`setzeBestellstatus` (`.eq('status', von)`) und
`storniereBestellungDurchKunden` (`.neq('status','cancelled')`) im Projekt
bereits verwenden:

```sql
update orders
   set payment_status = 'paid', paid_at = now(), payment_transaction_id = $2
 where id = $1
   and payment_status = 'pending'      -- ← der gesamte Schutz
returning id;
```

- **Zweite Zustellung desselben Ereignisses:** trifft null Zeilen. Alle
  Folgeschritte (E-Mail, Druckdaten) werden übersprungen. Erledigt.
- **Zwei verschiedene Ereignisse, die beide „bezahlt" bedeuten**
  (`checkout.session.completed` und `payment_intent.succeeded`): nur das
  erste gewinnt. Keine doppelte Bestätigungsmail.
- **Verspätetes „fehlgeschlagen" nach „bezahlt":** die Bedingung greift
  nicht, der Rückschritt ist ausgeschlossen. Das ist **B7 vollständig
  gelöst** – ohne Tabelle, ohne Zustandsmaschine.

Eine Ereignistabelle würde zusätzlich die Ereignis-ID festhalten. Deren
einziger weiterer Nutzen wäre die Nachvollziehbarkeit – und die gehört nach
`order_events.detail`, wo sie ohne Migration hinpasst.

### Warum keine Tabelle `payments`

Der ursprüngliche Grund war „mehrere Zahlungsversuche je Bestellung". Die
Prüfung zeigt, dass dafür **keine zweite Zeile nötig** ist, sondern zwei
Verhaltensregeln:

1. **Die Anbieter-Referenz ist nicht der Schlüssel zur Bestellung.** Unsere
   Bestell-ID wird dem Anbieter als Metadatum mitgegeben. Ein Webhook findet
   die Bestellung deshalb auch dann, wenn die gespeicherte Referenz
   inzwischen zu einem neueren Versuch gehört.
2. **Beim Wiederaufnehmen wird der alte Vorgang beim Anbieter für ungültig
   erklärt**, bevor ein neuer eröffnet wird. Damit kann es nie zwei
   gleichzeitig bezahlbare Vorgänge geben – das Szenario „Kundin hat zwei
   Tabs offen und bezahlt im alten" ist ausgeschlossen.

Was ohne eigene Tabelle verloren ginge, wäre die **Historie der Versuche**.
Die gehört aber ohnehin nicht in eine Zustandstabelle, sondern in
`order_events` – dessen Migration genau das ankündigt:

> „Bewusst OFFEN gehalten: `event_type` ist Freitext und `detail` ein
> JSONB-Feld. Ein neues Ereignis braucht damit KEINE Migration."

Zahlungsversuche werden als `payment_started`, `payment_succeeded`,
`payment_failed`, `payment_abandoned` protokolliert, mit Referenz, Betrag und
Grund im `detail`. Das ist **exakt das Muster, das die Bestellung schon
nutzt**: aktueller Zustand an `orders`, Verlauf in `order_events`. Eine
Zahlungstabelle würde daneben eine zweite Historienführung aufbauen.

**Wann diese Entscheidung kippt** – bewusst benannt, damit sie überprüfbar
bleibt:

| Auslöser | Warum dann eine Tabelle nötig wird |
|---|---|
| Teilzahlungen oder Anzahlungen | mehrere gleichzeitig gültige Zahlungen je Bestellung |
| Teilerstattungen in mehreren Schritten | mehrere Buchungen je Zahlung |
| Buchhaltung verlangt strukturierte Zahlungsdatensätze | JSONB-Auswertung wird unzumutbar |

Keiner dieser Fälle ist heute gefordert. Und der Wechsel bleibt jederzeit
möglich: Weil `order_events` den Verlauf vollständig führt, lässt sich eine
Tabelle später **aus der Historie befüllen** – es geht nichts verloren.

### Warum keine eigene Zustandsmaschine

`config/orderStatus.ts` ist gerechtfertigt: fünf Zustände, verzweigter Graph,
und der Adminbereich muss die erlaubten Übergänge **anbieten**.

Beim Zahlungsstatus liegt beides anders. Es gibt vier Werte, keine Oberfläche
wählt einen Übergang aus, und die gesamte Regel lautet: *nur aus `pending`
heraus, und `paid` ist endgültig*. Diese Regel steht bereits in der
WHERE-Bedingung oben. Sie ein zweites Mal als reine Funktion zu formulieren,
wäre genau die doppelte Geschäftslogik, die G3 verbietet – mit dem üblichen
Risiko, dass beide Fassungen auseinanderlaufen.

Die vorhandenen vier Werte `not_required`/`pending`/`paid`/`failed` genügen:

- **abgebrochen** und **abgelaufen** sind für den weiteren Ablauf identisch
  mit `failed` – nicht bezahlt, erneut versuchbar. Der Unterschied ist rein
  informativ und gehört in `order_events.reason`.
- **erstattet** ist fachlich wirklich etwas anderes. Es wird aber erst in S7
  gebraucht und dann als ein Wert im Constraint ergänzt – nicht auf Vorrat.

### Was bleibt: drei neue Spalten, zwei Umbenennungen

```sql
-- B1: die gewählte Zahlungsart wird bisher nirgends gespeichert
alter table orders add column payment_method text;

-- B3: anbieterneutral. Reine Umbenennung – die Spalten sind leer,
--     das Risiko ist null.
alter table orders rename column stripe_checkout_session_id to payment_reference;
alter table orders rename column stripe_payment_intent_id  to payment_transaction_id;

-- Ohne diese Angabe ist die Referenz nicht deutbar: 'card' sagt nicht,
-- WER die Zahlung abgewickelt hat. Für eine Erstattung Jahre später ist
-- genau das die entscheidende Information.
alter table orders add column payment_provider text;

-- Zeitpunkt des LAUFENDEN Versuchs.
alter table orders add column payment_started_at timestamptz;
```

**Warum `payment_started_at` nötig ist.** Der Verfall unbezahlter Vorgänge
(B9) folgt idealerweise dem Muster von `orderVisibility`: Zustand aus
`created_at` + Konstante berechnen, kein Flag, kein Job. Das trägt hier aber
nicht – nach einer Wiederaufnahme ist `created_at` alt, der neue Versuch
aber frisch, und er würde sofort als verfallen gelten. Der Wert aus
`order_events` abzuleiten scheidet ebenfalls aus: die Historie ist laut
eigener Festlegung „Nachweis, nicht Steuerung". Bleibt eine Spalte.

Zwei Felder für die Referenz sind kein Überbau, sondern zwei verschiedene
Dinge, die beide gebraucht werden: `payment_reference` ist der **Vorgang**
(Stripe-Session, PayPal-Order) – nötig zum Fortsetzen; `payment_transaction_id`
ist die **Buchung** (PaymentIntent, Capture) – nötig zum Erstatten.

---

## 5. Der Betrag – die heikelste Stelle

Ihre Vorgabe: der Client übermittelt nie einen Preis, alle Beträge kommen
serverseitig aus der Preisengine.

**Umsetzung beim Eröffnen einer Zahlung:**

```
1. Client sendet: Bestell-ID + Absendekennung.       ← sonst NICHTS
2. Server lädt die Bestellung aus der Datenbank.
3. Server rechnet den Betrag über calculatePipeline NEU.
4. Server vergleicht Neuberechnung mit orders.total_price.
     ├─ gleich  → Betrag in Cent, PaymentIntent eröffnen
     └─ ungleich → KEINE Zahlung. Blockieren, protokollieren,
                   Kundschaft auf uns verweisen.
5. Betrag = Math.round(grandTotal * 100), ganze Cent.
```

Schritt 4 ist der Punkt, an dem B11 gelöst wird. Stillschweigend den
niedrigeren Betrag zu nehmen wäre ein Verlust, den höheren eine Preisangabe,
die die Kundschaft nie gesehen hat. Beides ist schlechter als eine ehrliche
Unterbrechung – dasselbe Prinzip wie `blocked` in der Preispipeline.

Der vom Anbieter gemeldete Betrag im Webhook wird **abgeglichen, nie
übernommen**: Weicht er ab, gilt das als Störung und die Zahlung wird nicht
als bestätigt gewertet.

---

## 6. Kritische Abläufe

### Erfolgreiche Kartenzahlung

```
Kunde                Server                    Stripe            Webhook
─────                ──────                    ──────            ───────
"bestellen"
   │  submitOrder(…, paymentMethod:'card')
   ▼
        Bestellung anlegen (status='new',
        payment_status='pending')
        ⚠ KEINE Druckvorschauen
        ⚠ KEINE Bestätigungsmail
        ⚠ KEINE interne Meldung
   │
        Zahlung eröffnen ──────────────► Session
   ◄── checkoutUrl
Weiterleitung ─────────────────────────► Bezahlseite
                                         bezahlt
   ◄──────────────────────────────────── zurück auf /bestellung/…
        Seite zeigt „wird bestätigt"                    │
                                                        ▼
                                          checkout.session.completed
        ① Signatur prüfen (Rohtext!)
        ② Bestellung über die Metadaten finden
        ③ Betrag abgleichen
        ④ UPDATE … WHERE payment_status='pending'
           ← trifft 0 Zeilen bei Wiederholung: fertig
        ⑤ order_events: 'payment_succeeded'
        ⑥ JETZT: Druckvorschauen, PDF,
           Bestätigungsmail, interne Meldung
```

Schritt ④ ersetzt Ereignistabelle **und** Zustandsmaschine: Die Bedingung
allein verhindert doppelte Verarbeitung und jeden Rückschritt.

Schritt ⑥ ist die Auflösung von B4 und B5: Die teure und die nach außen
sichtbare Arbeit passiert **erst nach bestätigter Zahlung** – und für den
Rechnungskauf unverändert sofort, weil dort keine Zahlung aussteht.

### Abbruch und Wiederaufnahme

```
Bezahlvorgang abgebrochen
   → orders.payment_status = 'failed'
   → order_events: 'payment_abandoned' (Referenz + Grund im detail)
   → Bestellung bleibt bestehen, für den Admin UNSICHTBAR (B6)

Kunde öffnet später seinen Bestell-Link
   → „Zahlung fortsetzen"
   → ① alten Vorgang beim Anbieter verwerfen  ← verhindert, dass in einem
   →                                             alten Tab noch bezahlt wird
   → ② neuen Vorgang eröffnen, Referenz überschreiben
   → ③ payment_status zurück auf 'pending', payment_started_at = jetzt
   → order_events: 'payment_started' (zweiter Eintrag – der erste bleibt)
```

Der Verlauf beider Versuche steht vollständig in `order_events`. Was
`orders` trägt, ist der **aktuelle** Zustand – dasselbe Verhältnis wie
zwischen `orders.status` und der Statushistorie.

### Verfall

Eine Bestellung, deren `payment_started_at` länger als die Verfallsdauer
zurückliegt und die weiterhin auf `pending` steht, wird auf `failed` gesetzt
und storniert – mit Ereignis `payment_expired` in `order_events`. Auslöser
ist der vorhandene Cron-Pfad (`app/api/cron/`), kein neuer Mechanismus.

---

## 7. Umsetzungsplan

Jede Stufe ist einzeln abnehmbar (tsc, ESLint, Tests, wo sichtbar: Browser).

| Stufe | Inhalt | Abhängigkeit |
|---|---|---|
| **S1** | Migration 0012: drei neue Spalten, zwei Umbenennungen an `orders` (Abschnitt 4a). Keine neue Tabelle. | – |
| **S2** | Port `ZahlungsAnbieter` (drei Methoden) + reine Zahlungslogik in `lib/payments/`: Betragsermittlung mit Abgleich (Abschnitt 5), Normalisierung der Ereignisse. **Architekturtest**: `lib/payments/` außerhalb `providers/` darf nichts vom Anbieter importieren. Vollständig testbar ohne Stripe-Konto. | S1 |
| **S3** | Bestelleingang in zwei Phasen trennen: „anlegen" und „abschließen". Rechnungskauf durchläuft beide sofort und verhält sich **unverändert**. Löst B4/B5. | S2 |
| **S4** | `imAdminSichtbar` und Lieferantenauslösung um den Zahlungsstatus erweitern (B6). Zahlungsstatus in Adminliste und Bestelldetail. | S3 |
| **S5** | Stripe-Adapter + Route `POST /api/webhooks/stripe` mit Signaturprüfung auf dem Rohtext, Ereignis-Deduplizierung, Betragsabgleich. 🔒 **braucht Ihren Testschlüssel** | S2 |
| **S6** | Checkout-Oberfläche: Zahlartauswahl, Weiterleitung, Rückkehrseite mit „wird bestätigt"-Zustand (B8), Wiederaufnahme im Bestell-Link. | S5 |
| **S7** | Storno bei bezahlter Bestellung → Rückerstattung (B10). Verfallslauf für verwaiste Vorgänge (B9). | S5 |
| **S8** | Abnahme: Prüfstrecke analog `scripts/qaBestellabschluss.mts` gegen Stripe-Testmodus – erfolgreiche Zahlung, Ablehnung (Testkarte), Abbruch, doppelt zugestellter Webhook, Wiederaufnahme. | S5–S7 |

**S1–S4 sind ohne Ihr Stripe-Konto vollständig umsetzbar und prüfbar.** Sie
sind zugleich der größere Teil der Arbeit, weil dort die Architektur
entsteht. Der eigentliche Stripe-Adapter (S5) ist vergleichsweise klein –
genau das ist das Ziel: Stripe bleibt austauschbar.

---

## 8. Was sich am Bestehenden ändert – und was nicht

**Unverändert:**
- Die Preispipeline bleibt die einzige Preisquelle. Kein Betrag entsteht
  irgendwo sonst.
- `orderService.setzeBestellstatus` bleibt der einzige Mutationspunkt für den
  Fulfillment-Status. Zahlungen ändern ihn **nicht** direkt.
- `order_events` bleibt die Historie; Zahlungsereignisse kommen als neue
  `event_type` hinzu, ohne Migration.
- Der Rechnungskauf verhält sich exakt wie heute.

**Erweitert:**
- Bestelleingang zerfällt in „anlegen" und „abschließen" (S3).
- Admin-Sichtbarkeit bekommt eine zweite Bedingung (S4).
- Stornierung kennt den Fall „bereits bezahlt" (S7).

---

## 9. Was ich von Ihnen brauche

| # | Benötigt | Wofür | Blockiert |
|---|---|---|---|
| 1 🔒 | **Stripe-Konto + Testschlüssel** (`sk_test_…`, `pk_test_…`, Webhook-Signaturschlüssel). Das Konto legen Sie an – ich richte alles Weitere ein. | S5 | S5–S8 |
| 2 | **Währungsentscheidung** zu B12: Zahlung nur in EUR und CHF als unverbindliche Orientierung kennzeichnen? (meine Empfehlung) | Anzeige + Zahlung | S6 |
| 3 | **Zahlungsartzuschläge**: soll eine Zahlart einen Zuschlag tragen? Der Baustein existiert (`OrderConfig.paymentSurcharge`), steht auf 0. | Betragsermittlung | S6 |
| 4 | **Verfallsdauer** eines unbezahlten Bezahlvorgangs (Vorschlag: 24 Stunden) | B9 | S7 |
| 5 | **Stornofrist bei bezahlter Bestellung**: Rückerstattung automatisch oder nach Ihrer Freigabe? (Empfehlung: automatisch innerhalb der Frist) | B10 | S7 |
| 6 | Steuerentscheidung A2 – nicht blockierend, aber vor dem Livegang nötig | korrekte Rechnung | – |

---

## 10. Empfehlung

Mit **S1–S4** beginnen. Diese Stufen brauchen weder Ihr Stripe-Konto noch
eine der offenen Entscheidungen, beseitigen die schweren Befunde B1–B6, und
lassen sich vollständig testen. Wenn Ihr Testschlüssel vorliegt, ist der
Adapter aufgesetzt, statt dann erst die Architektur zu bauen.

Der strukturelle Eingriff ist dabei klein: **eine Migration mit drei neuen
Spalten und zwei Umbenennungen.** Das Gewicht der Arbeit liegt nicht im
Datenmodell, sondern in der Trennung des Bestelleingangs in „anlegen" und
„abschließen" (S3) – und die ist kein Zubau, sondern eine Umstellung von
Bestehendem.

---

## 11. Umsetzungsprotokoll

### S1 — abgeschlossen am 2026-07-21

**Migration `0012_payment_fields_provider_neutral.sql`** angewendet:
`payment_reference`, `payment_transaction_id` (umbenannt aus `stripe_*`),
neu `payment_method`, `payment_provider`, `payment_started_at`.
**Code:** Die Zahlungsart wird beim Anlegen gespeichert und im
Bestelldetail des Adminbereichs angezeigt. Sonst keine Verhaltensänderung –
`payment_provider` und `payment_started_at` bleiben leer, bis Stripe aktiv
wird.

#### Fachliche Entscheidung: Bestandsdaten nachgetragen

Die 27 bereits erfassten Bestellungen haben `payment_method = 'invoice'`
erhalten. Das ist **keine Annahme**: Im Checkout war
`const paymentMethod = 'invoice' as const` fest verdrahtet – jede bis dahin
erfasste Bestellung *ist* ein Rechnungskauf. Es wurden ausschließlich leere
Felder gefüllt, kein vorhandener Wert verändert.

Die eine Anfrage (`order_type = 'inquiry'`) bleibt bewusst ohne Zahlungsart:
Eine Anfrage ist keine Bestellung, und eine erfundene Angabe wäre schlechter
als eine ehrliche Leerstelle.

#### Befund am Rande: Migration 0011 war nie angewendet

Bei der Bestandsaufnahme vor S1 zeigte sich, dass Migration `0011` (aus A6)
zwar im Repository lag, aber **nie eingespielt worden war**. Da der Code
seither `client_request_id` mitschreibt, schlug **jede Bestellung** mit
einem Datenbankfehler fehl. Aufgefallen war das nicht, weil die
Abnahme-Prüfstrecke `qaBestellabschluss.mts` alle Absende-Requests abfängt
und den Serverpfad damit bewusst nicht durchläuft.

**Konsequenz für die Arbeitsweise:** Eine Migration gilt erst als erledigt,
wenn sie *angewendet und verifiziert* ist – nicht, wenn die Datei existiert.
Dafür gibt es jetzt `scripts/applyMigration.mjs`: transaktional (ein Fehler
rollt alles zurück), mit Bestandsvergleich vor und nach der Anwendung und
einem Probelauf-Schalter `--dry`.

### S2 — abgeschlossen am 2026-07-21

**Kein einziger Eingriff in bestehende Geschäftslogik.** S2 besteht
ausschließlich aus neuen Dateien unter `lib/payments/`. Bestellprozess,
Preispipeline, Statusverwaltung und Oberfläche sind unverändert; es gab keine
Migration.

| Datei | Rolle |
|---|---|
| `types.ts` | der Port + normalisierte Begriffe. Kennt keinen Anbieter. |
| `betrag.ts` | die Betragsregel aus Abschnitt 5, rein und vollständig testbar |
| `registry.ts` | die **einzige** Datei, die konkrete Anbieter kennt |
| `providers/testAnbieter.ts` | erste vollwertige Umsetzung des Ports |

Nachweis: 272 Tests (vorher 245), davon 27 neue. Der End-to-End-Test läuft
unverändert 19/19 durch.

#### Fachliche Entscheidung: Der Testanbieter ist kein Mock

Er wird über die reguläre Anbieterauswahl gewählt, durchläuft denselben Code
und erzeugt dieselben Ereignisse wie ein echter Anbieter – er ist der vierte
Rand nach dem Muster von E-Mail, Dateien und Lieferanten. Dadurch ist der
gesamte Zahlungsablauf prüfbar, ohne ein fremdes Konto und ohne dass je Geld
bewegt wird.

Er hält sich bewusst an dieselben Zusagen wie ein echter Anbieter,
insbesondere **Idempotenz** (gleicher Schlüssel → derselbe Vorgang) und
**Signaturprüfung**. Ein nachlässigeres Testdoppel würde genau die Fehler
verdecken, die es finden soll.

#### Fachliche Entscheidung: Der Testmodus überstimmt die Anbieterwahl

Läuft der Testmodus, wird immer der Testanbieter genommen – auch wenn
ausdrücklich ein anderer verlangt wird. Ohne diesen Vorrang könnte ein
Testlauf gegen eine Umgebung mit hinterlegten Zugangsdaten einen echten
Bezahlvorgang anlegen. Dieselbe Überlegung wie bei der
Lieferantenautomatisierung.

Umgekehrt gilt: Außerhalb des Testmodus weicht die Auswahl **niemals** auf
den Testanbieter aus. Solange Stripe fehlt, scheitert eine Zahlung dort mit
klarer Meldung. Ein Testdoppel im Produktivbetrieb wäre der gefährlichste
denkbare Fehler dieser Schicht: Bestellungen würden als bezahlt gelten, ohne
dass Geld geflossen ist.

#### Was die Architekturtests dauerhaft erzwingen

- Anbieter-SDKs (auch `paypal`, `mollie`, `adyen` …) nur unter `providers/`
- nur `registry.ts` darf aus `providers/` importieren
- außerhalb von `lib/payments/` importiert niemand einen Anbieter
- Bezeichner wie `stripeSession` oder `paypalOrderId` sind außerhalb der
  Zahlungsschicht unzulässig (Kommentare bleiben erlaubt – über einen
  Anbieter zu *schreiben* ist in Ordnung, mit ihm zu *rechnen* nicht)
- der Port hat genau drei Methoden – wächst er, ist das eine bewusste
  Entscheidung und kein Versehen

#### Korrektur am Rande

Die erste Fassung von `euroZuCent` trug eine Begründung, die ich nicht
gemessen hatte. Nachgeholt: Für Beträge mit zwei Nachkommastellen – also
alles, was die Preispipeline liefert – sind die naive Rechnung und der
Umweg über `toFixed(2)` **identisch** (geprüft für 0–1000 € in
Cent-Schritten). Erst ab der dritten Nachkommastelle gehen sie auseinander,
und dort ist `toFixed` das genauere Verfahren (0,015 € → 1 Cent statt 2).
Der Umweg bleibt, weil er nichts kostet – aber die Begründung im Code nennt
jetzt Messwerte statt Vermutungen.

### S3 — abgeschlossen am 2026-07-21

Der Bestelleingang ist in zwei Phasen getrennt. **Reine Extraktion – der
verschobene Code ist derselbe, kein Verhalten hat sich geändert.** Keine
Migration, keine Änderung an Oberfläche, Preisen oder Statusverwaltung.

```
PHASE 1  ANLEGEN        lib/actions/orders.ts
         prüfen → bepreisen → orders/order_items/configuration_elements
         speichern → Logodateien ablegen
         ▶ Danach EXISTIERT die Bestellung.
              │
PHASE 2  ABSCHLIESSEN   lib/orders/orderCompletion.ts   ← neu
         Druckvorschauen → Produktionsblatt → Benachrichtigungen
         ▶ Läuft künftig erst nach bestätigter Zahlung.
```

#### Fachliche Entscheidung: Wo genau die Grenze liegt

Nicht am Datenbank-Insert, sondern an **teuer oder nach außen sichtbar**:

| Schritt | Phase | Warum |
|---|---|---|
| Validierung, Preise, Datensätze | 1 | macht die Bestellung überhaupt gültig |
| **Logodateien hochladen** | **1** | `configuration_elements` verweist darauf – ohne sie wäre eine unbezahlte Bestellung unvollständig gespeichert. Klein (wenige KB). |
| Druckvorschauen | 2 | im Testlauf **4,3 MB** je Ansicht |
| Produktionsblatt | 2 | im Testlauf **3,1 MB** |
| Bestätigung + interne Meldung | 2 | nach außen sichtbar – eine Bestellbestätigung für einen abgebrochenen Bezahlvorgang wäre schlicht falsch |

#### Fachliche Entscheidung: Phase 2 bekommt den Datensatz, statt ihn zu laden

Beim Rechnungskauf liegt er ohnehin im Speicher; ein zusätzlicher Ladevorgang
wäre reine Verschwendung.

**Was S5 zusätzlich braucht** – bewusst nicht auf Vorrat gebaut, aber
benannt: Der Zahlungs-Webhook kennt nur die Bestell-ID und muss den Datensatz
rekonstruieren. Dafür fehlt `order_items.total_price`.

> **Korrektur (S5):** Die hier ursprünglich genannte Begründung – Ableitung
> sei „falsch, sobald Rüstkosten aktiv sind" – war unzutreffend. Rüstkosten
> stecken bereits im gespeicherten `unit_price` (`calculatePrice` gibt den
> *effektiven* Stückpreis `totalPrice / quantity` zurück). Der tatsächliche
> Grund ist die Rundung; nachgemessen in Abschnitt „S5".

#### Absicherung gegen Rückfall

Die Trennung ist unsichtbar – holt jemand später „schnell noch" eine Mail ins
Anlegen zurück, funktioniert alles weiter, bis Zahlungen aktiv sind und
Bestätigungen für unbezahlte Bestellungen hinausgehen. Deshalb ist sie
festgeschrieben (`lib/orders/__tests__/phasentrennung.test.ts`):

- das Anlegen importiert nichts aus Rendering, Produktionsblatt oder E-Mail
- der Abschluss wird an **genau einer** Stelle angestoßen
- der Abschluss hängt nicht an der Server-Action (der Webhook braucht ihn)
- der Abschluss berichtet Probleme, statt zu werfen
- der Abschluss kommt **nach** dem Speichern der Konfigurationselemente

#### Nachweis

277 Tests (vorher 272), tsc und ESLint sauber, End-to-End-Test unverändert
**19/19** – Bestellung, Positionen, Motive, Produktionsblatt, Historie und
abgefangene E-Mails wie zuvor. Genau das ist der Beleg für
Rückwärtskompatibilität: Der Rechnungskauf verhält sich identisch.

### S4 — abgeschlossen am 2026-07-21

Der Adminbereich kennt jetzt den Zahlungszustand. Behebt **B6**: Bisher hätte
eine unbezahlte Kartenbestellung nach Ablauf der Stornofrist in der
Bearbeitungsliste gestanden – und beim ersten Öffnen der Detailseite wäre der
Lieferantenauftrag entstanden. Ware für einen abgebrochenen Bezahlvorgang.

**Der Rechnungskauf verhält sich unverändert.** Jede bestehende Bestellung
trägt `payment_status = 'not_required'`, und dieser Zustand gilt
ausdrücklich als bearbeitbar.

#### Wie klein der Eingriff ausfiel

Die bestehende Struktur trug den Fall bereits vollständig: `imAdminSichtbar`
ist die EINE Regel, und die Lieferantenauslösung liegt schon **hinter** der
Prüfung in `getOrderDetail`. Sie ist damit ohne eigenes Zutun mit
abgesichert.

Erweitert wurden nur drei Stellen:

| Stelle | Änderung |
|---|---|
| `orderVisibility.ts` | eine Bedingung; `paymentStatus` in der Eingabe |
| `admin/data.ts` (Liste) | Datenbankfilter `.in('payment_status', …)` |
| `admin/data.ts` (Detail) | `paymentStatus` an die Prüfung durchgereicht |

Dass es wirklich nur diese sind, hat der Compiler bewiesen: `paymentStatus`
ist **Pflichtfeld**, kein optionales mit Standardwert. Ein Standardwert hätte
bedeutet, dass ein vergessener Aufrufer eine unbezahlte Bestellung
stillschweigend sichtbar macht – genau der Fehler, den die Regel verhindern
soll. Nach der Umstellung meldete der Compiler ausschließlich Testdateien,
kein Produktivcode war übersehen worden.

#### Fachliche Entscheidung: `failed` bleibt unsichtbar

Eine fehlgeschlagene Zahlung erscheint nicht im Adminbereich. Begründung: Der
Zweck der Liste ist ausdrücklich, „nur zu zeigen, was tatsächlich zu
bearbeiten ist" – und eine unbezahlte Bestellung ist das nicht. Die
Kundschaft kann den Vorgang wieder aufnehmen; scheitert das dauerhaft,
verfällt er (S7).

**Konsequenz, die bewusst in Kauf genommen wird:** Der Betrieb erfährt so
nicht, dass Zahlungen scheitern. Sobald das relevant wird – etwa um
nachzufassen –, gehört das in eine EIGENE Ansicht „offene Zahlungen", nicht
in die Bearbeitungsliste. Nicht auf Vorrat gebaut.

#### Eine Liste, zwei Anwendungsorte

`BEARBEITBARE_ZAHLUNGSZUSTAENDE` wird von der Regel **und** vom
Datenbankfilter genutzt. Liefen die beiden auseinander, wäre eine Bestellung
in der Liste sichtbar, über die Detailseite aber nicht erreichbar – oder
umgekehrt, was der gefährlichere Fall wäre. Ein Test prüft die Deckung.

Nebenbei zusammengeführt: `PAYMENT_LABELS` lag lokal in `admin/page.tsx`.
Weil das Bestelldetail den Zustand jetzt ebenfalls anzeigt, liegt die Tabelle
als `PAYMENT_STATUS_LABELS` neben `OrderPaymentStatus` – statt sie zu
verdoppeln.

#### Nachweis

294 Tests (vorher 287), davon 7 neue zur Sichtbarkeit. tsc und ESLint sauber,
End-to-End-Test unverändert **19/19**.

### S5 — Analyse und Vorbereitung (2026-07-21), Anbindung noch offen

Bewusst **ohne Zugangsdaten** begonnen: erst die Struktur, dann die
Verbindung.

#### Die Spalte `order_items.total_price` – nachgemessen

Die Frage war, ob der Positionsgesamtpreis nicht aus `unit_price × quantity`
rekonstruierbar ist. **Er ist es nicht**, und der Grund ist ein anderer als
zunächst behauptet:

`calculatePrice` gibt als `unitPrice` den **effektiven** Stückpreis zurück –
`totalPrice / quantity`, auf Cent gerundet. Beim Zurückmultiplizieren geht
der Rundungsrest verloren, multipliziert mit der Menge:

| Beleg | Ableitung | Gespeichert | Differenz |
|---|---|---|---|
| eigener E2E-Lauf | 7,88 € × 3 = 23,64 € | 23,65 € | 1 Cent |
| alte Testbestellung | 6,69 € × 10 = 66,90 € | 66,93 € | 3 Cent |
| rechnerisch bei 90 Stück | | | bis 33 Cent |

Ohne die Spalte stünde in Bestätigungsmail und Produktionsblatt ein
Positionspreis, der **addiert nicht die Gesamtsumme ergibt**. Bei einer
Rechnung ein kaufmännischer Fehler.

> **Korrektur:** Frühere Notizen nannten Rüstkosten als Grund. Das war
> falsch – Rüstkosten stecken bereits im `unit_price`. Migration `0013`
> trägt die richtige Begründung.

Migration 0013 angewendet (Bestand unverändert), Bestandspositionen mit der
bestmöglichen Näherung nachgetragen. Der E2E-Test prüft die Abweichung
seitdem bei **jedem** Lauf mit – die Begründung bleibt damit überprüfbar
statt nur behauptet.

#### `ladeBestellungFuerAbschluss` – der Weg des Webhooks

Neu in `orderCompletion.ts`: rekonstruiert eine Bestellung samt Positionen
und Motiven allein aus der Bestell-ID. Genau das braucht der Webhook, der
den Speicher der ursprünglichen Anfrage nicht hat. Wirft nicht – ein
Webhook-Endpunkt muss antworten können.

#### Was für die Anbindung noch fehlt

| Baustein | Was zu tun ist | Braucht Zugangsdaten? |
|---|---|---|
| **Checkout-Start** | Server Action: Bestellung anlegen (Phase 1) → Betrag über `pruefeZahlbetrag` → `anbieter.eroeffne()` → `payment_reference`, `payment_provider`, `payment_started_at`, `payment_status='pending'` speichern → `checkoutUrl` zurückgeben | nein |
| **Webhook-Eingang** | Route `POST /api/webhooks/stripe`: **Rohtext** lesen (jede Umformung macht die Signatur ungültig) → `anbieter.leseEreignis()` → Bestellung über die Metadaten finden → Betrag abgleichen | nein (Route), ja (Signaturprüfung) |
| **Statusübergang** | `update orders set payment_status='paid' … where payment_status='pending'` – die bedingte Aktualisierung ist zugleich der Idempotenzschutz | nein |
| **Abschluss auslösen** | bei `bestaetigt`: `ladeBestellungFuerAbschluss` → `schliesseBestellungAb` | nein |
| **Wiederaufnahme** | alten Vorgang `verwerfe()` → neuen eröffnen → `payment_started_at` neu setzen | nein |
| **Stripe-Adapter** | `providers/stripe.ts`: die drei Portmethoden | **ja** |

Nur der letzte Punkt braucht Ihre Schlüssel. Alles darüber lässt sich gegen
den Testanbieter vollständig prüfen.

#### Idempotenz – ohne neue Struktur

Drei Ebenen, alle bereits vorhanden:

1. **Beim Eröffnen:** `idempotenzSchluessel` im Port – ein wiederholter
   Aufruf liefert denselben Vorgang (im Port-Vertrag getestet).
2. **Beim Webhook:** `where payment_status='pending'` – die zweite
   Zustellung trifft null Zeilen, alle Folgeschritte entfallen. Verhindert
   zugleich den Rückschritt von „bezahlt".
3. **Beim Abschluss:** `verarbeiteBestelleingang` prüft
   `internal_notification_email_id` und bricht ab, wenn schon verarbeitet.

Keine Ereignistabelle, keine Zustandsmaschine – siehe Abschnitt 4a.

#### Was unverändert bleibt

Preispipeline, Validierung, Statusmaschine, Stornoablauf, Lieferantenweg,
Oberfläche des Rechnungskaufs. Stripe liefert ausschließlich **Ereignisse**;
jede fachliche Entscheidung – ob der Betrag stimmt, ob abgeschlossen werden
darf, wann der Adminbereich die Bestellung zeigt – fällt weiterhin in
unserem Code.

#### Nachweis

294 Tests, tsc und ESLint sauber, End-to-End **21/21** (zwei neue Prüfungen
zur gespeicherten Positionssumme).

---

### S5b — Zahlungsstrecke fertig, ohne Stripe (2026-07-21)

Der vollständige Zahlungsablauf funktioniert fachlich – Checkout-Start,
Abbruch, Wiederaufnahme, Webhook, Idempotenz, Bestellabschluss –, obwohl kein
externer Anbieter angebunden ist.

#### Wo die Zahlungslogik liegt – und warum dort

```
lib/payments/          REIN – kein Datenbankzugriff
  types.ts             der Port
  betrag.ts            Betragsregel
  registry.ts          Anbieterauswahl
  providers/           Adapter

lib/orders/            ZUSTAND – Geschäftslogik der Bestellung
  paymentService.ts    ← neu: entscheidet über Zahlungen
  orderService.ts        entscheidet über Bestellstatus
  orderCompletion.ts     schließt Bestellungen ab
```

Dieselbe Aufteilung wie beim Bestellstatus: `config/orderStatus.ts` (rein)
neben `orderService.ts` (Zustand). Sobald gelesen oder geschrieben wird, ist
es Geschäftslogik der Bestellung – nicht der Zahlung.

#### Bereits vollständig anbieterunabhängig

| Bestandteil | Anbieterbezug |
|---|---|
| `paymentService.starteZahlung` | spricht nur den Port an |
| `paymentService.verarbeiteZahlungsEreignis` | verarbeitet nur normalisierte Ereignisse |
| Statusübergänge, Idempotenz, Betragsabgleich | vollständig bei uns |
| Bestellabschluss nach Zahlung | kennt keine Zahlung, nur die Bestellung |
| Webhook-Route `/api/webhooks/[anbieter]` | **eine** Route für alle; Anbietername ist ein Wegsegment |
| Historie in `order_events` | anbieterneutrale Ereignisnamen |

#### Die einzige Stelle, an der Stripe später hinzukommt

**`lib/payments/providers/stripe.ts`** – die drei Portmethoden. Sonst nichts.
Die Route kennt Stripe bereits als Wegsegment und weiß, in welcher Kopfzeile
die Signatur steht; die Registry hat den Platz reserviert (`stripe: null`).
Ein Architekturtest hält fest, dass kein Anbietername in die Geschäftslogik
sickert.

#### Idempotenz – nachgewiesen, nicht behauptet

Der Testlauf belegt alle vier kritischen Fälle:

| Fall | Ergebnis |
|---|---|
| dasselbe Ereignis zweimal zugestellt | `bereits_verarbeitet`, Zahlzeitpunkt **unverändert** |
| verspätetes „fehlgeschlagen" nach bestätigter Zahlung | bleibt `paid` – kein Rückschritt |
| gemeldeter Betrag weicht ab | `abgelehnt`, Bestellung bleibt offen |
| Signatur ungültig | HTTP 400, keine Verarbeitung |

Alles über die eine Bedingung `where payment_status = 'pending'` – ohne
Ereignistabelle.

#### Antwortverhalten des Webhooks

Bewusst unterschieden, weil Anbieter bei Nicht-2xx erneut zustellen:

- **200** verarbeitet **oder** fachlich abgelehnt (Wiederholung änderte nichts)
- **400** Signatur ungültig – Wiederholung sinnlos, Absender fragwürdig
- **500** Fehler bei uns – Wiederholung ausdrücklich erwünscht

#### Der Testanbieter bleibt Referenz

`scripts/e2eZahlung.mts` läuft dauerhaft gegen ihn (`npm run test:e2e:zahlung`).
Der Anbieter ist ein Aufrufparameter: Sobald Stripe steht, läuft dieselbe
Strecke mit `--anbieter stripe`. Weichen die Ergebnisse ab, liegt der Fehler
im Adapter, nicht im Test.

Der Test ruft `starteZahlung` **direkt** auf, statt über eine Hilfsroute –
ein `/api/test/…`-Endpunkt wäre Testcode im Produktivpfad und im
schlimmsten Fall ein offener Weg, Zahlungen auszulösen.

#### Nachweis

294 Tests · tsc · ESLint · Bestellstrecke **21/21** · Zahlungsstrecke
**20/20**. Datenbestand nach allen Läufen unverändert (10 Bestellungen,
5.705,34 €, keine Testreste).

---

## 12. Was bewusst NICHT gebaut wird

Festgehalten, damit es nicht später unbemerkt doch entsteht:

| Nicht gebaut | Stattdessen | Wann es doch nötig wird |
|---|---|---|
| Tabelle `payments` | `orders` (Zustand) + `order_events` (Verlauf) | Teilzahlungen, Anzahlungen, mehrschrittige Teilerstattungen |
| Tabelle `payment_events` | bedingte Aktualisierung `where payment_status='pending'` | wenn Ereignisse ohne Zustandswechsel Nebenwirkungen bekommen |
| Modul „Zahlungs-Zustandsmaschine" | die Regel in der WHERE-Bedingung | wenn eine Oberfläche Zahlungsübergänge anbieten muss |
| Status `abgebrochen` / `abgelaufen` | `failed` + Grund in `order_events` | wenn sich der Folgeablauf je Grund unterscheidet |
| Status `erstattet` | – | in S7, sobald erstattet wird |
| `ladeStand()` im Port | Webhook-Wiederholung durch den Anbieter | wenn Webhooks nachweislich verloren gehen |
| Warteschlange für die Nacharbeit nach Zahlung | direkte Ausführung im Webhook | wenn die Nacharbeit das Zeitlimit des Webhooks reißt |

Der letzte Punkt verdient Aufmerksamkeit beim Bau von S5: Stripe erwartet
eine schnelle Antwort auf den Webhook. Rendern, Hochladen und PDF-Erzeugung
dauern heute messbar (siehe die Zeitprotokolle in `orders.ts`). Sollte das
Zeitlimit reißen, ist die Antwort **nicht** eine Warteschlangen-Infrastruktur,
sondern: sofort bestätigen, Nacharbeit im selben Aufruf anstoßen und über
`payment_status` idempotent halten. Erst wenn auch das nicht trägt, ist eine
Warteschlange begründet.
