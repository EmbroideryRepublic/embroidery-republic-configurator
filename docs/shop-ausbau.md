# Shop-Ausbau – Arbeits- und Fortschrittsdokument

Lebendes Dokument für den autonomen Ausbau des Shops (ohne Konfigurator, der ist
als v1.0 eingefroren). Ziel: eine hochwertige, moderne, vertrauenswürdige
Website auf dem Qualitätsniveau des Konfigurators. Wird während der Arbeit
fortgeschrieben und dient am Ende als Teil der technischen Dokumentation.

## Auftrag & Modus

Vollständig autonom, ohne Rückfragen, bis alles technisch/gestalterisch
Umsetzbare steht. Alles, was **externe Freigabe oder Geschäftsentscheidung**
braucht, bleibt unangetastet und wird nur als offener Go-live-Punkt notiert
(siehe unten). Keine erfundenen Inhalte: keine Fantasie-Fotos, keine erfundenen
Bewertungen, nur belegte Fakten aus dem Code (`config/*`).

## Belegte Fakten (einzige Quellen)

| Fakt | Quelle |
|---|---|
| Ab 1 Stück, keine Mindestmenge; Staffel ab 5 | `lib/pricing/calculatePrice.ts` |
| Produktion 3–4 Werktage | `config/company.ts` → `PRODUKTIONSZEIT_TEXT` |
| Versand 1–2 Werktage nach Produktion | `config/company.ts` → `VERSANDTAGE` |
| Versandkostenfrei ab 75 € (DE) / 100 € (EU) | `config/shipping.ts` |
| Kauf auf Rechnung, 14 Tage | `config/company.ts` → `PAYMENT_TERM_DAYS` |
| DTF: „Vollfarbig, ideal für große Motive & Farbverläufe" | `i18n/translations.ts` |
| Stickerei: „Hochwertig & langlebig, ideal für Firmenlogos" | `i18n/translations.ts` |
| Kostenlose Designprüfung | Marketingzusage (layout-Metadaten, FAQ) |
| 43 Artikel, Marken, Materialien | `config/products` |

## Phasen & Status

