# Fachliches Platzierungsmodell für Veredelungsflächen

> **Status: Recherche begonnen, Modell noch nicht implementiert.**
> Diese Datei sammelt die branchenüblichen Platzierungsregeln. Sie beantwortet
> die Frage **„Wo gehört eine Veredelung in der Praxis hin?"** — in
> Zentimetern, unabhängig vom Produktfoto.
>
> Die Geometrie (`scripts/generatePrintAreaData.mts`) beantwortet die davon
> getrennte Frage **„Wie wird diese Fläche auf dieses Bild projiziert?"**.
> Beide Aufgaben dürfen nicht vermischt werden.

## Warum es diese Datei gibt

Die bisherigen Flächen entstanden aus der Bildgeometrie: Position und Größe
wurden aus Kontur und Kleidungsstückmaßen abgeleitet. Rechnerisch war das
konsistent, fachlich aber nicht. Beispiel Ärmel: Die Regel lautete
`y0 = Oberkante + 15 % der Kleidungsstückhöhe` — ein Wert ohne jeden Bezug
zur Schulternaht oder zum Ärmelabschluss. Die Fläche landete direkt unter der
Schulter statt mittig auf dem Oberarm; ein Veredler erkennt das sofort.

**Vorrangregel (Vorgabe des Auftraggebers):** Weichen Rechnung und Praxis
voneinander ab, gewinnt die Praxis — solange die Regel dokumentiert und
innerhalb einer Schnittgruppe einheitlich angewendet wird.

## Recherchierte Werte

### Quelle A — DTF Turbo, Druckpositionen auf Textilien
<https://dtfturbo.de/blogs/wissen-praxis/druckpositionen-textilien-motiv-platzierung>
· Typ: Druckdienstleister · abgerufen 2026-07-20

| Position | Breite | Vertikale Lage |
|---|---|---|
| Brust links | 8–10 cm | 8–10 cm unter der Schulternaht, ca. 8 cm von der Mitte |
| Brust rechts (nur Polo) | 6–8 cm | zwischen Schulternaht und Knopfleiste |
| Brust mittig / Vollfront | 28–35 cm (S–XXL) | Oberkante 5–8 cm unter dem Kragen |
| Rücken groß | 28–40 cm | keine Angabe |
| Nacken / oberer Rücken | 5–8 cm | direkt unter dem Kragen |
| Ärmel | 8–12 cm | auf dem Oberarm |

Hinweis der Quelle: nie direkt über Nähte, Reißverschlüsse oder Knöpfe
drucken — konkrete Abstandswerte werden nicht genannt.

### Quelle B — Werbemittel Oerlikon, Logo auf der linken Brust
<https://werbemittel-oerlikon.ch/warum-logos-auf-brusthoehe-am-besten-wirken/>
· Typ: Textilveredler · abgerufen 2026-07-20

- Brustlogo links: **8 cm breit**, **7–9 cm unter der Schulternaht**
- Für T-Shirts: 7–9 cm unter der Schulternaht, Breite 8–10 cm
- Kragenabstand mittig: 10–15 cm ab Kragenmitte nach unten gemessen

### Quelle C — Textil-Großhandel, Druckpositionen und Abmessungen
<https://www.textil-grosshandel.eu/hilfe/antwort/positionen-und-abmessungen/>
· Typ: B2B-Großhändler (Lieferant des Projekts) · abgerufen 2026-07-20

**Nennt keine Maße je Position.** Beschreibt nur die Messmethodik: vertikal
„von der Kragen- bzw. Saumnaht bis zum Motivbeginn", horizontal „von der
Textilmitte bis zum Motivbeginn". Wichtiger Praxishinweis: **Toleranz bis
1,5 cm** durch manuelle Platzierung und Zuschnittabweichungen.

### Übereinstimmung der Quellen

