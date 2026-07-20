# Lieferantenbestellung – der manuelle Ablauf (Soft-Launch)

Stand: Juli 2026. Dies ist der **verbindliche Regelweg**. Die
Browser-Automatisierung ruht (siehe unten).

---

## Warum manuell

Die automatische Warenkorb-Befüllung bei textil-grosshandel wurde ausführlich
gemessen und war **nicht verlässlich**: derselbe Warenkorb war mal vorhanden,
mal leer — bei gleichem Konto, gleichem Client und ohne Änderung dazwischen.
Der Betreiber sah wiederholt 0 Artikel, während die Automatisierung Erfolg
meldete. Die Messreihen stehen in `tg-automatisierung-ursachenanalyse.md`.

Konsequenz: Der Warenkorb wird **von Hand** befüllt. Die Anwendung liefert
dafür alle Angaben so aufbereitet, dass nichts nachgeschlagen werden muss.

---

## Der Ablauf

1. **Kunde bestellt.** Bestelldaten, Produktionsblatt und beide E-Mails
   entstehen wie bisher. Pro Lieferant wird automatisch ein Datensatz
   angelegt (Status `queued`).
2. **Bestellung im Adminbereich öffnen** — `/admin/bestellung/<id>`.
3. Im Abschnitt **Lieferanten-Bestellung** steht je Position eine Karte mit:
   - Produktname und **Artikelnummer**
   - Lieferant
   - **Farbe im Shop** inkl. Farbfeld und Hex-Wert (weicht die Bezeichnung von
     unserer ab, steht unsere in Klammern darunter)
   - **Gesamtmenge**
   - **Größen mit Stückzahlen**
4. **„Produkt bei Textil-Großhandel öffnen"** — führt direkt auf die
   Produktseite. Kein Suchen im Shop.
5. **„Produktionsblatt öffnen"** — die Druckvorlage als PDF.
6. Farbe, Größen und Mengen aus der Karte übernehmen, in den Warenkorb legen,
   Bestellung im Shop abschließen.
7. **„Als bei TG bestellt markieren"** — der Auftrag geht auf `ordered` und
   zeigt künftig „✓ Bei Textil-Großhandel bestellt".

Zwei Zustände, mehr nicht: **offen** und **bestellt**.

---

## Wenn die Farbe nicht eindeutig ist

Bei einigen Farben (grey, charcoal, burgundy, kelly-green, bottle-green, pink)
gibt es im Shop mehrere gleichwertige Bezeichnungen. Es wird bewusst **nicht
geraten**. Die Karte zeigt dann:

> **Nicht eindeutig zugeordnet** – bei uns „Grau". Bitte im Shop selbst wählen.
> Für dieses Produkt bekannt: Black, Navy, Royal Blue, White

Artikelnummer, Link, Größen und Mengen bleiben nutzbar; nur die Farbe wird im
Shop ausgewählt.

**Bekannte Einschränkung:** Angezeigt werden die für das Produkt *verifizierten*
Farben — nicht die vollständige Kandidatenliste. Die Kandidaten wurden bei der
ursprünglichen Verifikation nie gespeichert. Eine vollständige Liste je Produkt
erfordert einen einmaligen Datendurchlauf über die Produktseiten.

---

## Produkte ohne Bezugsquelle

Positionen ohne hinterlegte `supplierRefs` erscheinen als Hinweis
„Ohne Bezugsquelle (manuell bestellen)". Für sie gibt es weder Link noch
Artikelnummer. Betrifft derzeit vor allem Fruit-of-the-Loom-Modelle.

Für den manuellen Ablauf genügen **URL + Artikelnummer** — die Farb-Hex-Werte,
an denen diese Produkte früher hingen, braucht nur die Automatisierung. Sie
lassen sich also nachtragen, ohne die Farbfrage zu klären.

---

## Zustand der Browser-Automatisierung

Der Code bleibt vollständig im Projekt, wird aber **weder erweitert noch
verwendet**:

- `SUPPLIER_AUTOMATION_ENABLED` ist **nicht gesetzt** → kein Browserstart,
  jeder Lauf bliebe ein Dry-Run.
- Die Auslöse-Schaltflächen sind aus der Bestell-Detailseite **entfernt**.
  Die Laufprotokolle sind unter „Technische Details der ruhenden
  Automatisierung" eingeklappt erreichbar.
- `checkout()` ist unverändert `notImplemented` — die Anwendung löst nie
  selbst eine Bestellung aus (abgesichert in
  `worker/__tests__/prepareCartSafety.test.ts`).

Der Statusübergang nach `ordered` ist jetzt aus allen offenen Zuständen
erlaubt, weil die manuelle Bestellung der Regelfall ist. Früher war `ordered`
nur über `processing` erreichbar — das setzte einen Automatiklauf voraus.

---

## Sicherheitsfix im gleichen Zug

Beim Prüfen fiel auf, dass die Admin-Seiten Daten auslieferten, **ohne dass
eine Anmeldung vorlag**: Next.js rendert Seite und Layout parallel und
serialisiert das Seitenergebnis in den RSC-Payload des HTML — auch wenn das
Layout `children` verwirft. Das Login-Formular verdeckte die Daten nur optisch.

Im Quelltext der ungeschützten Seite standen Kundenname, E-Mail,
Artikelnummern und eine **funktionierende signierte Download-URL** des
Produktionsblatts.

Behoben: Jede Admin-Seite prüft die Anmeldung jetzt **selbst**
(`if (!isAdminAuthenticated()) return null;`), bevor Daten geladen werden.
Nachgemessen über alle vier Seiten: keine Treffer mehr.
