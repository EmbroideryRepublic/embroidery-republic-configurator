# Next.js-Advisories: Analyse und Entscheidung (Go-live-Blocker B4)

Erstellt am **2026-07-23**. Grundlage: `npm audit --json` gegen den installierten
Stand, Quelltextanalyse und ein **real durchgeführter Upgrade-Versuch** mit
anschließendem Rollback. Bezug: [betriebsreview-2026-07-23.md](betriebsreview-2026-07-23.md).

---

## Entscheidung

**Das Upgrade wird für Version 1.0 bewusst NICHT durchgeführt.** Es bleibt bei
`next@14.2.35`. Grund ist kein Aufwandsargument, sondern ein **nachgewiesener
Funktionsbruch**: Next 15 macht den Konfigurator-Canvas unbrauchbar, und die
Behebung erzwingt einen React-19-Umstieg samt Austausch der Canvas-Bibliothek –
unmittelbar vor dem Go-live ein unverhältnismäßiges Risiko am Herzstück des Shops.

Das Restrisiko ist benannt, eingegrenzt und mit Maßnahmen unterlegt (Abschnitt 4).

**Roadmap-Platz (angepasst am 2026-07-23):** Das Upgrade folgt **als zweites
Projekt nach dem Go-live** – zuerst wird die Filterleiste umgesetzt
([filterleiste-konzept.md](filterleiste-konzept.md)). Begründung: Die Filter
bringen unmittelbar geschäftlichen Nutzen und betreffen Shop, Datenmodell und
Oberfläche; dieses Upgrade betrifft vor allem den Konfigurator und wird bewusst
als eigener, technisch anspruchsvoller Schritt durchgeführt (Abschnitt 5).

---

## 1. Welche Advisories betreffen dieses Projekt wirklich?

`npm audit` meldet **5 Schwachstellen (4 hoch, 1 moderat)**; im Paket `next`
stecken davon rund 20 Einzel-Advisories. Entscheidend ist nicht die Zahl, sondern
die Anwendbarkeit. Geprüft wurde jeweils gegen den Quelltext.

### Nachweislich NICHT anwendbar

| Advisory | Warum nicht |
|---|---|
| Middleware/Proxy-Bypass, Pages Router + i18n (HIGH) | **kein** Pages Router, **kein** i18n |
| Middleware/Proxy-Redirect Cache-Poisoning (LOW) | **Update 2026-08-07:** Seit dem Kundenkonto existiert `src/middleware.ts` – aber bewusst eng: NUR für `/konto/*` und `/auth/*` (siehe `matcher`), OHNE jeden Redirect (ausschließlich Sitzungs-Cookie-Auffrischung über `supabase.auth.getUser()`). Das Advisory betrifft Middleware, die selbst umleitet – das tut diese nicht. Für den gesamten übrigen Shop bleibt die Aussage „keine Middleware" unverändert wahr. |
| SSRF in `rewrites` (HIGH) | **keine** rewrites in `next.config.js` |
| Request Smuggling in `rewrites` (MODERATE) | dito |
| SSRF in Server Actions auf **custom servers** (HIGH) | **kein** custom server (Vercel) |
| Unbounded Server-Action-Payload in **Edge**-Runtime (MODERATE) | **keine** Edge-Runtime im Projekt |
| XSS mit **CSP-Nonces** (MODERATE) | **keine** CSP/Nonce gesetzt |
| XSS in `beforeInteractive`-Skripten (MODERATE) | **nicht** verwendet |
| SSRF über **WebSocket-Upgrades** (HIGH) | keine WebSocket-Behandlung |
| Image-Optimizer `remotePatterns` DoS (MODERATE) | Advisory betrifft **self-hosted**; auf Vercel läuft die Bildoptimierung plattformseitig |
| Unbounded `next/image`-Disk-Cache (MODERATE) | dito |

Belege: kein `src/pages`, keine `i18n`/`rewrites`/`redirects` in `next.config.js`,
kein `server.js`, kein `runtime = 'edge'`, kein `nonce`, kein `beforeInteractive` –
jeweils per Suche im gesamten `src`-Baum bestätigt. `middleware.ts` existiert seit
dem Kundenkonto (siehe Zeile oben), ist aber bewusst eng gehalten – macht selbst
**keine** Redirects –, weshalb die ursprüngliche Advisory-Analyse gültig bleibt.

