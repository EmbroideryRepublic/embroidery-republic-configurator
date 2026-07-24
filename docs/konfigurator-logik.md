# Konfigurator-Logik

> **Der Konfigurator ist seit 2026-07-23 auf Version 1.0 eingefroren.**
> Änderungen nur noch für Bugs, Security, Performance und Browserprobleme –
> keine neuen Features. Dieses Dokument beschreibt den eingefrorenen Stand.

Der Konfigurator liegt unter `/konfigurator`
([src/app/konfigurator/page.tsx](../src/app/konfigurator/page.tsx)), die
Zusammensetzung in
[ConfiguratorPrototype.tsx](../src/components/configurator/ConfiguratorPrototype.tsx).
Reine Logik steckt bewusst getrennt in `src/lib/configurator/`, die Darstellung
in `src/components/configurator/`.

## Seitenaufbau (drei Spalten)

```
┌───────────────┬─────────────────────────────┬────────────────────────┐
│ Produktbrowser│ Farbe/Größe · Ansichten ·    │ Deine Konfiguration     │
│ (Baum +       │ Canvas (Konva)               │ Veredelung · Werkzeuge  │
│  Modellkarten)│                              │ Preis · Warenkorb       │
└───────────────┴─────────────────────────────┴────────────────────────┘
```

Oben darüber: die Kopfzeile (ohne Navigation im Konfigurator ausgeblendet, sie
wird über `GlobaleKopfzeile` gesteuert) und die **Schrittleiste**
([Stepper](../src/components/layout/Stepper.tsx)): *Produkt & Größe → Motiv
hinzufügen → Position prüfen → Bereit zum Bestellen*. Der aktive Schritt wird
in `ConfiguratorPrototype` aus `quantity`/`elements` abgeleitet (`progressStep`).

## Der Produktbrowser (linke Spalte)

Ein **Produktbrowser, kein Filterbereich**: Wer hier ankommt, will das
Kleidungsstück wechseln, nicht suchen. Regeln als reine Logik in
[produktbaum.ts](../src/lib/configurator/produktbaum.ts):

- **Baum:** Hauptgruppe (Herren/Damen/Unisex) → Produktart → Modellkarten.
- **Navigationsregel** (`gehoertZu`): Unisexware erscheint **zusätzlich** unter
  Herren und Damen; die Gruppe „Unisex" führt ausschließlich Unisexware. So
  führt jede Gruppe alle Produktarten – ohne diese Regel hätte „Herren" im
  echten Katalog z. B. keine Hoodies (alle sind Unisex klassifiziert).
- **Explorer-Verhalten:** immer nur ein Pfad offen (siehe
  [ProduktBrowser.tsx](../src/components/configurator/ProduktBrowser.tsx),
  Zustand in [browserStore](../src/stores/browserStore.ts)); Breadcrumb führt
  eine Ebene zurück.
