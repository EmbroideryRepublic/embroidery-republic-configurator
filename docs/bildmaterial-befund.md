# Befund: Grenzen des vorhandenen Produktbildmaterials

> **Status: technisch abgearbeitet (2026-07-20).**
>
> Die ursprünglich hier als „nicht behebbar" eingestuften Punkte 1 und 2 sind
> inzwischen **technisch gelöst** – siehe Abschnitt „Was daraus geworden ist"
> am Ende jedes Befunds. Die Messungen bleiben als Beleg stehen, weil sie
> begründen, WARUM die jeweilige Lösung nötig war.
>
> Offen und tatsächlich nicht technisch lösbar ist nur noch Befund 3
> (fehlende Aufnahmen) sowie drei einzelne angeschnittene FOTL-Fotos.

## Warum das keine Rechenfrage ist

Der Konfigurator führt **eine Druckfläche je Produkt und Ansicht**. Die Fläche
ist in Prozent der Bildkante definiert und wird auf alle Farbvarianten
angewandt. Das ist korrekt, solange alle Varianten eines Produkts dasselbe
Kleidungsstück an derselben Stelle im Bild zeigen.

Genau das ist bei einem Teil des Bestands nicht der Fall.

---

## Befund 1 — Fruit of the Loom: Farbvarianten sind unterschiedlich gerahmt

### Messung

Für jede Farbvariante wurde die Kleidungsstückmitte in der Vorderansicht
bestimmt (Median der Torsokanten unterhalb der Achsel). Angegeben ist die
Spannweite über alle Farben eines Produkts, in Prozent der Bildbreite:

| Produkt | Farben | Spannweite Mitte | Spannweite Breite |
|---|---:|---:|---:|
| fotl-valueweight-t | 18 | **8,00 %** | 7,94 % |
| fotl-iconic195-t | 19 | 4,86 % | 9,00 % |
| fotl-ladies-valueweight-t | 20 | 4,81 % | 7,37 % |
| fotl-ladies-iconic195-t | 17 | 4,15 % | 20,41 % |
| fotl-original-t | 20 | 3,56 % | 7,55 % |
| fotl-pure-cotton-t | 11 | 3,45 % | 4,58 % |
| fotl-super-premium-t | 9 | 2,52 % | **54,33 %** |
| … 4 weitere FOTL-Produkte | | 2,0–3,0 % | |

**Alle 11 Produkte mit einer Spannweite über 2 % sind Fruit of the Loom.**
Jede andere Marke im Bestand liegt bei **≤ 0,53 %**:

| Marke | größte Spannweite Mitte |
|---|---:|
| Gildan | 0,53 % |
| James+Nicholson | 0,21 % |
| Stedman | 0,16 % |
| Russell, Neutral, Just Hoods, B&C, SOL'S | < 0,5 % |

### Beweisbild

Dieselbe Fläche, zwei Farben desselben Produkts (`fotl-valueweight-t`, vorne):

- **Solar Yellow** – Flächenmitte trifft die Kleidungsstückmitte: Versatz 0,42 %
- **Weiß** – Versatz **4,95 %**, linker Rand 20,8 %, rechter Rand 10,9 %

Die Fläche ist identisch. Verschoben ist das Kleidungsstück im Foto.

### Folge im Konfigurator

Eine Fläche kann nicht gleichzeitig in 18 verschieden gerahmten Fotos mittig
sitzen. Betroffen ist damit vor allem die Schaltfläche **„Mittig"**: Sie
zentriert das Motiv in der Fläche, nicht auf dem Kleidungsstück – bei den
ungünstigsten FOTL-Farben liegt das rund 3,5 cm daneben. Die Sicherheits-
abstände links und rechts sind aus demselben Grund ungleich.

### Empfehlung

1. **Bevorzugt: einheitliche Freistellung der FOTL-Bilder.** Die Fotos sind
   brauchbar, nur unterschiedlich beschnitten. Ein einmaliger, verlustfreier
   Normalisierungslauf (jede Variante auf ihre eigene Konturmitte ausrichten,
   auf gemeinsame Konturhöhe skalieren, auf einheitliche Leinwand setzen)
   beseitigt die Ursache für alle 11 Produkte auf einen Schlag. Es werden dabei
   **keine Bildinhalte erzeugt oder verändert**, nur Rahmen und Maßstab.
