# Bekleidungskonfigurator – Architektur

## 1. Tech-Stack

| Bereich          | Technologie                          |
|-------------------|---------------------------------------|
| Framework         | Next.js 14 (App Router)              |
| Sprache           | TypeScript (strict mode)             |
| UI / Styling      | React 18, Tailwind CSS               |
| 2D-Canvas         | Konva.js + react-konva               |
| Backend / DB      | Supabase (Postgres, Auth, Storage)   |
| PDF-Generierung   | @react-pdf/renderer oder pdf-lib     |
| State-Management  | Zustand (leichtgewichtig, ideal für Konfigurator-State) |
| Formulare         | React Hook Form + Zod (Validierung)  |

**Warum Zustand statt Context/Redux?** Der Konfigurator-State (Produkt, Ansichten, platzierte Logos/Texte) ändert sich sehr häufig (Drag-Events, Live-Preview). Zustand vermeidet unnötige Re-Renders und ist minimal-invasiv.

## 2. Ordnerstruktur

```
konfigurator/
├── src/
│   ├── app/                        # Next.js App Router (Routing)
│   │   ├── page.tsx                 # Startseite = direkt Konfigurator
│   │   ├── layout.tsx
│   │   ├── admin/                   # Admin-Bereich (geschützt)
│   │   └── api/                     # Route Handlers (PDF-Export, Preisberechnung serverseitig)
│   │
│   ├── components/
│   │   ├── product/                 # Produkt-, Marken-, Farb-, Größenauswahl
│   │   ├── configurator/            # Konva-Canvas, Logo-/Text-Layer, Toolbar, Maßanzeige
│   │   ├── summary/                 # Live-Zusammenfassung, Preisanzeige, Kontaktformular
│   │   └── admin/                   # Produktverwaltung, Preisregeln-Editor
│   │
│   ├── lib/
│   │   ├── supabase/                # Client-/Server-Supabase-Instanzen
│   │   └── pricing/                 # Zentrale Preisberechnungslogik (reine Funktionen)
│   │
│   ├── types/                       # Zentrale TypeScript-Typdefinitionen
│   └── stores/                      # Zustand-Stores (configuratorStore, cartStore …)
│
├── supabase/
│   └── migrations/                  # SQL-Migrationsdateien (versioniert)
│
└── public/
    └── products/                    # 2D-Grundgrafiken (Front/Back/Sleeve) je Produkt
```

## 3. Kernprinzip: Modularität

Jedes fachliche Konzept (Produkt, Preisregel, Druckposition, Konfigurationselement) ist:
1. Als **eigener TypeScript-Typ** in `src/types` definiert
2. Als **eigene Supabase-Tabelle** modelliert
3. Über **reine, testbare Funktionen** in `src/lib` verarbeitet (v.a. Preisberechnung – keine Preislogik in UI-Komponenten!)

Dadurch lassen sich spätere Erweiterungen (Stick, DTF, Mehrsprachigkeit, Warenkorb, Stripe) anschließen, ohne bestehenden Code umzubauen.

## 4. Datenfluss des Konfigurators (vereinfacht)

```
Kleidungsstück wählen
   → Marke wählen
      → Produkte laden (Supabase: products WHERE brand_id = …)
         → Farbe wählen → Ansicht (Bild) wechselt
            → Größe wählen
               → Konva-Canvas lädt Produktgrafik + Druckbereiche (print_areas)
                  → Logo/Text hinzufügen → Position/Größe im Zustand-Store
                     → Preis wird bei jeder Änderung neu berechnet (lib/pricing)
                        → Zusammenfassung + PDF-Export
```

## 5. Geplante Reihenfolge der Umsetzung

1. ✅ Projekt-Setup, DB-Schema, Typen (dieser Schritt)
2. Produktauswahl-Flow (Kleidungsstück → Marke → Farbe → Größe)
3. Konva-Canvas mit Ansichtswechsel (Front/Back/Sleeve) + Druckbereichs-Visualisierung
4. Logo-Upload + Drag/Scale/Rotate + Maßanzeige in cm
5. Text-Element mit Formatierungsoptionen
6. Preisberechnung (zentral, regelbasiert, live)
7. Zusammenfassung + Kontaktformular + PDF-Export
8. Admin-Bereich (Produkte, Preisregeln, Bestellungen)

## 6. Erweiterbarkeit (für später vorgesehen, aber nicht jetzt gebaut)

Die Datenbank und Typen sind bereits so angelegt, dass folgende Erweiterungen ohne Strukturbruch möglich sind:
- Weitere Veredelungsarten (Stick, DTF, Siebdruck, Digitaldruck) über `print_method`-Feld
- Mehrsprachigkeit über i18n-Bibliothek (next-intl), Texte aus DB statt hartcodiert
- Kundenkonto & Warenkorb (eigene Tabellen `customers`, `cart_items`)
- Stripe/PayPal-Zahlung (eigener `payments`-Service, unabhängig vom Konfigurator)
- KI-Druckqualitätsprüfung (asynchrone Edge Function, prüft Auflösung beim Upload)
