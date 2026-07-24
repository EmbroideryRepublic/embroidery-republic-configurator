# Roadmap bis zum produktionsreifen System

> **Stand 2026-07-21.** Ab hier liegt der Schwerpunkt auf fachlichen
> Funktionen, nicht auf Architektur. Die bestehende Struktur
> (`docs/geschaeftsarchitektur.md`) wird genutzt, nicht umgangen.
> Architekturänderungen nur noch, wenn eine konkrete Anforderung sie
> erzwingt.

---

## 0. Ist-Stand (geprüft, nicht geschätzt)

**Vorhanden und funktionsfähig**

| Bereich | Stand |
|---|---|
| Konfigurator | 43 Produkte, 4 Ansichten, Logo/Text, Undo, Großansicht, visuell abgenommen |
| Druckflächen | alle Produkte, je Schnittgruppe geprüft |
| Preisberechnung | dreistufige Pipeline, ab 1 Stück, Staffeln, 221 Tests |
| Bestellung | Rechnungskauf, Bestätigungs-E-Mail, Statusverfolgung per Token-Link |
| Adminbereich | Bestellliste, Bestelldetail, Lieferantenkarten, Lieferantenbestellungen |
| E-Mails | Bestätigung, Versand, Stornierung, interne Meldung, Kontakt |
| Lieferanten | needen + textil-grosshandel E2E-getestet; Regelweg aktuell manuell |
| Rechtsseiten | Impressum, AGB, Datenschutz, FAQ, Kontakt vorhanden |
| SEO-Grundlage | `robots.ts`, `sitemap.ts`, OpenGraph-Bild, Produktseiten je Slug |

**Nicht vorhanden**

| Fehlt | Auswirkung |
|---|---|
| **Zahlungsabwicklung** | nur Rechnungskauf – Vorkasse/PayPal/Karte fehlen (`paymentMethod = 'invoice'` fest verdrahtet) |
| **Kundenkonto** | keine Login-/Konto-Route; Wiederbestellung und Bestellhistorie unmöglich |
| **Analytics / Fehler-Monitoring** | kein Einblick in Nutzung und Fehler im Livebetrieb |
| **Eigene Checkout-Seite** | Checkout läuft im Warenkorb-Panel, nicht als indexierbare Seite |
| **Kindergrößen / große Größen** | drei Zielgruppen nicht bedienbar |
| **Produktionsworkflow** | Status existiert, aber keine Arbeitsansicht für die Fertigung |

---

## 1. Priorisierung in vier Phasen

Die Reihenfolge folgt Abhängigkeiten, nicht Wunschdenken. **Phase A ist
zwingend vor jedem Livegang** – die übrigen Phasen sind nach Wirkung sortiert.

```
PHASE A  Go-live-Blocker ......... ohne diese darf der Shop nicht öffnen
   │
PHASE B  Verkaufsfähigkeit ....... damit Kunden zuverlässig kaufen können
   │
PHASE C  Betrieb & Skalierung .... damit Aufträge effizient abgewickelt werden
   │
PHASE D  Wachstum ................ Reichweite, Sortimentsbreite, Auswertung
```

Größenangabe: **S** = überschaubar · **M** = mehrere Arbeitsschritte ·
**L** = eigenes Vorhaben.
Kennzeichnung: 🔒 = braucht **Ihre** Mitwirkung (Konto, Daten, Entscheidung).

---

## PHASE A — Go-live-Blocker

Ohne diese Punkte ist ein Livegang rechtlich oder technisch nicht vertretbar.

