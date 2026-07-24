# Betriebsbeobachtung: Logging, Monitoring, Health, CI

Stand 2026-07-22. **Kern umgesetzt** – Abschnitt 7 nennt den Stand im Einzelnen.

Ziel: vor dem Go-live jederzeit beantworten können —
*Läuft das System? Wo treten Fehler auf? Seit wann? Wie kritisch? Wie
nachvollziehbar?*

---

## 1. Ist-Aufnahme

| | Stand |
|---|---|
| Protokollaufrufe | **106** (`error` 64, `warn` 30, `info` 11) |
| Format | uneinheitlich, aber Präfix-Konvention `[bereich]` existiert bereits |
| Korrelation | keine – Einträge lassen sich keiner Anfrage zuordnen |
| Auswertbarkeit | keine – Freitext, nicht filterbar |
| Aufbewahrung | nur was die Plattform vorhält (bei Vercel je nach Tarif Stunden bis Tage) |
| Health-Check | **keiner** |
| CI | **keine** |

Vorhanden und brauchbar: `order_events` und `supplier_order_events` – zwei
Ereignistabellen mit `event_type`, `reason`, `detail`. Sie zeigen, dass das
Muster im Projekt schon etabliert ist.

### Datenschutz-Fund

`sendEmail.ts:133` protokolliert die **vollständige E-Mail-Adresse** der
Kundschaft:

```ts
console.info(`[email] Gesendet: "${betreff}" → ${originalTo} …`);
```

