'use client';

/**
 * Gemeinsames Eingabefeld für alle Konto-Formulare – dieselbe Optik wie das
 * Checkout-Formular (CartDrawer.tsx `Feld`), hier einmal zentral statt in
 * jeder Konto-Seite neu gebaut.
 */

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
  /** Spiegelt eine serverseitige Formatregel clientseitig (z.B. Passwort-Komplexität). */
  pattern?: string;
  /** Über beide Spalten eines zweispaltigen Formulars. */
  spalten?: boolean;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
}) {
  return (
    <div className={spalten ? 'col-span-2' : undefined}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-brand/60">
        {label}
        {required && <span className="text-gold-dark"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        pattern={pattern}
        inputMode={inputMode}
        className={FELD_KLASSE}
      />
    </div>
  );
}
