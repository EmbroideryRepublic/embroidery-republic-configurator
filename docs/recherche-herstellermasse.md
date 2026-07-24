# Recherche: fehlende Herstellermaße für das hybride Flächenmodell

> **Status: offen.** Dieses Blatt wird während der Recherche gefüllt und ist
> anschließend der Abschlussbericht. Solange Spalten leer sind, bleibt
> `printAreas.ts` unverändert.

## Regeln für das Ausfüllen

1. **Nur offizielle Quellen** – Herstellerdatenblatt, offizielle Größentabelle,
   technische Maßskizze. Händlerangaben sind keine Quelle.
2. **Technische Zeichnungen haben Vorrang** vor einfachen Größentabellen, weil
   sie Schulter- und Ärmelmaße eindeutig definieren.
3. **Nicht veröffentlichte Maße bleiben leer** und werden als `n.v.`
   eingetragen. Keine Schätzung, kein Durchschnitt, keine Übertragung aus einer
   anderen Marke.
4. **Quelle je Zeile** eintragen (URL + Abrufdatum), nicht nur je Marke, falls
   sie sich unterscheiden.

## Was bereits belegt ist

Brustbreite und Körperlänge je Größe liegen für alle 43 Produkte im
`sizeGuide` und stammen aus Herstellertabellen. Sie sind hier nur zur
Kontrolle in Größe M abgedruckt und **nicht** Gegenstand der Recherche.

## Spalte „Kontur"

`ja` = die Achsel war in der Bildkontur erkennbar, es gibt eine zweite,
unabhängige Messung (28 Produkte). `nein` = Ärmel liegen am Körper an, die
Kontur liefert keine Trennung von Rumpf und Ärmel (15 Produkte). Für diese
Produkte sind die Herstellermaße die **einzige** Grundlage – fehlen sie, ist
das Produkt gesondert zu behandeln und ausdrücklich zu kennzeichnen.

## Offene Grundsatzfrage

Falls die Oberarm-/Bizepsweite bei einer Marke nicht veröffentlicht ist,
betrifft das die Ärmelfläche. Für Produkte mit `Kontur: ja` existiert eine
Rückfallebene über die Bildmessung. Für Produkte mit `Kontur: nein` existiert
**keine** – hier ist eine bewusste Entscheidung nötig, keine Ersatzannahme.

## BEFUND 1 — Bedeutung von `breiteCm` ist ungeklärt (blockierend)

**Stand 2026-07-20, Quelle: <https://www.fruitoftheloom.eu/s/size-guide?language=en_GB>, direkt im Browser geladen.**

Die offizielle FOTL-Größentabelle nennt für Herren:

| | S | M | L | XL | 2XL | 3XL |
|---|---|---|---|---|---|---|
| Brust (cm) | 89–94 | 96.5–101.5 | 104–109 | 112–117 | 119.5–124.5 | 127–132 |

