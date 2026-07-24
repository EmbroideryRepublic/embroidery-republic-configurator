# Deployment, Backup und Cronjobs

Auslieferung, Datensicherung und Hintergrundläufe. Stand 2026-07-22.

Voraussetzungen: [umgebungsvariablen.md](umgebungsvariablen.md),
[datenbankschema.md](datenbankschema.md).

---

## 1. Auslieferungsablauf

### Vor jeder Auslieferung – lokal

Die CI (siehe unten) deckt das Meiste ab, aber zwei Dinge laufen bewusst nur
lokal. Die vollständige Abnahme:

```bash
npx tsc --noEmit          # Typen
npx next lint             # Stil
npm test                  # 451 Unit-Tests inkl. Wächter
npx next build            # Build-Prüfung

# E2E gegen die echte Datenbank – NUR lokal (Begründung unten)
npm run test:e2e            # Bestellung über den echten Serverweg
npm run test:e2e:ratelimit
npm run test:e2e:adminauth
```

Erst wenn alles grün ist, wird ausgeliefert.

### Migrationen anwenden

**Eine Migration gilt erst als angewendet, wenn sie ausgeführt UND verifiziert
ist.** Diese Regel ist teuer erkauft: Migration 0011 wurde wochenlang nicht
angewendet und hat jeden Bestellvorgang gebrochen, während die Tests grün
liefen (die QA-Skripte fingen die Requests ab und erreichten den echten
Serverweg nie).

```bash
# 1. Trockenlauf – zeigt Vorher/Nachher, rollt zurück, ändert nichts
node scripts/applyMigration.mjs supabase/migrations/00XX_name.sql --dry

# 2. Anwenden – mit Bestandsvergleich
node scripts/applyMigration.mjs supabase/migrations/00XX_name.sql

# 3. Verifizieren – gegen die DB abfragen, dass die Struktur wirklich da ist
```

`applyMigration.mjs` führt die Migration in einer Transaktion aus und
vergleicht den Datenbestand vorher/nachher. Ein unerwarteter Verlust fällt
sofort auf.

### Reihenfolge einer Auslieferung mit Schemaänderung

```
1. Migration lokal: Trockenlauf → anwenden → verifizieren
2. Vollständige Abnahme (siehe oben), inkl. E2E
3. Code ausliefern
4. Umgebungsvariablen prüfen: GET /api/health
```

Schritt 4 ist der schnellste Weg zur Frage „läuft alles?": Der Health-Check
prüft Datenbank, Speicher und Pflichtvariablen (siehe
[betriebsbeobachtung.md](betriebsbeobachtung.md)).

---

## 2. Continuous Integration

`.github/workflows/pruefung.yml`, bei jedem Push und Pull Request:

| Schritt | blockiert bei Fehler? |
|---|---|
| `tsc --noEmit` | ja |
| `next lint` | ja |
| `npm test` | ja |
| `next build` | ja |
| `npm audit --audit-level=high` | ja |
| `pruefeSecrets.mjs` (Schlüsselmuster) | ja |
| `pruefeMigrationen.mjs` (Nummernfolge) | ja |

### Was bewusst NICHT in die CI geht

**Die E2E-Läufe.** Sie brauchen Datenbankzugang, und der einzige verfügbare
ist die Produktivdatenbank. Bei jedem Push dort Testdaten anzulegen ist ein
Risiko, das der Nutzen nicht rechtfertigt – die Läufe räumen zwar selbst auf,
aber ein Abbruch mitten drin hinterließe Reste. Die CI weist in ihrer
Zusammenfassung auf die lokalen Schritte hin.

**Das Anwenden von Migrationen.** Die CI prüft nur die Struktur der Dateien.
Das Anwenden bleibt der bewusste Schritt mit Trockenlauf – siehe die Lehre
aus 0011 oben.

