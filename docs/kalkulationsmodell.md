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

> **Korrektur vom 2026-11-12 (Kleinunternehmer, Betreiber-Entscheidung):** Der Betreiber ist Kleinunternehmer nach § 19 UStG
> (`IST_KLEINUNTERNEHMER`, config/company.ts) und **kann keine Vorsteuer abziehen**; der Satz oben („wir holen sie zurück“) gilt
> für ihn nicht. Die Einkaufspreise im Katalog sind die Nettopreise der Lieferanten-Shops. Der Betreiber wollte dafür
> **keine Mehrwertsteuer-Rechnung im Preis, sondern einfach „das Geld draufpacken“**: Der Textil-Aufschlag
> (`FLAT_MARKUP_EUR`, config/pricing/marginTiers.ts) steigt von 8 € auf 9 €, **pauschal +1 € je Produkt**. Dazu gelten zwei
> Vorgaben: Nichts darf günstiger werden als vorher, nichts soll viel teurer werden. Der fertige Stückpreis im Shop wird auf den
> nächsten ,99-Betrag gerundet (lib/pricing/ladenpreis.ts); ein Test (`grundpreis.test.ts`) prüft für alle Produkte und 21
> Mengen, dass der Stückpreis nie unter dem früheren liegt und höchstens 2 € darüber (Schnitt rund +1 €).
> **Zu wissen:** Der pauschale Euro deckt die Umsatzsteuer auf den Einkauf nur bei günstigen Textilien voll ab (19 % von
> 5 € Einkauf ≈ 1 €); bei teuren Teilen (z. B. Einkauf 38,75 €, Steuer ≈ 7,36 €) bleibt die echte Marge deutlich unter dem
> Aufschlag. Das ist die bewusste Entscheidung des Betreibers für „nicht viel teurer“. Die übrigen Kostenbausteine unten (DTF-Bögen,
> Lieferantenversand, Verpackung) sind separat zu prüfen, ob sie netto genannt wurden; die festen Positionspreise der Veredelung
> (9 € / 5 € / 4 € usw.) sind Entscheidungen des Betreibers und von dieser Korrektur unberührt.

> **Preisanhebung: erst 7–10 % (2026-11-12), am 2026-11-13 auf 3–5 % zurückgenommen** (Betreiber: „nur 3–5 % mehr statt 7–10, mit natürlichen
> psychologischen Preisen“):
> - **Textil-Grundpreis:** Der Vorgängerpreis (Einkauf + 9 €, aufgerundet auf ,99) wird in ein Fenster von **3–5 %** angehoben und landet auf
>   einem ,99-Betrag (`anhebenInsFenster` und `computeBasePrice`, config/pricing/marginTiers.ts). Liegt ein ,99-Betrag im Fenster, gewinnt der
>   nächste zur Mitte; sonst der mit dem kleinsten Abstand zum Fenster – immer über dem Vorgängerpreis. Beispiele: 12,99 → 13,99 · 19,99 → 20,99 ·
>   25,99 → 26,99 · 29,99 → 30,99 · 39,99 → 41,99 · 48,99 → 50,99.
> - **Druckpositionen:** `DTF_POSITION_TIERS` (lib/pricing/calculatePrice.ts) steht wieder auf dem Stand vom 2026-08-09 (9,00/5,00/4,00 € …); die
>   Anhebung um rund 9 % ist zurückgenommen. Die Stufen bleiben streng fallend.
> - **Unverändert:** Mengenrabatt auf den Grundpreis (`QUANTITY_TIERS`), Stichaufpreis der Stickerei (1,20 €/1.000 Stiche), Versandkosten (6,90 €)
>   und Freigrenze (75 €), die ,99-Rundung des Stückpreises (lib/pricing/ladenpreis.ts).
> - **Messung** gegen den Stand vor der 7–10-%-Anhebung (10.836 Preise: 172 Produkte × 21 Mengen × 1–3 Ansichten, DTF): Schnitt **+3,4 %**,
>   **87 %** der Preise liegen 2–6 % darüber, **kein** Preis ist billiger geworden, höchstens +8,3 %. Auf der ,99-Leiter liegen Preise 1 € auseinander:
>   beim Textil-Grundpreis um 13 € sind das 7,7 % (Grundpreise im Schnitt +5,3 %), bei einem Stückpreis um 25 € rund 4 %, bei 40 € 2,5 %. 3–5 %
>   lassen sich deshalb nicht für jeden Einzelpreis treffen; rund 10 % der Preise (bei 1–9 Stück keiner, ab 100 Stück 18–32 %: die Rundung auf den nächsten ,99-Betrag
>   fängt den Euro ab) bleiben gleich. Der Test `grundpreis.test.ts` hält Schnitt (3–5 %), Anteil nahe am Fenster (mindestens 75 % zwischen 2 und
>   6 %) und „nie billiger“ fest.
> - **Stickerei** (derzeit pausiert) trägt den höheren Grundpreis automatisch mit.

