# textil-grosshandel: Warum die Automatisierung nicht lief

Stand: Juli 2026. Untersucht wurde ausschließlich die Lieferanten-Automatisierung
für **textil-grosshandel** — von der Einreihung in die Queue bis zur
Playwright-Ausführung.

---

## Kurzfassung

Es gab **keinen einzelnen Fehler, sondern vier voneinander unabhängige Gründe**.
Drei davon waren Konfiguration, einer war ein echter Fehler im Code. Der
Adapter selbst und seine Selektoren waren durchgehend korrekt — die
Login-Seite hat sich **nicht** geändert.

| # | Ursache | Art | Status |
|---|---|---|---|
| 1 | `SUPPLIER_AUTOMATION_ENABLED` nicht gesetzt → Dry-Run ohne Browser | Konfiguration | ✅ behoben |
| 2 | `CRON_SECRET` nicht gesetzt → Verarbeitungs-Endpoint antwortet 503 | Konfiguration | ✅ behoben |
| 3 | Klebende Kopfzeile + Consent-Overlay fingen den Login-Klick ab | **Code-Fehler** | ✅ behoben |
| 4 | `SUPPLIER_TG_USERNAME=dev-test` ist ein Platzhalter | Zugangsdaten | ⚠️ **nur von dir behebbar** |

---

## Die Untersuchung im Einzelnen

### Läuft ein Worker?

Nein — und das ist korrekt so. Es gibt **keinen dauerhaft laufenden
Worker-Prozess**. Die Architektur ist bewusst *pull-basiert*: eine Bestellung
reiht Lieferantenaufträge nur ein (`enqueueSupplierOrdersForOrder`, real
verifiziert: `+1 eingereiht`), verarbeitet werden sie anschließend durch den
Cron-Endpoint `/api/cron/process-supplier-orders` oder per Klick im Admin.
Das ist die richtige Bauweise — eine Bestellung darf nie daran scheitern, dass
ein Browser abstürzt.

### Werden die Zugangsdaten geladen?

Ja. `SUPPLIER_TG_USERNAME` und `SUPPLIER_TG_PASSWORD` waren vorhanden und
wurden korrekt aus `.env.local` bis in den Adapter durchgereicht. Der Inhalt
war allerdings ein Platzhalter (siehe Ursache 4).

### Hat sich die Login-Seite geändert / sind Selektoren veraltet?

**Nein.** Alle vier Selektoren des Adapters wurden am echten Shop gegengeprüft
und sind unverändert gültig:

| Selektor | Zweck | Ergebnis |
|---|---|---|
| `#loginUser` | Benutzerfeld | ✅ vorhanden |
| `#loginPwd` | Passwortfeld | ✅ vorhanden |
| `#loginButton` | Absenden | ✅ vorhanden |
| `button[name="toBasket"]` | In den Warenkorb | ✅ vorhanden |

Zum Beweis: alle Schritte **nach** dem Login liefen im Testlauf fehlerfrei
durch — Produktseite öffnen, Farbe wählen (`variant-id=263147`), Größen L und M
setzen, in den Warenkorb legen. Nur der Login schlug fehl.

### Ursache 3 — der eigentliche Code-Fehler

Die Fehlermeldung des Adapters lautete lediglich:

```
login  failed  ⚠ page.waitForSelector: Timeout 30000ms exceeded.
```

Daraus lässt sich **nicht** ableiten, was schiefging. Eine gezielte Diagnose
zeigte, dass Playwright den Klick auf `#loginButton` wieder und wieder
verwarf, weil **zwei** Elemente ihn abfingen:

```
<div id="usercentrics-root" data-created-at="1784486380494"> intercepts pointer events
<div class="header-wrapper oxid-header fixed-header mini-header"> intercepts pointer events
```

Zwei getrennte Probleme:

1. **Consent-Overlay:** `UC_UI.denyAllConsents()` wurde unmittelbar nach
   `page.goto()` aufgerufen — zu früh. Usercentrics wird asynchron nachgeladen,
   `UC_UI` existierte zu diesem Zeitpunkt oft noch gar nicht. Der Aufruf fiel
   still durch, und das Overlay lag anschließend über der Schaltfläche.