2. Alternativ: dieselben Artikel von einem Lieferanten mit einheitlicher
   Bildstrecke beziehen (die übrigen acht Marken im Bestand erfüllen das
   bereits).
3. **Nicht empfohlen:** Druckflächen je Farbe führen. Das vervielfacht die
   generierten Daten von 164 auf rund 1 270 Einträge und zieht Farbwissen in
   Canvas, Zustandsspeicher und serverseitige Druckvorschau – hoher Aufwand,
   um einen Bildfehler zu umgehen.

### Was daraus geworden ist — GELÖST

Empfehlung 1 wurde umgesetzt: `scripts/normalizeProductImages.mts` richtet
alle Farbvarianten eines Produkts auf dieselbe Kleidungsstückmitte, dieselbe
Oberkante und denselben Maßstab aus. Verändert werden ausschließlich Lage und
Maßstab im unveränderten Bildrahmen; es entstehen keine Pixel und keine
Farbänderung. Skaliert wird nur nach unten, damit nicht interpoliert und
weichgezeichnet wird.

Angewandt auf 540 FOTL-Bilder (1 124 Dateien, PNG und WebP synchron).

Ergebnis, maximaler Mittenversatz der Vorderansicht:

| Produkt | vorher | nachher |
|---|---:|---:|
| fotl-valueweight-t | 4,95 % | **0,42 %** |
| fotl-original-t | 2,56 % | **0,40 %** |
| fotl-iconic195-t | 3,47 % | **0,82 %** |
| fotl-pure-cotton-t | 1,93 % | **0,14 %** |
| fotl-ladies-valueweight-t | 2,79 % | **0,69 %** |

Zusätzlich nimmt der Flächengenerator angeschnittene Aufnahmen aus der
Schnittmenge – sie zogen die geklemmte Fläche einseitig aus der Mitte
(fotl-ladies-iconic195-t: Mittelwert 1,88 % → 0,39 %).

**Rest:** drei einzelne Fotos, bei denen das Kleidungsstück im Original aus
dem Bild läuft (`fotl-super-premium-t/front/red`,
`fotl-ladies-iconic195-t/front/navy`, `fotl-original-t/front/urban-khaki`).
Sie lassen sich nicht ausrichten, weil ihre wahre Ausdehnung unbekannt ist.
Betrifft 3 von 329 Farbvarianten.

---

## Befund 2 — Ärmelansichten: zwei unvereinbare Aufnahmearten

### Messung

Verglichen wurde die größte Konturbreite der Ärmelansicht mit der der
Vorderansicht. Eine echte Seitenansicht zeigt die **Tiefe** des
Kleidungsstücks und ist damit deutlich schmaler als die Vorderansicht.

| Gruppe | Verhältnis Ärmel/Front | Kontur am Bildrand angeschnitten | Produkte |
|---|---:|---|---:|
| Ganzansicht von der Seite | **0,40 – 0,46** | nein | **21** |
| Nahaufnahme / Ausschnitt | **0,70 – 1,03** | ja | **18** |

Die 21 brauchbaren Aufnahmen liegen eng beieinander (0,40–0,46) – das ist das
tatsächliche Verhältnis. Die 18 übrigen sind Nahaufnahmen der Schulterpartie,
bei denen das Kleidungsstück an allen vier Bildkanten aus dem Bild läuft.

**Betroffen (18):** russell-ladies-authentic-t, neutral-rollsleeve-t,
fotl-ladies-premium-polo, gildan-ladies-heavy-t, fotl-premium-polo,
gildan-heavy-t, sols-imperial-t, russell-authentic-t, jn-active-t,
stedman-slimfit-t, gildan-ladies-t, gildan-ladies-vneck-t, gildan-ladies-polo,
neutral-classic-polo, gildan-softstyle-polo, russell-workwear-t,
fotl-baseball-t, gildan-vneck-t

### Warum daraus keine Fläche ableitbar ist

Der Maßstab px/cm folgt aus der sichtbaren Kleidungsstückhöhe gegen die
verifizierte Körperlänge der Größentabelle. Bei einem Ausschnitt ist die
sichtbare Höhe **nicht** die Körperlänge, sondern ein unbekannter Teil davon.
Der Maßstab ist damit aus dem Bild allein nicht bestimmbar – gemessen liegt er
bei diesen Produkten um rund das 2,4-fache daneben, die Fläche wird zu klein
gezeichnet und sitzt zu hoch.

