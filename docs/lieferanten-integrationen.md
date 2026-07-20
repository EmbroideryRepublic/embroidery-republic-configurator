# Lieferanten-Integrationen – Umsetzungsstand je Shop

Stand: Juli 2026. Diese Datei dokumentiert PRO LIEFERANT genau, welche
Adapter-Funktionen umgesetzt und verifiziert sind, was produktionsreif ist und
welche offenen Punkte den produktiven Einsatz derzeit noch verhindern.

> **Neuen Lieferanten anbinden?** → `lieferanten-adapter-leitfaden.md`
> (Ablauf in sechs Schritten, Aufbau eines Adapters, die real aufgetretenen
> Fallstricke und die Pflichten gegenüber dem Audit-Trail).

Grundregeln (gelten für alle Adapter):

- **Nur verifizierte Selektoren.** Jeder genutzte Selektor stammt aus der
  Analyse der realen Shop-Seite (Attribute/Struktur im Browser geprüft). Nichts
  wird geraten; fehlt ein verifizierter Plan, bleibt der Schritt `notImplemented`
  (Fail-Fast) statt einer riskanten Vermutung.
- **Kein Kontoanlegen.** Es werden keine Konten erstellt – produktiver Betrieb
  setzt vom Nutzer bereitgestellte, bestehende B2B-Zugangsdaten voraus.
- **Standard-Modus `prepare-cart`.** Der Worker legt die Positionen in den
  Warenkorb und überlässt die finale Kasse dem Menschen. `checkout` (echte
  Bestellung) ist die optionale, separat abzusichernde Ausbaustufe.
- **Gemeinsame Engines statt Adapter-Logik.** Die Adapter enthalten nur
  Selektor-Pläne; die DOM-Interaktion + Protokollierung leisten
  `selectionEngine.ts` (Farbe/Größe) und `shopActions.ts` (Login/Warenkorb).

Aktiv genutzte Lieferanten (im Katalog referenziert): **needen**,
**textil-grosshandel**. `wordans` und `ralawise` haben derzeit KEIN Produkt in
`supplierRefs.ts` und sind bewusst reine Stubs (kein Integrationsbedarf, bis
Produkte hinzukommen).

---

## Automatische Integration neuer Katalogprodukte

Neue Produkte fließen OHNE gesonderten Hinweis in die Lieferantenarchitektur –
die Anbindung ist datengetrieben über die echte `PRODUCTS`-Liste. Was von
selbst passiert, sobald ein Produkt im Katalog liegt:

- **Mapping/Auflösung:** `resolveSupplierPosition` übersetzt Farben/Größen des
  Produkts über die Lieferantentabelle; fehlt eine Zuordnung, wird die Position
  NICHT bestellt, sondern mit klarem Fehler protokolliert (kein Fehlkauf).
- **Coverage-Report** (`npm run coverage:suppliers`) iteriert über den echten
  Katalog und zeigt automatisch drei Dinge:
  1. **Katalog-Integrationsstatus** – alle Produkte, davon wie viele mit/ohne
     Lieferant; Produkte OHNE Lieferantenzuordnung werden namentlich als offene
     Aufgabe gelistet (`buildCatalogSupplierStatus`).
  2. **Per-Farbe-Report** je Lieferant (verified/unverified/missing).
  3. **Per-Produkt-Report** (✓ vollständig / ◐ nur mehrdeutig / ○ zu prüfen).
- **Validierung/Tests** (`npm test`, `catalogConsistency.test.ts`): nutzt ein
  Produkt eine Farbe/Größe, die in der Lieferantentabelle FEHLT, schlägt der
  Test fehl – die Lücke fällt also VOR dem ersten Automatisierungslauf auf.
  Ein zusätzlicher Test stellt sicher, dass JEDES Produkt im Status auftaucht
  (kein stilles Verschlucken supplier-loser Produkte).

**Manuelle Schritte** bleiben nur dort, wo VERIFIZIERTE Shop-Daten nötig sind,
die nicht erfunden werden dürfen (kein Raten):

1. **Bezugsquelle** in `src/config/products/supplierRefs.ts` ergänzen
   (`supplierId`, `articleNumber`, `productUrl` – aus dem Großhandels-Listing).
   Ohne diesen Eintrag erscheint das Produkt im Status unter „ohne
   Lieferantenzuordnung".
