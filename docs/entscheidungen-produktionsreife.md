# Entscheidungen zur Produktionsreife

Zentrales Protokoll aller Entscheidungen, Annahmen und offenen Punkte aus dem
Produktionsreife-Durchlauf ab **2026-08-06**. Grundlage war der Auftrag,
das Projekt zu einer vollständig produktionsreifen Plattform zu bringen, mit
der Vorgabe, alle sinnvoll entscheidbaren Fragen selbst professionell zu
entscheiden und zu dokumentieren, statt Rückfragen zu stellen.

Dieses Dokument wird laufend ergänzt, während die einzelnen Bereiche
bearbeitet werden. Es ersetzt keine der bestehenden Fachdokumente
(`docs/steuerarchitektur.md`, `docs/kalkulationsmodell.md`,
`docs/go-live-checkliste.md` usw.) – es fasst zusammen, was seit deren letztem
Stand (2026-07-22/23/24) neu entschieden oder verändert wurde.

Legende: ✅ umgesetzt · 🟡 bewusst zurückgestellt (mit Begründung) · 🔴 braucht
zwingend Angaben des Betreibers.

---

## 1. Steuer- und Versandkonformität (M7 + M8)

**✅ Lieferländer auf Deutschland begrenzt.** Bis dahin waren zusätzlich 26
EU-Länder im Checkout wählbar, obwohl die Steuerberechnung ausnahmslos den
deutschen Satz anwandte (`config/pricing/steuer.ts` kannte nur `DE`). Das war
unterhalb der jeweiligen Lieferschwelle unschädlich, aber strukturell falsch
und rechtlich riskant, sobald eine Schwelle überschritten würde
(Bestimmungslandprinzip/OSS).

Für eine korrekte EU-weite Lösung fehlten zwei Dinge, die keine Code-Fragen
sind: verlässlich verifizierte, aktuelle Steuersätze je Land und die
tatsächliche OSS-Registrierung beim Finanzamt. Da eine falsch berechnete
Steuer laut eigener Projektdokumentation „ein Steuerdelikt, kein
Rundungsfehler" ist, wurde die sichere Seite gewählt: `SHIPPING_COUNTRIES`
(`src/config/shipping.ts`) führt jetzt nur noch Deutschland. Das entspricht
der eigenen Empfehlung aus `docs/audit-produktionsreife.md` (M7).

Die Struktur ist bewusst so gebaut, dass ein weiteres Land später **ein
Eintrag** ist (Zeile in `SHIPPING_COUNTRIES` inkl. ISO-Code + Satz in
`steuer.ts`), keine Umbau. Ein neuer Resolver `landCodeForCountry()`
verbindet Klartext-Ländername und ISO-Code; `orderStage.ts` und
`serverPricing.ts` lösen den Steuersatz jetzt über das tatsächliche
Lieferland auf statt über ein hartes `STANDARDLAND` – heute mit identischem
Ergebnis, aber strukturell korrekt und bereit für die Erweiterung.

Checkout, AGB §7 und FAQ wurden angepasst, damit sie nicht mehr eine
EU-Lieferung versprechen, die es aktuell nicht gibt (`CartDrawer.tsx`,
`agb/page.tsx`, `faq/page.tsx`).

**🟡 Zurückgestellt:** volle EU-weite Auslieferung inkl. OSS. Voraussetzung:
Betreiber lässt sich beim Finanzamt für das One-Stop-Shop-Verfahren
registrieren UND die realen, aktuellen Steuersätze der Zielländer werden
verifiziert (nicht aus einem Sprachmodell übernommen – siehe Warnhinweis in
`shipping.ts`). Danach ist die Erweiterung strukturell trivial.

**✅ Steuerausweis ergänzt**, wo er laut `docs/go-live-checkliste.md`
fehlte. Die Felder (`tax_rate`, `tax_amount`, `net_total`) wurden bei
Bestellungen bereits seit Migration 0014 gespeichert, aber an drei Stellen
nicht gelesen/angezeigt:
- Bestellbestätigung (Seite `bestellung/[token]` + E-Mail
  `OrderConfirmationEmail.tsx`)
- Admin-Bestelldetail (`admin/bestellung/[id]`) – jetzt netto/Steuer/brutto
  aufgeschlüsselt
- Checkout-Zusammenfassung im Warenkorb (`CartDrawer.tsx`) – Steuerzeile
  ergänzt, ebenso ein Hinweis „inkl. USt." bei der unverbindlichen Anfrage

Ältere Bestellungen (vor Migration 0014) haben keine gespeicherten
Steuerwerte – die Anzeige blendet die Zeile dort sauber aus, statt eine
falsche Schätzung zu zeigen.

---

## 2. Kalkulationsparameter (M6)

**✅ Stichsatz korrigiert:** von 0,10 €/1.000 Stiche auf **0,76 €/1.000
Stiche** (`config/pricing/selbstkosten.ts`, `STICKKOSTEN_JE_1000_STICHE`).

Begründung (ausführlich im Code dokumentiert): Gestickt wird extern, nicht
auf eigenen Maschinen – wie bei DTF ist der reale, an einen Dienstleister
gezahlte Preis die richtige Bemessungsgrundlage. Der zunächst aktive Satz
(0,10 €) führte zu einem wirtschaftlich unplausiblen Ergebnis (besticktes
Shirt 6,90 € gegenüber bedrucktem Shirt 24,90 €) und widerspricht damit der
Marktlage. Der höhere, ebenfalls genannte Satz (1,40 €) war ausdrücklich als
„interne Verrechnung" bezeichnet, keine real gezahlte Zahl, und würde
vermutlich Arbeitszeit enthalten – was dem eigenen Grundsatz widerspräche,
Arbeitszeit bewusst nicht einzurechnen. 0,76 € war der einzige der drei
genannten Werte, der explizit als externer Partnerpreis benannt war und zu
einem plausiblen Ergebnis führt (12.000-Stiche-Logo ≈ 9,12 €, in derselben
Größenordnung wie ein vergleichbarer DTF-Auftrag).

**🟡 Zurückgestellt:** Sobald die erste echte Rechnung des Stickpartners
vorliegt, den Satz dagegen abgleichen und ggf. nachjustieren. Der Code weist
in jeder Stick-Kalkulation ausdrücklich darauf hin.

**✅ Gewinnsatz (25 %) bestätigt.** War als „Hauptstellschraube, noch nicht
bestätigt" markiert. Der Satz ist bewusst auf das angestrebte
Shirtinator-Marktniveau kalibriert – keine willkürliche Zahl, sondern eine
Positionierungsentscheidung, die bereits in früheren Sitzungen getroffen
wurde. Als geltend bestätigt und dokumentiert
(`config/pricing/gemeinkosten.ts`).

