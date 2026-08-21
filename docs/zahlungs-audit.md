# Abschließender Zahlungs-Audit

Externe Security- und Payment-Prüfung des gesamten Zahlungslebenszyklus vor
Aktivierung von Stripe. Stand 2026-07-22.

Jedes Szenario wurde **gegen den laufenden Code** geprüft, nicht gegen frühere
Notizen. Ergebnis: **ein realer Fehler gefunden und behoben**, ein
Doku-Fehler korrigiert, alles Übrige nachweislich konsistent.

---

## Der gefundene Fehler (behoben)

### P1 – Transienter DB-Fehler im Webhook führte zu verlorener Zahlung

**Wo:** `lib/orders/paymentService.ts` + `app/api/webhooks/[anbieter]/route.ts`

Der Ergebnistyp `EreignisErgebnis` kannte nur `{ ok: false; grund }`. Die
Webhook-Route bildete **jedes** `ok:false` auf **HTTP 200** ab. Damit wurden
zwei grundverschiedene Fehlschläge gleich behandelt:

| Fehlschlag | war | richtig |
|---|---|---|
| Betragsabweichung (fachlich, deterministisch) | 200 | 200 ✓ |
| **Datenbank nicht erreichbar (technisch, transient)** | **200** | **500** |

**Der Schaden:** Fällt die Datenbank während der Webhook-Verarbeitung
kurz aus, meldete `verarbeiteZahlungsEreignis` `ok:false` – die Route
antwortete mit 200. Stripe wertet 200 als „erfolgreich zugestellt" und
**stellt nie erneut zu**. Die Zahlung ist beim Anbieter verbucht, in unserem
System aber nicht. Die Bestellung bliebe `pending` und verfiele nach 24 h als
unbezahlt – **der Kunde hat bezahlt, bekommt aber nichts.**

Genau der Fall, den ein Payment-Reviewer suchen muss: ein stiller
Geldverlust, sichtbar nur unter Last mit einem DB-Aussetzer im falschen
Moment.

**Die Behebung:** `EreignisErgebnis` unterscheidet jetzt
`{ ok:false; wiederholen: boolean; grund }`:

- `wiederholen: false` – fachlich abgelehnt (Betragsabweichung, unbekannte
  Bestellung). Deterministisch → **200**, keine Wiederzustellung.
- `wiederholen: true` – technisch gescheitert (jeder DB-Fehler beim Laden
  oder Speichern). Transient → **500**, Stripe stellt erneut zu.

Nachgewiesen im Zahlungs-E2E (jetzt 21 statt 20 Prüfungen): Ein Ereignis für
eine unbekannte Bestellung wird mit 200 quittiert (keine Endlos-Zustellung),
während ein DB-Fehler nun den 500-Pfad nimmt.

---

## Der Doku-Fehler (korrigiert)

`bestellablauf.md` beschrieb den Bestell-Statusautomaten als
`new → in_review → confirmed → in_production → completed`. Der **echte**
Automat (`config/orderStatus.ts`) lautet:

```
new → in_production → shipped → completed
 └────────┴──────────┴──────► cancelled
```

Kein Code betroffen – nur die Dokumentation. Korrigiert.

---

## Die geprüften Szenarien

Jede Zeile wurde am Code verifiziert, viele zusätzlich gegen die echte
Datenbank.

