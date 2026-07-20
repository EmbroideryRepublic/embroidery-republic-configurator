/**
 * Zugangsschutz des Admin-Bereichs – bewusst minimal gehalten:
 * EIN gemeinsames Admin-Secret aus der Umgebung (ADMIN_SECRET), das nach
 * erfolgreicher Eingabe als httpOnly-Cookie gehalten wird.
 *
 * Warum kein volles Login-System: Es gibt (bewusst, siehe Projektregel)
 * keine Kundenkonten, und der Admin-Bereich hat genau einen Nutzerkreis –
 * den Betreiber. Ein Secret in .env.local ist dafür der kleinste sichere
 * Mechanismus: kein Passwort in der DB, keine Session-Tabelle, sofort
 * rotierbar (env ändern = alle ausgesperrt). Sollte später ein echtes
 * Mehrbenutzer-Login nötig werden, ist diese Datei die einzige
 * Austauschstelle (isAdminAuthenticated wird überall verwendet).
 *
 * Sicherheitsverhalten ohne gesetztes ADMIN_SECRET: Zugriff IMMER
 * verweigert (sicherer Default) – mit klarem Hinweis in der UI.
 */
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'er_admin_key';

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 12);
}

export function isAdminAuthenticated(): boolean {
  if (!isAdminConfigured()) return false;
  const cookieValue = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(cookieValue && cookieValue === process.env.ADMIN_SECRET);
}
