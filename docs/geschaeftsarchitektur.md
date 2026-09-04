# Geschäftsarchitektur Embroidery Republic

> **Stand 2026-07-21.** Dieses Dokument beschreibt das Grundmuster, nach dem
> alle kaufmännischen Prozesse im Projekt aufgebaut werden – nicht nur Preise.
> Es ist verbindlich für neue Funktionen.

---

## 1. Die vier Grundsätze

### G1 — Reine Geschäftslogik
Eine Berechnungsstufe kennt **keine Oberfläche, keinen Store, keine
Datenbank und keine konkrete Seite**. Sie arbeitet ausschließlich mit
standardisierten Datenobjekten. Dadurch ist dieselbe Logik von der Website,
dem Adminbereich, einer API oder einem Hintergrundjob nutzbar.

*Abgesichert durch:* `src/lib/pricing/__tests__/architektur.test.ts` prüft die
Importe der gesamten Pipeline. Erlaubt sind nur `@/types` und `@/config/*`.

### G2 — Klar getrennte Verantwortlichkeiten
Jede Stufe beantwortet genau eine Frage und kennt nur ihre eigene Ebene.
Übergeben wird ein standardisiertes Ergebnis, nie ein Zwischenzustand.

### G3 — Keine doppelte Geschäftslogik
Eine fachliche Regel ist an **genau einer** Stelle definiert. Alle anderen
Bereiche verwenden ausschließlich das Ergebnis. Es darf niemals zwei Wege
geben, denselben Preis oder dieselbe Regel zu berechnen.

*Warum das nicht theoretisch ist:* siehe Befund **B1** – eine zweite
Preisrechnung im Warenkorb hätte Kunden um **11,2 %** zu viel berechnet.

### G4 — Vollständige Nachvollziehbarkeit
Jedes Ergebnis trägt nicht nur Beträge, sondern auch **warum** sie entstanden
sind: Bezeichnung, Kategorie, Beschreibung, Herkunft (Stufe + Regel), Grund in
einem Satz und die Rechengrundlage. Damit lässt sich jede Berechnung intern,
im Support und gegenüber dem Kunden erklären.

---

## 2. Das Stufenmuster

```
Eingabe (standardisiert)
   │
   ▼
┌──────────┐   StageResult   ┌──────────┐   StageResult   ┌──────────┐
│ Stufe 1  │ ──────────────► │ Stufe 2  │ ──────────────► │ Stufe 3  │
└──────────┘                 └──────────┘                 └──────────┘
 kennt nur                    kennt nur                    kennt nur
 ihre Ebene                   ihre Ebene                   ihre Ebene
```

Jede Stufe liefert dasselbe `StageResult`:

| Feld | Bedeutung |
|---|---|
| `lines` | die entstandenen Posten, jeweils mit Metadaten |
| `stageTotal` | Summe dieser Stufe |
| `carriedTotal` | Übertrag aus der Vorstufe |
| `runningTotal` | Übergabewert an die nächste Stufe |
| `issues` | Beanstandungen |
| `blocked` | true = Ergebnis nicht belastbar |

**Blockieren statt raten.** Kann eine Stufe kein gültiges Ergebnis liefern
(unbekannter Preisbaustein, fehlender Versandtarif, unbekannter Gutschein,
unterschrittener Mindestwarenwert), wird das Ergebnis als `blocked` markiert.
Ein blockiertes Ergebnis darf weder angezeigt noch in Angebot oder Rechnung
übernommen werden.

---

## 3. Umgesetzt: die Preispipeline

| Stufe | Datei | Zuständig für |
|---|---|---|
| 1 Position | `lib/pricing/stages/positionStage.ts` | Produktpreis, Veredelung, Motivgröße, Positionen, Material-/Größenzuschläge, Einrichtung |
| 2 Warenkorb | `lib/pricing/stages/cartStage.ts` | Gutscheine, Aktionscodes, Kundengruppenrabatte, warenkorbweite Mengenrabatte, Mindestwarenwert |
| 3 Bestellung | `lib/pricing/stages/orderStage.ts` | Lieferland/Versand, Versandart, Zahlungsartzuschläge, Rechnungsgebühren, Express, Steuern |

Orchestriert von `lib/pricing/pipeline.ts` – die Datei enthält **keine**
Preislogik, sie ruft nur die Stufen in Reihenfolge auf.

