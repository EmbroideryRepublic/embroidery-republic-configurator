'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { emailAendernAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border-2 border-gold px-5 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird gesendet …' : 'E-Mail-Adresse ändern'}
    </button>
  );
}

export function EmailAendernForm({ aktuelleEmail }: { aktuelleEmail: string }) {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(emailAendernAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs text-brand/50">Aktuell hinterlegt: {aktuelleEmail}</p>
      <KontoFeld id="email" name="email" label="Neue E-Mail-Adresse" type="email" autoComplete="email" required />
      <KontoFeld
        id="aktuellesPasswort"
        name="aktuellesPasswort"
        label="Aktuelles Passwort"
        type="password"
        autoComplete="current-password"
        required
      />
      {state?.error && (
        <p role="alert" className={`text-xs ${state.success ? 'text-green-700' : 'text-red-600'}`}>
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
