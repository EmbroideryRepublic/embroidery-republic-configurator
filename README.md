# Embroidery Republic

Webshop mit 2D-Live-Konfigurator für personalisierte Textilien
(T-Shirts, Hoodies, Polos …). Next.js 14 · TypeScript · Supabase.

## Dokumentation

**Der Einstieg für Entwickler ist [docs/README.md](docs/README.md)** – die
Landkarte der gesamten technischen Dokumentation mit Lesereihenfolge,
Themenverzeichnis und den begründeten Architekturentscheidungen.

Am schnellsten hinein:

| Ich will … | Dokument |
|---|---|
| das große Bild | [docs/architektur.md](docs/architektur.md) |
| verstehen, wie eine Bestellung läuft | [docs/bestellablauf.md](docs/bestellablauf.md) |
| das Datenbankschema | [docs/datenbankschema.md](docs/datenbankschema.md) |
| ausliefern / sichern | [docs/deployment.md](docs/deployment.md) |
| den Freigabestand | [docs/go-live-checkliste.md](docs/go-live-checkliste.md) |

## Lokal starten

```bash
npm install
# .env.local anlegen – siehe docs/umgebungsvariablen.md
npm run dev
```

Der Entwicklungsserver läuft auf **http://localhost:3007**. Beenden mit
`Strg + C`.

## Abnahme vor jeder Auslieferung

```bash
npx tsc --noEmit && npx next lint && npm test
```

Zusätzlich die E2E-Läufe gegen die echte Datenbank – siehe
[docs/deployment.md](docs/deployment.md).

---

*Die frühere `ARCHITECTURE.md` ist überholt; maßgeblich ist
[docs/architektur.md](docs/architektur.md).*
