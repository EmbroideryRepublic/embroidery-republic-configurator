'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { registrierenAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird angelegt …' : 'Konto anlegen'}
    </button>
  );
}

export function RegistrierenForm() {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(registrierenAction, null);

  if (state?.success) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold-light/30 p-4 text-sm text-brand">
        <p className="font-medium">Fast geschafft!</p>
        <p className="mt-1 text-brand/70">
          Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie darüber Ihre E-Mail-Adresse, um Ihr Konto zu
          aktivieren.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <KontoFeld id="email" name="email" label="E-Mail-Adresse" type="email" autoComplete="email" required />
      <div>
        <KontoFeld
          id="passwort"
          name="passwort"
          label="Passwort"
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
        label="Passwort wiederholen"
        type="password"
        autoComplete="new-password"
        required
      />
      <label className="flex items-start gap-2 text-xs text-brand/60">
        <input type="checkbox" name="newsletter" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-md border-brand/30 accent-gold" />
        <span>Ich möchte gelegentlich Neuigkeiten und Angebote per E-Mail erhalten (jederzeit abbestellbar).</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-brand/60">
        <input
          type="checkbox"
          name="einwilligungAgb"
          required
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-md border-brand/30 accent-gold"
        />
        <span>
          Ich akzeptiere die{' '}
          <Link href="/agb" className="text-gold-dark underline">
            AGB
          </Link>{' '}
          und die{' '}
          <Link href="/datenschutz" className="text-gold-dark underline">
            Datenschutzerklärung
          </Link>
          .
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-brand/50">
        Bereits registriert?{' '}
        <Link href="/konto/anmelden" className="font-medium text-gold-dark hover:underline">
          Jetzt anmelden
        </Link>
      </p>
    </form>
  );
}