> **Staffelgrenzen und Mengen-Tipp (2026-11-12):** Die Staffeln gelten als Stufenfunktion für die GESAMTE Bestellung. An jeder Grenze kostet
> deshalb eine etwas größere Menge insgesamt WENIGER als die kleinere (gemessen mit den Preisen vom 2026-11-12: 49 → 50 Stück −79 € bis −171 €,
> 99 → 100 Stück −181 € bis −464 €, 249 → 250 Stück −217 € bis −471 €, 499 → 500 Stück −473 € bis −1.470 €, 999 → 1000 Stück −983 € bis −3.969 €;
> bei 24 → 25 Stück nur das T-Shirt mit einer Position, −3 €). Das ist gewollt, aber ohne Hinweis ein Rätsel. Der Konfigurator zeigt jetzt den
> **Mengen-Tipp** („Mit 50 statt 49 Stück zahlen Sie insgesamt 79,01 € weniger – und erhalten 1 Stück mehr.“, `lib/pricing/mengenTipp.ts`; er
> sucht bis zu 25 % über die gewählte Menge, mindestens 10 Stück, und nennt die kleinste Menge mit mindestens 1 € Ersparnis). Der Preis selbst
> ändert sich dadurch nicht, die Bestellung rechnet mit der gewählten Menge. Eine Preis-Deckelung (49 Stück zum Preis von 50) bleibt bewusst
> aus: Sie bräuchte eine eigene Rechnungszeile und krumme Stückpreise.
> **Überholt seit 2026-11-26:** Der Betreiber fand den Widerspruch „weniger Stück sind teurer als mehr Stück“ unsinnig und wollte ihn beseitigt haben.
> Seit dem Abschnitt „Mengenstaffel vom 2026-11-26“ (ganz unten) kostet eine größere Menge nie weniger als eine kleinere: Der Gesamtpreis wird kurz
> vor jeder Grenze auf den Preis der Grenzmenge gedeckelt (eigene Zeile „Mengenpreis wie bei N Stück“, Zwischenpreise ohne ,99 in der kurzen Zone);
> der Mengen-Tipp sagt jetzt „genauso viel für mehr Stück“. Die Aussagen dieses Absatzes über günstigere Grenzmengen gelten nicht mehr.
>
> **Warenkorb-Preise (2026-11-12):** Der Warenkorb speichert Preise zum Zeitpunkt des Hineinlegens; nach einer Preisänderung zeigte er alte Preise,
> während der Server (autoritativ) die neuen berechnet. Nach dem Laden rechnet `lib/cart/preiseAktualisieren.ts` jede Position mit `calculatePrice`
> und den aktuellen Preisen neu (Hinweis im Warenkorb, wenn sich etwas geändert hat). Ein bereits geöffneter Tab mit altem Programmstand bleibt
> bis zum Neuladen auf dem alten Preis – der Server rechnet aber immer neu.

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

---

## Preisanpassung vom 2026-11-18: Gewinn bei jeder Bestellung (Einkauf bei L-Shop, Einrichtung für Kleinaufträge)

**Vorgabe des Betreibers:** Jede Bestellung muss Gewinn bringen, auch wenn es nur 2 bis 3 € sind. Bestellungen zu bündeln ist nicht möglich, weil zu wenige Aufträge eingehen (der Betreiber wartet schon 1 bis 2 Tage mit der Bestellung).

**Einkauf:** Ein Abgleich im L-Shop-Konto (nur gelesen, 168 von 182 Produkten gelistet) zeigte: L-Shop ist bei 156 Produkten günstiger als textil-grosshandel.eu, im Median um 17,6 % (James+Nicholson −27 %, Fruit of the Loom −20 %, Gildan −5 %). Die Katalogpreise beruhen auf textil-grosshandel.eu. Der Betreiber bestellt je Menge beim günstigeren Lieferanten.

**Kostenannahmen** (ein DTF-Brustmotiv 20 × 25 cm, Kleinunternehmer ohne Vorsteuerabzug): Einkauf plus 19 %; Lieferantenversand je Bestellung bei textil-grosshandel.eu 4,90 € (frei ab 150 € Textilwert), bei L-Shop 9,76 € (8,20 € netto je Karton; ab 200 € netto 6,20 €, ab 350 € 4,20 €, ab 500 € frei) plus Mengenstaffel bei L-Shop; DTF-Bogen 6,29 / 9,69 / 13,99 / 18,99 € inklusive Umsatzsteuer; DTF-Versand 7,90 € (frei ab 75 € Bogenwert); Verpackung 0,50 €; DHL 5,50 €; Zahlungsgebühr 2,5 % plus 0,35 €; Ausschuss 2 %; Erlös inklusive 6,90 € Kundenversand (frei ab 75 €). Je Produkt und Menge gilt der Lieferant mit den niedrigeren Gesamtkosten für Textil plus Versand.

**Befund:** Ohne Maßnahme verliert jede Einzelbestellung Geld (Median −4,67 €, −1,10 bis −11,03 €), denn die Fixkosten je Bestellung (Lieferanten- und DTF-Versand, DTF-Bogen, DHL, Verpackung) betragen rund 21 € nach Abzug des Kundenversands. Ab 5 Stück erreichen mit dem günstigeren Lieferanten 163 von 182 Produkten das Gewinnziel von 25 % Marge.

