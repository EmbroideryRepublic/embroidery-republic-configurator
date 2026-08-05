# Premium-Roadmap: größere Vorhaben mit Umsetzungsplan

Diese Punkte aus dem Premium-Review lassen sich **nicht** risikolos nebenbei
umsetzen, weil sie den eingefrorenen Konfigurator (v1.0) oder die Architektur
berühren. Sie sind hier als konkrete, abgestimmte Vorhaben beschrieben – jeweils
mit Zielbild, Umsetzungsschritten und Risiko. Kein Platzhalter-Code, keine
Vorab-Änderung am eingefrorenen Canvas.

Kleinere Verbesserungen des Reviews wurden bereits umgesetzt und sind in
[shop-ausbau.md](shop-ausbau.md) dokumentiert.

---

## 1. Realistische Druckvorschau (Motiv fügt sich ins Textil ein)

**Problem:** Das Motiv liegt als flache Ebene über einem flachen Produktfoto –
es folgt weder Falten noch Stoffschattierung und wirkt wie ein Aufkleber.

**Zielbild:** Der Druck übernimmt Licht, Schatten und Faltenwurf des Textils und
wirkt „ins Material eingelassen".

**Umsetzung in drei Stufen (aufsteigendes Risiko/Aufwand):**

1. **Multiply-Mischung + leichte Deckkraft** (kleiner Eingriff, größte Wirkung).
   Die Design-Ebene über dem Kleidungsstück mit `globalCompositeOperation =
   'multiply'` und ~0,92 Deckkraft rendern (Konva: `Group`/`Image` mit
   `globalCompositeOperation`). Dadurch scheinen die Schattierungen des Textils
   durch den Druck – vor allem auf hellen Teilen sofort sichtbar. Reiner
   Rendering-Zusatz in `ConfiguratorCanvas.tsx`, keine Logikänderung.
2. **Gewebetextur in der Motivfläche — UMGESETZT (2026-07-30).** Eine feine,
   prozedural erzeugte Leinwandbindung wird als reines Anzeige-Bild in die
   Motivfläche eingerechnet (`overlay`, dann per `destination-in` auf die
   Motivkontur maskiert), sodass der Druck die Stoffstruktur andeutet statt
   spiegelglatt zu wirken – auf ALLEN Farben. Nur Logos/Bilder (Text folgt).
   `lib/canvas/fabricTexture.ts` + Ableitung des Anzeige-Bildes in `LogoNode`;
   `element.fileUrl` (Produktionsdaten) bleibt unberührt, Bild als Canvas direkt
   an Konva, kein Export. Visuell belegt (Gewebe nur auf der Farbe, Textil sauber).

3. **Faltensimulation per Schattierungs-Overlay (offen).** Pro Produktansicht
   eine entsättigte Graustufen-„Shading-Map" (aus dem vorhandenen Foto ableitbar)
   über den Druck legen, damit auch DUNKLE Textilien Falten/Materialtiefe im
   Druck zeigen. Assets aus den bestehenden Fotos per Skript – kein neues
   Bildmaterial. Größerer Schritt (Ausrichtung/Clipping je Element).
3. **Feinschliff:** dezenter Kantenschatten am Motiv, minimale Körnung/Textur,
   optional Displacement entlang der Shading-Map für echten Faltenversatz.

**Risiko/Aufnahme:** Alle Stufen ändern die **Leinwandausgabe** des
eingefrorenen v1.0. Deshalb als **v1.1 „Realistische Vorschau"** einplanen –
isoliert, mit vollem Verifikationszyklus und visueller Abnahme. Stufe 1 ist der
empfohlene erste, risikoarme Schritt und liefert bereits den größten
Qualitätssprung.

**Stufe 1 UMGESETZT (2026-07-30).** Motive werden auf **hellen** Textilien per
`globalCompositeOperation='multiply'` gerendert (Falten/Schatten des Fotos
schlagen durch), auf **dunklen** Textilien bleibt der deckende Normal-Blend.
Umgesetzt in `ConfiguratorCanvas.tsx` (Prop `garmentLight`, an Logo- und
Text-Node); Entscheidung aus der **echten Kleidungsfarbe**
([lib/canvas/garmentLuminance.ts](../src/lib/canvas/garmentLuminance.ts)).
Rein visuelle Vorschau – der Editor-Canvas wird nirgends exportiert, das
Produktionsblatt rendert getrennt über `src/lib/rendering`.

