# Umsatzsteuer – Architekturentscheidung

Stand 2026-07-22. **Kern umgesetzt und verifiziert.** Abschnitt 7 nennt, was
noch aussteht.

---

## 1. Befund – und eine Korrektur meiner letzten Aussage

In der Bestandsaufnahme (`weg-zu-version-1.md`, A1) hatte ich geschrieben, es
gebe **keine Steuerlogik im Code**. Das war falsch. Ich hatte nach `0.19`,
`1.19` und `MwSt` gesucht, nicht nach `taxPercent`.

Der tatsächliche Stand:

| Baustein | Stand |
|---|---|
| Steuerlogik in der Preispipeline | **vorhanden und vollständig** (`stages/orderStage.ts`) |
| Beide Fälle abgedeckt | enthaltene *und* aufgeschlagene Steuer, mit Bemessungsgrundlage |
| Preiszeile `category: 'steuer'` | vorgesehen, wird korrekt erzeugt |
| Tests | decken 19 % enthalten und 19 % aufgeschlagen bereits ab |
| **Aktive Einstellung** | `taxPercent: 0` → **die Zeile entsteht nie** |
| `taxAmount` aus der Pipeline | wird geliefert, aber **nirgends gespeichert** |
| Steuerfelder in der Datenbank | **fehlen** |
| Auszeichnung im Shop | **fehlt** |
| AGB § 4 (2) | offenes TODO |

Die Lage ist damit deutlich besser als berichtet: Es fehlt nicht die Logik,
sondern ihre **Aktivierung, Speicherung und Anzeige**.

### Die stillschweigende Annahme, nach der Sie gefragt haben

Es gibt genau eine, und sie ist nicht stillschweigend, sondern in
`DEFAULT_ORDER_CONFIG` ausgeschrieben:

```
pricesIncludeTax: true
```

**Die Katalogpreise sind bereits als Bruttopreise gemeint.** Das deckt sich
mit der Kalkulation, die netto rechnet und am Ende brutto rundet – beide Wege
passen zusammen, was mir vorher nicht bewusst war.

Zweiter Fund: Der Versandtarif (6,90 €) ist ein Kundenpreis und damit brutto.
In `selbstkosten.ts` rechne ich ihn bereits mit `bruttoZuNetto()` um. Das ist
konsistent, war aber meine eigene Annahme – jetzt ist sie belegt.

---

## 2. Das Problem: zwei Steuerstellen

Heute gibt es die Umsatzsteuer an **zwei** Orten:

| Ort | Zweck | Satz |
|---|---|---|
| `config/pricing/steuer.ts` | interne Kalkulation | `UMSATZSTEUERSATZ = 19` |
| `pricing/stages/orderStage.ts` | Kundenpreis | `OrderConfig.taxPercent = 0` |

Sie widersprechen sich derzeit sogar: 19 gegen 0. Ihre Forderung nach **einer
zentralen Stelle** ist damit die wichtigste Änderung.

---

## 3. Vorschlag

### 3.1 Eine Quelle, erweiterbar ohne Umbau

`config/pricing/steuer.ts` wird die einzige Stelle. Statt einer Konstanten
tritt eine Auflösung:

```ts
export interface Steuersatz {
  satz: number;            // 19
  bezeichnung: string;     // "Regelsteuersatz Deutschland"
  gueltigAb: string;       // '2007-01-01'
}

export function steuersatzFuer(land: string, art: Steuerart = 'regel'): Steuersatz
```

Heute liefert sie für `'DE'` immer 19 %. Neue Länder oder der ermäßigte Satz
sind ein zusätzlicher Tabelleneintrag – **keine Änderung an der
Geschäftslogik**, weil jeder Aufrufer nur `steuersatzFuer(...)` kennt.

Der Aufbau folgt `shipping.ts`: eine Tabelle, kein Ausweichwert. Für ein Land
ohne hinterlegten Satz gibt es keine Vermutung, sondern eine Fehlermeldung –
so wie es für Länder ohne Versandtarif kein Angebot gibt.

### 3.2 `orderStage` bekommt den Satz, statt ihn zu kennen

`OrderConfig.taxPercent` entfällt als frei gesetzte Zahl. Die Bestellstufe
fragt `steuersatzFuer(lieferland)`. `pricesIncludeTax` bleibt – es beschreibt
keine Steuerhöhe, sondern wie die Katalogpreise gemeint sind.

### 3.3 Netto rechnen, brutto anzeigen

Ihre Vorgabe und der bestehende Aufbau greifen ineinander:

```
Kalkulation (selbstkosten.ts)     alle Kosten netto
        ↓                          Gewinn, Zahlungsgebühr
   Nettoverkaufspreis
        ↓                          × 1,19, dann Rundung auf x,90
   Katalogpreis = BRUTTO
        ↓
Preispipeline (lib/pricing)        rechnet mit Bruttopreisen
        ↓                          weist die enthaltene Steuer aus
   Endpreis + Steuerzeile
```

Die Steuer wird also **einmal** aufgeschlagen – bei der Preisbildung – und
danach nur noch ausgewiesen. Doppelbesteuerung ist strukturell
ausgeschlossen, weil die Pipeline `pricesIncludeTax: true` sieht und die
Summe dadurch nicht erhöht.

### 3.4 Was gespeichert wird

Neue Migration `0014`, rückwärtskompatibel:

