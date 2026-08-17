# Umgebungsvariablen

Alle Variablen mit Bedeutung, Pflichtstatus und Verwendungsort. Stand
2026-08-07.

Gehalten in `.env.local` (lokal) bzw. in den Umgebungseinstellungen der
Plattform (produktiv). Der [Health-Check](betriebsbeobachtung.md) prüft die
Pflichtfelder zur Laufzeit; niemals wird ein Wert ausgegeben, nur
„vorhanden/fehlt".

**Keine Variable dieser Liste gehört je in den Quelltext.** `pruefeSecrets.mjs`
durchsucht das Repository bei jedem CI-Lauf nach Schlüsselmustern.

---

## Pflicht – ohne diese läuft nichts

| Variable | Bedeutung | verwendet in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse des Supabase-Projekts. `NEXT_PUBLIC_`, weil auch der Client sie kennt. | überall, Health |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | öffentlicher Schlüssel für den Client (unterliegt RLS) | Client |
| `SUPABASE_SECRET_KEY` | Service-Role-Schlüssel, umgeht RLS. **Streng geheim, nur serverseitig.** | aller DB-Zugriff |
| `ADMIN_SECRET` | Zugangsschlüssel zum Adminbereich, mind. 12 Zeichen. Wird nur in `lib/admin/auth.ts` gelesen und **nie** ins Cookie geschrieben. | Admin-Login |
| `ORDER_TOKEN_SECRET` | HMAC-Schlüssel für Bestell-Zugriffstoken (Storno-Links) | Storno, Bestellzugriff |

Fehlt eine davon oder ist `ADMIN_SECRET` zu kurz, meldet `/api/health` den
Zustand **kritisch** (HTTP 503).

---

## Kundenkonto (Supabase Auth)

Dieselben drei Supabase-Variablen (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) tragen nicht
nur den Datenbankzugriff, sondern auch das komplette Kundenkonto-System:
Registrierung, Login/Logout, Passwort vergessen/zurücksetzen, E-Mail ändern.
Die Bestätigungs- und Reset-Links selbst entstehen serverseitig über
`admin.generateLink()` (`lib/actions/konto.ts`) und werden als eigene
gebrandete Mails über Resend verschickt; der Link führt auf den
PKCE-Callback unter `/auth/callback`.

**Go-live-Voraussetzung, ohne die diese Links in Produktion nicht
funktionieren:** Im Supabase-Dashboard muss unter *Authentication → URL
Configuration* die Redirect-URL `<eigene-domain>/auth/callback` eingetragen
sein (zusätzlich zur `Site URL`). Fehlt dieser Eintrag, weist Supabase jeden
Bestätigungs- und Reset-Link ab – das Konto-System wirkt in der lokalen
Entwicklung unauffällig, scheitert aber beim ersten Produktivversand.

---

## Für den Vollbetrieb erforderlich

| Variable | Bedeutung | Fehlt sie? |
|---|---|---|
| `RESEND_API_KEY` | Schlüssel für den E-Mail-Versand | keine Bestätigungen; Health meldet „beeinträchtigt" |
| `CRON_SECRET` | schützt die Cron-Route (`Authorization: Bearer …`). **Nur als Header, nie als Query-Parameter** (Fund aus H1). Auf Vercel zusätzlich Pflicht: Vercel fügt genau diesen Bearer-Header bei jedem Cron-Lauf automatisch hinzu, sobald die Variable gesetzt ist (siehe `vercel.json`, [deployment.md](deployment.md)). | Cron-Route liefert 503; Vercel-Cron scheitert an der Auth |
| `NEXT_PUBLIC_SITE_URL` | Basis-URL für Links in E-Mails | Links unvollständig |

---

## Zahlung (Stripe + PayPal integriert)

Beide Adapter sind gebaut, verdrahtet und im Testmodus nachgewiesen. Der
Checkout (`CartDrawer.tsx`) bietet Rechnung/Karte/PayPal als echte Auswahl;
bei Karte/PayPal eröffnet `starteZahlung()` (`lib/orders/paymentService.ts`)
nach dem Speichern der Bestellung den Bezahlvorgang und leitet zur
gehosteten Checkout-Seite weiter. Ob eine Bestellung als bezahlt gilt,
entscheidet ausschließlich der jeweilige Webhook, nie dieser Redirect.

### Stripe

| Variable | Bedeutung |
|---|---|
| `STRIPE_SECRET_KEY` | geheimer Stripe-Schlüssel (`sk_test_` / `sk_live_`). `stripeKonfiguration.ts` erkennt Verwechslung mit dem publizierbaren Schlüssel und warnt bei `sk_live_` außerhalb der Produktion. |
| `STRIPE_WEBHOOK_SECRET` | prüft die Webhook-Signatur. **Erst nach Einrichten des Webhook-Endpunkts verfügbar** – deshalb getrennt vom Secret-Key. Endpunkt: `https://<domain>/api/webhooks/stripe`. |

### PayPal

