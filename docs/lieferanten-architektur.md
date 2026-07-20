# Supplier Engine – Lieferanten-Automatisierung (Architektur)

Stand: Juli 2026 · Status: **Architektur + Admin-Integration vollständig (End-to-End getestet), Browser-Logik bewusst noch nicht implementiert**

## Ziel

Im Adminbereich soll je Bestellung ein Button „Beim Lieferanten bestellen" erscheinen.
Ein Klick startet einen Playwright-Worker, der den Warenkorb beim jeweiligen
Lieferanten (zuerst textil-grosshandel.eu) automatisch vorbereitet. Die Architektur
ist von Anfang an mehrlieferantenfähig (Wordans, Needen, Ralawise, …).

## Ordnerstruktur

```
src/lib/suppliers/                  ← die Supplier Engine (neu)
  types.ts                          ← zentrales Domänen-Vokabular (abhängigkeitsfrei)
  registry.ts                       ← Lieferanten-Beschreibungen + Adapter-Factories
  buildSupplierPositions.ts         ← Bestellpositionen → Lieferantenpositionen (pur, testbar)
  createSupplierOrder.ts            ← Service: createSupplierOrder(orderId)
  index.ts                          ← öffentliche Modul-Oberfläche (Barrel)
  adapters/
    SupplierAdapter.ts              ← Interface + abstrakte Basisklasse (Stub-Verhalten)
    TextilGrosshandelAdapter.ts     ← Adapter textil-grosshandel.eu (mit Shop-Notizen)
    WordansAdapter.ts               ← Stub
    NeedenAdapter.ts                ← Stub
    RalawiseAdapter.ts              ← Stub
  worker/
    supplierWorker.ts               ← runSupplierJob(): Ablauf-Orchestrierung
    browserSession.ts               ← EINZIGER Playwright-Integrationspunkt (echtes Chromium)
    selectionEngine.ts (adapters/)  ← Prefer-ID→Label-Auswahl + Methoden-Logging
  mapping/                          ← Übersetzung interne Darstellung → Lieferantenbezeichnung
    resolvePosition.ts              ← ganze Position übersetzen (erst im Worker aufgerufen)
    resolve.ts / registry.ts        ← Feld-Auflösung (Label + stabile IDs) + Tabellen je Lieferant
    selectors.ts                    ← preferredVariantSelector: stabile ID vor sichtbarem Text
    tables/*.ts                     ← eigene Tabelle je Lieferant (siehe lieferanten-mapping.md)

src/config/products/
  types.ts                          ← ProductConfig um `supplier?: SupplierProductRef` erweitert
  supplierRefs.ts                   ← zentrale Zuordnung productId → {Lieferant, SKU, URL} (neu)
  index.ts                          ← heftet supplierRefs beim Registrieren an die Produkte

supabase/migrations/
  0005_supplier_orders.sql          ← Tabelle supplier_orders (Snapshot + Status je Bestellung×Lieferant)

.env.local.example                  ← SUPPLIER_*-Zugangsdaten-Variablen ergänzt
```

## Datenfluss

```
Admin-UI (später: Button)
   │
   ▼
createSupplierOrder(orderId)                       [createSupplierOrder.ts]
   1. orders + order_items aus Supabase laden
   2. buildSupplierPositions(orderId, items)       [buildSupplierPositions.ts]
        → SupplierOrderDraft
          • positionsBySupplier: je Lieferant gruppierte Positionen
          • unresolved: Produkte OHNE supplierRefs-Eintrag (werden dem
            Admin gemeldet statt still ignoriert)
   3. Snapshot je Lieferant in supplier_orders upserten (Status 'draft')
   4. SupplierAutomationJob[] zurückgeben (JSON-fähig)
   │
   ▼
runSupplierJob(job)                                [worker/supplierWorker.ts]
   • Adapter über Registry wählen (createSupplierAdapter)
   • Zugangsdaten aus env lesen (getSupplierCredentials)
   • Browser-Sitzung holen (browserSession.ts – echtes Chromium via Playwright)
   • Fester Ablauf:
       login
       je Position:
         resolveVariants  ← Übersetzung interne→Lieferantenbezeichnung
                             (mapping/, siehe lieferanten-mapping.md);
                             schlägt sie fehl, wird die Position
                             übersprungen und NICHT bestellt
         openProduct → selectColor → setQuantity (je Größe) → addToCart
       nur im Modus 'checkout': checkout
   • Ergebnis: SupplierWorkerRunResult mit Schrittprotokoll
     (ok / failed / not_implemented je Schritt)
```

Die Übersetzung der Varianten (Farbe/Größe/Artikelnummer) in die
Bezeichnungen des jeweiligen Shops geschieht bewusst erst an dieser
Worker-Grenze über eine eigene **Mapping-Schicht** – Details, Erweiterung
um neue Lieferanten und das Fehlerverhalten stehen in
[`lieferanten-mapping.md`](./lieferanten-mapping.md).

## Zentrale Typen (types.ts)

