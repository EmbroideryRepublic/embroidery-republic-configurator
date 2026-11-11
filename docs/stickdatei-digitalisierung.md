# Stickdatei (DST) aus der Bestellung

Im Admin, Bereich „Personalisierung“, hat jedes Text- und Logo-Motiv einer **Stickerei-Position** drei zusätzliche Knöpfe:

| Knopf | Was passiert |
| --- | --- |
| **Stickdatei (DST)** | Lädt die fertig digitalisierte Datei für die Stickmaschine. |
| **Stickvorschau** | Zeigt die Stichfolge als Bild: Garnlinien in Garnfarbe, Sprünge rot gestrichelt. |
| **Prüfen** | Nennt Größe, Stichzahl, Sprünge, Garnfarben und **wo das Motiv an Grenzen stößt**. |

Die Datei entsteht auf Abruf aus den gespeicherten Bestelldaten (Schrift, Größe, Farbe, Zeilenumbrüche bzw. das gespeicherte
Logo in der gewählten Größe und Drehung). Es wird nichts gespeichert; ein späterer Abruf liefert dasselbe Ergebnis.
Die Route `/api/admin/bestellungen/<id>/stickdatei/<elementId>` prüft bei jedem Aufruf die Admin-Sitzung.

## Warum DST und nicht „Vektor“

Eine Stickmaschine liest keine Bilder (JPG/PNG) und keine Vektoren (SVG/AI), sondern eine **Stichdatei**: die Folge der
Nadeleinstiche mit Sprüngen und Farbwechseln. DST (Tajima) ist das gängigste Format – Industriemaschinen (Tajima, Barudan,
ZSK, SWF, Happy …) und viele Heimmaschinen lesen es direkt, jede Stick-Software wandelt es in PES, JEF, EXP usw. um.

## Was die automatische Digitalisierung macht

- Text: eine Garnfarbe (die Schriftfarbe), Form aus der gerasterten Schrift (10 Bildpunkte je Millimeter). Schatten und Kontur
  sind Druckeffekte und werden nicht gestickt.
- Logo: einfarbiger Hintergrund wird entfernt, Farben werden zu höchstens 6 Garnfarben zusammengefasst (Farbwechsel stehen in der Datei).
- Füllung (Tatami) mit 0,4 mm Reihenabstand, Stichlänge höchstens 3,5 mm mit versetzten Einstichen, Richtung 45° bzw. quer zu
  dünnen Strichen.
- Unterlage bei breiten Flächen, Zugkompensation 0,15 mm, Sicherungsstiche am Anfang/Ende jeder Naht, Sprünge zwischen Teilen.
- **Kleine Punkte** (i-Punkt, Umlautpunkte, Satzzeichen, Kantenlänge bis 2,5 mm) werden nie weggelassen: Sie bekommen eine eigene
  dichte Kleinfüllung, bei winzigen Punkten (unter etwa 0,5 mm) einen Stern aus drei Linien.

## Grenzen – ehrlich

Automatisches Digitalisieren ersetzt **kein von Hand digitalisiertes Motiv** für Serien- oder Qualitätsware. Es spart die Handarbeit
für den Regelfall. Das „Prüfen“ nennt ausdrücklich:

- **Linien dünner als etwa 0,8 mm** (z. B. dünne Schrift in kleiner Größe) lassen sich nicht sauber sticken.
- **Sehr kleine Motive** (unter etwa 4 mm Höhe): Buchstaben werden unsauber.
- **Fotos und Verläufe** sind nicht geeignet.
- Motive über **300 mm** Kantenlänge und über **150.000 Stiche** werden abgelehnt.
- DST enthält **keine Garnfarben**, nur Farbwechsel: Die Garnzuordnung erfolgt an der Maschine (Farbreihenfolge steht in der Vorschau).
- Die Werte (Dichte, Unterlage, Zugkompensation) sind Richtwerte und hängen von Stoff und Garn ab: Ein dicker Hoodie-Fleece
  verträgt mehr Unterlage als ein dünnes Polo. **Vor der Serie einmal auf Probestoff sticken.**
- Gedrehte Motive werden so gestickt, wie der Kunde sie platziert hat.

## Geprüft und nicht geprüft

Geprüft (automatische Tests): DST-Kodierung für jeden Versatz von −121…+121 in beiden Achsen, Kopf und Endemarke, Form der Füllung,
Hintergrundentfernung und Farbzerlegung bei Logos, Ablehnung zu großer Motive, Erhalt kleiner Punkte, Admin-Schutz der Route.
Die DST-Dateien wurden mit einem **eigenen, unabhängig rechnenden** Leser zurückgelesen.

**Nicht geprüft:** ein Probelauf an einer echten Stickmaschine und das Öffnen in einer fremden Stick-Software. Das fehlt noch und
sollte mit der ersten echten Datei erfolgen.

## Code

- `src/lib/embroidery/digitalisieren/` – Raster, Füllung, Stickplan, DST-Schreiber/-Leser, Stickvorschau
- `src/lib/admin/stickdatei.ts` – lädt Text/Logo aus der Bestellung und digitalisiert
- `src/app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts` – Download, `?vorschau=1`, `?info=1`
- `src/components/admin/StickdateiKnoepfe.tsx`, `ProductionPreview.tsx` – Knöpfe
