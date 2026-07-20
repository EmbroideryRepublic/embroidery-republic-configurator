# Leitfaden: einen neuen Lieferanten anbinden

Praxisanleitung für Wordans, Ralawise und jeden weiteren Shop. Sie beschreibt
**den einen Ablauf**, den alle Lieferanten teilen, und die Fallstricke, die uns
bei textil-grosshandel real Zeit gekostet haben.

Ergänzt (nicht ersetzt):
`lieferanten-architektur.md` (Aufbau) · `lieferanten-mapping.md`
(Farb-/Größen-Übersetzung) · `lieferanten-integrationen.md` (Stand je Shop) ·
`tg-automatisierung-ursachenanalyse.md` (die Fehlersuche im Detail).

---

## Der feste Ablauf

Für **jeden** Lieferanten identisch, festgelegt in `worker/supplierWorker.ts`:

```
login
└─ je Position:  resolveVariants → openProduct → selectColor
                 → setQuantity (je Größe) → addToCart
└─ confirmCart   (nach ALLEN Positionen, einmal pro Lauf)
└─ NUR bei mode === 'checkout':  checkout
```

Ein Adapter ändert diese Reihenfolge nie. Er liefert ausschließlich
**Selektor-Pläne** — das „Wo", nicht das „Wie". Die Interaktion selbst lebt
genau einmal in `adapters/selectionEngine.ts` und `adapters/shopActions.ts`.

Fehlt ein Plan, wirft der Adapter `notImplemented` (Fail-Fast) — er rät nicht.

---

## Was ein Adapter enthält

Ein vollständiger Adapter besteht aus vier Plänen und sonst nichts:

```ts
const XY_COLOR_PLAN: ControlSelectionPlan = {
  control: 'Farbe',
  targets: {
    // Nur Ziele aufnehmen, die im Shop VERIFIZIERT wurden.
    'variant-id': { kind: 'click', template: 'button[data-color="{value}"]' },
  },
};

const XY_SIZE_PLAN: ControlSelectionPlan = { control: 'Größe', targets: { label: { kind: 'fill', template: '…' } } };
const XY_LOGIN_PLAN: LoginPlan = { loginUrl, usernameSelector, passwordSelector, submitSelector, successSelector, successState };
const XY_ADD_TO_CART_PLAN: AddToCartPlan = { submitSelector, confirmationSelector };

export class XyAdapter extends BaseSupplierAdapter {
  readonly supplierId: SupplierId = 'xy';
  protected override colorPlan = XY_COLOR_PLAN;
  protected override sizePlan = XY_SIZE_PLAN;
  protected override loginPlan = XY_LOGIN_PLAN;
  protected override addToCartPlan = XY_ADD_TO_CART_PLAN;
  // checkout() NICHT überschreiben – siehe „Die Sicherheitszusage".
}
```

**Keine** DOM-Abfragen, **keine** `page.click()`-Aufrufe, **keine**
Warte-Logik im Adapter. Taucht so etwas auf, gehört es in die geteilten Helfer.

---

## Vorgehen in sechs Schritten

1. **Registry-Eintrag** in `registry.ts`: `id`, `label` (Anzeigename — landet im
   Audit), `baseUrl`, `credentialsEnv` (Namen der env-Variablen, nie Werte),
   `createAdapter`.
2. **Selektoren am echten Shop verifizieren.** Nur übernehmen, was dort
   tatsächlich existiert. Nichts ableiten, nichts schätzen.
3. **Mapping-Tabelle** anlegen (`mapping/tables/`) — Farb-/Größen-Entsprechungen.
   Mehrdeutige Farben bleiben **offen**, bis eine Entscheidung vorliegt; sie
   erscheinen im Abdeckungs-Report (`npm run coverage:suppliers`).
4. **Adapter** wie oben schreiben.
5. **E2E-Dry-Run-Test** nach dem Muster von
   `adapters/__tests__/textilGrosshandel.e2e.test.ts` (echtes Chromium gegen
   lokale Fixtures, die die reale DOM spiegeln).
6. **Zugangsdaten** in `.env.local` eintragen — **vom Betreiber**, nicht
   automatisiert. Kein Konto anlegen.

---

## Fallstricke (alle real aufgetreten)

### `fill()` löst keine Tastatur-Ereignisse aus

Der teuerste Fund. `page.fill()` setzt den Wert direkt. Shops, die ihre
„In den Warenkorb"-Schaltfläche per JavaScript freischalten, hören oft auf
`keyup` — und bleiben deaktiviert. Gemessen an textil-grosshandel:

```
nach fill(S=12)          → toBasket disabled = true
nach press(feld, 'End')  → toBasket disabled = false   (Wert bleibt 12)
```

Symptom war irreführend: Bestellungen mit **mehreren** Größen liefen durch
(die Folgeinteraktion kaschierte es), Bestellungen mit **einer** Größe nicht.

`setSizeQuantity()` bestätigt deshalb jeden Wert mit einem wertneutralen
`press(feld, 'End')`. Gilt für alle Lieferanten — nicht entfernen.

### Consent-Overlays fangen Klicks ab

