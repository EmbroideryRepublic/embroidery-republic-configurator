# Rate-Limiting

Eine zentrale Infrastruktur für alle Endpunkte. Stand 2026-07-22.

---

## 1. Ist-Aufnahme

| Endpunkt | heute | Risiko |
|---|---|---|
| `submitOrder` / `submitInquiry` | **kein Limit** | teuerster Pfad: Uploads, Rendering, PDF, 2 E-Mails |
| `adminLogin` | **kein Limit** | **Brute Force auf das Betriebsgeheimnis** |
| `storniereBestellungAction` | **kein Limit** | Token-Raten |
| Kontaktformular | In-Memory | wirkungslos, siehe unten |
| Webhooks | signaturgeprüft | Signaturprüfung kostet Rechenzeit |
| Cron-Route | `CRON_SECRET` | ausreichend |

Der Admin-Login ist der schwerwiegendste Fund: Das Secret hat mindestens
12 Zeichen, aber ohne Begrenzung lässt sich beliebig oft raten. Wer es
errät, hat vollen Zugriff auf alle Bestellungen und Kundendaten.

---

## 2. Warum das bisherige Limit wirkungslos ist

`contact.ts` hält die Zähler in einer `Map` im Prozessspeicher. Drei Gründe,
warum das im Produktivbetrieb nicht schützt:

**Jede Instanz zählt für sich.** Auf einer serverlosen Plattform bekommt
praktisch jeder Aufruf eine eigene Instanz. Bei zehn parallelen Instanzen
sind faktisch zehnmal so viele Anfragen erlaubt wie konfiguriert – bei
automatischer Skalierung beliebig viele.

**Kaltstarts löschen den Zähler.** Eine Instanz, die nach wenigen Minuten
Leerlauf beendet wird, nimmt ihre Zähler mit. Wer seine Anfragen verteilt,
trifft nie ein volles Fenster an.

**Die Map wächst unbegrenzt.** Schlüssel werden nie entfernt, nur ihre
Einträge gefiltert. Auf einer langlebigen Instanz ist das ein langsames
Speicherleck.

Der Code benennt das selbst als „best effort". Als Grundschutz gegen
versehentliche Doppel-Sends ist er brauchbar, als Sicherheitsmaßnahme nicht.

---

## 3. Entscheidung: Postgres, nicht Redis

Ein zentraler Zähler ist zwingend – die Frage ist nur, wo er liegt.

| | Redis / Upstash | **Postgres (Supabase)** |
|---|---|---|
| Latenz je Prüfung | ~1–5 ms | ~10–40 ms |
| Durchsatz | sehr hoch | für diese Last mehr als ausreichend |
| Automatischer Ablauf | eingebaut (TTL) | eigener Aufräumlauf nötig |
| **Neues Konto nötig** | **ja** | **nein** |
| Neuer Ausfallpunkt | ja | nein – fällt die DB aus, steht der Shop ohnehin |

**Gewählt: Postgres.** Zwei Gründe geben den Ausschlag.

Erstens die stehende Projektregel, keine neuen Konten anzulegen. Upstash
wäre ein weiterer Dienst mit eigenem Zugang, eigener Abrechnung und eigenem
Datenschutzbezug – für einen Zähler.

Zweitens die tatsächliche Last. Bei erwarteten Bestellzahlen im zwei- bis
dreistelligen Bereich pro Monat ist der Unterschied zwischen 2 ms und 30 ms
bedeutungslos. Der Bestellvorgang selbst dauert Sekunden.

Sollte die Last je so steigen, dass es zählt, ist der Austausch auf eine
Datei begrenzt: Alle Aufrufer kennen nur `pruefeRateLimit()`.

---

## 4. Aufbau

### Ein Zähler in der Datenbank

```sql
rate_limit_zaehler (schluessel, fenster_start, anzahl)
primary key (schluessel, fenster_start)
```

Das Zählen erfolgt in **einer** Datenbankanweisung
(`insert … on conflict do update set anzahl = anzahl + 1 returning anzahl`).
Damit ist es atomar: Zwei gleichzeitige Anfragen können nicht denselben
Zählerstand lesen und beide durchlassen. Das ist der Punkt, an dem eine
Anwendungslösung mit „lesen, prüfen, schreiben" scheitern würde.

