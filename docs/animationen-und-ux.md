# Animationen & UX-Regeln

Alle Keyframes und die globalen Zugänglichkeitsregeln stehen in
[src/app/globals.css](../src/app/globals.css). Leitlinie: Bewegung ist dezent,
zweckgebunden und hält den Nutzer **nie** auf.

## Keyframes / Utility-Klassen

| Klasse | Wirkung | Eingesetzt für |
|--------|---------|----------------|
| `animate-fade-in` | Einblenden + 4px nach oben, 0,25 s | Produkt-/Farb-/Ansichtswechsel, Reiterinhalte, Modellliste |
| `animate-scale-in` | Einblenden + leichtes Skalieren, 0,18 s | kleine Einblendungen |
| `klappe` / `klappe-auf` | weiches Auf-/Zuklappen via `grid-template-rows: 0fr → 1fr`, 0,28 s | Baumstruktur des Produktbrowsers |
| `animate-produkt-gleiten` | neues Kleidungsstück gleitet herein und löst sich auf, 0,5 s | Produktwechsel auf der Leinwand (ohne Konva-Neu-Mount) |
| `animate-marke-auf` | Häkchen-Marke skaliert auf, 0,25 s | „Ausgewählt"-Marke der aktiven Modellkarte |

**Motion-Sprachen** (bewusst getrennt, nicht vereinheitlichen):
`transition-colors` für Farbwechsel, `transition-transform` für Bewegung/Skalierung,
`transition-all` nur wo mehrere Eigenschaften zugleich animieren. Dauern:
Hover ~200 ms, Übergänge ~300 ms, Produktgleiten ~500 ms.

## Fokus-Ringe (Tastatur)

Global in `globals.css` über `:where(a, button, input, select, textarea,
summary, [role='button'], [role='radio'], [tabindex='0']):focus-visible` – ein
Gold-Ring (`outline: 2px solid`, `outline-offset: 2px`). `:where(...)` hält die
Spezifität bei 0, sodass speziellere Komponentенstile gewinnen; `:focus-visible`
zeigt den Ring **nur** bei Tastaturbedienung, nicht beim Mausklick. Neue
Bedienelemente brauchen deshalb keinen eigenen Fokusstil.

## Reduced-Motion

Ebenfalls global: `@media (prefers-reduced-motion: reduce)` schließt Animationen
und Übergänge praktisch sofort ab (`animation/transition-duration: 0.01ms`) und
schaltet sanftes Scrollen ab. Wer reduzierte Bewegung wünscht, bekommt keinen
Gleiteffekt und keine Mikroanimationen.

## Verbindliche UX-Regeln

1. **Geführter Kaufprozess.** Zu jedem Zeitpunkt ist erkennbar, was erledigt ist
   und was als Nächstes ansteht (Schrittleiste + „Deine Konfiguration" +
   Nächster-Schritt-Hinweis). Führen, nicht bevormunden – Schritte bleiben in
   beliebiger Reihenfolge bedienbar.
2. **Keine Mindestbestellmenge.** Ab 1 Stück bestellbar; Rüstkosten werden
   ausgewiesen, damit klar ist, warum ein Einzelstück verhältnismäßig teurer ist.
3. **Fail-fast statt stiller Annahmen.** Fehlt ein Preisbaustein/Tarif/Steuersatz,
   erscheint eine Fehlermeldung – nie ein geratener Wert. Ein ungültiger Preis
   ist nicht bestellbar (harte Warnung im Preisbereich).
4. **Fehler rot, Warnungen amber.** Konsistente Tonalität; Kundentexte nennen nie
   interne Details.
5. **Echte Ware statt Symbolbilder.** Vorschauen, Farbpunkte und Kachelbilder
   stammen aus echten Katalogfotos/-farbwerten; nichts wird erzeugt oder
   eingefärbt.
6. **Live-Rückmeldung.** Preis, Zusammenfassung und Fortschritt aktualisieren
   sich sofort bei jeder Änderung.
7. **Kein Kundenkonto.** Bestellung ohne Registrierung (Rechnung/Anfrage); keine
   toten „Mein Konto"-Elemente.

## Responsivität

Kein Element darf überlaufen oder abgeschnitten werden – geprüft von 360 px
(kleines Smartphone) bis 2560 px (UltraWide). Auf schmalen Bildschirmen weicht
im Produktbrowser der Baum der Modellliste; die Konva-Leinwand skaliert und wird
an die Fensterbreite geklemmt (siehe [konfigurator-logik.md](konfigurator-logik.md)).
Die Desktop-Navigation erscheint erst ab `lg`, darunter das kompakte Menü.
