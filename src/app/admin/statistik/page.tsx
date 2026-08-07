/**
 * Statistik-Dashboard – aus echten Bestelldaten berechnet, keine Schätzung.
 * Anfragen fließen bewusst NICHT in Umsatzzahlen ein (unverbindlich).
 */
import { istAdmin } from '@/lib/admin/auth';
import { ladeStatistik } from '@/lib/admin/data';
import { formatiereGeld } from '@/lib/format';
import { STATUS_LABELS } from '@/config/orderStatus';
import type { OrderStatus } from '@/lib/actions/orderTypes';

export const dynamic = 'force-dynamic';

function Kennzahl({ label, wert, unterzeile }: { label: string; wert: string; unterzeile?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{wert}</p>
      {unterzeile && <p className="mt-0.5 text-xs text-gray-500">{unterzeile}</p>}
    </div>
  );
}

export default async function AdminStatistikPage() {
  if (!(await istAdmin())) return null;
  const s = await ladeStatistik();
  const maxAnzahl = Math.max(1, ...s.statusVerteilung.map((v) => v.anzahl));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Statistik</h1>
        <p className="mt-1 text-sm text-gray-500">
          Aus den gespeicherten Bestelldaten berechnet. Storniert wird nicht mitgezählt, Anfragen fließen nicht in
          Umsatzzahlen ein.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kennzahl label="Bestellungen gesamt" wert={String(s.bestellungenGesamt)} />
        <Kennzahl label="Anfragen gesamt" wert={String(s.anfragenGesamt)} />
        <Kennzahl label="Umsatz (brutto)" wert={formatiereGeld(s.umsatzBrutto)} unterzeile={`netto ${formatiereGeld(s.umsatzNetto)}`} />
        <Kennzahl label="Ø Bestellwert" wert={formatiereGeld(s.durchschnittsbestellwert)} />
        <Kennzahl label="Bestellungen (30 Tage)" wert={String(s.bestellungenLetzte30Tage)} />
        <Kennzahl label="Umsatz (30 Tage)" wert={formatiereGeld(s.umsatzLetzte30Tage)} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Statusverteilung (Bestellungen)</h2>
        <div className="space-y-2">
          {s.statusVerteilung.map((v) => (
            <div key={v.status} className="flex items-center gap-3">
              <span className="w-32 flex-shrink-0 text-sm text-gray-600">
                {STATUS_LABELS[v.status as OrderStatus] ?? v.status}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(4, (v.anzahl / maxAnzahl) * 100)}%` }}
                />
              </div>
              <span className="w-8 flex-shrink-0 text-right text-sm text-gray-600">{v.anzahl}</span>
            </div>
          ))}
          {s.statusVerteilung.length === 0 && <p className="text-sm text-gray-500">Noch keine Bestellungen.</p>}
        </div>
      </div>
    </section>
  );
}
