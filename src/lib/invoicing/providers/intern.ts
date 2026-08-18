/**
 * ═══════════════════════════════════════════════════════════════════════
 * INTERNER RECHNUNGSANBIETER – Website erzeugt ihre eigene Rechnung
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Erfüllt exakt denselben Port wie lexware.ts (`erstelle`), aber ohne
 * externen Dienst: die Rechnungsnummer kommt aus dem eigenen, atomaren
 * Nummernkreis (Migration 0028, siehe `auftrag.naechsteRechnungsnummer`),
 * das PDF wird lokal mit @react-pdf/renderer gerendert (siehe
 * internRechnungPdf.tsx). Standardanbieter seit der Lexware-Stilllegung
 * (siehe registry.ts) – Lexware bleibt als optionaler Zusatzanbieter
 * bestehen, blockiert aber nie mehr die normale Bestellabwicklung.
 *
 * ── Punkt ohne Wiederkehr ───────────────────────────────────────────────
 * Ab dem Auflösen von `naechsteRechnungsnummer()` gilt die Nummer als
 * verbraucht (exakt wie Lexwares `finalize=true`) – jeder Fehlschlag AB
 * DIESEM Zeitpunkt wirft `RechnungsTeilerfolgFehler` mit der bereits
 * bekannten Nummer, damit der bestehende catch-Block in orderCompletion.ts
 * (unverändert) invoice_id/invoice_number sichern kann, statt bei einem
 * Retry eine zweite Nummer zu ziehen.
 */
import { randomUUID } from 'node:crypto';
import { RechnungsTeilerfolgFehler, type RechnungsAnbieter, type Rechnungsauftrag, type Rechnungserstellung } from '../types';
import { renderRechnungPdf } from './internRechnungPdf';

export const internerRechnungsAnbieter: RechnungsAnbieter = {
  id: 'intern',

  async erstelle(auftrag: Rechnungsauftrag): Promise<Rechnungserstellung> {
    const rechnungsnummer = await auftrag.naechsteRechnungsnummer();
    const rechnungsId = randomUUID();

    try {
      const pdf = await renderRechnungPdf(auftrag, rechnungsnummer);
      return { rechnungsId, rechnungsnummer, pdf };
    } catch (err) {
      throw new RechnungsTeilerfolgFehler(
        `Rechnung ${rechnungsnummer} (${rechnungsId}) wurde nummeriert, das PDF konnte aber nicht gerendert werden: ${
          err instanceof Error ? err.message : String(err)
        }`,
        rechnungsId,
        rechnungsnummer
      );
    }
  },
};
