'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { adminLogin, type AdminActionResult } from '@/lib/actions/admin';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
    >
      {pending ? 'Prüfe …' : 'Anmelden'}
    </button>
  );
}

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const [state, formAction] = useFormState<AdminActionResult | null, FormData>(adminLogin, null);

  return (
    <div className="mx-auto mt-24 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-lg font-semibold">Admin-Bereich</h1>
      <p className="mb-4 text-sm text-gray-500">Zugangsschlüssel eingeben (ADMIN_SECRET aus .env.local).</p>
      {!configured && (
        <p className="mb-4 rounded bg-red-50 p-2 text-xs text-red-700">
          ADMIN_SECRET ist nicht konfiguriert – bitte in .env.local einen Schlüssel mit mindestens 12 Zeichen setzen
          und den Server neu starten.
        </p>
      )}
      <form action={formAction} className="space-y-3">
        <input
          type="password"
          name="key"
          autoFocus
          placeholder="Zugangsschlüssel"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
