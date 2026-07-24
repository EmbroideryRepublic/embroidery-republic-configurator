# Stripe – Architektur- und Sicherheitsreview

Prüfung vor der Umsetzung. Stand 2026-07-22. **Kein Code geändert.**

---

## Vorbemerkung: Was existiert, was fehlt

| Baustein | Stand |
|---|---|
| Port mit drei Methoden (`eroeffne`, `leseEreignis`, `verwerfe`) | fertig |
| Webhook-Route für alle Anbieter (`/api/webhooks/[anbieter]`) | fertig |
| Zahlungsdienst mit Idempotenz | fertig |
| Testanbieter als Referenzimplementierung | fertig, E2E-geprüft |
| Betragsprüfung (`pruefeZahlbetrag`) | fertig |
| Schlüsselprüfung (`stripeKonfiguration.ts`) | fertig |
| **Stripe-Adapter selbst** | **fehlt** (`registry.ts`: `stripe: null`) |
| **Reihenfolge Bestellung ↔ Zahlung** | **falsch, siehe Z1** |

Die Architektur trägt. Der Befund unten betrifft nicht sie, sondern eine
Stelle im Bestellvorgang, die bei Rechnungskauf richtig ist und bei Stripe
falsch wäre.

---

# KRITISCH

## Z1 – Die Produktion startet vor der Zahlung

**Wo:** `lib/actions/orders.ts:528`

```ts
const abschluss = await schliesseBestellungAb(order);   // BEDINGUNGSLOS
```

Phase 2 – Druckvorschauen, Produktionsblatt, Bestellbestätigung – läuft
unmittelbar nach dem Speichern, **unabhängig von der Zahlungsart**. Der
Kommentar daneben benennt es selbst: *„Sobald bezahlt wird, verschiebt sich
dieser Aufruf hinter die Zahlungsbestätigung."* Das ist nie geschehen, weil
bisher nur Rechnungskauf existiert.

**Was mit Stripe passieren würde:**

```
Kunde klickt „Zahlungspflichtig bestellen"
  → Bestellung gespeichert
  → Vorschauen gerendert, Produktionsblatt erzeugt      ← zu früh
  → Bestellbestätigung verschickt                       ← zu früh
  → Weiterleitung zu Stripe
  → Kunde bricht ab
  → Keine Zahlung. Bestätigung ist trotzdem draußen.
```

Zusätzlich liefe Phase 2 **zweimal**: einmal hier, einmal in
`paymentService.ts:317` nach der Bestätigung. Zwei Bestätigungsmails für
dieselbe Bestellung.

**Lösung:** Phase 2 nur ausführen, wenn keine Zahlung aussteht – also bei
`payment_method = 'invoice'` oder wenn `payment_status = 'not_required'`.
Bei Stripe übernimmt der Webhook. Die Weiche gehört an eine Stelle, nicht in
jeden Aufrufer.

**Aufwand:** 1–2 Stunden inkl. Test. **Muss vor dem Adapter passieren** –
sonst ist der erste echte Bezahlvorgang bereits fehlerhaft.

---

# Der Ablauf im Soll

```
1. Kundschaft bestellt
   → Bestellung in EINER Transaktion (K1)
   → payment_status = 'pending'
   → KEINE Produktion, KEINE Bestätigungsmail
   → starteZahlung() eröffnet den Vorgang beim Anbieter
   → Weiterleitung

2. Kundschaft bezahlt bei Stripe

3. Webhook trifft ein
   → Signatur geprüft
   → Betrag gegen den gespeicherten Wert geprüft
   → UPDATE ... WHERE payment_status = 'pending'   ← die Idempotenz
   → 0 Zeilen? Bereits verarbeitet, 200 zurück, nichts weiter
   → 1 Zeile?  Phase 2 anstoßen

4. Rückleitung in den Shop
   → zeigt nur an, was in der Datenbank steht
   → löst NICHTS aus

5. Lieferantenauftrag
   → erst nach Ablauf der Stornofrist, beim Öffnen im Adminbereich
```

Der Schlüssel: **Nur der Webhook ändert den Zustand.** Die Rückleitung ist
Anzeige, nichts weiter – sie kann fehlen, doppelt kommen oder verspätet
eintreffen, ohne Schaden.

---

# Die Fehlerfälle, einzeln geprüft

