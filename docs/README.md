# Entwicklerdokumentation – Embroidery Republic

Einstiegspunkt in die technische Dokumentation. Stand 2026-07-24.

Diese Seite ist die **Landkarte**. Sie erklärt, was das System ist, wie die
Dokumentation aufgebaut ist und in welcher Reihenfolge man sie liest. Die
eigentliche Tiefe steckt in den verlinkten Einzeldokumenten – jedes behandelt
ein Thema vollständig und begründet die getroffenen Entscheidungen.

---

## Was ist das?

Ein Webshop mit **2D-Live-Konfigurator** für personalisierte Textilien
(T-Shirts, Hoodies, Polos …). Die Kundschaft platziert Logos und Texte auf
einem Kleidungsstück, sieht das Ergebnis sofort, und bestellt. Aus der
Bestellung entstehen automatisch Druckvorschauen, ein Produktionsblatt und –
nach Ablauf der Stornofrist – ein Lieferantenauftrag für das Rohtextil.

Kernzielgruppe sind Firmenkunden ab etwa 15 Stück; Einzelbestellungen sind
ebenfalls möglich. Verkauft wird zunächst ausschließlich in Deutschland.

**Zwei Leitprinzipien ziehen sich durch das ganze System:**

1. **Fail-fast statt stiller Annahmen.** Fehlt ein Versandtarif, ein
   Steuersatz oder ein DTF-Bogenpreis, gibt es eine Fehlermeldung – nie einen
   geratenen Wert. Eine falsche Zahl, die richtig aussieht, ist schlimmer als
   gar keine.

2. **Der Server ist die einzige Wahrheit.** Preise, Mengen und Steuern werden
   serverseitig berechnet; Client-Angaben werden nie übernommen. Tests
   beweisen das.

> **Status Konfigurator: Version 1.0, eingefroren (2026-07-23).** Änderungen am
> Konfigurator nur noch für Bugs, Security, Performance und Browserprobleme –
> keine neuen Features. Der Arbeitsfokus liegt auf dem restlichen Shop
> (Startseite, Produktseiten, Checkout, SEO, Performance, Marketing). Details:
> [konfigurator-logik.md](konfigurator-logik.md).

---

## In fünf Minuten startklar

```bash
npm install
# .env.local anlegen – siehe umgebungsvariablen.md
npm run dev            # Entwicklungsserver auf Port 3007
```

```bash
npx tsc --noEmit       # Typen
npx next lint          # Stil
npm test               # 547 Unit-Tests
```

Vor jeder Auslieferung zusätzlich die E2E-Läufe gegen die echte Datenbank
(siehe [Deployment](deployment.md)):

```bash
npm run test:e2e            # Bestellung über den echten Serverweg
npm run test:e2e:ratelimit
npm run test:e2e:adminauth
```

---

## Lesereihenfolge für neue Entwickler

**Tag 1 – das große Bild:**

1. [architektur.md](architektur.md) – Tech-Stack, Schichten, Ordnerstruktur,
   die tragenden Prinzipien
2. [bestellablauf.md](bestellablauf.md) – der Weg einer Bestellung vom
   Konfigurator bis zur Produktion, Schritt für Schritt
3. [datenbankschema.md](datenbankschema.md) – alle 16 Tabellen und ihre
   Zusammenhänge

**Tag 2 – die Fachlogik:**

4. [kalkulationsmodell.md](kalkulationsmodell.md) – wie aus Kosten ein Preis
   wird
5. [steuerarchitektur.md](steuerarchitektur.md) – Umsatzsteuer, netto/brutto
6. [bestellprozess-konsistenz.md](bestellprozess-konsistenz.md) – warum die
   Bestellung atomar entsteht

**Tag 3 – Sicherheit und Betrieb:**

7. [admin-authentifizierung.md](admin-authentifizierung.md)
8. [rate-limiting.md](rate-limiting.md)
9. [upload-lebenszyklus.md](upload-lebenszyklus.md)
10. [betriebsbeobachtung.md](betriebsbeobachtung.md) – Logging, Monitoring,
    Health, CI

---

## Themenverzeichnis

### Architektur und Ablauf

| Dokument | Inhalt |
|---|---|
| [architektur.md](architektur.md) | Tech-Stack, Schichtenmodell, Ordnerstruktur, Grundprinzipien |
| [bestellablauf.md](bestellablauf.md) | Datenfluss einer Bestellung, Konfigurator → Produktion |
| [datenbankschema.md](datenbankschema.md) | Alle Tabellen, Beziehungen, Migrationshistorie |
| [geschaeftsarchitektur.md](geschaeftsarchitektur.md) | Verbindliches Muster für jede neue Fachfunktion |

### Frontend, Konfigurator und Designsystem

