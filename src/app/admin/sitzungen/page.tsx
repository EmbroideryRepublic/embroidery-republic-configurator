/**
 * Sitzungsübersicht. Die Funktionen (`aktiveSitzungen`, `widerrufeSitzung`,
 * `beendeAlleAdminSitzungen`) und die Server Actions existierten bereits
 * (docs/admin-authentifizierung.md, docs/go-live-checkliste.md: "Funktion
 * fertig, Oberfläche offen") – diese Seite ist ausschließlich die fehlende
 * Anzeige, keine neue Logik.
 */
import { istAdmin, aktiveSitzungen } from '@/lib/admin/auth';
import { SitzungsListe } from '@/components/admin/SitzungsListe';

export const dynamic = 'force-dynamic';

export default async function AdminSitzungenPage() {
  if (!(await istAdmin())) return null;
  const sitzungen = await aktiveSitzungen();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Aktive Admin-Sitzungen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Jede Anmeldung erzeugt eine eigene, unabhängig widerrufbare Sitzung (12 Stunden gültig). Nützlich, um
          Zugänge auf fremden Rechnern zu beenden, ohne das Zugangs-Secret zu ändern.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <SitzungsListe sitzungen={sitzungen} />
      </div>
    </section>
  );
}
