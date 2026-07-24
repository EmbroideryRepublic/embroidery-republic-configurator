# Kalkulationsmodell

Wie aus Einkaufspreis, Veredelung und Kosten ein Verkaufspreis wird.
Stand: 2026-07-22.

Dieses Dokument beschreibt das **fertige Rechenmodell**. Die Herkunft der
einzelnen Zahlen und die noch offenen Punkte stehen in
`kalkulationsgrundlage.md`.

---

## Der Grundsatz

> Ein Motiv hat keinen Preis. Nur ein Auftrag hat einen Preis.

Verpackung, Versand, der Festbetrag der Zahlungsgebühr und vor allem die
DTF-Bögen fallen **je Bestellung** an, nicht je Stück. Ein Einzelstück trägt
sie allein, fünfzig Stück teilen sie sich. Deshalb rechnet das Modell immer
den ganzen Auftrag und teilt erst am Ende durch die Menge.

Aufträge verschiedener Kunden werden dabei **nie zusammengelegt**, auch wenn
das Bögen sparen würde – beim Kalkulieren ist nicht bekannt, ob der zweite
Auftrag je eintrifft.

---

## Umsatzsteuer

**Alle Kosten netto, am Ende 19 % drauf.** Festlegung des Betreibers vom
2026-07-22, umgesetzt in `config/pricing/steuer.ts`.

Die Vorsteuer auf Einkäufe holen wir vom Finanzamt zurück. Ein
Bruttoeinkaufspreis in der Kalkulation würde uns Kosten zurechnen, die wir
gar nicht tragen.

### Gerundet wird brutto

Ein psychologischer Preis wirkt dort, wo die Kundschaft ihn liest. 19,90 €
netto ergäben 23,68 € brutto – im Schaufenster stünde eine krumme Zahl.
Deshalb: netto rechnen, mit 1,19 hochrechnen, **dann** auf x,90 runden. Der
Nettopreis ist danach nicht mehr glatt (23,90 / 1,19 = 20,08 €), und das ist
richtig so.

### Die Marge rechnet netto

Die Umsatzsteuer ist durchlaufender Posten, kein Ertrag. Würde sie in die
Marge eingehen, sähe jede Kalkulation um 19 Prozentpunkte zu gut aus. Ein
Test sichert ab, dass bereits der **Netto**preis die Selbstkosten deckt –
sonst finanzierte die Steuer den Betrieb und fehlte beim Abführen.

### Was der Shop heute rechnet: weder noch

Geprüft am 2026-07-22 über den gesamten Bestand:

| geprüft | Ergebnis |
|---|---|
| Steuerfelder in 13 Migrationen | **keine** – `orders` und `order_items` führen nur `price`, `unit_price`, `total_price` |
| Steuerlogik im Code | **keine** – kein Steuersatz, kein Faktor, keine Umrechnung |
| Auszeichnung am Preis | **keine** – nirgends „inkl." oder „zzgl. MwSt" |
| Bestellbestätigung | weist Zwischensumme und Gesamtsumme aus, **ohne Steuerzeile** |
| AGB § 4 (2) | trägt ein offenes TODO: „Netto- oder Bruttopreise bzw. § 19 UStG" |

Die Frage ist also nie entschieden worden. Die Preise im Katalog sind
**rechtlich undefinierte Zahlen** – nicht netto, nicht brutto. Doppelt
berechnet wurde die Steuer damit nirgends; sie wurde schlicht **nie**
berücksichtigt.

Das ist ein Go-live-Blocker: Gegenüber Verbrauchern verlangt die
Preisangabenverordnung Endpreise inklusive Umsatzsteuer, und der Shop richtet
sich ausdrücklich auch an Privatkunden.

Deshalb bleibt die neue Kalkulation vorerst getrennt: Sie liefert Netto- und
Bruttopreis sauber getrennt, greift aber nicht in Bestellvorgang, Datenbank
oder Rechnungsstellung ein. Diese Umstellung ist ein eigener Schritt.

### Der Versandtarif ist brutto

6,90 € ist ein Kundenpreis. Für die Gegenrechnung gegen unsere Nettokosten
wird er auf 5,80 € netto umgerechnet. Ohne das schrieben wir uns 1,10 € gut,
die dem Finanzamt gehören.

