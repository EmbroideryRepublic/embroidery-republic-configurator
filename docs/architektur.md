# Architektur

Tech-Stack, Schichtenmodell, Ordnerstruktur und die tragenden Prinzipien.
Stand 2026-08-07.

Einstieg: [README.md](README.md). Der Weg einer Bestellung:
[bestellablauf.md](bestellablauf.md).

---

## 1. Tech-Stack

| Bereich | Technologie | Anmerkung |
|---|---|---|
| Framework | Next.js 14, App Router | Server Actions statt eigener API-Schicht |
| Sprache | TypeScript, strict | Ziel ES2017 |
| UI | React 18, Tailwind CSS | |
| 2D-Canvas | Konva.js + react-konva | der Konfigurator |
| Datenbank & Storage | Supabase (Postgres) | Zugriff serverseitig über Service-Role |
| Kundenkonto-Auth | Supabase Auth | additiv zum Gastkauf; `middleware.ts` frischt nur `/konto/*` und `/auth/*` auf, macht selbst keine Redirects; eigene gebrandete E-Mails (Resend) statt Supabase-Standardmails |
| E-Mail | Resend | Bestätigungen, interne Benachrichtigung |
| Zustand (Client) | Zustand | nur der Konfigurator-State |
| PDF | pdf-lib / Canvas | Produktionsblatt, Druckvorschauen |
| Tests | `node:test` + `tsx`, Playwright | Unit + E2E |

Es gibt **kein** Zod (Validierung ist handgeschrieben, siehe Audit M3),
**kein** Redis und **kein** Sentry – beide bewusst vermieden, weil sie ein
neues Konto erforderten. Die frühere `ARCHITECTURE.md` nannte einige davon;
maßgeblich ist dieses Dokument.

---

## 2. Das Schichtenmodell

Die wichtigste Regel des Projekts: **Reine Logik kennt keine Datenbank.**

```
  config/            REINE Regeln und Daten. Keine DB, keine Nebenwirkungen.
    pricing/           Kalkulation, Steuer, Einkaufspreise
    products/          Produktkatalog je Marke
    orderStatus.ts     Statusübergänge als reine Funktion
        │
        │  wird verwendet von
        ▼
  lib/               GESCHÄFTSLOGIK. Liest und schreibt Zustand.
    pricing/           serverautoritative Preisberechnung (Pipeline)
    orders/            Bestellzustand, Zahlungszustand, Abschluss
    payments/          Port + Adapter (rein), keine DB
    security/          Rate-Limit
    admin/             Authentifizierung
    observability/     Logging, Ereignisse, Kontext
    suppliers/         Lieferanten-Lebenszyklus
    supabase/          DB- und Storage-Zugriff
        │
        │  wird aufgerufen von
        ▼
  app/               EINSTIEGSPUNKTE. Server Actions, Routen, Seiten.
    api/               Webhooks, Cron, Health
    admin/             geschützter Adminbereich
    produkt/, kontakt/ …
```

Die Trennung ist an mehreren Stellen als **Muster** verankert:

```
config/orderStatus.ts   (rein)  ←→  lib/orders/orderService.ts    (Zustand)
config/pricing/*        (rein)  ←→  lib/orders/paymentService.ts  (Zustand)
lib/payments/*          (rein)  ←→  lib/orders/paymentService.ts  (Zustand)
```

Sobald etwas Zustand liest oder schreibt, gehört es in `lib/`, nie in
`config/`. Architekturtests erzwingen das – siehe
[geschaeftsarchitektur.md](geschaeftsarchitektur.md).

---

## 3. Ordnerstruktur

```
src/
  app/
    api/
      webhooks/[anbieter]/   EINE dynamische Route für alle Zahlungsanbieter
      cron/process-supplier-orders/   Lieferantenlauf + Wartung
      health/                Health-Check
    admin/                   geschützt über das Layout-Gate
    konto/                   Kundenkonto: Profil, Adressbuch, Bestellhistorie
    auth/callback/           PKCE-Callback für Supabase Auth
    produkt/[slug]/          öffentliche Produktseiten
    kontakt/, agb/, impressum/, datenschutz/, faq/, ueber-uns/
  components/
    configurator/            Konva-Canvas, Werkzeugleiste, Logo-Upload
    admin/, layout/, ui/
  config/                    REINE Schicht (siehe oben)
  lib/                       GESCHÄFTSLOGIK (siehe oben)
  stores/                    Zustand-Stores (Konfigurator, Sprache)
  types/                     gemeinsame Typen
  middleware.ts              Kundenkonto-Sitzungsauffrischung, nur /konto/* und /auth/*
supabase/migrations/         0001 … 0024, fortlaufend
scripts/                     E2E-Läufe, Prüf- und Auswertungswerkzeuge
docs/                        diese Dokumentation
```

