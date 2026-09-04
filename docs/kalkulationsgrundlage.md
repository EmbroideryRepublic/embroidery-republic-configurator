# Kalkulationsgrundlage

> **Stand 2026-07-21.** Sammelt die bekannten Kostenbausteine für die
> spätere Verkaufspreisbildung. **Noch keine Verkaufspreise** – die
> entstehen erst, wenn die Einkaufspreise erhoben sind.

---

## 1. Einkaufspreise Textil – drei Qualitätsstufen

Gepflegt in `src/config/pricing/einkaufspreise.ts`, geprüft mit
`npm run ek:pruefen`.

| Stufe | Bedeutung | Kalkulationsfähig |
|---|---|---|
| **verifiziert** | unmittelbar aus Lieferantenkonto oder aktueller Preisliste | ja |
| **bekannt** | aus der Praxis bekannt oder bereits so bezahlt, Aktualität noch ungeprüft | ja, mit Vorbehalt |
| **platzhalter** | Entwicklungswert, geschätzt oder Herkunft ungeklärt | **nein** |

**Stand der Erhebung: 1 von 43 Produkten kalkulationsfähig (2 %).**

Die Zuordnung ist bewusst konservativ: Im Zweifel die niedrigere Stufe. Ein
zu hoch eingestufter Preis führt zu einer Kalkulation, die belastbar
aussieht und es nicht ist.

Deshalb stehen auch die elf Werte mit „ab-Preis"-Hinweis vorerst auf
`platzhalter` – ein öffentlicher Listenpreis ist nicht die tatsächliche
Einkaufskondition. Der Hinweis bleibt erhalten; sobald bestätigt ist, dass
sie der Praxis entsprechen, gehören sie auf `bekannt`.

### Offener Punkt: Shop rechnet abweichend

`npm run ek:pruefen` weist aus, wenn der Wert, mit dem die Anwendung
rechnet, vom bekannten Einkaufspreis abweicht. Nach Übertragung der
Screenshot-Preise betrifft das **25 von 43 Produkten** – 16 sind teurer als
angenommen, 9 günstiger. Vollständige Gegenüberstellung in
`kalkulationsmodell.md`.

> **Korrektur vom 2026-07-22:** Der zuvor hier geführte Wert von 4,00 € für
> das Valueweight T war eine grobe Schätzung des Betreibers, kein
> Listenpreis. Maßgeblich ist der belegte Screenshot-Preis von 3,24 €.
> Bessere Einkaufskonditionen werden später erneut eingepflegt.

Die Katalogwerte wurden **nicht** geändert – das ist eine Preisentscheidung
und wird gemeinsam getroffen.

---

## 2. Weitere Kostenbausteine

Angaben des Betreibers, Stand 2026-07-21.

| Baustein | Betrag | Art |
|---|---|---|
| **DTF-Transfer** | 4,99 – 18,99 € je nach Größe | **Fremdbezug** beim Dienstleister |
| **Versand an Kundschaft** (DHL) | 5,50 € | je Sendung |
| **Verpackung** | 0,50 € | je Sendung |
| **Versand vom Lieferanten** | 4,90 € | je Bestellung, **entfällt ab 75 € Einkaufswert** |

### DTF: Es werden FOLIEN gekauft, keine Motive

Angaben des Betreibers, 2026-07-21. **Das ist der zentrale Punkt der
DTF-Kalkulation** – und er verändert die Rechenweise grundlegend.

| Folie | Maße | Einkaufspreis |
|---|---|---|
| A4 | 210 × 297 mm | **6,29 €** |
| A3 | 297 × 420 mm | **9,69 €** |
| – | 550 × 500 mm | **13,99 €** |
| – | 550 × 1000 mm | **18,99 €** |

Gekauft wird der **komplette Druckbogen**, nicht das einzelne Motiv. Je nach
Größe und Anordnung passen mehrere Motive auf eine Folie – die Kosten sind
dann auf alle tatsächlich platzierten Motive zu verteilen.

Beispiel des Betreibers: Zehn kleine Logos können gemeinsam auf einer
A4-Folie für 6,29 € entstehen. Auf jedes Logo entfällt dann nur ein Anteil.