2. **Verifizierte Farben/Größen**: neue Farb-/Größen-Schlüssel in die
   Lieferantentabelle (`mapping/tables/<lieferant>.ts`) aufnehmen; produkt-/
   markenspezifische Kennungen (z.B. TG-Hex) als `verified()`-Override in
   `productOverrides` bzw. `textilGrosshandelColorHex.ts`. Solange unverifiziert,
   erscheint die Farbe/Größe im Coverage-Report als offene Aufgabe.

Kurz: **Anlegen genügt, damit das Produkt sichtbar wird**; produktiv wird es,
sobald die zwei verifizierten Datenpunkte (Bezugsquelle + Farb-/Größen-Werte)
nachgetragen sind. Der Coverage-Report ist die stehende To-do-Liste dafür.

---

## needen.de — prepare-cart PRODUKTIONSREIF (Zugangsdaten ausstehend)

Plattform: Wordans. Adapter: `adapters/NeedenAdapter.ts`. Katalog-Produkte:
`gildan-ladies-heavy-t` (GN182), `gildan-ladies-vneck-t` (GN647),
`gildan-zip-hoodie` (GN960) – identische Shop-Struktur, an GN182 & GN960
verifiziert.

### Umgesetzt & verifiziert

| Schritt | Umsetzung (verifizierter Selektor) | Stand |
| --- | --- | --- |
| **login** | Header-Modal: Trigger `a[href="#signinModal"]` → `#user_login` + `#user_password` → `button#submit` (Formular POST `/sign_in`). Startseite = Shop-Basis-URL. | ✅ Selektoren verifiziert |
| **Produktsuche** | Direktnavigation zur hinterlegten `productUrl` (keine Suche nötig). | ✅ |
| **selectColor** | Klick auf sichtbaren Swatch `label.shop-color[title="<Farbname>"]` (das Radio `input.color-controller` ist `display:none`; Label-Klick selektiert es). `title` = exakter Farbname, je Seite eindeutig. | ✅ verifiziert (Klick selektiert Radio) |
| **setQuantity** | Menge in `tr.size-class-<Größe> input.product-quantity` (Zeilen-Klasse trägt das Größenlabel; trifft genau das Einzelfarb-Feld, nicht die Bulk-Matrix). | ✅ verifiziert (genau 1 Treffer) |
| **addToCart** | Primärer Button `input.add-to-cart-submit:not(.bulk-add-to-cart-submit)`; Erfolg = Warenkorb-Zähler `a.cart-qty`. Gast-Warenkorb funktioniert; Login ordnet ihn dem Konto zu. | ✅ verifiziert (Zähler steigt) |

**Verifizierte Größen-Korrektur:** unser internes `XXL` heißt bei needen `2XL`
(Zeilen-Klasse `size-class-2XL`). In `mapping/tables/needen.ts` entsprechend
gepflegt (`XXL → 2XL`). S/M/L/XL 1:1.

**Verifizierte Farben** (Namensgleichheit im Shop bestätigt): `black→Schwarz`,
`white→Weiß`, `navy→Navy`, `royal→Royal`, `red→Red`.

### End-to-End-Dry-Run

`adapters/__tests__/needen.e2e.test.ts` fährt in echtem Chromium den KOMPLETTEN
Weg ab: interne Bestellung (`buildSupplierPositions`, Produkt
`gildan-ladies-heavy-t`, Navy, M×5 + XXL×2) → `runSupplierJob` → NeedenAdapter →
Auswahl-Engine → Fixtures, die die reale needen-DOM 1:1 spiegeln (verstecktes
Radio + sichtbares Label, Mengen-Matrix, Login-Modal, Warenkorb-Zähler). Prüft
u.a.: Login ok, richtiges Farb-Radio selektiert, Mengen in den richtigen
Größenzeilen (inkl. `XXL→2XL`), primärer (nicht Bulk-)Button geklickt,
Warenkorb-Zähler bestätigt. Ergebnis `prepared`, alle Schritte `ok`.

### Offene Punkte (verhindern produktiven Live-Lauf)

1. **B2B-Zugangsdaten** `SUPPLIER_NEEDEN_USERNAME` / `SUPPLIER_NEEDEN_PASSWORD`
   (Nutzer stellt bestehendes Konto bereit; kein Kontoanlegen). Ohne sie bricht
   der Lauf sauber am login-Schritt ab (`blocked`, kein Retry-Spam).
