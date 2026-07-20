# Supplier-Mapping – Übersetzungsschicht zwischen interner Darstellung und Lieferanten

Stand: Juli 2026 · Status: **vollständig implementiert + Unit-getestet, inkl. stabiler Varianten-Kennungen (Variant-IDs / SKUs / Select-Werte); unabhängig von der noch nicht implementierten Browser-Automatisierung**

## Zweck

Embroidery Republic arbeitet intern **immer** mit einer einheitlichen,
kanonischen Darstellung von Varianten:

- Farben als interne IDs (`royal`, `navy`, `kelly-green`, `white-navy`, …)
- Größen als interne Kürzel (`S`, `M`, `L`, `XL`, `XXL`)
- Produkte als Katalog-IDs (`gildan-heavy-t`) mit Artikelnummer aus `supplierRefs`

Jeder Lieferant benennt dieselben Dinge aber anders (ein deutscher Shop
schreibt „Königsblau", ein britischer „French Navy", mancher führt „2XL"
statt „XXL") – und identifiziert Varianten intern oft über **stabile
Kennungen** (Variant-IDs, Select-Werte, SKUs), die sich nicht ändern, wenn
der sichtbare Text umbenannt/übersetzt wird. Diese Schicht ist die
**einzige** Stelle, an der interne Werte in Lieferantenbezeichnungen und
-kennungen übersetzt werden – und zwar **erst unmittelbar vor der
Browser-Automatisierung** (im `supplierWorker`, an der Grenze zum Adapter).
Alle vorgelagerten Schritte bleiben rein intern.

## Ordnerstruktur

```
src/lib/suppliers/mapping/
  types.ts                 ← SupplierVariant, SupplierVariantEntry, SupplierVariantMap, …
  SupplierMappingError.ts  ← typisierter Fehler (reason, supplierId, value, productId, detail)
  resolve.ts               ← Feld-Auflösung + Existenz-/Gültigkeitsprüfung
  selectors.ts             ← preferredVariantSelector: stabile ID vor sichtbarem Text
  resolvePosition.ts       ← ganze Position übersetzen (werfend + sammelnd)
  registry.ts              ← Record<SupplierId, SupplierVariantMap> (Vollständigkeit erzwungen)
  tables/*.ts              ← Farb-/Größentabelle je Lieferant
  index.ts                 ← öffentliche API (Barrel)
  __tests__/
    mapping.test.ts             ← Kern-Logik + Registry (Erstfassung, unverändert)
    variantIds.test.ts          ← stabile IDs, Validierung, Auswahl-Präferenz (neu)
    catalogConsistency.test.ts  ← reale Produkte ⇄ Tabellen (Regressionsschutz)
src/lib/suppliers/worker/__tests__/
    supplierWorker.mapping.test.ts ← End-to-End: nicht auflösbare Position wird übersprungen
```

## Einheitliches Varianten-Schema

Farben und Größen (und jede künftige Varianten-Dimension) verwenden **ein
und dasselbe** Eintrags-Schema. Ein Tabellen-Eintrag ist entweder die
**Kurzform** (nur der sichtbare Text) oder die **Vollform**:

```ts
type SupplierVariantEntry = string | SupplierVariant;

interface SupplierVariant {
  label: string;        // im Shop sichtbare Bezeichnung (Pflicht, Fallback)
  variantId?: string;   // stabile interne Varianten-ID des Shops
  selectValue?: string; // value-Attribut einer <option> (Dropdown)
  sku?: string;         // farb-/größenspezifische Artikelnummer der Variante
}
```

Die **Kurzform ist exakt die bisherige Schreibweise** –
`'Königsblau'` ist identisch zu `{ label: 'Königsblau' }`. Dadurch bleiben
alle bestehenden Tabellen unverändert gültig; Einträge werden **schrittweise**
auf die Vollform mit stabilen IDs erweitert, sobald ein Shop analysiert ist:

```ts
colors: {
  black: 'Schwarz',                                   // Kurzform (nur Label)
  navy:  { label: 'French Navy', variantId: 'clr-1001' }, // Vollform mit ID
}
```

> **Vereinheitlichung (geprüft):** Eine noch generischere Struktur
> (`Record<Dimension, Record<Key, Entry>>` mit frei benannten Dimensionen)
> wurde erwogen, aber zugunsten **expliziter** `colors`/`sizes`-Felder
> verworfen – die bleiben typsicher und autovervollständigbar. Die
> Vereinheitlichung liegt stattdessen im **gemeinsamen Eintrags-Schema**
> (`SupplierVariantEntry`) und im **gemeinsamen Resolver** (`resolveEntry`),
> die beide Dimensionen bedienen. Eine neue Dimension = ein weiteres
> `Record<string, SupplierVariantEntry>`-Feld, das denselben Resolver nutzt.

`SupplierVariant.sku` ist **variantenspezifisch** (Farbe/Größe) und nicht zu
verwechseln mit `SupplierVariantMap.articleNumberByProduct`, das die
**produktweite** Artikelnummer überschreibt.

## Auflösung: Label und stabile IDs

Zwei Auflösungs-Tiefen, dieselbe Mechanik – die Label-Funktionen sind
unverändert und dünne Wrapper:

| Funktion | Rückgabe | Zweck |
| --- | --- | --- |
| `resolveColorVariant(map, colorId)` | `SupplierVariant` | Label **+ stabile IDs** (neu) |
| `resolveSizeVariant(map, size)` | `SupplierVariant` | Label + stabile IDs (neu) |
| `resolveColorLabel(map, colorId)` | `string` | nur Label (**unverändert**, abwärtskompatibel) |
| `resolveSizeLabel(map, size)` | `string` | nur Label (unverändert) |
| `isColorSupported` / `isSizeSupported` | `boolean` | Existenzprüfung (unverändert) |

## Datenfluss

```
interne Bestellposition (SupplierOrderPosition)
   colorId: "navy", sizes: [{ size: "M", qty: 4 }], articleNumber: "JH001"
        │
        ▼   (erst hier, im Worker, unmittelbar vor der Automatisierung)
resolveSupplierPosition(position)                     [resolvePosition.ts]
   ├─ resolveColorVariant(map, "navy")  → { label:"French Navy", variantId:"clr-1001" }
   ├─ resolveSizeVariant(map, "M")      → { label:"M", selectValue:"sz-m" }
   └─ resolveArticleNumber(...)         → "JH001"
        │
        ▼
ResolvedSupplierPosition
   supplierColor: "French Navy"          ← Label (unverändert)
   colorVariant:  { label, variantId }   ← NEU: voller Deskriptor
   sizes:  [{ size:"M", supplierSize:"M", qty:4 }]   ← unverändert
   sizeVariants: { M: { label, selectValue } }        ← NEU
        │
        ▼
Adapter.selectColor(ctx, position, colorVariant)
Adapter.setQuantity(ctx, "M", 4, sizeVariant)
        │
        ▼
preferredVariantSelector(variant)  →  { strategy, value }
   variant-id  →  selectValue  →  sku  →  label   (absteigende Stabilität)
```

Der Worker reicht die vollständigen Deskriptoren (`colorVariant`,
`sizeVariants[size]`) an den Adapter; die alten Label-Felder
(`supplierColor`, `sizes[].supplierSize`) bleiben additiv erhalten.

## Auswahl-Präferenz (stabile ID vor sichtbarem Text)

`preferredVariantSelector(variant)` wählt deterministisch die stabilste
verfügbare Kennung:

| Reihenfolge | Strategie | Browser-Interaktion (geplant) |
| --- | --- | --- |
| 1 | `variant-id` | Element über data-/DOM-Variant-ID ansteuern |
| 2 | `select-value` | `<option value="…">` im Dropdown wählen |
| 3 | `sku` | Variante über die SKU identifizieren/verifizieren |
| 4 | `label` | Fallback: sichtbaren Text anklicken |

`label` ist immer vorhanden ⇒ garantierter Fallback. `hasStableIdentifier`
verrät, ob eine Variante überhaupt eine stabile Kennung trägt.

## Existenzprüfung, Gültigkeit & Fail-Fast

Jede `SupplierVariantMap` ist zugleich eine **Whitelist**: nur gelistete
Farben/Größen gelten als lieferbar. Beim Auflösen entstehen drei mögliche
Fehlerarten (`SupplierMappingError.reason`), alle mit klarer Meldung:

- `unknown-color` / `unknown-size` – Schlüssel fehlt in der Tabelle.
- `invalid-variant` – Eintrag vorhanden, aber fehlerhaft: **leeres Label**
  oder ein **deklariertes, aber leeres** ID-Feld (`variantId`,
  `selectValue`, `sku`). Eine solche Variante ließe sich nicht eindeutig
  auswählen und wird deshalb wie ein fehlender Eintrag behandelt.

> **Prototype-Sicherheit:** Die Prüfungen nutzen `hasOwnProperty`, nicht
> `record[key] !== undefined` – sonst würde `record["toString"]` die geerbte
> Object-Methode treffen und fälschlich als vorhandene Variante gelten
> (durch einen Test abgesichert).

**Fail-Fast (unverändert):** Im Worker wird die Übersetzung je Position im
Schritt `resolveVariants` ausgeführt. Wirft sie einen `SupplierMappingError`
(gleich welcher `reason`), wird der Schritt als `failed` protokolliert und
die Position **übersprungen** – es entstehen keine Bestellschritte für sie.
So kann weder eine fehlende noch eine mehrdeutige/kaputte Variante jemals
falsch automatisiert bestellt werden.

## Playwright-Integration (umgesetzt)

Die Browser-Automatisierung ist angebunden. `browserSession.ts` startet
echtes Chromium (Playwright, lazy import); `worker/browserSession.ts` bleibt
der einzige Playwright-Integrationspunkt. Der Ablauf je Position:

1. `openProduct` – navigiert real über `productUrl` (`page.goto`).
2. `selectColor` – ruft die zentrale **Auswahl-Engine**
   (`adapters/selectionEngine.ts`). Sie wählt die stärkste Strategie aus der
   Schnittmenge **Variante ∩ Shop-Plan** (`variant-id → select-value → sku →
   label`), führt die DOM-Aktion aus (`click`/`check`/`selectOption`/`goto`)
   und **protokolliert die genutzte Methode** – sowohl im Log
   (`[selection] Farbe via label="Navy" → check "…"`) als auch strukturiert
   im Schrittprotokoll (`step.selection = { strategy, value }`).
3. `setQuantity` – analog über `setSizeQuantity` (Mengen-Matrix).
4. `addToCart` / (nur `checkout`) `checkout`.

**Keine Übersetzungslogik mehr im Adapter:** Der Adapter liefert nur einen
verifizierten `ControlSelectionPlan` (welcher CSS-Selektor je Strategie);
die Entscheidung Prefer-ID-vs-Label trifft die Engine, die Übersetzung die
Mapping-Schicht. Fehlt einem Shop der verifizierte Plan, bleibt die Methode
`notImplemented` (Fail-Fast statt geratener Selektoren).

Solange eine Tabelle nur Labels führt, wählt die Engine label-basiert;
werden stabile IDs ergänzt, nutzt sie diese automatisch – ohne Codeänderung.
Der **Label-Fallback bleibt vollständig erhalten** (durch E2E-Test belegt).

### Verifizierte Shop-Strukturen (Juli 2026, öffentlich, kein Login)

| Shop | Farb-Auswahl (verifiziert) | Größe/Menge | Stand |
| --- | --- | --- | --- |
| **needen.de** | Radio `input.color-controller[data-color="<Name>"]` (+ `data-color-id`, `data-color-code`) | Mengen-Matrix `input.product-quantity[name="qty[<id>]"]` | Adapter aktiv (Label via `data-color`) |
| **textil-grosshandel.eu** | Button `button.switch-to[data-key="<HEX>"]` bzw. URL `?color=<HEX>` – Swatches tragen KEINEN Namen | Matrix `td.cell-size`-Zeilen, `input[name="aproducts[<varId>][am]"]` | colorPlan noch inaktiv (siehe Blocker) |

### Was blockiert ist (bewusst NICHT geraten)

- **needen – Farb-IDs produktspezifisch:** `data-color-id` unterscheidet
  sich je Produkt (Navy = 2305 bei GN182, = 343 bei GN647). Die
  per-Lieferant-Tabelle kann keinen einzelnen `variantId` je Farbe halten;
  das bräuchte die **zurückgestellte per-Produkt-Erweiterung**. Deshalb wird
  bei needen bewusst **label-basiert** über den produktstabilen `data-color`-
  Namen ausgewählt (keine IDs gepflegt).
- **needen – mehrdeutige Farbnamen:** eindeutig verifiziert und aktiv sind
  `black/white/navy/royal/red` (red-Label auf **"Red"** korrigiert). Offen
  (mehrere ähnliche Shop-Töne, **Nutzerentscheidung**): grey, charcoal,
  burgundy, kelly-green, bottle-green, pink.
- **needen – Farb-Verfügbarkeit:** GN647 (unser `gildan-ladies-vneck-t`)
  führt **kein "Red"/"Pink"** – unsere dortigen Katalogfarben red/pink haben
  bei needen keine Entsprechung. Katalog-/Sortiments-Klärung nötig.
- **TG – Farb-Zuordnung:** der Hex ist supplier-stabil und der Selektor
  verifiziert, aber welche unserer generischen Farben welchem Gildan-Hexton
  ("Antique Cherry Red", …) entspricht, ist **nicht eindeutig** und darf
  nicht geraten werden → Nutzerentscheidung, dann als `variantId` pflegen.
- **Bestellen erfordert Login:** Produktseiten sind öffentlich, aber
  Warenkorb/Checkout brauchen ein B2B-Konto → `login/addToCart/checkout`
  bleiben `notImplemented`, bis echte Zugangsdaten vorliegen (Nutzer-
  entscheidung; kein Konto anlegen).

### E2E-Test (echtes Chromium)

`worker/__tests__/supplierWorker.e2e.test.ts` validiert den kompletten Weg
gegen Fixtures, die die reale Shop-DOM spiegeln: interner Warenkorb →
`buildSupplierPositions` → `runSupplierJob` → NeedenAdapter → Engine → das
**richtige Farb-Radio ist im echten Browser ausgewählt**, mit korrekt
protokollierter Methode (`label`/`Navy`). Zusätzlich: Prefer-ID,
Label-Fallback und Fail-Fast. Überspringt sich sauber, wenn Chromium fehlt.

## `labelsVerified`

Analog zu `SupplierProductRef.urlVerified`: `false` bedeutet, dass Labels
UND etwaige stabile IDs noch eine dokumentierte Näherung sind und vor dem
ersten echten Lauf gegen den realen Shop abzugleichen sind. Die
Existenzprüfung ist davon unabhängig. Aktuell stehen alle realen Tabellen
auf `false` und führen bewusst nur Labels (keine erfundenen IDs); stabile
IDs werden beim Analysieren des jeweiligen Shops eingetragen.

## Pflege & Verifikation (Abdeckungs-Report)

Jeder Eintrag trägt einen Verifikationsstand: Kurzform-Strings und Objekte
ohne `verified: true` gelten als **noch zu prüfende Näherung**, verifizierte
Einträge werden mit der Hilfe `verified()` markiert:

```ts
colors: {
  red: verified('Red'),      // im Shop bestätigt
  grey: 'Grau meliert',      // Näherung – erscheint im Report als „zu prüfen"
}
```

`buildSupplierMappingCoverage()` (mapping/coverage.ts) klassifiziert je
Lieferant alle vom Katalog genutzten Farben/Größen als **verified /
unverified / missing** und listet, was noch bestätigt werden muss – ohne
Quellcode zu durchsuchen. Zwei Ausgaben:

- **CLI:** `npm run coverage:suppliers` (Exit 1 nur bei *missing*).
- **Admin:** read-only Seite `/admin/lieferanten` – Farb-/Größen-Chips
  (grün = verifiziert, amber = zu prüfen, rot = fehlt), Tooltip mit den
  nutzenden Produkten.

Der Flag ist rein dokumentarisch; die Auswahl-Engine ignoriert ihn (eine
unverifizierte Näherung wird trotzdem label-basiert automatisiert).

## Erweiterung

### Stabile IDs zu einer bestehenden Farbe/Größe ergänzen

Den Eintrag von der Kurz- in die Vollform überführen, z.B.:

```ts
colors: {
  navy: verified('French Navy', { selectValue: 'opt-navy', variantId: 'clr-1001' }),
}
```

Kein anderer Code ändert sich – `resolveColorLabel` liefert weiter nur das
Label, die Automatisierung nutzt ab sofort die stabilste Kennung.

### Produktspezifische Variant-IDs (z.B. needens data-color-id)

Führt ein Shop je Produkt abweichende IDs, gehören sie NICHT in `colors`/
`sizes`, sondern in `productOverrides` (Vorrang je Katalog-Produkt-ID):

```ts
productOverrides: {
  'gildan-ladies-heavy-t': { colors: { navy: verified('Navy', { variantId: '2305' }) } },
  'gildan-ladies-vneck-t': { colors: { navy: verified('Navy', { variantId: '343' }) } },
}
```

Vollständig additiv und ohne API-/Adapter-Umbau: Fehlt ein Override, greift
automatisch der per-Lieferant-Default (label-basiert). Die Auflösung
(`resolveColorVariant(map, colorId, productId)`) konsultiert erst den
Override, dann die Basis-Tabelle. Solange keine verifizierten
produktbezogenen IDs vorliegen, bleibt die label-basierte Lösung unverändert
aktiv.

### Neue Farbe oder Größe

Eine Zeile in der jeweiligen Tabelle unter `tables/` ergänzen (Kurz- oder
Vollform). `catalogConsistency.test.ts` erzwingt die Pflege: ein Produkt mit
unbekannter Farbe/Größe lässt `npm test` fehlschlagen.

### Neuen Lieferanten hinzufügen

1. `SupplierId`-Union in `src/lib/suppliers/types.ts` ergänzen.
2. Neue Tabelle `tables/<lieferant>.ts` anlegen (Vorlage:
   `textilGrosshandel.ts`) – Labels reichen zum Start, stabile IDs optional.
3. In `registry.ts` eintragen (das `Record<SupplierId, …>` erzwingt das per
   Compiler).
4. Adapter + Adapter-Registry-Eintrag ergänzen, siehe
   `lieferanten-architektur.md`.

## Tests

`npm test` führt alle Unit-Tests aus (Node-eigener Runner `node:test` via
**tsx** – kein Test-Framework, tsx ist reine devDependency). Abgedeckt u.a.:

- Feld-Auflösung Farbe/Größe/Artikelnummer inkl. aller Fehlerfälle
- Kurz-/Vollform-Normalisierung (Abwärtskompatibilität)
- **Erkennung fehlender IDs** (Fallback auf Label) und **ungültiger IDs**
  (leeres Label / leere ID-Felder → `invalid-variant`, Fail-Fast)
- **korrekte Nutzung vorhandener IDs** (Auswahl-Präferenz variant-id →
  select-value → sku → label)
- Positions-Übersetzung trägt die Deskriptoren, Alt-Felder unverändert
- Existenzprüfung inkl. Prototype-Sicherheit
- Registry-Vollständigkeit, Katalog-Konsistenz (reale Produkte ⇄ Tabellen)
- End-to-End im Worker: nicht auflösbare Position wird übersprungen

Die gesamte Schicht ist rein (kein I/O) – die Tests laufen ohne Datenbank
und ohne Browser.
```