### Feste Zeitfenster

Der Zeitstempel wird auf den Fensterbeginn abgerundet. Ein Limit von
5 Anfragen je 15 Minuten heißt: Innerhalb desselben Viertelstundenblocks
sind fünf erlaubt.

**Bekanntes Restrisiko:** An der Fenstergrenze ist kurzzeitig das Doppelte
möglich – fünf am Ende des einen, fünf am Anfang des nächsten Blocks. Ein
gleitendes Fenster würde das vermeiden, kostet aber deutlich mehr Aufwand.
Für die hier gewählten Limits ist der Effekt unerheblich: Zehn
Login-Versuche in kurzer Folge sind immer noch weit von einem erfolgreichen
Rateangriff entfernt.

### Schlüssel: IP **und** Merkmal

Ein reines IP-Limit benachteiligt Firmen und Mobilfunknetze: Hinter einer
NAT-Adresse sitzen unter Umständen hunderte Personen. Deshalb wird je nach
Endpunkt kombiniert:

| Endpunkt | Schlüssel | Grund |
|---|---|---|
| Bestellung | IP, großzügig | Firmenkundschaft teilt sich Adressen |
| Admin-Login | IP, streng | ein einziger Nutzerkreis, keine NAT-Problematik |
| Kontaktformular | IP + E-Mail-Adresse | trennt Personen hinter derselben Adresse |
| Stornierung | IP + Bestell-Token | ein Token gehört zu einer Bestellung |

Die IP allein ist nie das einzige Merkmal, wo ein besseres verfügbar ist.

### Ausnahmen

Interne Systeme und der angemeldete Betreiber werden übersprungen:

- Wer als Admin angemeldet ist, unterliegt keinem Limit. Er hat bereits
  vollen Zugriff; ihn zu begrenzen schützt niemanden und behindert die
  Arbeit.
- Der Testmodus zählt nicht mit. Sonst würde ein E2E-Lauf das Limit für
  echte Anfragen aufbrauchen.

---

## 5. Empfohlene Limits

| Endpunkt | Limit | Fenster | Begründung |
|---|---|---|---|
| **Admin-Login** | 5 | 15 min | Ein Betreiber vertippt sich zwei-, dreimal. 20 Versuche pro Stunde machen jedes Raten aussichtslos. |
| **Bestellung** | 10 | 1 h | Eine Person bestellt selten öfter. Großzügig genug für ein Büro hinter einer NAT-Adresse, eng genug gegen automatisierte Wellen. |
| **Anfrage** | 15 | 1 h | Unverbindlich, kein Zahlungsvorgang, günstiger im Ablauf – darf etwas höher liegen. |
| **Kontaktformular** | 5 | 10 min | Wie bisher; der Wert hat sich bewährt. |
| **Stornierung** | 10 | 1 h | Ein Token gehört zu einer Bestellung; wiederholte Versuche deuten auf Raten hin. |

Alle Werte stehen in `config/rateLimits.ts` – eine Stelle, ohne Codeänderung
anpassbar.

### Welche Angriffe das verhindert

| Angriff | verhindert durch |
|---|---|
| Erraten des Admin-Secrets | 5 Versuche / 15 min statt unbegrenzt |
| Bestellflut (Uploads, Rendering, E-Mail-Kontingent) | 10 Bestellungen / h je Adresse |
| Erschöpfen des Resend-Kontingents | Bestell- und Kontaktlimits zusammen |
| Erraten von Storno-Tokens | 10 Versuche / h |
| Speicherüberlauf durch parallele große Uploads | Bestelllimit begrenzt die Zahl der Vorgänge |

### Restrisiken – ausdrücklich benannt

**Verteilte Angriffe.** Wer über hunderte Adressen anfragt, umgeht jedes
IP-Limit. Dagegen hilft nur ein vorgelagerter Schutz auf Netzwerkebene
(Cloudflare o.ä.). Nicht Teil dieser Maßnahme.

