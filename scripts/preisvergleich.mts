/**
 * Gegenüberstellung: heutiger Shoppreis gegen neu kalkulierten Preis.
 *
 * ÄNDERT NICHTS. Reines Berichtswerkzeug – es liest Katalog und Kalkulation
 * und stellt beide Wege nebeneinander. Aufruf: npm run preis:vergleich
 *
 * Verglichen wird der ENDPREIS je Stück, den die Kundschaft zahlt:
 *   heute – basePrice + Veredelungsaufschläge aus pricingRules, inkl. Staffel
 *   neu   – Vollpreis aus kalkuliere(), inkl. Textil, Bögen, Ausschuss,
 *           Logistik, Zahlung und Gewinn
 */
import { PRODUCTS } from '@/config/products/index';
import { EINKAUFSPREIS_NACHWEISE } from '@/config/pricing/einkaufspreise';
import { kalkuliere } from '@/config/pricing/selbstkosten';
import { calculatePrice } from '@/lib/pricing/calculatePrice';
import { getPricingRules } from '@/config/pricingRules';
import { formatiereGeld } from '@/lib/format';
import type { LogoElement } from '@/types';

/** Ein Brustmotiv 20 × 25 cm – das Szenario, in dem verglichen wird. */
const MOTIV_CM = { breite: 20, hoehe: 25 };

function logoElement(): LogoElement {
  return {
    id: 'vergleich', type: 'logo', view: 'front',
    xCm: 5, yCm: 10, widthCm: MOTIV_CM.breite, heightCm: MOTIV_CM.hoehe,
    rotationDeg: 0, isOutOfBounds: false, extraPrice: 0, estimatedStitches: 0,
    name: 'Vergleichsmotiv', locked: false, hidden: false,
    fileUrl: '', fileName: 'vergleich.png',
    originalWidthPx: 1000, originalHeightPx: 1250, originalFileUrl: '',
    backgroundRemoved: false, contentFillRatio: 1,
  };
}

const MENGEN = [1, 15, 50];

async function main(): Promise<void> {
  const regeln = await getPricingRules('dtf');
  const element = logoElement();

  console.log('═'.repeat(104));
  console.log('PREISVERGLEICH – heutiger Shoppreis gegen neue Kalkulation');
  console.log(`Szenario: DTF, ein Brustmotiv ${MOTIV_CM.breite} × ${MOTIV_CM.hoehe} cm · Endpreis je Stück (BRUTTO, inkl. 19 % USt)`);
  console.log('═'.repeat(104));
  console.log('');
  console.log('  ' + 'Produkt'.padEnd(34) + MENGEN.map((m) => `${m} Stück`.padStart(22)).join(''));
  console.log('  ' + ' '.repeat(34) + MENGEN.map(() => 'heute      neu    Δ'.padStart(22)).join(''));
  console.log('  ' + '─'.repeat(100));

  const abweichungen: { name: string; menge: number; heute: number; neu: number }[] = [];

  for (const produkt of [...PRODUCTS].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))) {
    const nachweis = EINKAUFSPREIS_NACHWEISE[produkt.id];
    if (!nachweis) continue;

    const spalten = MENGEN.map((menge) => {
      const heute = calculatePrice({
        basePrice: produkt.basePrice, quantity: menge,
        elements: [element], pricingRules: regeln,
      });
      const neu = kalkuliere({
        einkaufspreis: nachweis.preis, menge, veredelung: 'dtf',
        dtfMotive: [{ breiteMm: MOTIV_CM.breite * 10, hoeheMm: MOTIV_CM.hoehe * 10 }],
      });
      abweichungen.push({ name: produkt.name, menge, heute: heute.unitPrice, neu: neu.verkaufspreis });
      const delta = neu.verkaufspreis - heute.unitPrice;
      return (
        heute.unitPrice.toFixed(2).padStart(7) +
        neu.verkaufspreis.toFixed(2).padStart(9) +
        `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`.padStart(8)
      );
    });
    console.log('  ' + `${produkt.brand} · ${produkt.name}`.slice(0, 33).padEnd(34) + spalten.join(''));
  }

  console.log('');
  console.log('─'.repeat(104));
  for (const menge of MENGEN) {
    const zurMenge = abweichungen.filter((a) => a.menge === menge);
    const teurer = zurMenge.filter((a) => a.neu > a.heute).length;
    const guenstiger = zurMenge.filter((a) => a.neu < a.heute).length;
    const schnitt = zurMenge.reduce((s, a) => s + (a.neu - a.heute), 0) / zurMenge.length;
    console.log(
      `  bei ${String(menge).padStart(3)} Stück: ${String(teurer).padStart(2)} teurer · ` +
        `${String(guenstiger).padStart(2)} günstiger · Ø-Änderung ${formatiereGeld(Math.round(schnitt * 100) / 100)}`
    );
  }
  console.log('');
  console.log('  Es wurde NICHTS geändert. Dieser Bericht liest nur.');
}

void main();