2. **Klebende Kopfzeile:** Die mitscrollende OXID-Kopfzeile
   (`position: fixed`) liegt über dem Login-Button. Das ist unabhängig vom
   Consent-Banner und blieb auch nach dessen Entfernung bestehen.

Dass der Login in früheren Läufen überhaupt bis zum Absenden kam, war reines
**Timing-Glück**: der langsamere Fallback-Pfad der Consent-Behandlung ließ
genug Zeit vergehen, dass die Seite fertig geladen war. Ein an sich
funktionierender Ablauf, der von Zufall abhing — genau die Sorte Fehler, die
sporadisch wiederkommt.

### Ursache 4 — die Zugangsdaten

Nachdem der Klick zuverlässig landete, antwortete der Shop selbst eindeutig:

```json
{
  "url": "https://www.textil-grosshandel.eu/index.php?force_sid=…",
  "loginFormNochDa": true,
  "meldungen": ["Falsche E-Mail-Adresse oder falsches Passwort!"],
  "zeigtAbmelden": false
}
```

Hinterlegt war der Benutzername **`dev-test`** — ein Platzhalter. Der Shop
erwartet zudem ausdrücklich eine **E-Mail-Adresse**, keinen Benutzernamen.

---

## Vorgenommene Änderungen

### `src/lib/suppliers/adapters/shopActions.ts`

**1. Auf die Consent-Initialisierung warten statt sie anzunehmen.**
`dismissConsent()` pollt jetzt bis zu 8 Sekunden auf die Verfügbarkeit von
`UC_UI`, bevor es ablehnt. Damit greift der datensparsame, deterministische
Weg (`denyAllConsents()`) zuverlässig, statt zufällig in langsamere Fallbacks
zu rutschen.

**2. Neuer Helfer `clearClickObstructions()`.**
Setzt Kopfzeilen mit `position: fixed`/`sticky` auf `static`, damit sie keine
Klicks mehr abfangen. Wird an allen drei Ausgängen von `dismissConsent()`
aufgerufen. Der Selektorsatz ist bewusst **eng auf Kopfzeilen begrenzt** — ein
pauschales Neutralisieren aller `fixed`-Elemente würde needens Login-**Modal**
zerstören, das genau darauf angewiesen ist.

**3. `performLogin()` liest die Fehlermeldung des Shops aus.**
Statt eines nichtssagenden Timeouts meldet ein fehlgeschlagener Login jetzt:

```
Anmeldung fehlgeschlagen – Meldung des Shops: „Falsche E-Mail-Adresse oder falsches Passwort!"
```

Das ist die wichtigste Änderung für den Betrieb: sie unterscheidet künftig
sofort zwischen *falschen Zugangsdaten*, *veraltetem Selektor* und
*abgefangenem Klick* — genau die Unterscheidung, die bei dieser Untersuchung
gefehlt hat.

### `.env.local`

```ini
SUPPLIER_AUTOMATION_ENABLED=1   # echter Browser statt Dry-Run
CRON_SECRET=<zufällig erzeugt>  # Verarbeitungs-Endpoint scharf geschaltet
```

Der Worker läuft weiterhin ausschließlich im Modus **`prepare-cart`**
(`createSupplierOrder` setzt diesen Default, der Checkout-Schritt ist an
`job.mode === 'checkout'` gebunden). Es wird also der Warenkorb befüllt und
**keine Bestellung ausgelöst** — auch nicht versehentlich.

### `.env.local.example`

Hinweis ergänzt, dass `SUPPLIER_TG_USERNAME` die **E-Mail-Adresse** des
Geschäftskontos sein muss.

---

## Nachweis nach der Korrektur

Lauf gegen den echten Shop über die produktiven Module
(`createBrowserSession` + `performLogin` + realer Adapter-Plan):

```
[consent] Usercentrics: alle Dienste abgelehnt (UC_UI.denyAllConsents)
[layout] 1 klebende Kopfzeile(n) neutralisiert (fingen sonst Klicks ab)

ERGEBNIS: Anmeldung fehlgeschlagen – Meldung des Shops:
          „Falsche E-Mail-Adresse oder falsches Passwort!"
```