#### Der Sicherheitsabstand gehört zur Fläche

Zwischen den Motiven **und zum Folienrand** sind mindestens **8 mm**
einzuhalten. Dieser Abstand zählt zur benötigten Fläche und verringert, wie
viele Motive auf eine Folie passen.

Was allein der umlaufende Rand kostet – unmittelbar aus den Maßen oben:

| Folie | nutzbar nach 8 mm Rand | Fläche | Randverlust |
|---|---|---|---|
| A4 | 194 × 281 mm | 545 cm² | 13 % |
| A3 | 281 × 404 mm | 1.135 cm² | 9 % |
| 550 × 500 | 534 × 484 mm | 2.585 cm² | 6 % |
| 550 × 1000 | 534 × 984 mm | 5.255 cm² | 4 % |

Hinzu kommen 8 mm zwischen je zwei benachbarten Motiven. Wie viele Motive
tatsächlich daraufpassen, ist damit kein Dreisatz aus Motivfläche geteilt
durch Folienfläche, sondern eine **Anordnungsfrage** – zwei Motive gleicher
Fläche, aber unterschiedlichem Zuschnitt können unterschiedlich viele Plätze
belegen.

#### In beide Richtungen

Ebenso gilt der umgekehrte Fall: Ein großes Motiv **erzwingt** die größere
Folie. Ein großes Brustmotiv kann bereits A3 (9,69 €) erfordern, ein großes
Rückenmotiv 550 × 500 mm (13,99 €) oder 550 × 1000 mm (18,99 €). In
Einzelfällen sind für ein Produkt **mehrere Folien** nötig – wenn ein Motiv
auf keine einzelne passt oder mehrere große gleichzeitig gefertigt werden.

#### Versandkosten des DTF-Lieferanten

Sie gehören zur **gesamten Bestellung** und werden auf alle bestellten
Folien verteilt – nicht je Motiv angesetzt. **Ab 75 € Einkaufswert entfallen
sie vollständig.**

#### Grundsätze für die spätere Kalkulation

> **1. Niemals mit einer festen DTF-Pauschale rechnen.**
>
> Maßgeblich sind immer: die tatsächlich benötigte Foliengröße, die Anzahl
> der Motive, die Ausnutzung der Folienfläche einschließlich des 8-mm-
> Sicherheitsabstands, und die Verteilung der Versandkosten auf die gesamte
> Bestellung.

> **2. Nicht allein nach Fläche rechnen, sondern nach tatsächlicher
> Belegung.**
>
> Entscheidend ist, wie die Motive auf einer Folie **angeordnet** werden
> können – nicht, wie viele Quadratmillimeter sie zusammen ergeben.
>
> Zwei Motive mit identischer Fläche können je nach Form unterschiedlich
> viel Platz beanspruchen und damit eine unterschiedliche Ausnutzung
> ermöglichen. Hinzu kommt der Sicherheitsabstand von mindestens 8 mm
> zwischen allen Motiven **und** zum Folienrand, der vollständig zur
> benötigten Fläche gehört.
>
> Eine Rechnung „Gesamtfläche der Motive geteilt durch Folienfläche" bildet
> das nicht ab und ist als Grundlage nicht geeignet.

> **3. Die tatsächlich benötigte Foliengröße zählt – nicht die theoretisch
> bestmögliche Auslastung.**
>
> Es darf **nicht** angenommen werden, dass eine Folie automatisch
> vollständig gefüllt wird. Manche Bestellungen bestehen aus einem einzelnen
> großen Rückenmotiv, andere aus mehreren kleinen Logos, wieder andere aus
> einer Kombination von Brust-, Rücken- und Ärmelmotiven. Anzahl und Größe
> der benötigten Folien ergeben sich immer aus der **konkreten Bestellung**.
>
> Zugleich gilt: Mehrere Motive einer Bestellung **können** gemeinsam auf
> einer Folie liegen, sofern Größe, Form und der Sicherheitsabstand von
> mindestens 8 mm das zulassen.
>
> Die Kalkulation soll damit weder vom ungünstigsten noch vom optimalsten
> Fall ausgehen, sondern den **tatsächlichen Produktionsfall möglichst
> realitätsnah** abbilden. Ziel ist nicht, künstlich niedrige Kosten
> anzunehmen, sondern den realistisch zu erwartenden Einkaufsaufwand.