> **CI-Befund (N1) – korrigiert am 2026-07-23:** Die frühere Einschätzung
> („nur Bauzeit-Abhängigkeiten glob/postcss, nicht ausnutzbar") war **falsch**.
> `npm audit --audit-level=high` meldet vier hohe **Next.js-Laufzeit**-Advisories;
> der Schritt schlägt fehl (Exit 1).
>
> Die vollständige Analyse steht in
> **[next-upgrade-entscheidung.md](next-upgrade-entscheidung.md)**: Der Großteil
> der Advisories ist für dieses Projekt nachweislich **nicht anwendbar**; das
> anwendbare Restrisiko ist überwiegend DoS. Ein Upgrade auf `next@15.5.21`
> schließt alle Advisories, **bricht aber den Konfigurator** (react-konva 18 vs.
> React 19) und wurde deshalb für v1.0 bewusst zurückgestellt.
>
> **Bis zum Upgrade gilt der Audit-Schritt als datierte, begründete Ausnahme** –
> mit obigem Dokument als Begründung, nicht stillschweigend übergangen.

---

## 3. Cronjobs

Es gibt **eine** geplante Route:
`/api/cron/process-supplier-orders`

### Vercel Cron (Produktion)

Der Zeitplan liegt in **`vercel.json`** und wird von **Vercel Cron** nativ
ausgeführt – keine externe Infrastruktur:

```json
{
  "crons": [
    { "path": "/api/cron/process-supplier-orders", "schedule": "*/5 * * * *" }
  ]
}
```

**Absicherung:** Die Route prüft `Authorization: Bearer <CRON_SECRET>`
(zeitkonstant). Vercel fügt diesen Header **automatisch** hinzu, sobald die
Umgebungsvariable `CRON_SECRET` im Vercel-Projekt (Production) gesetzt ist –
deshalb ist keine Zusatzkonfiguration im Cron-Eintrag nötig. Ohne gesetztes
`CRON_SECRET` liefert die Route bewusst 503, bei falschem/fehlendem Header 401.
Der frühere Query-Parameter-Weg ist entfallen (Fund aus H1: Query-Parameter
landen in Protokollen und Historie).

Manueller Test (identischer Weg):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<domain>/api/cron/process-supplier-orders
```

**Tarif-Hinweis (wichtig):** Minutengenaue Zeitpläne wie `*/5` setzen den
**Vercel-Pro-Plan** voraus. Auf dem Hobby-Plan sind Cron-Jobs auf **einmal
täglich** begrenzt – das genügt weder der zeitnahen Lieferantenverarbeitung noch
der Freigabe hängender Phase-2-Ansprüche (Schwelle 15 min) und ist für v1.0
ungeeignet. **Empfehlung v1.0: Pro-Plan, alle 5 Minuten** (`*/5 * * * *`); das
passt zur 15-min-Schwelle (ein freigegebener Anspruch wird beim nächsten Lauf
übernommen) und hält Zahlungsverfall und Lieferantenlauf zeitnah. `*/10` oder
`*/15` sind vertretbare, sparsamere Alternativen – täglich ist es nicht.

Die Route erledigt zwei Dinge:

1. **Fällige Lieferantenbestellungen verarbeiten** und verwaiste Sperren
   zurücksetzen (der eigentliche Zweck).
2. **Wartung** – nach der Hauptaufgabe, einzeln abgefangen, damit ein
   misslungener Aufräumlauf die Verarbeitung nicht entwertet:

   | Aufräum-/Wartungsfunktion | Wirkung |
   |---|---|
   | `raeume_rate_limit_auf()` | Rate-Limit-Fenster > 24 h entfernen |
   | `raeume_admin_sitzungen_auf()` | Sitzungen > 7 Tage nach Ablauf entfernen |
   | `raeume_system_ereignisse_auf()` | Ereignisse > 90 Tage entfernen |
   | `verfalle_offene_zahlungen(24h)` | offene Zahlungen nach Frist auf `failed` (Z3) |
   | `gib_haengende_abschluesse_frei(15min)` | verwaiste Phase-2-Ansprüche freigeben (Z5) |

Ohne diese Läufe wüchsen die Betriebstabellen unbegrenzt, offene Zahlungen
verfielen nie und ein mitten in Phase 2 abgestürzter Abschluss bliebe hängen.

### Nicht-automatisierte Wartung

| Aufgabe | Werkzeug | wann |
|---|---|---|
| Verwaiste Upload-Dateien | `npm run dateien:pruefen` (Trockenlauf), `-- --loeschen` | gelegentlich |
| Einkaufspreise prüfen | `npm run ek:pruefen` | bei Katalogänderung |
| Preisvergleich | `npm run preis:vergleich` | vor Preisentscheidungen |

---

## 4. Backup und Restore

Die Datensicherung liegt bei Supabase (Postgres) und dem Storage-Bucket.

> **Offener Punkt (Audit M5):** Ob der gewählte Tarif automatische
> Sicherungen in ausreichender Frequenz leistet und ob eine
> Wiederherstellung tatsächlich funktioniert, ist **nie erprobt worden**. Ein
> nie zurückgespieltes Backup ist eine Annahme, keine Sicherung. Dies ist der
> einzige technische Punkt der Go-live-Checkliste, der nicht mehr behebbar
> wäre, wenn er im Ernstfall verließe.

### Restore-Test vor dem Go-live

> **Vollständige, reproduzierbare Anleitung: [restore-drill.md](restore-drill.md)**
> – Dump → separates Test-Projekt → Restore → automatische Verifikation
> (`scripts/restoreDrillFingerprint.mjs` + `scripts/restoreDrillVergleich.mjs`),
> inkl. Erfolgskriterien, Fehlerquellen, Rollback-Plan und Protokoll-Vorlage.
> Die Prüfskripte sind read-only gegen Produktion validiert (Selbsttest grün);
> es fehlt nur die einmalige echte Ausführung (Go-live-Blocker B3).

Kurzfassung:

```
1. Supabase-Tarif prüfen: Point-in-Time-Recovery oder tägliche Sicherung?
2. Baseline-Fingerprint der Produktion erfassen (read-only).
3. Separates Test-Projekt anlegen, Dump dort einspielen.
4. Restore-Fingerprint erfassen und gegen die Baseline vergleichen:
   alle Tabellen/Funktionen/Indizes/Policies/Grants/Buckets, Zeilenzahlen,
   Integrität und B1-Härtung müssen übereinstimmen (Skript liefert BESTANDEN/FAIL).
5. Ergebnis und Wiederherstellungsdauer dokumentieren (Protokoll-Vorlage).
```

### Was gesichert werden muss

| Bestandteil | wo |
|---|---|
| Datenbank | Supabase Postgres (Katalog, Bestellungen, Betrieb) |
| Kundendateien | Storage-Bucket `production-files` (Logos, Produktionsblätter) |
| Umgebungsvariablen | außerhalb der DB – separat und sicher hinterlegen |
| Migrationen, Code | Git-Repository |

Die Umgebungsvariablen sind der leicht übersehene Teil: Ohne sie ist eine
wiederhergestellte Datenbank nutzlos, weil `SUPABASE_SECRET_KEY`,
`ADMIN_SECRET` und `ORDER_TOKEN_SECRET` nirgends im Backup stehen (und dort
auch nicht hingehören).

---

## 5. Fehlerbehandlung im Betrieb

| Frage | Antwort über |
|---|---|
| Läuft das System? | `GET /api/health` |
| Wo treten Fehler auf? | strukturierte Logs (Kategorie, Schwere, Anfrage-ID) |
| Seit wann? | Tabelle `system_ereignisse` |
| Häuft sich etwas? | `ereignis_haeufungen()` |
| Was geschah bei Bestellung X? | Logs und `order_events` nach Bestellnummer |

Alles in [betriebsbeobachtung.md](betriebsbeobachtung.md).