> **Lernkurve/Fallstrick (dokumentiert):** Ein erster Ansatz mittelte die
> Helligkeit des Produkt**fotos**. Untauglich – ein freigestelltes Foto eines
> schwarzen Shirts mittelt wegen Glanzlichtern/Falten/Etikett auf ~160 (gemessen:
> Weiß 246, Grau 232, Schwarz 162, Navy 155) und stufte Schwarz/Navy fälschlich
> als hell ein → Motiv wurde auf Dunkel abgedunkelt. Lösung: Entscheidung über
> die **hinterlegte Farbe (Hex)**, abgesichert durch Unit-Tests
> (`lib/canvas/__tests__/garmentLuminance.test.ts`). Beide Fälle visuell belegt.

---

### Gesamtbild-Feinschliff (2026-07-30)

Ein Schritt zurück, die Vorschau als Ganzes bewertet – nicht mehr Effekte,
sondern das überzeugendste Gesamtergebnis:

- **Transformer/Auswahlgriffe auf Markengold** (weiß, gerundet, goldener
  Rahmen) statt der grellblauen Standard-Konva-Griffe. *Warum:* Die Interaktion
  ist Teil des Qualitätseindrucks; die Standardgriffe ließen den Editor „von der
  Stange" wirken. Reiner Stil, keine Bedienänderung. `TRANSFORMER_STYLE` in
  `ConfiguratorCanvas`, für Logo- und Text-Auswahl.
- **Gewebetextur zurückgenommen** von deutlich sichtbar (overlay 0,5, Amplitude
  ±9/±5) auf ein **unterschwelliges Korn** (overlay 0,35, ±5/±3). *Warum:* Aus
  Textildruck-Sicht ist DTF ein glatter Film – ein *lesbares* Gewebe auf dem
  Druck ist eher falsch. Der Druck soll nur seine perfekt-flache, digitale
  Anmutung verlieren, nicht „stofflich" aussehen. „Weniger ist mehr."