### Anwendbar – das tatsächliche Restrisiko

| Advisory | Schwere | Charakter |
|---|---|---|
| DoS in App Router über **Server Actions** | HIGH | Verfügbarkeit |
| DoS mit **Server Components** (zwei Advisories) | HIGH | Verfügbarkeit |
| HTTP-Request-Deserialisierung → DoS bei RSC | HIGH | Verfügbarkeit |
| Cache-Poisoning in **RSC-Antworten** | MODERATE | Integrität der Auslieferung |
| Cache-Confusion bei Antwort-Bodies (zwei Advisories) | MODERATE | dito |
| Cache-Poisoning über RSC-Cache-Busting-Kollisionen | LOW | dito |
| **Unauthentifizierte Offenlegung interner Server-Function-Endpunkte** | MODERATE | Informationspreisgabe |
| DoS in der Image-Optimization-API | MODERATE | Verfügbarkeit (auf Vercel teilweise plattformseitig) |

**Einordnung:** Das anwendbare Restrisiko ist ganz überwiegend
**Verfügbarkeit (DoS)**, dazu Cache-Effekte und eine Offenlegung von
Endpunkt-Kennungen. **Kein** anwendbares Advisory führt zu Codeausführung oder
zu direktem Zugriff auf Kundendaten. Die Zahlungsstrecke (Stripe-Webhook mit
Signaturprüfung), die Admin-Authentifizierung und die RLS-Härtung der Datenbank
sind von keinem dieser Advisories betroffen.

---

## 2. Der Upgrade-Versuch (real durchgeführt)

**Wichtige Korrektur zur ersten Einschätzung im Betriebsreview:** Dort stand,
die Behebung erfordere Next **16**. Das ist falsch. Die Obergrenzen aller
Advisory-Bereiche liegen in der **15.5.x**-Linie (höchste: `<15.5.21`);
`npm audit` schlägt 16.2.11 nur deshalb vor, weil es die neueste Version ist.
**`next@15.5.21` schließt sämtliche Advisories.**

Ebenfalls geprüft und entkräftet: Next 15 verlangt laut `peerDependencies`
**nicht** zwingend React 19 (`react: ^18.2.0 || ^19.0.0`).

### Was funktioniert hat

Mit `next@15.5.21` + `eslint-config-next@15.5.21`, React unverändert 18.3.1:

- **Codeanpassungen** (klein und mechanisch, vollständig erfasst):
  - `next.config.js`: `experimental.serverComponentsExternalPackages` → `serverExternalPackages`
  - asynchrone Request-APIs: `cookies()` (7×), `headers()` (2×) — die beiden
    synchronen Aufrufer `herkunft()` (auth) und `ermittleIp()` (rateLimit) haben
    je **genau einen** Aufrufer in bereits asynchronen Funktionen
  - `params`/`searchParams` in 5 dynamischen Routen (inkl. `generateMetadata`)
- **Ergebnis:** `tsc` 0 Fehler · `eslint` 0 · **458/458 Unit-Tests** ·
  **`next build` erfolgreich** (alle Routen inkl. 43 SSG-Produktseiten)
- **`npm audit`: 0 Schwachstellen** – nach zusätzlichen `overrides` für die in
  Nexts eigenem Baum mitgelieferten `sharp` 0.34.x (libvips-CVEs) und
  `postcss` 8.4.x

### Was gescheitert ist – der Blocker

Der **Konfigurator-Canvas rendert nicht mehr**. Nachgewiesen über die
Bestell-E2E (`page.waitForSelector('canvas')` läuft in den Timeout) und über
einen gezielten Playwright-Diagnoselauf gegen die laufende Anwendung:

```
canvas-Elemente: 0
PAGEERROR: Cannot read properties of undefined (reading 'ReactCurrentOwner')
```

`ReactCurrentOwner` ist Teil der React-Internals, die in **React 19 entfallen
sind**. `react-konva@18.2.16` greift darauf zu. Unter Next 15 läuft der App
Router folglich nicht mehr gegen die React-Fassung, die react-konva 18 erwartet.
Der Befund ist **nach Löschen des `.next`-Caches reproduzierbar** – kein
Cache-Artefakt.