Die Kopfzeile **war** tatsächlich ein Interceptor, und der Klick landet jetzt
zuverlässig. Was bleibt, ist ausschließlich die Zugangsdaten-Frage.

Statische Prüfungen: TypeScript 0 Fehler, ESLint 0 Fehler, 100/100 Tests grün.

---

## Nachtrag: E2E-Lauf mit echten Zugangsdaten

Nach Hinterlegen der echten Zugangsdaten wurde der vollständige Ablauf über den
Produktionspfad gefahren (Testbestellung im Shop → automatische Einreihung →
Cron-Endpoint → Playwright). Dabei kamen **zwei weitere Befunde** ans Licht.

### Befund 5 — doppelte Schlüssel in `.env.local`

`SUPPLIER_TG_USERNAME` und `SUPPLIER_TG_PASSWORD` standen **zweimal** in der
Datei: die alten Platzhalter auf Zeile 12/13, die echten Werte angehängt auf
43/44. Welcher Wert gewinnt, hängt von der Parser-Reihenfolge ab — dieselbe
Dopplung hatte zuvor schon den E-Mail-Versand lahmgelegt (`RESEND_API_KEY`).
Bereinigt: jeder Schlüssel genau einmal.

### Befund 6 — `fill()` erzeugt keine Tastatur-Ereignisse (ECHTER BUG)

Symptom: Bestellungen mit **einer** Größe scheiterten reproduzierbar,
Bestellungen mit **mehreren** Größen liefen durch.

| Bestellung | Größen | Ergebnis |
|---|---|---|
| ER-2026-D5EDB5 | L=3, M=2 | ✅ cart_prepared |
| ältere Bestellung | L=4, S=12 | ✅ cart_prepared |
| ältere Bestellung | nur S=12 | ❌ `toBasket` blieb `disabled` |

Die naheliegende Erklärung (Bestand) war **falsch** — die Seite meldete 133
Stück verfügbar bei 12 bestellten. Die zweite Vermutung (fehlendes
Blur-/Change-Ereignis) war **ebenfalls falsch**; ein entsprechender Fix änderte
nichts. Erst die direkte Messung an der Produktseite F272 brachte die Ursache:

```
nach fill(S=12)          → toBasket disabled = true
nach press(feld, 'End')  → toBasket disabled = false   (Feldwert bleibt 12)
```

`page.fill()` setzt den Feldwert direkt und löst **keine** Tastatur-Ereignisse
aus. textil-grosshandel schaltet die Schaltfläche „In den Warenkorb" aber genau
darauf frei. Bei mehreren Größen kaschierte die Folgeinteraktion das Problem —
deshalb der irreführende Zusammenhang mit der Größenanzahl.

**Fix:** `AutomationPage` um optionales `press(selector, key)` erweitert;
`setSizeQuantity` bestätigt den Wert nach dem Befüllen mit einem wertneutralen
`press(feld, 'End')`. Abgesichert durch zwei Regressionstests
(`adapters/__tests__/selectionEngine.test.ts`).

**Zusätzlich:** `performAddToCart` liest jetzt aus, *warum* die Schaltfläche
nicht klickbar war (fehlt sie / ist sie deaktiviert / welchen Hinweis zeigt die
Seite), statt einen nackten 30-Sekunden-Timeout zu melden. Genau diese Meldung
hat den Bug überhaupt erst sichtbar gemacht.

### Verifizierter Abschlusslauf

Bestellung **ER-2026-03C705**, bewusst mit einer **einzigen** Größe — also genau
dem zuvor kaputten Fall:

```
Status: cart_prepared (Versuch 1)
Produkt: Heavy Cotton T-Shirt / Art.-Nr. G5000 / Farbe Navy
Größen: [{"size":"L","quantity":5}]
Outcome: prepared

  login            ok
  resolveVariants  ok
  openProduct      ok
  selectColor      ok     {"value":"263147","strategy":"variant-id"}
  setQuantity      ok     {"value":"L","strategy":"label"}
  addToCart        ok
```