---

## Kosten und Preis sind zwei Fragen

Festlegung des Betreibers vom 2026-07-22. Die Selbstkostenrechnung
beantwortet **was kostet es uns**, die Preisstrategie **was verlangen wir**.
Beides zu vermischen hieße, die langfristige Preisstrategie auf den teuersten
Anfangsprozess zu optimieren.

| Größe | Bedeutung |
|---|---|
| `selbstkosten` | Was der Auftrag bei der **heute gelebten** Beschaffung kostet. Wahrheit über unsere Lage. |
| `preisbasisKosten` | Der Beschaffungsweg, auf dem der **Preis** aufbaut. Darf günstiger sein. |
| `deckungsbeitrag` | Nettoerlös minus **Istkosten**. Negativ = trägt sich nicht. |

Der Deckungsbeitrag rechnet **immer gegen die Istkosten**, nie gegen die
Preisbasis – sonst rechnete sich eine strategische Entscheidung selbst schön
und ein Verlustgeschäft sähe im Bericht profitabel aus. Ein Test sichert das.

### Die Strategie ist derzeit neutral

`PREISSTRATEGIE` setzt die Preisbasis gleich der Istbeschaffung und nutzt
einen einheitlichen Gewinnsatz. **Es ändert sich damit kein einziger Preis.**
Die Datei stellt die Wahl bereit, trifft sie aber nicht.

### Die Alternativen, vergleichbar gemacht

`npm run preis:strategien` stellt sie mit Zahlen gegenüber (Valueweight T,
DTF-Brustmotiv, Einzelstück):

| Strategie | 1 St. | 15 St. | Deckungsbeitrag bei 1 St. |
|---|---|---|---|
| Istkosten weitergeben (aktiv) | 38,90 € | 11,90 € | +8,23 € |
| Einzelstücke mit kleinerer Marge | 31,90 € | 11,90 € | +2,49 € |
| Bündelung unterstellen (5 Aufträge) | 31,90 € | 10,90 € | +2,49 € |
| Lagerware unterstellen | 30,90 € | 10,90 € | +1,68 € |

Alle vier tragen sich – keine erzeugt ein Verlustgeschäft. Sie unterscheiden
sich darin, wie viel am Einzelstück verdient wird und welches Risiko
mitläuft.

### Der eigentliche Hebel liegt woanders

Kostenaufteilung eines Einzelstücks (netto, 24,46 € gesamt):

| Posten | Betrag | Anteil |
|---|---|---|
| **DTF-Bogen** | 9,69 € | **40 %** |
| **DTF-Lieferantenversand** | 4,90 € | **20 %** |
| Textil-Lieferantenversand | 4,90 € | 20 % |
| Textil-Einkauf | 3,24 € | 13 % |
| Zahlung, Ausschuss, Verpackung | 1,73 € | 7 % |

**60 % der Kosten eines Einzelstücks sind DTF.** Der Textil-Lieferantenversand,
um den es zuletzt ging, ist nur ein Fünftel. Selbst mit Lagerware bliebe ein
Einzelstück bei rund 31 €, weil ein Motiv den ganzen Bogen samt Versand trägt.

Der wirksamste Hebel wäre, DTF-Bögen über mehrere Aufträge zu füllen. Das ist
derzeit ausdrücklich ausgeschlossen (Festlegung: keine Auftragskombination),
und diese Festlegung ist beim Kalkulieren richtig – ob sie auch für die
Beschaffung gelten muss, ist eine offene Frage an den Prozess, nicht an die
Rechnung.

---

## Zwei Kostenebenen

Festlegung des Betreibers vom 2026-07-22 und die tragende Unterscheidung der
ganzen Kalkulation:

| Ebene | Was | Verhalten |
|---|---|---|
| **produkt** | Einkauf, DTF-Bögen, Stickgarn, Ausschuss | wächst mit der Menge |
| **bestellung** | Kundenversand, Verpackung, Zahlungsgebühren, später Lieferantenversand | fällt **einmal** an |