**Bewusst verworfen (mit Begründung):**
- *Schlagschatten unter dem Motiv* → lässt den Druck schweben („Aufkleber"),
  verschlechtert die Glaubwürdigkeit. Verworfen.
- *Multiply auch auf dunklen Textilien* → dunkelt den Druck ins Unsichtbare ab;
  echter Druck sitzt dort deckend mit Weißunterlage. Verworfen.
- *Gewebetextur auch auf Text* → Text ist Vektor, ein Korn darauf wirkt schmutzig
  statt hochwertig; Nutzen gering. Vorerst zurückgestellt.
- *Methoden-spezifische Texturen (Stich für Stickerei)* → echter Mehrwert, aber
  eigener Aufwand; als spätere Option notiert, nicht „nebenbei".

**Empfehlung Kleidungsstück-Fotos (kein Code-Eingriff):** Die Freisteller sind
je nach Lieferant unterschiedlich belichtet/weißabgeglichen. Eine globale
Farb-/Kontrastkorrektur im Code wäre riskant (verschlechtert einzelne Fotos) und
gehört nicht in die Vorschau-Logik. Empfehlung: mittelfristig einheitliche,
hochauflösende Produktfotos mit konstanter Ausleuchtung/Weißabgleich – der
größte verbleibende Realismus-Hebel liegt in der Fotoqualität selbst.

**Ceiling erreicht (aktuelle Architektur):** Die risikoarmen, klar begründeten
Vorschau-Hebel sind ausgeschöpft (multiply-Schatten auf hell, unterschwelliges
Korn, markeneigene Interaktion). Der nächste echte Sprung – der Druck nimmt
Falten *und* Lichter auf ALLEN Farben und *verzieht* sich mit dem Faltenwurf –
braucht einen positionsabhängigen Offscreen-Compositor (Neuberechnung beim
Verschieben) und ist damit ein eigenes, sorgfältig zu bauendes Vorhaben
(Stufe 3), kein Nebenbei-Effekt.

## 2. Globaler Warenkorb (überall öffnenbar)

**Problem:** Außerhalb des Konfigurators führt das Warenkorb-Symbol zurück in
den Konfigurator, statt eine Warenkorb-Ansicht zu öffnen. Der Kunde kann seinen
Korb auf Produkt-/Info-Seiten nicht einsehen.

**Zielbild:** Ein Klick auf das Warenkorb-Symbol öffnet **überall** dieselbe
Schublade.

**Umsetzung (ohne Eingriff in die Konfigurator-Interna):**

1. Kleinen UI-Zustand einführen (`stores/uiStore.ts` mit `warenkorbOffen` +
   Aktionen) – oder das bestehende `cartStore` um dieses UI-Flag ergänzen.
2. Einen **globalen Host** `components/layout/CartDrawerHost.tsx` (Client)
   ins Root-Layout hängen, der die vorhandene `CartDrawer` rendert, wenn
   `warenkorbOffen` und **nicht** auf `/konfigurator` (dort bleibt die eigene
   Schublade unverändert – v1.0 unangetastet).
3. In `SiteHeader` den Warenkorb-Knopf auf allen Nicht-Konfigurator-Seiten
   `warenkorbOffen = true` schalten lassen statt auf `/konfigurator` zu
   verlinken. Die `GlobaleKopfzeile`-Weiche (deren Kommentar diese Lösung
   bereits vorsieht) entfällt damit schrittweise.

**Risiko:** gering – der Konfigurator behält seine eigene Drawer-Instanz; neu ist
nur eine zweite, global gehostete Instanz für die übrigen Seiten. Sauber testbar.

**UMGESETZT (2026-07-30).** UI-Store `stores/uiStore.ts` (`warenkorbOffen`,
ephemer); globaler Wirt `components/layout/CartDrawerHost.tsx` im Wurzel-Layout
(rendert die Schublade auf allen Seiten außer `/konfigurator`); `SiteHeader`
öffnet ohne eigenes `onCartClick` die globale Schublade statt zu verlinken; der
Konfigurator bleibt unberührt (eigene Schublade). „Bearbeiten" aus dem globalen
Korb lädt das Design und wechselt zum Konfigurator (im Konfigurator selbst kein
Wechsel). Funktional belegt: Artikel im Konfigurator gelegt, auf `/produkt`
dieselbe Schublade mit dem Artikel geöffnet. 550 Tests grün, Build exit 0.

---

## 3. Mobiler Konfigurator-Einstieg (Bühne schneller sichtbar)

**Problem:** Auf dem Telefon füllt der Produktbrowser den ersten Bildschirm; das
Kleidungsstück und die Gestaltung liegen weit darunter.

**Bereits umgesetzt (ohne Strukturänderung):** Der Stepper zeigt den aktuellen
Schritt jetzt auch mobil mit Beschriftung; der Konfigurator hat eine (visuell
versteckte) `h1`; ein Lade-Skeleton überbrückt den Erststart.

**Geplanter nächster Schritt (v1.1, kleiner Layout-Eingriff):** Auf `< lg` den
Produktbrowser standardmäßig zu einer kompakten Leiste einklappen
(„Produkt: Heavy T · ändern"), die als Sheet aufgeht. So erscheint die Bühne
sofort, ohne die Bedienlogik zu ändern. Betrifft `ConfiguratorPrototype.tsx`
(v1.0) → abstimmen und isoliert umsetzen.

---

## Reihenfolge-Empfehlung

1. **Globaler Warenkorb** (kleiner, klarer UX-Gewinn, kein Freeze-Konflikt).
2. **Realistische Vorschau – Stufe 1 (Multiply)** (größter Qualitätssprung, kleiner Eingriff, als v1.1).
3. **Mobiler Einstieg** (Layout-Feinschliff, v1.1).
4. Realistische Vorschau Stufe 2–3 (Assets/Aufwand), sobald Stufe 1 abgenommen ist.