| Typ | Zweck |
| --- | --- |
| `SupplierId` | geschlossene Union `'textil-grosshandel' \| 'wordans' \| 'needen' \| 'ralawise'` – Registry ist darüber VOLLSTÄNDIG typgeprüft |
| `SupplierProductRef` | Bezugsquelle eines Produkts: supplierId, articleNumber, productUrl, urlVerified |
| `SupplierOrderPosition` | eine Position beim Lieferanten (Produkt × Farbe × Größenverteilung) – enthält alles, was der Worker braucht (URL, SKU, Farbname), damit er den Katalog nicht laden muss |
| `SupplierOrderDraft` | alle Positionen einer Bestellung, je Lieferant gruppiert + unresolved-Liste |
| `SupplierAutomationJob` | Übergabeformat an den Worker: jobId (`orderId:supplierId`), mode, positions – bewusst rein JSON-fähig |
| `SupplierJobMode` | `'prepare-cart'` (Standard: Warenkorb füllen, Admin schließt ab) oder `'checkout'` |
| `AutomationPage` | minimaler struktureller Platzhalter für Playwrights `Page` (goto/click/fill/waitForSelector) – bei Integration wird nur der Typ getauscht |
| `SupplierWorkerRunResult` | Laufergebnis mit Schrittprotokoll |
| `NotImplementedError` | markiert Architektur-Stubs; der Worker protokolliert sie als `not_implemented` statt `failed` |

## Adapter-Interface (adapters/SupplierAdapter.ts)

Jeder Lieferant implementiert:

```ts
login(ctx)                       // Konto-Anmeldung (einmal je Job)
openProduct(ctx, position)       // Produktseite DIREKT über position.productUrl
selectColor(ctx, position)       // Farbvariante wählen (Adapter übersetzt Farbnamen)
setQuantity(ctx, size, quantity) // Menge je Größe eintragen
addToCart(ctx)                   // Position in den Warenkorb
checkout(ctx)                    // nur im Modus 'checkout'
```

`BaseSupplierAdapter` liefert das gemeinsame Stub-Verhalten (Logging +
`NotImplementedError`). Konkrete Adapter überschreiben die Methoden nach und
nach mit echter Browser-Logik – der Worker bleibt unverändert.

**Neuen Lieferanten ergänzen (rein additiv):**
1. `SupplierId`-Union in `types.ts` erweitern.
2. Adapter-Datei unter `adapters/` anlegen (erbt `BaseSupplierAdapter`).
3. Descriptor in `registry.ts` eintragen (fehlender Eintrag = Compile-Fehler).
4. Produkte in `supplierRefs.ts` zuordnen, Zugangsdaten-Variablen in `.env.local`.

## Produktdaten

`ProductConfig.supplier?: SupplierProductRef` – gepflegt wird zentral in
`src/config/products/supplierRefs.ts` (eine Datei statt über 9 Marken-Dateien
verstreut; 1:1 in eine DB-Tabelle überführbar). `index.ts` heftet die Referenz
beim Registrieren an.

- **22 Produkte** haben verifizierte Einträge (Artikelnummer aus den
  Listungen von textil-grosshandel.eu, Produkt-URL per HTTP-Check bestätigt,
  `urlVerified: true`).
- **Offen (dokumentiert in supplierRefs.ts):** die 13 ursprünglichen
  Fruit-of-the-Loom-Produkte aus den ZIP-Datenblättern haben noch keine
  verifizierten Artikelnummern – ihre Positionen landen bis zur Nachpflege in
  der `unresolved`-Liste.

## Bestellungen / Persistenz

- `order_items` (bestehend) liefert productId/colorId/size_quantities je Position.
- **Migration 0005** ergänzt `supplier_orders`: ein Snapshot je
  (Bestellung × Lieferant) mit Status (`draft → cart_prepared → ordered/failed`),
  mode, positions (jsonb), unresolved (jsonb), last_run (jsonb,
  Schrittprotokoll). Unique auf (order_id, supplier_id) → erneutes
  createSupplierOrder aktualisiert statt zu duplizieren. RLS aktiv ohne
  öffentliche Policies (Zugriff nur über Service-Role wie bei den
  Produktionsdaten).

## Bewusste Entscheidungen

1. **Geschlossene `SupplierId`-Union + vollständige Registry** – Tippfehler und
   vergessene Adapter sind Compile-Fehler, keine Laufzeitfehler.
2. **Direkte Produkt-URLs statt Shop-Suche** – Suche ist fragil/mehrdeutig;
   URLs wurden vorab per HTTP-Check verifiziert.
3. **Worker kennt nur das Interface** – kein Shop-Wissen außerhalb der Adapter.
4. **`prepare-cart` als Standardmodus** – die Automatisierung endet vor dem
   Checkout; der Admin prüft den Warenkorb. `checkout` ist explizites Opt-in.
5. **`AutomationPage` als struktureller Platzhalter** – das Projekt kompiliert
   ohne Playwright-Abhängigkeit; die Integration tauscht nur
   `browserSession.ts` aus.