1. **Startseite auf Konfigurator-Niveau** — erledigt (Serviceleiste, Veredelungssektion, Footer neu; visuell geprüft Desktop+Mobil, 0 px Überlauf)
2. **Produktseiten hochwertig überarbeiten** — erledigt (Detailseite auf warme Palette gehoben, Serif-Titel, Preisbox, Galerie warm; neue geteilte `Veredelungsverfahren`-Komponente; Cross-Selling „Passt dazu" komplementäre Arten via `productPage.ts`; Katalog + Kachel warm; visuell geprüft Desktop+Mobil, 547 Tests grün)
3. **Checkout-Review (UX/Vertrauen/Klarheit)** — erledigt (Warenkorb/Checkout/Anfrage + Bestellstatus + Zahlungsrückkehr + Storno auf warme Palette; Vertrauenszeile am Bestellabschluss aus bestehenden i18n-Trust-Schlüsseln; Flow visuell geprüft; 547 Tests grün)
4. **Shop-weite Konsistenz & Qualität** — erledigt (Palette shop-weit vereinheitlicht: Filter-Chrome + Kontaktformular auf warme Töne; Inhaltsseiten waren bereits warm; Konfigurator/Admin bewusst ausgenommen; Responsivität auf Start/Katalog/Detail/Kontakt mit 0 px Überlauf geprüft; Serif-Überschriften konsistent)
5. **SEO vervollständigen** — erledigt (FAQPage-Schema mit 12 Fragen live im HTML; Canonicals für Produkt/FAQ/Über-uns/Kontakt; 6 veraltete „Zurück zum Konfigurator"-Links auf „Startseite" korrigiert; Product/Breadcrumb/Organization/Sitemap/robots bereits vollständig bestätigt)
6. **Technische Dokumentation** — erledigt (neues `shop-praesentation.md`: Seiten, Komponenten, Datenflüsse, Gestaltungssprache, SEO; in README verlinkt; `erweitern.md` um Cross-Selling-Hinweis ergänzt)
7. **Abschluss: Qualitäts- & Launch-Review** — erledigt. Vollständige
   Verifikation grün: `tsc` 0 · `eslint` 0 · **547/547 Tests** · **Produktions-
   Build erfolgreich** (64 statische Seiten inkl. 43 Produktseiten per SSG, keine
   Metadaten-Warnungen; Start 101 kB / Detail 103 kB First Load JS). Visuell
   geprüft: Start, Katalog, Produktdetail, Kontakt (Desktop + Mobil, 0 px
   horizontaler Überlauf) sowie der Checkout-Flow bis zur Kasse.

## Ergebnis des Sprints

Alle **technisch und gestalterisch umsetzbaren** Arbeiten am Shop sind
abgeschlossen. Was noch offen ist, sind ausschließlich **externe/organisatorische
Aufgaben des Betreibers** (siehe unten). Nicht committet – auf Wunsch bündele ich
die Änderungen in einem Commit.

## Premium-Feinschliff-Runde (2026-07-30)

Aus dem Premium-Review (Apple/Stripe/Aesop-Anspruch) umgesetzt, ohne die
Markenidentität zu verändern:

- **SEO/A11y:** Canonical für Startseite; `CollectionPage`+`BreadcrumbList`-JSON-LD
  für `/produkt` (nur ungefilterte Ansicht); visuell versteckte `h1` im
  Konfigurator; `aria-label` an der Start-`h1` (behebt „Design.Unsere" ohne
  Leerzeichen im Accessible Name).
- **Vertrauen (dezent, kein Badge-Spam):** „Keine Vorkasse – erst erhalten, dann
  zahlen" hervorgehoben im Rechnungsfeld; dezente „Sichere, verschlüsselte
  Übertragung · DSGVO-konform"-Zeile am Bestellabschluss. Neue i18n-Schlüssel
  de+en (`checkout_no_prepay`, `checkout_secure_note`).
- **Social Proof – datengetriebenes Gerüst:** `config/referenzen.ts` (leer) +
  `components/shop/Kundenstimmen.tsx`, das nichts rendert, solange keine echten,
  freigegebenen Daten vorliegen. Keine Platzhalter, keine erfundenen Stimmen.
- **Mikropolish:** Farbband klar interaktiv (Gold-Hover-Ring, Schatten, a11y-
  Label); „Favoriten (0)" wird erst mit Inhalt zum Zähler; Lade-Skeleton für den
  Konfigurator (`app/konfigurator/loading.tsx`); Press-States (`active:scale`)
  auf den Haupt-CTAs; Copy-Dopplung „Dein Design." entschärft („Deine Idee.").
- **Stepper:** zeigt den aktuellen Schritt jetzt auch mobil mit Beschriftung.
- **Größere Vorhaben** (realistische Vorschau, globaler Warenkorb, mobiler
  Einstieg) als Plan dokumentiert: [premium-roadmap.md](premium-roadmap.md).

**Nebenbefund behoben – CRLF/Zeilenenden (lokal):** Der Wächter-Test für die
pdf.js-Worker-Kopie schlug lokal fehl, weil `core.autocrlf=true` ohne
`.gitattributes` die ausgecheckte `public/pdf.worker.min.mjs` in CRLF wandelte
(Hash-Abweichung gegen die LF-Datei aus node_modules). Der **Git-Blob ist LF**,
Vercel/Produktion war also NIE betroffen. Fix: `.gitattributes` markiert die
Datei als binär (`-text`), Arbeitskopie auf LF normalisiert. Ursache belegt
(20 CR-Bytes; nach CR-Entfernung byte-identisch), kein Workaround.

## Realistische Druckvorschau – Stufe 1 (2026-07-30)

