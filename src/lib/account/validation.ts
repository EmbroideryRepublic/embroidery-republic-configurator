/**
 * Reine Validierung rund um das Kundenkonto – kein Datenbankzugriff, keine
 * Supabase-Auth-Aufrufe. Server Actions (lib/actions/konto.ts) UND das
 * Formular selbst nutzen dieselben Funktionen, damit Client- und
 * Server-Prüfung nie auseinanderlaufen.
 *
 * Passwort-Hashing, tatsächliche Eindeutigkeit der E-Mail und Rate-Limits
 * übernimmt Supabase Auth bzw. lib/security/rateLimit.ts – hier geht es nur
 * um das FORMAT der Eingabe, bevor sie überhaupt dorthin geschickt wird.
 */
import type { KundenAdresseEingabe } from './types';
import { GRENZEN, istGueltigePlz } from '@/lib/orders/orderValidation';

export interface ValidierungsBefund {
  feld: string;
  meldung: string;
}

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mindestens 8 Zeichen, mindestens ein Buchstabe UND eine Ziffer.
 *
 * Bewusst über Supabase Auths Standardminimum (6 Zeichen, keine
 * Komplexitätsprüfung) hinaus – eine zusätzliche, eigene Grenze als
 * Verteidigung in der Tiefe, keine Änderung an Supabase selbst nötig.
 */
export function pruefePasswort(passwort: string): ValidierungsBefund[] {
  const befunde: ValidierungsBefund[] = [];
  if (passwort.length < 8) befunde.push({ feld: 'passwort', meldung: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
  if (!/[a-zA-Z]/.test(passwort)) befunde.push({ feld: 'passwort', meldung: 'Das Passwort muss mindestens einen Buchstaben enthalten.' });
  if (!/[0-9]/.test(passwort)) befunde.push({ feld: 'passwort', meldung: 'Das Passwort muss mindestens eine Ziffer enthalten.' });
  return befunde;
}

export function pruefeEmail(email: string): ValidierungsBefund[] {
  if (!email.trim()) return [{ feld: 'email', meldung: 'Bitte geben Sie Ihre E-Mail-Adresse an.' }];
  if (!EMAIL_MUSTER.test(email.trim())) return [{ feld: 'email', meldung: 'Diese E-Mail-Adresse sieht nicht gültig aus.' }];
  return [];
}

export interface RegistrierungsEingabe {
  email: string;
  passwort: string;
  passwortWiederholung: string;
  einwilligungAgb: boolean;
}

export function pruefeRegistrierung(eingabe: RegistrierungsEingabe): ValidierungsBefund[] {
  const befunde: ValidierungsBefund[] = [...pruefeEmail(eingabe.email), ...pruefePasswort(eingabe.passwort)];
  if (eingabe.passwort !== eingabe.passwortWiederholung) {
    befunde.push({ feld: 'passwortWiederholung', meldung: 'Die Passwörter stimmen nicht überein.' });
  }
  if (!eingabe.einwilligungAgb) {
    befunde.push({ feld: 'einwilligungAgb', meldung: 'Bitte bestätigen Sie die AGB und die Datenschutzerklärung.' });
  }
  return befunde;
}

/**
 * Dieselben Pflichtfelder wie im Gast-Checkout (CartDrawer.tsx `isValid`) –
 * bewusst identisch, damit eine Adresse aus dem Konto genauso zuverlässig
 * lieferbar ist wie eine im Checkout eingegebene.
 */
export function pruefeAdresse(eingabe: KundenAdresseEingabe): ValidierungsBefund[] {
  const befunde: ValidierungsBefund[] = [];
  const pflicht: [keyof KundenAdresseEingabe, string][] = [
    ['firstName', 'Vorname'],
    ['lastName', 'Nachname'],
    ['street', 'Straße & Hausnummer'],
    ['zip', 'PLZ'],
    ['city', 'Stadt'],
    ['country', 'Land'],
  ];
  for (const [feld, label] of pflicht) {
    if (!eingabe[feld]?.toString().trim()) {
      befunde.push({ feld, meldung: `${label} ist ein Pflichtfeld.` });
    }
  }
  // Dieselbe Regel wie im Gast-Checkout (orderValidation.ts istGueltigePlz) –
  // nur geprüft, wenn die PLZ nicht schon oben als fehlend gemeldet wurde.
  if (eingabe.zip?.toString().trim() && !istGueltigePlz(eingabe.zip.toString())) {
    befunde.push({ feld: 'zip', meldung: 'Bitte geben Sie eine gültige Postleitzahl an (5 Ziffern).' });
  }
  // Dieselbe Obergrenze wie im Gast-Checkout (orderValidation.ts
  // GRENZEN.maxFeldLaenge) – schützt die Datenbank vor Riesen-Eingaben, auch
  // bei den hier optionalen Feldern (company, phone, label).
  const alleFelder: [keyof KundenAdresseEingabe, string][] = [
    ...pflicht,
    ['company', 'Firma'],
    ['phone', 'Telefon'],
    ['label', 'Bezeichnung'],
  ];
  for (const [feld, label] of alleFelder) {
    if ((eingabe[feld]?.toString().length ?? 0) > GRENZEN.maxFeldLaenge) {
      befunde.push({ feld, meldung: `${label} darf höchstens ${GRENZEN.maxFeldLaenge} Zeichen lang sein.` });
    }
  }
  return befunde;
}
