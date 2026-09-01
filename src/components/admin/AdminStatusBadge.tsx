/**
 * Farbige Statuseinordnung einer Bestellung – gemeinsam von Liste und
 * Detailseite genutzt, damit beide nie auseinanderlaufen.
 *
 * Zeigt AUSSCHLIESSLICH den Wert aus berechneAdminStatus() an; entscheidet
 * nie mit, ob die Zeile/Seite überhaupt erscheint (siehe Kopfkommentar
 * lib/orders/orderVisibility.ts – Sichtbarkeit und Status sind seit
 * 2026-08-25 bewusst getrennt).
 */
import type { AdminStatus } from '@/lib/orders/orderVisibility';
import { formatiereUhrzeit } from '@/lib/format';

const FARBEN: Record<AdminStatus['farbe'], string> = {
  rot: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  gruen: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
  grau: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  blau: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
};

export function AdminStatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${FARBEN[status.farbe]}`}>
      {status.label}
      {status.stornofristEndeIso && (
        <span className="font-normal opacity-80">
          · bis {formatiereUhrzeit(status.stornofristEndeIso)}
        </span>
      )}
    </span>
  );
}
