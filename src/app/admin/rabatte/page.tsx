/**
 * Rabatte – read-only Übersicht der Mengenstaffel, die tatsächlich im
 * Checkout wirkt (lib/pricing/calculatePrice.ts, QUANTITY_TIERS).
 *
 * ── Warum keine Bearbeitung hier ────────────────────────────────────────
 * Wie der gesamte Produktkatalog liegen Preisregeln bewusst im Code, nicht
 * in der Datenbank (docs/filterleiste-konzept.md, Architekturentscheidung 1:
 * "zwei Quellen für dieselbe Information" ist genau das, was die
 * Geschäftsarchitektur verbietet). Eine Änderung hier würde eine zweite
 * Wahrheit neben calculatePrice.ts schaffen. Diese Seite macht die
 * geltende Regel nur sichtbar, ohne sie zu duplizieren.
 *
 * ── Gutscheincodes gibt es (noch) nicht ─────────────────────────────────
 * Es existiert kein System für individuelle Rabattcodes (Gutschein-Feld im
 * Checkout) – nur die automatische Mengenstaffel unten. Das ist eine
 * bewusste Auslassung dieses Durchlaufs (siehe
 * docs/entscheidungen-produktionsreife.md): ein Gutscheincode-System ist
 * ein eigenständiges neues Feature, keine bloße Admin-Sichtbarkeit auf
 * Bestehendem.
 */
import { istAdmin } from '@/lib/admin/auth';
import { QUANTITY_TIERS, DTF_POSITION_TIERS } from '@/lib/pricing/calculatePrice';
import { STICH_RABATT_MAX_PROZENT, STICH_AUFPREIS_JE_1000 } from '@/config/pricingRules';
import { STICKKOSTEN_JE_1000_STICHE } from '@/config/pricing/selbstkosten';
import { formatiereGeld } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminRabattePage() {
  if (!(await istAdmin())) return null;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Rabatte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Automatische Mengenstaffel, angewendet auf jede Bestellung – kein manueller Gutscheincode nötig. Pflege in{' '}
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (QUANTITY_TIERS).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Ab Stückzahl</th>
              <th className="px-3 py-2 text-right">Rabatt Grundpreis</th>
              <th className="px-3 py-2 text-right">Rabatt Veredelung (Fläche/Stiche)</th>
            </tr>
          </thead>
          <tbody>
            {QUANTITY_TIERS.map((tier) => (
              <tr key={tier.minQuantity} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium">{tier.minQuantity}</td>
                <td className="px-3 py-2 text-right">{tier.baseDiscountPercent} %</td>
                <td className="px-3 py-2 text-right">{tier.veredelungDiscountPercent} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Stickerei: Der Veredelungsrabatt gilt nur für den Stichaufpreis ({formatiereGeld(STICH_AUFPREIS_JE_1000)} je
        1.000 Stiche) und ist bei {STICH_RABATT_MAX_PROZENT.toLocaleString('de-DE')} % gedeckelt, damit der Erlös nie
        unter die Fremdkosten des Stickpartners ({formatiereGeld(STICKKOSTEN_JE_1000_STICHE)} je 1.000 Stiche) fällt –
        Staffelwerte oberhalb des Deckels wirken dort nicht mehr voll (seit 2026-09-03,{' '}
        <code className="rounded bg-gray-100 px-1">src/config/pricingRules.ts</code>).
      </p>

      <div>
        <h2 className="text-base font-semibold">Positionsstaffel (DTF und Stickerei)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Feste Preise je veredelter Ansicht (kein Prozentrabatt) – Stufenfunktion: die erreichte Stückzahl gilt für
          die gesamte Bestellung, kein Gleiten innerhalb einer Stufe. Seit 2026-09-03 auch Grundlage der Stickerei,
          dort zuzüglich Stichaufpreis. Pflege ebenfalls in{' '}
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (DTF_POSITION_TIERS).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Ab Stückzahl</th>
              <th className="px-3 py-2 text-right">1. Position</th>
              <th className="px-3 py-2 text-right">2. Position</th>
              <th className="px-3 py-2 text-right">ab 3. Position</th>
            </tr>
          </thead>
          <tbody>
            {DTF_POSITION_TIERS.map((tier) => (
              <tr key={tier.minQuantity} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium">{tier.minQuantity}</td>
                <td className="px-3 py-2 text-right">{formatiereGeld(tier.erste)}</td>
                <td className="px-3 py-2 text-right">{formatiereGeld(tier.zweite)}</td>
                <td className="px-3 py-2 text-right">{formatiereGeld(tier.abDritte)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        Kein Gutschein-/Rabattcode-System vorhanden. Ein Textfeld &bdquo;Gutscheincode&ldquo; im Checkout wäre ein neues Feature
        (eigene Verwaltung, Einlösungslogik, Missbrauchsschutz) – bislang bewusst nicht gebaut.
      </div>
    </section>
  );
}
