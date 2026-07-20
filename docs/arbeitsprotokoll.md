# Arbeitsprotokoll – autonome Session (Juli 2026)

Fortlaufende Kurzdoku je abgeschlossenem Abschnitt: Was wurde implementiert,
welche Dateien, warum diese Lösung, was sind die nächsten Schritte.
TODO-Gesamtstand siehe Tabelle am Ende.

---

## Abschnitt 1: Admin-Bereich + Lieferanten-Integration ✅

**Was:** `/admin` mit Login-Gate, Bestellliste, Bestell-Detailseite und dem
Button „Beim Lieferanten bestellen" (ruft createSupplierOrder + Worker auf,
persistiert Laufprotokolle). Migration 0005 auf die Datenbank angewendet.

**Dateien (neu):** `src/app/admin/{layout,page}.tsx`,
`src/app/admin/bestellung/[id]/page.tsx`,
`src/components/admin/{AdminLoginForm,PrepareSupplierButton}.tsx`,
`src/lib/admin/{auth,data}.ts`, `src/lib/actions/admin.ts`.
**Geändert:** `src/lib/suppliers/worker/supplierWorker.ts` (fehlende
Zugangsdaten → kontrollierter failed-login statt Absturz),
`.env.local.example` (+ADMIN_SECRET).

**Warum so:** Ein env-Secret als Zugangsschutz (kein Login-System), weil es
bewusst keine Kundenkonten gibt und genau ein Admin existiert;
`lib/admin/auth.ts` ist die einzige Austauschstelle für später. Leser
(Server Components) und Schreiber (Server Actions) strikt getrennt.
Lieferanten-Vorschau wird live berechnet, damit der Admin VOR dem Klick
sieht, was automatisiert würde (inkl. Produkte ohne Bezugsquelle).

**Getestet:** End-to-End mit Seed-Bestellung (gildan-heavy-t/Royal):
Login → Liste → Detail → Vorschau (G5000, verifizierter Link) → Button →
Status-Panel `draft` + aufklappbares Protokoll „not_implemented (6 Schritte)".
Zwei dabei gefundene Fehler behoben (Credentials-Crash, PostgREST-Schema-
Cache nach DDL → `notify pgrst, 'reload schema'`).

**Nächste Schritte:** echte Browser-Logik im TextilGrosshandelAdapter
(Playwright), echte Lieferanten-Zugangsdaten, Statusverwaltung erweitern.

---

## Abschnitt 2: Code-Analyse + risikoarme Verbesserungen ✅

**Gefunden und behoben:**
1. **Künstliche Wartezeiten entfernt** – `getPrintAreas()` (150ms) und
   `getPricingRules()` (100ms) simulierten „DB-Latenz" bei jedem Produkt-/
   Methodenwechsel bzw. der ersten Preisberechnung. Async-Signaturen
   bewusst beibehalten (spätere DB-Anbindung = reiner Implementierungs-
   tausch). Dateien: `src/config/printAreas.ts`, `src/config/pricingRules.ts`.
