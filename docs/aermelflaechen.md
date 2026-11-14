# Ärmelflächen (Stand 2026-11-14)

Auftrag des Betreibers: *„Alle Produkte in jeder Ansicht noch einmal durchgehen und die Grenzen richtig ziehen – lieber größere Flächen als zu kleine."*

## Was sich geändert hat

| | vorher | jetzt |
| --- | --- | --- |
| Fläche Kurzarm | Rahmen oft nur über der oberen Ärmelhälfte oder bis unter den Saum auf den Rumpf | von der Armkugel (Schulternaht) bis zum Ärmelsaum, seitlich über den ganzen Ärmel |
| Fläche Langarm / Kapuze | nur die Schulterkappe, ca. 10 × 12 cm | Schulternaht bis ca. 40 cm den Arm hinunter, Breite = Armbreite (z. B. 15 × 39 cm) |
| Motivhöhe am Ärmel | hart auf 10 cm gedeckelt | nur durch die Fläche begrenzt (Registry-Platzhalter 60 cm) |
| Startpunkt eines neuen Motivs | Silhouettenmitte | waagerecht mittig auf dem Ärmel, senkrecht an der berechneten Oberarmmitte, immer innerhalb der Fläche |

Vorder- und Rückseiten sind **unverändert**: Dort begrenzt die Prozessgrenze 30 × 47 cm (`decorationPositions.ts`) die Fläche, nicht die Zeichnung. Wer mehr als 30 × 47 cm drucken kann, ändert genau diesen einen Wert in der Registry und erzeugt die Daten neu.

## Warum von Hand abgelesen

Im Seitenfoto liegen Ärmel und Rumpf ohne Spalt aufeinander; auf dunkler oder weißer Ware trennt keine Formel sie zuverlässig (die berechnete Fläche folgte einem Suchfenster Schulter → Achsel). Deshalb steht je Produkt eine abgelesene Fläche in `scripts/aermelBereiche.json` (`id: [x0, y0, x1, y1]`, Prozent des gesamten Bildes). Der Generator (`scripts/generatePrintAreaData.mts`) übernimmt sie über `BEREICH_KORREKTUR`.

**Regel der Ablesung:** Kurzarm = Armkugel bis Saum; Langarm/Kapuze = Schulternaht bis rund 40 cm hinunter. Im Zweifel größer.

## Rechter Ärmel

Das Foto „Ärmel rechts" ist bei 98 von 101 Produkten die gespiegelte linke Aufnahme (gleiche Maße). Die rechte Fläche wird deshalb **exakt gespiegelt** (`x0' = 100 − x1`, `x1' = 100 − x0`). Pro Produkt gibt es also nur einen abgelesenen Wert.

## Neues Produkt mit Ärmelfoto

1. Fotos importieren, Manifest erzeugen (`scripts/import/ABLAUF.md`).
2. Kontaktbogen mit Gitter erzeugen und die Kanten des linken Ärmels ablesen.
3. In `scripts/aermelBereiche.json` eintragen, Druckflächen neu erzeugen (`generatePrintAreaData.mts`, dauert ca. 4 Minuten).
4. `npm test` – `src/config/__tests__/aermelBereiche.test.ts` prüft Vollständigkeit der Werte, Spiegelung, Mindestgröße (9 × 12 cm) und den Startpunkt.

## Bekannte Grenzen

- Acht Produkte haben nur Vorder-/Rückfotos (z. B. `bundc-inspire-t-women`, `stedman-classic-t-v-neck`); ihre Ärmelzeilen im Datenbestand sind Klassenwerte, der Reiter „Ärmel" erscheint dort nicht.
- Bei den drei Produkten, deren rechtes Foto nicht exakt die Spiegelung ist (`fotl-baseball-t`, `gildan-softstyle-polo`, `neutral-classic-polo`; Abweichung 4–6 %), ist die gespiegelte Fläche eine Näherung.
- Die Kanten sind am Kontaktbogen auf ca. ± 2 % genau abgelesen.