| Tabelle | Feld | Warum |
|---|---|---|
| `orders` | `tax_rate numeric(5,2)` | Satz zum Kaufzeitpunkt – spätere Änderungen berühren alte Bestellungen nicht |
| `orders` | `tax_amount numeric(10,2)` | ausgewiesene Steuer |
| `orders` | `net_total numeric(10,2)` | Nettosumme |
| `orders` | `prices_include_tax boolean` | wie die Preise gemeint waren |
| `order_items` | `tax_rate numeric(5,2)` | je Position, für gemischte Sätze später |
| `order_items` | `net_total_price numeric(10,2)` | Nettobetrag der Position |

Brutto ist bereits vorhanden (`total_price`, `unit_price`). Netto **und**
Brutto zu speichern ist Absicht: Eine Rechnung muss beides ausweisen, und aus
einem Bruttobetrag den Nettobetrag zurückzurechnen erzeugt bei mehreren
Positionen Rundungsdifferenzen.

### 3.5 Bestandsdaten

10 Bestellungen liegen vor, alle ohne Steuerangabe. Vorschlag:

- `prices_include_tax = true` (so war die Konfiguration)
- `tax_rate = 19.00`, `tax_amount` und `net_total` aus dem Bruttobetrag
  zurückgerechnet
- ein Vermerk in `order_events`, dass die Werte **nachträglich abgeleitet**
  und nicht zum Kaufzeitpunkt erhoben wurden

Alternative: Felder leer lassen und nur neue Bestellungen füllen. Sauberer im
Sinne der Nachvollziehbarkeit, aber Auswertungen müssten den Sonderfall
kennen. **Ich empfehle die Rückrechnung mit Vermerk.**

### 3.6 Anzeige

| Ort | Ergänzung |
|---|---|
| Produktseite | „inkl. 19 % MwSt." am Preis |
| Konfigurator, Warenkorb | Endpreis, Steuer im Aufklappbereich |
| Checkout | eigene Zeile „Umsatzsteuer 19 % (enthalten)" |
| Bestätigung, Rechnung | Nettosumme, Steuer, Bruttosumme getrennt |
| AGB § 4 (2) | „Alle Preise sind Endpreise inkl. gesetzlicher USt." |

---

## 4. Was sich für Sie ändert

**Keine Kundenpreise.** Die Katalogpreise waren bereits als brutto gemeint;
sie werden nur endlich so ausgewiesen. Ein T-Shirt zu 24,90 € kostet weiter
24,90 €, davon 3,98 € Umsatzsteuer.

**Die Marge sinkt rechnerisch** – nicht real, sondern weil sie bisher gegen
den Bruttobetrag gerechnet wurde. Diese Zahl war um 19 % zu günstig. Die
Kalkulation rechnet bereits netto und ist davon nicht betroffen.

---

## 5. Offene Frage an Sie

Der Freibetrag für kostenlosen Versand liegt bei 75 €. Zählt dafür der
**Brutto**- oder der **Nettowarenwert**?

Üblich gegenüber Verbrauchern ist brutto. Die Antwort ändert, ab wann der
Versand entfällt – bei einem Warenkorb um 70 € kann das kippen. Ich setze
brutto an, wenn Sie nichts anderes sagen.

---

## 6. Reihenfolge der Umsetzung

1. `steuer.ts` zur einzigen Quelle ausbauen (Auflösung statt Konstante)
2. `orderStage` daran anschließen, `taxPercent` entfernen
3. Wächter-Test: keine zweite Stelle darf einen Steuersatz kennen
4. Migration 0014 schreiben, **anwenden und verifizieren**
5. Speicherung im Bestellvorgang
6. Anzeige und Rechtstexte
7. E2E-Durchlauf mit Steuerprüfung

---

## 7. Umsetzungsstand (2026-07-22)

| Schritt | Stand |
|---|---|
| `steuer.ts` als einzige Quelle (Auflösung statt Konstante) | **fertig** |
| `orderStage` angeschlossen, `taxPercent` entfernt | **fertig** |
| Wächter-Test gegen zweite Steuerstellen | **fertig** |
| Migration 0014 geschrieben, angewendet, verifiziert | **fertig** |
| Speicherung im Bestellvorgang (Bestellung + Positionen) | **fertig** |
| Anzeige Produktseite, AGB § 4 (2) | **fertig** |
| Deckungsbeitrag/Marge auf Nettobasis | **war bereits so, Tests sichern es** |
| Ausweis in Bestellbestätigung und Rechnung | **offen** |
| Ausweis im Adminbereich (netto/Steuer/brutto) | **offen** |
| Ausweis in Konfigurator und Warenkorb | **offen** |
| E2E-Durchlauf mit Steuerprüfung | **offen** |

### Ergebnis der Migration

10 Bestellungen, 19 Positionen. Brutto **5705,34 €** = netto **4794,41 €**
+ Steuer **910,93 €**. Jede Bestellung geht auf den Cent auf (größte
Abweichung 0,00 €). 10 Nachweise in `order_events` mit vollständigem Detail.
**Kein Kundenpreis hat sich geändert** – die Bruttosumme ist unverändert.

### Offener Punkt: EU-Lieferungen

`SHIPPING_COUNTRIES` erlaubt Lieferungen in EU-Länder, die Steuer rechnet
aber immer mit dem deutschen Satz. Solange die Lieferschwelle nicht
überschritten ist, ist das korrekt. Darüber gilt das Bestimmungslandprinzip
(OSS) – dann sind in `steuer.ts` die Sätze zu ergänzen und `orderStage` auf
das Lieferland umzustellen. Die Struktur trägt das bereits; es ist eine
steuerliche Entscheidung, keine technische.