**Maßnahme 1 – Einrichtung für Kleinaufträge** (`config/pricingRules.ts`, Regel `dtf-kleinauftrag`): einmalig 10 € je Warenkorbposition bis 2 Stück, ab 3 Stück entfällt sie. Sie nutzt den vorhandenen Regeltyp `setup_fee` (Rechenkern unverändert) und erscheint als „Einrichtung (einmalig)“ im Konfigurator, im Warenkorb und auf der Rechnung. Das passt zur FAQ („einmalige Einrichtungskosten … verteilen sich auf die Stückzahl“). Nur DTF; Stickerei-Regeln bleiben unberührt (Stickerei ist pausiert).

**Maßnahme 2 – Grundpreise** (`config/pricing/preiskorrektur.ts`, angewendet in `config/products/index.ts`): Bei 104 Produkten wird der Grundpreis in vollen Euro angepasst, 80 günstiger (1 bis 3 €, vor allem T-Shirts, Longsleeves, Kinder, Sport, wo die Marge hoch genug ist) und 24 teurer (vor allem teure Hoodies, Zip-Hoodies und Jacken, bei denen auch mit der Einrichtung noch eine Menge unter 3 € Gewinn bliebe). Regel: Bei den geprüften Mengen 1, 2, 3, 4, 5, 10, 25, 50 und 100 Stück bleibt der Gewinn je Bestellung mindestens 3 €. Senkungen gibt es nur, wenn zusätzlich die Marge bei 3 Stück mindestens 25 % und bei 5 Stück mindestens 30 % beträgt. Die übrigen 78 Produkte bleiben beim Preis der Formel.

**Ergebnis der Gegenprobe am echten Katalog** (alle 182 Produkte, 12 Mengen von 1 bis 100 Stück, mit den hinterlegten Einkaufspreisen): kein Fall unter 3 € Gewinn, kleinster Gewinn 3,04 €. Median-Gewinn eines Auftrags: 1 Stück 3,96 €, 2 Stück 15,84 €, 3 Stück 19,14 €, 10 Stück 107,12 €.

**Wirkung für die Kundschaft:** Ein Einzelstück kostet 10 € mehr (Einrichtung), bei 2 Stück 5 € mehr je Stück; ab 3 Stück ändern sich nur die Grundpreise (T-Shirts günstiger, einzelne teure Hoodies und Jacken teurer). Die Einrichtung fällt je Warenkorbposition an, also auch zweimal bei zwei verschiedenen Einzelstücken im selben Warenkorb.

**Grenzen:** Die L-Shop-Preise stammen aus drei Farben je Produkt (günstigste gelesene Farbe, Größe M); bei den textil-grosshandel-Katalogpreisen handelt es sich teils um Ab-Preise. Ist der echte Einkauf 5 % höher, liegen 57 der Fälle knapp unter 3 €. Berichtigung vom selben Tag: Die ID Microfleece Jacke bei 100 Stück verdient schon beim planmäßigen Einkauf nur 95,51 € (rund 2 % Marge) und rutscht bei +5 % Einkauf ins Minus (−101,51 €), weil dort der Mengenrabatt von 20 % (9,60 € je Stück) den Aufschlag von 9 € fast aufzehrt und kein L-Shop-Preis hinterlegt ist. Das gilt unverändert seit dem Stand 3c15cb22 und betrifft nur diese Größenordnung (100 Stück eines teuren Modells); es wurde nicht verändert. Bei L-Shop gilt der Versand je Karton; mehrere Kartons bei großen Mengen sind nicht eingerechnet. Nicht verändert: Mengenrabatt (`QUANTITY_TIERS`), DTF-Positionspreise, Stickerei-Kalkulation (Positionsstaffel plus 1,20 € je 1.000 Stiche), Versandtarif, Rechnungs- und Bestelllogik.

