# Bekleidungskonfigurator

2D-Live-Konfigurator für personalisierte Firmen-/Arbeitsbekleidung.
Details zur Architektur: siehe [ARCHITECTURE.md](./ARCHITECTURE.md).

## Seite lokal öffnen (Terminal-Befehle)

```bash
# 1. In den Projektordner wechseln (Pfad ggf. anpassen)
cd konfigurator

# 2. Abhängigkeiten installieren (einmalig, dauert etwas)
npm install

# 3. .env.local anlegen und mit Supabase-Zugangsdaten füllen
cp .env.local.example .env.local

# 4. Dev-Server starten
npm run dev
```

Danach im Browser öffnen: **http://localhost:3000**
Der Server läuft, solange das Terminal-Fenster offen bleibt. Beenden mit `Strg + C`.

> Hinweis: Schritt 3 ist nur nötig, sobald Supabase-Anfragen genutzt werden.
> Das aktuelle Grundgerüst (`page.tsx`) zeigt auch ohne gültige Zugangsdaten
> schon das Layout an.

## Vollständige Ersteinrichtung (inkl. Datenbank)

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Neues Supabase-Projekt erstellen (falls noch nicht vorhanden), dann Migration einspielen:
   ```bash
   npx supabase login
   npx supabase link --project-ref DEIN-PROJEKT-REF
   npx supabase db push
   ```
   Das legt alle Tabellen aus `supabase/migrations/0001_init.sql` an.

3. `.env.local.example` zu `.env.local` kopieren und mit den Supabase-Zugangsdaten füllen.

4. Dev-Server starten:
   ```bash
   npm run dev
   ```
   Öffnet direkt den Konfigurator unter `http://localhost:3000`.

## Echte Produktbilder einbinden

Der Konfigurator verwendet aktuell eine einzige Platzhalter-Grafik
(`public/products/hoodie-black/*.svg`). Sobald echte, freigestellte
Produktfotos vorliegen (Textilgroßhändler, eigenes Fotoshooting, o.ä.):

1. Bilder ablegen unter `public/products/<produkt>/<farbe>/{front,back,sleeve-left,sleeve-right}.png`
   (freigestellt/transparenter Hintergrund empfohlen).
2. Pfade in `src/config/products.ts` (`images`-Feld je Farbe) darauf verweisen lassen.

Kein anderer Teil des Konfigurators (Canvas, Druckbereichs-Logik, Preisberechnung)
muss dafür geändert werden.

## Nächste Schritte (Umsetzungsreihenfolge)

Siehe Abschnitt 5 in [ARCHITECTURE.md](./ARCHITECTURE.md) – als Nächstes folgt
die Produktauswahl (Kleidungsstück → Marke → Farbe → Größe), danach der
Konva-Canvas mit Logo-/Text-Platzierung.
