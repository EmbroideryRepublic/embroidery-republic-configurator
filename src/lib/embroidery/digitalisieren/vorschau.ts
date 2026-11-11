/**
 * Stickvorschau: zeichnet die Stichfolge als Garnlinien in den Garnfarben (PNG). So lässt sich vor dem Sticken beurteilen,
 * ob die automatische Digitalisierung taugt – Füllung, Richtung, Lücken, Sprünge.
 */
import { Resvg } from '@resvg/resvg-js';
import type { Stickplan } from './stickplan';

export interface VorschauOptionen {
  /** Bildpunkte je Millimeter der Vorschau. */
  pxProMm?: number;
  /** Sprünge (Wege ohne Stich) als dünne gestrichelte Linien mitzeichnen. */
  zeigeSpruenge?: boolean;
}

function leuchtdichte(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0.5;
  const v = parseInt(m[1]!, 16);
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
}

export function renderStickvorschau(plan: Stickplan, optionen: VorschauOptionen = {}): Buffer {
  const ppm = optionen.pxProMm ?? 8;
  const rand = 4;
  const breite = Math.ceil((plan.breiteMm + 2 * rand) * ppm);
  const hoehe = Math.ceil((plan.hoeheMm + 2 * rand) * ppm);
  const mx = breite / 2;
  const my = hoehe / 2;
  // Helle Garne auf dunklem Grund zeigen, sonst auf hellem – damit nichts verschwindet.
  const hell = plan.bloecke.every((b) => leuchtdichte(b.hex) > 0.7);
  const grund = hell ? '#2b2b2b' : '#f4f1ea';
  const f = (n: number) => n.toFixed(1);

  const linien: string[] = [];
  const spruenge: string[] = [];
  let letzte: { x: number; y: number } | null = null;
  for (const block of plan.bloecke) {
    let punkte: string[] = [];
    const schliesse = () => {
      if (punkte.length >= 2) {
        linien.push(`<polyline points="${punkte.join(' ')}" fill="none" stroke="${block.hex}" stroke-width="${f(0.42 * ppm)}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.92"/>`);
      }
      punkte = [];
    };
    for (const s of block.stiche) {
      const x = mx + s.x * ppm;
      const y = my + s.y * ppm;
      if (s.art === 'sprung') {
        schliesse();
        if (optionen.zeigeSpruenge && letzte) spruenge.push(`<line x1="${f(letzte.x)}" y1="${f(letzte.y)}" x2="${f(x)}" y2="${f(y)}"/>`);
        punkte = [`${f(x)},${f(y)}`];
      } else {
        punkte.push(`${f(x)},${f(y)}`);
      }
      letzte = { x, y };
    }
    schliesse();
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${hoehe}" viewBox="0 0 ${breite} ${hoehe}">` +
    `<rect width="100%" height="100%" fill="${grund}"/>` +
    linien.join('') +
    (spruenge.length ? `<g stroke="#d33" stroke-width="${f(0.12 * ppm)}" stroke-dasharray="${f(0.6 * ppm)} ${f(0.6 * ppm)}" opacity="0.6">${spruenge.join('')}</g>` : '') +
    `</svg>`;
  return Buffer.from(new Resvg(svg).render().asPng());
}