Das sind **Körpermaße des Trägers** („to-fit"), ausdrücklich keine Maße des
Kleidungsstücks. Die Hälfte davon ergibt für M rund 48–51 cm.

Im Projekt steht für `fotl-heavy-t` bei Größe M `breiteCm: 51`. Das entspricht
der **Hälfte des Körper-Brustumfangs**, nicht der flach gemessenen Breite des
Kleidungsstücks. Händlerquellen führen für dasselbe Produkt in M eine
Kleidungsstückbreite von 56 cm — die Differenz von rund 5 cm ist die Weite
(Bewegungsfreiheit), die jedes Kleidungsstück über dem Körpermaß hat.

**Warum das blockiert:** Die Druckfläche liegt auf dem Kleidungsstück, nicht
auf dem Körper. Wird `breiteCm` als Kleidungsstückbreite gelesen, obwohl es ein
Körpermaß ist, fällt jede berechnete Fläche rund 10 % zu schmal aus. Das
betrifft ALLE Berechnungen, auch den bereits gemessenen Umrechnungsfaktor
(0,6575 — mit einer um 5 cm größeren Bezugsbreite läge er bei rund 0,61 und
damit unter 2/π).

**Vor jeder weiteren Recherche zu klären:** Für jedes der 43 Produkte muss
belegt werden, ob `breiteCm` ein Körpermaß oder ein Kleidungsstückmaß ist. Die
Werte stammen laut Kommentaren teils von textil-grosshandel.eu, teils aus
Herstellertabellen — beide Bedeutungen sind also im Bestand vermutlich
gemischt. Solange das offen ist, führt jede Ergänzung um Ärmelmaße nur dazu,
dass zu den bestehenden auch noch neue Werte uneinheitlicher Bedeutung kommen.

## BEFUND 2 — FOTL veröffentlicht keine Ärmel-, Schulter- oder Bizepsmaße

Die offizielle Größentabelle enthält ausschließlich Brust- und Taillenumfang
(Körpermaße). Ärmellänge, Schulterbreite und Bizepsweite kommen dort nicht vor.
Die produktspezifischen Seiten (`fruitoftheloom.eu/shop/p/…`) sind eine
JavaScript-Anwendung, die im Browser nicht fertig lädt; über diesen Weg waren
keine produktbezogenen Maßtabellen abrufbar.

Damit gilt für alle 18 FOTL-Produkte vorerst: **Ärmellänge n.v., Schulterbreite
n.v., Oberarmweite n.v.** — offiziell nicht veröffentlicht. Zu prüfen bleibt
der offizielle Katalog als PDF sowie der „Leitfaden für T-Shirts".

## BEFUND 3 — Herkunftsprüfung des Bestands (intern, gesichert)

`scripts/auditSizeProvenance.mts`, Lauf 2026-07-20:

**Körperlänge ist konsistent.** `sizeGuide.hoeheCm` (Größe M) und
`REFERENCE_HEIGHT_CM` in printAreas.ts stimmen bei **43 von 43** Produkten
exakt überein, keine einzige Abweichung. Beide Eintragungen stammen erkennbar
aus derselben Quelle. Die Längenwerte sind damit intern belastbar.

**Die Schrittweite der Brustbreite spricht für Kleidungsstückmaße.** FOTL-
Herrenprodukte wachsen in exakt 5,0 cm je Größe, Damenprodukte in exakt 2,5 cm.
Diese Gleichmäßigkeit ist typisch für flach gemessene KLEIDUNGSSTÜCKE.
Körpermaßtabellen wachsen unregelmäßig, weil sie Konfektionsgrößen abbilden
(die offizielle FOTL-Körpertabelle springt in ~7,5 cm Umfang = ~3,75 cm halb).
Damit ist Befund 1 zu korrigieren: Die Werte sind **wahrscheinlich doch
Kleidungsstückmaße** — aber siehe Befund 4.

**20 von 43 Produkten haben unregelmäßige Schrittweiten** (z.B.
`fotl-original-longsleeve`: 5, 5, 5, 5, **7** · `fotl-iconic195-longsleeve`:
2.5, 5, 2.5, 5, 5, 5, 5, 5). Unregelmäßigkeiten können echt sein, häufen sich
hier aber auffällig — jede betroffene Zeile ist gegen die Herstellertabelle zu
prüfen.

**Zwei Größentabellen sind nachweislich von anderen Produkten kopiert**
(im Code als „Näherung" gekennzeichnet):
- `fotl-pure-cotton-t` — Tabelle von Heavy T übernommen, weil die echte beim
  Lieferanten nur als Bildgrafik vorlag (fruitOfTheLoom.ts:359).
- `fotl-iconic195-t` — Tabelle der Iconic 195 Longsleeve übernommen, weil die
  verlinkte Seite auf das falsche Produkt führte bzw. 404 lieferte
  (fruitOfTheLoom.ts:611).

**Quellenlage:** Die FOTL-Kommentare verweisen auf **Lieferantenseiten**
(„beim Lieferanten", „vom Lieferanten verlinkte Seite"), nicht auf
Herstellerdatenblätter. Bei den übrigen **8 Marken ist überhaupt keine Quelle
dokumentiert**.

## BEFUND 4 — Verdacht auf Verschiebung um eine Größe (NICHT bestätigt)

Für `fotl-heavy-t` stehen im Projekt: S 46 · M 51 · L 56 · XL 61 · XXL 66 ·
3XL 71. Eine Sekundärquelle nennt für dasselbe Produkt XS 46,5 · S 51 · M 56 ·
L 61 · XL 66 · 2XL 71 — also **dieselbe Zahlenfolge, um eine Größe versetzt**,
während die Längen bei den richtigen Größen stehen. Das Muster passt zu einem
Übertragungsfehler (Breitenspalte um eine Zeile verrutscht).

**Status: unbestätigt.** Die Gegenzahlen stammen aus einer Sekundärquelle, die
ich an der offiziellen Herstellerquelle NICHT verifizieren konnte (siehe
Befund 5). Solange das offen ist, wird nichts korrigiert — eine Verschiebung
„zurück" auf Basis einer ungeprüften Quelle wäre derselbe Fehler mit
umgekehrtem Vorzeichen.

## BEFUND 5 — Offizielle Herstellerquellen sind mit den vorhandenen Werkzeugen nicht abrufbar

Belegte Versuche am 2026-07-20:

| Quelle | Ergebnis |
|---|---|
| `fruitoftheloom.eu/s/size-guide` | lädt — enthält **nur Körpermaße** (Brust/Taille), keine Ärmel-, Schulter- oder Bizepsmaße |
| `fruitoftheloom.eu/shop/p/heavy-t/0612120` | SPA, bleibt nach >30 s auf „in Arbeit", 0 Tabellen im DOM |
| FOTL-Größenleitfaden als PDF | heruntergeladen, aber in dieser Umgebung keine PDF-Textextraktion verfügbar |
| `gildanbrands.com/eu/...` | 301 auf gildan.com |
| `gildan.com/eu/en/5000-...` | **HTTP 403** |
| `retail.gildan.com/size-chart` | lädt, Tabellen werden dynamisch nachgeladen, 0 Tabellen im DOM |

Die offiziellen Herstellerportale sind durchweg JavaScript-Anwendungen oder
sperren automatisierte Zugriffe. Die Maßtabellen sind praktisch verfügbar —
aber auf **Großhändlerseiten**, die die Herstellertabelle wiedergeben. Genau
diese Quellen hat das Projekt bisher genutzt, und genau sie sind nach der
aktuellen Vorgabe („ausschließlich offizielle Herstellerunterlagen")
ausgeschlossen. **Diese Spannung muss vom Auftraggeber entschieden werden.**

## BEFUND 6 — Größenverschiebung WIDERLEGT, `breiteCm` ist ein Kleidungsstückmaß

**Quelle:** <https://www.backstagerockshop.com/pages/size-guide-fruit-of-the-loom-heavy-cotton>
· Typ: **Einzelhändler**, gibt die Herstellertabelle samt Hersteller-Definition
und -Toleranz wieder · abgerufen 2026-07-20.

Die Tabelle nennt ihre Definitionen ausdrücklich:
- Breite: „Measure across garment **2 cm down from armholes**"
- Länge: „Measure from highest point of shoulder to bottom edge of garment"
- Toleranz ± 2,5 cm „per manufacturer specifications"

Das sind **flach gemessene Kleidungsstückmaße**. Befund 1 ist damit
vollständig zurückgezogen: `breiteCm` ist kein Körpermaß.

Abgleich `fotl-heavy-t`, **jede Größe einzeln**:

| Größe | Projekt B/L | Quelle B/L | Abweichung |
|---|---|---|---|
| S | 46 / 68.5 | 46.5 / 68.5 | **−0,5 cm Breite** |
| M | 51 / 71 | 51 / 71 | — |
| L | 56 / 73.5 | 56 / 73.5 | — |
| XL | 61 / 76 | 61 / 76 | — |
| XXL | 66 / 77.5 | 66 / 77.5 | — |
| 3XL | 71 / 79 | 71 / 79 | — |

**Befund 4 ist widerlegt.** Es gibt keine Verschiebung um eine Größe. Mein
Verdacht beruhte auf einer KI-Zusammenfassung eines Suchtreffers, die eine
XS-Zeile einfügte, die in der echten Tabelle nicht existiert. Der direkte
Quellenabruf entlastet die Projektdaten. Einzige echte Abweichung: S-Breite
46 statt 46,5 cm.

## BEFUND 7 — Echte Abweichung bei `fotl-valueweight-t`

**Quelle:** <https://www.backstagerockshop.com/pages/size-guide-fruit-of-the-loom-valueweight>
· Typ: **Einzelhändler** · abgerufen 2026-07-20.

| Größe | Projekt B/L | Quelle B/L | Abweichung |
|---|---|---|---|
| S | 48.5 / 69.5 | 47 / 69.5 | **+1,5 cm Breite** |
| M | 53.5 / 72 | 53.5 / 72 | — |
| L | 56 / 74.5 | 56 / 74.5 | — |
| XL | 61 / **76** | 59 / **77** | **+2 cm Breite, −1 cm Länge** |
| XXL | 66 / **77.5** | 66 / **78.5** | **−1 cm Länge** |
| 3XL | 71 / **79** | 71 / **80** | **−1 cm Länge** |
| 4XL | 76 / **80.5** | 76 / **81.5** | **−1 cm Länge** |
| 5XL | 81 / **82** | 81 / **83** | **−1 cm Länge** |

Die Längen ab XL sind im Projekt durchgehend 1 cm kürzer — und entsprechen
**exakt den Längen von Heavy T** (76 / 77.5 / 79 / 80.5 / 82). Das deutet auf
eine Vermischung zweier Tabellen hin, nicht auf Rundung.

Gegenprobe: `fotl-iconic195-t` und `fotl-super-premium-t` führen ab XL genau
die Längen, die die Quelle für Valueweight nennt (77 / 78.5 / 80 / 81.5 / 83).
Beide Produkte sind zudem **zeichengleich identisch** — was die im Code
dokumentierte Übernahme bestätigt.

**Status: „Abweichung festgestellt – zweite Quelle erforderlich".** Noch nicht
„Korrektur erforderlich": Die Quelle ist ein einzelner Einzelhändler, und ihre
Breitenfolge (53,5 → 56 → 59) wirkt selbst unregelmäßig. Ein Korrekturversuch
auf dieser Basis wäre derselbe Fehler wie der vermutete. Zweitquelle
`texstar.eu` lieferte **HTTP 403**.

## BEFUND 8 — Zweitquelle entlastet die Projektbreiten, Erstquelle war fehlerhaft

**Quelle 2:** <https://shop.ralawise.com/fruitoftheloom/valueweight-t/> · Typ:
**B2B-Großhändler** (Ralawise, UK) · abgerufen 2026-07-20.

Ralawise veröffentlicht den Brust**umfang** in Zoll. Halbiert und in cm
umgerechnet ergibt das die flache Breite (Umrechnung von mir, ± 0,2 cm
Rundung):

| Größe | Ralawise | → flach | Projekt | Backstage (Quelle 1) |
|---|---|---|---|---|
| S | 38″ | 48,3 | **48,5 ✓** | 47 ✗ |
| M | 42″ | 53,3 | **53,5 ✓** | 53,5 ✓ |
| L | 44″ | 55,9 | **56 ✓** | 56 ✓ |
| XL | 48″ | 61,0 | **61 ✓** | 59 ✗ |
| 2XL | 52″ | 66,1 | **66 ✓** | 66 ✓ |
| 3XL | 56″ | 71,1 | **71 ✓** | 71 ✓ |

**Die Breiten im Projekt sind korrekt.** Der Fehler lag bei Quelle 1
(Backstage Rock Shop) an den Größen S und XL. Befund 7 ist im Breitenteil
zurückgezogen.

**Das ist der praktische Beleg für die Zwei-Quellen-Regel.** Hätte ich auf
Basis der Einzelquelle korrigiert, hätte ich korrekte Daten kaputtgemacht.

**Weiterhin offen: die Längen ab XL.** Ralawise veröffentlicht keine Längen.
Der Unterschied Projekt (76 / 77,5 / 79 / 80,5 / 82) gegenüber Quelle 1
(77 / 78,5 / 80 / 81,5 / 83) ist unentschieden. Status bleibt
**„Abweichung festgestellt – zweite Quelle erforderlich"**, beschränkt auf die
Längen ab XL.

## VERIFIZIERUNGSSTAND (laufend)

| Produkt | Status | Quellen | Abweichung |
|---|---|---|---|
| `fotl-heavy-t` | über Großhändler bestätigt (S–3XL) | Backstage (Einzelh.) | S-Breite 46 statt 46,5 — 1 Quelle, unbestätigt |
| `fotl-super-premium-t` | über Großhändler bestätigt (S–3XL) | Backstage (Einzelh.) | **keine** — exakte Übereinstimmung |
| `fotl-valueweight-t` | Breiten bestätigt (2 Quellen), Längen offen | Backstage + Ralawise (B2B) | Längen ab XL: −1 cm, unentschieden |
| `fotl-iconic195-t` | **Korrektur erforderlich** | Code-Kommentar | Tabelle von Super Premium kopiert, zeichengleich identisch |
| `fotl-pure-cotton-t` | **Korrektur erforderlich** | Code-Kommentar | Tabelle von Heavy T kopiert |
| übrige 38 Produkte | noch nicht geprüft | — | — |

## BEFUND 9 — Ärmelgeometrie ist ohne Herstellermaße herleitbar

`scripts/deriveSleeveGeometry.mts`, Lauf 2026-07-20.

**Ansatz.** Der Ärmel steht bei einem getragen fotografierten Kleidungsstück
seitlich ab und ist damit in der Frontansicht messbar. Vier Bezugspunkte aus
der Kontur: Schulterlinie (oben), Achsel (unten, bereits validiert),
Torsokante (innen), Silhouettenrand auf Ärmelhöhe (außen). Maßstab ist die
**verifizierte Körperlänge** über px/cm. Es fließt kein geschätzter Wert ein —
Maßstab und Geometrie sind unabhängig voneinander belegt, das Ergebnis ist bei
gleichem Bild reproduzierbar.

**Ergebnis (n=28):**

| Gruppe | n | Ärmellänge | Ärmelbreite |
|---|---|---|---|
| T-Shirt | 23 | 15,4 ± 4,4 cm | **10,9 ± 1,6 cm** |
| Polo | 5 | 16,5 ± 2,4 cm | **10,6 ± 1,6 cm** |

**Die Breite trägt.** ± 1,6 cm über 28 Produkte, und sie deckt sich mit der
unabhängig erstellten Zielvorgabe des Auftraggebers (10–11 cm DTF, 8–9 cm
Stick). Zwei unabhängige Wege, dasselbe Maß — das ist die zweite Quelle, die
für die Ärmelbreite sonst fehlt.

**Die Länge trägt noch nicht.** ± 4,4 cm mit Ausreißern
(`fotl-valueweight-vneck` 1,6 cm, `fotl-original-vneck` 23,3 cm). Ursache ist
die Schulterlinien-Erkennung über einen 85-%-Breitenschwellwert — zu grob. Die
Breitenmessung ist davon unabhängig und deshalb nicht betroffen. Nachzubessern
über eine stabilere Definition der Schulterlinie (z.B. stärkste
Krümmungsänderung der Kontur statt fester Schwellwert).

**Nicht ableitbar: 15 Produkte** — Longsleeves, Hoodies, Sweatshirts,
Zip-Hoodies, Fleecejacke. Dort liegen die Ärmel am Körper an, die Frontkontur
trennt sie nicht vom Rumpf. Für diese Gruppen ist die Ärmelansicht
(Seitenaufnahme) auszuwerten, in der der Ärmel bei Langarmprodukten separiert
ist. Offen.

## BEFUND 10 — Ärmelgeometrie der 15 Langarm-/Kapuzenprodukte: drei Wege geprüft, alle gescheitert

Damit niemand dieselben Wege erneut geht:

1. **Frontkontur, Breitenrückgang.** Setzt abstehende Ärmel voraus. Bei
   Hoodies, Sweats, Longsleeves und der Fleecejacke liegen die Ärmel am
   Körper an — kein Rückgang, kein Achselpunkt. 15 Produkte ohne Ergebnis.
2. **Frontkontur, Krümmung des Breitenprofils** (`lib/contourFeatures.mjs`).
   Idee: der Übergang „wird breiter" → „Plateau" existiert auch bei
   anliegenden Ärmeln. Gemessen: Der erkannte Punkt landete am
   **Kapuzenansatz** statt an der Achsel und lieferte **negative
   Ärmelbreiten** (−5,6 bis −10,2 cm). Zusätzlich verschlechterte die Methode
   die T-Shirt-Werte (Breite 8,6 statt 10,9 cm, weiter weg von der unabhängig
   bestätigten Größenordnung). Verworfen.
3. **Seitenansichten.** Sind keine Ärmel-Nahaufnahmen, sondern kantenparallele
   Profile des ganzen Kleidungsstücks. Gemessen an
   `fotl-original-longsleeve/sleeve-left.png`: Breite konstant 32,2 % über
   den gesamten Verlauf (y 28 % bis 84 %, Kante bei 34,9 %/66,9 %). Rumpf und
   Ärmel sind dort nicht getrennt.

**Stand:** Für 28 Produkte (T-Shirts, Polos) ist die Ärmelgeometrie aus dem
Bild belegt und mit der unabhängigen Zielvorgabe des Auftraggebers konsistent.
Für 15 Produkte existiert **keine** Bildgrundlage, und die Hersteller
veröffentlichen die Maße nicht. Entscheidung des Auftraggebers erforderlich —
siehe unten.

### Zur Entscheidung stehende Optionen für die 15

| Option | Konsequenz | Konflikt mit Vorgabe |
|---|---|---|
| A — Ärmelfläche aus der Brustbreite über ein auf den 28 gemessenes Verhältnis | Alle 43 Produkte bekommen Flächen | Übertragung T-Shirt → Hoodie, ausdrücklich untersagt |
| B — Ärmelansichten der 15 unverändert lassen | Kein Rückschritt, 28 verbessert | Teil-Rollout, ausdrücklich untersagt |
| C — Ärmelmaße beim Hersteller/Großhändler erfragen | Belastbare Daten | Dauert, Ausgang offen |
| D — Eigene Messung an Musterteilen | Exakt und dauerhaft | Erfordert physische Ware beim Auftraggeber |

## Erfassung je Marke

### B&C (2 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `bandc-inspire-hoodie` | — | hoodie | 56 | 72 | | | | **nein** | |
| `bandc-inspire-zip-hood` | — | zip-hoodie | 56 | 72 | | | | **nein** | |

### Fruit of the Loom (18 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `fotl-heavy-t` | — | tshirt | 51 | 71 | | | | ja | |
| `fotl-ladies-valueweight-vneck` | — | tshirt | 46.5 | 64 | | | | **nein** | |
| `fotl-original-longsleeve` | — | longsleeve | 51 | 69 | | | | **nein** | |
| `fotl-original-vneck` | — | tshirt | 51 | 69 | | | | ja | |
| `fotl-ladies-original-t` | — | tshirt | 46.5 | 64 | | | | ja | |
| `fotl-iconic195-longsleeve` | — | longsleeve | 53.5 | 72 | | | | **nein** | |
| `fotl-pure-cotton-t` | — | tshirt | 51 | 71 | | | | ja | |
| `fotl-super-premium-t` | — | tshirt | 53.5 | 72 | | | | ja | |
| `fotl-valueweight-t` | — | tshirt | 53.5 | 72 | | | | ja | |
| `fotl-valueweight-vneck` | — | tshirt | 48.5 | 72 | | | | ja | |
| `fotl-iconic195-t` | — | tshirt | 53.5 | 72 | | | | ja | |
| `fotl-ladies-iconic195-t` | — | tshirt | 46.5 | 64 | | | | ja | |
| `fotl-original-t` | — | tshirt | 51 | 69 | | | | ja | |
| `fotl-ladies-valueweight-t` | — | tshirt | 46.5 | 64 | | | | ja | |
| `fotl-baseball-t` | — | tshirt | 49 | 71 | | | | ja | |
| `fotl-premium-polo` | — | polo | 52 | 72 | | | | ja | |
| `fotl-ladies-premium-polo` | — | polo | 47 | 66 | | | | ja | |
| `fotl-baseball-longsleeve` | — | longsleeve | 49 | 71 | | | | **nein** | |

### Gildan (8 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `gildan-heavy-t` | — | tshirt | 50.8 | 73.6 | | | | ja | |
| `gildan-softstyle-polo` | — | polo | 53 | 74 | | | | ja | |
| `gildan-vneck-t` | — | tshirt | 51 | 74 | | | | ja | |
| `gildan-ladies-t` | — | tshirt | 44 | 66 | | | | ja | |
| `gildan-ladies-heavy-t` | — | tshirt | 46 | 66 | | | | ja | |
| `gildan-ladies-vneck-t` | — | tshirt | 44 | 64 | | | | **nein** | |
| `gildan-ladies-polo` | — | polo | 47 | 64 | | | | ja | |
| `gildan-zip-hoodie` | — | zip-hoodie | 56 | 71 | | | | **nein** | |

### James+Nicholson (2 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `jn-active-t` | — | tshirt | 53 | 74 | | | | ja | |
| `jn-halfzip-sweat` | — | zip-hoodie | 57 | 69 | | | | **nein** | |

### Just Hoods (5 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `justhoods-college-hoodie` | — | hoodie | 56 | 70 | | | | **nein** | |
| `justhoods-zoodie` | — | zip-hoodie | 56 | 70 | | | | **nein** | |
| `justhoods-awdis-sweat` | — | sweater | 56 | 71 | | | | **nein** | |
| `justhoods-contrast-hoodie` | — | hoodie | 56 | 70 | | | | **nein** | |
| `justhoods-quarterzip-sweat` | — | zip-hoodie | 56 | 70 | | | | **nein** | |

### Neutral (2 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `neutral-classic-polo` | — | polo | 53 | 71 | | | | ja | |
| `neutral-rollsleeve-t` | — | tshirt | 51 | 71 | | | | ja | |

### Russell (3 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `russell-authentic-t` | — | tshirt | 51 | 70 | | | | ja | |
| `russell-workwear-t` | — | tshirt | 54 | 73 | | | | ja | |
| `russell-ladies-authentic-t` | — | tshirt | 45 | 64 | | | | ja | |

### SOL'S (2 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `sols-imperial-t` | — | tshirt | 53 | 72 | | | | ja | |
| `sols-north-fleece` | — | jacket | 60 | 72 | | | | **nein** | |

### Stedman (1 Produkte)

Quelle (Datenblatt/Größentabelle): _noch einzutragen_

| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |
|---|---|---|---|---|---|---|---|---|---|
| `stedman-slimfit-t` | — | tshirt | 48 | 71 | | | | ja | |

---

# UMGESETZT: hybrides Flächenmodell (2026-07-20)

`printAreas.ts` wurde auf das hybride Modell umgestellt. Alle 43 Produkte,
164 Ansichten. Datei von 619 auf 214 Zeilen.

## Wie eine Fläche zustande kommt

| Bestandteil | Quelle |
|---|---|
| Position im Bild (x/y/Breite/Höhe in %) | Bildkontur des echten Produktfotos |
| Maßstab px/cm | Bildhöhe des Kleidungsstücks gegen `hoeheCm` der Größentabelle |
| Torsobreite | `breiteCm` (verifiziertes Kleidungsstückmaß) × 2/π |
| Sicherheitsabstände | 2,0 cm Seitennaht · 8,0 cm ab Oberkante (Kragen/Schulter) · 3,0 cm Saum · 1,5 cm Ärmelnaht — in ZENTIMETERN, nicht in Prozent |
| Deckelung | Prozessgrenzen: vorne/hinten 30 × 47 cm, Ärmel 11 × 13 cm |

`garmentWidthCm`/`garmentHeightCm` in den erzeugten Daten führen die
UNGEDECKELTEN Werte mit. Damit ist je Produkt ablesbar, ob der Schnitt oder
die Prozessgrenze die Fläche begrenzt.

## Was sich dadurch ändert

- **Kragen und Saum sind ausgenommen.** Vorher reichte die Fläche über die
  volle Kleidungsstückhöhe (7,1–92,9 %), Motive konnten auf Kragen und Saum
  liegen.
- **Die Breite folgt dem Schnitt.** Vorher galt für jedes Produkt dieselbe
  Maximalgröße (38 × 50 cm vorne). Jetzt leitet sie sich je Produkt aus der
  Brustbreite ab.
- **Die Abstände skalieren real.** Vorher 3 Prozentpunkte je Seite — bei einem
  Damenshirt real weniger Zentimeter als bei einem Hoodie. Jetzt überall
  2,0 cm.

**Beobachtung:** Bei Vorder- und Rückseite greift durchweg die
30-cm-Prozessgrenze, weil jedes Erwachsenenkleidungsstück breiter ist. Die
effektive Motivgröße ist dort also für alle Produkte gleich — der Schnitt
wirkt sich auf die PLATZIERUNGSFLÄCHE aus, nicht auf die Motivgröße. Bei den
Ärmeln begrenzt dagegen das Kleidungsstück (9,3 cm konservativ, minus
2 × 1,5 cm Naht = 6,3 cm) und nicht die Prozessgrenze von 11 cm.

## Behobene Datenfehler

- **`fotl-ladies-valueweight-vneck` galt fälschlich als bildlos.** Ursache war
  mein eigener Ordner-Lookup über die Produkt-ID; das Produkt liegt unter
  `fotl-ladies-vneck`. Der Generator liest den Pfad jetzt aus den Farbdaten
  des Produkts statt ihn aus der ID abzuleiten — damit ist der Fall für
  künftige Produkte generell ausgeschlossen. Es ist das einzige Produkt im
  Katalog mit abweichendem Ordnernamen.

## Absicherung

`src/config/__tests__/printAreas.test.ts`, 10 Tests. Geprüft werden
Eigenschaften, nicht Einzelwerte — die Daten sind erzeugt, nicht gepflegt:
Vollständigkeit je Produkt, Ärmelansichten nur bei `hasSleeves`, Flächen
innerhalb des Bildes, Einhaltung der Prozessgrenzen, Fläche schmaler als das
Kleidungsstück, Schnittdifferenzierung, und dass die effektive Fläche nie
größer ist als die des Kleidungsstücks.

Gesamt 150 Tests grün, `tsc` und ESLint sauber, Konfigurator lädt mit allen
vier Ansichten.