2. **Login-Erfolgssignal**: Einzige nicht ohne Zugangsdaten beobachtbare
   Annahme – der Login-Trigger verschwindet nach der Anmeldung
   (`successSelector: a[href="#signinModal"]`, `state: detached`). Beim ersten
   Lauf mit echten Daten kurz gegenprüfen und ggf. Signal anpassen.
3. **Mehrdeutige Farben** (Nutzerentscheidung, nicht raten): unsere generischen
   Farben ohne eindeutige Shop-Entsprechung. Verifizierte Shop-Kandidaten aus
   der Analyse:
   - `grey` → „Sport Grey" vs. „Ash" (beide vorhanden)
   - `charcoal` → „Dark Heather" vs. „Graphite Heather"
   - `pink` → „Light Pink" vs. „Azalee"
   - `burgundy` → „Kastanienbraun" (Gildan Maroon)?
   - `kelly-green` → „Irish Green"?  ·  `bottle-green` → „Forest Green"?

   Sobald der Nutzer je Farbe DEN Shop-Namen bestätigt, wird er in
   `mapping/tables/needen.ts` als verifizierter Wert gepflegt – kein Codeumbau.
4. **checkout** (echte Bestellung): bewusst `notImplemented`. Warenkorb-Review
   und Kasse liegen HINTER dem Login; ihre DOM ist ohne Zugangsdaten nicht
   verifizierbar, und ein realer Bestellabschluss ist nicht Teil der
   Verifikation. Für `prepare-cart` (Standard) nicht erforderlich.

**Fazit needen:** Der Ablauf Login → Farbe → Größe/Menge → Warenkorb ist
vollständig implementiert, mit verifizierten Selektoren, und im Dry-Run stabil.
Produktiv aktivierbar (`SUPPLIER_AUTOMATION_ENABLED=1`), sobald Zugangsdaten
vorliegen; für Farben außerhalb der fünf verifizierten zusätzlich deren
Zuordnung.

---

## textil-grosshandel.eu — Adapter FERTIG, produktiv datenblockiert

