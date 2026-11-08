# Mehrzeilige Texte in der Vorschau und Text als JPG

Stand: 2026-11-08 · Anlass: Bestellung ER-2026-F5EE03

## Anlass

Ein Hoodie mit Text auf der Rückseite: Die Kundschaft hatte im Editor **zwei Zeilen**
gewählt („Team“ ⏎ „Schüplitz“, Impact, fett, kursiv). Die Bestelldaten waren richtig –
Text samt Zeilenumbruch, Schrift, Größe, Farbe, Position und der Preis (37,99 € je Stück
bei Vorder- und Rückseite, 2 Stück) stimmten. Falsch war die **Darstellung**:

1. Vorschau-Bild und Produktionsblatt zeigten „Team Schüplitz“ auf **einer** Zeile. Ein
   einzelnes SVG-`<text>` behandelt einen Zeilenumbruch wie ein Leerzeichen.
2. „Kursiv“ ging bei Impact verloren: Die Ersatzschrift Anton hat nur einen Schnitt, der
   Browser im Editor stellt Impact trotzdem schräg dar.
3. Die Admin-Seite fasste den Umbruch ebenfalls zusammen. (Die Mail an den Betreiber hat dasselbe Problem; ihre Korrektur liegt in der Mail-Vorlage und kommt mit dem Stickerei-Paket.)

Dazu der Wunsch: **Den Text als JPG-Datei speichern bzw. herunterladen** – und zwar so, dass er
direkt in eine **DTF-Bestellung** übernommen werden kann. Dafür gibt es neben dem JPG ein **PNG mit
transparentem Hintergrund** (ein JPG-Hintergrund würde im DTF-Druck mitgedruckt).

## Was geändert wurde

| Bereich | Änderung |
| --- | --- |
| Vorschau/Produktionsblatt | `lib/rendering/svgScene.ts`: jede Zeile ein eigenes `<text>`, der Zeilenblock sitzt wie bei Konva (`verticalAlign=middle`) mittig, Abstand = `lineHeight × Schriftgröße`. Einzeiliger Text bleibt Zeichen für Zeichen wie vorher. |
| Kursiv | Fehlt der Ersatzschrift ein Kursiv-Schnitt (nur Anton), wird die Zeile um 14° geschert (`fonts.ts::hatEchtenSchnitt`). Alle anderen Schriften unverändert. |
| Gemeinsamer Maßstab | `lib/rendering/ansichtGrundlage.ts` – aus `renderPrintView.ts` herausgelöst; Vorschau und Text-Download rechnen exakt gleich. Geprüft: Vorschau-Bilder einzeiliger Texte sind vorher/nachher Byte für Byte gleich – außer „Impact + kursiv“, wo die Schrägstellung bewusst neu dazukommt. |
| Text-Download | `lib/rendering/renderTextJpg.ts`, Route `GET /api/admin/bestellungen/[id]/texte/[elementId]`; jeder Text steht im Block **„Kundendateien“** wie ein Logo (Vorschaubild, Bezeichnung, „Herunterladen“ = PNG, „Als JPG“), außerdem liegen die Texte als PNG im **ZIP „Alle Kundendateien“**; zusätzlich Links an jedem Text in der Personalisierung. |
| Neu erzeugen | Knopf „Vorschau & Produktionsblatt neu erzeugen“ (`orderCompletion.ts::erzeugeProduktionsunterlagenNeu`) für bestehende Bestellungen. Verschickt nichts. |
| Anzeige | Die Admin-Seite zeigt Zeilenumbrüche; „2 Zeilen“ als Hinweis. |

## PNG für DTF und JPG

* **PNG (`?format=png`)** – für die DTF-Bestellung: transparenter Hintergrund, nur die Schrift trägt
  Farbe; dieselbe Größe und dieselbe Auflösung wie das JPG; die 300 dpi stehen im pHYs-Block, damit
  Grafikprogramme und Druckdienste die echte Druckgröße lesen (ohne ihn gelten meist 72 dpi).
* **JPG** – wie gewünscht; hat immer einen Hintergrund (weiß, bei sehr heller Schrift ohne Kontur
  dunkelgrau).
* Zeilen im Text beginnen – wie im Editor – an der **oberen** Kante der gespeicherten Box (nicht
  mittig); ein zweizeiliger Text saß in der Vorschau sonst rund 1 cm höher als im Editor.

## Wo der Text steht (wie das Logo)

* **Kundendateien** (Admin-Bestellseite): Der Text hat dort eine eigene Zeile wie das Logo – Miniatur, „Text 1 · „…““, `PNG, transparent · 300 dpi`, Knopf **Herunterladen** (PNG, die Datei für die DTF-Bestellung) und darunter **Als JPG**. Beide zählen je Position und Ansicht neu ab 1, erst die Logos, dann die Texte.
* **ZIP „Alle Kundendateien herunterladen“:** enthält je Text ein PNG (`Position-1_College_Hoodie_Ruckseite_Text-1.png`, benannt wie die Logos). Lässt sich ein Text nicht erzeugen, bricht das ZIP nicht ab, sondern nennt ihn in `FEHLENDE_DATEIEN.txt`. Das Limit von 300 Dateien gilt für Logos und Texte zusammen.
* **Miniatur:** `?vorschau=1` liefert ein kleines JPG (72 dpi, rund 40 KB) und darf der Browser fünf Minuten privat behalten; die Downloads werden nie zwischengespeichert. Die Bilder laufen bewusst nicht über den Bildoptimierer von Next (er riefe die geschützte Route ohne Anmeldung ab).