**Rückgängig machen:** Regel `dtf-kleinauftrag` auf `isActive: false` setzen und/oder Einträge in `GRUNDPREIS_ANPASSUNG_EUR` streichen. Die Herleitung (Skripte und Daten) liegt außerhalb des Repos in `E:\Embroidery Republic\preispruefung-2026-11-18\`.

## Mengenstaffel vom 2026-11-18: auf jeder Stufe sichtbar günstiger, Gewinn steigt mit der Menge

**Vorgabe des Betreibers:** Nicht nur 3 € je Bestellung verdienen. Mit mehr Artikeln soll die Marge etwas steigen, und die Kundschaft soll sehen, dass es mit jedem zusätzlichen Artikel günstiger wird.

**Befund (Katalogmedian, 1 DTF-Position 20 × 25 cm):** Der Gewinn je Stück steigt mit der Menge von selbst (1 Stück 3,96 €, 5 Stück rund 9 €, 20 Stück rund 12,60 €), denn Lieferanten- und DTF-Versand, DHL und Verpackung teilen sich auf. Der Stückpreis blieb aber zwischen 3 und 9 Stück bei 27,99 €, zwischen 10 und 24 Stück bei 26,99 €: Wer fünf statt drei bestellte, sah keinen Vorteil, obwohl unsere Kosten je Stück dort von rund 21,60 € auf 14,60 € fallen. Die Ersparnis ging vollständig an uns.

**Maßnahme** (`lib/pricing/calculatePrice.ts`, Tabelle `DTF_GRUNDPREIS_STAFFEL`): eigener Grundpreis-Rabatt nur für DTF, je Stufe der größere Wert aus Prozent und Mindest-Euro je Stück. Ab 5 Stück 1,00 €, ab 10 Stück 1,50 €, ab 20 Stück 3,00 €, ab 50 Stück 8 % (mindestens 3,00 €), ab 100 Stück 20 % (mindestens 4,00 €), darüber wie bisher 23/26/36 %. Feste Euro-Beträge statt reiner Prozente, weil unsere Ersparnis in Euro anfällt und weil ein Prozentrabatt bei einem 12-€-Shirt (4 % = 0,48 €) in der ,99-Rundung verschwindet: Mit Prozent sank der Stückpreis bei 5 Stück nur bei 150 von 182 Modellen, bei 20 Stück nur bei 121.

**Garantie, im Test fixiert** (`lib/pricing/__tests__/dtfStaffel.test.ts`): Bei 3, 5, 10, 20, 50 und 100 Stück sinkt der Stückpreis für jedes der 182 Modelle um mindestens 1 €, und er steigt mit der Menge nirgends (Mengen 1 bis 150).

| Menge | Stückpreis vorher | Stückpreis jetzt | Gewinn je Stück vorher → jetzt | Marge vorher → jetzt | Gewinn je Bestellung (Median) vorher → jetzt |
|---|---|---|---|---|---|
| 1 | 38,99 € | 38,99 € | 3,96 € | 9 % | 3,96 € |
| 2 | 33,99 € | 33,99 € | 7,92 € | 24 % | 15,84 € |
| 3–4 | 27,99 € | 27,99 € | 6,38 € / 8,06 € | 23 % / 32 % | 19,14 € / 32,24 € |
| 5 | 27,99 € | 26,99 € | 8,83 → 7,86 € | 35 → 32 % | 44,15 → 39,28 € |
| 10 | 26,99 € | 25,99 € | 10,71 → 9,77 € | 44 → 41 % | 107,12 → 97,72 € |
| 20 | 26,99 € | 24,99 € | 12,61 → 10,74 € | 51 → 47 % | 252,11 → 214,83 € |
| 50 | 23,99 € | 22,99 € | 12,24 → 11,04 € | 52 → 49 % | 611,85 → 551,92 € |
| 100 | 21,99 € | 21,99 € | 10,06 → 9,83 € | 50 → 50 % | 1.006,23 → 982,93 € |

Preise: Warenwert je Stück ohne Versand, Modell um 28 € bei 3 Stück. Gerechnet mit Einkaufspreisen und Versandkosten beider Lieferanten wie oben. Die Marge steigt mit der Menge von 9 % (1 Stück) über 24 % (2) und 32 % (4) auf 47 bis 50 % ab 20 Stück. Kleinster Gewinn je Bestellung über alle 182 Modelle und Mengen 1 bis 120: weiterhin 3,04 € (Einzelstück); bei 5 Stück mindestens 30,39 €.

**Kosten für uns:** Zwischen 5 und 50 Stück rund 1 € weniger Gewinn je Stück (etwa 10 % des Gewinns), dafür sinkt der Preis für die Kundschaft an jeder Stufe. Wo die Menge zu einer Stufe knapp fehlt, zeigt der Konfigurator jetzt „Noch 2 Stück – dann nur noch 26,99 € pro Stück (jetzt 27,99 €).“ (`findeNaechsteStufe` in `lib/pricing/mengenTipp.ts`; Text vor dem Livegang vom Betreiber freizugeben).

**Stickerei unverändert:** Die Stickerei-Preise sind in 60 Vergleichsfällen bitgenau gleich geblieben (Test `Stickerei: Preise unverändert`). Folge: „Stickerei = DTF plus Stichaufpreis“ gilt weiterhin exakt bei 1 bis 4 Stück; ab 5 Stück ist DTF um den Grundpreis-Unterschied günstiger (bis rund 2 € je Stück, bei 20 Stück). Wenn die Stickerei wieder freigegeben wird, ist zu entscheiden, ob sie dieselbe Grundpreis-Staffel bekommt (dann ändern sich ihre Gesamtpreise).

**Grenzen:** Die Tabelle ab 100 Stück ist nur dort verändert, wo günstige Modelle sonst keine sichtbare Stufe hätten (Mindest-Euro 4,00 €). Bei sehr großen Mengen teurer Modelle bleibt die Marge dünn (siehe Berichtigung oben, ID Microfleece Jacke).

**Rückgängig machen:** In `calculatePrice()` den Aufruf von `getDtfGrundpreisStufe` entfernen, dann gilt für DTF wieder `QUANTITY_TIERS`. Die Herleitung (Skripte `staffel2.mts` und weitere) liegt außerhalb des Repos im Arbeitsverzeichnis der Sitzung.

## Mengenstaffel vom 2026-11-26: Gesamtpreis nie rückwärts (Mengenpreis-Deckel) und etwas weniger Mengenrabatt

**Vorgabe des Betreibers:** „Staffelpreise sollen Sinn ergeben. Der Mengenrabatt sollte etwas weniger sein, sodass das Produkt am Ende leicht teurer ist, ca. 5 %.“ Auslöser: Beim Fruit of the Loom Heavy-T kosteten 19 Stück zusammen 360,81 €, 20 Stück nur 359,80 € – weniger Stück waren teurer als mehr Stück. **Stand: Code und Zahlen liegen vor, der Betreiber muss die Preise noch freigeben, bevor sie live gehen.**

### Teil 1: Gesamtpreis steigt mit der Menge nie rückwärts

**Befund (Stand vor der Änderung, alle 182 Modelle × 1–3 Positionen × Mengen 1–1500):** Der Gesamtpreis sank in 2.556 Fällen mit mehr Stück: an der Grenze 20 Stück bei 63, an 50 Stück bei 546, an 100 bei 546, an 250 bei 386, an 500 bei 477 und an 1000 Stück bei 538 Fällen (546 = jedes Modell mit 1, 2 und 3 Positionen). Beispiel Katalogmedian (Russell Men's Pure Organic Heavy Tee, 1 Position): 49 Stück 1.224,51 €, 50 Stück 1.149,50 €. Der Stückpreis stieg nirgends mit der Menge.

**Mathematik, am echten Rechenkern geprüft:** Jede Stufe gilt für die ganze Bestellung. Springt der Stückpreis an der Grenze g von u auf u − s, kostet g Stück genau dann nicht weniger als g − 1 Stück, wenn g · (u − s) ≥ (g − 1) · u, also s ≤ (u − s)/(g − 1). Auf der ,99-Leiter ist der kleinste Sprung s = 1 €. Dann muss u ≥ g sein: Bei Stückpreisen um 20–40 € hält die Gesamtsumme nur bis etwa 20–40 Stück. Ab 50 Stück gäbe es mit festen ,99-Preisen und steigenden Gesamtpreisen **gar keinen Mengenrabatt mehr** (der Stückpreis dürfte sich nie ändern); jeder Rabattschritt dort verlangt Zwischenpreise, die nicht auf ,99 enden. Strikt steigende Gesamtpreise, größere Staffelsprünge bei hohen Mengen und die ,99-Rundung des Stückpreises schließen sich also aus. Eine der drei Vorgaben muss für eine kurze Zone nachgeben.

**Entscheidung: Mengenpreis-Deckel** (`calculatePrice()`, Funktion `staffelgrenzen`): Der Gesamtpreis für q Stück ist der **kleinste Staffelpreis aller Mengen von q bis zur letzten Grenze**, also höchstens der Preis der nächsten Grenzmenge. Wer 47 bis 49 Stück bestellt, zahlt so viel wie für 50 Stück (Russell-Beispiel: 47 bis 49 Stück 1.199,50 €, 50 Stück 1.199,50 €, 51 Stück 1.223,49 €). Gilt nur für DTF; die Stickerei rechnet unverändert.
- **Gesamtpreis sinkt nie, Stückpreis steigt nie:** geprüft für alle Modelle, Mengen 1–1500, 1–3 Positionen, mit und ohne Großformat (`staffelMonoton.test.ts`, gut 1,6 Mio. Preise); davor sank er in 2.556 Fällen, danach in 0.
- **Die Grenzmengen selbst bleiben unberührt:** Bei 3, 5, 10, 20, 50, 100, 250, 500 und 1000 Stück gilt weiter der reguläre Stufenpreis auf ,99 (für jedes Modell geprüft). Die runden Bestellmengen, die am häufigsten vorkommen, kosten also genau, was die Staffel verspricht.
- **Nur kurz vor einer Grenze weicht der Stückpreis ab:** Dort ist er Gesamtpreis ÷ Menge und endet nicht auf ,99 (z. B. 49 Stück à 24,48 €). Länge der Zone je Grenze (1 Position, Ø / längste über alle Modelle): 20 Stück 0,3 / 1 · 50 Stück 3,7 / 6 · 100 Stück 6,8 / 13 · 250 Stück 13,3 / 21 · 500 Stück 14,2 / 37 · 1000 Stück 117 / 150. Die Länge folgt aus der Höhe des Sprungs: Ein Euro bei einem Stückpreis von 22 € verlangt rund 4,5 % der Grenzmenge. Die Zone vor 1000 Stück ist lang, weil der alte Rabatt dort steil ist (36 % auf den Grundpreis); Bestellungen von 880 bis 999 Stück sind sehr selten.
- **Anzeige und Rechnung:** In den Preisdetails erscheint die Zeile „Mengenpreis wie bei N Stück“ (negativ, `breakdown.mengenDeckelPerUnit`), sodass die Zeilen weiter genau den Stückpreis ergeben (`preisdetails.test.ts`). Im Warenkorb und auf der Rechnung ist es ein eigener Posten in der Kategorie „Rabatt“ (`positionStage.ts`), nichts landet unter „Rundung“. Der Server (`priceCart`) rechnet mit demselben Kern; die Preisbeispiele der Seiten laufen über `priceCart` und stimmen deshalb automatisch.
- **Mengen-Tipp neu:** Statt „mit 50 statt 49 Stück zahlst du weniger“ (das gibt es nicht mehr) sagt der Konfigurator in der Zone: „Tipp: Mit 50 statt 48 Stück zahlst du genauso viel (1.199,50 €) – und erhältst 2 Stück mehr.“ (`lib/pricing/mengenTipp.ts`). „Noch N Stück – dann nur noch X pro Stück“ sucht weiter die nächste reguläre Stufe. **Alle drei neuen Kundentexte (Zeile samt Erklärung, Tipp, Posten) vor dem Livegang vom Betreiber freizugeben.**

**Verworfene Alternativen:**
- *Untergrenze hinter der Grenze* (50 Stück kosten so viel wie 49, danach greift der Stufenpreis): Die Zone ist gleich lang, trifft aber genau die runden Bestellmengen. Auf der Grenzmenge läge der Stückpreis im Schnitt 6,8 % (bis 13,9 %) über dem versprochenen Stufenpreis (bei 100 Stück z. B. 23,75 € statt 22,99 €), bei 1000 Stück 13 %; „ab 100 Stück 22,99 €“ wäre bei 100 Stück falsch, und die Preisbeispiele mit 50 und 100 Stück verlören ihre ,99-Preise. Dafür sänke der Gewinn nie unter den alten Stand. Der Deckel senkt den Preis in der Zone dagegen (siehe Gewinnprüfung unten).
- *Sprünge so klein legen, dass die Bedingung ohne Zone gilt*: Bei 50 Stück und 23 € wären höchstens 0,47 € Sprung erlaubt, bei 1000 Stück 0,02 €. Das verlangt krumme Preise auf jeder Stufe und widerspricht der ,99-Festlegung des Betreibers.
- *Gleitende Staffel* (nur die Stücke ab der Grenze günstiger): Gesamtpreis steigt immer, aber kein Stückpreis endet mehr auf ,99.

### Teil 2: etwas weniger Mengenrabatt (ca. 5 % teurer)

**Maßnahme** (`DTF_POSITION_TIERS`, Spalte `erste`): Die erste Druckposition kostet ab 3 Stück auf jeder Stufe **genau 1,00 € mehr**: 9 / 9 / 8,50 / 7 / 6,50 / 6 / 5,50 / 5 € statt 9 / 8 / 7,50 / 6 / 5,50 / 5 / 4,50 / 4 € (Stufen 1, 3, 10, 50, 100, 250, 500, 1000). 1 und 2 Stück, die Einrichtung (10 €), zweite und weitere Position, `DTF_GRUNDPREIS_STAFFEL` und die Textil-Grundpreise sind unverändert.

**Warum ein fester Euro statt eines Prozentfaktors:** Auf der ,99-Leiter ist 1 € der kleinste mögliche Schritt (bei 22 € rund 4,5 %), kleinere Änderungen verschwinden in der Rundung. Ein fester Euro je Stufe lässt alle Abstände zwischen den Stufen unverändert, jede Stufe bis 100 Stück bleibt für jedes Modell mindestens 1 € günstiger als die davor (`dtfStaffel.test.ts`), und die Zonenlängen des Deckels bleiben wie zuvor. Ein gemeinsamer Faktor auf den Rabatt (getestet mit 0,8) hätte die Stufen 5, 10 und 20 unverändert gelassen (ihr Abstand von 1 € lässt sich nicht verkleinern, sonst fielen zwei Stufen auf einen Preis) und die Stufe 1000 um 14 % verteuert; das Mittel von 5,7 % käme so nur durch wenige große Sprünge in den oberen Stufen zustande.

**Messung** (alle 182 Modelle, Stückpreis der Stufenmenge, vorher → nachher; ein Motiv 20 × 25 cm):

| Stufe | Ø Änderung | Median | kleinste | größte |
|---:|---:|---:|---:|---:|
| 3 | +3,8 % | +3,7 % | +1,4 % | +5,6 % |
| 5 | +3,9 % | +3,8 % | +1,4 % | +5,9 % |
| 10 | +4,1 % | +4,0 % | +1,4 % | +6,3 % |
| 20 | +4,3 % | +4,2 % | +1,5 % | +6,7 % |
| 50 | +4,7 % | +4,5 % | +1,6 % | +7,7 % |
| 100 | +5,1 % | +4,8 % | +1,8 % | +8,3 % |
| 250 | +5,4 % | +5,0 % | +1,9 % | +9,1 % |
| 500 | +5,5 % | +5,3 % | +2,0 % | +9,1 % |
| 1000 | +6,3 % | +6,3 % | +2,3 % | +10,0 % |

**Mittel über die Stufen ab 5 Stück: +4,9 %** (ein Motiv), +4,3 % bei zwei und +3,9 % bei drei Motiven, weil dort der Gesamtpreis höher liegt und der Euro weniger zählt. Absolut ist es immer genau +1,00 € je Stück (Test `staffelMonoton.test.ts` rechnet den alten Stand unabhängig nach). Günstige Modelle (Grundpreis um 12 €) werden um 5 bis 8 % teurer, die teuersten um 1,4 bis 2,3 %.

| Menge | FOTL Valueweight T (11,99 €) vorher → nachher, Stück | Gesamt | Russell Heavy Tee (19,99 €, Katalogmedian) Stück | Gesamt | Just Hoods College Hoodie (25,99 €) Stück | Gesamt |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 30,99 → 30,99 | 30,99 | 38,99 → 38,99 | 38,99 | 44,99 → 44,99 | 44,99 |
| 2 | 25,99 → 25,99 | 51,98 | 33,99 → 33,99 | 67,98 | 39,99 → 39,99 | 79,98 |
| 3 | 19,99 → 20,99 | 59,97 → 62,97 | 27,99 → 28,99 | 83,97 → 86,97 | 33,99 → 34,99 | 101,97 → 104,97 |
| 5 | 18,99 → 19,99 | 94,95 → 99,95 | 26,99 → 27,99 | 134,95 → 139,95 | 32,99 → 33,99 | 164,95 → 169,95 |
| 10 | 17,99 → 18,99 | 179,90 → 189,90 | 25,99 → 26,99 | 259,90 → 269,90 | 31,99 → 32,99 | 319,90 → 329,90 |
| 20 | 16,99 → 17,99 | 339,80 → 359,80 | 24,99 → 25,99 | 499,80 → 519,80 | 30,99 → 31,99 | 619,80 → 639,80 |
| 25 | 16,99 → 17,99 | 424,75 → 449,75 | 24,99 → 25,99 | 624,75 → 649,75 | 30,99 → 31,99 | 774,75 → 799,75 |
| 50 | 14,99 → 15,99 | 749,50 → 799,50 | 22,99 → 23,99 | 1.149,50 → 1.199,50 | 28,99 → 29,99 | 1.449,50 → 1.499,50 |
| 100 | 13,99 → 14,99 | 1.399 → 1.499 | 21,99 → 22,99 | 2.199 → 2.299 | 25,99 → 26,99 | 2.599 → 2.699 |
| 250 | 12,99 → 13,99 | 3.247,50 → 3.497,50 | 19,99 → 20,99 | 4.997,50 → 5.247,50 | 24,99 → 25,99 | 6.247,50 → 6.497,50 |
| 500 | 12,99 → 13,99 | 6.495 → 6.995 | 18,99 → 19,99 | 9.495 → 9.995 | 23,99 → 24,99 | 11.995 → 12.495 |
| 1000 | 11,99 → 12,99 | 11.990 → 12.990 | 16,99 → 17,99 | 16.990 → 17.990 | 20,99 → 21,99 | 20.990 → 21.990 |

(Die Gesamtpreise gelten an den Stufenmengen selbst; in der Zone davor gilt der Deckel, z. B. Russell 49 Stück: vorher 1.224,51 €, nachher 1.199,50 €. Warenwert ohne Versand.) Das Heavy-T-Beispiel des Betreibers: 19 Stück 360,81 € und 20 Stück 359,80 € werden zu 379,80 € und 379,80 € (19 Stück kosten wie 20).

### Gewinn- und Margenprüfung (Kostenmodell vom 2026-11-18, ein Motiv 20 × 25 cm, günstigerer Lieferant je Menge)

| Menge | Gewinn je Bestellung, Median vorher → nachher | kleinster Gewinn | Marge, Median | Modelle mit sinkendem Gewinn |
|---:|---:|---:|---:|---:|
| 1 | 3,96 → 3,96 € | 3,04 → 3,04 € | 9,3 → 9,3 % | 0 von 182 |
| 2 | 15,84 → 15,84 € | 7,90 → 7,90 € | 24,2 → 24,2 % | 0 |
| 3 | 19,14 → 21,76 € | 11,51 → 14,43 € | 22,7 → 24,1 % | 7 (Versandgrenze, s. u.) |
| 5 | 39,28 → 44,15 € | 30,39 → 35,27 € | 32,3 → 35,0 % | 0 |
| 10 | 97,72 → 107,47 € | 75,45 → 85,20 € | 41,3 → 43,7 % | 0 |
| 20 | 214,83 → 234,33 € | 164,98 → 184,48 € | 47,2 → 49,2 % | 0 |
| 50 | 551,92 → 600,67 € | 329,94 → 378,69 € | 49,4 → 51,4 % | 0 |
| 100 | 982,93 → 1.080,43 € | 95,51 → 193,01 € | 49,6 → 51,8 % | 0 |

- **Auf allen Stufenmengen steigt der Gewinn je Bestellung** um 1 € je Stück (Median bei 100 Stück +97,50 €). Der Doku-Mindestwert (mindestens 3 € bei 1, 2, 3, 4, 5, 10, 25, 50 und 100 Stück) bleibt für alle 182 Modelle erfüllt (kleinster Wert 3,04 € bei einem Stück, unverändert). Die Marge-Bedingungen der Preiskorrektur (mindestens 25 % bei 3 Stück, 30 % bei 5 Stück) erfüllen jetzt 84 statt 81 (bei 3) bzw. 134 statt 129 Modelle (bei 5).
- **Ausnahme Versandgrenze:** Bei 3 Stück sinkt der Gewinn bei 7 Modellen (4 Stück bei einem) um 3,80 € (bei 4 Stück 2,83 €), z. B. James & Nicholson Round-T-Heavy 21,90 → 18,10 €. Der Warenwert springt dort von 74,97 € auf 77,97 € und überschreitet die Freigrenze von 75 €: Das Paket wird versandkostenfrei (−6,90 €), die Bestellung ist 3 € teurer, die Kundschaft zahlt insgesamt 3,90 € weniger. Das ist eine Eigenschaft der Freigrenze, kein Fehler der Staffel; die Bestellungen bleiben mit 17 bis 31 € Gewinn im Plus.
- **Ausnahme Deckelzonen:** Bei 13.794 von 273.000 Fällen (182 Modelle × Mengen 1–1500, 1 Position; 5,1 %) liegt der Gewinn unter dem alten Wert, und zwar ausschließlich in den Zonen vor 50/100/250/500/1000 Stück. Dort war der alte Preis der Widersinn, den der Deckel beseitigt (49 Stück kosteten bis zu 80 € mehr als 50). Fälle und Rückgang je Grenze: vor 50 Stück 288 (Ø 19 €, größter 80 €), vor 100 Stück 473 (Ø 110 €, 620 €), vor 250 Stück 331 (Ø 114 €, 222 €), vor 500 Stück 350 (Ø 249 €, 922 €), vor 1000 Stück 12.352 (Ø 950 €, 5.800 €). Bis 250 Stück bleibt jede dieser Bestellungen bei mindestens 3 € Gewinn; darüber sind es 11 von 350 Fällen vor 500 Stück und 588 von 12.352 vor 1000 Stück darunter (alles Modelle, die schon bei der Grenzmenge selbst wenig oder nichts verdienen, siehe nächster Punkt).
- **Schon vorher vorhandene Verluste bei sehr großen Mengen** (nicht Teil dieser Änderung, hier nur ausgewiesen): Mit dem Kostenmodell macht bei 250 Stück 1 Modell Verlust (neu 0), bei 500 Stück 3 (neu 1: ID Microfleece Jacke), bei 1000 Stück 7 Modelle (neu weiter 7, aber um rund 975 € je Bestellung kleinerer Verlust): die Earth-Positive-Hoodies (5 Modelle), der Build-Your-Brand Ultra Heavy Cotton Box Hoody und die ID Microfleece Jacke. Ihr Grundpreis-Rabatt von 36 % bei 1000 Stück übersteigt den Aufschlag von rund 9 € weit. Der Deckel dehnt diesen Verlustbereich auf die Zone vor 1000 Stück aus: 299 Fälle (887 bis 999 Stück) bei 4 dieser Modelle (Build-Your-Brand Ultra Heavy Cotton Box Hoody und drei Earth-Positive-Hoodies) rutschen neu ins Minus, bei allen anderen Modellen und Mengen entsteht kein neuer Verlust. Empfehlung: den Prozentrabatt ab 500 Stück für teure Modelle senken (Betreiberentscheidung, hier nicht umgesetzt).

### Prüfung und Rückgängig machen

- **Wächter** (`src/lib/pricing/__tests__/staffelMonoton.test.ts`): Gesamtpreis nie fallend und Stückpreis nie steigend (alle Modelle, 1–1500 Stück, 1–3 Positionen, mit/ohne Großformat); der Deckel wirkt nur vor einer Staffelgrenze und hält den Preis flach; die Grenzmengen behalten ,99; genau +1,00 € ab 3 Stück gegen den unabhängig nachgerechneten alten Stand; Server (`priceCart`) und Posten stimmen mit dem Rechenkern überein, der Deckel ist ein eigener Posten; Stickerei ohne Deckel. Die 60 eingefrorenen Stickerei-Vergleichspreise (`dtfStaffel.test.ts`) sind unverändert grün.
- **Stickerei:** bekommt eine eigene, eingefrorene Positionstabelle (`STICKEREI_POSITION_TIERS`, Stand 2026-08-09); vorher teilten sich DTF und Stickerei die Tabelle. „Stickerei = DTF plus Stichaufpreis“ gilt deshalb nur noch bis auf den Unterschied der ersten Position (DTF ab 3 Stück 1 € teurer). Ob die Stickerei beim Wiederöffnen dieselbe Staffel bekommt, ist offen.
- **Rückgängig machen, Teil 2:** Spalte `erste` in `DTF_POSITION_TIERS` zurück auf 9 / 8 / 7,5 / 6 / 5,5 / 5 / 4,5 / 4. **Teil 1:** In `calculatePrice()` den Deckel-Zweig (alles nach `if (input.mengenDeckel === false || roh.hasErrors) return roh;`) entfernen.
- **Nicht geprüft:** Kundentexte (Freigabe offen); Preise zwei und drei Positionen im Kostenmodell (Gewinn nur für ein Motiv gerechnet); Mehrfach-Kartons bei L-Shop für große Mengen.