> **4. Bezugsgröße ist der gesamte Auftrag – nicht das einzelne Motiv, aber
> auch nicht mehrere Kundenaufträge zusammen.**
>
> Mehrere Produkte **derselben Bestellung** können gemeinsam auf denselben
> Folien produziert werden, sofern Größe, Form und die Sicherheitsabstände
> das zulassen. Folienkosten und Versandkosten des DTF-Lieferanten sind
> deshalb auf den **gesamten Produktionsauftrag** zu beziehen und
> anschließend **verursachungsgerecht** auf die einzelnen Produkte zu
> verteilen.
>
> Eine isolierte Berechnung je Motiv oder je Produkt verfälscht die
> tatsächlichen Einkaufskosten häufig und ist deshalb **nicht** die
> Grundlage der Kalkulation.
>
> Ebenso wenig darf angenommen werden, dass **verschiedene Kundenaufträge**
> miteinander kombiniert werden. Maßgeblich ist immer die konkrete
> Bestellung des jeweiligen Kunden.

Alle vier Grundsätze sind **fachliche Vorgaben für die Kalkulationsphase**.
Wie sie technisch umgesetzt werden, ist ausdrücklich noch nicht entschieden.

#### Zu klären

Frühere Angabe war eine Spanne von **4,99 € bis 18,99 €**; die jetzt
genannte Staffel beginnt bei 6,29 €. Ob 4,99 € eine kleinere Folie, ein
älterer Stand oder eine andere Kondition war, ist offen.

---

### Die vorbereitete Struktur beruht auf einer früheren Annahme