Brust links stimmt in beiden ergiebigen Quellen überein: **8–10 cm breit,
7–10 cm unterhalb der Schulternaht**. Das ist damit belastbar. Für Ärmel
nennt nur Quelle A einen Wert (8–12 cm Breite, „auf dem Oberarm") — die
vertikale Lage bleibt offen und ist der wichtigste noch fehlende Wert.

## Noch zu recherchieren

- **Ärmel: vertikaler Abstand unterhalb der Schulternaht in cm.** Das ist der
  Wert, der den gemeldeten Fehler behebt. Ohne ihn keine Korrektur — ein
  geschätztes Verschieben wäre derselbe Fehler mit anderem Vorzeichen.
- Ärmel: Mindestabstand zum Ärmelabschluss (Bündchen/Saum).
- Rücken groß: vertikale Lage (Oberkante unter dem Kragen).
- Rücken groß und Vollfront: maximale Höhe.
- Konkrete Nahtabstände statt „nie über Nähte".
- Unterschiede je Schnittgruppe (Hoodie mit Kängurutasche, Zip-Hoodie mit
  durchgehendem Reißverschluss, Longsleeve, Polo mit Knopfleiste).

## Nächste Schritte

1. Offene Werte oben recherchieren.
2. Regelwerk je Schnittgruppe in cm formulieren (T-Shirt, Polo, Hoodie,
   Sweatshirt, Zip-Hoodie, Longsleeve, Jacke).
3. Geometrie NUR noch zur Projektion nutzen: Bezugspunkt ist die
   Schulternaht bzw. der Kragen im Bild, nicht mehr ein Prozentsatz der
   Bildhöhe.
4. Vollständiger Durchlauf über alle Ansichten und Produktgruppen.
5. Visuelle Abnahme: Würde ein Veredler jede Fläche akzeptieren?

---

## UMGESETZT: Ärmelregel (2026-07-20)

Der Auftraggeber hat ausdrücklich freigegeben, aus übereinstimmenden
Praxisaussagen eine Regel abzuleiten, statt auf eine normierte
Zentimeterangabe zu warten. Grundlage sind:

- „mittig auf dem Oberarm" (Quelle A)
- Orientierung an der Oberkante der Ärmelfalte, diese als vertikale Mitte
  verwenden (Praxisbeschreibung aus der Recherche)
- Ärmelmotive 8–12 cm breit (Quelle A)
- ausreichender Abstand zu Nähten, nie über Nähte drucken (Quelle A)
- Fertigungstoleranz 1,5 cm (Quelle C)

### Abgeleitete Regel

| Größe | Wert | Begründung |
|---|---|---|
| Breite | **8,9 cm** | gemessene Oberarmbreite 10,9 cm minus 2 × 1,0 cm Naht; liegt im Praxisband 8–12 cm |
| Höhe | **10,0 cm** | vormals 13 cm. Ein kurzer Ärmel reicht ab Schulternaht rund 20 cm; 13 cm ließen oben und unten je nur ~3,5 cm und wirkten gedrängt. Übliche Ärmelmotive: 8–10 cm |
| Lage | **zentriert im Oberarm-Band** | Band = 8 % bis 26 % der Kleidungsstückhöhe ab Oberkante. Lässt oben die Armkugelnaht, unten den Ärmelabschluss frei |

Die vormalige Regel `y0 = Oberkante + 15 % der Kleidungsstückhöhe` ist
ersetzt. Sie hatte keinen Bezug zur Schulternaht oder zum Ärmelabschluss —
die Fläche landete rechnerisch irgendwo und fachlich zu weit oben.

Für Langarmware gilt dasselbe Band: Der Ärmel ist länger, die veredelbare
Oberarmzone liegt aber an derselben Stelle.

### Noch offen

**Die visuelle Abnahme fehlt.** Die Regel ist fachlich hergeleitet und
rechnerisch sauber (Validierung: 0 Fehler über 43 Produkte × 4 Ansichten),
aber noch nicht am Bild geprüft. Genau das war die Kritik des Auftraggebers:
Eine rechnerisch stimmige Fläche kann optisch falsch sitzen. Der nächste
Schritt ist der Blick auf jede Schnittgruppe — T-Shirt, Polo, Hoodie,
Sweatshirt, Longsleeve — und gegebenenfalls eine Korrektur des Bandes.