Motive wirken nicht mehr wie flache Aufkleber: Auf **hellen** Kleidungsstücken
werden sie per Blend-Modus `multiply` mit dem Textil verrechnet und übernehmen
Falten, Licht und Schatten aus dem echten Produktfoto; auf **dunklen** Teilen
bleibt der deckende Normal-Blend (echter Druck sitzt dort mit Weißunterlage
obenauf). Entscheidung aus der echten Kleidungsfarbe
(`lib/canvas/garmentLuminance.ts`, mit Unit-Tests), durchgereicht als
`garmentLight`-Prop an `ConfiguratorCanvas` (Editor + Großansicht). Rein
visuelle Vorschau; Produktionsdatei unberührt (getrennt in `src/lib/rendering`).
Beide Fälle visuell belegt (Weiß integriert, Schwarz voll sichtbar). Details und
nächste Stufen: [premium-roadmap.md](premium-roadmap.md). 550 Tests grün.

## Globaler Warenkorb (2026-07-30)

Der Warenkorb ist jetzt von **jeder Seite** über das Kopfzeilen-Symbol öffenbar
(vorher führte es außerhalb des Konfigurators nur zu `/konfigurator`). Neuer
ephemerer `uiStore` + globaler `CartDrawerHost` im Wurzel-Layout; der
Konfigurator behält seine eigene Schublade (v1.0 unberührt), der Host rendert
dort bewusst nichts. „Bearbeiten" aus dem globalen Korb wechselt zum
Konfigurator. Funktional + visuell belegt (Artikel seitenübergreifend sichtbar).
Details: [premium-roadmap.md](premium-roadmap.md) §2.

## Premium-Feinschliff – Design-Konsistenz, Runde 1 (2026-07-30)

Token-Audit (Fakten) und daraus die klarsten „aus einem Guss"-Korrekturen:

- **Karten-Radien vereinheitlicht** auf `rounded-2xl` (16 px) shop-weit. Vorher
  drifteten Inhaltskarten über 12/16/20/24 px – auf der Produktdetailseite lagen
  24-px- und 16-px-Karten sogar nebeneinander. Betroffen: Startseite,
  Veredelungs-/Kundenstimmen-Karten, FAQ, Kontakt, Über-uns, 404, Kontaktformular.
- **Schubladen-Schatten angeglichen** (Warenkorb war `shadow-xl`, Filter-Panel
  `shadow-2xl`) → beide `shadow-2xl`.
- **CTA-Form vereinheitlicht:** Inhalts-CTAs (FAQ, Über uns) und die
  Zahlungsseiten-Buttons von `rounded-lg`/`rounded-md` auf die etablierte
  Pill-Form (`rounded-full`) inkl. tactilem `active:scale`.
- **Katalog-Ladezustand** ergänzt (`app/produkt/loading.tsx`): Skeleton statt
  leerer Fläche beim serverseitigen Filtern/Navigieren.

**Bewusst NICHT geändert (Begründung):** dichte Schubladen-Interna
(`rounded-lg`, kompakter Kontext), volle-Breite-Absendebuttons (anderer
Button-Typ als inline-CTAs), Kleinelemente/Optionszeilen/Inputs sowie
Konfigurator-Interna (v1.0) und Admin (intern).

**Offene Kandidaten (dokumentiert, später):** Leerzustand des globalen
Warenkorbs mit dezenter „Produkte ansehen"-CTA (braucht i18n-Schlüssel);
Bestätigung „zum Warenkorb hinzugefügt"; feinere vertikale Rhythmus-Politur je
Seite. `tsc` 0 · `eslint` 0 · 550 Tests · Build exit 0.

## Markencharakter & Typografie – Runde 2 (2026-07-30)

Aus Creative-Director-Sicht: Die Inhaltsseiten waren sauber, aber „informativ"
statt „Marke". Sie nutzten eine schwächere Typo-Hierarchie als die Premium-
Seiten (kleine `text-2xl font-semibold`-Titel, kein Eyebrow, utilitaristischer
`text-sm`-Einstieg). Angehoben – reine Typografie/Hierarchie, keine erfundene Copy:

- **Editorialer Kopf** auf Über uns, FAQ, Kontakt: Gold-Eyebrow + große, leichte
  Serifen-Überschrift (`clamp`, `font-normal`) + echter Lead-Absatz (17 px,
  `leading-relaxed`, `max-w-xl` für gutes Lesemaß ~68 Zeichen). Damit sprechen
  auch die Inhaltsseiten die editoriale Stimme der Startseite.