- **Modellkarten** tragen Vorschaubild, Name, Marke, Farbpunkte und dezente
  **Badges** (`modellBadges` – Zusammensetzung/Gewicht/Güteklasse; die
  Materialkurzform in `materialKurz` beschönigt nichts: ein Mix wird nicht zu
  „100 % Baumwolle").
- **Filter** (Preis/Marke/Material/Qualität) liegen hinter einem Knopf und
  verdrängen den Baum nie dauerhaft.

## Auswahl-Übernahme beim Produktwechsel

[uebernahme.ts](../src/lib/configurator/uebernahme.ts): Beim Wechsel von einem
Kleidungsstück zum nächsten wandern **Farbe, Größe/Menge und Veredelung** mit,
damit sich der Wechsel nach Einkaufen und nicht nach Formular anfühlt:

- **Farbe** – exakt gleicher Name, sonst der farblich nächste Ton (RGB-Abstand),
  nie stumpf die erste Farbe.
- **Größe** – gleiche Größe, sonst die nächstgelegene Konfektionsgröße (bei
  Gleichstand die kleinere). Fallen zwei Wunschgrößen auf dieselbe Ersatzgröße,
  addieren sich die Mengen.
- **Veredelung** – bleibt im Store ohnehin erhalten (produktunabhängig).

Die Konfektionsreihenfolge kommt zentral aus
[config/products/groessen.ts](../src/config/products/groessen.ts)
(`KONFEKTIONSGROESSEN`, `groessenRang`, `groessenIndex`).

## Geführter Kaufprozess

[kauffortschritt.ts](../src/lib/configurator/kauffortschritt.ts) beurteilt den
Fortschritt; die Anzeige liegt in
[KonfigUebersicht.tsx](../src/components/configurator/KonfigUebersicht.tsx)
(„Deine Konfiguration", rechts oben). Ablauf: *Produkt → Farbe → Größe & Menge →
Veredelung → Motiv → Position → Kauf*.

- Jede Zeile zeigt Häkchen (erledigt) oder gestrichelten Kreis (offen).
- `naechsterSchritt(...)` liefert den nächsten sinnvollen Schritt; ein dezenter
  Hinweis (gold, bei „bereit" grün) führt, ohne zu bevormunden.
- Produkt, Farbe und Veredelung sind stets vorbelegt; offen sein können in der
  Praxis Größe/Menge, Motiv und (falls ein Motiv über den Rand ragt) die
  Position.

## Vorladen für sofortige Wechsel

[vorladen.ts](../src/lib/configurator/vorladen.ts): reiner Bildcache-Aufwärmer
(deduped über ein `Set`). Beim Öffnen einer Produktart werden die
Vorderansichten aller Modelle vorgeladen, beim Überfahren einer Karte alle vier
Ansichten des Modells, beim Laden eines Produkts sämtliche Farbansichten. Der
spätere echte Zugriff kommt aus dem Cache – der Wechsel wirkt verzögerungsfrei.

## Die Werkzeugspalte (rechts)

[ToolPanelTabs.tsx](../src/components/configurator/ToolPanelTabs.tsx): Reiter
*Design / Logo / Text / Vorlagen*. Sobald irgendwo ein Element ausgewählt wird
(Hinzufügen **oder** Klick auf der Leinwand), schaltet der Panel automatisch auf
*Design* – dort liegen alle Bearbeitungsoptionen. Standardreiter ist *Logo*
(für Erstnutzer sofort handlungsfähig).

## Die Leinwand (Konva) und das cm↔px-Modell

[ConfiguratorCanvas.tsx](../src/components/configurator/ConfiguratorCanvas.tsx),
konstanten aus
[config/products/colorHelpers.ts](../src/config/products/colorHelpers.ts):

- Die logische Koordinatenwelt ist **immer** `CANVAS_WIDTH`×`CANVAS_HEIGHT`
  (700×… px). **Alle** cm↔px-Umrechnungen im Projekt bauen darauf auf.
- Auf schmalen Bildschirmen skaliert nur die Konva-Stage über `scaleX`/`scaleY`
  (Klick-/Drag-Koordinaten rechnet Konva korrekt zurück – kein CSS-Transform-
  Hack). Die gemessene Containerbreite wird an die Fensterbreite geklemmt
  (`fensterbreite - (RULER_TRACK_PX + 36)`), sonst liefe die Leinwand auf dem
  Telefon seitlich über (`RULER_TRACK_PX = 34`).
- Die tatsächlich nutzbare Bildfläche und die Druckfläche werden als `useMemo`
  gehalten, damit der Sperrzonen-Sanitize-Effekt nicht bei jedem Tastendruck
  läuft.
- Druckflächen kommen aus [config/printAreas.ts](../src/config/printAreas.ts);
  Positionen/Verfahren aus
  [config/decorationPositions.ts](../src/config/decorationPositions.ts). Zur
  Herleitung der Maße siehe [platzierung-veredelung.md](platzierung-veredelung.md).

## Weicher Produktwechsel

Beim Produktwechsel gleitet in `ConfiguratorPrototype` eine Ebene mit dem neuen
Kleidungsstück über die Leinwand herein und löst sich auf
(`animate-produkt-gleiten`, Schlüssel = `product.id`, damit nur der
Produktwechsel – nicht jeder Farb-/Ansichtswechsel – die Animation auslöst).
Bewusst **ohne** Neu-Mount der Konva-Leinwand. Details in
[animationen-und-ux.md](animationen-und-ux.md).

## Preis

Der Preis wird serverseitig in `src/lib/pricing/` berechnet (drei getrennte
Stufen, Fail-fast). Die Herleitung und das Staffel-/Rüstkostenmodell stehen in
[kalkulationsmodell.md](kalkulationsmodell.md) und
[kalkulationsgrundlage.md](kalkulationsgrundlage.md).