| Dokument | Inhalt |
|---|---|
| [shop-praesentation.md](shop-praesentation.md) | Kundenseitige Shop-Seiten außerhalb des Konfigurators: Seiten, Komponenten, Datenflüsse, Gestaltungssprache, SEO |
| [premium-roadmap.md](premium-roadmap.md) | Größere Vorhaben mit Umsetzungsplan: realistische Druckvorschau, globaler Warenkorb, mobiler Konfigurator-Einstieg |
| [state-management.md](state-management.md) | Die sechs Zustand-Stores, Persistenz, Abonnement-Disziplin, Datenfluss |
| [konfigurator-logik.md](konfigurator-logik.md) | Produktbrowser, Auswahl-Übernahme, geführter Kauf, Vorladen, Canvas cm↔px (**v1.0, eingefroren**) |
| [designsystem.md](designsystem.md) | Farben, Typografie, Radien-Skala, Schatten, Badges, Icons |
| [animationen-und-ux.md](animationen-und-ux.md) | Keyframes, Motion-Regeln, Fokus-Ringe, Reduced-Motion, verbindliche UX-Regeln, Responsivität |
| [coding-standards.md](coding-standards.md) | Benennung, reine Logik + Tests, Verifikationszyklus, Wächter-Tests |
| [erweitern.md](erweitern.md) | Neue Produkte, Kategorien, Druckverfahren, Positionen, Lieferanten anbinden |

### Preis und Steuer

| Dokument | Inhalt |
|---|---|
| [kalkulationsmodell.md](kalkulationsmodell.md) | Selbstkostenkette, DTF-Folienbelegung, Preisstrategie |
| [kalkulationsgrundlage.md](kalkulationsgrundlage.md) | Herkunft der Kostenwerte, offene Punkte |
| [steuerarchitektur.md](steuerarchitektur.md) | Umsatzsteuer als einzige Quelle, netto/brutto, Rundung |
| [sortimentsstrategie.md](sortimentsstrategie.md) | Preismodell, keine Mindestmenge, Rüstkosten |

### Bestellung und Zahlung

| Dokument | Inhalt |
|---|---|
| [bestellprozess-konsistenz.md](bestellprozess-konsistenz.md) | Atomare Bestellung, Race Conditions, vier Phasen |
| [zahlungsarchitektur.md](zahlungsarchitektur.md) | Port/Adapter, Idempotenz, Testanbieter |
| [stripe-review.md](stripe-review.md) | Sicherheitsreview vor der Stripe-Umsetzung |
| [stripe-e2e-nachweis.md](stripe-e2e-nachweis.md) | Nachweis gegen das echte Stripe-Testkonto (31/31) |
| [stripe-adapter-plan.md](stripe-adapter-plan.md) | Zuordnung der Portmethoden zur Stripe-API |

### Sicherheit und Betrieb

| Dokument | Inhalt |
|---|---|
| [admin-authentifizierung.md](admin-authentifizierung.md) | Serverseitige Sitzungen, Secret-Hygiene |
| [rate-limiting.md](rate-limiting.md) | Zentraler Zähler in Postgres, Limits je Endpunkt |
| [upload-lebenszyklus.md](upload-lebenszyklus.md) | Signatur, Größe, Abmessungen, verwaiste Dateien |
| [betriebsbeobachtung.md](betriebsbeobachtung.md) | Logging, Monitoring, Health-Check, CI |
| [umgebungsvariablen.md](umgebungsvariablen.md) | Alle Variablen mit Bedeutung und Pflichtstatus |
| [deployment.md](deployment.md) | Auslieferung, Backup/Restore, Cronjobs |
| [runbook.md](runbook.md) | **Nachschlagewerk im Betrieb**: Störungen, wiederkehrende Aufgaben, Stolperstellen |
| [incident-prozess.md](incident-prozess.md) | Schweregrade, Eindämmen vor Reparieren, Datenschutzvorfall, Nacharbeit |
| [wartung.md](wartung.md) | Turnus, Abhängigkeits-Updates, Bewertung von Sicherheitsmeldungen, Checkliste vor Auslieferung |
| [restore-drill.md](restore-drill.md) | Reproduzierbarer Backup-/Restore-Praxistest (B3) + Prüfskripte |
| [betriebsreview-2026-07-23.md](betriebsreview-2026-07-23.md) | Produktions-/Betriebsreview: Go-live-Blocker B1–B4 + Status |
| [next-upgrade-entscheidung.md](next-upgrade-entscheidung.md) | Next.js-Advisories: Betroffenheit, Upgrade-Versuch, Entscheidung (B4) |
| [filterleiste-konzept.md](filterleiste-konzept.md) | Filterleiste: Datenmodell, Facetten, URL/SEO, Performance, UI (Umsetzung nach Go-live) |

### Lieferanten

