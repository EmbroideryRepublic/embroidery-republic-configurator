/**
 * Stellt die Preisstrategien gegenüber.
 *
 * ÄNDERT NICHTS. Aufruf: npm run preis:strategien
 *
 * Die entscheidende Spalte ist der Deckungsbeitrag: Er rechnet immer gegen
 * die TATSÄCHLICHEN Kosten der heutigen Beschaffung, gleichgültig worauf die
 * jeweilige Strategie den Preis stellt. Eine Strategie, die günstigere
 * Beschaffung unterstellt, macht die Preise attraktiv – und den
 * Deckungsbeitrag negativ, solange nicht wirklich gebündelt wird.
 */
import { kalkuliereBestellung } from '@/config/pricing/selbstkosten';
import { PREISSTRATEGIE, STRATEGIE_ALTERNATIVEN } from '@/config/pricing/preisstrategie';
import { BESCHAFFUNG } from '@/config/pricing/beschaffung';
import { formatiereGeld } from '@/lib/format';

const MOTIV = [{ breiteMm: 200, hoeheMm: 250 }];
const MENGEN = [1, 5, 15, 50];
const EK = 3.24;

function zeile(text: string): void {
  console.log(text);
}

zeile('='.repeat(96));
zeile('PREISSTRATEGIEN IM VERGLEICH');
zeile(`Fruit of the Loom Valueweight T (EK ${formatiereGeld(EK)}), DTF-Brustmotiv 20 × 25 cm`);
zeile(`Tatsächliche Beschaffung: ${BESCHAFFUNG.modell}`);
zeile('='.repeat(96));

for (const strategie of [PREISSTRATEGIE, ...STRATEGIE_ALTERNATIVEN]) {
  const aktiv = strategie === PREISSTRATEGIE;
  zeile('');
  zeile(`${aktiv ? '▶ AKTIV  ' : '  '}${strategie.name}`);
  zeile(`  Preisbasis: ${strategie.preisbasis.modell}` +
    (strategie.preisbasis.modell === 'sammelbestellung'
      ? ` (${strategie.preisbasis.auftraegeJeLieferantenbestellung} Aufträge)`
      : ''));
  zeile('  ' + '─'.repeat(92));
  zeile('    Menge   Verkaufspreis    Istkosten   Deckungsbeitrag   Marge   trägt sich');

  for (const menge of MENGEN) {
    const k = kalkuliereBestellung(
      [{ einkaufspreis: EK, menge, veredelung: 'dtf', dtfMotive: MOTIV }],
      strategie
    );
    const preis = k.positionen[0]!.verkaufspreis;
    zeile(
      `    ${String(menge).padStart(5)}   ${formatiereGeld(preis).padStart(13)}   ` +
        `${formatiereGeld(k.selbstkosten).padStart(10)}   ${formatiereGeld(k.deckungsbeitrag).padStart(15)}   ` +
        `${(k.margeProzent.toFixed(0) + ' %').padStart(5)}   ${k.decktIstkosten ? 'ja' : 'NEIN'}`
    );
  }
  zeile(`  ${strategie.beschreibung.replace(/\s+/g, ' ')}`);
}

zeile('');
zeile('─'.repeat(96));
zeile('  Der Deckungsbeitrag rechnet gegen die TATSÄCHLICHEN Kosten – nie gegen die Preisbasis.');
zeile('  Es wurde nichts geändert. Dieser Bericht liest nur.');