6. **Snapshot-Persistenz (jsonb)** – was gespeichert ist, ist garantiert das,
   was der Worker ausführt (Audit); Katalogänderungen wirken nicht rückwirkend.
7. **unresolved-Liste statt stillem Verschlucken** – Produkte ohne
   Bezugsquelle werden sichtbar gemeldet.
8. **Keine erfundenen Daten** – nur verifizierte Artikelnummern/URLs sind
   eingetragen; Lücken sind als TODO dokumentiert.

## Was bereits funktioniert

- Kompletter Datenweg Bestellung → Draft → Jobs → Worker-Lauf mit
  Schrittprotokoll (Outcome `not_implemented`, da Adapter-Stubs).
- Persistenz-Schema und Upsert-Logik.
- Typprüfung/Lint des gesamten Moduls.

## Admin-Bereich (`/admin`) – umgesetzt

```
src/app/admin/layout.tsx                    ← Zugangs-Gate + Kopfleiste/Abmelden
src/app/admin/page.tsx                      ← Bestellliste (Nummer, Datum, Typ, Kunde, Summe, Status, Zahlung)
src/app/admin/bestellung/[id]/page.tsx      ← Detail: Kontakt/Versand/Positionen + Lieferanten-Panel
src/components/admin/AdminLoginForm.tsx     ← Login-Formular (useFormState)
src/components/admin/PrepareSupplierButton.tsx ← der "Beim Lieferanten bestellen"-Button
src/lib/admin/auth.ts                       ← isAdminAuthenticated/isAdminConfigured
src/lib/admin/data.ts                       ← Leser: listOrders/getOrderDetail (inkl. Live-Draft)
src/lib/actions/admin.ts                    ← Schreiber: adminLogin/adminLogout/prepareSupplierOrderAction
```

**Zugangsschutz-Entscheidung:** EIN Admin-Secret (`ADMIN_SECRET`, mind. 12
Zeichen) aus `.env.local`, gehalten als httpOnly-Cookie (12h). Begründung:
es gibt bewusst keine Kundenkonten und genau einen Admin-Nutzerkreis –
ein env-Secret ist der kleinste sichere Mechanismus und sofort rotierbar.
Ohne gesetztes Secret ist der Bereich KOMPLETT gesperrt (sicherer Default).
Schreibende Actions prüfen die Authentifizierung zusätzlich selbst
(Defense in Depth). `lib/admin/auth.ts` ist die einzige Austauschstelle,
falls später ein echtes Login-System nötig wird.

**Detailseiten-Verhalten:**
- Lieferanten-Vorschau wird LIVE berechnet (buildSupplierPositions) –
  der Admin sieht vor dem Klick, was automatisiert würde, inkl.
  Produktseiten-Links und der unresolved-Produkte.
- Button → `prepareSupplierOrderAction`: createSupplierOrder (Snapshot
  'draft' in supplier_orders) → runSupplierJob je Lieferant →
  Laufprotokoll nach `supplier_orders.last_run`, Status-Mapping
  prepared→'cart_prepared', not_implemented→'draft', sonst 'failed'.
- Status-Panel zeigt die persistieren Läufe mit aufklappbarem
  Schrittprotokoll.

**End-to-End getestet** (mit Seed-Bestellung `gildan-heavy-t`/Royal):
Login → Liste → Detail → Vorschau (G5000, L×3/M×5, verifizierter Link) →
Button → Status `draft` + Protokoll „not_implemented (6 Schritte)" mit
sauberen Stub-Meldungen je Schritt. Zwei dabei gefundene Probleme wurden
behoben:
1. Fehlende Lieferanten-Zugangsdaten ließen die Action abstürzen → jetzt endet
   der Lauf kontrolliert mit fehlgeschlagenem login-Schritt und klarer
   env-Meldung (supplierWorker.ts).
2. PostgREST-Schema-Cache kannte die frisch angelegte Tabelle nicht →
   `notify pgrst, 'reload schema'` nach DDL nötig (dokumentiert).

**Migration 0005 wurde auf die Datenbank angewendet** (per DIRECT_URL aus
.env.local; das Supabase-CLI-Projekt ist nicht verlinkt). Gleicher Weg für
künftige Migrationen, bis das CLI verlinkt ist.

## Was bewusst noch fehlt (nächste Phasen)

1. **Playwright-Integration**: `npm i playwright`, `browserSession.ts` auf
   echten Chromium umstellen (einziger Integrationspunkt).
2. **TextilGrosshandelAdapter-Logik**: Login-Formular, Farb-/Größenmatrix der
   Produktseite, Warenkorb (Shop-Notizen stehen im Adapter-Kopf).
3. **Echte Lieferanten-Zugangsdaten** in `.env.local` (aktuell Dev-Platzhalter
   für textil-grosshandel).
4. **Farbnamen-Mapping** unserer Farb-IDs auf Shop-Farbnamen je Lieferant
   (Zuständigkeit des jeweiligen Adapters).
5. **supplierRefs-Nachpflege** für die 13 alten FOTL-Produkte.
```