Der Grund ist wirtschaftlich: Wer ein T-Shirt und einen Hoodie bestellt, zahlt
einen Versand. Würde man ihn beiden Positionen voll zurechnen, wären beide
künstlich verteuert – und eine Sammelbestellung sähe teurer aus als zwei
Einzelbestellungen. Ein Test sichert genau das ab.

### Die Ebene wird abgeleitet, nicht gepflegt

`kostenebene(art)` folgt eindeutig aus der Kostenart. Ein zweites Feld am
Block könnte der Art widersprechen – „je Stück" und zugleich „bestellbezogen"
– und niemand bemerkte es.

### Verteilungsschlüssel

Bestellbezogene Kosten werden nach einem Schlüssel auf die Positionen
verteilt, der **am Kostenblock** steht:

| Block | Schlüssel | warum |
|---|---|---|
| Versand, Verpackung | `nach_menge` | jedes Stück belegt gleich viel Karton |
| Zahlungsgebühr (fix) | `nach_wert` | die Gebühr hängt am Betrag |

Der Schlüssel ist eine fachliche Aussage, keine Formalie. `je_position` steht
zusätzlich bereit, wird aber derzeit von keinem Block genutzt.

### Was das für später öffnet

Die Struktur trägt bereits den Fall, den der Betreiber im Blick hat: Wenn
eine Lieferantenbestellung mehrere Kundenaufträge oder einen Lagerbestand
abdeckt, verteilt sich der Lieferantenversand darüber – ohne dass ein
einzelnes Produkt teurer wird. Eingebaut ist dieser Kostenblock noch nicht,
weil die Kondition offen ist (siehe unten).

---

## Die Kette

```
  Textil (EK × Menge)
+ Veredelung          DTF: Bogenbelegung · Stickerei: Stiche × Satz
+ Ausschuss           Stick 10 % · DTF 2 %
+ Logistik            Verpackung + Versand − was die Kundschaft zahlt
+ Zahlungsgebühr fix  0,35 € je Bestellung
─────────────────────────────────────────────────────────────────
= Kosten ohne prozentuale Anteile
                      ÷ (1 − Gewinn 25 % − Zahlungsgebühr 2,5 %)
─────────────────────────────────────────────────────────────────
= Verkaufspreis des Auftrags
                      ÷ Menge, dann Rundung auf x,90
```

### Warum geteilt und nicht multipliziert

Gewinn und Zahlungsgebühr sind Anteile **am Verkaufspreis**, nicht an den
Kosten. Wer 25 % auf die Kosten aufschlägt, erhält keine 25 % Marge, sondern
20 %. Deshalb wird rückwärts gelöst:

```
VK = Kosten / (1 − 0,25 − 0,025) = Kosten / 0,725
```

Dieser Unterschied ist der häufigste Fehler in Handkalkulationen und der
Grund, warum die Formel im Code steht und nicht in einer Tabelle.

### Warum Ausschuss ein Kehrwert ist

Bei 10 % Ausschuss müssen `1 / 0,9 = 1,111` Stück gefertigt werden, um eines
zu verkaufen. Der Aufschlag trifft Textil **und** Veredelung: Geht ein Stück
beim Sticken kaputt, ist beides verloren.

Stickerei liegt bei 10 %, DTF bei 2 % – beim Sticken wird das Textil
durchstochen und ist unrettbar, ein Transfer lässt sich vor dem Pressen
prüfen.

---

## DTF: die Folienbelegung

Wir kaufen **Bögen, keine Motive**:

| Bogen | Maße | Preis |
|---|---|---|
| A4 | 210 × 297 mm | 6,29 € |
| A3 | 297 × 420 mm | 9,69 € |
| groß | 550 × 500 mm | 13,99 € |
| sehr groß | 550 × 1000 mm | 18,99 € |

Dazu 4,90 € Lieferantenversand, entfallend ab 75 € Bogenwert.

`guenstigsteBelegung()` rechnet aus, wie viele Motive bei **8 mm
Sicherheitsabstand** zueinander und zum Rand auf jeden Bogen passen, prüft
beide Ausrichtungen und wählt die günstigste Kombination.