| Dokument | Inhalt |
|---|---|
| [lieferanten-architektur.md](lieferanten-architektur.md) | Lebenszyklus einer Lieferantenbestellung |
| [manueller-lieferantenprozess.md](manueller-lieferantenprozess.md) | Der aktuell gelebte manuelle Weg |
| [lieferanten-adapter-leitfaden.md](lieferanten-adapter-leitfaden.md) | Wie ein neuer Lieferant angebunden wird |
| [lieferanten-mapping.md](lieferanten-mapping.md) | Zuordnung Produkt → Lieferantenartikel |

### Prüfung und Freigabe

| Dokument | Inhalt |
|---|---|
| [go-live-checkliste.md](go-live-checkliste.md) | **Aktueller Freigabestand** mit Ampel |
| [audit-produktionsreife.md](audit-produktionsreife.md) | Vollaudit mit allen Befunden |
| [weg-zu-version-1.md](weg-zu-version-1.md) | Leitplan bis Version 1.0 |
| [testmodus-und-abnahme.md](testmodus-und-abnahme.md) | Wie der Testmodus den echten Serverweg fährt |

---

## Die wichtigsten Architekturentscheidungen auf einen Blick

Jede ist im jeweiligen Fachdokument ausführlich begründet. Hier die
Kurzfassung, damit später nachvollziehbar bleibt, *warum*.

| Entscheidung | Grund | Detail in |
|---|---|---|
| **Keine neuen externen Dienste** (kein Redis, kein Sentry) | stehende Projektregel; die vorhandene Postgres-Instanz genügt für die erwartete Last | [rate-limiting.md](rate-limiting.md), [betriebsbeobachtung.md](betriebsbeobachtung.md) |
| **Bestellung in EINER Transaktion** | ohne sie blieb bei einem Teilfehler ein Torso, den die Idempotenz als Erfolg auslieferte | [bestellprozess-konsistenz.md](bestellprozess-konsistenz.md) |
| **Idempotenz über eine WHERE-Bedingung** statt einer Zustandsmaschine | schlicht und korrekt; keine Ereignistabelle nötig | [zahlungsarchitektur.md](zahlungsarchitektur.md) |
| **Preise serverseitig, Client-Werte ignoriert** | Manipulationsschutz; Test beweist die Unabhängigkeit vom Client-Preis | [architektur.md](architektur.md) |
| **Alle Kosten netto, Steuer am Ende** | Vorsteuerabzug; brutto gerundet, weil der Preis dort wirkt, wo er gelesen wird | [steuerarchitektur.md](steuerarchitektur.md) |
| **Sitzungstoken statt Secret im Cookie** | ein Cookie-Leck gäbe sonst das Betriebsgeheimnis preis | [admin-authentifizierung.md](admin-authentifizierung.md) |
| **Wächter-Tests gegen Doppellogik** | verhindern die Erosion, die solche Systeme über Jahre zerstört | [architektur.md](architektur.md) |
| **Migration gilt erst nach Anwenden + Verifizieren** | eine nicht angewendete Migration (0011) hat den Bestellprozess wochenlang gebrochen | [deployment.md](deployment.md) |

---

## Bekannte Einschränkungen

Bewusst getragen, damit sie nicht für Versehen gehalten werden:

- **Stripe ist integriert und im Testmodus nachgewiesen** (31/31 E2E gegen das
  echte Stripe-Testkonto). Für den Live-Betrieb fehlen nur die Live-Schlüssel
  (`sk_live_…`, `whsec_…`) und ein in Stripe registrierter Webhook-Endpunkt auf
  die Produktions-URL; ohne diese läuft Live weiterhin Rechnungskauf. Code-seitig
  sind keine Änderungen mehr nötig. Siehe
  [stripe-e2e-nachweis.md](stripe-e2e-nachweis.md) und [stripe-review.md](stripe-review.md).
- **Der Stichsatz für Stickerei ist unbestätigt** (0,10 € vs. 0,76 €/1,40 €).
  Vor der Preisfreigabe zu klären – [kalkulationsmodell.md](kalkulationsmodell.md).
- **Feste Zeitfenster beim Rate-Limit** lassen an der Fenstergrenze
  kurzzeitig das Doppelte zu – [rate-limiting.md](rate-limiting.md).
- **~100 Protokollaufrufe** außerhalb der kritischen Pfade sind noch nicht
  auf das strukturierte Logging umgestellt – [betriebsbeobachtung.md](betriebsbeobachtung.md).
- **Rate-Limit und Health lassen bei DB-Ausfall durch bzw. sperren aus** –
  die Asymmetrie ist Absicht, siehe [admin-authentifizierung.md](admin-authentifizierung.md).

Der vollständige, priorisierte Stand steht in der
[Go-live-Checkliste](go-live-checkliste.md).