**Wechselnde Adressen.** Mobilfunknetze vergeben neue Adressen. Ein
hartnäckiger Angreifer kann sie durchwechseln – dabei sinkt seine Rate
allerdings erheblich.

**Fenstergrenze.** Kurzzeitig ist das Doppelte möglich (siehe oben).

**Gefälschte IP-Kopfzeilen.** `x-forwarded-for` ist manipulierbar, wenn
kein vertrauenswürdiger Proxy davorsteht. Auf Vercel setzt die Plattform
den Wert selbst; bei einem anderen Betreiber wäre das zu prüfen.

**Verfügbarkeit vor Sicherheit.** Ist die Datenbank nicht erreichbar,
lässt die Prüfung die Anfrage **durch** statt sie abzuweisen. Ein Ausfall
des Zählers soll nicht den ganzen Shop lahmlegen. Der Vorfall wird
protokolliert.

---

## 6. Einheitliche Antwort

Alle Endpunkte antworten gleich:

- Eine Meldung, die sagt, dass es zu viele Versuche waren und **wann es
  wieder geht** – in Minuten, nicht als Zeitstempel.
- Kein Hinweis darauf, welches Limit gilt oder wie viele Versuche übrig
  waren. Ein Angreifer soll die Grenze nicht ausmessen können.
- Bei Überschreitung ein Protokolleintrag mit Endpunkt, gekürztem Schlüssel
  und Zählerstand. Gekürzt, weil eine vollständige IP-Adresse ein
  personenbezogenes Datum ist und nicht dauerhaft im Protokoll stehen soll.

---

## 7. Umsetzungsstand (2026-07-22)

| Baustein | Stand |
|---|---|
| Migration 0017: Tabelle + `pruefe_rate_limit()` + Aufräumfunktion | **angewendet** |
| `config/rateLimits.ts` – alle Grenzen an einer Stelle | **fertig** |
| `lib/security/rateLimit.ts` – einzige Prüfstelle | **fertig** |
| Admin-Login begrenzt | **fertig** |
| Bestellung und Anfrage begrenzt | **fertig** |
| Kontaktformular auf zentralen Zähler umgestellt | **fertig** |
| Stornierung begrenzt | **fertig** |
| In-Memory-Zähler entfernt | **fertig** |
| Wächter gegen einen zweiten Zähler | **fertig** |
| Aufräumlauf für alte Fenster | Funktion vorhanden, **Zeitplan offen** |

### Nachgewiesen

**`npm run test:e2e:ratelimit` – 16 Prüfungen gegen die echte Datenbank.**
Der wichtigste Test: 20 gleichzeitige Anfragen bei einem Limit von 5. Genau
fünf werden durchgelassen, und jeder Zugriff erhält einen eigenen
Zählerstand von 1 bis 20 – keiner geht verloren, keiner wird doppelt
vergeben. Ein Zähler nach dem Muster „lesen, prüfen, schreiben" würde hier
mehr als fünf durchlassen.

Der Test nutzt einen eigenen Verbindungspool. Über eine einzelne Verbindung
werden Abfragen serialisiert – der Test hätte dann nacheinander gezählt und
genau die Eigenschaft nicht geprüft, um die es geht.

**10 Tests in `lib/security/__tests__/rateLimit.test.ts`**, darunter zwei
Wächter: Es darf keinen zweiten Zähler im Projekt geben, und alle vier
schreibenden Endpunkte müssen die zentrale Prüfung verwenden. Beide Wächter
haben beim Einbau angeschlagen und zwei vergessene Stellen aufgedeckt.

### Offen: Zeitplan für den Aufräumlauf

`raeume_rate_limit_auf()` entfernt Fenster, die älter als 24 Stunden sind.
Aufgerufen wird sie noch von niemandem. Ohne regelmäßigen Lauf wächst die
Tabelle – bei den erwarteten Zahlen sehr langsam, aber unbegrenzt.

Naheliegend wäre ein Anhängen an die bestehende Cron-Route
(`/api/cron/process-supplier-orders`), die ohnehin regelmäßig läuft. Das ist
ein kleiner, eigener Schritt.
