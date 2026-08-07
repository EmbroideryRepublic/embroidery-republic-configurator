'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { passwortZuruecksetzenAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird gespeichert …' : 'Neues Passwort speichern'}
    </button>
  );
}

export function PasswortZuruecksetzenForm() {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(passwortZuruecksetzenAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push('/konto'), 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold-light/30 p-4 text-sm text-brand">
        Ihr Passwort wurde geändert. Sie werden weitergeleitet …
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <KontoFeld
          id="passwort"
          name="passwort"
          label="Neues Passwort"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
        />
        <p className="mt-1 text-[11px] text-brand/40">Mindestens 8 Zeichen, mit Buchstabe und Ziffer.</p>
      </div>
      <KontoFeld
        id="passwortWiederholung"
        name="passwortWiederholung"
        label="Neues Passwort wiederholen"
        type="password"
        autoComplete="new-password"
        required
      />
      {state?.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
