# Upload-Lebenszyklus und Absicherung

Vom Hochladen bis zur Löschung. Stand 2026-07-22.

---

## 1. Der Weg einer Datei — Ist-Aufnahme

```
Kundschaft wählt Datei (SVG · PNG · PDF, max. 10 MB)
        ↓  LogoUploader.tsx – Prüfung im Browser
fileToImage()      PDF → PNG (pdfjs) · PNG/SVG direkt
        ↓
removeSimpleBackground()   optional, Canvas
        ↓
cropImageToContent()       IMMER, Canvas
        ↓  canvas.toDataURL('image/png')
Data-URL im Server-Action-Aufruf
        ↓
uploadProductionFile()     → privater Bucket "production-files"
        ↓
downloadProductionFile()   → Druckvorschau, Produktionsblatt
        ↓
getProductionFileSignedUrl()  → Adminbereich, interne Benachrichtigung
        ↓
(keine Löschung)
```

### Der wichtigste Befund

**Beim Server kommt ausschließlich PNG an.** Alle drei Client-Pfade enden in
`canvas.toDataURL('image/png')`:

| Datei | Weg | Ergebnis |
|---|---|---|
| PDF | `fileToImage` → pdfjs → Canvas | PNG |
| PNG | ggf. Freistellung → `cropImageToContent` → Canvas | PNG |
| SVG | `cropImageToContent` → Canvas | PNG |

Ein SVG erreicht die Serverseite **nie** – es wird im Browser vom Canvas
gerastert. Damit entfällt die gesamte Klasse der SVG- und XML-basierten
Angriffe (eingebettete Skripte, XXE, Billion Laughs) strukturell, nicht durch
Filterung.

**Aber:** Das ist heute eine Eigenschaft des Clients, keine erzwungene Zusage.
Ein manipulierter Client kann beliebige Bytes als Data-URL senden. Genau
deshalb muss der Server dieselbe Einschränkung **selbst durchsetzen**, statt
sich auf den Ablauf zu verlassen.

### Was heute fehlt

| Prüfung | Browser | Server |
|---|---|---|
| Dateityp | ja (`ACCEPTED_TYPES`) | **nein** |
| Größe | ja (10 MB) | **nein** |
| tatsächlicher Inhalt | nein | **nein** |
| Bildabmessungen | nein | **nein** |
| Löschung / Aufräumen | – | **nein** |

Browserprüfungen sind Benutzerführung, kein Schutz: Die Server Action nimmt
jede Data-URL entgegen, die ein Aufrufer schickt.

---

## 2. Bedrohungen und Gegenmaßnahmen

Jede Maßnahme mit Begründung – keine Vorsichtsmaßnahme ohne konkreten Anlass.

### B1 — Speicherüberlauf durch riesige Data-URL

`Buffer.from(base64, 'base64')` legt den **gesamten** Inhalt im Speicher ab.
Eine 500-MB-Data-URL belegt über 350 MB Heap pro Aufruf. Wenige parallele
Anfragen genügen für einen Absturz der Serverinstanz.

**Maßnahme:** Größe **vor** dem Dekodieren an der Länge der Base64-Zeichenkette
prüfen. Base64 wächst um Faktor 4/3; aus der Zeichenlänge lässt sich die
Bytegröße berechnen, ohne einen einzigen Byte zu dekodieren. Grenze: **10 MB**,
identisch zum Browser.

### B2 — Falsch deklarierter Inhalt

Der MIME-Typ steht in der Data-URL und stammt vom Aufrufer. `data:image/png`
mit beliebigem Inhalt wird heute unbesehen übernommen und mit
`contentType: 'image/png'` in den Bucket geschrieben. Wer die Signed URL
öffnet, bekommt vom Browser einen falschen Content-Type – bei HTML-Inhalt ein
XSS-Vektor.

**Maßnahme:** **Magic Bytes** prüfen. Ein PNG beginnt immer mit
`89 50 4E 47 0D 0A 1A 0A`. Der deklarierte Typ wird verworfen; maßgeblich ist
allein, was in der Datei steht.

### B3 — Bildbombe (kleine Datei, riesige Abmessungen)

Ein PNG von wenigen Kilobyte kann 50.000 × 50.000 Pixel deklarieren. Beim
Rendern der Druckvorschau wird daraus ein Puffer von mehreren Gigabyte – das
klassische Gegenstück zur ZIP-Bombe.

**Maßnahme:** Breite und Höhe aus dem **PNG-Header** lesen (Bytes 16–23, immer
an fester Position) und begrenzen. Grenze: **8.000 × 8.000 px**, das entspricht
bei 300 dpi rund 68 × 68 cm – weit über jeder Druckfläche im Sortiment.

Die Prüfung kostet nichts: Der Header liegt in den ersten 24 Bytes, es wird
nichts dekodiert.

### B4 — SVG und XML