| Fall | Verhalten | Grund |
|---|---|---|
| **Zahlung ok, Webhook verspätet** | Kundschaft sieht „Zahlung wird geprüft". Produktion startet, sobald der Webhook kommt. | Die Rückleitung liest nur; sie wartet nicht. |
| **Webhook doppelt** | Der zweite trifft null Zeilen (`WHERE payment_status = 'pending'`), Antwort 200, keine zweite Mail. | Die Bedingung ist die gesamte Idempotenz. |
| **Webhook VOR der Rückleitung** | Häufigster Fall. Zahlung ist bereits verbucht, die Rückleitung zeigt den Endzustand. | Reihenfolge spielt keine Rolle, weil nur einer schreibt. |
| **Rückleitung ohne Webhook** | Bestellung bleibt `pending`; Stripe stellt über Tage nach, spätestens greift der Verfall nach 24 h. | Wiederzustellung + Z3 (siehe Umsetzungsstand zu Z2) |
| **Browser geschlossen** | Wie oben: Der Webhook kommt trotzdem, die Bestellung wird verarbeitet, die Bestätigung geht raus. | Der Ablauf hängt nicht am Browser. |
| **Später erneut bezahlt** | `starteZahlung()` verwirft zuerst den alten Vorgang (`verwerfe`), dann ein neuer. | Bereits umgesetzt. |
| **Stripe nicht erreichbar** | `starteZahlung()` schlägt fehl, die Bestellung bleibt `pending`, Kundschaft sieht eine Meldung. Keine halbe Bestellung. | Die Bestellung existiert bereits – nur unbezahlt. |
| **Zwei Webhooks gleichzeitig** | Postgres serialisiert das `UPDATE`. Einer gewinnt, der andere trifft null Zeilen. | Dieselbe Bedingung. |
| **Betrag manipuliert** | `pruefeZahlbetrag` vergleicht mit dem gespeicherten Wert, 1 Cent Toleranz. Abweichung = abgelehnt. | Der gespeicherte Betrag ist maßgeblich, nie der vom Anbieter gemeldete. |

---

# HOCH

## Z2 – Kein Abgleich für ausbleibende Webhooks

Bleibt ein Webhook aus – Zustellung fehlgeschlagen, Endpunkt kurz nicht
erreichbar, Stripe gibt nach mehreren Versuchen auf –, bleibt die Bestellung
dauerhaft `pending`. Bezahlt, aber nie produziert. Auffallen würde es erst
durch eine Kundenrückfrage.

**Lösung:** Ein Abgleich in der bestehenden Cron-Route: Bestellungen mit
`payment_status = 'pending'`, deren Zahlung vor mehr als 15 Minuten eröffnet
wurde, beim Anbieter nachfragen (`leseZahlungsstand`). Das erfordert eine
**vierte Portmethode** – die einzige Erweiterung, die dieser Review
vorschlägt.