| Variable | Bedeutung |
|---|---|
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | App-Zugangsdaten aus dem PayPal Developer Dashboard – Sandbox und Live haben JEWEILS eigene Paare. |
| `PAYPAL_WEBHOOK_ID` | für die serverseitige Signaturprüfung (`POST /v1/notifications/verify-webhook-signature`). Endpunkt: `https://<domain>/api/webhooks/paypal`. |
| `PAYPAL_ENV` | `sandbox` oder `live` – bestimmt die Basis-URL (`api-m.sandbox.paypal.com` / `api-m.paypal.com`), explizit statt aus `NODE_ENV` abgeleitet. |

Anders als Stripe (lokale HMAC-Prüfung) verifiziert PayPal Webhooks über
einen Netzwerk-Aufruf zurück an PayPal – siehe Kopfkommentar in
`lib/payments/providers/paypal.ts`. Der Capture-Schritt (Geld tatsächlich
einziehen) läuft ebenfalls serverseitig im Webhook (`CHECKOUT.ORDER.APPROVED`),
nicht auf der Rückkehr-Seite.

Solange die jeweiligen Variablen fehlen, gilt der Anbieter über
`stripeKonfigurationsStand()`/`paypalKonfigurationsStand()` als nicht
einsatzbereit; `registry.ts` bietet dann nur die verbleibenden Anbieter an –
ohne stillen Rückfall auf den Testanbieter.

---

## Rechnung (Lexware Office integriert)

Lexware Office ist das führende Rechnungssystem – die Rechnungsnummer wird
AUSSCHLIESSLICH dort vergeben, nicht im Shop. Automatisch ausgelöst für jede
verbindliche Bestellung (Rechnungskauf UND vorab bezahlte), sobald Phase 2
läuft (`lib/orders/orderCompletion.ts`, `erzeugeRechnung`).

| Variable | Bedeutung |
|---|---|
| `LEXWARE_API_KEY` | persönlicher API-Schlüssel, erzeugt unter `app.lexware.de/addons/public-api`. |

**Keine Sandbox verfügbar** – jeder Aufruf trifft das echte Konto. Der
Testmodus (`E2E_TESTMODUS=aktiv`) ist deshalb hier die EINZIGE Schutzschicht
gegen einen versehentlichen echten Rechnungslauf (`waehleRechnungsAnbieter()`
in `lib/invoicing/registry.ts` wählt im Testmodus immer den Testanbieter,
unabhängig vom gesetzten Schlüssel). `LEXWARE_API_KEY` deshalb **niemals in
CI setzen**.

---

## Versand (DHL Parcel DE Shipping API v2 integriert)

Admin-ausgelöst über den Button „DHL-Label erstellen" (Bestelldetailseite),
sobald Zahlung + Lieferadresse vorliegen. Erzeugt Label + Sendungsnummer,
speichert beides an der Bestellung (`tracking_number`, `carrier`,
`dhl_label_url`).

