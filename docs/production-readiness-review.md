# Production-Readiness-Review — Gesamtplattform

Stand: Juli 2026. Perspektive: Senior Software Engineer / Solution Architect,
Annahme „Go-Live morgen". Umfang: gesamte Plattform (Konfigurator, Shop,
Checkout, Backend, Datenmodell, Sicherheit, Performance, Fehlerbehandlung,
Deployment, Monitoring, Wartbarkeit, Skalierbarkeit). Es werden nur real
nachvollziehbare Risiken beschrieben – keine hypothetischen Probleme.

## Gesamteinschätzung des Reifegrads

Die Plattform ist **architektonisch reif und für einen kontrollierten Start im
B2B-Rechnungsmodell nah an der Produktionsreife**. Kern-Bausteine (Datenmodell,
Bestell-Persistenz, Storage/PDF/E-Mail, Admin-Bereich, Lieferantenprozess) sind
solide gebaut, getippt, getestet (84 Tests grün) und gut dokumentiert. Die
Fehler-Isolierung im Bestellablauf ist vorbildlich (eine Bestellung scheitert
nicht an nachgelagerten Schritten).

Vor dem Scharfschalten gibt es **zwei sicherheits-/integritätsrelevante Punkte
(einer bereits gefixt, einer als Code-Empfehlung)** sowie mehrere sinnvolle
Härtungen. Ein größerer **Produktumfang-Vorbehalt**: Online-Zahlung (Stripe)
ist NICHT implementiert – es funktioniert derzeit ausschließlich der
Rechnungs-/Anfrage-Weg.

## Befunde nach Kritikalität

### 🔴 Kritisch
Keine ungemilderten kritischen Blocker im aktuellen (Rechnungs-)Ablauf.
Hinweis: Befund H1 wird KRITISCH, sobald Online-Zahlung aktiviert wird.

### 🟠 Hoch

**H1 — Preis wurde dem Client vertraut (keine serverseitige Neuberechnung).**
`submitOrder` summierte früher `item.totalPrice`/`item.unitPrice` direkt aus dem
Client-Payload und speicherte sie ungeprüft (manipulierbar auf `totalPrice: 0`).
- *Fix (umgesetzt):* Neues Modul `src/lib/pricing/serverPricing.ts`
  (`priceCart`/`priceCartItem`) berechnet Preis UND Menge AUTORITATIV aus
  Katalog (`getProduct().basePrice`) + Konfiguration (Elemente, Größen-Mengen,
  Veredelung) über denselben Rechenkern wie der Client (`calculatePrice` +
  `getPricingRules`). `orders.ts` nutzt ausschließlich diese Serverwerte;
  Menge = Summe der Größen-Mengen (nicht `item.quantity`). Der Client-Preis
  wird nur noch zu Prüfzwecken geloggt (`priceClaimDeviation` → Warnung bei
  Abweichung); unbekannte Produkte in echten Bestellungen werden abgelehnt.
  8 Tests in `serverPricing.test.ts` belegen, dass manipulierte Preise/Mengen
  ignoriert bzw. erkannt werden.
- *Status:* ✅ **GEFIXT.**

**H2 — Öffentliche INSERT-Policy erlaubte anonyme Direkt-Inserts.**
`orders`/`order_items`/`configuration_elements` hatten `insert with check(true)`
(0001). Mit dem öffentlichen Publishable-Key konnte jeder direkt gegen die
Supabase-REST-API Bestellungen einfügen – unter Umgehung der Server Action.
- *Impact:* Fake-/Spam-/Null-Preis-Bestellungen ohne Validierung.
- *Fix:* Migration **0008** entfernt die Policies (App schreibt ohnehin nur über
  den Service-Role-Client). **Status: GEFIXT** – Migration anwenden vor Go-Live.

### 🟡 Mittel