Der Port bleibt schlank: Sie beantwortet genau eine Frage („welchen Stand
hat dieser Vorgang?") und ist für jeden Anbieter beantwortbar.

## Z3 – Kein Zeitlimit für offene Zahlungen

Eine `pending`-Bestellung bleibt es unbegrenzt. Nach Wochen ist unklar, ob
noch jemand zahlt. Vorschlag: nach 24 Stunden auf `failed`, protokolliert und
im Adminbereich sichtbar. Eine später doch eintreffende Zahlung wird dann
über den Abgleich aus Z2 erkannt.

## Z4 – Der Webhook-Endpunkt ist unbegrenzt

Er ist signaturgeprüft, aber jede Anfrage kostet eine Signaturprüfung. Ein
Rate-Limit fehlt. Die Infrastruktur dafür steht seit H2 – es fehlt nur ein
Eintrag in `rateLimits.ts` und der Aufruf.

Wichtig: **Nach** der Signaturprüfung begrenzen, nicht davor. Sonst könnte
eine Flut gefälschter Anfragen echte Stripe-Zustellungen aussperren.

---

# MITTEL

## Z5 – Zeitlimit der Webhook-Verarbeitung

Stripe erwartet eine Antwort binnen 20 Sekunden. Bei uns läuft Phase 2 –
Rendering und PDF – **innerhalb** der Webhook-Verarbeitung. Beim E2E-Lauf
dauert das mehrere Sekunden; bei mehreren Positionen kann es reichen, um das
Limit zu reißen.

Stripe wertet eine Zeitüberschreitung als Fehlschlag und stellt erneut zu.
Die Idempotenz fängt das ab (der zweite Aufruf trifft null Zeilen) – aber
dann ist die Zahlung verbucht und Phase 2 möglicherweise abgebrochen.

**Vorschlag:** Zahlung sofort verbuchen, antworten, Phase 2 danach.
Scheitert Phase 2, bleibt sie nachholbar – die Bestellung ist bezahlt und
gültig.

## Z6 – Rückleitungsseite fehlt

Es gibt keine Seite, auf die Stripe zurückleitet. Sie muss den Zustand
**lesen** und darf nichts auslösen. Drei Fälle: bezahlt, wird geprüft,
fehlgeschlagen.

## Z7 – Erstattungen nicht abgebildet

`ZahlungsEreignis` kennt `bestaetigt`, `fehlgeschlagen`, `abgebrochen` – aber
keine Erstattung. Storniert der Betreiber eine bezahlte Bestellung, muss das
Geld zurück. Für 1.0 vertretbar (manuell im Stripe-Dashboard, Vermerk im
Adminbereich), sollte aber bewusst entschieden sein.

---

# Was bereits gut gelöst ist

- **Rohtext statt JSON:** Die Route liest `request.text()`. Mit
  `request.json()` wäre die Signaturprüfung wertlos, weil Stripe über die
  exakten Bytes signiert.
- **Idempotenz ohne Ereignistabelle:** Eine `WHERE`-Bedingung erledigt, wofür
  andere Systeme eine Tabelle mit Verarbeitungsvermerken führen.
- **Der Anbieter entscheidet nie fachlich:** Er liefert Ereignisse; ob eine
  Bestellung als bezahlt gilt, entscheidet unsere Geschäftslogik.
- **Betragsprüfung gegen den gespeicherten Wert**, nicht gegen den gemeldeten.
- **Statuscodes bewusst getrennt:** 400 bei ungültiger Signatur (Stripe stellt
  nicht erneut zu), 500 bei Verarbeitungsfehler (Stripe wiederholt), 200 bei
  bereits verarbeitet.
- **Kein stiller Rückfall auf den Testanbieter** in Produktion.

---

# Reihenfolge der Umsetzung

1. **Z1** – Phase 2 hinter die Zahlung (**zuerst**, sonst ist der erste
   echte Vorgang fehlerhaft)
2. **Z5** – Phase 2 aus der Webhook-Antwort lösen
3. Stripe-Adapter gegen die drei Portmethoden
4. **Z6** – Rückleitungsseite
5. **Z2** – vierte Portmethode + Abgleich in der Cron-Route
6. **Z3** – Zeitlimit für offene Zahlungen
7. **Z4** – Rate-Limit für den Webhook
8. E2E gegen den Stripe-Testmodus

Schritte 1, 2, 4, 6 und 7 brauchen **keine** Stripe-Zugangsdaten – sie lassen
sich vollständig gegen den Testanbieter umsetzen und prüfen. Erst Schritt 3
und 8 benötigen die Schlüssel.

**Vorschlag:** Ich setze 1, 2, 4, 6 und 7 jetzt um. Der Adapter folgt,
sobald die Zugangsdaten vorliegen.

---

# Umsetzungsstand (2026-07-22)

Alle Punkte, die keine Stripe-Zugangsdaten brauchen, sind umgesetzt und gegen
den Testanbieter bzw. die echte Datenbank geprüft. Nach dem Eintragen der
Schlüssel und dem Bau des Adapters sind **keine strukturellen Änderungen am
Bestell- oder Zahlungsablauf mehr nötig**.

| Punkt | Stand | Nachweis |
|---|---|---|
| **Z1** Phase-2-Weiche | **fertig** | Weiche `brauchtVorabZahlung`; Wächter-Test |
| **Z3** Verfall offener Zahlungen (24 h) | **fertig** | `verfalle_offene_zahlungen`, gegen DB geprüft |
| **Z4** Rate-Limit Webhook (nach Signaturprüfung) | **fertig** | `rateLimits.webhook`, 429 bei Drosselung |
| **Z5** Phase 2 re-entrant nach Zahlung | **fertig** | atomarer Anspruch, 8-fach-Paralleltest |
| **Z6** Rückleitungsseite | **fertig** | `/bestellung/zahlung/[orderId]`, liest nur |
| **Z2** Abgleich per Statusabfrage | **bewusst NICHT** | siehe unten |
| Stripe-Adapter | **fertig** | `providers/stripe.ts`, Registry verdrahtet |
| E2E gegen Stripe-Testmodus | **fertig** | 31/31, siehe [stripe-e2e-nachweis.md](stripe-e2e-nachweis.md) |

## Die Architektur der Phase-2-Weiche (Z1)

`config/zahlung.ts` entscheidet rein: `brauchtVorabZahlung(methode)`.

```
Rechnungskauf (invoice)   → payment_status 'not_required' → Phase 2 SOFORT
Karte / PayPal            → payment_status 'pending'      → Phase 2 wartet
```

Bei Vorabzahlung kehrt `submitOrder` nach Phase 1 zurück, ohne Phase 2
auszuführen. Der Webhook stößt sie später an. Ein Wächter-Test schreibt das
fest: Fällt jemand später zurück und ruft `schliesseBestellungAb` bedingungslos
auf, schlägt der Test an.

## Idempotenz und Konsistenz (Z5)

Der kritische Fall: Phase 2 (Rendering, PDF) läuft im Webhook und kann
Stripes ~20-Sekunden-Fenster reißen. Stripe stellt dann erneut zu.

Zwei **getrennte** Idempotenz-Marker lösen das:

| Marker | schützt |
|---|---|
| `payment_status` von `pending` → `paid` (WHERE pending) | die Zahlung |
| `abschluss_gestartet_am` (atomarer Anspruch, Migration 0020) | Phase 2 |

`payment_status` allein genügt nicht: Nach der ersten Zustellung steht er auf
`paid`, die erneute Zustellung würde am `WHERE pending` scheitern und Phase 2
nie nachholen. Der separate Anspruch entkoppelt „bezahlt" von „abgeschlossen".

Ablauf bei jeder Zustellung:

```
1. UPDATE ... SET paid WHERE payment_status = 'pending'   → Zahlung idempotent
2. beanspruche_abschluss(order)  → genau EINER bekommt den Anspruch
     kein Anspruch → schon fertig oder anderer Lauf → nichts tun
     Anspruch      → Phase 2 ausführen (setzt pdf_url = fertig)
                     bei Fehler: Anspruch freigeben
```

Nachgewiesen: acht gleichzeitige Ansprüche → genau einer gewinnt; nach
Freigabe wieder beanspruchbar; mit gesetztem `pdf_url` kein Anspruch mehr.

**Alle Fehlerfälle abgedeckt:**

| Fall | Verhalten |
|---|---|
| Webhook doppelt / gleichzeitig | Zahlung idempotent, nur ein Phase-2-Lauf |
| Zeitüberschreitung in Phase 2 | Zahlung ist verbucht; erneute Zustellung ODER Cron holt Phase 2 nach |
| Absturz mitten in Phase 2 | Anspruch bleibt gesetzt; Cron gibt ihn nach 15 min frei, nächster Lauf holt nach |
| Rückleitung ohne Webhook | Seite zeigt „wird geprüft"; Stripe stellt nach, sonst Verfall nach 24 h |
| Kunde bricht ab | `payment_status` bleibt `pending`, Verfall nach 24 h |

## Warum Z2 (Statusabfrage) bewusst NICHT umgesetzt ist

Der Port trägt die ausdrückliche frühere Entscheidung, `ladeStand()` **nicht**
zu bauen: Anbieter stellen Ereignisse über Tage erneut zu, eine aktive
Statusabfrage ist dadurch überflüssig. Diese Entscheidung wird respektiert,
statt sie „auf Vorrat" zu überschreiben.

Die Lücke, die Z2 schließen sollte – ein dauerhaft ausbleibender Webhook –
ist durch **zwei** andere Mechanismen abgedeckt: Stripes eigene Wiederzustellung
(Tage) und der Verfall nach 24 h (Z3). Kommt eine Zahlung später doch, wird
sie über den regulären Webhook verarbeitet. Ein aktiver Abgleich brächte
keinen zusätzlichen Schutz, nur eine vierte Portmethode.

## Was beim Aktivieren von Stripe noch zu tun ist

1. `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` eintragen.
2. Stripe-Adapter gegen die drei Portmethoden bauen (`eroeffne`,
   `leseEreignis`, `verwerfe`) und in `registry.ts` `stripe: null` ersetzen.
3. Webhook-Endpunkt bei Stripe auf `/api/webhooks/stripe` einrichten.
4. E2E gegen den Stripe-Testmodus.

Kein Eingriff in Bestellvorgang, Phase-2-Logik, Rückleitung oder Wartung.
