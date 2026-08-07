# State-Management

Der Client-Zustand liegt in **Zustand**-Stores (`src/stores/`). Zustand wurde
gewählt, weil der Konfigurator-Zustand sich sehr häufig ändert (Drag-Events,
Live-Vorschau) und Zustand gezielte Abonnements ohne Re-Render-Kaskaden
erlaubt – anders als Context, das alle Verbraucher neu rendert.

> Serverseitig gilt weiterhin: **Der Server ist die einzige Wahrheit** (Preise,
> Mengen, Steuern werden serverseitig neu berechnet, siehe
> [architektur.md](architektur.md)). Die Stores halten nur den Bearbeitungs-
> und Sitzungszustand des Clients.

## Die sieben Stores

| Store | Datei | Hält | Persistenz (localStorage) |
|-------|-------|------|---------------------------|
| **configuratorStore** | `configuratorStore.ts` | Die eigentliche Konfiguration: Produkt, Farbe, Veredelung, Größen/Mengen, platzierte Elemente, Preis, Undo/Redo | ja (Design überlebt Reload) |
| **browserStore** | `browserStore.ts` | Navigationszustand des Produktbrowsers: offene Gruppe, gewählte Produktart, Scrollposition | `konfigurator-browser` |
| **cartStore** | `cartStore.ts` | Warenkorbpositionen | `konfigurator-cart` |
| **favoritesStore** | `favoritesStore.ts` | Gemerkte Produkt-IDs | `konfigurator-favorites` |
| **currencyStore** | `currencyStore.ts` | Anzeigewährung (EUR/CHF, Näherungskurs – **kein** Live-Kurs) | `konfigurator-currency` |
| **languageStore** | `languageStore.ts` | Sprache (de/en) | `konfigurator-language` |
| **uiStore** | `uiStore.ts` | Kurzlebiger, seitenübergreifender UI-Zustand: nur `warenkorbOffen` (steuert die Warenkorb-Schublade, die von jeder Seite über die Kopfzeile geöffnet wird) | nein (bewusst nicht persistiert) |

### configuratorStore – das Herz

Zustandsfelder (`initialState`):

- `printMethod: PrintMethod` – Veredelungsart (`'dtf'` | `'embroidery'`). **Produktunabhängig**: bleibt beim Produktwechsel erhalten.
- `productId`, `colorId` – aktuelle Auswahl (IDs, nicht Objekte).
- `sizeQuantities: Record<string, number>` – je Größe eine Stückzahl.
- `activeView: PrintView` – aktuell sichtbare Ansicht (`front`/`back`/`sleeve_left`/`sleeve_right`).
- `elements: ConfigElement[]` – platzierte Logos/Texte (alle Ansichten; gefiltert wird beim Rendern).
- `unitPrice`, `totalPrice` – vom Server berechnet, hier gespiegelt für die Anzeige.
- `history` / `future` – Undo/Redo-Stapel; `selectedElementId`, `previewSize`, `clipboardElement`.

Wichtige Aktionen: `setProduct`, `setColor`, `setSizeQuantity`, `setSizeQuantities`
(Sammelsetzer, für die Auswahl-Übernahme beim Produktwechsel), `setPrintMethod`,
`addElement`/`updateElement`/`removeElement`, `undo`/`redo`,
`syncElementsToPrintAreas` (passt Elemente nach Produkt-/Methodenwechsel an die
neuen Druckflächen an) und `loadCartItemForEditing` (lädt eine Warenkorbposition
zum Bearbeiten zurück in den Editor).

## Abonnement-Disziplin (Performance)

Zwei Muster halten die Re-Renders klein und sind beim Weiterentwickeln
einzuhalten:

1. **Schmale Selektoren.** Komponenten abonnieren nur die Felder, die sie
   wirklich brauchen (`useConfiguratorStore((s) => s.colorId)`), nicht den
   ganzen State. Der `ProduktBrowser` ist zusätzlich `React.memo`, sodass
   Canvas- und Preisänderungen ihn nicht neu rendern.

2. **Kein Abonnement für Hochfrequenz-Schreibzugriffe.** Beispiel Scrollposition:
   Der `ProduktBrowser` abonniert nur den **Setter** `setModellScrollTop`
   (stabil) und liest den Wert bei Bedarf über
   `useBrowserStore.getState().modellScrollTop`. Würde er den Wert abonnieren,
   löste jedes Scroll-Event einen Re-Render der ganzen Liste aus.

## Hydration (SSR)

Persistierte Stores rehydrieren erst **nach** dem ersten Client-Render. Wo der
Server-HTML sonst vom Client abwiche (Hydration-Mismatch), wird ein
`hydriert`-Flag gesetzt und der persistierte Wert erst danach angewandt – siehe
`ProduktBrowser` (`offeneGruppe`/`gewaehlt`) und `ConfiguratorPrototype`
(`isHydrated`, damit ein wiederhergestelltes Design nicht überschrieben wird).

## Datenfluss (Kurzform)

```
config/* (statische Katalog-/Preis-/Druckflächendaten)
        │  eingelesen von
        ▼
Zustand-Stores  ◄──── Nutzerinteraktion (Auswahl, Drag, Eingabe)
        │  Preisrelevante Änderung ⇒
        ▼
Server-Neuberechnung (lib/pricing) ⇒ unitPrice/totalPrice zurück in den Store
        │  Bestellung ⇒
        ▼
Server Action (lib/actions) ⇒ atomare Order (create_order_atomic) ⇒ Postgres
```

Siehe [konfigurator-logik.md](konfigurator-logik.md) für die Konfigurator-
Bausteine und [datenbankschema.md](datenbankschema.md) für das DB-Modell.
