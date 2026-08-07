'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { passwortVergessenAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird gesendet …' : 'Link zum Zurücksetzen senden'}
    </button>
  );
}

export function PasswortVergessenForm() {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(passwortVergessenAction, null);

  if (state?.success) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold-light/30 p-4 text-sm text-brand">
        {state.error}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <KontoFeld id="email" name="email" label="E-Mail-Adresse" type="email" autoComplete="email" required />
      {state?.error && !state.success && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-brand/50">
        <Link href="/konto/anmelden" className="font-medium text-gold-dark hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
}
