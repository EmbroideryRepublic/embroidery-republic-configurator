/**
 * „Dein Auftrag wurde geändert“ – geht an die Kundschaft, nachdem der Betreiber
 * im Adminbereich eine Position entfernt oder eine Stückzahl verringert hat
 * (lib/orders/orderEditService.ts).
 *
 * Die Mail nennt, was sich geändert hat, die alte und die neue Gesamtsumme und
 * – ausschließlich nach dem, was der Code TATSÄCHLICH tut – was mit Rechnung
 * und Zahlung geschieht (siehe `RechnungsHinweis` in orderEdit.ts):
 *
 *  • Es gibt noch keine Rechnung → sie entsteht mit den geänderten Angaben.
 *  • Es gibt schon eine Rechnung → sie gilt für den bisherigen Stand; eine
 *    angepasste schickt der Betreiber separat nach (das System erzeugt keine
 *    Korrekturrechnung). Die Mail behauptet bewusst NICHT, die alte Rechnung
 *    sei „ungültig“ oder „storniert“ – das wäre eine rechtliche Aussage.
 *  • Bezahlt → der Differenzbetrag wird erstattet (der Betreiber löst die
 *    Teilerstattung selbst aus und hat das vor dem Speichern bestätigt).
 *
 * Wie alle Kundenmails per Du (Entscheidung des Betreibers vom 24.11.2026).
 */
import { Text } from '@react-email/components';
import { COMPANY } from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld } from '@/lib/format';
import type { KundenmailDaten } from '@/lib/orders/orderEdit';
import { COLORS, EmailLayout } from './EmailLayout';

function euro(cent: number): string {
  return formatiereGeld(cent / 100);
}

export function OrderEditedEmail({ daten }: { daten: KundenmailDaten }) {
  const title = `Dein Auftrag ${daten.orderNumber} wurde geändert`;
  const versandNeuDazu = daten.versandAltCent === 0 && daten.versandNeuCent > 0;

  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Wir haben deinen Auftrag <strong>{daten.orderNumber}</strong> geändert:
      </Text>

      <ul style={{ margin: '12px 0 0', paddingLeft: 20 }}>
        {daten.aenderungen.map((zeile, i) => (
          <li key={i} style={{ margin: '4px 0' }}>
            {zeile}
          </li>
        ))}
      </ul>

      {/* Bewusst Absätze statt Tabelle: In der Klartext-Fassung (Text-Fallback jeder Mail) stünden Tabellenzellen sonst ohne
          Trenner direkt hintereinander („Gesamtsumme85,98 €“). */}
      <Text style={{ margin: '16px 0 0' }}>Bisherige Gesamtsumme: {euro(daten.altGesamtCent)}</Text>
      <Text style={{ margin: '2px 0 0', fontSize: 16 }}>
        <strong>Neue Gesamtsumme: {euro(daten.neuGesamtCent)}</strong>
      </Text>
      {daten.differenzCent > 0 && <Text style={{ margin: '2px 0 0', color: COLORS.muted }}>Differenz: {euro(daten.differenzCent)}</Text>}

      {versandNeuDazu && (
        <Text style={{ marginTop: 12, fontSize: 13 }}>
          Durch die Änderung liegt dein Warenwert unter {formatiereGeld(SHIPPING_RATES.DE.freeFrom)} – deshalb fallen{' '}
          {euro(daten.versandNeuCent)} Versandkosten an. Die Versandkosten sind in der neuen Gesamtsumme bereits enthalten.
        </Text>
      )}

      {daten.zahlung === 'bezahlt' && daten.differenzCent > 0 && (
        <Text style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Zahlung:</strong> Den zu viel gezahlten Betrag von {euro(daten.differenzCent)} erstatten wir dir auf dem
          Zahlungsweg, den du für die Bestellung genutzt hast.
        </Text>
      )}

      <Text style={{ marginTop: 12, fontSize: 13 }}>
        <strong>Rechnung:</strong>{' '}
        {daten.rechnung.art === 'folgt-separat' ? (
          <>
            Die bisherige Rechnung {daten.rechnung.rechnungsnummer} berücksichtigt diese Änderung noch nicht. Eine
            angepasste Rechnung senden wir dir separat zu.
            {daten.zahlung === 'rechnung' && ' Bitte überweise erst, wenn du sie bekommen hast.'}
          </>
        ) : (
          <>Deine Rechnung erstellen wir mit den geänderten Angaben.</>
        )}
      </Text>

      {daten.bestellansichtUrl && (
        <Text style={{ marginTop: 12, fontSize: 13 }}>
          Deine Bestellung ansehen:{' '}
          <a href={daten.bestellansichtUrl} style={{ color: '#8a6d3b' }}>
            {daten.bestellansichtUrl}
          </a>
        </Text>
      )}

      <Text style={{ marginTop: 16, fontSize: 13 }}>
        Stimmt etwas nicht oder war das so nicht abgesprochen? Melde dich bitte direkt bei uns:
        <br />
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: {COMPANY.email}
      </Text>
    </EmailLayout>
  );
}
