/**
 * Gemeinsamer Rahmen für alle transaktionalen E-Mails (Bestellbestätigung,
 * interne Benachrichtigung und künftige Typen wie Zahlungseingang,
 * Produktionsstatus, Versandbestätigung, Passwort-Reset, ...). Ersetzt die
 * frühere `emailShell()`-HTML-String-Funktion – gleiche Markenwerte
 * (Farben, Footer-Text), jetzt als wiederverwendbare React-Komponente.
 */
import { Html, Head, Preview, Body, Container, Text, Hr } from '@react-email/components';
import type { ReactNode } from 'react';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { formatiereGeld } from '@/lib/format';

const COLORS = {
  text: '#23211d',
  muted: '#6b675e',
  border: '#eee9db',
  background: '#f7f5f0',
  gold: '#9a6b2f',
};

interface EmailLayoutProps {
  /** Im Posteingang als Vorschautext angezeigt (vor dem Öffnen sichtbar). */
  previewText: string;
  title: string;
  children: ReactNode;
}

export function EmailLayout({ previewText, title, children }: EmailLayoutProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: '-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24, color: COLORS.text }}>
          <Text style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>{title}</Text>
          {children}
          <Hr style={{ borderColor: COLORS.border, marginTop: 24 }} />
          <Text style={{ fontSize: 12, color: COLORS.muted, margin: '8px 0 0' }}>Embroidery Republic Germany</Text>
        </Container>
      </Body>
    </Html>
  );
}

export { COLORS };

/** Positionstabelle (Produkt/Farbe/Größen/Motiv-Anzahl/Preis) – von
 *  Bestellbestätigung UND interner Benachrichtigung genutzt, damit beide
 *  E-Mails exakt dieselbe Darstellung zeigen. Weitere Bestell-bezogene
 *  E-Mails (z.B. Versandbestätigung) können sie ebenfalls wiederverwenden. */
export function OrderItemsTable({ order }: { order: OrderRecord }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
      <tbody>
        {order.items.map((item, index) => {
          const sizes = Object.entries(item.sizeQuantities)
            .filter(([, qty]) => qty > 0)
            .map(([size, qty]) => `${qty}× ${size}`)
            .join(', ');
          return (
            <tr key={index}>
              <td style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <strong>{item.productName}</strong> · {item.colorName}
                <br />
                <span style={{ color: COLORS.muted, fontSize: 13 }}>
                  {sizes} · {item.elements.length} Motiv(e)
                </span>
              </td>
              <td style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {formatiereGeld(item.totalPrice)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