Erreichen den Server nicht (siehe oben). Die Whitelist auf PNG macht das
verbindlich: Ein SVG scheitert bereits an der Signaturprüfung aus B2.

**Bewusste Festlegung:** Es wird **nicht** versucht, SVG serverseitig zu
bereinigen. Eine Bereinigung, die man selbst schreibt, ist eine dauerhafte
Angriffsfläche; sie nicht zu brauchen ist der bessere Schutz.

### B5 — Schadcode in Metadaten

PNG kann Textblöcke (`tEXt`, `iTXt`) und eingebettete Profile enthalten. Für
sich harmlos – sie werden nie ausgeführt. Relevant wären sie erst, wenn ein
Betrachter sie interpretiert.

**Maßnahme:** Keine. Die Dateien werden ausschließlich als Bildpuffer
gerendert (`sharp`/Canvas), nie als Dokument geöffnet. Metadaten zu entfernen
wäre Aufwand ohne Bedrohung. **Bewusst dokumentiert, damit die Entscheidung
nachvollziehbar ist und nicht für ein Versehen gehalten wird.**

### B6 — Pfadmanipulation

Der Speicherpfad wird aus `orderId` und `element.id` gebaut. Beide sind UUIDs
– die `orderId` erzeugt der Server selbst (seit K1), die Element-ID kommt
jedoch vom Client. Ein Wert wie `../../andere-bestellung/logo` könnte den Pfad
verlassen.

**Maßnahme:** Element-IDs als UUID prüfen, bevor sie in einen Pfad eingehen.

### B7 — Auslieferung

Der Bucket ist **privat**; Zugriff nur über zeitlich begrenzte Signed URLs
(7 Tage), und diese entstehen ausschließlich im Adminbereich und in der
internen Benachrichtigung. Kundenlogos werden nie öffentlich ausgeliefert.

**Maßnahme:** Keine Änderung nötig. Mit B2 ist zusätzlich sichergestellt, dass
der gespeicherte Content-Type dem Inhalt entspricht.

---

## 3. Zielbild

```
Data-URL trifft ein
        ↓
pruefeUpload()          ← EINE zentrale Stelle
   1. Aufbau der Data-URL
   2. Größe aus der Base64-Länge (VOR dem Dekodieren)
   3. Dekodieren
   4. Magic Bytes → tatsächlicher Typ
   5. Whitelist
   6. Abmessungen aus dem Header
        ↓ bei Verstoß: eine neutrale Meldung, Details nur ins Protokoll
uploadProductionFile()  ← nimmt nur noch geprüfte Puffer an
```

**Fehlermeldungen** nennen der Kundschaft nur, was sie ändern kann („Die Datei
ist zu groß" / „Dieses Dateiformat wird nicht unterstützt"). Der genaue Grund –
erwartete Signatur, gemessene Werte – geht ins Serverprotokoll. Ein Angreifer
soll aus den Antworten nicht ableiten können, welche Prüfung er als Nächstes
umgehen muss.

---

## 4. Verwaiste Dateien

Seit K1 liegen die Uploads **vor** der Transaktion. Scheitert sie danach,
bleiben Dateien ohne zugehörige Bestellung zurück. Kein Datenverlust, kein
falscher Zustand – nur belegter Speicher.

### Warum das nicht durch Löschen im Fehlerfall gelöst wird

Ein `catch`-Block, der die Dateien wieder entfernt, hilft nur, solange der
Prozess lebt. Genau bei Absturz, Zeitüberschreitung oder Neustart – den Fällen,
um die es geht – greift er nicht. Er erzeugt zusätzlich ein neues Risiko: Bei
einem Wiederholungsversuch mit derselben Kennung würden die Dateien einer
inzwischen erfolgreichen Bestellung gelöscht.

### Der Mechanismus: Abgleich statt Vermutung

Ein Aufräumlauf, der **nichts rät**:

1. Alle Ordner unter `orders/` auflisten. Jeder Name ist eine Bestellkennung.
2. Für jede Kennung prüfen, ob eine Bestellung existiert.
3. Löschen nur, wenn **beide** Bedingungen erfüllt sind:
   - es existiert **keine** Bestellung mit dieser Kennung, **und**
   - der Ordner ist **älter als 48 Stunden**.

Die Altersgrenze ist der Sicherheitsabstand: Sie verhindert, dass ein Lauf
Dateien einer Bestellung entfernt, die gerade angelegt wird. 48 Stunden sind
großzügig – ein Bestellvorgang dauert Sekunden.

**Trockenlauf zuerst.** Der Lauf meldet standardmäßig nur, was er löschen
würde. Erst mit ausdrücklichem Schalter löscht er. Jeder Lauf protokolliert
Anzahl und Kennungen.

### Aufbewahrung nach Bestellungen

