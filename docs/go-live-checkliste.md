# Go-live-Readiness-Audit

Abnahmeprüfung vor der Freigabe. Stand 2026-07-22.

Jeder Punkt wurde **gegen den laufenden Code und die Produktivdatenbank
verifiziert**, nicht gegen frühere Notizen.

> **Historisches Protokoll:** Dieses Dokument ist eine Momentaufnahme vom
> 2026-07-22 – Zahlen wie Migrations-, Tabellen- und Funktionsanzahl sind der
> damalige Stand und wurden seither durch weitere Arbeit überholt (aktueller
> Stand siehe [entscheidungen-produktionsreife.md](entscheidungen-produktionsreife.md)).
> Das Gesamturteil bleibt gültig; einzelne, seither überholte Einträge sind
> unten ausdrücklich als solche markiert.

---

## Prüfgrundlage

| Ebene | Ergebnis |
|---|---|
| `tsc --noEmit` | sauber |
| `next lint` | keine Warnungen |
| Unit-Tests | 451 / 451 *(Stand 2026-07-22; aktuell 657/657, siehe [entscheidungen-produktionsreife.md](entscheidungen-produktionsreife.md))* |
| E2E Bestellung | **21 / 21** |
| E2E Rate-Limit | **16 / 16** |
| E2E Admin-Sitzungen | **19 / 19** |
| Migrationsprüfung | 19 Migrationen, lückenlos |
| Secret-Suche | keine Zugangsdaten im Quelltext |

### Datenbank, direkt abgefragt

```
RLS                16 / 16 Tabellen
Funktionen         alle 6 vorhanden (create_order_atomic, pruefe_rate_limit,
                   raeume_rate_limit_auf, raeume_admin_sitzungen_auf,
                   ereignis_haeufungen, raeume_system_ereignisse_auf)
Steuerfelder       10 Bestellungen, 0 ohne Satz
                   5705,34 brutto = 4794,41 netto + 910,93 Steuer
Zahlungsstatus     10 × not_required (Rechnungskauf)
```

---

## Erneute Prüfung der behobenen Punkte

| Punkt | verifiziert wie | Ergebnis |
|---|---|---|
| **K1** Bestellung atomar | Wächter „genau EINE Transaktion" aktiv, kein direkter Insert in die drei Tabellen, E2E 21/21 | **hält** |
| **K2** Upload-Härtung | 29 Tests inkl. negativer Fälle, Prüfung an allen drei Speicher-Engstellen | **hält** |
| **A1** Umsatzsteuer | Summe geht auf den Cent auf, Wächter „keine zweite Steuerstelle" aktiv | **hält** |
| **H1** Admin-Auth | Wächter „nur auth.ts liest ADMIN_SECRET" und „nie ins Cookie" aktiv, E2E 19/19 | **hält** |
| **H2** Rate-Limit | E2E 16/16 inkl. Parallelität, kein zweiter Zähler im Projekt | **hält** |
| **H4** RLS | 16/16 Tabellen – die drei neuen sind korrekt dazugekommen | **hält** |
| **H5/H8** Logging, CI | Wächter „kein console.log" aktiv, beide Prüfläufe laufen | **hält** |

**Keine Regression gefunden.** Der Wächter-Bestand hat sich als tragfähig
erwiesen: Zwei der Wächter haben während der Arbeit selbst angeschlagen und
Fehler aufgedeckt (nicht durchgeführte Ersetzungen, Secret-Zugriff im
Health-Check).

### Toter Code aus den Umbauten

Gezielt gesucht nach `clientKey`, `isRateLimited`, `isAdminAuthenticated`,
`decodeDataUrl`, `euro()` – **alle entfernt**. Einzig verbliebene Erwähnung
ist ein erklärender Kommentar in `format.ts`.

---

# NEUE BEFUNDE

## N1 – `npm audit` meldet 4 hohe Schwachstellen (blockiert die CI)

Neu aufgefallen, weil die CI diese Prüfung erst seit heute enthält.