`src/config/pricing/dtfKosten.ts` wurde gebaut, als noch angenommen wurde,
der Einkauf erfolge je Motiv („eine Motivgröße → ein Preis"). Mit den realen
Einkaufsdaten steht fest, dass Folien gekauft werden.

**Die Datei ist damit neu zu bewerten.** Ob sie ersetzt, erweitert oder auf
andere Weise genutzt wird, ist **offen** – das entscheidet sich erst,
nachdem Preisstrategie und Modell der Folienausnutzung gemeinsam festgelegt
sind.

Bis dahin bleibt sie unverändert und **ungefüllt**. Sachlich festzuhalten
ist lediglich, was ein Befüllen mit den Folienpreisen heute bewirken würde:
Jedes einzelne Motiv erhielte den vollen Folienpreis, weil die Funktion
genau eine Stufe je Motivgröße zurückgibt. Das ist keine Bewertung der
Datei, sondern eine Beschreibung ihres derzeitigen Verhaltens.

---

### DTF: reiner Fremdbezug, als Tabelle gepflegt

Bestätigt am 2026-07-21: Die Transfers werden **eingekauft, nicht selbst
produziert**. Maschinenkosten, Druckzeit und Materialverbrauch entfallen
damit vollständig – der Betrag je Transfer ist ein direkt zurechenbarer
Stückkostenblock ohne Fixkostenanteil.

Gepflegt in `src/config/pricing/dtfKosten.ts` als **Tabelle, nicht als
Formel**. Der Dienstleister staffelt nach Größe; eine Formel würde diese
Staffel nachbilden und bei jeder Preisänderung im Code angepasst werden
müssen – mit Test und Auslieferung. Als Tabelle genügt ein geänderter Wert.

Je Stufe: Bezeichnung, Obergrenzen in cm, Einkaufspreis, Quelle, Stand.
`dtfEinkaufspreis(breite, höhe)` wählt die **kleinste passende** Stufe.

**Noch leer.** Solange die Staffel fehlt, wirft die Funktion – sie liefert
keinen Ausweichwert. Bekannt ist bisher nur die Spanne 4,99 – 18,99 €.

### Stickerei: zwei Produktionswege, ein Verkaufspreis

Angaben des Betreibers, 2026-07-21.

| Weg | Satz je 1.000 Stiche | Art |
|---|---|---|
| **Eigene Produktion** | **1,40 €** | interne Verrechnung, bewusst festgelegt |
| **Externer Stickpartner** | **0,76 €** | Fremdbezug, für größere Aufträge |

**Grundlage der Verkaufspreiskalkulation ist der interne Satz von 1,40 €.**

Der Fremdbezugspreis von 0,76 € ist ausschließlich eine **interne
Produktionsalternative**. Er verändert die Verkaufspreise ausdrücklich
**nicht**: Die Kundschaft zahlt denselben Preis, unabhängig davon, ob wir
selbst sticken oder einen Auftrag aus Kapazitätsgründen auslagern. Das ist
eine betriebliche Entscheidung, keine Preisfrage.

Fachlich sind das zwei verschiedene Größen: 1,40 € ist ein
**Verrechnungssatz** (womit kalkuliert wird), 0,76 € ein **Einstandspreis**
(was im Auslagerungsfall tatsächlich gezahlt wird). Die Differenz ist der
Deckungsbeitrag der Auslagerung – sie gehört in die Nachkalkulation, nicht
in die Preisbildung.

> **PREISENTSCHEIDUNG 2026-09-03 (Betreiber).**
>
> Bis dahin stand in `config/pricingRules.ts` eine Verkaufsregel `emb-stitches`
> mit **1,40 € je 1.000 Stiche**, die die DTF-Positionsstaffel für Stickerei
> **vollständig ersetzte** – ohne Grundgebühr und mit dem vollen
> Veredelungsrabatt der Mengenstaffel (bis 90 %). Folge, mit dem echten
> Rechenkern nachgerechnet: ein 8×4-cm-Brustlogo (~6.400 Stiche) kostete
> bestickt 25,95 € gegenüber 25,99 € bedruckt, ab 5 Stück war Stickerei
> günstiger als DTF, kleine Logos waren bestickt immer ~5 € günstiger, und ab
> 20 Stück lag der Stich-Erlös auf bzw. unter den Fremdkosten von 0,76 €.
>
> Seitdem gilt für Stickerei:
>
> 1. **Dieselbe Positionsstaffel wie DTF** (`DTF_POSITION_TIERS`: 9 € erste
>    Ansicht, 5 € zweite, 4 € jede weitere, je Stückzahlstufe günstiger) –
>    über die Regeln `emb-erste-position`/`emb-zusatz-position`. Die früheren
>    Je-Ansicht-Aufschläge (`emb-pos-*`) sind deaktiviert.
> 2. **Zusätzlich 1,20 € je 1.000 geschätzte Stiche** (`emb-stitches`).
>    Stickerei ist damit bei gleichem Motiv immer teurer als DTF – um genau
>    den Stichaufpreis.
> 3. **Rabattdeckel** (`maxDiscountPercent` an der Stichregel, berechnet aus
>    `STICKKOSTEN_JE_1000_STICHE`): Der Mengenrabatt auf den Stichaufpreis ist
>    auf 36,6 % begrenzt, damit der Erlös je 1.000 Stiche nie unter die
>    Fremdkosten von 0,76 € fällt. Die DTF-Positionsstaffel bleibt davon
>    unberührt.
>
> Der interne Verrechnungssatz von 1,40 € oben bleibt eine Kalkulationsgröße
> und ist kein Verkaufspreis.
>
> **Vertrauenswürdige Stichzahl (2026-09-04).** Die Stichzahl kommt als
> Schätzung aus dem Browser (`estimatedStitches`). Bei der Bestellung
> rechnet der Server sie aus den übermittelten Motivdaten selbst nach
> (`lib/embroidery/serverStichzahl.ts`, gleicher Rechenkern
> `stichschaetzung.ts` wie im Browser; Logo-Pixel aus dem gespeicherten
> Display-PNG über resvg, Text über resvg mit den gebündelten Schriften).
> Preisrelevant ist der Clientwert nur, wenn er den Serverwert höchstens um
> die Messtoleranz (Logo 5 %, Text 25 %) unterschreitet – sonst der
> Serverwert. Ein manipulierter Request kann die Stichzahl damit nicht unter
> den Serverwert drücken; die Toleranz existiert allein, damit Anzeige und
> Rechnung bei ehrlichen Kundinnen exakt übereinstimmen.
>
> **Unlesbare oder leere Motivdaten (geprüft 2026-09-04).** Drei Stufen:
>
> 1. Keine PNG-Datei (kein `data:`-URL, falsche Signatur, zu groß, Header
>    unlesbar): `pruefeDataUrl` lehnt ab. Solche Daten werden zwar in der
>    Stichzahl-Prüfung mit der bildlosen Schätzung belegt, erreichen aber
>    nie eine gespeicherte Bestellung – `uploadProductionFile` weist sie
>    beim Ablegen ab, der Bestellvorgang bricht ab.
> 2. Gültiger PNG-Header, aber kaputter oder leerer Inhalt (abgeschnitten,
>    Müll statt Bilddaten, vollständig transparent, rein weiß): resvg wirft
>    hier KEINEN Fehler, sondern rendert ein leeres Bild – die Upload-
>    Prüfung sieht nur die Signatur. Deshalb prüft `logoHatInhalt()` mit
>    demselben Verfahren wie die Preisberechnung, ob mindestens ein
>    Motivpixel existiert. Fehlt er, meldet `mitVertrauenswuerdigerStichzahl`
>    das Element als `unlesbar` und `orders.ts` weist die Bestellung ab
>    („Ein Logo konnte nicht gelesen werden oder ist leer …"). Es gibt
>    nichts zu besticken und nichts, woraus sich ein ehrlicher Preis
>    ableiten ließe – blockieren statt raten.
> 3. Zweite Sicherung, falls ein solches Element je bis zur Preisberechnung
>    käme: Der numerische Rückfall ist die bildlose Schätzung (50 % Füllung
>    + 500 Grundstiche, z.B. 7.220 Stiche für 8×4 cm), nie nur die 500
>    Grundstiche und nie der Clientwert. Vor dieser Prüfung lag der Wert
>    für ein leeres Bild bei 500 – ein Clientwert 500 wäre akzeptiert
>    worden (0,60 € Aufpreis für beliebig große Motive).
>
> Bepreist und produziert wird die DISPLAY-Datei (was Vorschau und
> Produktionsblatt zeigen); die archivierte Originaldatei ist Referenz. Die
> Werkstatt digitalisiert nach der freigegebenen Vorschau, nicht nach einer
> davon abweichenden Originaldatei.

---

## 2a. Gemeinkosten und Gewinn

Gepflegt in `src/config/pricing/gemeinkosten.ts`. **Alle Blöcke stehen auf
`aktiv: false` und `wert: 0`** – sie beeinflussen heute keine Berechnung.
Die Null bedeutet „unbekannt", nicht „fällt nicht an".

| Block | Wirkungsart |
|---|---|
| Zahlungsgebühren | Prozent vom Verkaufspreis |
| Retouren | Risikoanteil |
| Ausschuss | Risikoanteil |
| Reklamationen und Nachlieferungen | Risikoanteil |
| Maschinenverschleiß (Transferpresse) | Betrag je Stück |
| Strom (Pressvorgang) | Betrag je Stück |
| Software und Dienste | monatlicher Fixbetrag |
| Hosting und Infrastruktur | monatlicher Fixbetrag |
| Versicherungen | monatlicher Fixbetrag |
| **Unternehmerischer Gewinn** | Prozent vom Verkaufspreis |

Jeder Block trägt eine Beschreibung, **woran sein Wert zu ermitteln wäre** –
damit er später nicht mit einer geratenen Zahl gefüllt wird.

### Warum das nicht in die Preispipeline gehört

Der Unterschied ist grundsätzlich:

- `lib/pricing/` – was die Kundschaft **zahlt**. Jeder Posten erscheint auf
  Rechnung und Bestätigung.
- `config/pricing/gemeinkosten.ts` – wie wir zu diesem Preis **kommen**.
  Kein Posten davon steht je auf einer Kundenrechnung.

Ein Gewinnaufschlag ist keine Rechnungsposition. Die Trennung sauber zu
halten verhindert, dass interne Kalkulationsgrößen in Kundendokumenten
landen.

### Offene Bezugsgröße

Monatliche Fixkosten (Software, Hosting, Versicherung) lassen sich erst auf
eine Bestellung umlegen, wenn die **erwartete Zahl der Bestellungen je
Monat** feststeht. Sie steht derzeit auf 0 = unbekannt.

### Der Schwelleneffekt beim Lieferantenversand

Die 4,90 € entfallen ab 75 € Einkaufswert. Das ist der einzige Kostenblock
mit einem Sprung – und er wirkt sich auf kleine Bestellungen stark aus:

- Bei einem Einkaufswert von 10 € entsprechen 4,90 € einem Aufschlag von 49 %
- Bei 74 € sind es 6,6 %
- Ab 75 € null

Ob und wie dieser Effekt an die Kundschaft weitergegeben wird, ist eine
Preisentscheidung. Denkbar sind eine Umlage über die Rüstkosten, ein
Mindestbestellwert oder eine bewusste Quersubvention kleiner Bestellungen.
**Noch nicht entschieden.**

---

## 3. Was noch fehlt

1. **Einkaufspreise für 42 Produkte** – der Betreiber stellt sie aus den
   Lieferantenportalen bereit (`ek-preise-erfassung.csv`).
2. **Artikelnummern für 13 Fruit-of-the-Loom-Produkte** – ohne sie ist keine
   Zuordnung zur Bezugsquelle möglich (siehe `supplierRefs.ts`).
3. **Aufschlüsselung der DTF-Größenstaffel** – welche Motivgröße kostet
   welchen Betrag?
4. **Steuerentscheidung** (§ 19 UStG oder Regelbesteuerung) – bestimmt, ob
   die genannten Beträge netto oder brutto zu rechnen sind.

Erst danach entstehen die Verkaufspreise – und zwar je Produkt, nicht als
pauschaler Aufschlag.

---

## 4. Wie der Verkaufspreis entsteht

**Die Kosten sind die Untergrenze, nicht der Preis.** Zur Preisfindung
gehören zwei Betrachtungen:

1. **Kostenseite** – Einkauf, Transfer, Versand, Verpackung, Gemeinkosten,
   Gewinn. Ergibt, was ein Produkt mindestens kosten muss.
2. **Marktseite** – in welchem Preisbereich vergleichbare Anbieter
   vergleichbare Qualität anbieten. Ergibt, was am Markt durchsetzbar ist.

Der Preis wird je Produkt zwischen beiden festgelegt. Ziel ist weder der
niedrigste noch der höchste Preis, sondern eine gesunde Marge bei klarer
Positionierung.

### Umfang der Kalkulation je Produkt

Einkaufspreis · DTF- oder Stickkosten · Versand · Verpackung · Gemeinkosten ·
Marktvergleich. Erst wenn diese Angaben zusammen vorliegen, wird der
Verkaufspreis festgelegt.

### Offen: die Rolle von `computeBasePrice()`

Heute leitet `computeBasePrice(purchasePrice, qualityTier)` den Grundpreis
über einen Faktor je Qualitätsstufe ab.

**Ob diese Funktion bestehen bleibt, ist offen.** Denkbar ist ebenso, dass
sie erhalten bleibt und lediglich anders parametrisiert oder um
produktbezogene Regeln erweitert wird. Die Entscheidung fällt erst, wenn
Einkaufspreise, DTF-Kosten und Marktvergleich vollständig vorliegen –
**die Architektur richtet sich nach der Preisstrategie, nicht umgekehrt.**

---

## 5. Stand der Vorbereitung

Die technische Grundlage ist abgeschlossen. Ab hier keine weiteren
vorbereitenden Strukturen – der nächste Schritt ist das Befüllen mit echten
Geschäftsdaten (Stand 2026-07-21).

| Baustein | Zustand |
|---|---|
| Einkaufspreise, drei Qualitätsstufen | Struktur steht, 1 von 43 kalkulationsfähig |
| DTF-Kosten als Tabelle | Struktur steht, leer |
| Gemeinkosten und Gewinn | 10 Blöcke vorgesehen, alle inaktiv |
| Prüfwerkzeug `npm run ek:pruefen` | einsatzbereit |
| Erfassungsvorlage `ek-preise-erfassung.csv` | einsatzbereit |