Getrennt davon: Wie lange Dateien einer **gültigen** Bestellung aufbewahrt
werden, ist eine DSGVO-Frage (Audit H6) und wird dort entschieden. Der
Aufräumlauf für verwaiste Dateien greift nicht in diese Frist ein – er kennt
nur Ordner ohne Bestellung.

---

## 5. Grenzwerte

| Grenze | Wert | Begründung |
|---|---|---|
| Dateigröße | 10 MB | identisch zur Browserprüfung; ein PNG-Logo liegt weit darunter |
| Bildbreite | 8.000 px | bei 300 dpi ≈ 68 cm, größer als jede Druckfläche |
| Bildhöhe | 8.000 px | dito |
| erlaubter Typ | ausschließlich `image/png` | einziges Format, das der Client erzeugt |
| Aufräumfrist | 48 h | Sicherheitsabstand zu laufenden Bestellvorgängen |

Alle Werte stehen an **einer** Stelle und sind ohne Codeänderung anpassbar.

---

## 6. Umsetzungsstand (2026-07-22)

| Maßnahme | Stand |
|---|---|
| Zentrale Prüfung `lib/upload/pruefeUpload.ts` | **fertig** |
| Größe vor dem Dekodieren (B1) | **fertig** |
| Signaturprüfung, Whitelist (B2, B4) | **fertig** |
| Abmessungen aus dem PNG-Header (B3) | **fertig** |
| Content-Type aus der Signatur statt der Deklaration | **fertig** |
| Getrennte Meldungen: Kundschaft / Protokoll | **fertig** |
| Prüfung von Pfadkomponenten (B6) | **fertig**, an allen Stellen |
| Aufräumlauf verwaiste Dateien | **fertig** (`npm run dateien:pruefen`) |
| Metadaten (B5) | bewusst keine Maßnahme, siehe Begründung |
| Auslieferung (B7) | unverändert – privater Bucket, Signed URLs |

**Unumgehbar:** Die Prüfung sitzt in `uploadProductionFile()`. Jede Data-URL
läuft hindurch; es gibt keinen zweiten Weg in den Speicher. Serverseitig
erzeugte Puffer (Produktionsblatt-PDF, Vorschaubilder) sind ausgenommen – sie
kommen nicht von außen und würden an der PNG-Whitelist scheitern.

### Nachgewiesen

23 Tests in `lib/upload/__tests__/pruefeUpload.test.ts`, überwiegend negativ:
HTML als PNG deklariert, SVG mit Skript, XML-Entity-Bombe, ZIP-Archiv, PDF,
fast korrekte Signatur, Bildbombe 50.000 × 50.000 px, abgeschnittener Header,
Abmessungen null, leere und unbrauchbare Data-URLs, Pfadmanipulation.

Ein eigener Test prüft, dass Kundenmeldungen **keine** internen Informationen
enthalten (keine Signaturen, Bytefolgen, Feldnamen) und unter 120 Zeichen
bleiben, während der technische Grund im Protokoll erhalten bleibt.

Der E2E-Lauf über den echten Serverweg bleibt bei 21/21 – gültige Uploads
werden unverändert angenommen.

### Erster Lauf des Aufräummechanismus

26 Bestellordner im Speicher, 10 mit zugehöriger Bestellung, **16 verwaist**
(Reste aus Testläufen und entfernten Testbestellungen). Der Lauf hat nichts
gelöscht – das geschieht nur mit ausdrücklichem `--loeschen`.

### B6 vollständig eingehängt (2026-07-22)

Geprüft wurden alle fünf Stellen im Projekt, an denen Speicherpfade
entstehen:

| Stelle | Client-Wert im Pfad | Status |
|---|---|---|
| `orders.ts` Logo-Upload | **ja** – `element.id` | an der Quelle geprüft |
| `orderCompletion.ts` Vorschau | `view` – durch DB-Constraint auf vier Werte begrenzt | unkritisch |
| `orderCompletion.ts` Produktionsblatt | nein – fester Name | unkritisch |
| `orderCompletion.ts` Ordnerverweis | nein | unkritisch |
| `mapOrderElements.ts` Download | mittelbar – Pfad aus der Datenbank | an der Engstelle geprüft |

`fileName` aus dem Client wird ausschließlich als Datenfeld gespeichert und
nie in einen Pfad übernommen.

**Die Prüfung sitzt an der Engstelle**, nicht bei jedem Aufrufer:
`uploadProductionFile`, `downloadProductionFile` und
`getProductionFileSignedUrl` weisen unzulässige Pfade ab. Jeder Weg in den
und aus dem Speicher führt hindurch – auch ein sechster Aufrufer, der morgen
dazukommt und an nichts denkt.

Zusätzlich wird `element.id` an der Quelle geprüft, damit der Fehler die
Ursache benennt statt erst tief im Upload aufzutreten.

Abgewiesen werden: `..` in jeder Form, absolute Pfade, Backslashes,
Null-Bytes, Leer- und Sonderzeichen, übermäßig lange Pfade und Segmente.
29 Tests.