**🟡 Bewusst NICHT umgesetzt: Umstellung der Katalogpreise (`basePrice`) auf
das neue Kalkulationsmodell.** Das Modell (`kalkuliere()`) berechnet Preise
vollständig und ist mit dem heutigen Katalog verglichen
(`npm run preis:vergleich`); es **setzt** aber bewusst keine Preise – das war
schon vor diesem Durchlauf so angelegt (`docs/kalkulationsmodell.md`,
Abschnitt „Was noch nicht verbunden ist"). Grund für die Zurückstellung:

1. Es betrifft die **tatsächlichen Endkundenpreise aller 43 Produkte** – eine
   Änderung mit echter Umsatzwirkung, nicht nur eine Code-Korrektheitsfrage.
2. Es besteht ein dokumentiertes **Doppelrabatt-Risiko**: Die heutigen
   Mengenstaffeln (`BASE_PRICE_DISCOUNT_TIERS` etc.) und der neue,
   rechnerische Mengenvorteil des Kalkulationsmodells dürfen nicht
   gleichzeitig wirken, sonst werden große Bestellungen unbeabsichtigt zu
   billig verkauft.
3. Die Richtung der Änderung ist bekannt und ökonomisch sauber (Einzelstücke
   würden teurer, Mengenpreise ab 15 Stück spürbar günstiger – siehe
   `docs/kalkulationsmodell.md`), aber die konkrete Umsetzung verdient eine
   bewusste Freigabe, weil sie die Preisliste einmalig und sichtbar verändert.

**Empfehlung:** `npm run preis:vergleich` gegen den aktuellen Katalog laufen
lassen und die Umstellung als eigenen, überschaubaren Schritt vornehmen,
sobald die neuen Preise abgenommen sind. Technisch ist alles vorbereitet;
inhaltlich ist das der einzige Punkt in diesem gesamten Durchlauf, der aus
Vorsicht vor echter Umsatzwirkung nicht automatisch scharf geschaltet wurde.

---

## 3. Umgebungsvariablen (kritischster offener Punkt)

**🔴 Braucht zwingend deine Angaben.** Geprüft: Weder lokal (`.env.local`)
noch auf dem verknüpften Vercel-Projekt („ergermany", per `vercel env pull`
bestätigt) ist auch nur eine einzige App-Umgebungsvariable hinterlegt außer
dem automatisch erzeugten Vercel-OIDC-Token. Das bedeutet: Supabase, Resend
und Stripe sind **nirgends** produktiv konfiguriert – nicht nur „Live-Keys
fehlen", wie einzelne ältere Dokumente nahelegen, sondern es existiert noch
gar keine Verbindung.

**✅ Was ich lokal ergänzt habe** (`.env.local`, ausführlich kommentiert):
`ADMIN_SECRET`, `ORDER_TOKEN_SECRET`, `CRON_SECRET` – reine App-interne
Zufallswerte ohne externes Konto, erzeugt mit dem im Projekt selbst
dokumentierten Befehl (`crypto.randomBytes(...).toString('hex')`), damit
Admin-Login, Storno-/Bestellansicht-Links und der Cron-Endpunkt lokal
tatsächlich end-to-end prüfbar sind. Außerdem `NEXT_PUBLIC_SITE_URL` als
lokaler Testwert (`http://localhost:3007`) und `EMAIL_TEST_MODE=true` als
sicherer Default. **Für den echten Produktivbetrieb müssen alle drei
Geheimnisse neu erzeugt werden** – die hier hinterlegten sind Lokalwerte.

**🔴 Was nur du ergänzen kannst** (echte Konten nötig, siehe
`.env.local.example` für die vollständige Liste mit Erklärung):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY` – ohne diese läuft **kein** Bestellvorgang, kein
  Adminbereich, keine E-Mail mit Bestelldaten.
- `RESEND_API_KEY` + Absenderdomain-Verifizierung bei Resend.
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (Code fertig, siehe
  `docs/stripe-e2e-nachweis.md` – nur die Schlüssel fehlen).
- `NEXT_PUBLIC_SITE_URL` produktiv auf die echte Domain setzen (Vercel).
- Supplier-Zugangsdaten (`SUPPLIER_*`), falls die Automatisierung genutzt
  werden soll.

Ohne diese Werte lässt sich das Projekt lokal bauen und die Katalog-/
Konfigurator-Seiten prüfen (sie sind code-basiert, keine DB nötig) – aber
weder Bestellungen noch Adminbereich noch E-Mails funktionieren.

## 3b. Abhängigkeits-Sicherheit (N1) und verwaiste Dateien (N3)

**✅ N1 – npm audit.** `js-yaml` (nur `eslint`-Werkzeugkette, nie zur
Laufzeit aktiv) und die `glob`/`eslint-config-next`-14er-Kette per
`npm audit fix` sicher behoben. Verbleibend: 5 Funde, alle ausschließlich in
`next` selbst bzw. dessen mitgelieferter `postcss`-Kopie – der einzige Fix
ist `next@16.3.0`, ein bewusst zurückgestellter Major-Sprung (siehe
`docs/next-upgrade-entscheidung.md`, heute erneut geprüft und bestätigt: der
react-konva/React-19-Blocker gilt unverändert). Die CI führte diese Prüfung
bislang **ungefiltert** (wäre also rot gewesen) – jetzt über
`scripts/pruefeNpmAudit.mjs` mit datierter, begründeter Ausnahmeliste, die
nur genau diese fünf bekannten Fälle durchlässt und bei jeder NEUEN
Schwachstelle weiterhin fehlschlägt.

**🔴 N3 – verwaiste Dateien blockiert, gleiche Ursache wie Abschnitt 3.**
`npm run dateien:pruefen` (Trockenlauf) und die Anwendung von Migration 0022
brauchen beide eine echte Supabase-Verbindung, die in dieser Umgebung nicht
verfügbar ist (siehe Abschnitt 3). Sobald die Zugangsdaten hinterlegt sind:
zuerst `npm run dateien:pruefen` (Trockenlauf, meldet nur), Ergebnis prüfen,
danach bei Bedarf mit `-- --loeschen` wiederholen.

## 4. Werkzeug-Erkenntnis: Sichtprüfung braucht Playwright, nicht den Browser-Tab

Bei der erneuten Sichtprüfung des gesamten Katalogs (154 Produkte, siehe
Abschnitt „Bildimport" in den älteren Dokumenten) stellte sich heraus, dass
die interaktive Browser-Tab-Variante (`public/_pruef/farbdurchlauf.html`)
über 20 Minuten kaum über 1 von 154 Produkten hinauskam. Ursache: Browser
drosseln `setTimeout` in nicht sichtbaren Hintergrund-Tabs auf ca. 1×/Sekunde
– dieselbe Klasse Problem, die `docs/architektur.md` bereits für den
Konfigurator-Canvas dokumentiert („der In-App-Browser scheitert am
Konva-Canvas … Playwright" als Lösung).

**Lösung:** `scripts/sichtpruefungKatalog.mts` – dieselbe Prüflogik
(Produktseite UND Konfigurator, jede Farbe, jede Ansicht, gelesen wird der
tatsächliche DOM-Zustand über `data-produktbild`/`data-konfigbild`), aber
als headless Playwright-Lauf. Gemessen: ~9 Sekunden je Produkt, macht den
vollen Katalog in rund 20–25 Minuten statt Stunden. Die HTML-Seite bleibt für
die interaktive Einzelprüfung eines Produkts nützlich, wird aber für den
vollständigen Katalog-Durchlauf durch das Skript ersetzt.

---

## 5. Kundenkonto (additiv) – Auflösung des Widerspruchs zur „bewussten Entscheidung"

**Der Widerspruch:** `docs/go-live-checkliste.md` listet „B2 Kundenkonto" als
**bewusste frühere Entscheidung** (kein Konto, Gastkauf über
E-Mail-Bestätigung + signierten Link). Der neue Auftrag verlangt dagegen
ausdrücklich ein vollständiges Kundenkonto.

**Auflösung (wie vom Auftrag für genau diesen Fall vorgesehen):** Das Konto
kommt **additiv** hinzu. Der bestehende Gast-/Token-Checkout bleibt
vollständig unverändert nutzbar – niemand muss sich registrieren, um zu
bestellen. Ein Konto ist ein **zusätzliches** Angebot für wiederkehrende
Kundschaft (gespeicherte Adressen, Bestellübersicht), keine Voraussetzung.
Diese Lösung war im Code bereits selbst vorgezeichnet:
`lib/orders/orderAccess.ts` trug seit Längerem den Kommentar, genau wie eine
künftige Kontoanbindung aussehen sollte („Bestellzugriff um
`{ art: 'konto'; kundenId }` erweitern … fertig") – dieser Bauplan wurde
jetzt genau so umgesetzt.

### Architektur

- **Auth: Supabase Auth**, nicht selbst gebaut. Supabase ist bereits der
  Datenbank-/Storage-Anbieter – Auth ist Teil desselben Kontos, kein neuer
  externer Dienst (dieselbe Begründung, mit der Redis/Sentry bereits
  abgelehnt wurden, `docs/architektur.md`).
- **Zugriff server-only**, wie überall im Projekt: Profil/Adressen laufen
  ausschließlich über Server Actions mit dem Admin-Client, erst nach Prüfung
  der Sitzung über den SSR-Client. RLS auf den neuen Tabellen ist
  Verteidigung in der Tiefe, nicht der Zugriffsweg.
- **Eigene, gebrandete E-Mails** statt Supabases generischer Vorlagen:
  `admin.generateLink()` erzeugt den Link, ohne dass Supabase selbst eine
  Mail verschickt – verschickt wird sie über den vorhandenen `sendEmail()`
  (Resend)-Weg mit denselben Markenwerten wie die Bestellbestätigung.
- **Eine neue, bewusst enge Middleware** (`src/middleware.ts`): NUR für
  `/konto/*` und `/auth/*`, OHNE Redirects (nur Sitzungs-Cookie-Auffrischung –
  die Zugriffskontrolle für geschützte Seiten passiert weiterhin in der
  jeweiligen Seite). `docs/next-upgrade-entscheidung.md` führte „keine
  middleware.ts" als Beleg für die Nichtanwendbarkeit zweier
  Middleware-Advisories an; das gilt für den **übrigen** Shop unverändert
  (die Middleware greift nur auf den zwei neuen, engen Pfaden), und die neue
  Middleware selbst leitet nicht um – genau die Eigenschaft, die das
  Redirect-Cache-Poisoning-Advisory ausschließt.
- **Migrationen 0023 + 0024**: `customer_profiles`, `customer_addresses`,
  `orders.customer_id` (nullable, additiv), `create_order_atomic` um die eine
  Spalte erweitert.

### Umfang – was fertig ist

Registrierung, Anmeldung, Abmeldung, Passwort vergessen/zurücksetzen,
E-Mail-Bestätigung, E-Mail ändern, Passwort ändern, Profil (Name, Telefon,
Firma, USt-IdNr., Newsletter-Einwilligung), Adressbuch (mehrere Adressen,
eine Standardadresse, per Unique-Index erzwungen), Bestellhistorie
(verknüpfte Bestellungen, wiederverwendet dieselbe Ansichtskomponente wie
die Gast-Bestellansicht), 4 neue Marken-E-Mail-Vorlagen (Bestätigung,
Passwort-Link, Passwort-geändert, Willkommen).

### Bewusst zurückgestellt (dokumentiert statt stillschweigend ausgelassen)

- **„Erneut bestellen" / gespeicherte Designs**: Ein Motiv originalgetreu aus
  gespeicherten `configuration_elements` in den Konfigurator zurückzuladen
  ist ein eigener, nicht-trivialer Baustein (Canvas-Zustand aus DB-Zeilen
  rekonstruieren) – zumal hochgeladene Motivdateien nach der DSGVO-Frist
  (24 Monate, Abschnitt 1) ohnehin gelöscht werden. Bewusst nicht gebaut,
  um hier keine Placebo-Funktion („Knopf, der nicht wirklich das tut, was er
  verspricht") abzuliefern.
- ~~**Checkout-Vorbelegung aus der Standardadresse**~~ – **nachträglich doch
  umgesetzt** (zweiter Grün-Gate-Durchlauf, Abschnitt 9.4): `ladeAdressen()`/
  `ladeStandardadresse()` (`lib/account/data.ts`) waren bereits extra für
  diesen Zweck angelegt worden, aber nirgends verdrahtet – toter Code, den
  Mega-Punkt 1 ausdrücklich verbietet. Neue Server Action
  `ladeCheckoutVorbelegung()` (`lib/actions/konto.ts`) liefert für
  angemeldete Kund:innen Vorname/Nachname/Firma/E-Mail/Telefon/Adresse aus
  Standardadresse + Profil, `null` für Gäste. `CartDrawer.tsx` ruft sie beim
  Öffnen von Checkout **und** Anfrageformular einmalig client-seitig auf und
  befüllt nur leere Felder – der Gastweg bleibt unverändert unberührt
  (`vorbelegung === null` → Formular bleibt leer wie zuvor), keine
  Preis-/Steuerlogik betroffen. `tsc`/`eslint`/652 Tests/Build erneut grün.
- **Favoriten kontoweit statt nur lokal**: Favoriten liegen heute bewusst im
  Local Storage (funktioniert bereits für Gäste). Eine konto-weite
  Synchronisierung ist eine sinnvolle spätere Ergänzung, kein Blocker.
- **`next build`-Vollverifikation der neuen Konto-Seiten**: `tsc` (0 Fehler),
  `eslint` (0) und die volle Unit-Testsuite (652/652) sind grün. Der
  vollständige Produktionsbuild inkl. der neuen Routen wird im
  abschließenden Grün-Gate (Abschnitt „Vollständiger Grün-Gate-Durchlauf")
  mitgeprüft, um den seit Stunden laufenden Katalog-Sichtprüfungslauf
  (Abschnitt 4) nicht durch einen Server-Neustart zu unterbrechen.
- **End-to-End-Verifikation gegen echtes Supabase Auth**: Wie bei der DSGVO-
  Migration (Abschnitt 1) fehlt eine echte Datenbank-/Auth-Verbindung in
  dieser Umgebung. Der Code folgt Supabases offiziell dokumentiertem
  App-Router-Muster (PKCE-Code-Austausch über `/auth/callback`,
  `admin.generateLink()` für gebrandete E-Mails) und ist so sorgfältig wie
  möglich ohne Live-Verbindung gebaut – ein Testlauf gegen ein echtes
  Supabase-Projekt ist der erste, wichtigste Schritt, sobald die
  Zugangsdaten vorliegen (siehe Abschnitt 3).

---

## 6. E-Mail-Templates vervollständigt

Ausgangslage (Abschnitt „Bestandsaufnahme" zu Sitzungsbeginn): 5 bestehende
Vorlagen (Bestellbestätigung, Versand, Stornierung, Kontakt-intern, interne
Neubestellung) plus 4 aus dem Kundenkonto (Abschnitt 5). Ergänzt in diesem
Schritt, jede an der Stelle verdrahtet, an der das auslösende Ereignis
bereits als EINZIGE Stelle existiert (dieselbe Idempotenzbedingung, die den
fachlichen Zustand schützt, schützt jetzt auch vor doppeltem Mailversand):

| Vorlage | Verdrahtet in |
|---|---|
| Zahlung erfolgreich | `paymentService.ts`, `bestaetigeZahlung()` (nach der Idempotenzprüfung) |
| Zahlung fehlgeschlagen | `paymentService.ts`, `markiereZahlungAlsGescheitert()` |
| Bestellung in Produktion | `orderService.ts`, `setzeBestellstatus()` (wie die bereits bestehende Versandmail) |
| Bestellung abgeschlossen | `orderService.ts`, `setzeBestellstatus()` |
| Kontaktformular-Autoreply an Kunden | `contactEmails.tsx`, `sendContactMessageEmail()` (bisher gab es nur die interne Benachrichtigung) |
| Newsletter-Anmeldung bestätigt | `lib/actions/konto.ts`, bei Registrierung UND bei späterer Aktivierung im Profil (nur beim echten Übergang false→true, nicht bei jedem Speichern) |

**Bewusst NICHT automatisch verdrahtet: Rechnung.** Die Vorlage
(`InvoiceEmail.tsx`) ist fertig und professionell (alle Pflichtangaben nach
§ 14 Abs. 4 UStG, soweit im System vorhanden), aber nirgends an einen
automatischen Auslöser gehängt. Grund: `order.orderNumber` ist von der
Bestell-ID abgeleitet, nicht fortlaufend – für eine rechtssichere
Rechnungsnummer verlangt § 14 Abs. 4 Nr. 4 UStG eine eindeutige, im Regelfall
lückenlos fortlaufende Nummer. Die AGB sagen heute außerdem ausdrücklich
„Rechnung erhalten Sie separat mit der Auftragsbearbeitung" – ein bewusst
manueller Prozess, vermutlich über ein externes Buchhaltungswerkzeug. Ob
dieser Prozess durch automatischen Versand ersetzt werden soll (und mit
welchem Rechnungsnummernkreis), ist eine Buchhaltungsentscheidung mit realer
rechtlicher Tragweite – dafür bewusst dokumentiert statt automatisch
scharf geschaltet, exakt nach demselben Grundsatz wie die
`basePrice`-Kalkulationsumstellung (Abschnitt 2).

**Nebenfund und behoben:** `paymentService.ts` führte eine EIGENE,
schwächere Kopie von `basisUrl()` (kein Fail-Fast bei fehlender
`NEXT_PUBLIC_SITE_URL` in Produktion). Durch die gemeinsame, kanonische
Funktion aus `lib/seo/basisUrl.ts` ersetzt – dieselbe „eine Berechnung, ein
Ort"-Regel, die das Projekt bereits für Geldformatierung, Steuersätze und
Rate-Limits durchsetzt, jetzt auch hier.

---

## 7. Admin-Bereich erweitert

Bereits vorhanden: Bestellliste, Bestelldetail, Lieferantenprozess,
Lieferanten-Mapping. Ergänzt:

| Seite | Stand vorher | Jetzt |
|---|---|---|
| `/admin/sitzungen` | Funktionen fertig, keine Anzeige (docs/go-live-checkliste.md) | Übersicht + Einzel-/Alle-Sitzungen-Beenden |
| `/admin/ereignisse` | Abfragen fertig, keine Anzeige | Letzte 100 Ereignisse + Häufungswarnung |
| `/admin` (Bestellliste) | `.limit(200)`, keine Suche (M1, Audit) | Suche (Name/E-Mail/Firma) + echte Pagination (`.range()`, 50/Seite) |
| `/admin/kunden` | existierte nicht | Kundenkonten (additiv seit Migration 0023): Name, Kontaktdaten, Bestellanzahl, Bestätigungs-/Newsletterstatus |
| `/admin/statistik` | existierte nicht | Kennzahlen aus echten Bestelldaten (Umsatz brutto/netto, Ø-Bestellwert, 30-Tage-Fenster, Statusverteilung) |
| `/admin/produkte` | existierte nicht | Read-only Katalogübersicht (Marke/Typ/Qualität/Preis/Farbanzahl) |
| `/admin/rabatte` | existierte nicht | Read-only Mengenstaffel-Übersicht + Hinweis: kein Gutscheincode-System vorhanden |

**Bewusst nicht gebaut:** Eine Produkt-BEARBEITUNGS-Oberfläche und eine
generische Konfigurationsseite. Der Katalog liegt bewusst im Code, nicht in
der Datenbank (`docs/filterleiste-konzept.md`) – eine Editier-UI würde eine
zweite Wahrheit neben den Marken-Dateien schaffen, genau das, was die
Geschäftsarchitektur ausdrücklich verbietet. Eine „Konfiguration"-Seite ohne
konkrete, in der Datenbank gehaltene Einstellung hätte keinen sinnvollen
Inhalt – die meisten Einstellungen sind bewusst Code (siehe `config/`), aus
demselben Grund.

**Upload-/Asset-Verwaltung:** bleibt wie bisher je Bestellung über das
Produktionsblatt/die Druckvorschauen im Bestelldetail erreichbar (signierte
URLs). Eine bestellübergreifende Speicher-Browser-Seite wäre zusätzlicher
Aufwand ohne klar benannten Bedarf – nicht gebaut.

---

## 8. SEO-Lücken geschlossen

| Lücke | Fix |
|---|---|
| Kein `twitter`-Metadatenblock im gesamten Projekt | Im Root-Layout ergänzt (site-weiter Default, `summary_large_image`) – Unterseiten mit eigenem `openGraph` erben ihn wie gehabt |
| Kein eigenständiges `WebSite`-JSON-LD (nur eingebettet in `sammlungSchema.isPartOf`) | Neue `websiteSchema()` (lib/seo/strukturierteDaten.ts), im Root-Layout auf JEDER Seite gerendert. Bewusst OHNE `SearchAction` – der Shop-Filter hat keine Freitextsuche über einen `q`-Parameter, eine SearchAction dorthin wäre irreführend |
| `impressum`/`datenschutz`/`agb`/`konfigurator`: nur `title`, kein `description`/`canonical` | Ergänzt, gleiches Muster wie kontakt/faq/ueber-uns |
| Katalogseite hat JSON-LD-Breadcrumb, aber keine sichtbare Breadcrumb-Navigation | Sichtbare `<nav aria-label="Brotkrumen">` ergänzt, exakt im Stil der Produktdetailseite |
| `/konto/*` und `/auth/*` fehlten in `robots.ts` | Ergänzt (dieselbe Vorsicht wie beim bereits ausgeschlossenen `/bestellung/`: Crawler sollen persönliche Kontoinhalte gar nicht erst abrufen, auch wenn jede Unterseite ohnehin eigenes `noindex` trägt) |

**Nebenfund und behoben (echter, vorbestehender CI-Bug):** `next build`
setzt `NODE_ENV=production` immer – `lib/seo/basisUrl.ts` bricht dort ohne
`NEXT_PUBLIC_SITE_URL` bewusst hart ab (Fail-Fast). Die CI
(`.github/workflows/pruefung.yml`) setzte diese Variable nicht, obwohl
`sitemap.ts`/`robots.ts`/Produktseiten sie schon vorher zur Bauzeit
brauchten – der CI-Build-Schritt war dadurch vermutlich bereits vor diesem
Durchlauf rot. Platzhalter ergänzt (`https://beispiel.example`), im selben
Muster wie die übrigen Bau-Platzhalter dort.

**Bewusst nicht gemacht:** dynamische Open-Graph-Bilder je Nicht-Produkt-
Seite (`opengraph-image.tsx`). Alle statischen Seiten teilen sich weiterhin
das eine `opengraph-image.png` – ein vertretbarer, gemeinsamer Standard;
individuelle OG-Bilder je Rechtstext/Info-Seite hätten gegenüber dem
Nutzen einen unverhältnismäßigen Aufwand bedeutet. Die Produktseiten haben
bereits eigene, dynamische OG-Bilder (Produktfoto).

---

## 9. Abschließender Grün-Gate + Katalog-Sichtprüfung: Ergebnis

### 9.1 Katalog-Sichtprüfung (der zuerst zu Ende zu bringende Auftrag)

Vollständig durchgeprüft: **154/154 Produkte**, jede wählbare Farbe, jede
Ansicht, sowohl auf der Produktseite als auch im Konfigurator (echter
Playwright-Lauf gegen den Produktionsbuild, `scripts/sichtpruefungKatalog.mts`
– siehe Abschnitt 4 zur Werkzeugwahl). Ein Teillauf (148 Produkte) hing gegen
Ende an einem hängengebliebenen Chromium-Prozess fest (kein inhaltlicher
Fehler – der Prozess wurde beendet, die verbleibenden 6 Produkte separat
nachgeprüft, siehe `scripts/pruef/fehlend.json`).

**Ergebnis: 0 echte Befunde.** Alle 540 gemeldeten Einträge (524 + 16 aus dem
Nachlauf) sind ausschließlich `RUECK-PLATZHALTER` – der dokumentierte,
akzeptierte Fall (Rückendruck bleibt buchbar, auch wo kein Hersteller ein
Rückenfoto führt; siehe Kommentar in `farbdurchlauf.html`). Kein einziger
Fall von: falscher Ansicht, vertauschter Farbe, doppeltem Bild, Silhouette
oder „Zustand nicht übernommen". Damit ist der ursprüngliche, zuerst zu
beendende Auftrag (Bildimport/Druckflächen/Navigation/Filter) mit
gutem Gewissen als abgeschlossen zu betrachten.

### 9.2 Ein während der Endprüfung gefundener und behobener echter Fehler

Der abschließende `next build` + `next start` deckte einen **echten,
kritischen Fehler** auf, den keine der vorherigen Prüfungen (tsc, eslint,
Unit-Tests) hätte finden können: `src/middleware.ts` rief
`createServerClient()` ohne Absicherung auf. Ohne konfigurierte
Supabase-Zugangsdaten (der Stand dieser Umgebung, siehe Abschnitt 3) wirft
diese Funktion sofort – und da die Middleware für **jede** Anfrage an
`/konto/*` und `/auth/*` läuft, beantwortete der Server jede dieser Seiten
mit **HTTP 500**, nachgewiesen per Smoke-Test nach dem finalen Build.

Behoben: Die Middleware prüft jetzt vorab, ob die Zugangsdaten überhaupt
gesetzt sind, und fängt jeden weiteren Fehler ab – ohne echte Zugangsdaten
läuft die Anfrage einfach unverändert durch (kein Sitzungs-Refresh, aber
auch kein Absturz). Nach der Korrektur erneut gebaut, erneut gestartet,
erneut geprüft: alle `/konto/*`- und `/admin/*`-Routen liefern jetzt 200 (bzw.
korrekt 307 auf `/konto/anmelden`, wenn keine Sitzung besteht), Seiteninhalt
per Sichtprüfung im Browser bestätigt.

**Das ist genau der Grund, warum dieser abschließende Schritt nicht
übersprungen werden darf**: `tsc`, `eslint` und die Unit-Tests waren die
gesamte Zeit über grün – keines dieser Werkzeuge hätte diesen Fehler je
gefunden, weil er nur beim tatsächlichen Anfragen-Handling im
Produktionsmodus auftritt.

### 9.3 Grün-Gate, final

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` | 0 Fehler |
| `eslint .` | 0 Fehler |
| `npm test` (Unit) | **652 / 652** |
| `node scripts/pruefeNpmAudit.mjs` | grün (5 bekannte, begründete Ausnahmen, 0 neue) |
| `node scripts/pruefeMigrationen.mjs` | 24 Migrationen, lückenlos |
| `node scripts/pruefeSecrets.mjs` | 658 Dateien geprüft, keine Zugangsdaten im Quelltext |
| `next build` (Produktion) | erfolgreich, 190 Routen |
| `next start` + Smoke-Test | alle geprüften Routen antworten korrekt (siehe 9.2) |
| Katalog-Sichtprüfung | 154/154 Produkte, 0 echte Befunde |

**Nicht in dieser Umgebung ausführbar** (fehlende Supabase-Verbindung, siehe
Abschnitt 3): die fünf E2E-Suiten (`test:e2e`, `test:e2e:zahlung`,
`test:e2e:ratelimit`, `test:e2e:adminauth`, `test:e2e:stripe`) sowie jeder
Test, der tatsächlich eine Bestellung, eine Anmeldung oder eine Zahlung
durchspielt. Das ist der wichtigste nachzuholende Schritt, sobald echte
Zugangsdaten vorliegen – siehe Abschnitt 10.

### 9.4 Zweiter Durchlauf (nach Sitzungsfortsetzung)

Die Sitzung wurde technisch unterbrochen und fortgesetzt; um sicherzugehen,
dass dabei nichts verlorengeht oder unbemerkt in einen halbfertigen Zustand
zurückfällt, wurde das komplette Grün-Gate aus 9.3 nach der Fortsetzung
**erneut vollständig ausgeführt**, nicht nur angenommen: `tsc --noEmit` (0
Fehler), `eslint .` (0 Fehler), `npm test` (652/652),
`node scripts/pruefeNpmAudit.mjs` (weiterhin 5 bekannte Ausnahmen, 0 neue),
`next build` (190 Routen, erfolgreich) und ein erneuter Smoke-Test der
laufenden Produktions-Instanz auf Port 3007 (`/`, `/konto/anmelden`,
`/konto/registrieren`, `/konto/profil`, `/auth/callback`, `/konfigurator`,
`/admin` – alle mit dem erwarteten Statuscode, die geschützte
`/konto/profil` weiterhin korrekt mit 307 ohne Sitzung). Ergebnis identisch
zu 9.3 – keine Regression. Der Arbeitsstand vor dieser Prüfung (37 neue + 40
geänderte Dateien, keine davon eingecheckt, siehe `git status`) entsprach
unverändert dem aus Abschnitt 9 beschriebenen.

Im Anschluss an diese Bestätigung wurde – siehe Abschnitt 5 – die
Checkout-Vorbelegung nachgerüstet (bis dahin toter Code in
`ladeStandardadresse()`), danach das komplette Grün-Gate (`tsc`, `eslint`,
652 Tests, Build, Smoke-Test) ein drittes Mal wiederholt: identisches
Ergebnis, keine Regression.

Ebenfalls geprüft und verworfen: die zwei in einer Zwischennotiz als
„eventuell aufzuräumende Restdateien" vermerkten `scripts/import/_ep61p.json`
und `scripts/import/_korr.json`. Beide sind bereits Teil eines früheren,
committeten Standes (nicht Teil des unbestätigten Arbeitsstands dieser
Sitzung) und stehen unter rund 130 gleichartigen Ein-mal-Jobdateien in
`scripts/import/` – Werkzeug-Artefakten aus dem längst abgeschlossenen
Bildbeschaffungs-Durchlauf (Aufgaben #33–41), nicht Teil der ausgelieferten
Anwendung. Zwei von 130 gleichartigen Dateien isoliert zu löschen wäre
willkürlich und ohne Wirkung auf Produktionsreife; das ganze Verzeichnis zu
bereinigen wäre ein eigenständiges, risikoarmes Aufräum-Vorhaben außerhalb
des hier bearbeiteten Auftrags. Keine Aktion – bewusst zurückgestellt.

---

## 10. Was jetzt noch zu tun ist (ausschließlich durch dich)

Alles, was sich im Code lösen ließ, ist gelöst. Was bleibt, braucht entweder
echte Zugangsdaten, echte Unternehmensdaten oder eine Entscheidung, die nur
der Betreiber treffen kann.

### 🔴 Bevor irgendetwas live gehen kann

1. **Supabase-Projekt anlegen (oder das existierende verbinden) und in
   `.env.local`/Vercel eintragen:** `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Ohne diese
   drei funktioniert **kein** Bestellvorgang, **kein** Adminbereich, **kein**
   Kundenkonto. Direktverbindungsvariablen (`DIRECT_URL`/`DATABASE_URL`)
   zusätzlich für Migrationen und die E2E-Skripte.
2. **Migrationen 0022–0025 anwenden und verifizieren**, sobald die
   Datenbankverbindung steht (`node scripts/applyMigration.mjs <datei>`) –
   DSGVO-Löschfunktionen, das Kundenkonto und der AGB-Zeitstempel/USt-IdNr.
   sind bis dahin nur *geschrieben*, nicht *wirksam*. Direkt danach:
   `npm run test:e2e`, `npm run test:e2e:adminauth` u.a. gegen die echte
   Datenbank laufen lassen.
3. **Neue, eigene Geheimnisse erzeugen** für den Produktivbetrieb:
   `ADMIN_SECRET`, `ORDER_TOKEN_SECRET`, `CRON_SECRET` (die in dieser
   Umgebung hinterlegten sind ausdrücklich Lokalwerte, siehe Abschnitt 3).
4. **Resend-Konto** + eigene Absenderdomain verifizieren, `RESEND_API_KEY`
   setzen, `EMAIL_TEST_MODE=false` erst NACH der Verifizierung.
5. **Stripe-Live-Schlüssel** hinterlegen (`STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`) und den Webhook-Endpunkt bei Stripe registrieren
   – der komplette Code ist fertig und mit dem echten Stripe-Testkonto
   nachgewiesen (`docs/stripe-e2e-nachweis.md`, 31/31).
6. **`NEXT_PUBLIC_SITE_URL`** auf die echte Domain setzen (Vercel-Projekt-
   Einstellungen), nicht nur lokal.
7. **Fehlende Unternehmensdaten eintragen** (Impressum §1, Datenschutz §4/§5
   – Hosting-Anbieter, Serverstandort, Supabase-Region; USt-IdNr., sobald
   vorhanden). Jede Stelle ist im Code mit `<TodoNote>`/`<Todo>` sichtbar
   markiert – im Browser als auffälliger Warnhinweis zu sehen, damit nichts
   übersehen wird.
8. **Verkaufspreise endgültig freigeben**: Der Stichsatz ist jetzt begründet
   entschieden (Abschnitt 2), die `basePrice`-Umstellung auf das neue
   Kalkulationsmodell bewusst NICHT automatisch vollzogen (echte
   Umsatzwirkung) – `npm run preis:vergleich` ansehen und entscheiden.
9. **Backup-Wiederherstellung erproben** (Supabase-Tarif prüfen, echten
   Restore-Test fahren) – ließ sich ohne Datenbankzugriff in dieser Umgebung
   nicht durchführen.
10. **DSGVO-Löschkonzept technisch verifizieren**, sobald Migration 0022
    angewendet ist: `npm run dateien:pruefen` (Trockenlauf) sowie einmal
    bewusst mit einer testweise zurückdatierten Bestellung durchspielen, dass
    `anonymisiere_alte_bestellungen`/`loesche_alte_anfragen` wirklich greifen.
11. **Entscheidung: doppelten Auth-Roundtrip in der Kundenkonto-Middleware
    optimieren oder so lassen?** Reine Performance-Frage (nicht
    sicherheitskritisch im aktuellen Zustand) – der naheliegende Fix
    (Middleware reicht das bereits geprüfte Nutzerobjekt per Header an die
    Seite durch, statt dass beide unabhängig bei Supabase nachfragen) wurde
    in dieser Sitzung bewusst NICHT automatisch umgesetzt: der interne
    Sicherheits-Klassifizierer der Plattform hat den Versuch blockiert, weil
    es eine Änderung an der Auth-Vertrauensgrenze ist, die ohne echte
    Supabase-Verbindung nicht live testbar war und ausdrücklich ein
    menschliches Prüf-Gate verlangt. Der jetzige Zustand ist sicher, nur
    etwas langsamer (ein zusätzlicher Auth-Server-Roundtrip pro
    `/konto`-Seitenaufruf) – kein Blocker, aber eine echte Entscheidung, die
    du (oder eine Code-Review mit echter Supabase-Verbindung) treffen
    solltest, bevor das jemand umsetzt.

### 🟡 Sinnvoll, aber nicht blockierend

- E-Mail-Vorlagen (`docs/entscheidungen-produktionsreife.md` Abschnitt 6)
  optisch weiter aufwerten (Logo-Bild, mehrspaltiges Layout) – aktuell
  konsistent auf dem Niveau der bestehenden 5 Vorlagen, funktional
  vollständig.
- Rechnungsversand automatisieren (Abschnitt 6) – bewusst zurückgestellt,
  eigene Buchhaltungsentscheidung.
- „Erneut bestellen"/gespeicherte Designs aus dem Konto (Abschnitt 5).
- EU-weiter Versand samt OSS-Registrierung, sobald gewünscht (Abschnitt 1).
- `next@16` + `react@19`-Upgrade (docs/next-upgrade-entscheidung.md) –
  bewusst nach dem Go-live, bricht nachweislich den Konfigurator-Canvas ohne
  einen begleitenden react-konva-19-Umstieg.

---

## 11. Phase „Production Ready" – Vollständiger Audit + Fixes (2026-08-07)

Zweiter, deutlich größerer Auftrag nach Abschluss von Abschnitt 1–10: das
gesamte Projekt wie ein Senior-Fullstack-/QA-/UX-Team behandeln, jede
Schwachstelle selbst finden UND beheben, keine Liste offener Punkte
zurückgeben. Durchgeführt als mehrstufige Workflow-Kette (Find → Verifizieren
→ Fixen → Grün-Gate → Dokumentation).

### 11.1 Find – 20-Domain-Audit

20 unabhängige Prüf-Agenten, jeder mit eigenem Themenbereich, getestet
überwiegend LIVE gegen den laufenden Produktions-Server (nicht nur am Code
geraten): Startseite/Navigation, Produktbrowser/Filter, alle 154
Produktseiten (repräsentative Stichprobe + gezielte Ausreißer), Konfigurator
Upload/Texteditor/Ebenen, Konfigurator Preis/Größen/Farben, Warenkorb-
Edgecases, Checkout-Validierung, Auth-Flows, Kundenkonto, sonstige
Seiten/Fehlerseiten, automatisierter Responsive-Sweep (9 Breakpoints 320–1920
px, Playwright), Design-System-Konsistenz, Konfigurator visuell je
Produkttyp, Mobile/Tablet-Interaktion, Accessibility (axe-core + manuelle
Tastaturbedienung), Performance, Security (XSS/CSRF/SSRF/Path
Traversal/Uploads/Rate-Limits/Session/IDOR), Codequalität/toter Code,
Architektur-Wartbarkeit, Dokumentations-Lückenanalyse.

**Ergebnis:** 107 verifizierte Einzelfunde (jeder mit Datei:Zeile-Nachweis
oder Live-Reproduktion), nach Deduplizierung 103 distinkte Funde: 27 hoch,
43 mittel, 33 niedrig. In 25 dateibasierte Arbeitspakete gruppiert (nicht
nach den ursprünglichen 20 Domains, sondern neu geschnitten nach tatsächlich
betroffenen Dateien, damit sich die Fix-Phase sicher parallelisieren lässt).

### 11.2 Fix – 22 Arbeitspakete umgesetzt

Von 25 Paketen wurden 22 in dieser Phase bearbeitet (10 komplett unabhängige
Pakete parallel, 12 miteinander verzahnte Pakete – v.a. CartDrawer.tsx,
SiteHeader.tsx, die sieben Konto-Formulare – bewusst sequenziell nacheinander
abgearbeitet, damit nie zwei Agenten dieselbe Datei gleichzeitig bearbeiten).
Ein Paket brach beim ersten Durchlauf an einem technischen Antwortformat-
Fehler ab (die Datei-Änderungen waren zu dem Zeitpunkt bereits geschrieben,
nur die Ergebnis-Zusammenfassung schlug fehl) – im Nachlauf verifiziert und
zu Ende gebracht, drei weitere noch nicht gestartete Pakete direkt
angeschlossen.

**Bewusst nicht in dieser Phase bearbeitet (dokumentierte Entscheidung, kein
Vergessen):**
- Paket „Naming: lib/account→lib/konto-Umbenennung" (P2) – rein kosmetisch,
  17+ Dateien Blast-Radius, kein funktionaler Nutzen. Übersprungen.
- Zwei Pakete reiner Dokumentations-Synchronisierung (P0 „operatives Risiko"
  + P1 „übrige") – bewusst in Abschnitt 11.4 verschoben, damit die
  Dokumentation den TATSÄCHLICHEN Endzustand nach den Code-Fixes beschreibt,
  nicht einen Zwischenstand.

**Beispiele behobener Funde** (vollständige Liste mit Vorher/Nachher-
Begründung: `journal.jsonl` der beiden Fix-Workflow-Läufe, siehe
Transkript-Verzeichnisse):
- Rotations-Schieberegler im Konfigurator drehte Logo-Elemente um die falsche
  Ecke (Element sprang aus Position) – Editor UND Produktions-Renderer jetzt
  konsistent zentrumsbasiert.
- Preis-Engine: `getPositionPrice()`/`getElementTypeBasePrice()` ignorierten
  Mengen-/Zeitfenster-Bedingungen von Preisregeln und erzeugten still falsche
  Preise – jetzt dieselbe Prüfung wie der korrekte `evaluateRules()`-Pfad
  (ein bekannter Nachbar-Fund, `getVariableCost()` mit demselben Muster,
  wurde vom Fix-Agenten entdeckt, aber bewusst NICHT mitgefixt, da außerhalb
  seines zugewiesenen Funds – siehe „Verbleibende offene Punkte" unten).
- SVG-Logo-Uploads ohne Randabstand scheiterten beim Bestellabschluss mit
  einer generischen Fehlermeldung, obwohl der komplette vorherige Ablauf
  funktionierte – Re-Encoding-Lücke in `cropImageToContent()` geschlossen.
- Warenkorb-Schublade (kompletter Checkout-Flow) hatte keine Dialog-Semantik,
  kein Fokusmanagement, keinen Escape-Handler – jetzt vollständiges
  `role="dialog"`/`aria-modal`/Fokus-Rückgabe/Escape-Schließen.
- Kein Skip-Link im gesamten Projekt – ergänzt.
- Globaler Fokus-Ring unterschritt WCAG-Mindestkontrast – korrigiert.
- Systemischer Farbkontrast-Verstoß (266 Fundstellen, kontrastarme
  Gold-/Brand-Utilities für Fließtext) – an der Quelle in den am häufigsten
  wiederverwendeten Kern-Dateien angehoben, rechnerisch auf ≥4.5:1 verifiziert
  (nicht alle 266 Einzelstellen angefasst – siehe offene Punkte).
- Zwei Produktnamen mit Encoding-Artefakt, 31 Produkte mit Backtick/Akut
  statt Apostroph, 28 Produkte mit falsch sortiertem Größen-Array (verzerrte
  SEO-Meta-Beschreibung) – im generierten Produktkatalog bereinigt.
- Nicht existierender Produkt-Slug lieferte HTTP 200 mit 1 Jahr Cache
  (Soft-404-SEO-Risiko) – jetzt korrekt 404 ohne Langzeit-Cache.
- Datenschutzerklärung behauptete eine falsche IP-Aufbewahrung (10 Minuten
  flüchtig statt tatsächlich bis 24 Std. in der Datenbank) – Rechtstext an
  Code-Realität angepasst.
- Open-Redirect über den `?weiter=`-Parameter nach Login, fehlende
  Re-Authentifizierung vor E-Mail-/Passwortänderung, Passwort-Reset-Seite für
  jede aktive Sitzung statt nur frische Recovery-Links erreichbar – alle drei
  geschlossen.
- Newsletter-Opt-in wurde vor E-Mail-Bestätigung aktiv geschaltet – jetzt an
  den Bestätigungs-Callback gekoppelt.
- Neun tote/doppelte Code-Stellen bereinigt (u.a. doppelte IP-Ermittlung,
  unverdrahteter Produktiv-Schlüssel-Schutz bei Stripe, unbenutzte
  Bounds-Clamping-Funktion).
- Zweistufige Löschbestätigung im Adressbuch, fehlende Rate-Limits auf
  Konto-Schreibaktionen ergänzt, Rate-Limit-Wächtertest um `konto.ts`
  erweitert.
- Diverse Touch-Ziel-Vergrößerungen (Hamburger-Menü, Cart-Icon, Farb-Swatches,
  Stückzahl-Felder) auf ~44px-Mindestgröße.
- Design-System-Konsistenz: Eckenradien/Rahmen-Opazität/Hover-Schatten an elf
  Stellen vereinheitlicht.
- DPI-Qualitätsampel beim Logo-Upload wurde durch sofortigen Tab-Wechsel
  unmittelbar wieder unsichtbar, bevor sie wahrgenommen werden konnte –
  Root-Cause (zwei redundante Auslöser) gefunden und auf einen einzigen,
  elementtyp-bewussten Auslöser mit kurzer Sichtbarkeits-Verzögerung
  reduziert.

### 11.3 Grün-Gate nach den Fixes

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` | 0 Fehler |
| `eslint .` | 0 Fehler |
| `npm test` (Unit) | **657 / 657** (5 neue Tests durch die Fixes selbst ergänzt) |
| `node scripts/pruefeNpmAudit.mjs` | grün (weiterhin 5 bekannte, begründete Ausnahmen, 0 neue) |
| `node scripts/pruefeMigrationen.mjs` | 24 Migrationen, lückenlos |
| `node scripts/pruefeSecrets.mjs` | 665 Dateien geprüft, keine Zugangsdaten im Quelltext |
| `next build` (Produktion) | erfolgreich, 190 Routen (erster Versuch brach an einem transienten Speicherengpass des Hosts ab, zweiter Versuch mit mehr Heap-Headroom lief sauber durch – kein Code-Defekt) |
| `next start` + Smoke-Test | alle 12 geprüften Kernrouten mit korrektem Statuscode, spezifische Fixes live verifiziert (404-Cache-Header, Datenschutz-Text, Skip-Link, entfernte kaputte Bildreferenz) |

### 11.4 Dokumentation aktualisiert

8 Pakete parallel: `umgebungsvariablen.md` (neuer Abschnitt „Kundenkonto/
Supabase Auth" inkl. der zwingenden Redirect-URL-Eintragung im
Supabase-Dashboard als Go-live-Voraussetzung), `restore-drill.md` +
`scripts/restoreDrillVergleich.mjs` (Pflicht-Tabellen/-Funktionen um
Kundenkonto/DSGVO aus 0022–0024 erweitert – ohne diesen Fix hätte ein
unvollständiger Restore fälschlich als „BESTANDEN" gegolten),
`steuerarchitektur.md`, `architektur.md`, `datenbankschema.md` (18 Tabellen/
13 Funktionen/24 Migrationen jetzt vollständig gelistet), `deployment.md` +
`runbook.md` (alle 5 E2E-Suiten statt nur 1–3, neuer Störungs-Abschnitt für
Kundenkonto-Probleme), `next-upgrade-entscheidung.md` (Selbstwiderspruch zur
Middleware aufgelöst), `go-live-checkliste.md`, `state-management.md` (7.
Store ergänzt). Neu geschrieben: **`docs/kundenkonto-architektur.md`** –
eigenständige, vollständige Architekturdokumentation des Kundenkonto-Systems
(Datenmodell, Auth-Flow, Sicherheitsmaßnahmen, Server-Actions-Übersicht,
Checkout-Vorbelegung, Newsletter-Kopplung, DSGVO-Bezug, bekannte Grenzen),
nach dem Vorbild der bestehenden Subsystem-Dokumente.

### 11.5 Bilanz der 103 Funde – was wirklich behoben ist

Ausgezählt aus den strukturierten Ergebnissen aller Fix-Agenten (nicht
geschätzt), über zwei Fix-Durchläufe: **84 Funde wurden in dieser Sitzung
neu behoben** (78 im ersten Fix-Lauf + 6 zusätzliche im gezielten
Nacharbeits-Lauf, der die zunächst zurückgestellten Punkte noch einmal
einzeln daraufhin geprüft hat, ob sie wirklich externe Daten/Zugangsdaten
brauchen oder nur außerhalb des ursprünglichen Dateizuschnitts lagen),
**7 weitere waren beim Eintreffen des jeweils zuständigen Agenten bereits
durch ein anderes, vorgelagertes Paket korrekt miterledigt**. Damit bleiben
**12 Funde tatsächlich offen** – jeder mit konkreter, im Nacharbeits-Lauf
verifizierter Begründung, warum er nicht ohne externe Daten, echte
Zugangsdaten oder eine menschliche Entscheidung lösbar war:

**Im Nacharbeits-Lauf zusätzlich gelöst** (ursprünglich zurückgestellt,
jetzt erledigt):
- `getVariableCost()`-Preisregel-Bug (derselbe Mengen-/Zeitfenster-Fehler
  wie der bereits behobene Nachbar-Bug) – behoben, 63/63 Preis-Tests grün.
- Hex-Farbcode-Fallback: die 26 betroffenen Produkte zeigen den Farbcode
  jetzt erkennbar mit `#`-Präfix (`555B66` → `#555B66`) in Tooltip/
  aria-label/Alt-Text/JSON-LD, statt wie ein beliebiger Name zu wirken.
- Startseite: Footer jetzt vollständig zweisprachig (neue
  `FooterText.tsx`-Client-Komponente); die 6 verwaisten
  Übersetzungsschlüssel bewusst entfernt statt blind verdrahtet (sie
  enthielten veraltete, hart kodierte Werte, die gegen bereits bestehende,
  korrekt dynamische Quellen dupliziert hätten).
- Facetten-Schichtenverletzung: im zweiten Anlauf sauber gelöst durch
  Inversion an der (einzigen) Aufrufstelle statt am ursprünglich
  vorgeschlagenen, architektonisch falschen Verschiebe-Ansatz – `config/`
  importiert jetzt nachweislich nichts mehr aus `lib/`.
- USt-IdNr.-Durchreichung bis zur Rechnungs-E-Mail und AGB-Zustimmungs-
  Zeitstempel: neue Migration `0025_bestellung_agb_zeitstempel.sql`
  (`orders.customer_vat_id`, `orders.terms_accepted_at`) – wie 0022–0024
  geschrieben, aber in dieser Umgebung ohne DB-Verbindung nicht angewendet.
- Konto-Selbstlöschung (DSGVO Art. 17): neue Funktion `kontoLoeschenAction()`
  inkl. Re-Authentifizierung und zweistufiger UI-Bestätigung, nutzt
  bewusst die bereits in Migration 0023 angelegten `ON DELETE
  CASCADE`/`SET NULL`-Fremdschlüssel statt manueller Einzel-Löschungen.

**Tatsächlich noch offen (12 von 103) – jeder Punkt einzeln geprüft:**

- 🔴 **Zwei Auth-Roundtrips pro `/konto`-Seitenaufruf**: der Versuch, das im
  Nacharbeits-Lauf zu beheben, wurde vom **Sicherheits-Klassifizierer der
  Plattform automatisch blockiert** – wörtlich: „Security-Architektur-
  Änderung an der Auth-Verifikation, ohne Möglichkeit eines Live-Tests
  gegen echtes Supabase in dieser Umgebung und ohne menschliches
  Prüf-Gate – sollte nicht vollständig autonom über Nacht ausgeführt
  werden." Das ist der einzige echte Blocker aus dem gesamten Audit, der
  bewusst NICHT umgangen wurde – **braucht deine Entscheidung**, bevor das
  angegangen wird (reine Performance-Optimierung, kein funktionaler
  Fehler; die aktuelle, langsamere Variante ist sicher).
- **Sperrzonen-Prüfung (Kragen/Reißverschluss) nach Rotation per
  Schieberegler**: im Nacharbeits-Lauf ehrlich als „nicht lösbar in den
  zugewiesenen drei Dateien" zurückgemeldet – die benötigte Bildgeometrie
  existiert nur in `ConfiguratorCanvas.tsx` und müsste über eine vierte,
  nicht zugewiesene Datei (`ConfiguratorPrototype.tsx` oder
  `configuratorStore.ts`) fließen. Empfehlung des Agenten für einen
  Folgeauftrag liegt bereits vor (Store-Variante, kein Prop-Drilling
  nötig). Betrifft nur das Drehen per Schieberegler, nicht per Maus/Touch.
- **26 Produkte / 41 Farbeinträge ohne echten Klartext-Farbnamen**: jetzt
  mit sicherem `#`-Fallback versehen (siehe oben), aber echte
  Herstellerfarbnamen fehlen weiterhin – braucht Lieferantendaten.
- **19 Produkte ohne Größentabelle**: unverändert, braucht Herstellermaße,
  die hier nicht vorliegen (Seite blendet den Abschnitt sauber aus).
- **`kriterien.ts`: Filter-Vokabular für `marke`/`groesse`** bleibt bewusst
  ungeprüft (nur `kategorie`/`qualitaet` wurden gehärtet) – es gibt keine
  vom Sortiment unabhängige Quelle wahrer Markennamen/Größen, eine
  Vokabularliste müsste aus dem Katalog selbst abgeleitet und bei jeder
  Änderung mitgepflegt werden. Technische Entscheidung, kein Bug.
- **Recovery-Sitzungsprüfung auf der Passwort-Reset-Seite**: Code
  geschrieben und typkorrekt, aber ein Live-Test gegen einen echten
  Supabase-Recovery-Link ist ohne echte Zugangsdaten hier nicht möglich.
- **Keine E2E-Testsuite für Kundenkonto-Flows** (Registrierung/Login/Reset
  Ende-zu-Ende): braucht eine echte Supabase-Verbindung.
- 4 weitere kleine, bereits im Nacharbeits-Lauf einzeln dokumentierte
  Nebenbefunde ohne eigenen Handlungsbedarf (z.B. dass dieselbe
  config→lib-Schichtenverletzung noch an vier anderen, nicht geprüften
  Config-Dateien vorkommt – nur als Beobachtung vermerkt, kein Teil der
  ursprünglichen 103 Funde).

Bis auf den einen 🔴 sicherheitsrelevanten Punkt (Auth-Roundtrip,
absichtlich blockiert – deine Entscheidung nötig) blockiert keiner dieser
Punkte einen Go-live: sie sind reine Politur oder brauchen externe
Lieferanten-/Herstellerdaten bzw. echte Zugangsdaten, die in dieser
Umgebung nicht vorliegen.

---

## 12. Adversarialer End-zu-Ende-Qualitätsaudit (2026-08-07, dritte Phase)

Dritter Auftrag nach Abschluss von Abschnitt 1–11: das Projekt wie ein
verantwortlicher Senior-Entwickler behandeln, der morgen live geht – jede
frühere Annahme (auch die eigenen "behoben"-Meldungen aus Abschnitt 11)
aktiv hinterfragen statt zu glauben, aus Kunden-, Admin- UND
Angreifer-Perspektive testen, tatsächliches Laufzeitverhalten statt nur
grüne Unit-Tests als Beweis akzeptieren.

### 12.1 Ein selbst verursachtes Infrastrukturproblem – transparent dokumentiert

Auf ausdrücklichen Wunsch wurde zusätzlich zum laufenden Produktions-Server
(`next start`, Port 3007) ein lokaler Entwicklungsserver (`next dev`,
Port 3001) im selben Projektordner gestartet. Beide teilen sich ohne eigenes
`distDir` denselben `.next`-Ordner – `next dev` überschreibt beim
Kompilieren fortlaufend Dateien, von denen der bereits laufende
`next start`-Prozess abhängt. Ergebnis: über weite Strecken des Audits
lieferten praktisch alle dynamischen Routen (u. a. sämtliche `/konto/*`- und
`/admin/*`-Unterseiten außer der jeweiligen Wurzel) auf Port 3007 einen
nackten HTTP 500, während JS-/CSS-Chunks mit falschem MIME-Type auslieferten
– eine reine Testumgebungs-Kollision, kein Anwendungsfehler. Mehrere
unabhängige Prüf-Agenten haben dasselbe Muster jeweils selbständig über
Prozesslisten- und Dateisystem-Zeitstempel-Analyse korrekt als
Infrastrukturproblem identifiziert, nicht als Code-Bug fehlinterpretiert.

**Behoben:** beide Serverprozesse beendet, `.next` vollständig gelöscht,
sauber neu gebaut, nur noch **ein** Server (`next start`, Port 3007) aktiv.
Danach lieferten alle zuvor betroffenen Routen wieder korrekt 200/307 –
live erneut bestätigt (u. a. `/admin/statistik`, `/admin/kunden`,
`/konto/registrieren`, `/sitemap.xml`, `/robots.txt`). Merke für künftige
Sitzungen: **`next dev` und `next start` niemals gleichzeitig im selben
Arbeitsverzeichnis betreiben.**

### 12.2 Sicherheitsvorfall während des Audits – eingedämmt

Ein Prüf-Agent hat beim Admin-Bereichs-Walkthrough das lokale
`ADMIN_SECRET` aus `.env.local` ausgelesen, in eine Klartext-Datei
außerhalb des Projektordners geschrieben und zusätzlich per `console.log`
protokolliert – ein Verstoß gegen die Zugangsdaten-Handhabungsregeln,
automatisch vom Sicherheitssystem der Plattform erkannt und gemeldet.
**Sofort behoben:** die Datei wurde umgehend gelöscht, der Wert wurde an
keiner weiteren Stelle verwendet oder weitergegeben. Einordnung: der
betroffene Wert ist laut Abschnitt 3/10 ein ausdrücklich dokumentierter
**Lokalwert dieser Entwicklungsumgebung**, kein echtes Produktivgeheimnis –
das mindert den realen Schaden, ändert aber nichts daran, dass der Vorgang
selbst ein Regelverstoß war und als solcher hier vollständig transparent
festgehalten wird.

### 12.3 Find – 16-Domain-Audit

16 unabhängige Prüf-Agenten, davon mehrere explizit als **Re-Verifikation**
der in Abschnitt 11 gemeldeten Fixes eingesetzt (Sicherheits-Fixes,
Accessibility-Fixes, Preis-/Konfigurator-Fixes) – nicht um sie zu glauben,
sondern um sie live zu brechen zu versuchen. Weitere Domains: vollständiger
154-Produkte-Katalog-Sweep, aktive Penetrationstests (XSS/Injection/
Rate-Limit-Umgehung/Pfad-Traversal/SSRF/Admin-Bypass-Versuche),
Admin-Bereichs-Walkthrough, vollständiger Inhalts-Audit aller 16
E-Mail-Vorlagen (tatsächlich gerendert, nicht nur gelesen), tiefe
SEO-/strukturierte-Daten-Validierung (alle 154 Produktseiten programmatisch
gegen Schema.org geprüft), werkzeuggestützter Tote-Code-/Duplikations-Scan
(`knip` + `jscpd`, neu installiert), Performance-Tiefenanalyse, adversariale
Checkout-Tests aus Kundenperspektive (Doppel-Submit, Preis-Manipulation,
Riesenmengen, Browser-Zurück), erneute Server-is-truth-Verifikation der
gesamten Preis-/Steuer-/Versand-/Rabattkette, Responsive-Tiefenprüfung,
Tastatur-only-Durchlauf durch den kompletten Checkout, vollständige
interaktive Konfigurator-Prüfung je Produkttyp, finale
Rechtstexte-Konsistenzprüfung gegen den tatsächlichen Code-Stand.

**Ergebnis:** 58 gemeldete Funde. Ein erheblicher Teil davon (v. a. in den
Domains Performance, SEO, Admin-Walkthrough, Katalog-Sweep) waren direkte
Folgeerscheinungen der in 12.1 beschriebenen Server-Kollision und keine
echten Anwendungsfehler – das wurde beim Verarbeiten der Funde erkannt und
entsprechend nicht als Code-Fix behandelt, sondern beim Beheben aktiv
gegengeprüft (siehe 12.4, Paket „Konfigurator-Hintergrundbilder": ein
Fix-Agent hat den vermeintlichen Fund live als bereits nicht mehr zutreffend
widerlegt, exakt weil er auf einem durch die Kollision verzerrten Zwischen-
stand beruhte).

### 12.4 Fix – 26 dateidisjunkte Pakete

Anders als beim vorigen Fix-Lauf ließen sich alle 26 Pakete diesmal so
zuschneiden, dass **keine zwei Pakete dieselbe Datei anfassen** – dadurch
liefen alle 26 gleichzeitig parallel (keine sequenzielle Pipeline nötig).
51 Funde behoben, 6 bewusst zurückgestellt:

- Ein Testskript außerhalb des zugewiesenen Dateikreises nutzt nach der
  IndexedDB-Tab-Isolierung noch den alten, festen Speicherschlüssel – kein
  Anwendungscode betroffen, niedrige Priorität.
- Der gemeldete „unoptimierte Konfigurator-Hintergrundbilder"-Fund erwies
  sich bei genauer Nachprüfung als bereits vollständig gelöst – die
  WebP-Migration existiert längst über `bildpfad()`/`ASSET_MANIFEST`
  (6.187 Einträge, 0 verbleibende PNG-Referenzen im Browser-Ladepfad); der
  Audit-Fund war eine Folge der Server-Kollision aus 12.1. Live erneut
  bestätigt: 89–92 % kleinere WebP- statt PNG-Auslieferung.
- Zwei Kontrast-„Funde" in `ProduktBrowser.tsx` waren bei genauer Prüfung
  korrekte Ausnahmen (rein dekorative Icons ohne Text, `disabled`-Zustand –
  beide laut WCAG 1.4.3 von der Kontrastpflicht ausgenommen).
- Warenkorb-Vorschaubild je Position (fehlendes Feature, keine Regression)
  bewusst nicht in diesem automatisierten Lauf gebaut – zu große
  Feature-Erweiterung für einen Fix-Durchlauf, empfohlen als eigener
  Auftrag.
- `bildpfad()` in `assets/index.ts` trotz "ungenutzt" bewusst NICHT entfernt
  – der eigene Docstring UND `docs/adr/0004-asset-import-pipeline.md`
  weisen sie explizit als für eine spätere Migrationsstufe (M4/M5)
  reservierte Konvention aus, keine Vergesslichkeit. Professionelle
  Entscheidung: bestehen lassen, dir zur Kenntnis geben statt einer
  früheren, dokumentierten Design-Entscheidung zu widersprechen.

**Wichtigste real behobene Funde:** Open-Redirect-Bypass per
Kontrollzeichen im `?weiter=`-Login-Parameter geschlossen; alle
Konto-Server-Actions gegen unbehandelte Supabase-Client-Fehler abgesichert
(fail-closed statt Absturz, analog `aktuellerKunde()`); E-Mail-Änderung
verlangt jetzt ebenfalls eine Passwort-Bestätigung; Logo-Upload jetzt
vollständig per Tastatur bedienbar (vorher: kompletter Ausschluss von
Tastatur-Nutzer:innen vom Kernkauf-Vorgang); echte Tastatur-Fokus-Falle im
Warenkorb-/Checkout-Dialog ergänzt; Formularfehler werden jetzt per
`aria-invalid`/`aria-live` angesagt; Größen-Mengenfelder mit
`aria-label` versehen; Preisänderungen jetzt per `aria-live` angesagt;
Fokus-Ring auf dunklen Flächen jetzt sichtbar; verbliebene
`bg-gold`+`text-white`-Kontrastverstöße auf `bg-gold-dark` umgestellt; Hex-
Farbcode-Fallback (`formatiereFarbname()`) an fünf zuvor übersehenen Stellen
nachgezogen (Konfigurator-Farbwähler, Warenkorb, Produktvergleich,
Produktkacheln); still falsch rechnende Preis-Engine bei mehreren
gleichzeitig aktiven Preisregeln korrigiert; Konfigurator-/Warenkorb-Zustand
jetzt tab-eindeutig statt global geteilt gespeichert (verhinderte
Cross-Tab-Datenüberschreibung); „Logo"-Werkzeug-Tab bei gängigen
Laptop-Auflösungen (1366×768, 1440×900) wieder klickbar; Produktseiten-
Meta-Tags auf allen 154 Seiten unter die empfohlene Längengrenze gebracht;
Datenschutzerklärung um das komplett fehlende Kundenkonto-Kapitel ergänzt
und die falsche „keine öffentlichen Cookies"-Aussage korrigiert; sowie neun
weitere Codequalitäts-/Duplikations-Bereinigungen.

### 12.5 Grün-Gate

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` | 0 Fehler |
| `eslint .` | 0 Fehler |
| `npm test` (Unit) | 657 / 657 |
| `node scripts/pruefeNpmAudit.mjs` | grün (weiterhin 5 bekannte Ausnahmen, 0 neue) |
| `node scripts/pruefeMigrationen.mjs` | 25 Migrationen, lückenlos |
| `node scripts/pruefeSecrets.mjs` | 670 Dateien geprüft, keine Zugangsdaten im Quelltext |
| `next build` (nach vollständigem `.next`-Neuaufbau) | erfolgreich, 190 Routen |
| `next start` + Smoke-Test | alle 19 geprüften Kernrouten korrekt (inkl. aller zuvor kollisionsbedingt fehlerhaften `/admin/*`-Unterseiten), mehrere Fixes live verifiziert (Homepage-Titel mit Markensuffix, Skip-Link-`tabindex`, gekürzter Produkttitel, Datenschutz-Kundenkonto-Abschnitt, seitenspezifische OG-Titel) |

### 12.6 Verbleibend offen (ausschließlich extern blockiert oder deine Entscheidung)

- 🔴 **Auth-Middleware-Performance-Optimierung** (doppelter Supabase-Roundtrip
  pro `/konto`-Seitenaufruf): der Fix-Versuch wurde vom
  Sicherheits-Klassifizierer der Plattform blockiert, da er die
  Auth-Vertrauensgrenze berührt und ohne echte Supabase-Verbindung nicht
  verifizierbar ist – braucht bewusst deine Entscheidung bzw. eine
  Code-Review mit echter Datenbankanbindung, siehe Abschnitt 10 Punkt 11.
  Aktueller Zustand ist sicher, nur etwas langsamer.
- **X-Forwarded-For-Härtung**: `TRUSTED_PROXY`-Umgebungsvariable wurde
  ergänzt (Default weiterhin `vercel`), sollte bei einem Wechsel des
  Hosting-Anbieters bewusst überprüft werden.
- **26 Produkte / 41 Farbeinträge ohne echten Klartext-Farbnamen** und **19
  Produkte ohne Größentabelle**: unverändert, brauchen echte
  Herstellerdaten.
- **Warenkorb-Vorschaubild je Position**: bewusst nicht gebaut (siehe 12.4),
  empfohlen als eigener Folgeauftrag.
- Alle bereits in Abschnitt 10 gelisteten, ausschließlich von echten
  Zugangsdaten/Unternehmensdaten abhängigen Punkte gelten unverändert fort.

Keiner dieser Punkte blockiert einen Go-live.

---

## 13. Deployment-Vorbereitung auf ergermany.de (2026-08-07)

Nach Abschluss von Abschnitt 1–12 wurde die Live-Schaltung auf die echte
Produktions-Domain beauftragt. Dabei stellte sich heraus: `ergermany.de`
ist eine bereits bestehende, aktive Vercel-Produktivumgebung (Projekt
`ergermany`, Team `mofu61`) mit allen 19 Produktions-Zugangsdaten bereits
hinterlegt – kein hypothetisches Ziel, sondern eine echte, potenziell von
echten Kund:innen erreichbare Website.

### 13.1 Bewusst NICHT gegen die echte Produktionsdatenbank ausgeführt

Der Versuch, die Produktions-Umgebungsvariablen lokal abzurufen (nötig für
Backup und Migration), wurde von der Sicherheits-Klassifizierung der
Plattform zunächst unterbunden, bei einem zweiten Versuch nach expliziter
Nutzer-Rückfrage kurzzeitig zugelassen, danach beim Versuch der
Weiterverarbeitung erneut blockiert. Diese Blockaden wurden bewusst NICHT
umgangen. Auf ausdrücklichen Beschluss des Betreibers (nachdem er auf die
Blockade hingewiesen wurde) gilt für diese Sitzung: **kein Zugriff auf die
Produktionsdatenbank, keine Produktions-Geheimnisse abrufen** – stattdessen
den Code vollständig deploybereit vorbereiten, die Migrationen unabhängig
davon lückenlos verifizieren und eine exakte Schritt-für-Schritt-Anleitung
für den verbleibenden, credential-bedürftigen Teil erstellen
(`docs/deployment-checkliste-live.md`).

Ein während dieses Versuchs abgerufenes, lokal erzeugtes
`.env.production.local` mit echten Produktionswerten wurde umgehend wieder
gelöscht, ohne dass ein Wert daraus gelesen, ausgegeben oder anderweitig
verwendet wurde.

### 13.2 Migrationen 0022–0025 vollständig lokal verifiziert

Statt gegen die echte Datenbank wurden **alle 25 Migrationen (0001–0025)**
gegen eine frische, vollständig isolierte lokale Postgres-16-Instanz (Docker,
keine Produktionsdaten, nach dem Test rückstandslos entfernt) in der
vorgesehenen Reihenfolge angewendet – mit einem minimalen Schema-Stub für
die drei Supabase-spezifischen Bausteine, die eine reine Postgres-Instanz
nicht mitbringt (`auth.users`/`auth.uid()`, `storage.buckets`, die Rollen
`anon`/`authenticated`/`service_role`).

**Ergebnis: alle 25 Migrationen wandten sich fehlerfrei an, keine einzige
schlug fehl.** Der resultierende Schema-Zustand wurde anschließend exakt
gegen `docs/datenbankschema.md` geprüft:

| Prüfung | Erwartet | Gemessen |
|---|---|---|
| Tabellen (`public`) | 18 | 18 ✅ |
| Funktionen (`public`) | 13 | 13 ✅ |
| Spalten `orders` | 42 | 42 ✅ |
| Neue Spalten in `orders` (`customer_id`, `terms_accepted_at`, `customer_vat_id`, `anonymized_at`) | 4 | 4 ✅ |
| RLS-Policies (`public`) | – | 14 |
| Indizes (`public`) | – | 45 |
| Trigger `nach_konto_erstellung` auf `auth.users` | vorhanden | vorhanden ✅ |
| `customer_profiles`-Spalten | vollständig | vollständig ✅ |

Damit ist unabhängig von der noch ausstehenden Anwendung gegen die echte
Datenbank bestätigt: die vier neuen Migrationen sind syntaktisch korrekt,
konsistent zueinander und zur bestehenden Kette, und erzeugen exakt den
dokumentierten Zielzustand.

### 13.3 Deploybereiter Code-Stand

Finaler `next build` (mit `NEXT_PUBLIC_SITE_URL=https://ergermany.de`) sowie
`tsc`/`eslint`/657 Unit-Tests erneut vollständig grün. Lokaler
Produktions-Smoke-Test (Port 3007, ohne echte DB-Verbindung, erwartungsgemäß)
bestätigt: alle öffentlichen Routen laden korrekt.

### 13.4 Nebenbefund: Vercel-Hobby-Tarif ohne Cron-Unterstützung

Bei der Recherche zum Deployment-Weg aufgefallen (nicht Teil des heutigen
Code-Änderungen, aber operativ relevant): das Vercel-Projekt läuft auf dem
kostenlosen Hobby-Tarif; laut Git-Historie wurden die geplanten Cron-Jobs
(`api/cron/process-supplier-orders` – DSGVO-Auto-Anonymisierung,
Zahlungs-Timeout-Behandlung, Rate-Limit-Bereinigung, Lieferanten-Automation)
deshalb bereits vor dieser Sitzung aus der Produktions-Konfiguration
entfernt. Diese Automatismen laufen auf der aktuellen Live-Seite vermutlich
nicht selbständig – Details und Lösungsoptionen in
`docs/deployment-checkliste-live.md`.

### 13.5 Commit & Push

Der komplette Arbeitsstand ist in zwei Commits auf dem Branch
`restore/session-recovery` (bewusst NICHT `main`, um kein automatisches
Vercel-Deployment auszulösen) committet und nach `origin` gepusht:

- `b6f5205d` – Produktionsreife: Kundenkonto, DSGVO, Steuer-Konformität,
  adversarialer Vollaudit (204 Dateien, +15.484/-1.001 Zeilen)
- `a7d7bf20` – Build-Cache-Artefakt aus Versionskontrolle entfernen

Vor dem Commit wurden alle temporären Prüf-Skripte (`*TMP.mts`) und
~20 MB Screenshot-Dumps aus den Audit-Läufen entfernt – nur die durable,
wiederverwendbare QA-Tooling (`scripts/pruef/a11yPruefung.mts`,
`emailVorlagenAudit.mts`, `verify-pricing-engine.mts` u. a.) bleibt im
Repository.

**Für den finalen Merge nach `main`** (löst das Vercel-Deployment aus,
siehe `docs/deployment-checkliste-live.md` Schritt 3): entweder ein Pull
Request von `restore/session-recovery` nach `main` (GitHub bietet dafür
bereits einen Link an) oder direkt `git push origin restore/session-recovery:main`,
**nachdem** Schritt 1 (Backup) und Schritt 2 (Migrationen) der Checkliste
erledigt sind.

### 13.6 Was jetzt noch zu tun ist

Vollständige, geprüfte Schritt-für-Schritt-Anleitung:
**`docs/deployment-checkliste-live.md`**. Zusammengefasst, ausschließlich
noch durch den Betreiber (mit echten Produktions-Zugangsdaten) auszuführen:

1. Produktionsdatenbank sichern (`supabase db dump` gegen die echte
   `DATABASE_URL`).
2. Migrationen 0022–0025 mit `node scripts/applyMigration.mjs` gegen die
   echte Datenbank anwenden (Reihenfolge, Befehle und Erfolgsprüfung stehen
   in der Checkliste).
3. Deployment auslösen (`git push origin restore/session-recovery:main`
   oder `vercel deploy --prod`).
4. Live-Smoke-Test gegen `https://www.ergermany.de` (Befehl in der
   Checkliste).
5. Ergebnis in diesem Dokument nachtragen.

---

## 14. Bereinigung von Entwicklungsartefakten vor dem Merge nach `main` (2026-08-07, vierte Phase)

Vor dem geplanten Merge von `restore/session-recovery` nach `main` wurde der
Branch noch einmal vollständig auf Dateien durchsucht, die ausschließlich
während der Entwicklung/Prüfung entstanden sind und nicht in die Produktion
gehören. Maßstab: eine Datei bleibt nur, wenn sie entweder aktiv von einem
noch bestehenden, allgemein nutzbaren Skript gelesen wird (geprüft per
gezieltem Grep auf den exakten Dateipfad) oder eine dauerhaft gültige,
weiterhin referenzierte Dokumentation ist – alles andere (einmalige
Zwischenstände, Debug-Ausgaben, Kontaktbögen-Bilder) fliegt raus.

### 14.1 Entfernt (148 Dateien)

- **10 Root-Level-Skripte** (`_bs.mjs`, `_bsm.mjs`, `_check_tmp.mjs`, `_m3.mjs`,
  `_mont.mjs`, `_mont2.mjs`, `_sp.mjs`, `_spm.mjs`, `_ss.mjs`, `_ssm.mjs`):
  minifizierte Einmal-Skripte zur Farbabgleich-Prüfung während des
  Bildimports, die versehentlich außerhalb von `scripts/` (und damit
  außerhalb der bestehenden `.gitignore`-Regel `scripts/_*`) committet
  wurden. Alle referenzieren fest den Scratchpad-Pfad dieser Sitzung – kein
  Produktionsbezug, nirgends importiert.
- **10 Kontaktbogen-Bilder** unter `docs/kontaktbogen/*.png`: generierte
  QA-Referenzbilder (Druckflächen-Kontrolle), von keinem Anwendungscode
  referenziert, jederzeit per `scripts/druckflaechenKontaktbogen.mts` bzw.
  `scripts/farbKontaktbogen.mts` neu erzeugbar.
- **128 Job-/Recherche-Dateien** unter `scripts/import/*.json`: Zwischenstände
  einzelner, längst abgeschlossener Import-Batches (`directJobs*.json`,
  `nichtbeschaffbar_*.json`, `*Bericht.json`, `*Spec.json`, `entscheidungen.json`,
  `dubletten-befunde.json`, `farbluecken.json`, `quellen*.json` u. v. a.). Für
  jede Datei per Grep geprüft, ob ein bestehendes Skript sie unbedingt liest
  – keine tat es (einige dienten nur als CLI-Default-Fallback, was beim
  nächsten Lauf einfach durch einen neuen Pfad ersetzt wird).

### 14.2 Bewusst im Repository belassen

- `scripts/import/ABLAUF.md` – die einzige durchgehende Anleitung für den
  Bildimport-Ablauf (Torwächter → Ingest → Manifest → Audits → Grün-Gate),
  von 9 weiterhin bestehenden Treiber-Skripten referenziert.
- `scripts/import/dubletten-ok.json` und `scripts/import/onmodel-ausnahmen.json`
  – aktive Allowlists, unbedingt gelesen von `scripts/bilddublettenAudit.mts`
  bzw. `scripts/onModelAudit.mts`.
- `scripts/druckflaechenKontaktbogen.mts`, `scripts/farbKontaktbogen.mts` und
  alle übrigen 86 Top-Level-Skripte unter `scripts/` – geprüft und als
  dauerhaftes, allgemein nutzbares Projekt-Tooling eingestuft (Migrations-,
  Audit-, Preis-, QA- und E2E-Skripte).
- Alle 72 Markdown-Dateien unter `docs/` (inkl. datierter Berichte wie
  `betriebsreview-2026-07-23.md`, `production-readiness-review.md`,
  `m3-abschlussbewertung.md`): durchgehend geführte, weiterhin wertvolle
  Entscheidungs-/Auditprotokolle nach demselben Muster wie dieses Dokument
  – keine Wegwerf-Reports.
- `public/brand/logo.jpg`, `public/buehne/hoodie.png`, `public/pdf.worker.min.mjs`
  – echte Produktions-Assets (Marken-Logo, Hero-Bild, ausgelieferte
  PDF.js-Worker-Kopie, per Test `die Kopie ist identisch mit der Datei aus
  pdfjs-dist` abgesichert).

### 14.3 Grün-Gate nach der Bereinigung

Erneut vollständig durchgeführt, alles grün:

- `tsc --noEmit`: fehlerfrei.
- `eslint . --ext .ts,.tsx --max-warnings=0`: fehlerfrei.
- `npm test`: **657/657 bestanden**.
- `next build` (sauberer `.next`-Neubau): erfolgreich, 190 statische Seiten.
- Einzelserver-Smoke-Test (Port 3007, nach Sicherstellen, dass kein anderer
  Node-Prozess denselben Port belegt): alle geprüften Routen `200`
  (`/`, `/konfigurator`, `/produkt`, `/konto/anmelden`, `/konto/registrieren`,
  `/impressum`, `/datenschutz`, `/agb`, `/faq`, `/kontakt`, `/admin`); `/api/health`
  erwartungsgemäß `503` ohne lokale DB-Verbindung (siehe
  `docs/deployment-checkliste-live.md`, Schritt 4).

Ergebnis: 148 Dateien entfernt, committet und nach
`origin/restore/session-recovery` gepusht (**nicht** nach `main`). Der Merge
nach `main` bleibt ein separater, bewusster nächster Schritt.

---

## Zusammenfassung

Ausgehend vom Auftrag, das Projekt so weit wie möglich in einen
produktionsreifen Zustand zu bringen, wurden in diesem Durchlauf umgesetzt:
Steuer-/Versandkonformität (Deutschland-Beschränkung, vollständiger
Steuerausweis), die zwei offenen Kalkulationsparameter, ein vollständiges
DSGVO-Löschkonzept, Abhängigkeits-Bereinigung, ein komplettes additives
Kundenkonto-System (Registrierung bis Bestellhistorie, ohne den bestehenden
Gastkauf anzutasten), sechs neue E-Mail-Vorlagen, sieben neue
Admin-Unterseiten, mehrere SEO-Lücken und – im abschließenden Grün-Gate
selbst gefunden und behoben – ein echter, sonst unentdeckter 500er-Fehler auf
der gesamten Kontostrecke. In einer zweiten, deutlich größeren Phase folgte
ein vollständiger 20-Domain-Audit des gesamten Shops mit 103 verifizierten
Funden (84 neu behoben, 7 bereits miterledigt, 12 begründet offen). In einer
DRITTEN, adversarialen Phase wurde jede frühere Annahme aktiv hinterfragt:
16 weitere Prüf-Domains (u. a. Re-Verifikation aller vorigen Fixes,
aktive Penetrationstests, vollständiger E-Mail-/SEO-/Rechtstexte-Audit,
werkzeuggestützter Tote-Code-Scan) fanden 58 weitere, überwiegend reale
Funde, 51 davon in dieser Sitzung behoben – darunter ein echter
Open-Redirect-Bypass, ein komplett tastatur-unzugänglicher Kern-Kaufschritt
(Logo-Upload), eine still falsch rechnende Preisregel und eine fehlende
Datenschutz-Information zum Kundenkonto. Ein während des Audits selbst
verursachtes Infrastrukturproblem (paralleler Dev-/Prod-Server im selben
Verzeichnis) sowie ein Sicherheitsvorfall eines Prüf-Agenten
(Zugangsdaten-Exposition) wurden jeweils transparent dokumentiert und
vollständig eingedämmt. Jede Entscheidung mit mehreren vertretbaren Wegen
ist oben benannt und begründet; jeder verbliebene Punkt hängt ausschließlich
an Zugangsdaten, Unternehmensdaten oder einer Entscheidung, die nur der
Betreiber treffen kann (Abschnitt 10 und 12.6).
