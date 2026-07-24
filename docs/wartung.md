# Wartung und Updates

Was in welchem Turnus zu tun ist, damit das System nicht schleichend veraltet –
und wie ein Update abläuft, ohne den Betrieb zu gefährden.

---

## Turnus auf einen Blick

| Wann | Aufgabe | Befehl / Ort |
|---|---|---|
| **monatlich** | Verwaiste Dateien entfernen | `npm run dateien:pruefen -- --loeschen` |
| **monatlich** | `npm audit` sichten und bewerten | `npm audit --omit=dev` |
| **monatlich** | Speicher- und Datenbankverbrauch prüfen (Freitarif: 1 GB / 500 MB) | Supabase-Dashboard |
| **quartalsweise** | Abhängigkeiten aktualisieren (siehe unten) | `npm outdated` |
| **quartalsweise** | Restore-Drill durchführen | [restore-drill.md](restore-drill.md) |
| **jährlich** | Rechtstexte prüfen lassen (AGB, Datenschutz, Impressum) | extern |
| **jährlich** | Preise gegen Einkaufspreise gegenrechnen | `npm run ek:pruefen` |

---

## Abhängigkeiten aktualisieren

### Grundregel

**Eine Sorte Änderung pro Durchgang.** Erst Patch-Updates, verifizieren,
ausliefern. Dann Minor. Major nur einzeln und mit eigener Prüfung. Wer alles auf
einmal aktualisiert, weiß bei einem Fehler nicht, welches Paket schuld ist.

### Ablauf

```bash
npm outdated                 # Überblick
npm update                   # Patch/Minor im erlaubten Bereich
npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e
```

Erst wenn alles grün ist, ausliefern.

### Pakete mit Sonderbehandlung

| Paket | Warum heikel |
|---|---|
| **next** | Ein Sprung auf 15 bricht die Konva-Leinwand des Konfigurators (belegt, siehe [next-upgrade-entscheidung.md](next-upgrade-entscheidung.md)). Nur als eigenes Vorhaben mit vollem Regressionslauf. |
| **konva / react-konva** | Herzstück des Konfigurators. Version an React gekoppelt – react-konva 19 verlangt React 19. |
| **pdfjs-dist** | Nach jedem Update die Worker-Kopie erneuern (siehe unten), sonst bricht der PDF-Upload. |
| **@resvg/resvg-js** | Native Binärdatei; in `next.config.js` als externes Serverpaket geführt. |
| **stripe** | Vor dem Update `npm run test:e2e:stripe` gegen das Testkonto laufen lassen. |

### pdfjs-dist: Worker mitziehen

Der pdf.js-Worker wird **nicht** von einem CDN geladen, sondern liegt als Kopie
unter `public/pdf.worker.min.mjs`. Nach jedem Update von `pdfjs-dist`:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
npm test    # der Wächter-Test vergleicht beide Dateien
```

Wird das vergessen, schlägt `src/lib/upload/__tests__/pdfWorker.test.ts` an –
absichtlich, denn genau dieser Fehler hatte den PDF-Upload schon einmal
unbemerkt lahmgelegt (die CDN-Adresse zeigte auf eine Datei, die es nicht mehr
gab).

---

## Sicherheitsmeldungen bewerten

`npm audit` meldet auch Schwachstellen, die dieses Projekt nicht betreffen.
Nicht blind `--force` ausführen – das zieht Breaking Changes nach.

**Bewertungsfragen:**
1. Ist das Paket zur **Laufzeit** im Einsatz oder nur beim Bauen?
2. Kann ein Angreifer die betroffene Eingabe überhaupt liefern?
3. Was kostet die Behebung – Patch oder Major-Sprung?

**Aktuell bekannt und bewertet:** Zwei Meldungen hoher Stufe in `postcss`
(bereitgestellt über `next`). Beide setzen voraus, dass **fremdes CSS**
verarbeitet wird – hier wird ausschließlich eigenes CSS zur Bauzeit übersetzt.
Praktische Betroffenheit: keine. Die Behebung erforderte einen Next-Major-Sprung,
der die Konfigurator-Leinwand bricht. Bewusst zurückgestellt, erneut bewerten,
sobald das Next-Upgrade ansteht.

---

## Migrationen

Datei schreiben genügt nicht – eine Migration zählt erst als angewendet, wenn
sie ausgeführt **und** verifiziert wurde.

```bash
node scripts/applyMigration.mjs supabase/migrations/00XX_name.sql
node scripts/pruefeMigrationen.mjs
```

Vor jeder Migration, die Daten verändert: **Sicherung anlegen.** Bei Migrationen,
die Spalten entfernen oder Typen ändern, zusätzlich vorher den Restore-Drill
durchspielen – nicht danach.

---

## Vor jeder Auslieferung

Kurze Liste, die den Großteil der Fehler abfängt:

- [ ] `npm run typecheck` – 0 Fehler
- [ ] `npm run lint` – 0 Fehler
- [ ] `npm test` – alle Tests grün
- [ ] `npm run build` – erfolgreich, keine Metadaten-Warnungen
- [ ] `npm run test:e2e` – Bestellstrecke grün
- [ ] Neue Umgebungsvariablen in Vercel gesetzt **und** in
      `.env.local.example` dokumentiert
- [ ] Migrationen angewendet und verifiziert
- [ ] Bei DNS-/Mail-Änderungen: `node scripts/pruefeDns.mjs`

Nach der Auslieferung: Health-Check aufrufen und eine Seite im Browser öffnen.
Ein grüner Build ist kein Beweis dafür, dass die Seite läuft.
