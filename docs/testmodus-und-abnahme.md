# Testmodus und Abnahme

> **Stand 2026-07-21.** Entstanden, nachdem eine nicht angewendete Migration
> wochenlang jede Bestellung scheitern ließ – während die Abnahme „bestanden"
> meldete.

---

## 1. Warum es das gibt

Die Abnahme prüfte bis dahin nur den Browser. Die Prüfstrecke
`qaBestellabschluss.mts` fängt jeden Absende-Request ab, damit keine echten
Bestellungen entstehen. Sinnvoll – aber dadurch lief der **Serverpfad nie
mit**: Validierung, Preisberechnung, Datenbank, Rendering, Produktionsblatt,
E-Mail.

Als Migration `0011` im Repository lag, aber nicht angewendet war, schrieb
der Code in eine Spalte, die es nicht gab. **Jede Bestellung schlug fehl.**
Die Browserprüfung blieb grün, weil sie den Server gar nicht erreichte.

Ein Test, der den entscheidenden Teil überspringt, ist schlimmer als kein
Test: Er erzeugt Vertrauen, das nicht gedeckt ist.

---

## 2. Der Testmodus

Ein einziger Schalter, `E2E_TESTMODUS=aktiv` (siehe `src/config/testmodus.ts`).
Er verlangt exakt diesen Wert – nicht `true` oder `1`, die versehentlich
gesetzt sein könnten – und wird **ausschließlich aus der Umgebung** gelesen,
nie aus einem Request. Käme er vom Client, könnte jeder Besucher den
E-Mail-Versand abschalten.

### Was unverändert läuft

Alles Fachliche. `orders.ts`, `orderValidation.ts`, `serverPricing.ts`,
`orderIntake.ts` und `orderService.ts` kennen den Schalter überhaupt nicht.
Es gibt **keine zweite Fassung des Bestellprozesses**.

### Was abgefangen wird

Genau drei Ränder, an denen das System die Welt berührt:

| Rand | Verhalten | Warum so |
|---|---|---|
| **E-Mail** (`sendEmail.ts`) | unterdrückt, liefert aber `success` + Kennung | Ein Fehlschlag würde den *Fehlerzweig* des Bestellprozesses prüfen statt des Erfolgszweigs. Die Kennung trägt das Präfix `testmodus:` und landet über die normale Protokollierung in `order_events` – dort weist der Test sie nach. |
| **Dateien** (`storage.ts`) | **ersetzt** durch lokale Ablage | Nicht unterdrückt: Das Druckvorschau-Rendering lädt hochgeladene Logos wieder herunter. Ein verschluckter Upload ließe den Download scheitern – und weil dieser Schritt nicht-fatal gekapselt ist, liefe der Test grün, während Rendering und Produktionsblatt übersprungen würden. Genau der blinde Fleck, dessentwegen es den Testmodus gibt. |
| **Lieferanten** (`orchestrator.ts`) | gesperrt | Überstimmt `SUPPLIER_AUTOMATION_ENABLED=1`. Eine versehentlich ausgelöste Großhändlerbestellung ist die einzige Nebenwirkung hier, die sich nicht zurücknehmen lässt. |

Die **Datenbank wird echt beschrieben**. Das ist Absicht: Migrationen,
Constraints und Fremdschlüssel sollen mitgeprüft werden – dort saß der
Fehler, der das alles ausgelöst hat.

---

## 3. Der End-to-End-Test

```
npm run test:e2e
```

Startet einen **eigenen** Server mit gesetztem Testmodus auf Port 3009,
spielt den Kundenweg im Browser durch (Logo hochladen, Menge, Warenkorb,
Checkout, absenden) und weist anschließend in der Datenbank nach, dass jeder
Schritt stattgefunden hat.

Bricht ab, wenn der Port belegt ist: Liefe dort ein fremder Server, prüfte
der Test einen unbekannten Stand – womöglich ohne Testmodus und damit mit
echtem E-Mail-Versand.

### Die 19 Nachweise

| Bereich | Nachweis |
|---|---|
| Abschluss | Bestellnummer wird angezeigt |
| Persistenz | Bestellung, Positionen, Motive in der Datenbank |
| Preis | Menge und Preis serverseitig; **angezeigter Preis = gespeicherter Preis** |
| A6 | Absendekennung gespeichert; genau **eine** Bestellung entstanden |
| S1 | Zahlungsart gespeichert |
| Dateien | Logo-Pfad gesetzt, **Produktionsblatt erzeugt** (beweist Rendering + PDF) |
| Historie | `order_events` geschrieben, E-Mail-Pfad durchlaufen |
| Sicherheit | **jede** E-Mail nachweislich abgefangen, Testmodus war aktiv |

Der Nachweis „Produktionsblatt erzeugt" ist wichtiger, als er aussieht:
Rendering und PDF-Erzeugung sind in `orders.ts` bewusst nicht-fatal gekapselt
und würden sonst unbemerkt ausfallen.

### Aufräumen

Die Testbestellung wird am Ende gelöscht (`ON DELETE CASCADE` räumt
Positionen, Motive und Historie mit ab), die lokale Ablage entfernt und der
Serverprozess samt Kindern beendet. Zwei Läufe hintereinander wurden geprüft:
Datenbestand vorher und nachher identisch, keine Reste.

`--behalten` unterdrückt das Aufräumen, wenn man sich das Ergebnis ansehen
will.

---

## 4. Was die Abnahme künftig umfasst

Beides, keines ersetzt das andere:

| Prüfung | Deckt ab | Deckt NICHT ab |
|---|---|---|
| `npm run test:e2e` | vollständiger Serverpfad, Datenbank, Preise, Dateien, Historie | Doppelklick, Zeitüberschreitung, Verbindungsabbruch |
| `scripts/qaBestellabschluss.mts` | Browserverhalten beim Absenden | **den gesamten Serverpfad** |
| `npm test` (245) | reine Logik: Preise, Validierung, Architekturregeln | alles, was Datenbank oder Netz berührt |

---

## 5. Erster Fund

Schon der erste vollständige Lauf hat einen echten Fehler aufgedeckt, den
weder Unit- noch Browsertests zeigten: Die Preisanzeige verwendete
`toFixed(2)` und damit **englisches Zahlenformat** – `31.64 €` statt
`31,64 €`, bei vierstelligen Beträgen zusätzlich ohne Tausenderpunkt. Auf
einer deutschsprachigen Shopseite ist das falsch, und mit Blick auf die
Preisangabenverordnung (A5) nicht nur kosmetisch.

Behoben in `currencyStore.ts` mit fest gewähltem Gebietsschema `de-DE` –
fest, weil Server und Client dieselbe Zeichenkette erzeugen müssen, sonst
weicht die Hydration ab.

Gefunden wurde er durch den Vergleich „angezeigter Preis = gespeicherter
Preis". Diese Prüfung bleibt, denn genau dieser Abgleich wird mit der
Zahlungsabwicklung sicherheitsrelevant.
