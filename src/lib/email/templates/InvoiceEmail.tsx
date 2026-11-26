/**
 * Kurze Nachtrags-E-Mail für die Rechnung – NUR für den seltenen
 * Cron-Nachholfall (`holeOffeneRechnungenNach`, orderCompletion.ts), bei dem
 * die Rechnungserstellung beim regulären Bestellabschluss fehlschlug und die
 * Bestellbestätigung deshalb bereits OHNE Rechnung verschickt wurde.
 *
 * Im Regelfall läuft die Rechnung stattdessen als PDF-Anhang direkt in der
 * Bestellbestätigung mit (siehe OrderConfirmationEmail.tsx) – bis 2026-09-01
 * gab es dafür eine eigene, vollständig durchformatierte Rechnungs-E-Mail
 * mit allen Positionen/Beträgen; das duplizierte nur, was im angehängten
 * PDF (dem rechtsverbindlichen Dokument, siehe orderCompletion.ts::
 * erzeugeRechnung) ohnehin bereits steht, und war einer von drei getrennten
 * E-Mails für ein einziges Bestellereignis (Fund vom 2026-09-01, echter
 * PayPal-Live-Test). Diese Nachtrags-Mail bleibt bewusst kurz – die
 * Bestellpositionen kennt die Kundschaft bereits aus der Bestellbestätigung,
 * die vollständigen Pflichtangaben nach § 14 UStG stehen im PDF.
 */
import { Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

export function InvoiceEmail({
  orderNumber,
  invoiceNumber,
  invoiceDate,
  replaces,
}: {
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  /**
   * Nur bei einer Ersatzrechnung nach einer Auftragsänderung (orderInvoiceReplacement.ts): die Rechnung, die diese
   * ersetzt. Die Mail nennt sie – mehr nicht (keine Aussage dazu, wie sie rechtlich zu behandeln ist).
   */
  replaces?: { invoiceNumber: string; invoiceDate: string | null };
}) {
  const title = `Rechnung ${invoiceNumber}`;
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Zu deiner Bestellung {orderNumber} findest du anbei die Rechnung {invoiceNumber} vom {invoiceDate} als
        PDF.
        {replaces
          ? ` Diese Rechnung ersetzt die Rechnung ${replaces.invoiceNumber}${replaces.invoiceDate ? ` vom ${replaces.invoiceDate}` : ''}.`
          : null}
      </Text>
    </EmailLayout>
  );
}