Man **könnte** den Vergrößerungsfaktor aus dem Verhältnis der 21 guten
Aufnahmen schätzen. Das wäre eine Annahme über die Tiefe eines
Kleidungsstücks, das man nicht gemessen hat, und damit genau die Art von
Kompensation, die hier nicht stattfinden soll. Der Wert ist nicht messbar,
also wird er nicht erfunden.

### Empfehlung

1. **Ärmelaufnahmen als Ganzansicht von der Seite nachziehen** – so, wie sie
   für 21 Produkte bereits vorliegen. Das ist die einzige Lösung, die den
   Maßstab wiederherstellt.
2. Bis dahin: für die 18 Produkte die Ärmelansicht **ausblenden** statt eine
   erkennbar falsche Fläche zu zeigen. Das ist eine kaufmännische Entscheidung
   – sie nimmt 18 Produkten die bestellbare Ärmelveredelung – und wird deshalb
   nicht eigenmächtig getroffen.

### Was daraus geworden ist — GELÖST, ohne neue Aufnahmen

Der Maßstab ist doch bestimmbar, ohne ihn zu raten. Die Produkte MIT sauberer
Ganzansicht liefern das echte Verhältnis Tiefe/Breite ihres Schnitts:

| Schnittgruppe | n | Tiefe/Breite |
|---|---:|---|
| Longsleeve | 3 | 0,409 ± 0,026 |
| Zip-Hoodie | 3 | 0,455 ± 0,005 |
| Hoodie | 2 | 0,471 ± 0,018 |
| Sweater | 1 | 0,479 |

Die Streuung innerhalb einer Schnittgruppe liegt bei 1–6 %. Eine Nahaufnahme
liefert dagegen 0,95…1,14 – ein T-Shirt, das so tief wie breit ist, gibt es
nicht. **Diese Abweichung IST die Vergrößerung** und damit messbar, nicht
geraten. Dasselbe Vorgehen wie beim bereits validierten Torsofaktor
(0,6575 ± 0,042): eine an der Population gemessene Konstante, angewandt auf
Mitglieder derselben Population.

Umgesetzt in `generatePrintAreaData.mts`: erkannte Nahaufnahmen bekommen ihren
Maßstab um den gemessenen Faktor korrigiert (im Bestand 1,67…2,37). Zusätzlich
liegt das Ärmelband jetzt bei der halben **gemessenen** Ärmellänge
(Schulter→Achsel aus der Frontansicht, validierte Achselerkennung) statt bei
einem Anteil der Kleidungsstückhöhe – der Anteil hatte keinen Bezug zur
Armkugelnaht und war die Ursache des ursprünglich gemeldeten Fehlers.

**Einzige Übertragung über Schnittgruppen hinweg:** Polo und Jacke haben im
Bestand keine einzige saubere Ärmel-Ganzansicht und nutzen den Gesamtmedian
0,450. Das ist im Generatorprotokoll ausgewiesen.

**Rest:** Die Nahaufnahmen bleiben Nahaufnahmen – das Kleidungsstück ist
angeschnitten und lässt sich nicht „herauszoomen". Die Ärmelansicht springt
beim Produktwechsel deshalb weiterhin zwischen Ganzansicht und Detailaufnahme.
Die Fläche stimmt jetzt, die Bildwirkung bleibt uneinheitlich.

---

## Befund 3 — Vier Produkte ohne Ärmelbilder

`bandc-inspire-hoodie`, `bandc-inspire-zip-hood`, `jn-halfzip-sweat`,
`sols-north-fleece` führen nur `front` und `back`. Sie stehen deshalb auf
`hasSleeves: false`, wodurch die Ärmelansichten ausgeblendet werden.

Das ist sachlich falsch: Ein Hoodie hat Ärmel. Die Ärmelveredelung ist für
diese vier Produkte schlicht nicht bestellbar, obwohl sie herstellbar wäre.

**Empfehlung:** Ärmelfotos nachziehen (Ganzansicht von der Seite). Danach
`hasSleeves` entfernen – die Flächen entstehen automatisch.

---

## Nicht betroffen

Vorder- und Rückansicht aller acht übrigen Marken sowie der FOTL-Produkte mit
wenigen Farben sind einheitlich gerahmt und liefern korrekte, mittige Flächen.
Die Bildbasis ist also nicht insgesamt schlecht – die Mängel sind auf einen
Lieferanten (Befund 1) und eine Aufnahmeart (Befund 2) eingegrenzt.
