/**
 * Schmaler Besucher-Überblick für die Einstiegsseite des Adminbereichs:
 * heute · gestern · 7 Tage · 30 Tage, verlinkt auf die Detailauswertung.
 *
 * Server-Komponente. Fehlt die Auswertung (Migration noch nicht eingespielt,
 * Datenbank nicht erreichbar), verschwindet der Streifen still – die
 * Bestellliste darunter ist wichtiger als eine fehlende Zahl; die Detailseite
 * erklärt dann, woran es liegt.
 */
import Link from 'next/link';
import { istAdmin } from '@/lib/admin/auth';
import { ladeBesuchsstatistik } from '@/lib/besuch/statistik';
import { zahl } from '@/lib/format';

function Wert({ label, wert }: { label: string; wert: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-base font-semibold text-gray-900">{zahl(wert, 0)}</span>{' '}
      <span className="text-xs text-gray-500">{label}</span>
    </span>
  );
}

export async function BesucherStreifen() {
  // Eigene Prüfung – dieselbe Begründung wie bei den Seiten: Next.js rendert
  // Layout und Inhalt parallel, also schützt kein Elternteil diese Zahlen.
  if (!(await istAdmin())) return null;
  const s = await ladeBesuchsstatistik();
  if (!s) return null;

  return (
    <Link
      href="/admin/besucher"
      className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition hover:border-gold"
    >
      <span className="text-xs uppercase tracking-wide text-gray-400">Besucher</span>
      <Wert label="heute" wert={s.heute.besucher} />
      <Wert label="gestern" wert={s.gestern.besucher} />
      <Wert label="letzte 7 Tage" wert={s.letzte7.besucher} />
      <Wert label="letzte 30 Tage" wert={s.letzte30.besucher} />
      <span className="ml-auto text-xs text-gray-500">Auswertung ansehen →</span>
    </Link>
  );
}
