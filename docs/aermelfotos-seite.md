# Ärmelfotos: welche Seite zeigt das Foto?

**Festlegung:** `sleeve-left` zeigt die **linke** Seite des Trägers (Vorderseite des Teils im Bild nach **links**),
`sleeve-right` die **rechte** Seite (Vorderseite im Bild nach **rechts**). "Links" und "rechts" sind immer aus Sicht
der Person gemeint, die das Teil trägt.

## Was war falsch (Fund vom 2026-11-10)

Im Admin stand "Ärmel links" über einem Foto, das den rechten Ärmel zeigt. Der Bildimport hat das Seitenfoto des
Lieferanten unbesehen als `sleeve-left` abgelegt (siehe `scripts/ingestDirect.mts`, `ingestFotlImages.mjs`,
`ingestSpreadshirtProduct.mjs`); `sleeve-right` ist dort oft nur die Spiegelung. Jeder Lieferant hält es anders – bei
Spreadshirt und JustHoods zeigt "links" die Sicht von links auf das Teil, die Vorderseite steht dann im Bild rechts.

Vor der Korrektur widersprach das Foto bei **717 von 1.283** Farbvarianten (101 Produkte) der Bezeichnung. Der Kunde
sah im Konfigurator denselben Widerspruch.

## Was wurde gemacht

`node scripts/aermelSeiten.mjs korrigieren` (einmalig, danach idempotent):

| Lage | Aktion | Anzahl |
| --- | --- | --- |
| links-Foto zeigt rechts, rechts-Foto zeigt links | beide Dateien tauschen (.webp und .png) | 268 Farbvarianten |
| links-Foto zeigt rechts, kein rechts-Foto | linkes Foto horizontal spiegeln | 449 Farbvarianten |

Danach wurden die Druckflächen neu aus den Fotos vermessen
(`npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts`). Geändert haben sich nur die
`sleeve_left`-/`sleeve_right`-Zeilen in `src/config/printAreaData.generated.ts`.

## Wie wird die Seite erkannt

Zwei unabhängige Verfahren (Einzelheiten im Kopfkommentar von `scripts/aermelSeiten.mjs`): das **Kopfprofil** (höchster
Punkt der Silhouette liegt hinten) und der **Umrissvergleich** innerhalb eines Produkts. Eine Farbe weicht von der
Mehrheit ihres Produkts nur ab, wenn beide Verfahren es so sehen.

Gegengeprüft per Sichtprüfung an 8 Hoodies (Kapuzenband) und 16 Damenmodellen (Brustwölbung): 24 von 24 richtig. Bei
Paaren zeigt das rechte Foto in 298 von 299 Fällen die erwartete Gegenseite.

## Grenzen (bewusst offen)

* **19 Produkte** haben ein zu schwaches Signal (fast symmetrische T-Shirts und Polos, z. B. `fotl-heavy-t`,
  `bundc-my-polo-180`, `sols-men-s-polo-shirt-perfect`). Sie wurden **nicht angefasst**; die Liste gibt
  `node scripts/aermelSeiten.mjs pruefen` aus. Dort kann das Foto der Bezeichnung widersprechen, ohne dass man es dem
  Bild ansieht.
* Zwei Farbvarianten werden nur gemeldet: `fotl-valueweight-t/sunflower` (beide Fotos zeigen dieselbe Seite) und
  `fotl-original-t/white` (rechtes Foto nicht bestimmbar).
* **Bestehende Bestellungen** behalten ihre gespeicherte Vorschau. Wird eine Vorschau neu erzeugt, erscheint der
  Druck auf dem neuen Foto – also auf der Seite, die in der Bestellung steht ("Ärmel links" = linke Trägerseite). Die
  Position bleibt relativ zum linken Rand der Druckfläche gleich; weil die Fläche mit dem Foto mitgespiegelt wurde,
  liegt ein außermittiges Motiv dann auf der anderen Seite des Ärmels (vorn statt hinten oder umgekehrt). Mittig
  gesetzte Motive ändern sich nicht.

## Nach jedem Bildimport mit Ärmelfotos

```
node scripts/aermelSeiten.mjs pruefen        # ändert nichts; Exit-Code 1, wenn etwas zu korrigieren ist
node scripts/aermelSeiten.mjs korrigieren    # wenn ja
npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts
```

Der Test `src/lib/assets/__tests__/aermelSeiten.test.ts` führt `pruefen` aus und schlägt an, wenn ein Foto der
Bezeichnung widerspricht.