### Beispiel einer Preisauskunft

Erzeugt allein aus den Metadaten der Posten (`explainLines`):

```
Gildan Heavy T-Shirt · 25 × 12.26 € · 306.50 € – Grundpreis abzüglich 5 %
  Mengenrabatt ab 25 Stück (menge: 25, mengenrabattProzent: 5) [Stufe position]
Veredelung Vorderseite · 25 × 16.63 € · 415.75 € – Stickerei auf der Ansicht
  „Vorderseite": Positionspreis 7,50 € der Mengenstaffel zuzüglich 1,20 € je
  1.000 geschätzte Stiche (stiche: 12000, satzJe1000Stiche: 1.2,
  veredelungsrabattProzent: 36.6, positionspreis: 7.5) [Stufe position]
Einrichtung · 25.00 € – Einmaliger Rüstaufwand, verteilt sich auf 25 Stück
Rabatt verein · -69.26 € – Rabatt für die Kundengruppe „verein" [Regel kundengruppe:verein]
Versand · 0.00 € – Versandkostenfrei, weil der Warenwert die Freigrenze erreicht
```

---

## 4. Befunde aus dem Architekturaudit

### B1 — Zweite Preisrechnung im Warenkorb · **behoben**

`cartStore.updateItemQuantity` rechnete den Preis selbst neu
(`unitPrice × Menge + Rüstkosten`) und wandte die **Mengenstaffel nicht erneut
an**. Gemessen:

| | |
|---|---|
| Kunde legt 5 Stück in den Warenkorb, erhöht auf 100 | |
| Store rechnete | **1.724,00 €** |
| Korrekt gewesen wäre | **1.550,18 €** |
| Abweichung zulasten des Kunden | **+173,82 € (11,2 %)** |

Ursache: Der Mengenrabatt blieb bei −5 % statt −25 % stehen.

Die Aktion hatte **keinen Aufrufer** und wurde deshalb entfernt statt
repariert. Der Grund steht als Warnung im Store. Wird die Mengenänderung im
Warenkorb gebraucht, muss sie über `calculatePipeline` laufen (Migration M1).

### B2 — Mengenregel viermal definiert · **behoben**

Die Summierung der Größen-Mengen lag dreimal in der Oberfläche als einfaches
`reduce` und einmal serverseitig mit Absicherung gegen negative und
nicht-numerische Werte. Die Oberfläche hätte bei fehlerhaften Daten eine
andere Menge angezeigt, als der Server berechnet.

Jetzt: `lib/pricing/quantity.ts` → `sumSizeQuantities()` als einzige gültige
Antwort. Ein Architekturtest verhindert die Rückkehr der Dubletten.

### B3 — Versandkosten werden in der Oberfläche selbst berechnet · **offen**

`CartDrawer.tsx` ruft `calculateShipping(form.country, total)` direkt auf, um
den Versand im Checkout anzuzeigen. Das ist ein **zweiter Weg** zum selben
Ergebnis – die Pipeline berechnet den Versand in Stufe 3.

*Aktuelles Risiko: gering.* Beide nutzen dieselbe Tarifquelle
(`config/shipping.ts`), und der Server ist autoritativ. *Künftiges Risiko:
hoch* – sobald der Versand von mehr abhängt als Land und Warenwert
(Versandart, Gewicht, Sperrgut, Aktionen), driften Anzeige und Berechnung
auseinander. → Migration **M2**.

### B4 — Preise werden im Warenkorb gespeichert statt abgeleitet · **offen**

`CartItem` speichert `unitPrice`, `totalPrice` und `setupTotal` als
Momentaufnahme beim Hinzufügen. Ändern sich Preisregeln zwischen Hinzufügen
und Bestellung, zeigt der Warenkorb veraltete Werte.

*Aktuelles Risiko: gering* – der Server rechnet vor der Bestellung ohnehin neu
(`serverPricing.ts`), gespeicherte Clientpreise werden nie übernommen.
*Künftiges Risiko: mittel* – die Anzeige kann vom berechneten Betrag
abweichen. → Migration **M3**.

---

## 5. Migrationsvorschläge

Bewusst **Vorschläge**, keine eigenmächtigen Umbauten – jeder Punkt ändert
sichtbares Verhalten.