Das Kundenkonto-System (`app/konto/`, `app/auth/`, `src/middleware.ts`) ist
**additiv** zum bestehenden Gastkauf – ein Gast bestellt weiterhin ohne
Konto. Authentifizierung läuft über Supabase Auth (`admin.generateLink()` +
PKCE-Callback unter `/auth/callback`), aber mit eigenen gebrandeten E-Mails
über Resend statt der Supabase-Standardmails.

### Die größten Dateien und was sie tun

| Datei | Zeilen | Rolle |
|---|---|---|
| `config/products/fruitOfTheLoom.ts` | ~1035 | Produktdaten einer Marke |
| `components/configurator/ConfiguratorCanvas.tsx` | ~1033 | der Konva-Canvas |
| `lib/actions/orders.ts` | ~560 | der gesamte Bestellvorgang |
| `config/pricing/selbstkosten.ts` | ~520 | die Kalkulationskette |

---

## 4. Die tragenden Prinzipien

### 4a. Der Server ist die einzige Wahrheit

Der vom Client gemeldete Preis (`CartItem.unitPrice`) wird **nie**
übernommen. `lib/pricing/serverPricing.ts` berechnet jeden Preis neu aus
Katalogdaten und Konfiguration. Ein Test (`architektur.test.ts`) manipuliert
den Client-Preis und weist nach, dass das Ergebnis unverändert bleibt.

Dasselbe gilt für Menge (aus den Größen-Mengen, nicht aus dem
`quantity`-Feld) und Steuer (aus `config/pricing/steuer.ts`, nie aus einer
Client-Angabe).

### 4b. Fail-fast statt stiller Annahmen

Kein hinterlegter Versandtarif, Steuersatz, DTF-Bogenpreis oder
Einkaufspreis führt zu einer Fehlermeldung, nie zu einem Ausweichwert. In
Entwicklung und Test wird geworfen, in Produktion wird die betroffene
Berechnung als „nicht belastbar" markiert – aber niemals stillschweigend mit
einer geratenen Zahl weitergerechnet.

### 4c. Eine Berechnung, ein Ort (keine Doppellogik)

Geld wird ausschließlich über `formatiereGeld()` formatiert. Steuersätze
kennt nur `config/pricing/steuer.ts`. Rate-Limits laufen nur über
`lib/security/rateLimit.ts`. Das Admin-Secret liest nur `lib/admin/auth.ts`.

Erzwungen wird das durch **Wächter-Tests**: Sie durchsuchen den gesamten
Quelltext und schlagen an, sobald eine zweite Stelle dieselbe Aufgabe
übernimmt. Diese Wächter haben sich mehrfach bewährt – zwei schlugen während
laufender Umbauten an und deckten Fehler auf, die tsc und Lint nicht sahen.

### 4d. Phasentrennung im Bestellvorgang

Was zurückrollbar ist, läuft in der Transaktion; was nach außen wirkt
(Uploads, E-Mails, Rendering), davor oder danach. Ausführlich in
[bestellprozess-konsistenz.md](bestellprozess-konsistenz.md).

---

## 5. Datenzugriff

Aller Datenbankzugriff läuft serverseitig über den **Service-Role-Client**
(`lib/supabase/server.ts`), der RLS umgeht. Grund: Die Tabellen haben nur
INSERT-Policies für anonyme Clients; für das `RETURNING` nach einem Insert
bräuchte es eine SELECT-Policy, die Kundendaten offenlegen würde.

Row Level Security ist auf **allen 18 Tabellen** aktiv – als zweite
Verteidigungslinie, falls je der publizierbare Schlüssel verwendet würde.
Schreibzugriff von außen ist damit ausgeschlossen.

---

## 6. Testebenen

| Ebene | Werkzeug | Was |
|---|---|---|
| Unit | `node:test` + `tsx` | 657 Tests, reine Logik + Wächter |
| E2E Serverpfad | `scripts/e2e*.mts` | echter Bestell-, Zahlungs-, Limit-, Auth-Weg gegen die DB |
| Visuell | Playwright | der Konfigurator (der In-App-Browser scheitert am Konva-Canvas) |

Die E2E-Läufe fahren den **echten Serverweg** und fangen nur die äußeren
Wirkungen ab (E-Mail, Dateien, Lieferant). Ein Browsertest allein beweist
nichts – siehe [testmodus-und-abnahme.md](testmodus-und-abnahme.md).

Der „Auth-Weg" in der Tabelle bezieht sich auf das **Admin-System**
(`test:e2e:adminauth`). Für das seither hinzugekommene zweite Auth-System,
das Kundenkonto (Registrierung, Login, Passwort-Reset), gibt es noch **keine
eigene E2E-Suite** – bislang nur Unit-Tests der reinen Logik. Das ist ein
offener Punkt.