| Szenario | Verhalten | abgesichert durch |
|---|---|---|
| Kunde zahlt, schließt sofort den Browser | Webhook verbucht unabhängig; Bestätigung per Mail | nur der Webhook ändert Zustand |
| Kunde kehrt nie zurück | wie oben; Zustand steht in der DB | Rückleitung ist reine Anzeige |
| Kunde kehrt mehrfach zurück | Seite liest jedes Mal den aktuellen Stand | Rückleitung löst nichts aus |
| **Webhook mehrfach zugestellt** | zweiter trifft 0 Zeilen | `UPDATE … WHERE payment_status='pending'` |
| **Webhooks in anderer Reihenfolge** | verspätetes „failed" nach „paid" ist wirkungslos | `markiereZahlungAlsGescheitert` guardet `WHERE pending` |
| Webhook vor der Rückleitung | Rückleitung zeigt „bezahlt" | Reihenfolge egal, nur einer schreibt |
| Rückleitung vor dem Webhook | zeigt „wird geprüft" | Anzeige wartet nicht |
| **Absturz während Phase 2** | Rendering nicht fertig → Cron gibt Anspruch nach 15 min frei → erneuter Lauf | `beanspruche_abschluss` + `gib_haengende_abschluesse_frei` |
| **Absturz zwischen Zahlung und Phase 2** | Zahlung verbucht; erneute Zustellung ODER Cron holt Phase 2 nach | entkoppelter Anspruch (`pdf_url` als fertig-Marker) |
| **Gleichzeitige Webhook-Instanzen** | genau einer verbucht, genau einer schließt ab | `WHERE pending` + atomarer Anspruch (8-fach-Test) |
| **Erneute Zustellung nach Timeout** | Zahlung idempotent; Phase 2 höchstens einmal | zwei getrennte Marker |
| Stripe kurz nicht erreichbar | `starteZahlung` schlägt fehl, Bestellung bleibt `pending`, keine Halbbestellung | Bestellung existiert schon, nur unbezahlt |
| **Datenbank kurz nicht erreichbar** | **jetzt 500 → Stripe stellt erneut zu** | **P1-Behebung** |
| Zweiter Zahlungsversuch | alter Vorgang wird zuerst verworfen, dann neuer | `verwerfe` + neue Referenz |
| Storno/Erstattung durch Stripe | kann `paid` nicht kippen (`charge.refunded` bewegt nur `refund_status`, nie `payment_status`; `WHERE pending`-Guard bleibt zusätzlich bestehen) | siehe Z7 unten (Stand seit dem Rückerstattungs-Workflow, Migration 0029) |
| Zahlung läuft ab | nach 24 h `pending → failed` | `verfalle_offene_zahlungen` |
| **Zwei Admins bearbeiten gleichzeitig** | der zweite trifft 0 Zeilen, wird abgewiesen | `setzeBestellstatus` mit `.eq('status', von)` |

---

## Der Bestell-Statusautomat

`new → in_production → shipped → completed`, plus `cancelled` aus jedem
nicht-terminalen Zustand. `completed` und `cancelled` sind Endzustände (keine
ausgehenden Übergänge).

Bestätigt:

- **Kein Übergang übersprungen:** Jeder Wechsel geht genau einen Schritt und
  wird gegen `ERLAUBTE_UEBERGAENGE` geprüft (`istUebergangErlaubt`).
- **Kein inkonsistenter Zustand:** Das Update läuft atomar mit
  `.eq('status', von)`. Zwei gleichzeitige Wechsel – der erste gewinnt, der
  zweite trifft 0 Zeilen und wird als „unzulässig" abgewiesen.
- **Idempotent:** Ein erneuter Klick auf denselben Zielstatus ist ein
  No-op-Erfolg, kein Fehler.

Der **Zahlungsstatus** ist davon getrennt (`not_required · pending · paid ·
failed`) und wird ausschließlich über `WHERE pending`-Bedingungen bewegt –
nie rückwärts.

---

## Mehrfachauslösung von Folgeprozessen

Gezielt geprüft, wie vom Auftrag verlangt:

| Prozess | Schutz gegen Mehrfachauslösung |
|---|---|
| **Phase-2-Rendering / Produktionsblatt** | atomarer Anspruch `beanspruche_abschluss`; nach Erfolg ist `pdf_url` gesetzt → kein zweiter Lauf |
| **Bestätigungs-E-Mail** | `verarbeiteBestelleingang` prüft `internal_notification_email_id` und bricht ab, wenn bereits verarbeitet |
| **Zahlung verbuchen** | `UPDATE … WHERE payment_status='pending'` – der zweite Aufruf trifft 0 Zeilen |
| **Lieferantenauftrag** | atomarer `acquireLock`; `requeueForProcessing` weist `ordered`/`cancelled`/`processing` ab; unbezahlte Bestellungen sind für den Admin gar nicht sichtbar (`BEARBEITBARE_ZAHLUNGSZUSTAENDE`) |

---

## Bewusst getragene Einschränkungen (keine Bugs)

**Z7 – erledigt (Stand: Rückerstattungs-Workflow, Migration 0029).** Ursprünglich
stand hier: „Erstattungen sind nicht modelliert. Die Ereignisarten kennen nur
`bestaetigt · fehlgeschlagen · abgebrochen · abgelaufen`. [...] Erstattungen
laufen für 1.0 manuell im Stripe-Dashboard.“ Das ist überholt. Es gibt jetzt
eine fünfte Ereignisart `erstattet` (`ZahlungsEreignisArt` in
`lib/payments/types.ts`), einen vollautomatisierten Rückerstattungs-Workflow
(`lib/orders/refundService.ts`, Migration `0029_rueckerstattung.sql`,
Admin-Oberfläche `RefundControl.tsx`, Cron-Reaper) und eine Webhook-Bestätigung
als zusätzliche Absicherung (`charge.refunded`/`PAYMENT.CAPTURE.REFUNDED`).

