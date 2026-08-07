import Link from 'next/link';
import { aktuellerKunde } from '@/lib/account/session';
import { createClient } from '@/lib/supabase/server';
import { PasswortZuruecksetzenForm } from '@/components/konto/PasswortZuruecksetzenForm';

export const metadata = {
  title: 'Neues Passwort vergeben',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * Unterscheidet eine frische Recovery-Sitzung (aus dem Link der "Passwort
 * vergessen"-E-Mail) von einer ganz normalen, bereits angemeldeten Sitzung.
 * Ohne diese Prüfung könnte jede aktive Sitzung – z.B. eine an einem fremden
 * Gerät vergessene – über diese Seite ein neues Passwort setzen, ohne das
 * alte zu kennen. `getClaims()` verifiziert das Access Token (serverseitig
 * bei symmetrischem Signing, sonst per WebCrypto) und liefert den
 * `amr`-Claim (Authentication Method Reference) – bei einem über den
 * Recovery-Link getauschten Code enthält er `recovery`, bei einer normalen
 * Anmeldung z.B. `password`. Jeder Fehler oder unklare Zustand fällt auf
 * "keine Recovery-Sitzung" zurück (fail-closed, wie überall sonst bei
 * Zugriffsentscheidungen in diesem Projekt, siehe aktuellerKunde()).
 */
async function istRecoverySitzung(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) return false;
    const amr = data.claims.amr;
    if (!Array.isArray(amr)) return false;
    return amr.some((eintrag) => (typeof eintrag === 'string' ? eintrag === 'recovery' : eintrag?.method === 'recovery'));
  } catch {
    return false;
  }
}

/**
 * Erreichbar über den Link aus der "Passwort vergessen"-E-Mail, nach dem
 * Umweg über /auth/callback (der den Code gegen eine – nur für diesen
 * Zweck gültige – Sitzung tauscht). Ohne diese Sitzung kann hier niemand
 * ein Passwort setzen, egal welche Adresse in der URL steht.
 */
export default async function PasswortZuruecksetzenPage() {
  const kunde = await aktuellerKunde();
  const erlaubt = kunde ? await istRecoverySitzung() : false;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-serif text-2xl font-semibold text-brand">Neues Passwort vergeben</h1>
      {!kunde || !erlaubt ? (
        <div className="mt-6 rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
          <p className="text-sm text-brand/70">
            Dieser Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an.
          </p>
          <Link href="/konto/passwort-vergessen" className="mt-3 inline-block text-sm font-medium text-gold-dark hover:underline">
            Neuen Link anfordern →
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 mb-6 text-sm text-brand/60">Bitte vergeben Sie ein neues Passwort für {kunde.email}.</p>
          <div className="rounded-2xl border border-gold/20 bg-white p-5 shadow-elegant">
            <PasswortZuruecksetzenForm />
          </div>
        </>
      )}
    </main>
  );
}
