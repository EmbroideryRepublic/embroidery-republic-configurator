/**
 * ═══════════════════════════════════════════════════════════════════════
 * GROSSFORMAT-ZUSCHLAG FÜR DTF-MOTIVE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der DTF-Positionspreis (config: DTF_POSITION_TIERS) hängt nicht von der Motivgröße ab. Das war vertretbar, solange die Fläche
 * auf 30 cm Breite gedeckelt war und die Kalkulation von einem Motiv um 20 × 25 cm ausging. Seit die Fläche aus der Größentabelle
 * des Produkts kommt (Brustbreite − Nähte, in ECHTEN flachen Zentimetern, siehe config/abwicklung.ts), sind Motive bis
 * etwa 50 cm Breite möglich – und die Transferfolie kostet dann ein Vielfaches (Bogen 550 × 1000 mm: 18,99 €).
 *
 * Der Zuschlag deckt die MEHRKOSTEN der Folie gegenüber dem kalkulierten Standardmotiv. Er hängt an den Folienkosten, die ein Motiv
 * dieser echten flachen Größe verursacht, wenn die Bögen voll belegt sind (günstigster Bogen: Preis ÷ Motive je Bogen, siehe
 * dtfKosten.ts) – nicht an der Menge: gleiche Motivgröße, gleicher Zuschlag je Stück. Die Fläche allein taugt dafür nicht, weil die
 * Belegung springt (ein Motiv von 28 × 28 cm braucht mit 6,33 € doppelt so viel Folie wie eines von 25 × 32 cm mit 3,17 €, obwohl
 * es kleiner ist).
 *
 * ── Stufen (Folienkosten je Motiv bei voll belegtem Bogen) ────────────────────────────────────────────────────────────────────
 *   bis  3,50 €  Standardmotiv (20 × 25 cm: 2,37 €), bis ca. 26 × 32 cm        → kein Zuschlag
 *   bis  7,00 €  z. B. 28 × 40 cm, 30 × 47 cm (3 je 550 × 1000-Bogen: 6,33 €)  → Mehrkosten 3,4–4,3 €   → 4,00 €
 *   bis 10,00 €  z. B. 35–52 × 47 cm (2 je Bogen: 9,50 €)                      → Mehrkosten 6,2–7,1 €   → 7,00 €
 *   darüber      z. B. 50 × 50 cm, 57 × 30 cm (1 je Bogen: 18,99 €)            → Mehrkosten ≈ 16,6 €    → 17,00 €
 * Die Mehrkosten stammen aus der Belegungsrechnung ab 5 Stück (Standardmotiv 3,80 € bei 5, 2,50 € ab 50 Stück). Geprüft wird das in
 * `__tests__/grossformat.test.ts` (der Zuschlag deckt die Mehrkosten bei 5 bis 100 Stück) und gegen die Gewinn-je-Bestellung-Regel
 * (mindestens 3 €) über alle Modelle, Größen und Mengen.
 *
 * Gilt NUR für DTF. Die Stickerei rechnet nach Stichzahl, die Fläche dort bleibt unverändert.
 */
import { DTF_BOEGEN, motiveJeBogen } from './dtfKosten';

export interface GrossformatStufe {
  /** Obergrenze der Folienkosten je Motiv (voll belegter Bogen) in Euro, einschließlich. */
  bisFolienkosten: number;
  /** Zuschlag je Stück in Euro. */
  zuschlag: number;
  /** Für Anzeige und Tests. */
  beispiel: string;
}

export const GROSSFORMAT_STUFEN: ReadonlyArray<GrossformatStufe> = [
  { bisFolienkosten: 3.5, zuschlag: 0, beispiel: 'bis ca. 26 × 32 cm' },
  { bisFolienkosten: 7.0, zuschlag: 4.0, beispiel: 'bis ca. 30 × 47 cm' },
  { bisFolienkosten: 10.0, zuschlag: 7.0, beispiel: 'bis ca. 52 × 47 cm' },
  { bisFolienkosten: Number.POSITIVE_INFINITY, zuschlag: 17.0, beispiel: 'darüber' },
];

/**
 * Folienkosten EINES Motivs der Größe b × h (cm), wenn die Bögen voll belegt sind: günstigster Bogen, Preis geteilt durch die Zahl
 * der Motive, die darauf passen. `Infinity`, wenn das Motiv auf keinen Bogen passt.
 */
export function folienkostenJeMotiv(breiteCm: number, hoeheCm: number): number {
  let guenstigste = Number.POSITIVE_INFINITY;
  for (const bogen of DTF_BOEGEN) {
    const proBogen = motiveJeBogen(bogen, breiteCm * 10, hoeheCm * 10);
    if (proBogen > 0) guenstigste = Math.min(guenstigste, bogen.einkaufspreis / proBogen);
  }
  return guenstigste;
}

/** Zuschlag je Stück für ein Motiv mit den ECHTEN flachen Maßen (cm). Ungültige Maße: kein Zuschlag. */
export function grossformatZuschlag(breiteCm: number, hoeheCm: number): number {
  if (!Number.isFinite(breiteCm) || !Number.isFinite(hoeheCm) || breiteCm <= 0 || hoeheCm <= 0) return 0;
  const folie = folienkostenJeMotiv(breiteCm, hoeheCm);
  const stufe = GROSSFORMAT_STUFEN.find((s) => folie <= s.bisFolienkosten) ?? GROSSFORMAT_STUFEN[GROSSFORMAT_STUFEN.length - 1]!;
  return stufe.zuschlag;
}