**M1 — Kein Rate-Limiting / Missbrauchsschutz** auf den öffentlichen Bestell-/
Anfrage-Formularen. Jeder Submit löst E-Mails, Storage-Uploads und
Lieferanten-Einreihung aus; Body bis 15 MB.
- *Impact:* Spam/DoS, E-Mail-Kosten, Storage-Wachstum, Queue-Verschmutzung.
- *Empfehlung:* Rate-Limit (Vercel/Upstash) + Honeypot-Feld (kein CAPTCHA –
  Projektregel). *Status: EMPFOHLEN.*

**M2 — Sicherheitsheader / CSP.** Basisheader (X-Frame-Options,
X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) **ergänzt
(GEFIXT)** in `next.config.js`. Eine **Content-Security-Policy fehlt bewusst
noch** – sie muss gegen Konva/Canvas + `data:`-Logo-URLs + Supabase getestet
werden. *Status: TEILWEISE GEFIXT + Empfehlung (CSP als getesteter Schritt).* 

**M3 — Dünne serverseitige Eingabevalidierung.** `submitOrder` prüft nur
Pflichtfelder + `email.includes('@')`; keine Prüfung, ob `productId` im Katalog
existiert, ob Mengen/Größen plausibel sind. *Empfehlung:* zusammen mit H1
serverseitig gegen den Katalog validieren. *Status: EMPFOHLEN.*

**M4 — Cron-Timeout vs. viele Browser-Jobs.** `maxDuration=60s`; bei aktivierter
Automatisierung und vielen fälligen Jobs (bis 25 × Chromium-Start) kann ein
Cron-Tick das Limit überschreiten. Durch atomaren Lock + Stale-Lock-Reaper
**resilient** (kein Datenverlust, keine Doppelbestellung), aber durchsatz-
limitiert. *Empfehlung:* Limit je Tick senken oder den Browser-Worker bei
Volumen außerhalb der Serverless-Funktion betreiben. *Status: EMPFOHLEN (nur
relevant bei aktivierter Automatisierung im Volumen).*