Authentifizierung per OAuth2 (Password-Grant/ROPC gegen DHLs Authentication
API) – der von DHL empfohlene Weg; die frühere Basic-Auth-Variante hat DHL
selbst als auslaufend markiert ("we will no longer offer Basic Auth in
future API versions").

| Variable | Bedeutung |
|---|---|
| `DHL_API_KEY` / `DHL_API_SECRET` | `client_id`/`client_secret` der eigenen App im DHL-API-Developer-Portal (developer.dhl.com). |
| `DHL_USERNAME` / `DHL_PASSWORD` | Login eines Systembenutzers im Post & DHL Geschäftskundenportal – ein ANDERES Konto als das Developer-Portal, wird für den Password-Grant zusätzlich zu API-Key/-Secret gebraucht. |
| `DHL_BILLING_NUMBER` | 14-stellige Abrechnungsnummer des Versandvertrags. |
| `DHL_ENV` | `sandbox` oder `production` – bestimmt sowohl den Sendungs- als auch den Auth-Token-Endpunkt. |

**Sandbox-Zugang muss aktiv beim DHL-Entwicklerportal beantragt werden**
(Stand Aug 2026: manuelle Prüfung, ca. 24h) – ein bestehender
Geschäftskundenvertrag allein reicht nicht für den API-Zugang. Die alte
SOAP-Schnittstelle „Geschäftskundenversand" v3 ist laut DHL zum 31.05.2026
abgeschaltet; diese Integration nutzt ausschließlich die neue REST-API v2.

Das OAuth2-Token (30 Minuten gültig) wird prozessweit zwischengespeichert
(`dhl.ts`, dasselbe Muster wie PayPals `holeZugriffstoken()`) – kein
Token-Abruf je Bestellung.

---

## Buchhaltungs-Synchronisierung (lokale Anwendung, additiv)

Sichere PULL-Synchronisierung mit der lokalen Buchhaltungs-Anwendung
(`embroidery-republic-buchhaltung`) über `GET /api/accounting/v1/orders`
([OpenAPI](openapi/accounting-sync-v1.yaml), [ADR 0007](adr/0007-buchhaltungs-sync-cursor.md)).
Die Website macht dabei nichts von sich aus erreichbar – die lokale
Buchhaltung ruft kontrolliert ab.

| Variable | Bedeutung |
|---|---|
| `ACCOUNTING_API_KEY` | geteiltes Secret, geprüft als `Authorization: Bearer …` (zeitkonstant, exakt wie `CRON_SECRET`). Zufällig, mindestens 32 Zeichen. Muss hier **und** identisch in den Einstellungen der lokalen Buchhaltungs-Anwendung hinterlegt werden. |

Ohne gesetzten Schlüssel liefert der Endpunkt bewusst 503 (nicht scharf
geschaltet) statt eines geratenen/leeren Vergleichswerts – dasselbe
Verhalten wie beim Cron-Endpunkt. Der Schlüssel taucht in keiner
Fehlermeldung und in keinem Protokolleintrag auf
(`src/lib/accounting/accountingSyncKonfiguration.ts`).

---

## Rate-Limit: vertrauenswürdiger Proxy

| Variable | Bedeutung | Fehlt sie? |
|---|---|---|
| `TRUSTED_PROXY` | macht explizit, ob `x-forwarded-for` als Aufrufer-Adresse fürs Rate-Limit vertraut wird (`lib/security/rateLimit.ts`, `ermittleIp()`) | Default `'vercel'` – passt zum aktuellen Produktivbetrieb, ändert nichts. Bei einem Betreiberwechsel ohne vertrauenswürdigen Proxy davor auf einen anderen Wert setzen, sonst lässt sich der Rate-Limit-Schlüssel (u.a. `admin_login`) über den Header frei fälschen, siehe [rate-limiting.md](rate-limiting.md). |

---

## Lieferantenautomatisierung (ruht derzeit)

| Variable | Bedeutung |
|---|---|
| `SUPPLIER_AUTOMATION_ENABLED` | Schalter für den automatischen Lieferantenlauf |
| `SUPPLIER_HEADFUL` | Browser sichtbar statt headless (Fehlersuche) |
| `SUPPLIER_NEEDEN_USERNAME` / `SUPPLIER_NEEDEN_PASSWORD` | Zugang needen.de |
| `SUPPLIER_TG_USERNAME` / `SUPPLIER_TG_PASSWORD` | Zugang textil-grosshandel.eu |

Der Lieferantenprozess läuft aktuell manuell (siehe
[manueller-lieferantenprozess.md](manueller-lieferantenprozess.md)); diese
Variablen sind für den späteren automatischen Betrieb vorgesehen.

---

## Test und Entwicklung

| Variable | Bedeutung |
|---|---|
| `NODE_ENV` | `production` schaltet DEBUG-Logs und Stacktraces ab (siehe [betriebsbeobachtung.md](betriebsbeobachtung.md)) |
| `EMAIL_TEST_MODE` | fängt E-Mails ab, statt sie zu versenden |
| `EMAIL_TEST_RECIPIENT` | Umleitungsziel im Testmodus |
| `DIRECT_URL` / `DATABASE_URL` | direkte Postgres-Verbindung für die Skripte (`applyMigration.mjs`, E2E-Läufe) |

Der **Testmodus** des Bestellwegs wird nicht über diese Variablen, sondern
über `E2E_TESTMODUS=aktiv` gesteuert – ausschließlich aus der Umgebung, nie
aus einer Anfrage (siehe [testmodus-und-abnahme.md](testmodus-und-abnahme.md)).

---

## Vorlage für `.env.local`

```bash
# Pflicht
NEXT_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<service-role-key>
ADMIN_SECRET=<mindestens 12 Zeichen>
ORDER_TOKEN_SECRET=<langer Zufallswert>

# Vollbetrieb
RESEND_API_KEY=<resend-key>
CRON_SECRET=<langer Zufallswert>
NEXT_PUBLIC_SITE_URL=https://<domain>

# Skripte
DIRECT_URL=postgresql://…

# Zahlung – Stripe + PayPal integriert; setzen, um die jeweilige Zahlart zu aktivieren
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# PAYPAL_CLIENT_ID=
# PAYPAL_CLIENT_SECRET=
# PAYPAL_WEBHOOK_ID=
# PAYPAL_ENV=sandbox

# Rechnung – Lexware Office integriert; setzen, um Rechnungen automatisch zu erstellen
# LEXWARE_API_KEY=

# Versand – DHL integriert (OAuth2); setzen, um Versandlabel erstellen zu können
# DHL_API_KEY=
# DHL_API_SECRET=
# DHL_USERNAME=
# DHL_PASSWORD=
# DHL_BILLING_NUMBER=
# DHL_ENV=sandbox

# Buchhaltungs-Synchronisierung – setzen, um die lokale Buchhaltungs-Anwendung
# per Pull-Sync anzubinden (identischer Wert dort in den Einstellungen)
# ACCOUNTING_API_KEY=
```