- **FAQ thematisch gruppiert** (Bestellung & Ablauf / Veredelung & Dateien /
  Produktion, Versand & Zahlung) statt einer flachen 12er-Liste – bessere
  Scannbarkeit und Struktur. FAQPage-Schema bleibt vollständig (flach abgeleitet).
- **Sub-Überschriften** auf die leichtere Serifen-Stimme vereinheitlicht.

**Warum Marke statt Oberfläche:** Hochwertigkeit entsteht bei minimalistischen
Marken v. a. aus Typografie, Weißraum und Rhythmus. Große, ruhige Überschriften
und ein echter Lead vermitteln Souveränität; der wiederkehrende Eyebrow gibt
allen Seiten dieselbe Handschrift.

**Foto-Empfehlung (dokumentiert, nicht gebaut):** Der größte verbleibende
Marken-Hebel ist echte Bildwelt – Lifestyle, Makro von Stickerei/DTF-Kante,
Produktion in Köln. Ohne Platzhalter; die Seiten sind so strukturiert, dass
Fotos später ohne Umbau in Bühne, „Über uns" und Produktseiten eingesetzt werden
können. Bis dahin trägt die Wirkung bewusst die Typografie.

## Produkt-Browser UX (2026-07-30, ausdrücklich vom Nutzer freigegeben)

Trotz V1-Freeze zwei ausdrücklich beauftragte UX-Verbesserungen am Produkt-
Browser (`components/configurator/ProduktBrowser.tsx` + `stores/browserStore.ts`):

- **Einheitliche Pfeile:** Hauptgruppen zeigten zugeklappt nach OBEN (`ChevronDown`
  + `rotate-180`) – das wirkte wie „geöffnet". Jetzt konsequent `ChevronRight`:
  **zu = nach rechts, offen = nach unten** (`rotate-90`) – identisch zu den
  Produktart-Zeilen und allen Ebenen.
- **Mehrere Gruppen gleichzeitig offen (kein Akkordeon):** `browserStore` hält
  statt einer einzelnen `offeneGruppe` jetzt die Liste `offeneGruppen`
  (`toggleGruppe`/`oeffneGruppe`). Eine Gruppe zu öffnen schließt keine andere;
  die Modellauswahl (Kontext) bleibt erhalten. Eine offene Gruppe zeigt stets
  ALLE ihre Produktarten (kein Geschwister-Ausblenden mehr).

Verifiziert: Start alle zu (Pfeile rechts) → HERREN + UNISEX geöffnet bleiben
beide offen (DAMEN zu); Pfeile offen=unten/zu=rechts (DOM + Screenshot). tsc 0 ·
eslint 0 · 550 Tests · Build 64 Seiten exit 0.

## Startseiten-Kategorien-Abschnitt (2026-07-30, ausdrücklich vom Nutzer freigegeben)

