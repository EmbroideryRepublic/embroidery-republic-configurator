# ADR 0001 — Generische Druckansichten über eine offene View-ID + zentrale Registry

- **Status:** akzeptiert (M1)
- **Datum:** 2026-08-04
- **Kontext-Dokument:** [architektur-generische-produkte.md](../architektur-generische-produkte.md)

## Kontext

Der Konfigurator war auf Kleidungsstücke mit genau vier Ansichten ausgelegt:

```ts
export type PrintView = 'front' | 'back' | 'sleeve_left' | 'sleeve_right';
```

Diese geschlossene Union war die Wurzel zahlreicher `Record<PrintView, …>`-Strukturen
und wurde durch ein Binär-Flag `hasSleeves` notdürftig auf „mit/ohne Ärmel" erweitert.
Neue Produktgruppen (Taschen: Seite/Boden; Schürzen: Brust/Bauch; später Caps, Mützen,
Handtücher, Decken, Kissen …) lassen sich damit nicht ausdrücken.

Ziel ist eine Architektur, die **über Jahre mit hunderten/tausenden Produkten und
beliebigen Produktgruppen wartbar bleibt** und bei der neue Produkttypen **keinen
Eingriff in bestehende Kernlogik** mehr erfordern.

## Entscheidung

1. **`PrintView` wird eine offene View-ID** (`type PrintView = string`, semantisch eine
   `ViewId`). Die Menge gültiger Ansichten kommt **nicht mehr aus dem Typ**.
2. Es gibt **eine einzige Quelle der Wahrheit** für alle bekannten Druckansichten: die
   **zentrale View-Registry** (`src/config/decorationPositions.ts`, `DECORATION_POSITIONS`).
   Sie definiert je Ansicht Label, i18n-Schlüssel, Reihenfolge, Gruppe, Nahtabstand,
   Spiegelung. Oberflächen, Preis, Produktion, Canvas und Validierung führen **keine
   eigenen Ansichtslisten** mehr.
3. **Jedes Produkt deklariert seine Ansichten über Konfiguration** — explizit via
   `ProductConfig.views: ViewId[]` bzw. abgeleitet aus seinen Druckflächen. Ein zentraler
   Resolver `ansichtenVon(product)` ist die einzige Laufzeit-Quelle „welche Ansichten hat
   dieses Produkt". Der Binär-Schalter `hasSleeves` entfällt (M1: als abgeleiteter,
   deprecateter Shim; volle Entfernung + UI-Umstellung in M2).
4. **Sicherheit wandert von der Compile- in die Testzeit.** Da eine offene ID die
   Compiler-Vollständigkeitsprüfung aufgibt, sichern **Wächter-Tests** die Integrität ab
   (siehe unten) — exakt das Muster, das das Projekt bei den Facetten bereits erfolgreich
   nutzt (`facetten.test.ts`: „die Tabelle scheitert laut").

## Begründung / Alternativen

**Verworfen: `PrintView`-Union erweitern** (compilergeprüft). Bliebe typsicher, zwingt aber
jede neue Produktgruppe erneut in die zentrale Typdatei und in jedes `Record<PrintView>` —
also wiederkehrenden Kern-Eingriff. Das widerspricht dem Ziel „ohne Architektur-Umbau
andocken". (Vgl. Kontext-Dokument §3.1.)

**Gewählt: offene ID + Registry + Wächter-Tests.** Vorteile:
- Neue Ansichten/Produktgruppen entstehen rein durch **Konfiguration** (Registry-Eintrag +
  Produkt-`views`), ohne Kernlogik anzufassen.
- `Record<PrintView, X>` wird automatisch zum **offenen** `Record<string, X>`: bestehende
  4-Schlüssel-Literale bleiben gültig, aber Produkte mit anderer Ansichtsmenge (Tasche,
  Schürze) sind ausdrückbar. Minimaler Umstellungs-Ripple.
- Konsistent mit dem etablierten Facetten-/Wächter-Muster des Projekts.

Nachteile (bewusst akzeptiert, durch Tests kompensiert):
- **Verlust der Compile-Vollständigkeit:** `obj[view]` liefert unter `Record<string,X>`
  keinen `undefined`-Typ mehr → potenzielle Laufzeit-`undefined`. Gegenmaßnahmen:
  **defensive Zugriffs-Helfer** in der Registry (`viewDef`, sichere Labels mit Fallback)
  und **Wächter-Tests** (unten).
- **Persistenz/Datenbank:** Elemente/`activeView` liegen in IndexedDB (`zustand/persist`)
  und `PrintView` reicht bis in Supabase-Spalten. Offene IDs sind DB-seitig unkritisch
  (Textspalten); die Store-Migration (veraltete/ungültige View → erste gültige View des
  Produkts) erfolgt in M2 mit `version`-Bump.

## Wächter-Tests (Pflicht — verhindern ungültige Views/Configs)

- Jede von einem Produkt geführte View existiert in der Registry **und** hat einen
  Druckbereich (kein „auswählbar, aber unbenutzbar").
- Kein Produkt löst zu einer **leeren** Ansichtsliste auf.
- `PricingRule.printView`, sofern gesetzt, ist eine in der Registry gültige View.
- Registry-Integrität: eindeutige `order`, gültige `gespiegeltVon`-Verweise, i18n-Schlüssel
  vorhanden.
- Bestehende Geometrie-/Produktseiten-Tests prüfen künftig gegen die **deklarierten** Views
  des Produkts statt gegen feste `front/back/sleeve`-Namen.

## Konsequenzen

- **Registry ist die einzige Wahrheit.** Neue Positionen/Ansichten werden ausschließlich
  dort registriert; kein Oberflächencode zählt Ansichten mehr auf.
- **Produkte sind reine Konfiguration.** Ein neuer Produkttyp bringt seine Views, sein
  Geometrie-Rezept (M4) und seinen ProductType-Register-Eintrag (M3) mit — Kernlogik bleibt
  unberührt.
- Migrationspfad ist milestone-getrennt: M1 Datenmodell (dieses ADR), M2 Konfigurator-UI +
  Store-Migration + `hasSleeves`-Entfernung, M3 Katalog/Browser, M4 Import/Geometrie-Rezepte,
  M5 bag/apron.