`dismissConsent()` wartet bis zu 8 s auf die Consent-API und lehnt dann **alle**
Dienste ab (datensparsam, nie „akzeptieren"). Der Aufruf direkt nach `goto()`
ohne Warten geht ins Leere — der Manager wird asynchron nachgeladen.

### Klebende Kopfzeilen fangen Klicks ab

`clearClickObstructions()` setzt `position: fixed/sticky`-Kopfzeilen auf
`static`. Der Selektorsatz ist **bewusst eng auf Kopfzeilen begrenzt**: ein
pauschales Neutralisieren aller `fixed`-Elemente zerstört Login-**Modals**
(needen braucht genau so eines).

### Karussell-Elemente sind 0 × 0

Farb-Swatches in Swipern sind für Playwright unsichtbar. `selectionEngine`
hat dafür einen JS-Klick-Fallback — im Protokoll erkennbar als
`Sichtbarkeits-Fallback`.

### Ein bestätigter Klick ist noch kein Warenkorb

Der folgenschwerste Fund. `addToCart` meldete monatelang Erfolg, während der
Warenkorb beim Betreiber **leer** blieb: der Shop überträgt ihn erst beim
**nächsten Seitenaufruf** dauerhaft ins Konto, und der Worker schloss den
Browser sofort danach. Gemessen mit identischem Artikel und Konto:

| Vorgehen | Artikel danach im Konto? |
|---|---|
| hinzufügen → Warenkorbseite laden → schließen | **ja** |
| hinzufügen → sofort schließen | **nein** |

Deshalb gibt es `confirmCart` als eigenen Pflichtschritt. Für einen neuen
Lieferanten heißt das: **einen `cartConfirmationPlan` hinterlegen**, dessen
`nonEmptySelector` in BEIDE Richtungen am realen Shop geprüft ist (vorhanden
bei befülltem, abwesend bei leerem Warenkorb). Fehlt der Plan, meldet der
Schritt `not_implemented` — sichtbar, nicht still.

Die Bestätigung des Shops (`#basketItemCountAndPrice` o. ä.) belegt nur, dass
der **Klick** ankam. Sie sagt nichts über Dauerhaftigkeit.

### Ein Timeout ist keine Diagnose

`page.click: Timeout 30000ms exceeded` sagt nicht, **warum**. Beide kritischen
Stellen lesen deshalb den Zustand der Seite aus:

- `performLogin` → die Fehlermeldung des Shops
  (z. B. *„Falsche E-Mail-Adresse oder falsches Passwort!"*)
- `performAddToCart` → fehlt die Schaltfläche, ist sie deaktiviert, welchen
  Hinweis zeigt die Seite

Genau diese zweite Meldung hat den `fill()`-Bug sichtbar gemacht. Bei einem
neuen Shop lohnt sich derselbe Reflex: **die Seite fragen, nicht raten.**

---

## Pflichten gegenüber dem Audit-Trail

Jeder Lauf schreibt einen vollständigen Datensatz (`supplier_orders.last_run`
plus ein `attempt`-Event in `supplier_order_events`). Ein Adapter muss dafür
nichts tun — aber er darf nichts unterschlagen:

| Feld | Inhalt |
|---|---|
| `supplierName`, `supplierId` | Lieferant (Anzeigename aus der Registry) |
| `mode` | `prepare-cart` oder `checkout` |
| `startedAt` / `finishedAt` / `durationMs` | Zeitpunkt und Dauer des Laufs |
| `positions[]` | je Position: Produkt, Artikelnummer, Farbe **inkl. Varianten-ID**, **vollständige Größenverteilung mit Stückzahlen**, Gesamtmenge |
| `steps[]` | Ergebnis **jedes** Schrittes: Status, Zeitpunkt, Dauer, Größe, Stückzahl, genutzte Selektionsstrategie, Fehlertext |
| `logs[]` | Protokollzeilen der Adapter (Consent, Layout-Eingriffe, Selektionen) |

Der Positions-Schnappschuss wird **vor** den Browser-Schritten festgehalten —
so steht die vollständige Größenverteilung auch dann im Audit, wenn ein
einzelner Schritt später scheitert. Katalog und Mapping ändern sich; das Audit
muss auch in einem Jahr noch belegen, was damals bestellt wurde.

Ein Adapter, der eigene Zustände kennt, meldet sie über `ctx.log(...)` — dort
landen sie in `logs[]`.

---

## Die Sicherheitszusage: prepare-cart bestellt nie

Zwei **voneinander unabhängige** Sperren:

1. Der Worker führt `checkout` ausschließlich bei `mode === 'checkout'` aus.
   `createSupplierOrder()` setzt standardmäßig `'prepare-cart'`, und kein
   Aufrufer setzt den Modus um.
2. **Kein Adapter implementiert `checkout()`.** Alle erben die
   `notImplemented`-Basisimplementierung. Selbst wenn Sperre 1 fiele, entstünde
   keine Bestellung.

Festgehalten in `worker/__tests__/prepareCartSafety.test.ts` — inklusive einer
Prüfung über **alle** registrierten Adapter. Ein neuer Adapter ist damit
automatisch mit abgedeckt.

> **Regel:** `checkout()` bleibt `notImplemented`, bis der Betreiber eine
> automatische Bestellung ausdrücklich beauftragt. Es ist der einzige Schritt,
> der Geld kostet.