Plattform: OXID eShop (Hastedt eCommerce). Adapter:
`adapters/TextilGrosshandelAdapter.ts`. Mit Abstand die meisten
Katalog-Produkte (~30, Gildan/Fruit of the Loom/Russell/SOL'S/…).

### Umgesetzt & verifiziert (Selektor-Ebene, an G5000 geprüft)

| Schritt | Umsetzung (verifizierter Selektor) | Stand |
| --- | --- | --- |
| **login** | Seite `/mein-konto/`: `#loginUser` + `#loginPwd` → `#loginButton`. Erfolg = `#loginUser` verschwindet. | ✅ verifiziert |
| **selectColor** | Klick Hex-Swatch `button.switch-to[data-key="<HEX>"]` (variant-id = Gildan-Hex). Swatches tragen KEINEN Namen → Auswahl ausschließlich über Hex. | ✅ verifiziert (Klick setzt `#chosenColorName`) |
| **setQuantity** | Menge per Größen-LABEL: `tr:has(td.cell-size:text-is("<Größe>")) td.cell-amount input[name$="[am]"]` – nach Farbwahl genau 1 Zeile je Größe; kein varId nötig. TG nutzt „XXL"/„3XL" (=unsere Labels). | ✅ verifiziert |
| **addToCart** | Primärbutton `button[name="toBasket"]` (aktiviert nach Menge); Erfolg = Mini-Warenkorb `#basketItemCountAndPrice`. Gast-Warenkorb bestätigt. | ✅ verifiziert |

E2E-Dry-Run: `adapters/__tests__/textilGrosshandel.e2e.test.ts` (echtes
Chromium, Fixtures spiegeln die reale TG-DOM). Beweist u.a. die
PRODUKTSPEZIFISCHE Hex-Auflösung: interne Bestellung `gildan-heavy-t` / Navy →
Mapping liefert über productOverrides den verifizierten Hex `263147`, die Engine
klickt den richtigen Swatch; Menge landet über das Größen-Label in der M-Zeile;
Warenkorb-Zähler bestätigt. Grün.

### Farb-Hex-Verifikation (systematisch, alle 27 Produkte)

Alle Farb-Hex wurden direkt aus den Produkt-DOMs verifiziert
(`div.swiper-slide[data-key=HEX] img` → alt „…in <Name>:…") und je Produkt in
`mapping/tables/textilGrosshandelColorHex.ts` als `variantId` gepflegt
(Format `[Hex, exakter Shop-Name]`). Der Hex ist marken-/produktspezifisch
(Gildan Navy `263147` ≠ Neutral `1F2A44` ≠ B&C `1F2532` ≠ SOL'S `07213B`).

**Aufnahmeregel (streng, nichts geschätzt):**
1. EXAKTER Namenstreffer hat Vorrang (unser „navy" ⇔ Shop „Navy").
2. Sonst EINDEUTIGER Einzelkandidat aus einem engen Standard-Synonymsatz, bei
   dem nur der Herstellername abweicht (`royal`⇔„Royal Blue"/„Bright Royal",
   `navy`⇔„French Navy"/„Navy Blue", `red`⇔„Classic Red", `black`⇔„Deep Black"/
   „Black Pure"/„Black Opal", `white`⇔„Arctic White") – **nur wenn es im
   Produkt genau EINEN solchen Kandidaten gibt.** Bei mehreren gleichwertigen
   Kandidaten (z.B. AWDis „Royal Blue" UND „Bright Royal") bleibt die Farbe offen.
3. Business-Farben werden NUR nach ausdrücklicher Freigabe je Marke/Kandidat
   eingepflegt (Regel je Marke: grey = klassischer Standard-Mittelgrau
   [Sport Grey / Grey Melange / Light Oxford / Sports Grey / Heather Grey],
   charcoal = dunkler Anthrazit). Freigegeben & gepflegt: **kelly-green**,
   **burgundy**, **bottle-green** (eindeutige), **grey** + **charcoal** je Marke
   (siehe unten). Offen bleiben nur die mehrdeutigen Fälle.

Ergebnis (siehe `npm run coverage:suppliers`, Per-Produkt-Report):
- **14 von 27 Produkten VOLLSTÄNDIG verifiziert** (jede Farbe): beide `jn`,
  `fotl-original-vneck`, alle 5 Gildan, alle 3 Russell, beide B&C, beide
  FOTL-Baseball-Kontrastmodelle.
- **~120 Einzel-Farbzuordnungen** gepflegt (Kategorie 1 exakt, Kategorie 2
  Marken-Synonyme, Business-Farben kelly-green/burgundy/bottle-green/grey/
  charcoal).
- grey verifiziert je Marke: Gildan „Sport Grey" `97999B`, SOL'S „Grey Melange"
  `8F8B8B`, Russell „Light Oxford" `9DA6AB`, Neutral „Sports Grey" `B8B8B9`,
  B&C „Heather Grey" `B1B3B4`, Stedman „Grey Heather" `A1A1A2`. charcoal:
  Gildan „Charcoal (Solid)" `66676C`.

Der Report unterscheidet je Produkt **`prüfen`** (noch zu verifizieren) von
**`Entscheidung`** (mehrdeutig). Farben ohne gepflegten Hex blockieren beim
Bestellen sauber (Fail-Fast → `blocked`, kein Retry).

### Offene Punkte (verhindern produktiven Live-Lauf)

1. **Restliche mehrdeutige Farben** (Nutzerentscheidung, nicht geraten):
   - **grey** bei FOTL (zwei Heather: „Heather Grey" `D4D9DC` vs. „Athletic
     Heather" `B8B9BD`) und bei AWDis/Just-Hoods (mehrere ähnliche Grautöne).
   - **bottle-green** bei Neutral (+„Military") und Just-Hoods-College
     (4 dunkle Grüns).
   - AWDis/Just-Hoods-Standardfarben (mehrere Blau-/Schwarztöne) + Sonderfälle
     (`sols` yellow, `stedman` red „Scarlet Red", `green`/`olive`/`anthracite`/
     `graphite` ohne Standard-Namen).
   - `pink` wird von keinem TG-Produkt genutzt.
2. **Kontrastmodelle** (Baseball F295/F296, Varsity JH003): analysiert. Der Shop
   führt jede Kombination als EINE Einheit mit kombiniertem data-key
   „<HauptHex>_<KontrastHex>" (Name „<Haupt>|<Kontrast>") → passt auf die
   bestehende variant-id-Mechanik, keine Sonderarchitektur. **FOTL-Baseball
   (F295/F296) vollständig verifiziert** (White + Standard-Kontrast, eindeutig).
   **Varsity (JH003) bleibt offen** – dieselbe AWDis-Mehrdeutigkeit (mehrere
   Navy-/Schwarz-/Rot-/Grautöne, „Anthrazit" nur als „Charcoal") → Entscheidung.
3. **B2B-Zugangsdaten** `SUPPLIER_TG_USERNAME` / `SUPPLIER_TG_PASSWORD`
   (bestehendes Konto, kein Kontoanlegen).
4. **checkout** (echte Bestellung): bewusst `notImplemented` (wie needen;
   hinter Login, für `prepare-cart` nicht nötig).

**Fazit TG:** Adapter vollständig + verifiziert (Login/Farbe/Größe/Warenkorb,
inkl. Kontrastmodelle), im Dry-Run bewiesen; Farb-Hex systematisch über alle
Produkte verifiziert und gepflegt. **14 von 27 Produkten vollständig
verifiziert**; produktiv einsatzbereit, sobald Zugangsdaten vorliegen. Die
verbleibenden offenen Punkte sind ausschließlich Business-Entscheidungen (v.a.
Grautöne + AWDis-Mehrdeutigkeiten) und die Zugangsdaten – kein Code, keine
Architektur mehr.

---

## wordans.de / ralawise.com — Stubs (kein Integrationsbedarf)

Beide Adapter existieren als vorbereitete Stubs. Es gibt aktuell KEIN
Katalog-Produkt mit diesen Lieferanten (`supplierRefs.ts`), daher kein
produktiver Bedarf. Integration erfolgt analog zu needen, sobald Produkte mit
`supplierId: 'wordans'`/`'ralawise'` gepflegt werden.

---

## Qualitäts- & Robustheits-Review (Juli 2026)

Vollständiger Durchgang durch den Lieferantenprozess – Ergebnis: solide, keine
strukturellen Umbauten nötig.

- **Adapter-Vereinheitlichung erreicht:** alle DOM-Interaktion liegt in den
  gemeinsamen Engines (`selectionEngine.ts` Farbe/Größe, `shopActions.ts`
  Login/Warenkorb). Die Adapter enthalten NUR noch deklarative Selektor-Pläne –
  needen/TG unterscheiden sich ausschließlich durch verifizierte Selektoren,
  wordans/ralawise sind reine Stubs. Keine doppelte Logik gefunden.
- **Lebenszyklus konsistent:** Statusmaschine (`status.ts`, getestet inkl.
  paused), optimistische Transition + Audit (`store.ts`), atomarer Lock gegen
  Parallelverarbeitung + Reaper für verwaiste Locks (`store`/`orchestrator`),
  idempotente Auto-Übergabe (`enqueue.ts`), Retry mit exponentiellem Backoff und
  Fehlerklassifikation (transient/blocked/permanent). Ein irreführender
  Kommentar im Orchestrator-`catch` wurde korrigiert (unerwartete Fehler →
  `failed`, KEIN Auto-Retry).
- **Kontrastmodelle:** kombinierter data-key `<HauptHex>_<KontrastHex>` – von der
  bestehenden variant-id-Mechanik ohne Sonderlogik abgedeckt (siehe TG-Abschnitt).
- **Katalog-Selbst-Integration greift:** alle 43 Produkte erscheinen im
  Integrationsstatus; 13 Fruit-of-the-Loom-Modelle (ZIP-Datenblätter) haben noch
  keinen Lieferanten-Ref und werden automatisch als offene Aufgabe gelistet.
  Recherche-Stand + Farb-Caveat dazu: `supplierRefs.ts`-Kopf.
- **Tests:** 84 grün (`tsc`/`eslint` sauber), inkl. Lifecycle-Übergänge/Backoff/
  Klassifikation, Mapping/Coverage/Per-Produkt/Katalogstatus, Kontrast-Tests und
  zwei echte-Chromium-E2E-Dry-Runs (needen + TG).

**Offen ist ausschließlich Nicht-Code:** Farbentscheidungen (v.a. Grautöne +
AWDis-Mehrdeutigkeiten), die FOTL-Ref-Datenaufgabe und die B2B-Zugangsdaten.
