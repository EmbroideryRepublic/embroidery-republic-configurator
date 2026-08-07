'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { kontoLoeschenAction, type KontoActionResult } from '@/lib/actions/konto';
import { KontoFeld } from './KontoFeld';

function LoeschenButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Wird gelöscht …' : 'Ja, Konto endgültig löschen'}
    </button>
  );
}

/**
 * Zweistufige Sicherheitsabfrage vorm Löschen des gesamten Kontos – dasselbe
 * Grundmuster wie AdressListe.tsx beim Löschen einer einzelnen Adresse (ein
 * versehentlicher Klick darf nichts auslösen), hier zusätzlich um eine
 * Passwort-Reeingabe ergänzt (Re-Auth-Muster aus PasswortAendernForm.tsx):
 * Anders als eine einzelne Adresse ist die Kontolöschung unwiderruflich und
 * betrifft die gesamte Anmeldung – zwei Klicks allein wären hier zu wenig.
 */
export function KontoLoeschenButton() {
  const [offen, setOffen] = useState(false);
  const [state, formAction] = useFormState<KontoActionResult | null, FormData>(kontoLoeschenAction, null);

  if (!offen) {
    return (
      <button type="button" onClick={() => setOffen(true)} className="text-xs font-medium text-red-600 hover:text-red-700">
        Konto endgültig löschen
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="flex items-start gap-2 text-xs font-medium text-red-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          Diese Aktion löscht Ihr Konto, Ihr Profil und alle gespeicherten Adressen unwiderruflich. Bereits getätigte
          Bestellungen bleiben aus rechtlichen Gründen (Rechnungs-/Buchführungspflicht) erhalten, werden aber von
          Ihrem Konto getrennt.
        </span>
      </p>
      <KontoFeld
        id="konto-loeschen-passwort"
        name="passwort"
        label="Passwort zur Bestätigung"
        type="password"
        autoComplete="current-password"
        required
      />
      {state?.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <LoeschenButton />
        <button type="button" onClick={() => setOffen(false)} className="text-xs font-medium text-brand/50 hover:text-brand">
          Abbrechen
        </button>
      </div>
    </form>
  );
}