2. **Foto-echte Farb-Swatches** (offener Punkt aus früherer Session):
   neues Skript `scripts/measureSwatchHexes.mjs` misst je Farbordner den
   echten Stoffton aus dem front.png (5×5-Mittelwert bei 35%/55%) und
   generiert `src/config/products/measuredSwatchHexes.ts` (272 Ordner).
   `colorHelpers.ts` bevorzugt diese Werte, Fallback COLOR_META;
   zweifarbige Produkte (Kontrast/Raglan) bleiben manuell gepflegt.
   Live verifiziert (Gildan Royal #385ABA, Orange #E93B06 …).
3. **Totes Skript entfernt:** `scripts/addBrandProductFromSpreadshirt.mjs`
   (durch `ingestSpreadshirtProduct.mjs` ersetzt).

**Geprüft, bewusst NICHT geändert:**
- `movementWidthCm`-Konsistenz nach der Torso-Grenzen-Umstellung: leitet
  sich aus dem Seitenverhältnis derselben Box ab → automatisch konsistent
  (die Umstellung hat eine frühere Torso-cm-vs-Silhouetten-Pixel-Spannung
  sogar beseitigt). Kein Handlungsbedarf.
- `ownCollection.ts` + zugehörige Bilder: nicht mehr im Katalog registriert,
  aber als Datenbestand unschädlich – Löschen wäre reines Aufräumen mit
  Restrisiko, verschoben.
- `buildOrderNumber()` nutzt das AKTUELLE Jahr – eine über den Jahres-
  wechsel rekonstruierte Bestellnummer könnte theoretisch abweichen.
  Verhaltensänderung nötig → notiert, nicht angefasst.
- React-DevOverlay-Warnung („Cannot update HotReload while rendering …")
  trat nur während des inzwischen behobenen 500ers auf; danach nicht mehr
  reproduzierbar.

---

## Abschnitt 4: Supplier-Mapping-Schicht ✅

**Was:** Eine modulare Übersetzungsschicht zwischen der einheitlichen
internen Darstellung (unsere Farb-IDs, Größen, Produktschlüssel) und den
Bezeichnungen der einzelnen Lieferanten. Die Übersetzung passiert BEWUSST
erst unmittelbar vor der Browser-Automatisierung (im Worker, an der
Adapter-Grenze); alle vorgelagerten Schritte bleiben rein intern. Existiert
eine angeforderte Farbe/Größe beim Lieferanten nicht, entsteht ein klarer
`SupplierMappingError` und die Position wird NICHT automatisiert bestellt.

**Dateien (neu):** `src/lib/suppliers/mapping/` mit `types.ts`,
`SupplierMappingError.ts`, `resolve.ts` (Feld-Auflösung + Existenzprüfung),
`resolvePosition.ts` (Positions-Übersetzung, werfend + sammelnd),
`registry.ts` (`Record<SupplierId,…>`, Vollständigkeit erzwungen),
`tables/{textilGrosshandel,needen,wordans,ralawise}.ts`, `index.ts`;
Tests unter `mapping/__tests__/` und `worker/__tests__/`.
**Geändert:** `types.ts` (+Step `resolveVariants`), `SupplierAdapter.ts`
(selectColor/setQuantity erhalten die bereits übersetzte Shop-Bezeichnung –
die Übersetzung wandert vom Adapter in die zentrale Schicht),
`supplierWorker.ts` (resolveVariants-Schritt je Position; nicht auflösbare
Position wird übersprungen), `package.json` (+`test`-Script, +devDep `tsx`).

**Warum so:** Getrennte Mapping-Registry (Datenübersetzung) neben der
Adapter-Registry (Browser-Steuerung) – ein Lieferant pflegt seine
Farb-/Größentabelle unabhängig vom noch nicht implementierten Adapter. Jede
Tabelle ist zugleich Existenz-Whitelist; `hasOwnProperty`-basierte Prüfung
gegen Prototype-Verwechslung. `labelsVerified: false` markiert die
Label-Strings analog zu `urlVerified` als noch abzugleichen (die
Existenzprüfung ist davon unabhängig).

**Getestet:** Unit-Tests grün (`npm test`, Nodes `node:test` via **tsx**,
kein Test-Framework nötig): Feld-Auflösung inkl. Fehlerfälle,
Prototype-Sicherheit, Positions-Übersetzung, Registry-Vollständigkeit,
Katalog-Konsistenz (reale Produkte ⇄ Tabellen als Regressionsschutz) und
End-to-End im Worker (nicht auflösbare Position wird übersprungen).
`tsc --noEmit` + `eslint src` sauber. Doku: `docs/lieferanten-mapping.md`.

### Abschnitt 4b: Erweiterung um stabile Varianten-Kennungen ✅

**Was:** Neben den sichtbaren Labels können Farben/Größen jetzt stabile
Lieferantenkennungen tragen (`variantId`, `selectValue`, `sku`), damit die
spätere Playwright-Automatisierung nicht allein auf umbenennbaren Text
angewiesen ist. Einheitliches Eintrags-Schema `SupplierVariantEntry =
string | SupplierVariant`: die **Kurzform (String) bleibt exakt die alte
Schreibweise** (`'Königsblau'` ≡ `{ label: 'Königsblau' }`) → voll
abwärtskompatibel, keine bestehende Tabelle geändert. Farben UND Größen
nutzen dasselbe Schema und denselben Resolver (die geprüfte
Vereinheitlichung); eine noch generischere Dimensions-Struktur wurde
bewusst zugunsten typsicherer expliziter `colors`/`sizes` verworfen.

**Dateien:** neu `mapping/selectors.ts` (`preferredVariantSelector`:
variant-id → select-value → sku → label), `mapping/__tests__/variantIds.test.ts`.
Geändert: `types.ts` (`SupplierVariant`/`SupplierVariantEntry`, +Felder
`colorVariant`/`sizeVariants` in `ResolvedSupplierPosition`, Reason
`invalid-variant`), `resolve.ts` (`normalizeVariant`, Validierung, neue
`resolve*Variant`-Funktionen; `resolve*Label` bleiben als dünne Wrapper),
`resolvePosition.ts` (optionaler Map-Override für DI/Tests, füllt
Deskriptoren), `SupplierAdapter.ts` (selectColor/setQuantity erhalten jetzt
den vollen `SupplierVariant` und wählen per `preferredVariantSelector` die
stabilste Kennung), `supplierWorker.ts` (reicht Deskriptoren durch).

**Validierung/Fail-Fast:** leeres Label oder ein deklariertes, aber leeres
ID-Feld → `invalid-variant` (wie fehlender Eintrag behandelt). Die
Fail-Fast-Strategie bleibt unverändert: Wirft die Auflösung, wird die
Position sauber protokolliert und übersprungen.

**Getestet:** 37 Unit-Tests grün (22 bestehende **unverändert** + 15 neue):
Normalisierung, Auflösung mit IDs, Label-Wrapper-Abwärtskompatibilität,
Erkennung fehlender IDs (Fallback) und ungültiger IDs (Fail-Fast),
Auswahl-Präferenz, Positions-Deskriptoren bei unveränderten Alt-Feldern.
`tsc` + `eslint` sauber. Doku aktualisiert.

**Nächste Schritte:** stabile IDs je Lieferant beim Analysieren des realen
Shops eintragen (Kurz- → Vollform), Labels/IDs dann `labelsVerified: true`;
Wordans-/Ralawise-Tabellen befüllen, sobald diese Lieferanten Produkte
bekommen.

---

## Abschnitt 8: Vollautonomer Lieferantenprozess ✅

**Was:** Der gesamte Ablauf läuft ohne manuelle Admin-Aktion.

- **Automatische Übergabe** (`lifecycle/enqueue.ts`): nach erfolgreicher
  Rechnungs-Bestellung (not_required) erzeugt submitOrder je Lieferant
  automatisch einen Supplier-Order und reiht ihn ein (draft→queued,
  idempotent). Karte/PayPal: Hook für künftigen Stripe-`paid`-Webhook.
- **Hintergrund-Processor** (`orchestrator.ts`): `processDueSupplierOrders`
  verarbeitet fällige (queued + next_attempt_at≤now); geschützter
  Cron-Endpoint `/api/cron/process-supplier-orders` (Bearer CRON_SECRET,
  ohne Secret 503). Laufende via atomarem Lock übersprungen.
- **Crash-Recovery** (`reclaimStaleLocks`): verwaiste `processing`-Locks
  (>10 min) werden automatisch → `queued` zurückgesetzt und neu verarbeitet.
- **Admin-Monitoring** (`/admin/lieferanten-bestellungen`): Status je
  Bestellung×Lieferant, Versuche, nächster Retry, letzter Fehler, Audit-
  Verlauf; Aktionen Retry/Pause/Cancel + „Fällige jetzt verarbeiten".
  Neuer Status `paused` (Migration 0007).

**Dateien:** neu `lifecycle/enqueue.ts`, `app/api/cron/process-supplier-orders/route.ts`,
`app/admin/lieferanten-bestellungen/page.tsx`, `components/admin/{SupplierOrderActions,RunProcessorButton}.tsx`,
Migration `0007_supplier_order_paused.sql` (angewendet). Geändert:
`status.ts` (+paused), `orchestrator.ts` (reclaimStaleLocks/
processDueSupplierOrders/pause/cancel), `store.ts`, `orders.ts` (Auto-
Übergabe), `admin.ts` (+4 Actions), `admin/data.ts` (Pipeline-Loader),
`admin/layout.tsx` (Nav), `.env.local.example` (CRON_SECRET).

**Getestet:** 65 Tests grün, tsc/eslint sauber. **Live-E2E des autonomen
Ablaufs:** echte Rechnungs-Bestellung → automatisch beide Lieferanten
queued → Processor → blocked (Dry-Run); verwaister Lock vom Reaper
reclaimt + neu verarbeitet (Audit lückenlos); Cancel-Aktion live.

**Offen:** nur noch Adapter-Vervollständigung (login/addToCart/checkout,
TG-Farbe) + Zugangsdaten → dann `SUPPLIER_AUTOMATION_ENABLED=1` (Nutzer).

---

## Abschnitt 7: Produktiver Bestellablauf — Lebenszyklus-Fundament ✅

**Analyse:** Kundenauftrag (submitOrder) und Lieferantenbestellung waren
entkoppelt; letztere lief nur manuell, ohne Statusmaschine/Lock/Retry/
Idempotenz/Audit. Vollständige Analyse + priorisierte Roadmap:
`docs/produktiver-bestellablauf.md`.

**Umgesetzt (Fundament):**
- **Lebenszyklus-Statusmaschine + Retry-Policy** (`lifecycle/status.ts`,
  rein/getestet): Status draft→queued→processing→{cart_prepared|ordered|
  blocked|failed}, canTransition, Fehlerklassifikation transient/blocked/
  permanent, exponentielles Backoff bis MAX_ATTEMPTS, Outcome→Status.
- **Migration 0006:** supplier_orders +attempt_count/max_attempts/locked_at/
  locked_by/last_error/next_attempt_at; neue append-only Tabelle
  `supplier_order_events` (jeder Statuswechsel: from/to/reason/detail).
  Additiv, RLS. **Auf die DB angewendet.**
- **Store** (`lifecycle/store.ts`): recordEvent, atomarer acquireLock
  (verhindert parallele Verarbeitung, übernimmt verwaiste Locks nach 10 min),
  releaseLock, transition mit optimistischer Sperre + Audit.
- **Orchestrator** (`lifecycle/orchestrator.ts`): processSupplierOrder
  (Lock→Snapshot laden→Dry-Run/echter Lauf→Klassifikation→Transition→Events→
  Unlock), requeueForProcessing (ordered/cancelled geschützt),
  isAutomationEnabled (Test/Prod-Flag `SUPPLIER_AUTOMATION_ENABLED`).
- **Idempotenz:** createSupplierOrder überschreibt den Status nicht mehr
  (Snapshot-Refresh statt Reset); Admin-Action auf den Orchestrator
  umgestellt (PrepareSupplierButton zeigt Status je Lieferant).

**Getestet:** 64 Tests grün (+14 Lifecycle), tsc/eslint sauber. Live-E2E über
Admin-Button (Seed-Bestellung): draft→processing→blocked (Dry-Run),
attempt_count=1, Lock freigegeben, Audit-Log mit 3 lückenlosen Ereignissen.
Test/Prod-Flag in `.env.local.example` dokumentiert.

**Nächste Prioritäten (dokumentiert):** Auto-Trigger nach Bestelleingang +
Hintergrund-Processor/Cron für fällige Jobs (echte Automatik ohne Klick);
Admin-Monitoring (Pipeline/Retry/Cancel); dann Adapter-Vervollständigung
(login/addToCart/checkout, TG-Farbzuordnung) – blockiert auf Zugangsdaten/
Entscheidung, danach `SUPPLIER_AUTOMATION_ENABLED=1`.

---

## Abschnitt 6: Stabilität/Wartbarkeit — Pflege, Overrides, Refactoring ✅

**Was:** Fokus auf Skalierbarkeit statt neuer Lieferanten. Drei Bausteine:

1. **Produktspezifische Variant-IDs vorbereitet** (additiv):
   `SupplierVariantMap.productOverrides?` (`ProductVariantOverride`) je
   Katalog-Produkt. Resolver konsultiert erst den Override, dann die Basis-
   Tabelle → ohne Override greift automatisch die label-basierte Lösung.
   Löst needens per-Produkt-`data-color-id`, ohne API/Adapter umzubauen.
   Abwärtskompatibel; Fail-Fast unverändert.

2. **Verifikations-/Pflegefunktion:** `verified()`-Helper markiert
   bestätigte Einträge; `buildSupplierMappingCoverage()` (mapping/coverage.ts)
   klassifiziert je Lieferant genutzte Farben/Größen als verified/unverified/
   missing. Ausgaben: `npm run coverage:suppliers` (CLI) + read-only
   Admin-Seite `/admin/lieferanten` (farbige Chips + Tooltips). needen:
   5 Farben verifiziert markiert, 6 offen; TG 25 offen – 0 fehlend.

3. **Architektur-Review/Refactoring:** doppelte Strategie-Reihenfolge
   (selectors.ts vs selectionEngine.ts) in `VARIANT_STRATEGY_ORDER` +
   `variantValueFor` zentralisiert (Engine nutzt sie jetzt). Worker-Outcome-
   Ableitung in lesbares `deriveOutcome()` extrahiert.

**Dateien:** neu `mapping/coverage.ts`, `scripts/checkSupplierMappingCoverage.mts`,
`app/admin/lieferanten/page.tsx`, Tests `coverage.test.ts`+`productOverrides.test.ts`.
Geändert: `types.ts` (verified, ProductVariantOverride, productOverrides),
`resolve.ts` (verified(), Override-Auflösung), `selectors.ts`+`selectionEngine.ts`
(DRY), `supplierWorker.ts` (deriveOutcome), `tables/needen.ts` (verified()),
`admin/layout.tsx` (Nav-Link), `package.json` (coverage-Script).

**Getestet:** 50 Tests grün (41 + 9 neu), `tsc`+`eslint` sauber, Admin-Seite
live geprüft (5 grün/41 amber/0 rot). Bestehende Tests unverändert grün.

---

## Abschnitt 5: Reale Browser-Automatisierung angebunden ✅

**Was:** Playwright + Chromium installiert; `browserSession.ts` startet
echtes Chromium (lazy import, einziger Integrationspunkt). Neue zentrale
**Auswahl-Engine** (`adapters/selectionEngine.ts`) wählt die stärkste
Strategie aus Variante ∩ Shop-Plan (`variant-id → select-value → sku →
label`), führt die DOM-Aktion aus und protokolliert die genutzte Methode
(Log + `step.selection`). Adapter enthalten **keine Übersetzungslogik** mehr
– nur noch verifizierte `ControlSelectionPlan`-Selektoren; fehlt ein Plan,
bleibt es `notImplemented` (Fail-Fast).

**Dateien:** neu `adapters/selectionEngine.ts`,
`worker/__tests__/supplierWorker.e2e.test.ts`. Geändert: `browserSession.ts`
(echtes Chromium), `SupplierAdapter.ts` (Engine-Anbindung, openProduct
navigiert real, Rückgabe der Methode), `NeedenAdapter.ts` (verifizierter
Farb-Plan `input.color-controller[data-color]`), `TextilGrosshandelAdapter.ts`
(verifizierte Struktur dokumentiert, Plan noch inaktiv), `supplierWorker.ts`
(Session-DI, erfasst `selection`), `types.ts` (AutomationPage +check/
selectOption, StepResult +selection), `mapping/tables/needen.ts`
(red-Label → **"Red"** verifiziert). `package.json` (+dep `playwright`).

**Reale Shop-Analyse (öffentlich, kein Login):**
- **needen**: Farb-Radios mit `data-color`(Name)/`data-color-id`/
  `data-color-code`. Namen produktstabil → label-basierte Auswahl aktiv.
  Verifiziert: black/white/navy/royal/red. IDs sind PRODUKTSPEZIFISCH →
  nicht in per-Lieferant-Tabelle gepflegt (bräuchte zurückgestellte
  per-Produkt-Erweiterung). Befund: GN647 führt kein Red/Pink.
- **textil-grosshandel**: Farb-Hex `button.switch-to[data-key]`, Name
  erscheint erst nach Klick → keine label-Auswahl möglich; Hex↔unsere Farbe
  mehrdeutig (Nutzerentscheidung), Plan daher noch inaktiv.

**Getestet:** 41 Tests grün (37 + 4 **echter-Chromium-E2E**): kompletter Weg
Warenkorb → Positionen → Worker → Engine → richtiges Farb-Radio im Browser
ausgewählt + Methode protokolliert; Prefer-ID; Label-Fallback; Fail-Fast.
`tsc` + `eslint` sauber. Doku: `docs/lieferanten-mapping.md`.

**Offen (Nutzerentscheidung/Zugangsdaten, kein Raten):** mehrdeutige
needen-Farben (grey/charcoal/burgundy/kelly-green/bottle-green/pink);
TG-Hex-Farbzuordnung; echte B2B-Zugangsdaten für login/addToCart/checkout;
GN647-Farbverfügbarkeit; needen-Größen-Matrix (setQuantity) als Nacharbeit.

---

## Abschnitt 3: Produktrecherche (laufend) 🔄

**Neu (Stand 43 Produkte, Damen-Linie + dritter Zip-Hoodie):**
- `gildan-ladies-t` (G64000L, TG, ab 2,69€) – Softstyle Ladies, PT 631
- `fotl-ladies-premium-polo` (F520, TG, ab 7,80€) – Premium Polo Lady-Fit,
  PT 1524, inkl. eigener kürzerer Knopfleisten-Sperrzone (2-Knopf)
- `gildan-ladies-heavy-t` (GN182, **needen.de** – erste Nicht-TG-Quelle,
  ab 3,29€) – Heavy Cotton Damen, PT 1220
- `gildan-ladies-vneck-t` (GN647, needen.de, ab 3,99€) – Softstyle Ladies
  V-Neck, PT 1329
- `russell-ladies-authentic-t` (Z108F, TG, ab 5,48€) – Ladies Authentic
  Tee Pure Organic, PT 1562
- `gildan-ladies-polo` (G64800L, TG, ab 6,25€) – Softstyle Ladies Polo,
  PT 1267, eigene 3-Knopf-Sperrzone
- `gildan-zip-hoodie` (GN960, needen.de, ab 22,98€) – Heavy Blend
  Full-Zip, PT 1242, Zip-Sperrzone; Besonderheit: Schwarz existiert bei
  diesem PT nicht (Fallback-Hash-Test) → Navy ist Ankerfarbe
Alle mit 4 echten Ansichten (visuell verifiziert), Torso-Messung,
foto-gemessenen Swatches, supplierRef; jeweils live im Browser bestätigt
(alle 4 webp-Requests 200, Katalogzähler, Farbliste).

**Verbesserte Discovery-Pipeline:** teamshirts.de-Produktseiten
(`/produkt/<slug>/<id>`) rendern clientseitig; der `__APOLLO_STATE__`
enthält die Farb-appearance-IDs MIT Namen (zuverlässiger als Scans), das
Hero-Bild liefert die productType-ID, "Marke: X" im Text bestätigt den
Hersteller. Markenfilter `/produkte?brand=N` enumeriert je Marke
(29=FOTL, 35=Russell, 51=Gildan, 6=B&C, 11=J&N; Rest Sportmarken ohne
TG/Needen-Bezug). SPA-Navigation per pushState+popstate spart Reloads.

**Neuer QA-Wächter:** `scripts/checkDuplicateImages.mjs` – SHA-256 aller
front.png produktübergreifend. Anlass: die teamshirts-SEO-Landingpage
"gildan-heavy-blend-hoodie" führte auf PT 1047, dessen Fotos byte-identisch
mit unserem justhoods-college-hoodie sind (PT 1047 steckt im Header-Menü
JEDER Seite; Produktseite /produkt/unisex-hoodie/577 bestätigt "Marke:
AWDis"). Ingestion wurde zurückgerollt, Wächter läuft seither nach jeder
Ingestion (0 Duplikate im Bestand).

**Geprüft und übersprungen (keine Bezugsquelle bei TG/Needen/Wordans):**
Gildan Softstyle Midweight Hoodie (SF500), Gildan Tank Top (zudem keine
echten Seitenfotos: Views 3/4 byte-identisch mit Front), Russell Ladies
Authentic Hooded Sweat (265F – Fotos wären vorhanden, PT 1282 notiert
falls später eine Quelle auftaucht). Wordans-Suche liefert derzeit
HTTP 500, needen.de funktioniert und ist als Bezugsquelle angebunden.

**Offene Kandidaten-Warteschlange (nächste Schritte):**
Russell "Heavy Duty Workwear T" (produkt/heavy-duty-workwear-t-shirt/908,
Duplikat-Risiko zu vorhandenem Z010 prüfen), B&C Unisex Sweater
(produkt/unisex-sweater/922) + B&C Bio-Hoodies Herren/Damen (898,
Duplikat-Risiko zu bandc-inspire-hoodie PT 1535), Gildan "Männer
Poloshirt" (365, Abgleich mit vorhandenem G64800), teamshirts-Kategorien
t-shirts + jacken-westen noch nicht enumeriert.

---

## TODO-Gesamtstand

| # | Aufgabe | Status |
| --- | --- | --- |
| 1 | Supplier-Engine (Typen, Adapter, Registry, Worker, Service, Migration) | ✅ |
| 2 | Produktdaten: supplierRefs (29 Produkte, URLs HTTP-verifiziert, TG + Needen) | ✅ |
| 3 | Admin-Bereich + „Beim Lieferanten bestellen" (E2E getestet) | ✅ |
| 4 | Sperrzonen (Zips/Knopfleisten) + Torso-Grenzbereiche (alle 43 Produkte) | ✅ |
| 5 | Positions-Presets „Brust links/rechts" | ✅ |
| 6 | Code-Analyse + risikoarme Fixes (Latenzen, Swatches, totes Skript) | ✅ |
| 7 | Supplier-Mapping-Schicht (Farb-/Größen-/Varianten-Übersetzung + Tests) | ✅ |
| 8 | Weitere Produkte mit echten Mehransichten (Ziel ~100, Stand 43) | 🔄 laufend |
| 9 | Caps (nur Stickerei) – nach den Oberteilen | ⏳ |
| 10 | Playwright-Browser-Logik TextilGrosshandelAdapter | ⏳ nächste Phase |
| 11 | supplierRefs-Nachpflege 13 alte FOTL-Produkte | ⏳ braucht SKU-Abgleich |
| 12 | Stripe Stage B–D | ⏸ pausiert (Nutzer-Entscheidung von früher) |
| 13 | Stanley/Stella-Bezugsquelle | ⏸ wartet auf Nutzer-Entscheidung |