Die Anordnung erfolgt im **Raster**, nicht als optimales Packen. Das ist
Absicht: Der Dienstleister ordnet ebenfalls im Raster an, und eine
Packoptimierung würde eine Genauigkeit vortäuschen, die die Fertigung nicht
einhält. Die Rasterrechnung liegt eher zu niedrig – sie kalkuliert nie zu
knapp.

**Nachgerechnet gegen die Praxis:** Ein Einzelstück mit A4-Motiv kostet
9,69 € (A3-Bogen) + 4,90 € Versand = 14,59 €. Der Betreiber nannte
unabhängig davon „ungefähr 14 €". Das Modell trifft die Realität.

---

## Rundung

Auf `x,90` und **immer nach oben**: 19,73 € wird zu 19,90 €, nie zu 18,90 €.
Runden darf die Marge nicht auffressen.

**Bekannte Eigenschaft:** Bei niedrigen Preisen sind die x,90-Stufen grob.
Zwischen 6,90 € und 7,90 € liegen über 14 %. In der Nähe einer Stufengrenze
kann eine größere Menge deshalb denselben oder einen leicht höheren Preis
ergeben als eine kleinere. Im Bereich ab etwa 15 € fällt das nicht mehr ins
Gewicht.

---

## Was bewusst nicht einfließt

| Position | Warum |
|---|---|
| **Retouren** | Nur personalisierte Ware, vom Widerruf ausgenommen. Das Risiko liegt im Ausschuss. |
| **Arbeitszeit** | Produktion läuft neben der regulären Tätigkeit; soll die Preise nicht treiben. Referenzwert 30 €/h dient nur der Frage „lohnt der Aufwand?". |

Beide stehen als Block mit `aktiv: false` und dem Vermerk *BEWUSST
AUSGESCHALTET* – damit sie nicht später für vergessen gehalten werden.

Weiterhin **unbekannt** (Wert 0, nicht abgeschaltet): Maschinenverschleiß,
Strom, Software, Hosting, Versicherungen. Für die monatlichen Fixkosten fehlt
zusätzlich die Bezugsgröße (erwartete Bestellungen je Monat) – ohne sie lässt
sich ein Monatsbetrag nicht auf eine Bestellung umlegen.

---

## Offene Punkte

### 1. Der Stichsatz — vor Preisfreigabe zu klären

Drei Werte wurden genannt:

| Satz | Kontext | 12.000 Stiche |
|---|---|---|
| 1,40 €/1.000 | interne Verrechnung (21.07.) | 16,80 € |
| 0,76 €/1.000 | externer Stickpartner (21.07.) | 9,12 € |
| **0,10 €/1.000** | genannt am 22.07. | **1,20 €** |

Aktuell rechnet das Modell mit 0,10 €. Das ergibt ein **besticktes Shirt für
6,90 € gegenüber einem bedruckten für 24,90 €** – Stickerei wäre damit die
mit Abstand billigste Veredelung, was der Marktlage widerspricht.

Wahrscheinlich beschreiben die Sätze Verschiedenes: 0,10 € trägt das reine
Garn, die höheren Sätze schließen Maschinenzeit ein. Da die Arbeitszeit hier
bewusst nicht einfließt, ist der Materialsatz konsistent – bestätigt ist das
aber nicht.

Jede Kalkulation mit Stickerei weist den Vorbehalt in `hinweise` aus.

### 2. Der Gewinnsatz

25 % ist die **Haupt-Stellschraube** der gesamten Preisbildung. Der Wert
wurde nicht genannt, sondern so gewählt, dass die Preise ungefähr auf dem
angestrebten Shirtinator-Niveau landen. Alle Preise ändern sich, wenn hier
gedreht wird – Produktpreise werden nie einzeln angefasst.

### 3. Mengenrabatt des Textil-Lieferanten — bewusst zurückgestellt

Die Produktseiten werben mit **„Mengenrabatten zwischen 5 – 24 %"**. Die
Kalkulation rechnet mit festem Einkaufspreis.

**Entscheidung des Betreibers vom 2026-07-22: vorerst nicht übernehmen.**
Bekannt ist nur die Spanne, nicht die Staffelgrenzen und nicht, ob sie für
alle Marken gleich gelten. Konservativ zu rechnen ist die sichere Richtung –
wir kalkulieren bei großen Mengen eher zu teuer als zu billig.