| Paket | Schwere | Weg |
|---|---|---|
| `glob` 10.3.10 | high | `eslint-config-next` → `@next/eslint-plugin-next` |
| `postcss` <8.5.10 | moderate | `next` |

**Einschätzung: nicht ausnutzbar.** Die `glob`-Lücke betrifft die
**Kommandozeile** (`-c/--cmd` führt Treffer mit `shell: true` aus). Wir
verwenden `glob` nicht als CLI, sondern als Bibliothek von ESLint – also zur
Entwicklungszeit, ohne Fremdeingaben. Beide Pakete sind Build-Abhängigkeiten
und verarbeiten keine Kundendaten zur Laufzeit.

**Aber:** Die CI schlägt bei `--audit-level=high` fehl. Drei Wege:

1. **`npm audit fix --force`** – zieht möglicherweise einen Next.js-Sprung
   nach sich. Breaking Changes vor dem Go-live sind riskant.
2. **Gezielt aktualisieren** – prüfen, ob eine neuere 14.2.x die Kette löst.
   Sauberste Variante.
3. **Ausnahme dokumentieren** – die betroffenen Berater in der CI
   ausschließen, mit Begründung und Wiedervorlage.

**Empfehlung: Weg 2, ersatzweise 3.** Nicht vor dem Go-live erzwingen –
aber auch nicht stillschweigend ignorieren.

## N2 – Z1 aus dem Stripe-Review — ERLEDIGT (2026-07-23)

Die Phase-2-Weiche steht. `orders.ts` ruft `schliesseBestellungAb()` nur noch
bei Rechnungskauf sofort auf; bei Vorabzahlung (`brauchtVorabZahlung`) kehrt
`submitOrder` nach Phase 1 zurück, und erst der Bestätigungs-Webhook stößt
Phase 2 an. Ein Wächter-Test verhindert den Rückfall auf den bedingungslosen
Aufruf. Damit ist der frühere Blocker beim Aktivieren von Stripe aufgelöst;
die vollständige Stripe-Integration ist im Testmodus nachgewiesen (31/31,
[stripe-e2e-nachweis.md](stripe-e2e-nachweis.md)).

## N3 – 16 verwaiste Dateiordner, 10 MB

Reste aus Testläufen. Der Aufräumlauf erkennt sie korrekt, hat aber nichts
gelöscht – er wartet auf ausdrückliche Freigabe. Unkritisch, aber vor dem
Start sauber zu machen.

## N4 – Noch 98 unstrukturierte Protokollaufrufe

Die kritischen Pfade (Bestellung, Upload, E-Mail, Cron) sind umgestellt. Der
Rest gibt weiterhin Freitext ohne Anfrage-Kennung aus. Kein Risiko, aber die
Fehlersuche ist dort mühsamer.

---

# GO-LIVE-CHECKLISTE

## ✅ Erledigt

| | Nachweis |
|---|---|
| Bestellung entsteht atomar (K1) | Rollback nachgewiesen, Wächter aktiv |
| Uploads geprüft: Signatur, Größe, Abmessungen (K2) | 29 Tests, überwiegend negativ |
| Pfadmanipulation an allen Engstellen abgewehrt (B6) | Wächter + Tests |
| Umsatzsteuer vollständig (A1) | Summe geht auf den Cent auf |
| Admin-Sitzungen serverseitig, Secret nie im Cookie (H1) | 19/19 E2E, 2 Wächter |
| Rate-Limit zentral, atomar, alle Endpunkte (H2) | 16/16 E2E inkl. Parallelität |
| RLS auf allen Tabellen (H4) | 16/16 abgefragt |
| Strukturiertes Logging mit PII-Bereinigung (H5) | 18 Tests |
| Systemereignisse + Häufungserkennung | gegen echte DB geprüft |
| Health-Check ohne Informationsleck | `/api/health` |
| CI mit 7 Prüfschritten (H8) | Workflow vorhanden |
| Cron: Query-Secret entfernt, zeitkonstant | Wächter aktiv |
| Wartung (3 Aufräumläufe) an der Cron-Route | eingehängt |

