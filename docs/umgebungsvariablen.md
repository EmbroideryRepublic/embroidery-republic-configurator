# Umgebungsvariablen

Alle Variablen mit Bedeutung, Pflichtstatus und Verwendungsort. Stand
2026-07-22.

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

## Für den Vollbetrieb erforderlich

| Variable | Bedeutung | Fehlt sie? |
|---|---|---|
| `RESEND_API_KEY` | Schlüssel für den E-Mail-Versand | keine Bestätigungen; Health meldet „beeinträchtigt" |
| `CRON_SECRET` | schützt die Cron-Route (`Authorization: Bearer …`). **Nur als Header, nie als Query-Parameter** (Fund aus H1). Auf Vercel zusätzlich Pflicht: Vercel fügt genau diesen Bearer-Header bei jedem Cron-Lauf automatisch hinzu, sobald die Variable gesetzt ist (siehe `vercel.json`, [deployment.md](deployment.md)). | Cron-Route liefert 503; Vercel-Cron scheitert an der Auth |
| `NEXT_PUBLIC_SITE_URL` | Basis-URL für Links in E-Mails | Links unvollständig |

---

## Zahlung (Stripe integriert)

Der Adapter ist gebaut und im Testmodus nachgewiesen. Er wird erst wirksam,
wenn diese beiden Variablen gesetzt sind:

| Variable | Bedeutung |
|---|---|
| `STRIPE_SECRET_KEY` | geheimer Stripe-Schlüssel (`sk_test_` / `sk_live_`). `stripeKonfiguration.ts` erkennt Verwechslung mit dem publizierbaren Schlüssel und warnt bei `sk_live_` außerhalb der Produktion. |
| `STRIPE_WEBHOOK_SECRET` | prüft die Webhook-Signatur. **Erst nach Einrichten des Webhook-Endpunkts verfügbar** – deshalb getrennt vom Secret-Key. |

Solange diese fehlen, gilt Stripe über `stripeKonfigurationsStand()` als nicht
einsatzbereit; `registry.ts` bietet dann ausschließlich Rechnungskauf – ohne
stillen Rückfall auf den Testanbieter.

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

# Zahlung – Stripe integriert; setzen, um Kartenzahlung zu aktivieren
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```
