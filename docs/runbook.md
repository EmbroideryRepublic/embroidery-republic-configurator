# Runbook – laufender Betrieb

Für die Person, die den Shop betreibt. Nachschlagewerk bei Störungen und für
wiederkehrende Aufgaben. Die Fälle unten sind **tatsächlich aufgetretene**
Störungen dieses Projekts, keine erfundenen Beispiele.

Verwandte Dokumente: [deployment.md](deployment.md) (Auslieferung),
[incident-prozess.md](incident-prozess.md) (Vorgehen im Ernstfall),
[restore-drill.md](restore-drill.md) (Wiederherstellung),
[wartung.md](wartung.md) (Updates und Turnus).

---

## 1. Erste Orientierung bei „irgendetwas geht nicht"

Immer in dieser Reihenfolge – von außen nach innen:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/health
```

| Antwort | Bedeutung | Weiter bei |
|---|---|---|
| `200` | System läuft, alle Bausteine `ok` oder `beeintraechtigt` | Abschnitt 3 (Einzelfälle) |
| `503` | mindestens ein Baustein `kritisch` | Abschnitt 2 |
| keine Antwort / Zeitüberschreitung | Hosting oder DNS | Abschnitt 2.4 |

Die ausführliche Antwort (`/api/health?detail=1`) gibt es nur angemeldet – sie
nennt Fehlermeldungen, die öffentlich ein Informationsleck wären.

---

## 2. Kritische Störungen

### 2.1 Datenbank nicht erreichbar

**Erkennbar an:** Health-Check `503`, Bestellungen schlagen fehl, Adminbereich
leer.

**Prüfen:**
```bash
node scripts/pruefeMigrationen.mjs      # verbindet sich und listet den Stand
```

**Häufigste Ursachen:**
- Supabase-Projekt pausiert (kostenloser Tarif pausiert nach Inaktivität) →
  im Supabase-Dashboard wieder starten.
- Verbindungslimit erschöpft → im Dashboard unter *Database → Connection
  pooling* prüfen.
- Zugangsdaten rotiert, aber in Vercel nicht nachgezogen.

**Wichtig:** Solange die Datenbank fehlt, nimmt der Shop **keine** Bestellungen
an – das ist gewollt (Fail-fast). Es entsteht kein halber Datensatz.

### 2.2 Bestellungen kommen an, aber es gehen keine E-Mails raus

**Erkennbar an:** Bestellung liegt in der Datenbank, Kundschaft meldet fehlende
Bestätigung.

**Prüfen, in dieser Reihenfolge:**
1. `RESEND_API_KEY` in Vercel gesetzt? Ohne ihn protokolliert der Server
   `[email] RESEND_API_KEY fehlt` und **überspringt** den Versand, ohne die
   Bestellung scheitern zu lassen (bewusst – eine Bestellung geht nicht
   verloren, weil eine Mail hakt).
2. `EMAIL_TEST_MODE` – steht der Wert exakt auf `false`? Jeder andere Wert
   (auch `FALSE` oder `0`) hält den Testmodus **an**, Mails gehen dann an
   `EMAIL_TEST_RECIPIENT` statt an die Kundschaft. Abgesichert durch
   `src/lib/email/__tests__/adressen.test.ts`.
3. Domain bei Resend noch verifiziert? DNS prüfen:
   ```bash
   node scripts/pruefeDns.mjs
   ```
4. Resend-Dashboard: Status der Nachricht (*Delivered* / *Bounced*).

### 2.3 Preise falsch oder Bestellung nicht möglich

Der Preis wird **serverseitig** berechnet; Client-Werte werden ignoriert. Meldet
die Oberfläche „Der Preis konnte nicht vollständig berechnet werden", fehlt ein
Preisbaustein (Fail-fast statt geratener Wert).

**Prüfen:** `docs/kalkulationsmodell.md`, dann `src/config/pricing/`. Eine
fehlende Regel für eine Veredelungsart oder ein fehlender Steuersatz ist die
übliche Ursache.

### 2.4 Seite nicht erreichbar

- Vercel-Dashboard → *Deployments*: letzter Build erfolgreich?
- Bricht der Build mit `NEXT_PUBLIC_SITE_URL ist nicht gesetzt` ab, ist das
  **Absicht** (siehe `src/lib/seo/basisUrl.ts`): Ohne diese Variable enthielten
  Sitemap, Canonicals und strukturierte Daten localhost-Adressen. Variable in
  Vercel setzen und neu ausliefern.
- **HSTS beachten:** Der Header steht auf zwei Jahre mit `preload`. Browser, die
  die Domain einmal besucht haben, verweigern HTTP. Ein Zurückschalten auf
  HTTP ist praktisch nicht möglich – HTTPS muss laufen.

---

## 3. Wiederkehrende Aufgaben

### 3.1 Verwaiste Dateien aufräumen

Uploads liegen vor der Bestelltransaktion. Bricht sie ab, bleiben Dateien ohne
Bestellung zurück – kein Datenverlust, nur belegter Speicher.

```bash
npm run dateien:pruefen                 # nur melden
npm run dateien:pruefen -- --loeschen   # entfernen
```

Gelöscht wird nur, was **keiner** Bestellung zugeordnet und **älter als 48 h**
ist. Turnus: monatlich, oder wenn der Supabase-Speicher knapp wird (kostenloser
Tarif: 1 GB).

### 3.2 Migration anwenden

Eine Migrationsdatei zu schreiben genügt **nicht**. Sie gilt erst als
angewendet, wenn sie ausgeführt **und** verifiziert wurde.

```bash
node scripts/applyMigration.mjs supabase/migrations/00XX_name.sql
node scripts/pruefeMigrationen.mjs      # Gegenprobe
```

### 3.3 Lieferantenbestellung auslösen

Der gelebte Weg ist **manuell**: Adminbereich → Bestellung → Abschnitt
„Lieferanten-Bestellung" → Direktlink zum Lieferanten, danach „als bestellt
markieren". Details: [manueller-lieferantenprozess.md](manueller-lieferantenprozess.md).

### 3.4 Testbestellungen entfernen

Nur nach ausdrücklicher Freigabe und **immer** mit Sicherung zuerst:

```bash
node scripts/entferneTestbestellungen.mjs sicherung.json          # Probelauf
node scripts/entferneTestbestellungen.mjs sicherung.json --wirklich
npm run dateien:pruefen -- --loeschen                             # Dateien danach
```

Das Skript bricht ab, wenn die gefundene Anzahl von der erwarteten abweicht
oder ein geschützter Name getroffen würde. Die Sicherungsdatei enthält
**Kundendaten** und ist über `.gitignore` von der Versionierung ausgeschlossen.

---

## 4. Entwicklungsumgebung

| Punkt | Wert |
|---|---|
| Dev-Server | Port **3007** (`npx next dev -p 3007`). 3000/3001 gehören einem anderen Projekt |
| Voller Prüflauf | `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e` |
| Nach `next build` | Ein parallel laufender Dev-Server liefert danach 404 auf seine Chunks – sauber neu starten |

**Bekannte Stolperstelle:** `npm run build` überschreibt `.next`. Läuft
gleichzeitig ein Dev-Server, bricht dessen Auslieferung. Lösung: Dev-Server
beenden, `.next` löschen, neu starten.

---

## 5. Was NICHT angefasst werden darf

- **Der Konfigurator ist Version 1.0 und eingefroren.** Nur Bugs, Security,
  Performance und Browserprobleme – keine Features. Siehe
  [konfigurator-logik.md](konfigurator-logik.md).
- **`public/products/`** – die Katalogbilder. Der Konfigurator rechnet mit
  ihnen (Bildkontur, Druckflächen). Freistellungen für die Startseite liegen
  getrennt unter `public/buehne/`.
- **`public/pdf.worker.min.mjs`** – Kopie aus `pdfjs-dist`. Nicht von Hand
  ändern; bei einem Paket-Update neu kopieren (siehe [wartung.md](wartung.md)).
