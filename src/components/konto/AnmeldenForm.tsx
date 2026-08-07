'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { anmeldenAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird geprüft …' : 'Anmelden'}
    </button>
  );
}

/**
 * Nur ein Pfad innerhalb dieser Seite ist als Weiterleitungsziel erlaubt –
 * niemals eine absolute URL oder ein protokollrelativer Pfad ("//fremd.de"),
 * sonst könnte ?weiter= nach dem Login auf eine fremde Domain umleiten
 * (Open Redirect).
 *
 * Der WHATWG-URL-Parser entfernt Tab/Newline/CR (und Browser-Router
 * darüber hinaus alle ASCII-Steuerzeichen) aus dem GESAMTEN String vor
 * dem Parsen – ohne dieselbe Normalisierung vorab würde z.B. "/\t/evil.com"
 * die startsWith-Prüfungen unten umgehen, obwohl daraus effektiv
 * "//evil.com" wird.
 */
function sicheresWeiterZiel(wert: string | null): string {
  if (!wert) return '/konto';
  const bereinigt = wert.replace(/[\x00-\x1f]/g, '');
  if (!bereinigt.startsWith('/') || bereinigt.startsWith('//') || bereinigt.startsWith('/\\')) return '/konto';
  return bereinigt;
}

export function AnmeldenForm() {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(anmeldenAction, null);
  const router = useRouter();
  const params = useSearchParams();
  const linkFehler = params.get('fehler') === 'link-ungueltig';
  const ziel = sicheresWeiterZiel(params.get('weiter'));

  useEffect(() => {
    if (state?.success) router.push(ziel);
  }, [state?.success, router, ziel]);

  return (
    <form action={formAction} className="space-y-4">
      {linkFehler && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          Dieser Link ist nicht mehr gültig oder wurde bereits verwendet.
        </p>
      )}
      <KontoFeld id="email" name="email" label="E-Mail-Adresse" type="email" autoComplete="email" required />
      <KontoFeld id="passwort" name="passwort" label="Passwort" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <div className="flex items-center justify-between text-xs">
        <Link href="/konto/passwort-vergessen" className="text-brand/50 hover:text-gold-dark hover:underline">
          Passwort vergessen?
        </Link>
        <Link href="/konto/registrieren" className="font-medium text-gold-dark hover:underline">
          Konto anlegen
        </Link>
      </div>
    </form>
  );
}