## Die JPG-Datei

* **Inhalt:** nur der Text – Schrift, Größe, Farbe, fett/kursiv, Ausrichtung, Zeilen,
  Buchstabenabstand, Kontur, Schatten. Unverdreht (die Drehung steht in den Bestelldaten
  und gehört beim Auflegen aufs Textil, nicht in die Datei), eng zugeschnitten mit
  0,25 cm Rand.
* **Größe:** Druckgröße bei **300 dpi**; das dpi-Feld im JFIF-Kopf stimmt, Grafikprogramme
  öffnen die Datei in der echten Größe. Bei extrem großem Text (> 12.000 px Kante) sinkt
  die Auflösung statt die Datei ins Uferlose wachsen zu lassen; die tatsächliche
  Auflösung steht dann im Kopf.
* **Hintergrund:** weiß. Ist die Schrift so hell, dass sie auf Weiß verschwände (helle
  Füllung **und** keine gut sichtbare Kontur), liegt ein dunkelgrauer Grund (#333333)
  darunter, sonst wäre die Datei scheinbar leer. JPG kennt keine Transparenz.
* **Schrift:** wie in der Produktionsvorschau die gebündelten freien Ersatzschriften
  (Impact → Anton, Arial → Arimo …), siehe `lib/rendering/fonts.ts`. Das ist eine
  Annäherung, kein Ersatz für die Original-Schrift in der Druckvorstufe. „Fett“ wird bei
  Impact/Anton nicht zusätzlich verstärkt (die Schrift ist ohnehin sehr kräftig; der
  Browser im Editor verstärkt sie künstlich leicht).
* **Entsteht beim Klick** aus den gespeicherten Bestelldaten, nichts wird abgelegt.
  `?ansicht=1` zeigt das Bild im Browser statt es herunterzuladen.
* **Dateiname:** `ER-2026-F5EE03_Position-1_Rueckseite_Text-1.jpg`.
* **Absicherung:** Admin-Sitzung bei jedem Aufruf; das Element muss zur Bestellung der
  Adresse gehören (sonst 404).

## Bestehende Bestellungen korrigieren

Vorschau-Bilder und Produktionsblatt werden beim Bestellabschluss einmal erzeugt und
bleiben dann liegen – eine Korrektur der Darstellung ändert sie nicht rückwirkend. Auf der
Admin-Detailseite erzeugt **„Vorschau & Produktionsblatt neu erzeugen“** beides aus den
gespeicherten Daten neu.

* Das Produktionsblatt wird nur ersetzt, wenn **alle** Vorschauen neu erzeugt werden
  konnten (z. B. nicht, wenn eine Logo-Datei per DSGVO-Löschung fehlt) – sonst bliebe ein
  Blatt mit fehlenden Bildern anstelle des vollständigen älteren.
* **Reihenfolge beachten:** erst neu erzeugen, dann „Vorschau zur Freigabe senden“. Eine
  bereits versendete Freigabe-Mail zeigt weiterhin das alte Bild.
* Es werden keine E-Mails verschickt, keine Bestelldaten geändert.

## Tests

* `lib/rendering/__tests__/svgScene.test.ts` – Zeilen, Abstände, Ausrichtung, Kursiv,
  Textszene; einzeiliger Text als wörtlicher Vergleich (ändert er sich, ändern sich die
  Bilder bestehender Bestellungen).
* `lib/rendering/__tests__/renderTextJpg.test.ts` – mit dem echten Renderer: zwei Zeilen
  sind zwei getrennte Zeilen, 300 dpi im Kopf, Maßstab gleich der Vorschau, Rand, Farbe,
  heller Text, Schatten/Kontur nicht abgeschnitten, Riesentext.
* `lib/admin/__tests__/textDownload.test.ts` – Laden gegen Netz-Attrappe, **fremde
  Bestellung → nichts**, Route/Aktion nur für Admins, nichts wird versendet.
* `components/admin/__tests__/textAnzeige.test.ts` – Text-Zeilen in den Kundendateien (Zählung, PNG als Hauptknopf, Miniatur, ZIP-Hinweis).
* ZIP-Einträge und echte PNG-Dateien (RGBA, 300 dpi) sowie Fehlerfälle in `textDownload.test.ts`.

## Neue Abhängigkeit

`jpeg-js` 0.4.4 (BSD-3-Clause, reines JavaScript, ohne weitere Abhängigkeiten, 76 KB).
Bewusst kein `sharp`: Es ist nur Entwicklungsabhängigkeit und bringt eine native Binärdatei
mit, deren Verhalten auf dem Server sich lokal nicht prüfen lässt. `jpeg-js` wird nur vom
Text-Download genutzt (Kodieren, nicht Dekodieren).