Statische Prüfungen: TypeScript 0 Fehler, ESLint 0 Fehler, 102/102 Tests grün.

---

## Befund 7 — der Warenkorb überlebte den Lauf nicht (SCHWERWIEGEND)

Aufgefallen, weil der Betreiber meldete, sein Warenkorb sei **leer** — obwohl
fünf Läufe `addToCart ok` gemeldet hatten.

### Ausgangsfrage: arbeitet die Automatisierung in derselben Sitzung?

Nein, und das ist Absicht. `browserSession.ts` nutzt
`chromium.launch()` + `browser.newContext()`: ein eigener, mitgelieferter
Browser mit einem **komplett leeren Kontext** — kein Profil, keine Cookies auf
der Festplatte, kein `launchPersistentContext`, kein `storageState`.
`dispose()` verwirft alles. Die Sitzung des Betreibers ist davon vollständig
getrennt.

Das allein erklärt aber nichts: Der Warenkorb hängt bei OXID am **Konto**,
nicht am Browser. Er *sollte* also sichtbar sein.

### Messung statt Vermutung

| Sitzung | Vorgehen | Artikel danach im Konto? |
|---|---|---|
| A | hinzufügen → **Warenkorbseite geladen** → schließen | **ja** |
| C | hinzufügen → **sofort schließen** (produktives Verhalten) | **nein** |

Beide Male derselbe Artikel, dasselbe Konto, dieselben produktiven Module.
Der einzige Unterschied ist der zusätzliche Seitenaufruf.

**Ursache:** Der Shop überträgt den Warenkorb erst beim **nächsten
Seitenaufruf** dauerhaft ins Konto. Der Worker schloss den Browser unmittelbar
nach `addToCart` — der Artikel lag nur in der flüchtigen Sitzung und starb mit
ihr. `#basketItemCountAndPrice` bestätigte den Klick völlig korrekt; die
Bestätigung sagte nur nichts über Dauerhaftigkeit aus.

Damit war `addToCart ok` fachlich ein **Fehlalarm**: Alle bis dahin
durchgeführten Läufe haben nichts Dauerhaftes hinterlassen.

### Fix: neuer Pflichtschritt `confirmCart`

Nach **allen** Positionen ruft der Worker die Warenkorb-Seite auf und prüft,
dass dort mindestens eine Position steht. Der Marker
`[id^="table_cartItem_"]` wurde in **beide** Richtungen am realen Shop
verifiziert (befüllt → 1 Treffer, leerer Gast-Warenkorb → 0 Treffer).

Fehlt einem Adapter dieser Nachweis, meldet der Schritt `not_implemented` —
sichtbar im Audit statt stillschweigend übersprungen. Das trifft derzeit
**needen** (Warenkorbseite liegt hinter dem Login, keine Zugangsdaten; ein
geratener Selektor kommt nicht in Frage). Im needen-E2E-Test ist diese Lücke
ausdrücklich festgehalten.

### Nachweis nach dem Fix

Bestellung über den Produktionspfad (Schwarz/XXL/9), anschließend aus einer
**frisch aufgebauten** Sitzung gelesen:

```
G5000 Heavy Cotton Adult T-Shirt in Black, Größe: XXL   33,03 €
G5000 Heavy Cotton Adult T-Shirt in Navy,  Größe: L     11,01 €
Summe Artikel (brutto): 52,41 €
```

Statische Prüfungen: TypeScript 0 Fehler, ESLint 0 Fehler, 105/105 Tests grün.

### Lehre

Eine Erfolgsmeldung des Shops belegt nur, dass der **Klick** ankam — nicht,
dass das **Ergebnis** Bestand hat. Bei jedem neuen Lieferanten ist getrennt zu
prüfen, ob der vorbereitete Warenkorb eine neue Sitzung überdauert.

Auslösen der Verarbeitung nach einer Testbestellung:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3007/api/cron/process-supplier-orders
```

Alternativ per Klick im Adminbereich. Für den Dauerbetrieb ruft ein externer
Scheduler denselben Endpoint alle paar Minuten auf — ein solcher Scheduler
existiert lokal naturgemäß nicht.
