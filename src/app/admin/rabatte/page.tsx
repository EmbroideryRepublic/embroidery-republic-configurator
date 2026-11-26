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
import {
  QUANTITY_TIERS,
  DTF_POSITION_TIERS,
  STICKEREI_POSITION_TIERS,
  DTF_GRUNDPREIS_STAFFEL,
  type DtfPositionTier,
} from '@/lib/pricing/calculatePrice';
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
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (QUANTITY_TIERS). Diese
          Tabelle gilt für die Stickerei; beim DTF-Druck gilt der Grundpreis-Rabatt aus der DTF-Staffel weiter unten.
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
        <h2 className="text-base font-semibold">Positionsstaffel DTF</h2>
        <p className="mt-1 text-sm text-gray-500">
          Feste Preise je veredelter Ansicht (kein Prozentrabatt) – Stufenfunktion: die erreichte Stückzahl gilt für
          die gesamte Bestellung. Damit eine größere Bestellung nie weniger kostet als eine kleinere, deckelt die
          Preisberechnung den Gesamtpreis kurz vor jeder Stufe auf den Preis der Stufenmenge (Mengenpreis-Deckel, in
          den Preisdetails als „Mengenpreis wie bei N Stück“). Seit 2026-11-26 liegt die erste Position ab 3 Stück
          auf jeder Stufe 1 € höher als zuvor (weniger Mengenrabatt). Pflege in{' '}
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (DTF_POSITION_TIERS).
        </p>
      </div>

      <PositionsTabelle stufen={DTF_POSITION_TIERS} />

      <div>
        <h2 className="text-base font-semibold">Positionsstaffel Stickerei</h2>
        <p className="mt-1 text-sm text-gray-500">
          Eigene, unveränderte Tabelle (Stand 2026-08-09) zuzüglich Stichaufpreis; ohne Mengenpreis-Deckel. Stickerei ist
          derzeit pausiert. Pflege in{' '}
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (STICKEREI_POSITION_TIERS).
        </p>
      </div>

      <PositionsTabelle stufen={STICKEREI_POSITION_TIERS} />

      <div>
        <h2 className="text-base font-semibold">Grundpreis-Rabatt DTF (seit 2026-11-18)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Rabatt auf den Grundpreis des Textils beim DTF-Druck, Stufenfunktion für die gesamte Bestellung. Es gilt der
          größere Wert aus Prozent und Mindest-Euro je Stück – so wird der Stückpreis auf jeder Stufe für jedes Modell
          sichtbar günstiger. Pflege in{' '}
          <code className="rounded bg-gray-100 px-1">src/lib/pricing/calculatePrice.ts</code> (DTF_GRUNDPREIS_STAFFEL).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Ab Stückzahl</th>
              <th className="px-3 py-2 text-right">Rabatt in Prozent</th>
              <th className="px-3 py-2 text-right">Mindestens je Stück</th>
            </tr>
          </thead>
          <tbody>
            {DTF_GRUNDPREIS_STAFFEL.map((stufe) => (
              <tr key={stufe.minQuantity} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium">{stufe.minQuantity}</td>
                <td className="px-3 py-2 text-right">{stufe.prozent} %</td>
                <td className="px-3 py-2 text-right">{formatiereGeld(stufe.mindestensEuro)}</td>
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

function PositionsTabelle({ stufen }: { stufen: ReadonlyArray<DtfPositionTier> }) {
  return (
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
          {stufen.map((tier) => (
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
  );
}