**Warum das nicht klein zu reparieren ist:**

| Paket | Befund |
|---|---|
| `react-konva@19.0.0` | erlaubt laut Metadaten noch `react ^18.3.0 \|\| ^19.0.0` |
| `react-konva@19.0.1` und neuer | verlangt **`react@^19.0.0`** (npm bricht mit ERESOLVE ab) |
| `react-konva@19.2.5` (aktuell) | verlangt **`react@^19.2.0`** |

Die 19er-Linie setzt faktisch **React 19** voraus. Ein funktionierender
Konfigurator unter Next 15 erfordert damit: **React 19 + react-dom 19 +
react-konva 19** – und in der Folge die Neuvalidierung von `@react-pdf/renderer`,
`@react-email/components`, `use-image` sowie **der gesamten visuellen
Konfigurator-Prüfstrecke** (Druckflächen, Geometrie, Screenshots).

### Rollback

Vollständig zurückgesetzt auf `next@14.2.35` / `react@18.3.1` /
`react-konva@18.2.16`. **Nachweis des wiederhergestellten Stands:**

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` / `eslint .` | 0 / 0 |
| Unit-Tests | **458/458** |
| `next build` | erfolgreich |
| E2E Bestellung / Zahlung / Rate-Limit / Admin-Auth | 21/21 · 21/21 · 16/16 · 19/19 |
| E2E Stripe (echtes Testkonto) | **31/31** |

Beibehalten wurde eine kleine Verbesserung aus dem Versuch: Zwei Wächter-Regexe
in `admin/__tests__/auth.test.ts` erkennen jetzt **beide** Schreibweisen
(`cookies().set/delete` und `(await cookies()).set/delete`). Damit greift die
negative Wächterprüfung („Secret nie ins Cookie") auch nach einem späteren
Upgrade weiter – unter Next 14 unverändert wirksam.

---

## 3. Warum das Risiko für Version 1.0 vertretbar ist

1. **Der überwiegende Teil der Advisories ist nachweislich nicht anwendbar**
   (Abschnitt 1) – kein Middleware-, Pages-Router-, rewrites-, custom-server-,
   Edge- oder CSP-Nonce-Einsatz.
2. **Das anwendbare Restrisiko ist ganz überwiegend Verfügbarkeit (DoS)** – kein
   Datenabfluss, keine Codeausführung, kein Zugriff auf Kundendaten.
3. **Betriebsumfeld dämpft zusätzlich:** Vercel bringt DDoS-/Plattformschutz mit;
   die Bildoptimierung läuft plattformseitig; die Anwendung hat ein eigenes,
   zentrales Rate-Limiting auf allen fünf Endpunkten.
4. **Cache-Effekte sind kaum angreifbar:** Alle kundendatenführenden Routen sind
   `force-dynamic`; es gibt keine `fetch`-Cache-Direktiven, kein `unstable_cache`
   und kein `revalidate` im Projekt.
5. **Der Gegenwert wäre negativ:** Das Upgrade bräche nachweislich den
   Konfigurator; die Reparatur erzwingt einen React-19-Umstieg mit Austausch der
   Canvas-Bibliothek – genau der Bereich, der visuell aufwendig validiert und
   bewusst eingefroren ist. Ein Ausfall dort trifft den Shop härter als die hier
   verbleibenden DoS-Risiken.

**Nicht akzeptiert würde das Risiko**, wenn eines der anwendbaren Advisories auf
Datenabfluss oder Codeausführung liefe. Das ist nach dieser Analyse nicht der Fall.

---

## 4. Maßnahmen bis zum Upgrade

| Maßnahme | Status |
|---|---|
| Rate-Limiting auf allen Endpunkten (Postgres, zentral) | vorhanden |
| Alle kundendatenführenden Routen `force-dynamic` (kein Caching) | vorhanden |
| Vercel-Plattformschutz nutzen; bei Angriff **Attack Challenge Mode** aktivieren | bei Bedarf |
| Health-Check + strukturiertes Logging + `system_ereignisse` zur Früherkennung von DoS-Mustern | vorhanden |
| **CI:** `npm audit --audit-level=high` schlägt weiterhin fehl (Exit 1) – als **datierte, begründete Ausnahme** führen, nicht stillschweigend ignorieren; dieses Dokument ist die Begründung | **gesetzt (2026-08-07)** – `scripts/pruefeNpmAudit.mjs`, in `pruefung.yml` verdrahtet. Lässt nur die unten in „Monatliche Prüfung" gelisteten, bereits analysierten Pakete/Versionsspannen durch; jedes neue Advisory lässt CI weiterhin fehlschlagen |
| Advisory-Lage monatlich prüfen; bei einem Advisory mit Datenabfluss/RCE **sofort** neu bewerten | wiederkehrend – siehe „Monatliche Prüfung" unten |

### Monatliche Prüfung

| Datum | Ergebnis |
|---|---|
| 2026-08-07 | Erneut geprüft im Rahmen des Produktionsreife-Durchlaufs. Die vollständigen Advisories aus Abschnitt 1 gelten weiter (keine neue Kategorie – weiterhin überwiegend DoS/Cache, kein Datenabfluss/RCE). Verschoben hat sich nur, WELCHE next-Version alles schließt: `npm audit` schlägt inzwischen `next@16.3.0` statt `15.5.21` vor (weitere Advisories seit 07-23 hinzugekommen, alle in derselben Kategorie). Zusätzlich neu und BEHOBEN (nicht next-bezogen, sicher per `npm audit fix`): `js-yaml` (nur `eslint`-Werkzeugkette, nie zur Laufzeit aktiv) und die `glob`/`eslint-config-next`-Kette auf der 14er-Linie. Entscheidung unverändert: Upgrade bleibt zurückgestellt, derselbe react-konva/React-19-Blocker gilt unverändert (eher verschärft, da neuere Next-Versionen React 19 tendenziell noch verbindlicher voraussetzen). `scripts/pruefeNpmAudit.mjs` aktualisiert auf die aktuellen Versionsspannen. |

---

## 5. Upgrade-Plan (zweites Projekt nach dem Go-live, nach der Filterleiste)

Der Weg ist durch den Versuch bereits vermessen:

1. **Pakete:** `next@15.5.x` (oder aktueller) · `react@19` · `react-dom@19` ·
   `react-konva@19.x` · `eslint-config-next` passend · `@types/react(-dom)@19`
2. **Verträglichkeit prüfen:** `@react-pdf/renderer`, `@react-email/components`,
   `use-image`, `konva` unter React 19
3. **Codeanpassungen** – vollständig bekannt und in Abschnitt 2 gelistet
   (Config-Umbenennung, `await cookies()/headers()`, `params`/`searchParams` in
   5 Routen). Offizieller Codemod: `npx @next/codemod@canary next-async-request-api .`
4. **`overrides`** für `sharp`/`postcss` wieder setzen (bringt den Audit auf 0)
5. **Regression:** `tsc` · `eslint` · Unit-Tests · `next build` · alle fünf
   E2E-Suiten · **zusätzlich die visuelle Konfigurator-Prüfstrecke**
   (Playwright-Screenshots), weil die Canvas-Bibliothek getauscht wird
6. **Zusätzlich ab dann:** die bis dahin gebaute **Filterleiste** mitprüfen
   (E2E-Fälle und visuelle Prüfstrecke aus
   [filterleiste-konzept.md](filterleiste-konzept.md) Abschnitt 10) – sie
   entsteht auf React 18 und muss den Umstieg ebenfalls überstehen
7. **Aufwand:** realistisch 1–2 Tage inklusive visueller Neuvalidierung
   (zuzüglich der Filter-Prüfung)

**Auslöser für ein Vorziehen:** ein neues Advisory mit Datenabfluss oder
Codeausführung, das dieses Projekt betrifft.

---

## 6. Fazit

Die Entscheidung beruht nicht auf einer Vermutung, sondern auf einem
durchgeführten Upgrade mit reproduzierbarem Funktionsbruch und einem
verifizierten Rollback. **B4 gilt damit als bearbeitet und bewusst
zurückgestellt** – mit benanntem Restrisiko, wirksamen Maßnahmen und einem
konkreten, vermessenen Upgrade-Pfad.
