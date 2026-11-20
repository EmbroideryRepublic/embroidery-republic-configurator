# Druckfläche aus der Größentabelle und echte Motivmaße (DTF)

Stand: 2026-11-20. Gilt für **DTF auf Vorder- und Rückseite**. Stickerei und alle übrigen Ansichten (Ärmel) sind unverändert.

## Warum

Die Fläche im Konfigurator war auf 30 cm Breite gedeckelt (Prozessgrenze der Registry), obwohl die Brustbreite je Größe 46–57 cm beträgt
(Hoodie Größe M: 56 cm). Außerdem rechnet der Konfigurator Pixel mit **einem** Maßstab in Zentimeter um, der aus der Höhe stammt. Die Fotos
zeigen die Brust gewölbt, die gezeichnete Breite ist deshalb nur die **Projektion**. Ein Motiv, das im Bild 30 cm breit aussieht, ist auf dem
flachen Textil rund 35 cm breit. Bestellt wurde nach dem gezeichneten Maß, also zu klein.

## Wie es jetzt gerechnet wird

1. **Fläche je Produkt und Größe aus der Größentabelle:** nutzbare flache Breite = Brustbreite − 2 × 2 cm Naht, keine feste Obergrenze.
   Das Foto zeigt die Brust gewölbt, die gezeichnete Breite dazu ist `p = 2·r·sin(w / 2r)` mit `r = Brustbreite / π`.
   Die Fläche liegt zusätzlich innerhalb der Fotokontur bzw. der von Hand abgelesenen Torsokanten (`BEREICH_KORREKTUR`), mit 0,4 cm Puffer.
   Höhe unverändert (Größentabelle − Kragen − Saum, höchstens 47 cm).
   **Fehlende Größen:** Hersteller führen oft nur XS, M, XL, 3XL. Die übrigen Größen bekommen Brustbreite und Länge durch Interpolation
   zwischen den Nachbarn auf der Größenleiter, am Rand durch Fortschreiben der letzten Stufe (bei Tabellen mit nur einer Zeile über die Stufung
   eines Produkts derselben Art). Jede der 1.229 Größen im Katalog hat damit eine eigene Fläche, keine fällt auf M zurück. Nur für die DTF-Datei.
   Das Motiv wird einmal platziert und auf jede bestellte Größe gleich groß gedruckt, das echte Maß gilt deshalb für die **kleinste bestellte
   Größe** (Admin, PDF und Mail nennen sie).
   **Herstellermaße nachgetragen (2026-11-20):** 19 importierte Produkte hatten keine eigene Tabelle (ein Damenshirt lieh sich die Tabelle eines
   Herrenshirts), zwei nur eine Zeile. Ihre Tabellen stammen jetzt von der Lieferantenseite (Dialog „Größentabelle“: A = Breite über die Brust,
   B = Länge, Richtwerte ±2 cm), Quelle und Abrufdatum je Produkt in `scripts/import/masse-nachtrag.json`, eingespielt mit
   `scripts/masseNachtragen.mts` (idempotent). Ohne Tabelle bleiben `russell-ladies-pure-organic-heavy-tee` (bei keinem Lieferanten gelistet) und
   `id-identity-microfleece-jacke` (Seite ohne Maßtabelle). Folge: Auch die Ursprungsdaten (Stickerei-Flächen) dieser 19 Produkte ändern sich, weil
   ihre Eingangsmaße jetzt die eigenen sind; die Stickerei-Berechnung selbst ist unverändert.
2. **Echtes Maß = Abwicklung:** Breite `r · (asin((x₂ − mitte) / r) − asin((x₁ − mitte) / r))`, Höhe wie gezeichnet. Implementiert in
   `src/config/abwicklung.ts`, abgeleitet beim Lesen (`src/config/echteMasse.ts`), **nichts davon wird gespeichert oder vom Client übernommen**.
3. **Preis:** Großformat-Zuschlag nach den Folienkosten des Motivs (`src/config/pricing/grossformat.ts`), berechnet mit den echten Maßen,
   serverseitig autoritativ (`serverPricing.ts`). Der DTF-Positionspreis (`DTF_POSITION_TIERS`) bleibt unverändert, weil die Stickerei ihn mitnutzt.

## Wo die echten Maße erscheinen

Editor (Maßlabel am Motiv, Lineal, „Motiv max.“, Werkzeugleiste), Auflösungsampel (dpi aus der echten Breite), Produktseite („Veredelungsflächen“),
Admin-Bestelldetail, Produktionsblatt (PDF), interne Bestell-Mail. Überall steht das echte Maß, in Admin, PDF und Mail zusätzlich das im Foto gezeichnete.

## Daten neu erzeugen

```bash
npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts
```

Erzeugt `src/config/printAreaData.generated.ts` (Stickerei und Ursprungsdaten, **muss byte-gleich bleiben**) und
`src/config/printAreaDataDtf.generated.ts` (DTF-Torsoflächen). Reproduktionsprüfung mit `PRINTAREA_OUT=… PRINTAREA_DTF_OUT=…` (schreibt nicht in `src/`).

## Grenzen des Modells (ehrlich)

- Zylinder-Näherung, keine Messung am einzelnen Kleidungsstück. Gemessen: sichtbare Torsobreite / flache Brustbreite = 0,6575 ± 0,042
  (Zylinder 0,6366). Am Rand der Brust reagiert die flache Breite stark auf Bruchteile eines Zentimeters (1 cm gezeichnet ≈ 4 cm echt).
- Bei 27 von 163 Modellen (schmale Fotos, hängende Ärmel, Handkorrektur) begrenzt das Foto die Fläche auf unter 80 % dessen, was die Größentabelle erlaubt.
- Die Höhe wird nicht umgerechnet. Das echte Motiv ist damit breiter im Verhältnis zur Höhe als im Foto. Wer das Seitenverhältnis der Datei
  behalten will, skaliert nach der Breite und prüft die Höhe gegen die Fläche.
- Die Datei „PNG für DTF“ / „JPG“ (Text-Download) trägt noch die gezeichnete Größe im Dichte-Feld.
- Bestehende Bestellungen und Warenkörbe: Die Fläche ist breiter und symmetrisch um die Brustmitte, die linke Kante rückt um 0,5–2,5 cm nach links.
  Gespeicherte Positionen (`xCm`) beziehen sich auf die alte Kante, ein neu erzeugtes Vorschaubild älterer Bestellungen sitzt dadurch
  um diesen Betrag weiter rechts.