### M1 — Mengenänderung im Warenkorb über die Pipeline
*Auslöser:* sobald die Menge im Warenkorb änderbar sein soll.
*Weg:* Der Store hält nur noch die Konfiguration; die Anzeige leitet Preise
über `calculatePipeline` ab. Keine Rechnung im Store.
*Aufwand:* klein, solange es zusammen mit der Funktion gebaut wird.

### M2 — Versandanzeige aus der Pipeline
*Weg:* `CartDrawer` ruft `calculatePipeline` mit `shippingCountry` auf und
zeigt die Posten der Kategorie `versand`. `calculateShipping` wird dann
ausschließlich von `orderStage` genutzt.
*Nutzen:* Anzeige und Berechnung können konstruktiv nicht mehr abweichen;
Versandaktionen und Versandarten wirken sofort überall.
*Aufwand:* klein bis mittel.

### M3 — Warenkorb speichert Konfiguration statt Preisen
*Weg:* `CartItem` verliert `unitPrice`/`totalPrice`/`setupTotal`; die Anzeige
berechnet sie bei Bedarf.
*Nutzen:* Es gibt keinen veralteten Preis mehr, und die gespeicherte
Datenmenge sinkt.
*Aufwand:* mittel – betrifft Warenkorb, Checkout und Bestellabschluss.
*Empfehlung:* zusammen mit M1 umsetzen.

---

## 6. Das Muster für weitere Geschäftsprozesse

Dasselbe Muster gilt für alles Kaufmännische. Vorgesehen:

| Prozess | Stufen (Vorschlag) | Standardisierte Übergabe |
|---|---|---|
| **Rabatte/Aktionen** | bereits Teil der Preispipeline (Stufe 2/3) | `PriceLine` |
| **Freigaben** | Prüfung → Entscheidung → Protokoll | `ApprovalResult` mit Gründen |
| **Produktionsplanung** | Auftrag → Arbeitsschritte → Terminierung | `ProductionPlan` mit Kapazitätsposten |
| **Versandlogik** | Paketbildung → Tarif → Versandart | `ShipmentPlan` |
| **Rechnungsstellung** | Positionen → Steuern → Beleg | direkt aus `PriceLine` erzeugbar |
| **Statuswechsel** | erlaubter Übergang? → Nebenwirkungen → Protokoll | `TransitionResult` |

Verbindliche Vorgaben für jeden neuen Prozess:

1. **Reine Logik** – keine Importe aus Oberfläche, Store oder Datenbank.
2. **Stufen mit einer Zuständigkeit** – jede Stufe beantwortet eine Frage.
3. **Standardisierte Übergabe** – ein Ergebnisobjekt mit `lines`/`issues`/
   `blocked`, wie `StageResult`.
4. **Nachvollziehbarkeit** – jedes Ergebnis nennt Grund und Grundlage.
5. **Blockieren statt raten** – im Zweifel kein Ergebnis statt eines falschen.
6. **Fail fast** – unbekannte Bausteine werfen in Entwicklung und Test sofort;
   in Produktion werden sie protokolliert und markieren das Ergebnis als
   fehlerhaft.
7. **Ein Architekturtest je Prozess**, der Grundsatz 1 und 3 dauerhaft prüft.

### Bestehendes, das noch nicht nach diesem Muster gebaut ist

- **Bestellstatus-Wechsel** (`config/orderStatus.ts`, `lib/actions/orderStatusActions.ts`)
  – funktioniert, ist aber nicht als Stufe mit `TransitionResult` modelliert.
  Kein akutes Risiko; beim nächsten größeren Eingriff angleichen.
- **Lieferantenautomatisierung** (`lib/suppliers/`) – hat mit Adaptern und
  Selektionsstrategie bereits eine saubere Trennung, nutzt aber ein eigenes
  Ergebnisformat. Eine Vereinheitlichung auf `issues`/`blocked` wäre folgerichtig,
  ist aber kein Selbstzweck.

---

## 7. Was dieses Dokument NICHT festlegt

Beträge, Prozentsätze, Steuersätze, Gutscheine und Mindestwerte. Sie sind
Geschäftsentscheidungen und stehen ausschließlich in der Konfiguration
(`config/pricingRules.ts`, `CartConfig`, `OrderConfig`) – standardmäßig
**deaktiviert bzw. 0**.