| # | Aufgabe | Größe | Abhängigkeit |
|---|---|---|---|
| A1 🔒 | **Echte Firmen- und Rechtsdaten** eintragen: USt-IdNr./Steuernummer im Impressum, Anschrift, Vertretungsberechtigte, Widerrufsbelehrung prüfen | S | Ihre Daten |
| A2 🔒 | **Steuerentscheidung**: Regelbesteuerung oder Kleinunternehmer (§ 19 UStG). Danach `OrderConfig.taxPercent` setzen und Preisanzeige (brutto/netto) festlegen | S | Steuerberatung |
| A3 🔒 | **Produktivumgebung**: Supabase-Projekt, Migrationen 0001–**0012** anwenden, Resend-Domain verifizieren, alle Variablen aus `.env.local.example` setzen. Werkzeug: `node scripts/applyMigration.mjs <datei>` (mit `--dry` als Probelauf) | M | Ihre Konten |
| A4 | **Preisentscheidung umsetzen**: Rüstkosten ja/nein und Höhe, Versandkalkulation neu rechnen (die „÷5 wegen Mindestmenge"-Annahme gilt nicht mehr) | S | A2 |
| A5 | **Rechtssichere Preisangaben**: USt-Hinweis, Versandkostenhinweis, Lieferzeit an jedem Preis (PAngV) | S | A2 |
| A6 | ~~**Bestellabschluss härten**~~ **ERLEDIGT** (siehe Abschnitt 6) – offen bleibt allein das Anwenden von Migration 0011 in A3 | M | – |
| A7 | **Datenschutz vervollständigen**: Auftragsverarbeitung Supabase/Resend, Cookie-/Speicherhinweis für IndexedDB-Nutzung | S | A1 |

**Ergebnis:** rechtlich zulässiger Betrieb mit Rechnungskauf.

---

## PHASE B — Verkaufsfähigkeit

| # | Aufgabe | Größe | Abhängigkeit |
|---|---|---|---|
| B1 🔒 | **Zahlungsabwicklung** (Stripe): Karte, Apple/Google Pay; Rechnungskauf bleibt. `paymentMethod` ist bereits als Union vorbereitet | L | Stripe-Konto |
| B2 | **Checkout als eigene Seite** statt nur im Warenkorb-Panel: Schritt-für-Schritt, unterbrechbar, verlinkbar | M | – |
| B3 | **Zahlungsstatus in Bestellablauf** einhängen: bezahlt/offen/fehlgeschlagen, Mahnlauf-Grundlage | M | B1 |
| B4 | **Rechnungsdokument** als PDF aus den Preisposten erzeugen (`PriceLine` trägt bereits alle Angaben inkl. Steuerzeile) | M | A2, B1 |
| B5 | **Versandabwicklung**: Versandart wählbar, Sendungsnummer erfassen, Versandbenachrichtigung (Vorlage existiert) | M | – |
| B6 | **Upload-Funktionen vervollständigen**: Vektorformate (SVG/PDF) durchgängig, Dateigrößen-Grenzen, klare Fehlermeldungen, Designprüfung durch uns | M | – |

**Ergebnis:** vollständiger Kaufabschluss mit Bezahlung, Rechnung und Versand.

---

## PHASE C — Betrieb & Skalierung

| # | Aufgabe | Größe | Abhängigkeit |
|---|---|---|---|
| C1 | **Produktionsansicht** im Admin: Auftragsliste nach Fertigungsschritt, Druckdatei-Download, Abhaken. Nutzt das Stufenmuster (`ProductionPlan`) | L | – |
| C2 | **Kundenkonto**: Registrierung, Bestellhistorie, gespeicherte Designs, Wiederbestellung | L | A3 |
| C3 | **Lieferantenbestellung** vom manuellen Weg zurück auf Automatik (Adapter sind fertig und getestet) | M | 🔒 Freigabe |
| C4 | **Fehler-Monitoring** (z.B. Sentry) + strukturierte Protokolle | S | 🔒 Konto |
| C5 | **Sicherung & Wiederherstellung**: Backup-Strategie, Wiederanlauf getestet | S | A3 |
| C6 | **Automatisierte Prüfungen vor Auslieferung**: Tests + Typprüfung + Lint in einer Pipeline | S | – |

**Ergebnis:** Aufträge lassen sich in Menge abwickeln, Fehler werden bemerkt.

---

## PHASE D — Wachstum

| # | Aufgabe | Größe | Abhängigkeit |
|---|---|---|---|
| D1 🔒 | **Sortiment ausbauen** nach `docs/produktkatalog-vollstaendig.md`: Sweatshirts, Hoodies, Damenlinie, Westen, Jacken | L | Bildmaterial |
| D2 🔒 | **Kindergrößen und große Größen** – erschließt Kindergärten, Schulen, Vereine, Handwerk. **Kein neuer Produkttyp nötig** | M | Bilder + Maßtabellen |
| D3 | **SEO ausbauen**: strukturierte Daten (Produkt, Preis, Verfügbarkeit), Kategorieseiten, sprechende Texte, interne Verlinkung | M | D1 |
| D4 | **Performance**: Bildauslieferung, Ladezeit des Konfigurators, Kernmetriken messen | M | – |
| D5 🔒 | **Analytics** datenschutzkonform (z.B. Plausible): Trichter vom Konfigurator bis zur Bestellung | S | Konto + A7 |
| D6 | **Bildmaterial vereinheitlichen** – Ärmelaufnahmen und die drei angeschnittenen FOTL-Fotos (`docs/bildmaterial-befund.md`) | M | 🔒 Fotos |
| D7 | **Neue Produkttypen** nach Roadmap R2–R4: Caps, Taschen, Schürzen, Beanies (je eigener Typ **und** eigenes Geometriemodell) | L | D1 |

---

## 2. Kritischer Pfad zum Livegang

Der kürzeste Weg zu einem verkaufsfähigen Shop:

```
A1 ─┐
A2 ─┼─► A4 ─► A5 ─┐
A3 ─┘             ├─► A6 ─► A7 ─► ✅ LIVE (Rechnungskauf)
                  │
                  └─► B1 ─► B3 ─► B4 ─► ✅ LIVE (mit Bezahlung)
```

**Minimaler Livegang** = Phase A vollständig. Der Shop verkauft dann per
Rechnung – funktionsfähig, rechtlich sauber, ohne Zahlungsdienstleister.

**Empfohlener Livegang** = Phase A + B1/B3/B4. Ohne Online-Zahlung springen
Privatkunden erfahrungsgemäß ab, und Privatkunden sind seit dem Wegfall der
Mindestmenge ausdrücklich Zielgruppe.

---

## 3. Was ich brauche, um zu starten

Nach Dringlichkeit geordnet – ohne diese Angaben stockt Phase A:

1. **Firmendaten** für Impressum und Rechnungen (Anschrift, USt-IdNr. bzw.
   Steuernummer, Vertretungsberechtigte).
2. **Steuerentscheidung** (Regelbesteuerung oder § 19 UStG) – bestimmt
   Preisanzeige, Rechnungen und die Steuerzeile in der Pipeline.
3. **Zugänge** für die Produktivumgebung: Supabase-Projekt, verifizierte
   Resend-Domain. Konten müssen Sie anlegen; ich richte alles Weitere ein.
4. **Preisentscheidung**: Rüstkosten ja/nein und Höhe.
5. Später für Phase B: **Stripe-Konto**.

---

## 4. Arbeitsweise ab jetzt

- Neue Funktionen fügen sich in die bestehende Architektur ein: Stufenmuster,
  standardisierte Übergaben, keine doppelte Geschäftslogik.
- Kein Refactoring ohne konkreten Anlass. Die offenen Migrationen M1–M3 aus
  `docs/geschaeftsarchitektur.md` werden **mit** der jeweiligen Funktion
  erledigt, nicht vorher:
  - **M1/M3** zusammen mit der Mengenänderung im Warenkorb (Phase B2)
  - **M2** zusammen mit wählbaren Versandarten (Phase B5)
- Jede fertige Funktion wird wie bisher abgenommen: Typprüfung, Lint, Tests
  und – bei sichtbaren Änderungen – ein Durchlauf im echten Browser.

---

## 5. Empfehlung für den nächsten Schritt

A6 ist abgeschlossen (Abschnitt 6). Der nächste Schritt ohne Ihre Mitwirkung
ist **A5 (rechtssichere Preisangaben)**, soweit er nicht von der
Steuerentscheidung abhängt. Alles Weitere in Phase A braucht die Angaben aus
Abschnitt 3.

---

## 6. A6 – Bestellabschluss härten (erledigt)

### Der schwerwiegendste Fund: die Mindestmenge lebte in der Datenbank

`0001` legte `check (quantity >= 5)` an, `0002` lockerte das nur für
Anfragen. Für echte Bestellungen galt weiterhin eine **Mindestmenge von 5** –
nach der fachlichen Abschaffung der Mindestmenge hätte jede Bestellung über
1–4 Stück den kompletten Checkout durchlaufen und wäre erst beim Speichern
gescheitert. Betroffen wäre ausgerechnet die Zielgruppe, für die die
Mindestmenge abgeschafft wurde.

**Migration `0011` behebt das.** Sie wurde am 2026-07-21 auf die
Entwicklungsdatenbank angewendet und verifiziert (Constraint steht auf
`quantity >= 1`, Bestand unverändert).

> **Lehre daraus:** Zwischen dem Schreiben von 0011 und ihrer Anwendung lag
> der Code bereits produktiv – und schrieb `client_request_id` in eine
> Spalte, die es nicht gab. **Jede Bestellung schlug in dieser Zeit fehl.**
> Eine Migration gilt erst als erledigt, wenn sie angewendet und verifiziert
> ist. Werkzeug dafür: `scripts/applyMigration.mjs`.

### Was jetzt abgesichert ist

| Gefahr | Absicherung |
|---|---|
| Mehrfachklick | Sperre wirkt **sofort** (Ref, nicht Zustand) – ein deaktivierter Knopf allein genügt nicht, weil die Eingabetaste ihn umgeht |
| Doppelte Bestellung nach Abbruch | Absendekennung je Vorgang, unverändert über alle Wiederholungen; überlebt das **Neuladen der Seite** |
| Gleichzeitige Absendung | Eindeutiger Index in der Datenbank (0011) als letzter Schiedsrichter – die Anwendungsprüfung allein hat immer eine Lücke |
| Zeitüberschreitung | Grenze von 60 s, danach eine Meldung, die ausdrücklich sagt, dass erneutes Senden gefahrlos ist |
| Verbindungsabbruch | Als solcher benannt, Eingaben bleiben erhalten, Knopf wieder bedienbar |
| **Unsicherer Preis** | `pricing.blocked` wird jetzt geprüft und die Bestellung abgewiesen – das Feld existierte, wurde aber nie ausgewertet |
| Manipulierte Angaben | Vollständige serverseitige Prüfung gegen den Katalog (`lib/orders/orderValidation.ts`): Produkt, Farbe, Größe, Menge, Motivmaße gegen die Druckfläche |

### Nachweise

- **245 Tests** (vorher 221), davon 21 neue für die Bestellprüfung und 3 für
  die Meldekette blockierter Preise.
- **10/10 Prüfungen im echten Browser**:
  `npx tsx --tsconfig tsconfig.scripts.json scripts/qaBestellabschluss.mts`
  Belegt unter anderem: 3 Klicks → **1** Absendevorgang; dieselbe Kennung
  nach Fehlschlag **und** nach Neuladen der Seite. Das Skript fängt alle
  Absende-Requests im Browser ab und erzeugt deshalb weder eine echte
  Bestellung noch eine E-Mail – es darf gegen eine Umgebung mit echten
  Zugangsdaten laufen.

### Bewusst nicht getan

Die **Position** eines Motivs wird serverseitig nicht nachgerechnet, nur
seine **Größe** gegen die Druckfläche geprüft. Die Größe ist in Zentimetern
eindeutig vergleichbar; die Position hängt am Bildmaßstab der jeweiligen
Ansicht, und der Konfigurator hält sie ohnehin an der Fläche fest. Eine
serverseitige Nachrechnung hätte hier gültige Bestellungen abweisen können.