## 🔴 Vor Go-live erforderlich

| | Aufwand | warum blockierend |
|---|---|---|
| **Rechtstexte vervollständigen (H7)** – USt-IdNr., Hosting-Anbieter, Supabase-Region | 1 h, sobald Angaben da | Impressumspflicht, DSGVO-Informationspflicht |
| **DSGVO-Löschkonzept (H6)** – Aufbewahrungsfrist, Anonymisierung, Auskunftsprozess | 1 Tag | rechtlich erforderlich, sobald echte Kundendaten verarbeitet werden |
| **Verkaufspreise freigeben (M6)** – Stichsatz und Gewinnsatz entscheiden | Ihre Entscheidung | ohne entschiedene Preise kein Verkauf |
| **Lieferländer begrenzen (M7)** – auf Deutschland, oder EU-Steuersätze ergänzen | 1 h | 26 EU-Länder wählbar, gerechnet wird mit 19 % |
| **Steuerausweis in Bestätigung und Adminansicht** | 4 h | die Bestätigung ist bei Rechnungskauf faktisch der Beleg |
| **Umgebungsvariablen produktiv setzen und prüfen** | 1 h | `/api/health` beantwortet das |
| **N3 – verwaiste Dateien entfernen** | 5 min | Ihre Freigabe genügt |
| **Backup erproben (M5)** – Tarif prüfen, Rückspielung testen | halber Tag | ein nie zurückgespieltes Backup ist keines |

**Summe: rund 2 Arbeitstage** plus Ihre Entscheidungen.

## 🟡 Kann nach Go-live erfolgen

| | warum aufschiebbar |
|---|---|
| **Stripe (K3)** inkl. Z1, Z2, Z5, Z6 | **Code erledigt + im Testmodus nachgewiesen** (31/31, [stripe-e2e-nachweis.md](stripe-e2e-nachweis.md)). Für Live nur noch Live-Schlüssel + registrierter Webhook-Endpunkt. |
| **N1 – Schwachstellen der Build-Kette** | nicht ausnutzbar, betrifft keine Laufzeit. Nächstes Wartungsfenster. |
| **N4 – restliche Protokollaufrufe** | mechanische Arbeit, kein Risiko |
| Sitzungsübersicht im Adminbereich | Funktionen fertig, nur Darstellung fehlt |
| Auswertungsansicht für Systemereignisse | Abfragen fertig |
| **M1** Paginierung der Adminliste | bei 200 Bestellungen unkritisch |
| **M2** Tests für `lib/actions` | E2E deckt den Pfad ab |
| **M3** Zod-Schemata | handgeschriebene Prüfung funktioniert |
| **M4** Indizes auf `orders(email)` | bei 10 Zeilen belanglos |
| **B2** Kundenkonto | *(Stand 2026-07-22: bewusste Entscheidung gegen ein Konto)* – inzwischen **additiv umgesetzt** (Registrierung/Login, Profil, Adressbuch, Bestellhistorie; Gastkauf bleibt vollständig erhalten), siehe [entscheidungen-produktionsreife.md](entscheidungen-produktionsreife.md) Abschnitt 5 |
| **N4** Accessibility-Audit | mittelfristig relevant |
| Automatische Benachrichtigung bei Häufungen | Erkennung steht, nur die Zustellung fehlt |

---

## Gesamturteil

**Freigabefähig nach Abarbeitung der roten Liste.**

Die drei kritischen Befunde des Audits vom selben Tag – Bestellung ohne
Transaktion, ungeprüfte Uploads, Secret als Cookie – sind behoben und
nachgewiesen. Was in der roten Liste verbleibt, ist überwiegend
**rechtlicher und geschäftlicher Natur** (Impressum, DSGVO, Preise), nicht
technischer.

Der einzige technische Punkt mit Substanz ist die Backup-Erprobung. Ein
Backup, das nie zurückgespielt wurde, ist eine Annahme, keine Sicherung –
und das ist der einzige Fehler in dieser Liste, der nicht behebbar wäre,
wenn er einträte.