**M5 — Kein Fehler-Monitoring/Alerting.** Fehler landen nur in `console.error`;
keine Aggregation, keine Benachrichtigung bei dauerhaft `failed`/`blocked`
Lieferantenbestellungen (Sentry bewusst nicht – Projektregel „kein
Kontoanlegen"). Der Audit-Trail (supplier_order_events) existiert.
*Empfehlung:* strukturiertes Logging + einfache interne E-Mail-Benachrichtigung
bei wiederholtem Fehlschlag. *Status: EMPFOHLEN.*

### 🟢 Niedrig

**L1 — Admin-Auth minimal:** Cookie = Roh-Secret, `===`-Vergleich, ein
gemeinsames Secret, 12 h Ablauf. Für Einzel-Admin-B2B akzeptabel. *Optional:*
signiertes Session-Token + Rotation.

**L2 — Cron `?secret=`-Fallback** landet in Logs. Header-Variante (`Bearer`)
bevorzugen.

**L3 — E-Mail-Fehler werden nur geloggt**, nicht dem Nutzer gezeigt/retryt;
`render()` liegt außerhalb des `try` in `sendEmail`. *Optional:* E-Mail-Schritt
in `orders.ts` defensiv umklammern.

**L4 — Vestigiale DB-Produkttabellen** (brands/products/… aus 0001) – der
Katalog lebt in TS-Config; die Tabellen sind leer/ungenutzt (Lese-Policies
harmlos). *Optional:* später befüllen (DB-Katalog) oder entfernen.

**L5 — DB-Backups verifizieren** (Supabase-Plan: tägliche Backups / PITR je
Tarif). Ops-Punkt, kein Code.

## Bereits produktionsreif

- **Lieferantenprozess** (needen + TG): Adapter deklarativ, Engines geteilt,
  Lebenszyklus mit Statusmaschine/atomarem Lock/Retry+Backoff/Audit,
  Stale-Lock-Reaper, idempotente Auto-Übergabe. Zwei echte-Chromium-E2E-Tests.
- **Bestell-Persistenz + Storage + Produktionsblatt-PDF + E-Mail** (Rechnung/
  Anfrage): funktioniert, hervorragende Fehler-Isolierung (Bestellung bleibt
  gespeichert, auch wenn Rendering/PDF/E-Mail/Einreihung scheitern).
- **Admin-Bereich:** Anzeige- UND Action-Gate (Defense in Depth), `noindex`,
  `force-dynamic`.
- **Datenmodell:** sinnvolle Entscheidungen (Snapshot-Pattern für order_items,
  getrennter `payment_status`, passende Indizes, RLS default-deny auf
  supplier_*), robuste Bestellhistorie.
- **Shop-Browsing:** statischer TS-Katalog → schnell, keine DB-Last beim Stöbern
  (gut für Performance/Skalierung).
- **Wartbarkeit:** durchgängig typisiert, getestet, modular, dokumentiert.

*Nicht Teil dieses Tiefen-Audits (bewusst): der Konva-Konfigurator-Client wurde
nicht Zeile für Zeile geprüft – er ist der gereifte, live-getestete Kern; die
einzige daran hängende Risikofläche (15 MB Logo-`data:`-URLs im Speicher) ist
oben adressiert. Ein separater Client-Performance/UX-Pass ist optional.*

## Realistische Go-Live-Checkliste

### Zwingend vor Go-Live
- [ ] **Migration 0008 anwenden** (RLS-Härtung – vorbereitet). 
- [x] ~~Serverseitige Preis-Neuberechnung (H1)~~ — **erledigt** (serverPricing.ts
      + Tests; Client-Preis wird nie mehr gespeichert).
- [ ] **Produktions-Env-Variablen** setzen: Supabase (URL/Publishable/Secret),
      `RESEND_API_KEY` + **verifizierte Absender-Domain**, `ADMIN_SECRET`
      (≥12 Z.), `CRON_SECRET`, `EMAIL_TEST_MODE=false` (erst NACH Domain-
      Verifikation – sonst gehen alle Mails an den Testempfänger).
- [ ] Entscheidung: Start **Rechnungs-/Anfrage-only** (dann startklar nach obigem)
      ODER Online-Zahlung nötig → **Stripe (Stage B/C/D)** vorher umsetzen.

### Empfohlen (bald nach/vor Go-Live)
- [ ] Rate-Limit + Honeypot auf öffentlichen Formularen (M1).
- [ ] CSP-Header getestet ergänzen (M2).
- [ ] Alerting bei `failed`/`blocked` Lieferantenbestellungen (M5).
- [ ] Serverseitige Eingabevalidierung gegen den Katalog (M3).
- [ ] Erster Lieferanten-Automatisierungslauf mit `SUPPLIER_HEADFUL=1`.

### Nur Geschäftsdaten / Zugangsdaten (kein Code)
- [ ] Mehrdeutige Farbentscheidungen (Grautöne, AWDis) — Coverage-Report.
- [ ] FOTL-Lieferanten-Refs (URLs/Art.-Nr. recherchiert, Farbschlüssel offen).
- [ ] Finale Verkaufs-/Einkaufspreise (aktuell Platzhalter-EK).
- [ ] B2B-Zugangsdaten needen/TG + `SUPPLIER_AUTOMATION_ENABLED=1` (falls
      Lieferantenbestellung automatisiert werden soll; sonst Admin-Button).

## Fazit

Für einen **B2B-Start im Rechnungsmodell** ist die Plattform nach Anwendung von
Migration 0008 + der Preis-Neuberechnung (H1) und dem Env-Setup **produktions-
tauglich**. Die restlichen Punkte sind gezielte Härtungen bzw. Betriebs-/Daten-
aufgaben. Online-Zahlung ist der einzige größere fehlende Funktionsblock und
bewusst als eigene Phase (Stripe) ausgelagert.