Sobald die echten Einkaufskonditionen oder eine vollständige Staffel
vorliegen, lässt sich das als zusätzlicher Optimierungsfaktor ergänzen.

### 4. Beschaffungsmodell — Anfangsphase kostet Einzelstücke

`config/pricing/beschaffung.ts` bildet ab, **wie** eingekauft wird:

| Modell | Bedeutung | Lieferantenversand |
|---|---|---|
| `je_bestellung` | erst nach Kundeneingang bestellen — **aktuell** | voll je Kundenbestellung |
| `sammelbestellung` | mehrere Aufträge zusammenfassen | geteilt, Freigrenze eher erreicht |
| `lager` | Ware liegt im Regal | entfällt (steckt im EK) |

Der Umstieg ist **eine geänderte Konstante**. Kein Produktpreis und keine
Formel ändert sich dadurch.

Konditionen: 4,90 € (Angabe Betreiber 21.07.), entfallend ab 150 € Warenwert
(belegt auf der Produktseite 22.07.). Die beiden Zahlen stammen aus
verschiedenen Quellen — die früher genannten 75 € dürften den
DTF-Dienstleister betreffen.

**Die Wirkung ist bei kleinen Mengen erheblich:**

| Menge | Textilwert | Lieferantenversand | Verkaufspreis |
|---|---|---|---|
| 1 | 3,24 € | 4,90 € | **38,90 €** |
| 15 | 48,60 € | 4,90 € | 11,90 € |
| 50 | 162,00 € | **0 €** | 10,90 € |

Ein Einzelstück trägt 4,90 € Lieferantenversand allein — nach
Rückwärtsrechnung und Steuer schlägt das mit rund 8 € auf den Endpreis durch.
38,90 € für ein bedrucktes T-Shirt liegt **über** dem angestrebten
Shirtinator-Niveau.

Das ist keine Fehlrechnung, sondern die ehrliche Abbildung der Anfangsphase:
Für ein 3,24 €-Shirt extra beim Großhändler zu bestellen lohnt sich nicht.
Genau deshalb ist das Modell umschaltbar — sobald gesammelt wird oder Lager
entsteht, fällt der Betrag weg, ohne dass die Kalkulation angefasst wird.

### 5. Versandkosten im Produktpreis — bewusst getrennt gehalten

| Quelle | Aussage |
|---|---|
| Betreiber, 21.07. | „Lieferantenversand 4,90 € unter 75 €" |
| Screenshot, 22.07. | „Gratis Lieferung ab 150 € (DE)" |

**Entscheidung des Betreibers vom 2026-07-22: nicht in den Produktpreis
einrechnen.** Die Begründung ist wirtschaftlich zwingend: Unsere
Einkaufskosten hängen an der gesamten Lieferantenbestellung, nicht am
einzelnen Produkt. Bei Sammelbestellungen für mehrere Kunden oder bei
Lagerbestellungen relativiert sich der Versand stark oder entfällt.

Genau dafür trennt die Kalkulation seit dem 22.07. produktbezogene von
bestellbezogenen Kosten (siehe oben). Der Lieferantenversand ist ein
bestellbezogener Block – sobald die Kondition feststeht, wird er dort
eingehängt, ohne dass ein Produktpreis sich ändert.

### 5. Zahlungsgebühren

2,5 % + 0,35 € ist ein **marktüblicher Mischwert** über PayPal, Kreditkarte
und Klarna, nicht aus eigenen Abrechnungen gemessen. Bei der ersten echten
Abrechnung ersetzen.

---

## Wo was steht

| Datei | Inhalt |
|---|---|
| `config/pricing/selbstkosten.ts` | die Kette, `kalkuliere()` |
| `config/pricing/dtfKosten.ts` | Bögen, Belegungsrechnung |
| `config/pricing/gemeinkosten.ts` | alle Kostenblöcke mit Herkunft |
| `config/pricing/einkaufspreise.ts` | belegte Einkaufspreise je Produkt |
| `config/shipping.ts` | was die Kundschaft für Versand zahlt |

