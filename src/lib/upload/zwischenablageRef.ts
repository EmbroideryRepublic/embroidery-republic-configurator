/**
 * Verweis auf eine in Teilen hochgeladene Datei – die reinen, überall nutzbaren Bausteine (Browser UND Server).
 *
 * Format: `staged:<Tag>:<Ticket>:<Teile>:<Bytes>`
 *   Tag     Kalendertag des Uploads, UTC, JJJJMMTT – Ordnername und Grundlage der Aufräumregel
 *   Ticket  zufällige UUID, vom Browser erzeugt
 *   Teile   wie viele Teile die Datei hat (1 bis MAX_TEILE)
 *   Bytes   Gesamtgröße der zusammengesetzten Datei – der Server prüft sie nach dem Zusammensetzen
 *
 * Der Verweis ersetzt in der Bestellung die Data-URL (`LogoElement.fileUrl`/`originalFileUrl`). Er enthält nichts Vertrauenswürdiges:
 * Der Server liest nur die Teile unter genau diesem Pfad und prüft die zusammengesetzte Datei vollständig.
 */
import { MAX_TEILE, TEIL_MAX_BYTES, ZWISCHENABLAGE_ORDNER } from '@/config/upload';

export const ZWISCHENABLAGE_PRAEFIX = 'staged:';

const TICKET = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TAG = /^\d{8}$/;
/** Obergrenze der zusammengesetzten Datei, abgeleitet aus Teilzahl und Teilgröße – die genaue Grenze prüft pruefeBytes. */
const MAX_BYTES_GESAMT = MAX_TEILE * TEIL_MAX_BYTES;

export interface ZwischenablageRef {
  tag: string;
  ticket: string;
  teile: number;
  bytes: number;
}

export function baueRef(r: ZwischenablageRef): string {
  return `${ZWISCHENABLAGE_PRAEFIX}${r.tag}:${r.ticket}:${r.teile}:${r.bytes}`;
}

/** Liest einen Verweis streng; alles, was nicht exakt passt, ist `null`. */
export function liesRef(wert: unknown): ZwischenablageRef | null {
  if (typeof wert !== 'string' || !wert.startsWith(ZWISCHENABLAGE_PRAEFIX) || wert.length > 120) return null;
  const teile = wert.slice(ZWISCHENABLAGE_PRAEFIX.length).split(':');
  if (teile.length !== 4) return null;
  const [tag, ticket, anzahl, bytes] = teile as [string, string, string, string];
  if (!istGueltigerTag(tag) || !TICKET.test(ticket) || !/^\d{1,2}$/.test(anzahl) || !/^\d{1,9}$/.test(bytes)) return null;
  const n = Number(anzahl);
  const b = Number(bytes);
  if (n < 1 || n > MAX_TEILE || b < 1 || b > MAX_BYTES_GESAMT) return null;
  // Die Teilzahl muss zur Größe passen: n Teile fassen mehr als (n−1) volle Teile und höchstens n volle.
  if (b <= (n - 1) * TEIL_MAX_BYTES || b > n * TEIL_MAX_BYTES) return null;
  return { tag, ticket, teile: n, bytes: b };
}

export function istZwischenablageRef(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.startsWith(ZWISCHENABLAGE_PRAEFIX);
}

/** Kalendertag als JJJJMMTT in UTC. */
export function tagVon(jetzt: Date = new Date()): string {
  return jetzt.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Ist das ein echtes Datum im Format JJJJMMTT? */
export function istGueltigerTag(tag: string): boolean {
  if (!TAG.test(tag)) return false;
  const jahr = Number(tag.slice(0, 4));
  const monat = Number(tag.slice(4, 6));
  const tagImMonat = Number(tag.slice(6, 8));
  const d = new Date(Date.UTC(jahr, monat - 1, tagImMonat));
  return d.getUTCFullYear() === jahr && d.getUTCMonth() === monat - 1 && d.getUTCDate() === tagImMonat && jahr >= 2026 && jahr <= 2100;
}

/** Ein Teil darf nur unter dem heutigen oder gestrigen Tag abgelegt werden (Tageswechsel während des Uploads). */
export function istTagFrisch(tag: string, jetzt: Date = new Date()): boolean {
  if (!istGueltigerTag(tag)) return false;
  const gestern = new Date(jetzt.getTime() - 24 * 60 * 60 * 1000);
  return tag === tagVon(jetzt) || tag === tagVon(gestern);
}

export function istGueltigesTicket(ticket: string): boolean {
  return TICKET.test(ticket);
}

export function ticketOrdner(r: { tag: string; ticket: string }): string {
  return `${ZWISCHENABLAGE_ORDNER}/${r.tag}/${r.ticket}`;
}

export function teilPfad(r: { tag: string; ticket: string }, nr: number): string {
  return `${ticketOrdner(r)}/${nr}.part`;
}
