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
