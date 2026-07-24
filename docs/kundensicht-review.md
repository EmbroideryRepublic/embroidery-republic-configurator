# Kundensicht-Review — Embroidery Republic Germany

Stand: Juli 2026. Perspektive: echte:r Kund:in (B2B, Firmenbekleidung), der/die
zum ersten Mal auf der Seite landet und eine bedruckte/bestickte Bestellung
aufgeben möchte. Bewertet wurde die live laufende App (Konfigurator-Startseite,
Produktauswahl, Warenkorb, Checkout, Anfrage, Info-/Rechtsseiten). Ziel: konkrete
Verbesserungen mit echtem Mehrwert für Bedienbarkeit, Verständlichkeit und
Professionalität – keine technischen Änderungen um ihrer selbst willen.

## Gesamteindruck

Der Shop macht als **One-Page-Konfigurator** einen durchdachten, professionellen
Eindruck: klare B2B-Positionierung („Ihre Firmenbekleidung – in wenigen Minuten
konfiguriert"), 43 Produkte über 10 Marken mit Suche, Marken-Filter, Favoriten,
Vergleich und Preis-Slider; ein Live-Konfigurator mit Echtzeit-Preis inkl.
erklärter Mengenrabatt-Staffel; DE/EN-Umschaltung; saubere Trennung von
verbindlicher Bestellung und unverbindlicher Anfrage. Keine JavaScript-Fehler in
der Konsole. Besonders positiv: die Info-/Rechtsseiten arbeiten mit **ehrlichen
Platzhaltern** statt erfundenen Firmendaten, und die Bestellmenge (ab 1 Stück)
wird beim Warenkorb sauber erzwungen.

Die wichtigsten Baustellen betreffen nicht die Technik, sondern die **Ehrlichkeit
und Vollständigkeit des Kaufabschlusses** (Zahlung, Versand) und **echte
Inhalte** (Firmendaten, Kontaktweg).

## Befunde nach Priorität

### 🔴 Hoch — vor Go-Live zwingend

**H1 — Checkout bot Kreditkarte & PayPal an, ohne dass eine Zahlung
stattfand.** ✅ **GELÖST.**
`CartDrawer.tsx` zeigte drei Zahlungsarten (Karte Standard, PayPal, Rechnung),
obwohl keine Zahlungsabwicklung angebunden ist (Stripe pausiert). Wer „Karte"
wählte, bekam eine Bestätigung ohne Zahlung, und der Lieferanten-Handoff wurde
nicht ausgelöst (nur `invoice` tut das).
- *Umgesetzt (Entscheidung: nur Rechnung):* Karte/PayPal ausgeblendet, `invoice`
  fest übermittelt, Auswahl-UI durch einen statischen Rechnungs-Hinweis ersetzt;
  Button „Jetzt kaufen" → „Zahlungspflichtig bestellen"; Bestätigungstext
  kommuniziert jetzt, dass die Rechnung separat mit der Auftragsbearbeitung folgt.
  Die `paymentMethod`-Union und die serverseitige Verarbeitung von Karte/PayPal
  bleiben unverändert erhalten → später ohne Umbau reaktivierbar (Stripe-ready).

**H2 — Impressum/Datenschutz/AGB enthalten Platzhalter statt echter Firmendaten.**
`impressum/page.tsx` u.a.: Struktur ist korrekt (§5 TMG), aber Adresse,
Vertretung, USt-IdNr., Registereintrag etc. sind `[Platzhalter]`. Ein Live-Shop
ohne vollständiges Impressum verstößt gegen die Impressumspflicht (abmahnfähig).
- *Empfehlung:* Echte Firmendaten einsetzen; AGB/Datenschutz einmal juristisch
  prüfen lassen (kann ich nicht rechtsverbindlich erfinden).
- *Status:* **Firmendaten nötig** (von dir).

### 🟡 Mittel — spürbar für den Kunden

**M1 — Versandkosten: Anspruch und Kasse widersprechen sich.**
Der Warenkorb verspricht „zzgl. Versand, kostenlos ab 75 €" bzw. „noch X € bis
kostenloser Versand" (`CartDrawer.tsx` Z.148–153). Die Checkout-Gesamtsumme
**addiert jedoch nie Versandkosten** – auch bei Bestellungen unter 75 €. Der
Kunde erwartet also einen Versandaufschlag, der nie erscheint (oder der später
auf der Rechnung überraschend auftaucht).
- *Empfehlung:* Versandpolitik festlegen (Pauschale? Ab wann frei?), dann
  entweder eine echte Versandzeile im Checkout ergänzen **oder** die Copy auf die
  Realität anpassen (z. B. „Versand wird auf der Rechnung ausgewiesen").
- *Status:* **Entscheidung/Daten nötig** (echte Versandkonditionen).

**M2 — Kontaktseite war eine Sackgasse.** ✅ **GELÖST** (Kontaktdaten offen).
`kontakt/page.tsx` hatte nur Platzhalter und den Hinweis „Formular folgt".
- *Umgesetzt:* Vollwertiges, schlankes Kontaktformular (Name, E-Mail, Betreff
  optional, Nachricht) über die bestehende Resend-Infrastruktur – neues Template
  `ContactMessageEmail`, Wrapper `contactEmails.tsx`, Server-Action
  `contact.ts` (Honeypot + best-effort In-Memory-Rate-Limit pro IP +
  serverseitige Validierung, Reply-To = Absender), Client-Formular
  `ContactForm.tsx` (Inline-Validierung, Fehlermeldungen, Erfolgs-State,
  responsive im Marken-Look). Keine neue Infrastruktur.
- *Offen:* echte Kontaktdaten (E-Mail/Telefon/Anschrift) im „Direkter
  Kontakt"-Block.

**M3 — „Über uns" ist inhaltlich leer.**
Bewusst allgemeiner Platzhaltertext ohne echte Geschichte/Zahlen/Fotos. Für
Vertrauen im B2B-Verkauf ist genau diese Seite wichtig.
- *Status:* **Inhalt nötig** (Unternehmensgeschichte, ggf. Referenzen/Fotos).

### 🟢 Niedrig — Feinschliff & Professionalität

- **L1 — „Mein Konto"-Button war ein toter Button** (kein Klickverhalten) und
  suggerierte ein nicht existierendes Login. **✅ bereits entfernt** (kein
  Kundenkonto, bewusst).
- **L2 — Werbeaussagen absichern.** Hero/Trust-Bar behaupten u. a. „Made in
  Germany", „Produktion in Deutschland", „Expressproduktion möglich", „ca. 5
  Werktage". Diese Claims müssen der Realität entsprechen (sonst
  Wettbewerbs-/Abmahnrisiko) – bitte gegenprüfen.
- **L3 — Währungsumschalter CHF ohne Live-Kurs.** Tooltip sagt bereits
  „Näherungswert", trotzdem können unrunde CHF-Preise unseriös wirken. Option:
  bis zu einem echten Kurs nur EUR anzeigen.
- **L4 — Button-Beschriftung Kasse.** „Jetzt kaufen" ist grenzwertig zulässig;
  „Zahlungspflichtig bestellen" wäre nach § 312j BGB die eindeutig sichere
  Formulierung (erst relevant, sobald echt bezahlt wird – zusammen mit H1).
- **L5 — Produktbild-Abdeckung.** Sicherstellen, dass jede angebotene Farbe ein
  echtes Foto hat (kein synthetisches Recoloring – bestehende Projektregel); der
  Coverage-Report führt fehlende Ansichten/Farben bereits als offene Aufgaben.

## Was bereits sehr gut ist

- Klare, seriöse B2B-Positionierung und Nutzenkommunikation im Hero/Trust-Bar.
- Konfigurator mit Echtzeit-Vorschau, Zoom, Undo/Redo, Tastenkürzeln, mehreren
  Ansichten und Sperrzonen – für ein Selbstgestaltungs-Tool sehr rund.
- Transparente Preislogik: Live-Preis, sichtbare Mengenrabatt-Staffel, „du sparst
  X"-Hinweis und aufklappbare Preisdetails mit Erklär-Tooltips.
- Saubere Trennung „verbindlich kaufen" vs. „unverbindlich anfragen".
- Keine Mindestbestellmenge mehr (Stand Juli 2026): Einzelstücke sind möglich; die Wirtschaftlichkeit kleiner Mengen wird über einmalige Rüstkosten abgebildet.
- Ehrlichkeit: Platzhalter statt erfundener Firmen-/Rechtsdaten.

## Offene Entscheidungen / Daten

- ~~Zahlungsarten im Checkout (H1)~~ → **erledigt: nur Rechnung bis Stripe.**
- ~~Kontaktformular bauen (M2)~~ → **erledigt.**
- **Versandkonditionen** – Pauschale/Frei-ab-Grenze, und ob im Checkout
  ausgewiesen oder erst auf der Rechnung. (M1, offen – Entscheidung/Daten)
- **Echte Firmen-/Rechts-/Kontaktdaten** für Impressum, Datenschutz, AGB, Über
  uns, Kontakt. (H2, M2, M3 – Daten von dir)

## Reine Inhalts-/Datenaufgaben (kein Code, von dir)

- Firmenanschrift, Vertretung, USt-IdNr., Handelsregister, Kontakt-E-Mail/-Telefon.
- Unternehmensgeschichte + ggf. Referenzen/Fotos für „Über uns".
- Bestätigung der Werbeaussagen (Produktionsort, Lieferzeiten, Express).
- Echte Verkaufs-/Einkaufspreise und Versandkonditionen.
