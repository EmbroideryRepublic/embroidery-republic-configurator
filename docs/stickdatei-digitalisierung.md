# Stickdatei (DST, PES, JEF) aus der Bestellung

Im Admin, Bereich „Personalisierung“, hat jedes Text- und Logo-Motiv einer **Stickerei-Position** diese Knöpfe:

| Knopf | Was passiert |
| --- | --- |
| **Weißen Hintergrund entfernen** (Schalter, nur Logos) | **An** (Standard): nur das Motiv wird gestickt, ein einfarbiger Hintergrund am Bildrand (meist weiß) bleibt weg. **Aus**: das Original des Kunden wird unverändert gestickt, ein deckender Hintergrund wird als **eigene Garnfarbe mitgestickt** (deutlich mehr Stiche). DST, PES, JEF, Vorschau und „Prüfen“ folgen dem Schalter; der Browser merkt sich die Wahl je Motiv. |
| **DST** | Lädt die fertig digitalisierte Datei im Tajima-Format (Tajima, Barudan, ZSK, SWF, Happy und viele weitere Industriemaschinen). |
| **PES** | Dieselbe Stickerei für Brother, Babylock und Bernina (Brother-Reihe). |
| **JEF** | Dieselbe Stickerei für Janome. |
| **Stickvorschau** | Zeigt die Stichfolge als Bild: Garnlinien in Garnfarbe, Sprünge rot gestrichelt. |
| **Prüfen** | Nennt Größe, Stichzahl, Sprünge, Fadenschnitte, Garnfarben (mit Brother-/Janome-Entsprechung) und **wo das Motiv an Grenzen stößt**. |

Alle drei Dateien enthalten dieselbe Stichfolge mit denselben Fadenschnitten. Sie entstehen auf Abruf aus den gespeicherten
Bestelldaten (Schrift, Größe, Farbe, Zeilenumbrüche bzw. das gespeicherte Logo in der gewählten Größe und Drehung). Es wird nichts
gespeichert; ein späterer Abruf liefert dieselben Dateien (im JEF-Kopf steht das Abrufdatum).
Die Route `/api/admin/bestellungen/<id>/stickdatei/<elementId>[?format=dst|pes|jef]` prüft bei jedem Aufruf die Admin-Sitzung.

## Warum Stichdateien und nicht „Vektor“

Eine Stickmaschine liest keine Bilder (JPG/PNG) und keine Vektoren (SVG/AI), sondern eine **Stichdatei**: die Folge der
Nadeleinstiche mit Sprüngen, Fadenschnitten und Farbwechseln. DST, PES und JEF sind die drei verbreitetsten Maschinenformate.

## Was die automatische Digitalisierung macht

- Text: eine Garnfarbe (die Schriftfarbe), Form aus der gerasterten Schrift (10 Bildpunkte je Millimeter). Schatten und Kontur
  sind Druckeffekte und werden nicht gestickt.
- Logo: einfarbiger Hintergrund wird entfernt (abschaltbar, siehe Schalter oben), Farben werden zu höchstens 6 Garnfarben
  zusammengefasst (Farbwechsel stehen in den Dateien). Bei Schalter „an“ dient das **Anzeigebild** des Kunden als Quelle (ggf. schon
  vom Kunden freigestellt) und es folgt die automatische Randentfernung; bei „aus“ das **Original** (vor jeder Hintergrundentfernung).
  Route: `?hintergrund=aus` (Standard `an`).
- Füllung (Tatami) mit 0,4 mm Reihenabstand, Stichlänge höchstens 3,5 mm mit versetzten Einstichen, Richtung 45° bzw. quer zu
  dünnen Strichen.
- Unterlage bei breiten Flächen, Zugkompensation 0,15 mm, Sicherungsstiche am Anfang/Ende jeder Naht.
- **Wenig Sprünge:** Zwischen zwei Reihen läuft die Naht bis zu 25 mm durch die Fläche weiter, statt zu springen und den Faden zu
  schneiden (Beispiel „TEAM Schüplitz“: 25 statt 267 Sprünge).
- **Fadenschnitte:** Vor jedem Sprung ab 3 mm mitten in einer Farbe schneidet die Maschine den Faden ab – es bleibt kein
  Verbindungsfaden zwischen den Buchstaben. Am Farbanfang schneidet der Farbwechsel selbst. DST trägt den Schnitt als drei
  Sprünge (Tajima-Konvention), PES als Sprung mit Schnittkennung, JEF als drei Sprünge ohne Versatz.
