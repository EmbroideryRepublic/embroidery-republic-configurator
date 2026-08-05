# M3 — Abschlussbewertung (ehrliche Einschätzung)

> Zeitpunkt: Abschluss M3 (generisches Produktmodell). Grün-Gate durchgängig:
> TypeScript 0 · ESLint 0 · 586 Tests grün (6 vorbestehende Umgebungsfehler:
> Playwright-Chromium ×5, pdfjs-Worker-Hash ×1) · Production-Build 175/175 Seiten.
> Kontext: [ADR 0002](adr/0002-generisches-produktmodell.md),
> [ADR 0003](adr/0003-merkmals-registry-muster.md), [haertung-analyse.md](haertung-analyse.md).

## 1. Was M3 geliefert hat

| Abschnitt | Ergebnis | Absicherung |
|---|---|---|
| M3.1 | Zentrales `PRODUCT_TYPES`-Register; Labels/Reihenfolge abgeleitet | Wächter, byte-identisch |
| M3.2 | `komplement`/`kachelFarbe`/`kachelText`/`hero` ins Register (4 verstreute Tabellen entfernt) | byte-identisch |
| M3.3 | `ProductType` → **offene ID**; Compiler-Vollständigkeit durch 12 Wächter ersetzt; Label-Resolver | Wächter |
| M3.4 | **Navigationsachsen-Registry**; `baueBaum` achsengetrieben — **H1 gelöst** | Snapshot byte-identisch + Wächter |
| M3.5 | **Größenleiter-Registry** (typisiert); `naechsteGroesse` strategisch — **H2 gelöst** | 144-Paar-Snapshot + Wächter |
| M3.6a | `labelPlural` (Korrektur „Jackes"→„Jacken") | Test |
| Vorarb. | Facetten-Vokabular-Dedup (4→1) · views-getriebene Bildlogik | byte-identisch (642 KB) |
| ADR 0003 | Merkmals-Registry-Muster (Meta-Prinzip + Anti-Kopplungs-Regeln) | — |

## 2. Endgültig gelöst

- **Beide harten Funktionsbrüche** für Nicht-Kleidung: **H1** (Navigation verlor
  geschlechtslose Produkte) und **H2** (Mengenverlust bei Nicht-Konfektionsgrößen).
- **Single Source of Truth** für alle heute existierenden produktartspezifischen
  Daten: sechs Dimensionen (Views, ProductType, Navigationsachse, Größenleiter +
  Label-/Facetten-Auflösung) folgen konsistent demselben Registry-Muster.
- **Kein Kleidungs-Hardcode** mehr in Navigation, Reihenfolge, Cross-Selling,
  Kacheln, Bühne, Label-/Plural-Auflösung.
- Ein **dokumentiertes Architekturprinzip** (ADR 0003), das jede künftige
  Dimensions-Öffnung anleitet und vor Über-Generalisierung schützt.

## 3. Bewusst bestehende technische Schulden (mit Grund)

| Thema | Warum offen | Zielhorizont |
|---|---|---|
| `PrintMethod` (`'dtf'\|'embroidery'`) + zweite Union `'dtf'\|'stick'` (Kostenkern) | tief, sorgfältig; Namensfalle vor Kosten-Verdrahtung lösen | M4 |
| `ConfigElementType` (`'logo'\|'text'`) | **querschneidend** (Preis/Render/Produktion/E-Mail) + DB-CHECK; ID ist Diskriminator | langfristig |
| Veredelungs-Label-Dedup + `veredelungZuKostenart()` | nicht byte-neutral (Admin weicht ab) bzw. heute kein Caller | M3.6/M4 |
| `effektiveConstraints` + `quantityTierSet` | **kein Konsument** (MOQ-Enforcement existiert nicht); Deckel-vs-Boden beachten | M4/M5 |
| `facettenDimensionen` · `primaryView` · `NUM_ATTRIBUTE` (numerische Facette) | **heute wirkungslos** (durchgängig textil, alle `front`) → Placebo vermieden | **M5** (mit 1. Nicht-Kleidungsgruppe) |
| Geometrie-Rezept-Registry (ersetzt `istAermel`-Binär) | Taschen/Schürzen brauchen `flachteil` statt Rumpf/Ärmel | **M4** |
| Bild-/Asset-Pipeline-Modularisierung | eigene Aufgabe; Bilder gehören zum **Import**, nicht zur Produktdefinition | separat (ADR 0004 folgt) |
| Konfigurator-Refactorings (`ConfiguratorCanvas` 1150 Z., `useDecorationNode`, `textElement.ts`, `dragClamp.ts`) | verhaltensneutrale Splits, kein Blocker | mittelfristig |
| Supabase-Spiegel (4 feste Bildspalten, `element_type`-CHECK) | DB-Migration, folgt der offenen Code-Seite nach | langfristig |
| **B1** (111 Produkte mit Platzhaltern live) | **Platzhalter temporär**; echter Fix = Bildimport, **kein** `noindex`-Dauerzustand | Bildimport (separat) |
| **B2** (ProduktBrowser Mehrfach-Aufklappen) | bewusst behalten, als Feature auszuweisen | Commit-Zeitpunkt |

