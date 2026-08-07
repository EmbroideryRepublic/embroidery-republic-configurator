/**
 * Positionsliste + Steuerzeile + Gesamtsumme einer Bestellung. Extrahiert aus
 * `app/bestellung/[token]/page.tsx`, damit die Konto-Bestellansicht
 * (app/konto/bestellungen/[id]/page.tsx) dieselbe Darstellung ohne
 * Kopie nutzt – exakt das Wiederverwendungsversprechen aus orderView.ts:
 * „Diese Ansicht … kann direkt im Kundenkonto wiederverwendet werden."
 */
import { formatiereGeld } from '@/lib/format';
import type { BestellAnsicht } from '@/lib/orders/orderView';

export function BestellPositionen({ bestellung }: { bestellung: BestellAnsicht }) {
  return (
    <section className="rounded-lg border border-brand/[0.08] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-brand">Ihre Positionen</h2>
      <ul className="space-y-3">
        {bestellung.positionen.map((pos, i) => (
          <li key={i} className="border-b border-brand/[0.06] pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-medium text-brand">{pos.produktName}</p>
            <p className="text-xs text-brand/60">
              {pos.farbe} · {pos.veredelung}
            </p>
            <p className="mt-1 text-xs text-brand/70">
              {pos.groessen.map((g) => `${g.groesse} × ${g.menge}`).join(' · ')}
              <span className="text-brand/50"> ({pos.menge} Stück)</span>
            </p>
          </li>
        ))}
      </ul>
      {bestellung.steuerbetrag !== null && bestellung.steuersatz !== null && (
        <p className="mt-4 text-right text-xs text-brand/50">
          davon enthaltene USt. ({bestellung.steuersatz} %): {formatiereGeld(bestellung.steuerbetrag)}
        </p>
      )}
      <p className="mt-1 text-right text-sm font-semibold text-brand">Gesamt: {formatiereGeld(bestellung.gesamtpreis)}</p>
    </section>
  );
}