- **Kleine Punkte** (i-Punkt, Umlautpunkte, Satzzeichen, Kantenlänge bis 2,5 mm) werden nie weggelassen: Sie bekommen eine eigene
  dichte Kleinfüllung, bei winzigen Punkten (unter etwa 0,5 mm) einen Stern aus drei Linien.
- **Garnfarben:** PES und JEF tragen je Farbe den nächstliegenden Platz der Standardpalette der Maschine (Brother 64 Farben,
  Janome 78 Farben); zwei aufeinanderfolgende Farben bekommen nie denselben Platz. DST kennt keine Garnfarben, nur Farbwechsel:
  Dort ordnest du die Garne an der Maschine zu (Reihenfolge siehe Vorschau/„Prüfen“).

## Grenzen – ehrlich

Automatisches Digitalisieren ersetzt **kein von Hand digitalisiertes Motiv** für Serien- oder Qualitätsware. Es spart die Handarbeit
für den Regelfall. Das „Prüfen“ nennt ausdrücklich:

- **Linien dünner als etwa 0,8 mm** (z. B. dünne Schrift in kleiner Größe) lassen sich nicht sauber sticken.
- **Sehr kleine Motive** (unter etwa 4 mm Höhe): Buchstaben werden unsauber.
- **Fotos und Verläufe** sind nicht geeignet.
- Motive über **300 mm** Kantenlänge und über **150.000 Stiche** werden abgelehnt.
- Die Werte (Dichte, Unterlage, Zugkompensation) sind Richtwerte und hängen von Stoff und Garn ab: Ein dicker Hoodie-Fleece
  verträgt mehr Unterlage als ein dünnes Polo. **Vor der Serie einmal auf Probestoff sticken.**
- Gedrehte Motive werden so gestickt, wie der Kunde sie platziert hat.
- Die Vorschaubilder im PES-Kopf (Maschinenanzeige) sind einfache Strichzeichnungen des Motivs.

## Geprüft und nicht geprüft

Geprüft (automatische Tests): DST-Kodierung für jeden Versatz von −121…+121 in beiden Achsen; für **alle drei Formate** das
Zurücklesen mit je einem **eigenen, unabhängig geschriebenen Leser** (Position, Art und Reihenfolge jedes Stichs, Sprungs,
Fadenschnitts und Farbwechsels stimmen exakt mit dem Stickplan überein); PES-Kopf, Längenfeld des Stichblocks und Vorschaubilder;
JEF-Kopf, Offset und Punktzahl; Schrittgrenzen und lange Wege; Fadenschnitt nur bei langen Sprüngen; Garnpaletten; Form der
Füllung; Hintergrundentfernung und Farbzerlegung bei Logos; Ablehnung zu großer Motive; Erhalt kleiner Punkte; Admin-Schutz der Route.

Die Formate sind nach der Referenzimplementierung **pyembroidery** (MIT-Lizenz) aufgebaut, deren Quelltext als Format-Beschreibung
gelesen wurde (die Bibliothek selbst wurde nicht ausgeführt); die Palettentabellen stammen von dort.

**Nicht geprüft:** ein Probelauf an einer echten Stickmaschine und das Öffnen in fremder Stick-Software (Brother PE-Design, Janome
Digitizer, Wilcom, Embird). Das ist ohne Gerät nicht möglich und sollte mit der ersten echten Datei erfolgen. Falls eine Maschine
eine der Dateien ablehnt: Format und Fehlermeldung nennen, dann lässt sich der Schreiber gezielt anpassen.

## Code

- `src/lib/embroidery/digitalisieren/` – Raster, Füllung, Stickplan (mit Wegsuche), Befehlsfolge (`befehle.ts`),
  Formate (`dst.ts`, `pec.ts`/`pes.ts`, `jef.ts`, `formate.ts`), Garnpaletten, Stickvorschau
- `src/lib/admin/stickdatei.ts` – lädt Text/Logo aus der Bestellung und digitalisiert
- `src/app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts` – Download (`?format=`), `?vorschau=1`, `?info=1`
- `src/components/admin/StickdateiKnoepfe.tsx`, `ProductionPreview.tsx` – Knöpfe