Die Absicht ist nachvollziehbar (Rückfrage „ich habe nichts bekommen"), das
Mittel nicht: Eine E-Mail-Adresse ist ein personenbezogenes Datum und hat in
einem dauerhaften Protokoll nichts zu suchen. Die Resend-Nachrichtenkennung
steht ohnehin daneben und genügt zur Nachverfolgung.

---

## 2. Logging

### Zentrale Funktion statt `console.*`

Alle 106 Stellen laufen künftig über `lib/observability/log.ts`. Ausgegeben
wird **eine Zeile JSON** – maschinell filterbar, in jeder
Protokollansicht lesbar:

```json
{"zeit":"2026-07-22T19:04:11.２Z","stufe":"fehler","bereich":"bestellung",
 "ereignis":"transaktion_fehlgeschlagen","anfrage":"a1b2c3d4",
 "bestellung":"ER-2026-4A9071","meldung":"…","dauer_ms":812}
```

Warum JSON und nicht Freitext: Fragen wie „alle Bestellfehler der letzten
Stunde" oder „wie oft trat das auf?" lassen sich über Freitext nicht
beantworten. Die Plattformansicht kann nach Feldern filtern.

### Stufen

| Stufe | wofür | Beispiel |
|---|---|---|
| `ERROR` / `CRITICAL` | etwas ist misslungen, jemand muss handeln | Transaktion abgebrochen, E-Mail nicht versandt |
| `warnung` | auffällig, aber selbstheilend oder erwartbar | Rate-Limit erreicht, unbekanntes Sitzungstoken |
| `INFO` | fachlich bedeutsamer Vorgang | Bestellung angelegt, Zahlung bestätigt |
| `DEBUG` | nur in Entwicklung | Zwischenstände |

`DEBUG` erscheint in Produktion nie. Zehn feste Kategorien (AUTH, ORDER,
PAYMENT, UPLOAD, STORAGE, SUPPLIER, EMAIL, CRON, RATE_LIMIT, SYSTEM) treten
neben die Schwere – beide als geschlossene Typen und als check-Bedingung in
der Datenbank. Es gibt bewusst **kein** `log` – jede
Ausgabe muss sich für eine Stufe entscheiden.

### Was niemals ins Protokoll gehört

| Verboten | stattdessen |
|---|---|
| E-Mail-Adressen | Bestellnummer oder Nachrichtenkennung |
| Namen, Anschriften, Telefonnummern | Bestellnummer |
| vollständige IP-Adressen | gekürzt: `203.0.113.x` |
| Secrets, Token, Schlüssel | gar nichts; höchstens „vorhanden/fehlt" |
| Zahlungsdaten | Anbieter-Referenz |
| Dateiinhalte | Pfad und Größe |

Erzwungen wird das durch eine **Bereinigung in der Log-Funktion selbst**:
Sie erkennt E-Mail-Muster und lange Zufallszeichenketten und ersetzt sie,
bevor irgendetwas geschrieben wird. Verlässt man sich auf Disziplin an 106
Stellen, geht es schief.

Ein Wächter-Test verbietet zusätzlich neue `console.*`-Aufrufe außerhalb der
Log-Datei.

### Korrelation

Zwei Kennungen ziehen sich durch:

- **Anfrage-Kennung** – acht Zeichen, je Aufruf erzeugt. Verbindet alle
  Einträge einer Anfrage.
- **Bestellnummer** – wo vorhanden. Beantwortet „was ist bei dieser
  Bestellung passiert?" über alle Bereiche hinweg.

Beides sind keine personenbezogenen Daten.

---

## 3. Monitoring

### Warum kein Sentry

Sentry oder ein vergleichbarer Dienst wäre der bequemste Weg – und erfordert
ein **neues Konto**. Das ist im Projekt eine stehende Regel; für Sentry
wurde sie bereits einmal ausdrücklich bestätigt.

Stattdessen zwei Ebenen, beide ohne neuen Dienst:

**Ebene 1 – Plattformprotokoll.** Die strukturierten Zeilen landen dort, wo
die Anwendung läuft. Gut für „was geschah gerade eben", begrenzt in der
Aufbewahrung.

**Ebene 2 – Ereignistabelle `system_ereignisse`.** Nur **kritische**
Vorfälle, nicht jede Zeile. Dieselbe Bauart wie `order_events`, das Muster
ist im Projekt etabliert.

Das beantwortet die Frage „**seit wann**?", die ein flüchtiges
Plattformprotokoll nicht beantworten kann.

### Was in die Tabelle geht

| Ereignis | Stufe | warum kritisch |
|---|---|---|
| Bestellung fehlgeschlagen | fehler | Umsatzverlust, Kundschaft betroffen |
| Upload abgewiesen | warnung | gehäuft = Angriff oder kaputter Client |
| Rate-Limit ausgelöst | warnung | gehäuft = Angriff |
| Anmeldung fehlgeschlagen | warnung | gehäuft = Rateversuch |
| Zahlung fehlgeschlagen | fehler | Geld betroffen |
| Lieferantenlauf fehlgeschlagen | fehler | Ware wird nicht bestellt |
| Cron fehlgeschlagen | fehler | Hintergrundarbeit steht |
| E-Mail nicht versandt | fehler | Kundschaft erfährt nichts |

Nicht in die Tabelle geht der Normalbetrieb – sonst wächst sie sinnlos und
das Wichtige geht unter.

### Ungewöhnliche Häufungen

Mit der Tabelle wird das eine Abfrage: *Wie viele Ereignisse dieser Art gab
es in der letzten Stunde, verglichen mit dem Tagesdurchschnitt?* Eine
einfache Auswertung im Adminbereich genügt – automatische Benachrichtigung
wäre der nächste Schritt und braucht eine Entscheidung über den Weg (E-Mail
an den Betreiber liegt nahe, Resend ist vorhanden).

---

## 4. Health Checks

Eine Route `/api/health`:

| Prüfung | wie | Bewertung bei Ausfall |
|---|---|---|
| Datenbank | leichte Abfrage mit Zeitlimit | **kritisch** |
| Speicher | Bucket auflisten, Zeitlimit | **kritisch** |
| Umgebungsvariablen | Pflichtfelder vorhanden und plausibel | **kritisch** |
| E-Mail-Versand | Schlüssel vorhanden | beeinträchtigt |
| Zahlungsanbieter | vorbereitet, heute „nicht eingerichtet" | beeinträchtigt |

Drei Zustände: `ok`, `beeinträchtigt`, `kritisch`. HTTP 200 bei den ersten
beiden, 503 bei `kritisch` – so kann eine Überwachung außerhalb des Systems
darauf reagieren.

**Die Antwort nennt keine Werte**, nur Zustände. Ein Health-Check, der
Verbindungszeichenfolgen oder Schlüsselpräfixe ausgibt, ist selbst ein Leck.
Die ausführliche Fassung mit Fehlermeldungen gibt es nur für angemeldete
Betreiber.

---

## 5. CI

`.github/workflows/pruefung.yml`, bei jedem Push und jedem Pull Request:

| Schritt | Befehl | blockiert? |
|---|---|---|
| Typen | `tsc --noEmit` | ja |
| Stil | `next lint` | ja |
| Unit-Tests | `npm test` | ja |
| Build | `next build` | ja |
| Abhängigkeiten | `npm audit --audit-level=high` | ja |
| Secret-Suche | Muster für Schlüssel im Diff | ja |
| Migrationen | Namensfolge lückenlos, keine Doppelnummer | ja |

### Was NICHT in die CI geht

**Die E2E-Läufe.** Sie brauchen Datenbankzugang, und der einzige verfügbare
Zugang ist die Produktivdatenbank. Testdaten dort automatisiert bei jedem
Push anzulegen ist ein Risiko, das der Nutzen nicht rechtfertigt – zumal die
Läufe sich selbst aufräumen, aber ein Abbruch mitten drin Reste hinterließe.

Sie bleiben ein bewusster lokaler Schritt vor jeder Auslieferung. Die CI
weist in ihrer Zusammenfassung darauf hin.

**Migrationen anwenden.** Die CI prüft nur die Struktur der Dateien, führt
sie aber nicht aus. Das Anwenden bleibt der bewusste Schritt mit
Trockenlauf, den `applyMigration.mjs` bereits absichert – dass eine Migration
erst gilt, wenn sie angewendet **und verifiziert** ist, war eine schmerzhafte
Lehre in diesem Projekt.

---

## 6. Reihenfolge

1. `lib/observability/log.ts` mit Bereinigung und Wächter-Test
2. Die 106 Aufrufe umstellen, beginnend bei Bestellung, Zahlung, Auth
3. Migration `system_ereignisse` + Schreiben bei kritischen Vorfällen
4. `/api/health`
5. CI-Workflow
6. Auswertung im Adminbereich

Schritt 1 und 2 zuerst: Ohne einheitliche Ausgabe hat die Ereignistabelle
keine verlässliche Quelle.

---

## 7. Umsetzungsstand (2026-07-22)

| Baustein | Stand |
|---|---|
| `observability/kontext.ts` – Request-ID über AsyncLocalStorage | **fertig** |
| `observability/log.ts` – Kategorien, Schweregrade, Bereinigung | **fertig** |
| `observability/ereignis.ts` – Brücke zur Tabelle | **fertig** |
| Migration 0019: `system_ereignisse` + Häufungen + Aufräumen | **angewendet** |
| `/api/health` mit drei Zuständen | **fertig** |
| CI-Workflow | **fertig** |
| `pruefeMigrationen.mjs`, `pruefeSecrets.mjs` | **fertig, laufen** |
| PII-Fund in `sendEmail.ts` behoben | **fertig** |
| Bestellpfad auf Ereignisse umgestellt | **fertig** |
| Cron-Route: Wartung + strukturierte Logs | **fertig** |
| Übrige ~100 `console.*`-Aufrufe | **offen** |
| Auswertung im Adminbereich | **offen** |

### Die drei Ergänzungen

**Request-ID über den Lebenszyklus.** `AsyncLocalStorage` trägt die Kennung
durch alle Funktionen, ohne sie durch jede Signatur zu reichen. Sobald eine
Bestellung entsteht, wird ihre Nummer nachgetragen (`merkeBestellung()`) –
ab da erscheint sie in jedem weiteren Eintrag. Ein Ablauf lässt sich damit
von zwei Seiten rekonstruieren: über die Anfrage („was geschah in diesem
Aufruf?") und über die Bestellung („was geschah mit dieser Bestellung?").

**Feste Kategorien und Schweregrade.** Zehn Kategorien, vier Schweregrade –
als geschlossene Typen im Code und als `check`-Bedingung in der Datenbank.
Beides wurde geprüft: Ein ungültiger Wert wird von Postgres abgewiesen.

**Produktionsmodus.** `DEBUG` erscheint dort nie, Stacktraces ebenso wenig.
Zwei Tests belegen beides, indem sie `NODE_ENV` umschalten.

### Nachgewiesen

18 Tests in `observability/__tests__/log.test.ts`. Der Schwerpunkt liegt auf
der Bereinigung: E-Mail-Adressen, IP-Adressen, Schlüssel, Token. Ebenso
geprüft ist, was **erhalten bleiben muss** – UUIDs und Bestellnummern sind
Kennungen, keine Geheimnisse, und ohne sie wäre nichts mehr nachvollziehbar.

Gegen die echte Datenbank geprüft: Ereignis schreiben, nach Bestellnummer
finden, Häufung berechnen, ungültige Schwere und Kategorie abweisen.

### Ein Wächter hat mich korrigiert

Der Health-Check las anfangs selbst `process.env.ADMIN_SECRET`, um die
Mindestlänge zu prüfen. Der Wächter aus H1 schlug an – zu Recht: Dafür gibt
es `isAdminConfigured()`, und jede weitere Stelle, die das Secret anfasst,
ist eine neue Gelegenheit, es auszugeben.

### Offen: die übrigen Protokollaufrufe

Rund hundert `console.*` außerhalb der kritischen Pfade sind noch nicht
umgestellt. Sie funktionieren weiter, erscheinen aber unstrukturiert und
ohne Anfrage-Kennung. Ein Wächter verbietet bereits `console.log`; die
vollständige Umstellung ist mechanische Arbeit, die schrittweise erfolgen
kann.
