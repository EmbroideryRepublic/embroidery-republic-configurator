'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { passwortAendernAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border-2 border-gold px-5 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird geändert …' : 'Passwort ändern'}
    </button>
  );
}

export function PasswortAendernForm() {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(passwortAendernAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <KontoFeld
        id="aktuellesPasswort"
        name="aktuellesPasswort"
        label="Aktuelles Passwort"
        type="password"
        autoComplete="current-password"
        required
      />
      <KontoFeld id="passwort" name="passwort" label="Neues Passwort" type="password" autoComplete="new-password" required minLength={8} />
      <KontoFeld
        id="passwortWiederholung"
        name="passwortWiederholung"
        label="Neues Passwort wiederholen"
        type="password"
        autoComplete="new-password"
        required
      />
      {state?.error && (
        <p role="alert" className={`text-xs ${state.success ? 'text-green-700' : 'text-red-600'}`}>
          {state.success ? 'Passwort geändert.' : state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
