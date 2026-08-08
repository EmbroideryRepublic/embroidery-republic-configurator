'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { profilAktualisierenAction, type KontoActionResult } from '@/lib/actions/konto';
import type { KundenProfil } from '@/lib/account/types';
import { KontoFeld } from './KontoFeld';
import { GRENZEN } from '@/lib/orders/orderValidation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird gespeichert …' : 'Speichern'}
    </button>
  );
}

export function ProfilForm({ profil }: { profil: KundenProfil }) {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(profilAktualisierenAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <KontoFeld
          id="displayName"
          name="displayName"
          label="Name"
          defaultValue={profil.displayName ?? ''}
          spalten
          autoComplete="name"
          maxLength={GRENZEN.maxFeldLaenge}
        />
        <KontoFeld
          id="phone"
          name="phone"
          label="Telefon"
          type="tel"
          defaultValue={profil.phone ?? ''}
          autoComplete="tel"
          maxLength={GRENZEN.maxFeldLaenge}
        />
        <KontoFeld
          id="company"
          name="company"
          label="Firma (optional)"
          defaultValue={profil.company ?? ''}
          autoComplete="organization"
          maxLength={GRENZEN.maxFeldLaenge}
        />
        <KontoFeld
          id="vatId"
          name="vatId"
          label="USt-IdNr. (optional)"
          defaultValue={profil.vatId ?? ''}
          maxLength={GRENZEN.maxFeldLaenge}
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-brand/70">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={profil.newsletterOptIn}
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-md border-brand/30 accent-gold"
        />
        <span>Ich möchte gelegentlich Neuigkeiten und Angebote per E-Mail erhalten (jederzeit abbestellbar).</span>
      </label>
      {state?.error && (
        <p role="alert" className={`text-xs ${state.success ? 'text-green-700' : 'text-red-600'}`}>
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