## 4. Was VOR der Integration von Taschen/Schürzen/Caps/… erledigt sein sollte

Reihenfolge für M4→M5 (die eigentliche Nicht-Kleidungs-Integration):

1. **Geometrie-Rezept-Registry (M4)** — der einzige echte *Kern*-Blocker: der
   Druckflächen-Generator verzweigt heute binär (`istAermel`); Flachteile
   (Tasche/Schürze/Handtuch/Decke) brauchen ein `flachteil`-Rezept. Das
   Groundwork (`geometrieRezept` an den Views) liegt seit M2.5.
2. **Bild-/Asset-Pipeline (separat, vor M5)** — die neue Gruppe braucht echte
   Lieferantenbilder über die Pipeline; zugleich der ausstehende Import der 111.
   Vorher **ADR 0004** (Asset-Architektur: Lieferantendaten → Assets → Produktdef).
3. **M3.6b nachziehen (mit M5)** — `facettenDimensionen`/`primaryView`/`NUM_ATTRIBUTE`
   landen mit der ersten Nicht-Kleidungsgruppe, dann mit echter Wirkung + Test.
4. **Größenleiter `einheit`/`mass` + Maß-Schema** — die Strategien sind fertig
   (M3.5), die konkreten Leitern/`MassSchema` kommen mit den Produkten.
5. **Register-Einträge** der neuen Arten (`naviAchse`, `groessenLeiter`, `komplement`
   ggf. leer) — reine Daten, kein Kernlogik-Eingriff.

## 5. Robustheit & Zukunftssicherheit — meine ehrliche Einschätzung

**Stark für den aktuellen Umfang.** Das Fundament trägt heute tausende
Kleidungsprodukte ohne Änderung (O(1)-Register, flache Datenliterale). Eine neue
*kleidungsartige* Gruppe (Weste, Longsleeve-Variante …) ist bereits **reine Daten**.

**Für echte Nicht-Kleidung** (Tasche/Schürze/Cap/Handtuch/Decke) ist die
Architektur **vorbereitet, aber nicht abgeschlossen**: Die Daten-Achsen (Typ,
Navigation, Größe, Label, Cross-Selling) sind offen und registry-getrieben; es
fehlt die **Geometrie-Rezept-Registry (M4)** als letzter Kern-Baustein und die
**Asset-Pipeline** für Bilder. Beides ist als Groundwork/Design vorhanden, nicht
als Überraschung.

**Bewusst NICHT gelöst und das ist richtig:** Die tief querschneidenden Dimensionen
(`PrintMethod`, `ConfigElementType`) bleiben geschlossen, bis ihr Umbau echten
Bedarf hat — ein vorzeitiges Öffnen brächte Kopplung ohne Nutzen. Die
Verifikationsdisziplin (drei ursprünglich geplante „Vorarbeiten" bei Prüfung als
nicht byte-neutral/konsumentenlos verworfen und dokumentiert) hat das Fundament
frei von Placebo-Struktur gehalten.

**Kurz:** M3 hat das Produktmodell von „kleidungsfest" auf „datengetrieben für
kleidungsartige Gruppen" gebracht und den Weg für beliebige Gruppen klar
vorgezeichnet. Der nächste substanzielle Schritt Richtung Plattform ist **M4
(Geometrie-Rezepte + Import-/Asset-Pipeline)**, nicht weitere Konsolidierung —
die ist für den aktuellen Bestand abgeschlossen.
