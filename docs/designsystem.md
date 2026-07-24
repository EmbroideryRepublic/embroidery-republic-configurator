# Designsystem

Quelle der Wahrheit sind [tailwind.config.ts](../tailwind.config.ts) (Farben,
Schrift, Schatten) und [src/app/globals.css](../src/app/globals.css)
(Animationen, Fokus, Reduced-Motion). Ziel: Der ganze Shop wirkt „aus einem
Guss" – eine warme, gold-cremefarbene Premium-Anmutung, orientiert am Firmenlogo
(Tiger-Wappen in Gold/Bronze auf Creme).

## Farben

| Token | Wert | Verwendung |
|-------|------|-----------|
| `brand` | `#2b241c` | Textfarbe (warmes Anthrazit-Braun, kein reines Schwarz) |
| `brand.light` | `#faf7f1` | Creme-Hintergrund |
| `brand.accent` | `#a8792f` | Gold-Akzent für aktive Elemente |
| `gold` / `gold.dark` / `gold.light` | `#b8935a` / `#8a6a3a` / `#f3e6cc` | Akzente, aktive Zustände, Häkchen |
| `bronze` / `bronze.dark` | `#8b5e34` / `#6b4526` | tiefere Akzente |
| `cream` / `cream.dark` | `#f7f1e6` / `#ece0c9` | Flächen, Hover-Töne |
| `sand` | `#e8ddc8` | sekundäre Fläche |

**Opazitäts-Rollen bei Text/Rahmen** (statt vieler Einzeltöne):

- Volles `text-brand` = Fließtext; `text-brand/70` = Sekundärtext; `/55–/50` =
  gedämpfte Hinweise/Zähler (Untergrenze für **lesbaren** Text, WCAG-bewusst);
  `/40` und darunter nur für **dekorative** Icons, nie für Text.
- `border-gold` (voll) = aktiv/gewählt; `border-gold/20` = Kartenrahmen;
  `border-gold/10` = feine Trenner. Diese drei sind der Standard – neue
  Komponenten sollen sich daran halten.

## Typografie

- **Inter** (`--font-inter`, `font-sans`) für Fließtext und UI.
- **Playfair Display** (`--font-playfair`, `font-serif`, Schnitte 400–700) für
  große Überschriften und Preise – der wichtigste Hebel für die
  Modemarken-Anmutung.
- Feingranulare Größen als arbiträre Werte (`text-[11px]`, `text-[13px]`) sind
  bewusst erlaubt, wo die Tailwind-Skala (`text-xs`/`sm`) zu grob ist.

## Radien (Skala)

Kein blankes `rounded` (4px) mehr – es folgt einer Skala:

| Klasse | Radius | Verwendung |
|--------|--------|-----------|
| `rounded-full` | rund | Pillen, Chips, runde Knöpfe, Farbpunkte |
| `rounded-2xl` | 16px | große Hero-/Modellkarten |
| `rounded-xl` | 12px | Panels und Inhaltskarten (Standard) |
| `rounded-lg` | 8px | Eingaben, mittlere Flächen, Hinweiskästen |
| `rounded-md` | 6px | kleine Bedien-/Icon-Knöpfe, Badges |

## Schatten

- `shadow-elegant` (`0 4px 24px -4px rgba(139,94,52,0.15)`) – der **eine**
  Kartenschatten, warm getönt.
- `shadow-sm` bewusst nur für dünne, schwebende Utility-Streifen (z. B. die
  Canvas-Werkzeugleiste), die keine volle Kartentiefe tragen sollen.
- Aktive Modellkarten nutzen einen zusätzlichen goldgetönten Fokusschatten
  (arbiträrer `shadow-[...]`-Wert) – bewusster Sonderfall zur Hervorhebung.

## Badges (Modellkarten)

Drei Tonalitäten (`BADGE_TON` in
[ProduktBrowser.tsx](../src/components/configurator/ProduktBrowser.tsx)):
`neutral` (brand-getönt), `bio` (grün, für Bio-Materialien), `gold`
(Güteklasse Premium/Luxury). Wenige pro Karte, damit sie ruhig bleibt.

## Icons

[lucide-react](https://lucide.dev), Größen überwiegend `h-3.5 w-3.5` (klein),
`h-4 w-4` (Standard), `h-5 w-5` (prominent). Jeder rein ikonische Knopf trägt
`aria-label` oder `title`.

Animationen, Fokus-Ringe, Reduced-Motion und die verbindlichen UX-Regeln stehen
in [animationen-und-ux.md](animationen-und-ux.md).