`kalkuliere()` ist eine reine Funktion ohne Datenzugriffe und **läuft nicht
im Bestellvorgang**. Was die Kundschaft zahlt, rechnet weiterhin
`lib/pricing/` – kein Betrag aus der Kalkulation erscheint je auf einer
Rechnung.

---

## Gegenüberstellung: heute gegen neu

`npm run preis:vergleich` stellt beide Wege für alle 43 Produkte nebeneinander.
Der Bericht **ändert nichts**, er liest nur.

Verglichen wird der Endpreis je Stück, den die Kundschaft zahlt – heute also
`basePrice` **plus** Veredelungsaufschläge samt Mengenstaffel, neu der
Vollpreis aus `kalkuliere()`.

Szenario: DTF, ein Brustmotiv 20 × 25 cm. Alle Beträge BRUTTO.

Die heutigen Preise sind dabei als brutto unterstellt – belegt ist das nicht,
siehe Abschnitt „Was der Shop heute rechnet".

| Menge | teurer | günstiger | Ø-Änderung |
|---|---|---|---|
| 1 Stück | 40 | 3 | **+10,08 €** |
| 15 Stück | 0 | 43 | **−8,40 €** |
| 50 Stück | 0 | 43 | **−7,74 €** |

### Der eigentliche Befund: der Mengenvorteil fehlt heute

| Produkt | 1 → 50 Stück heute | neu |
|---|---|---|
| B&C Inspire Hoodie | −8 % | −36 % |
| FOTL Heavy T | −12 % | −64 % |
| Just Hoods College Hoodie | −9 % | −39 % |
| FOTL Valueweight T | −14 % | −64 % |

Die heutigen Preise geben bei fünfzigfacher Menge kaum nach. Für den erklärten
Schwerpunkt – Firmenkunden ab 15 Stück – ist das der wunde Punkt, nicht die
Höhe der Einzelpreise.

Die neue Kalkulation dreht beides in die wirtschaftlich richtige Richtung:
Einzelstücke werden **teurer** (sie kosten uns wirklich mehr – ein Motiv trägt
den ganzen Bogen), Mengen werden **deutlich günstiger** (Bögen und Fixkosten
verteilen sich). Die Marge bleibt dabei durchgehend bei 25–33 %.

### Nivellierung bei Einzelstücken

Bei einem Stück landen viele T-Shirts auf 24,90–25,90 €, unabhängig davon, ob
das Textil 2,84 € oder 4,09 € kostet. Das ist kein Fehler: Bei einem Stück
dominieren die 14,59 € Transferkosten, der Textilunterschied von 1,25 € geht
in der Rundungsstufe unter. Ökonomisch richtig – ob es verkaufspsychologisch
gewollt ist, ist eine Geschäftsentscheidung.

---

## Achtung: Mengenrabatt darf nicht doppelt wirken

Das ist die wichtigste offene Frage bei einer Übernahme.

Der Mengenvorteil entsteht in beiden Wegen, aber auf verschiedene Art:

| Weg | Mechanismus |
|---|---|
| heute | explizite Staffeln `BASE_PRICE_DISCOUNT_TIERS` und `VEREDELUNG_DISCOUNT_TIERS` in `calculatePrice.ts` |
| neu | **rechnerisch**, aus der Bogenbelegung und der Verteilung der Fixkosten |

`kalkuliere()` kennt die Staffeln nicht und wendet sie nicht an – die Zahlen
oben sind also sauber getrennt. Würde man den kalkulierten Preis jedoch als
neuen `basePrice` einsetzen, **ohne** die Staffeln anzupassen, wirkte der
Mengenrabatt zweimal.

Die Staffeln bleiben erhalten – sie gehen durch die neue Kalkulation nicht
verloren. Zu entscheiden ist nur, welcher der beiden Wege den Mengenvorteil
künftig trägt.

### Was noch nicht verbunden ist

Das Modell **berechnet** Preise, es **setzt** sie nicht. Die `basePrice`-Werte
der Produkte stammen weiterhin aus `computeBasePrice()` und sind unverändert.
Die Verbindung beider Wege ist die nächste Entscheidung – sie ändert Preise
und ist deshalb keine technische, sondern eine geschäftliche.