Trotz V1-Freeze ausdrücklich beauftragt: Neuaufbau des Kategorien-Abschnitts auf
der Startseite (`src/app/page.tsx`) nach einem vom Nutzer gelieferten Mockup
(„KATEGORIEN ENTDECKEN / Ihre Lieblingsstücke. Ihre Marke.").

- **Zwei alte Abschnitte zu EINEM zusammengeführt:** Das frühere „Service­
  versprechen"-USP-Band (`ShieldCheck/Package/Sparkles/Receipt`) UND der
  separate „Sortiment"-Block wurden bewusst in einen reicheren Abschnitt
  vereint, um zwei redundante USP-Reihen zu vermeiden. Hilfskomponente
  `Versprechen` → schlankere `Vorteil`-Zeile (`Scissors/Palette/Package`).
- **Rechter Markenbereich – echtes gesticktes Markenzeichen (2026-07-30):**
  Der Nutzer hat echtes Markenmaterial geliefert; das ursprüngliche Verlauf-/
  „R"-Platzhalter-Panel wurde durch das reale, in Baumwollstoff **gestickte**
  ER-Markenzeichen ersetzt (`public/brand/markenpanel.png`, 1254×1254). Einbau
  via `<Image src="/brand/markenpanel.png" fill className="object-cover">` im
  **unveränderten** Container (`hidden lg:block aspect-[4/3] rounded-2xl`, Ring +
  Inset-Schatten bleiben) → quadratisches Bild wird zentriert, nur die Stoff­
  fläche oben/unten minimal beschnitten, Monogramm voll sichtbar. Kein Layout-
  Umbau nötig (Container war dafür ausgelegt). Auf Mobil ausgeblendet. Keine
  fabrizierten/Stock-/improvisierten Bilder ([[feedback_no_synthetic_product_images]]);
  dies ist ein echtes, vom Betreiber bereitgestelltes Markenfoto.
- **Kategorie-Karten:** je Karte Bild + Serif-Name + Kurzbeschreibung
  (`KATEGORIE_TEXT`) + Gold-Anzahl-Badge; abschließende „Nicht das Richtige?"-
  Kachel (Shirt-Icon + Gold-Pill „Alle Produkte ansehen" → `/produkt`).

Verifiziert: Desktop (Kopf + Karten) und Mobil per Screenshot gegen Mockup, kein
horizontaler Überlauf (Desktop/Mobil = 0). tsc 0 · eslint 0 · 550 Tests · Build
exit 0. Uncommittet (V1-Freeze, keine Commits bis zur finalen Abnahme).

## Entscheidungs- & Änderungslog

- **Fonts / Dev-Server:** `next/font/google` (Inter, Playfair) lässt den Dev-
  Server in dieser Umgebung ohne Internet abstürzen (Font-Abruf scheitert).
  Sauberes Selbst-Hosten via `@fontsource`/`next/font/local` bräuchte
  `npm install` bzw. die Font-Dateien und damit Internet → aktuell nicht lösbar.
  Für die Produktion ist `next/font/google` unkritisch (Next lädt die Fonts zur
  Bauzeit herunter und hostet sie selbst; kein Google-CDN zur Laufzeit → auch
  DSGVO-seitig sauber). Nur die Entwicklungsumgebung hier ist betroffen.

- **Organization-Schema NICHT um Kontakt/Adresse erweitert:** Versuch, telephone/
  contactPoint/address (aus COMPANY-Config) zu ergänzen, wurde von einem
  Wächter-Test abgefangen („Organisationsschema nennt nur Belegtes" – Kontakt
  gehört ins Impressum, nicht dupliziert). Bewusst zurückgenommen: respektiert
  die Architekturentscheidung UND die Regel, Firmendaten dem Betreiber zu
  überlassen. FAQPage-Schema + Canonicals wurden behalten.

## Gefundene Fehler / Inkonsistenzen

- [x] Footer: Link „Konfigurator" zeigt auf `/` statt `/konfigurator`. → behoben
- [x] Footer-Navigation weicht von der Kopfzeile ab. → Footer neu, an Kopfzeile
      angeglichen + Kontaktspalte + Rechtliches.
- [ ] Filter-Chrome (Ergebniskopf, FilterMenues, ShopFilter-Seitenleiste) nutzt
      noch neutrales Grau statt der warmen Palette → für Phase 4 (Konsistenz).

## Offene Go-live-Punkte (externe/organisatorische Aufgaben des Betreibers)

Bewusst NICHT bearbeitet – benötigen Freigabe, Konten oder Geschäftsdaten:

- Rechtstexte: Impressum, Datenschutz, AGB (aktuell Platzhalter) juristisch prüfen
- Firmen-/Kontaktdaten final bestätigen
- Resend-DNS (SPF + MX für `send.embroidery-republic.com`) bei IONOS setzen
- Vercel: Umgebungsvariablen setzen (v. a. `NEXT_PUBLIC_SITE_URL`)
- Stripe live schalten (Keys + Webhook) – aktuell Rechnungskauf
- Einkaufs-/Verkaufspreise final kalkulieren (EK vorläufig)
- Restore-Drill einmal echt ausführen
- Startseite formal freigeben
- Branch `shop-launchvorbereitung` pushen
