'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import type { KundenAdresse } from '@/lib/account/types';
import type { KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Gemeinsame Felder für Anlegen UND Bearbeiten. `action` ist bereits mit der
 * Adress-ID gebunden (`aktualisiereAdresseAction.bind(null, id)`) oder die
 * unveränderte Anlege-Action – dieselbe Formularmarkierung für beide Fälle.
 */
export function AdressForm({
  action,
  bestehend,
  onAbbrechen,
  onErfolg,
  submitLabel,
  submitPendingLabel,
}: {
  action: (prev: KontoActionResult | null, formData: FormData) => Promise<KontoActionResult>;
  bestehend?: KundenAdresse;
  onAbbrechen?: () => void;
  /** Wird aufgerufen, sobald das Speichern erfolgreich war – schließt z.B.
   *  das Formular wieder in der Übersicht. */
  onErfolg?: () => void;
  submitLabel: string;
  submitPendingLabel: string;
}) {
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(action, null);

  useEffect(() => {
    if (state?.success) onErfolg?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-3">
      <KontoFeld id="label" name="label" label="Bezeichnung (optional, z.B. Zuhause)" defaultValue={bestehend?.label ?? ''} spalten />
      <div className="grid grid-cols-2 gap-3">
        <KontoFeld id="firstName" name="firstName" label="Vorname" defaultValue={bestehend?.firstName ?? ''} required autoComplete="given-name" />
        <KontoFeld id="lastName" name="lastName" label="Nachname" defaultValue={bestehend?.lastName ?? ''} required autoComplete="family-name" />
        <KontoFeld id="company" name="company" label="Firma (optional)" defaultValue={bestehend?.company ?? ''} spalten autoComplete="organization" />
        <KontoFeld id="street" name="street" label="Straße & Hausnummer" defaultValue={bestehend?.street ?? ''} required spalten autoComplete="street-address" />
        <KontoFeld id="zip" name="zip" label="PLZ" defaultValue={bestehend?.zip ?? ''} required autoComplete="postal-code" inputMode="numeric" />
        <KontoFeld id="city" name="city" label="Stadt" defaultValue={bestehend?.city ?? ''} required autoComplete="address-level2" />
        <KontoFeld id="phone" name="phone" label="Telefon (optional)" type="tel" defaultValue={bestehend?.phone ?? ''} autoComplete="tel" />
      </div>
      {/* Land: dieselbe Begrenzung wie im Checkout (config/shipping.ts) –
          eine gespeicherte, aber nicht lieferbare Adresse wäre nutzlos. */}
      <input type="hidden" name="country" value="Deutschland" />
      <p className="text-xs text-brand/50">Land: Deutschland (aktuell einziges Lieferland)</p>
      {state?.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} pendingLabel={submitPendingLabel} />
        {onAbbrechen && (
          <button type="button" onClick={onAbbrechen} className="text-xs text-brand/50 hover:text-brand">
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
