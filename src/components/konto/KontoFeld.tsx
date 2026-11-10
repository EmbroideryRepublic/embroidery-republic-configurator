'use client';

/**
 * Gemeinsames Eingabefeld für alle Konto-Formulare – dieselbe Optik wie das
 * Checkout-Formular (CartDrawer.tsx `Feld`), hier einmal zentral statt in
 * jeder Konto-Seite neu gebaut.
 */

import { useState } from 'react';
import { FELD_KLASSE } from '@/lib/ui/feldKlasse';

export function KontoFeld({
  id,
  label,
  name,
  type = 'text',
  defaultValue,
  autoComplete,
  required,
  minLength,
  maxLength,
  pattern,
  spalten,
  inputMode,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  /** Spiegelt eine serverseitige Formatregel clientseitig (z.B. Passwort-Komplexität). */
  pattern?: string;
  /** Über beide Spalten eines zweispaltigen Formulars. */
  spalten?: boolean;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
}) {
  // Passwortfelder bekommen "Anzeigen": Tippfehler lassen sich sonst erst nach dem Absenden bemerken.
  const [klartext, setKlartext] = useState(false);
  const istPasswort = type === 'password';
  return (
    <div className={spalten ? 'col-span-2' : undefined}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-brand/70">
        {label}
        {required && <span className="text-gold-dark"> *</span>}
      </label>
      <div className="relative">
      <input
        id={id}
        name={name}
        type={istPasswort && klartext ? 'text' : type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        className={istPasswort ? `${FELD_KLASSE} pr-24` : FELD_KLASSE}
      />
      {istPasswort && (
        <button
          type="button"
          onClick={() => setKlartext((an) => !an)}
          aria-pressed={klartext}
          aria-label={klartext ? 'Passwort verbergen' : 'Passwort anzeigen'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-3 py-2 text-xs font-medium text-gold-dark hover:bg-cream"
        >
          {klartext ? 'Verbergen' : 'Anzeigen'}
        </button>
      )}
      </div>
    </div>
  );
}