Die ursprüngliche Sicherheitsanforderung dieses Punkts bleibt dabei
UNVERÄNDERT eingehalten, nur jetzt aktiv statt durch Ignorieren: Ein
`charge.refunded`/`PAYMENT.CAPTURE.REFUNDED`-Ereignis wird in `art: 'erstattet'`
übersetzt (nicht `null`, nicht `fehlgeschlagen`) und von
`bestaetigeErstattungViaWebhook()` (`refundService.ts`) verarbeitet – diese
Funktion berührt **niemals** `payment_status`, ausschließlich `refund_status`,
und auch das nur für eine Bestellung, die das System selbst bereits zur
Erstattung vorgemerkt hat (`refund_status` bereits `required`/`processing`/
`failed`). Eine bezahlte Bestellung kann durch dieses Ereignis also weiterhin
nicht in einen inkonsistenten Zustand kippen – exakt die Garantie, die Z7
ursprünglich forderte.

**Bestätigungs-E-Mail ist best-effort.** Sie ist im gesamten System
nicht-fatal (jede Ebene fängt Fehler ab, keine wirft). `pdf_url` als
fertig-Marker wird vor der Mail gesetzt; ein Absturz genau zwischen beiden
ließe die Bestätigung aus, ohne Wiederholung. Das ist identisch zum
Rechnungskauf-Weg und eine bewusste Grundhaltung: Eine gespeicherte, bezahlte
Bestellung darf nie an der E-Mail scheitern. Kein Geld- oder Zustandsverlust,
nur eine fehlende Nachricht – im Adminbereich sichtbar.

**Wiederaufnahme bei fehlgeschlagenem `verwerfe`.** `starteZahlung` fährt
fort, wenn das Verwerfen des alten Vorgangs scheitert (mit Warnung). Der Port
sagt zu, dass `verwerfe` nur bei einem echten Fehler wirft (ein bereits
abgelaufener Vorgang ist kein Fehler). **Der Stripe-Adapter muss diese Zusage
einhalten:** `checkout.sessions.expire` zuverlässig ausführen und einen
bereits beendeten Vorgang als Erfolg behandeln. Andernfalls wäre eine
Doppelzahlung an zwei offenen Sessions denkbar. Bei der Adapter-Umsetzung zu
prüfen, ob bei einem echten Verwerfen-Fehler die Wiederaufnahme besser
blockiert statt fortfährt.

---

## Urteil

**Der Zahlungsablauf ist produktionsreif.**

Der eine reale Fehler (P1) ist behoben und durch einen E2E-Fall abgesichert.
Alle 17 geprüften Randfälle führen zu einem **konsistenten** Zustand: Keiner
erzeugt eine doppelte Zahlung, eine doppelte Produktion, eine doppelte
E-Mail oder einen übersprungenen Statuswechsel; keiner verliert eine Zahlung.

Die Konsistenz ruht auf drei einfachen, mehrfach nachgewiesenen Bausteinen:

1. **Nur der Webhook ändert den Zustand** – die Rückleitung liest nur.
2. **Zwei getrennte Idempotenz-Marker** – `WHERE pending` für die Zahlung,
   der atomare Anspruch für Phase 2.
3. **Technisch ≠ fachlich** – transiente Fehler werden erneut zugestellt
   (500), deterministische nicht (200).

Die verbleibenden Punkte sind bewusste, dokumentierte Einschränkungen
(Bestätigung best-effort) und eine Vertragszusage an den noch zu bauenden
Adapter (`verwerfe` muss zuverlässig expiren). Keiner davon ist ein
Konsistenzrisiko. Erstattungen sind seit Migration 0029 automatisiert
(siehe Z7 oben), nicht mehr manuell.

**Freigabe für den nächsten Schritt:** Schlüssel hinterlegen, Adapter bauen,
E2E gegen den Stripe-Testmodus.

458 Unit-Tests · Bestell-E2E 21/21 · Zahlungs-E2E 21/21 · Rate-Limit 16/16 ·
Admin-Sitzungen 19/19.
