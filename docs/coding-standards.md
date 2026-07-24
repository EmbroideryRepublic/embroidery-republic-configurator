# Coding-Standards

Die tragenden Architekturprinzipien (Server als Wahrheit, Fail-fast,
Phasentrennung, keine Doppellogik) stehen in [architektur.md](architektur.md)
§4. Dieses Dokument ergänzt die praktischen Konventionen.

## Sprache & Benennung

- **TypeScript strict.** Kein `any` auf Verdacht; lieber ein präziser Typ oder
  ein Fail-fast.
- Neuere Domänen-/Fachlogik ist **deutschsprachig benannt** (`baueBaum`,
  `passendeFarbe`, `naechsterSchritt`) – näher an der Fachsprache des Betriebs.
  Ältere/technische Teile sind teils englisch; beides existiert bewusst
  nebeneinander, innerhalb einer Datei aber konsistent.
- Kommentare erklären das **Warum**, nicht das Was – besonders dort, wo eine
  nicht offensichtliche Entscheidung getroffen wurde.

## Reine Logik getrennt von Darstellung

Fachlogik lebt in `src/lib/**` als **reine Funktionen** (keine React-Hooks, kein
Store-Zugriff) und ist dadurch mit `node:test` testbar. Die Komponente in
`src/components/**` macht nur Darstellung und Bedienung. Beispiele:
`lib/configurator/produktbaum.ts` ↔ `components/configurator/ProduktBrowser.tsx`,
`lib/configurator/uebernahme.ts`, `lib/configurator/kauffortschritt.ts`.

## Eine Berechnung, ein Ort

Keine Doppellogik. Wiederkehrende Werte haben **eine** Quelle – z. B. die
Konfektionsreihenfolge in
[config/products/groessen.ts](../src/config/products/groessen.ts), die
Positionen in [config/decorationPositions.ts](../src/config/decorationPositions.ts),
Geldformatierung ausschließlich über `formatiereGeld()` in `lib/format.ts`.

## Wächter-Tests

Manche Tests durchsuchen den Quellcode nach verbotenen Mustern (z. B. eine
zweite Geldformatierung, hartkodierte Farbnamen). Sie verhindern, dass eine
zentrale Regel schleichend umgangen wird. Beim Erweitern nicht deaktivieren –
die Ursache beheben.

## Der Verifikationszyklus

Jede größere Änderung endet **grün** über die volle Kette:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm test            # Unit-Tests (node:test), aktuell 521
npm run build       # next build
npm run test:e2e    # echte Bestellstrecke (Testmodus, siehe unten)
```

Weitere E2E-Läufe: `test:e2e:zahlung`, `test:e2e:stripe`,
`test:e2e:ratelimit`, `test:e2e:adminauth`.

## E2E-Testmodus

`npm run test:e2e` fährt den **echten** Serverpfad; E-Mail-Versand,
Datei-Uploads und Lieferantenaufträge werden abgefangen (lokale Testablage) und
die Testbestellung am Ende gelöscht. Ein reiner Browsertest beweist nichts – die
Kaufstrecke muss durch den echten Pfad laufen.

## Migrationen gelten erst nach dem Anwenden

Eine Migrationsdatei zu schreiben genügt nicht: Sie muss **angewandt und
verifiziert** sein, sonst bricht der Bestellprozess. Siehe
[datenbankschema.md](datenbankschema.md) und `supabase/migrations/`.

## Dev-Server

Der Konfigurator-Dev-Server läuft auf **Port 3007** (3000/3001 gehören einem
anderen Projekt). Nach einem `next build`, der `.next` überschreibt, muss ein
laufender Dev-Server sauber neu gestartet werden (sonst 404 auf Chunks).
