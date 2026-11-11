/**
 * Interne Benachrichtigung an den Betreiber über eine neue Bestellung oder
 * Anfrage – geht SOFORT raus (config/orderProcess.ts).
 *
 * Sie soll alles enthalten, was für die weitere Bearbeitung nötig ist, ohne
 * den Adminbereich öffnen zu müssen:
 *   • wer (Name, Firma, E-Mail, Telefon, bei Bestellungen Lieferadresse),
 *   • was (Produkt, Farbe, Veredelung, Größen und Mengen),
 *   • welche Motive an welcher Position (Datei bzw. Text, Maße, bei Stickerei
 *     geschätzte Stichzahl) samt Link auf die Originaldatei,
 *   • der angezeigte Preis – bei einer Anfrage ausdrücklich als unverbindliche
 *     Kostenschätzung, bei einer Bestellung als Summe mit Versand.
 *
 * Eine Anfrage (Stickerei läuft nur so, config/bestellweg.ts) ist kein Vertrag:
 * Der Betreiber prüft, kalkuliert und antwortet mit einem verbindlichen
 * Angebot. Die Antwort-Adresse der Mail ist deshalb die der Kundschaft.
 */
import { Fragment } from 'react';
import { Text, Link } from '@react-email/components';
import type { OrderElementRecord, OrderItemRecord, OrderRecord } from '@/lib/actions/orderTypes';
import { PAYMENT_METHOD_LABELS, PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import { EmailLayout, COLORS } from './EmailLayout';
import { formatiereGeld, formatiereZeitpunkt, motivMass } from '@/lib/format';
import { warenkorbNurAlsAnfrage } from '@/config/bestellweg';
import { stornofristEndet, stornofristLaeuftNoch } from '@/config/orderProcess';

const VEREDELUNG: Record<OrderItemRecord['printMethod'], string> = {
  dtf: 'DTF-Transferdruck',
  embroidery: 'Stickerei',
};

/** 12400 → „12.400“ (de-DE), unabhängig von der Server-Locale. */
function zahl(wert: number): string {
  return wert.toLocaleString('de-DE');
}

/** 8 → „8,0“ */
function cm(wert: number): string {
  return motivMass(wert);
}

/** Text mit Zeilenumbrüchen: jede Zeile des Editors steht auch in der Mail auf einer eigenen Zeile. */
function zeilen(inhalt: string): string[] {
  return inhalt.split(/\r\n|\r|\n/);
}

function Motiv({ el, link }: { el: OrderElementRecord; link?: string }) {
  const textZeilen = el.type === 'text' ? zeilen(el.content ?? '') : [];
  const art =
    el.type === 'logo' ? (
      <>Logo „{el.fileName ?? 'ohne Dateiname'}“</>
    ) : (
      <>
        Text „
        {textZeilen.map((zeile, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {zeile}
          </Fragment>
        ))}
        “{el.fontFamily ? ` (${el.fontFamily}${el.color ? `, ${el.color}` : ''})` : ''}
      </>
    );
  const einzelheiten = [
    textZeilen.length > 1 ? `${textZeilen.length} Zeilen` : null,
    `${cm(el.widthCm)} × ${cm(el.heightCm)} cm`,
    el.geschaetzteStiche ? `ca. ${zahl(el.geschaetzteStiche)} Stiche` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li style={{ margin: '3px 0' }}>
      <strong>{PRINT_VIEW_LABELS[el.view] ?? el.view}:</strong> {art} — {einzelheiten}
      {link && (
        <>
          {' · '}
          <Link href={link} style={{ color: COLORS.gold }}>
            Originaldatei laden
          </Link>
        </>
      )}
    </li>
  );
}

function Position({ item, motivLinks }: { item: OrderItemRecord; motivLinks: Record<string, string> }) {
  const groessen = Object.entries(item.sizeQuantities)
    .filter(([, menge]) => menge > 0)
    .map(([groesse, menge]) => `${menge}× ${groesse}`)
    .join(', ');
  const stichzahlJeStueck = item.elements.reduce((summe, el) => summe + (el.geschaetzteStiche ?? 0), 0);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
      <tbody>
        <tr>
          <td style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, verticalAlign: 'top' }}>
            <strong>{item.productName}</strong> · {item.colorName}
            <br />
            <span style={{ color: COLORS.muted, fontSize: 13 }}>
              {VEREDELUNG[item.printMethod]} · {item.quantity} Stück{groessen ? ` (${groessen})` : ''}
            </span>
            {item.elements.length > 0 ? (
              <ul style={{ fontSize: 13, color: '#3a3830', paddingLeft: 18, margin: '8px 0 0' }}>
                {item.elements.map((el, index) => (
                  <Motiv
                    key={index}
                    el={el}
                    link={el.logoStoragePath ? motivLinks[el.logoStoragePath] : undefined}
                  />
                ))}
              </ul>
            ) : (
              <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: COLORS.muted }}>Noch kein Motiv platziert.</span>
            )}
            {stichzahlJeStueck > 0 && (
              <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: COLORS.muted }}>
                Geschätzt ca. {zahl(stichzahlJeStueck)} Stiche je Stück – die genaue Zahl steht erst nach der Digitalisierung fest.
              </span>
            )}
          </td>
          <td
            style={{
              padding: '8px 0',
              borderBottom: `1px solid ${COLORS.border}`,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              verticalAlign: 'top',
            }}
          >
            {formatiereGeld(item.totalPrice)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function InternalOrderNotificationEmail({
  order,
  productionSheetSignedUrl,
  motivLinks = {},
}: {
  order: OrderRecord;
  productionSheetSignedUrl: string | null;
  /** Download-Links auf die Originaldateien, Schlüssel = Speicherpfad. */
  motivLinks?: Record<string, string>;
}) {
  const isOrder = order.orderType === 'order';
  const hatStickerei = warenkorbNurAlsAnfrage(order.items);
  const art = isOrder ? 'Neue Bestellung' : hatStickerei ? 'Neue Anfrage (Stickerei)' : 'Neue Anfrage';
  const title = `${art}: ${order.orderNumber}`;
  const warenwert = Math.round(order.items.reduce((summe, item) => summe + item.totalPrice, 0) * 100) / 100;
  const versand = Math.max(0, Math.round((order.totalPrice - warenwert) * 100) / 100);

  return (
    <EmailLayout previewText={title} title={title}>
      {/* Was ist zu tun? – steht ganz oben, damit die Einordnung vor den Details kommt. */}
      <Text style={{ backgroundColor: COLORS.background, padding: 10, borderRadius: 6, margin: '0 0 14px' }}>
        {isOrder ? (
          <>
            <strong>Bestellung – verbindlich.</strong> Zahlungsart: {PAYMENT_METHOD_LABELS[order.paymentMethod ?? 'invoice']}.{' '}
            {stornofristLaeuftNoch(order.createdAt) ? (
              <>
                Die Kundschaft kann bis{' '}
                {formatiereZeitpunkt(stornofristEndet(order.createdAt), { dateStyle: 'short', timeStyle: 'short' })} Uhr selbst
                stornieren – bitte erst danach beschaffen und produzieren. Wird storniert, folgt eine weitere E-Mail.
              </>
            ) : (
              <>Die Stornofrist der Kundschaft ist abgelaufen – die Bestellung kann bearbeitet werden.</>
            )}
          </>
        ) : (
          <>
            <strong>Anfrage – noch kein Vertrag.</strong>{' '}
            {hatStickerei &&
              'Enthält Stickerei: Der Preis unten ist nur eine Schätzung, die genaue Stichzahl ergibt sich erst nach der Digitalisierung. '}
            Bitte prüfen, den endgültigen Preis kalkulieren und der Kundschaft ein verbindliches Angebot senden – einfach auf
            diese E-Mail antworten, die Antwort geht direkt an die Kundschaft.
          </>
        )}
      </Text>

      <Text style={{ margin: 0 }}>
        <strong>{order.contact.name}</strong>
        {order.contact.company ? ` (${order.contact.company})` : ''}
        <br />
        <Link href={`mailto:${order.contact.email}`} style={{ color: COLORS.gold }}>
          {order.contact.email}
        </Link>
        {order.contact.phone ? ` · ${order.contact.phone}` : ''}
      </Text>
      {order.shipping && (
        <Text style={{ margin: '4px 0 0' }}>
          Lieferadresse: {order.shipping.street}, {order.shipping.zip} {order.shipping.city}, {order.shipping.country}
        </Text>
      )}
      {order.customerVatId && <Text style={{ margin: '4px 0 0' }}>USt-IdNr.: {order.customerVatId}</Text>}
      {order.message && (
        <Text style={{ backgroundColor: COLORS.background, padding: 10, borderRadius: 6, margin: '8px 0 0' }}>{order.message}</Text>
      )}

      {order.items.length > 0 ? (
        order.items.map((item, index) => <Position key={index} item={item} motivLinks={motivLinks} />)
      ) : (
        <Text style={{ marginTop: 14, color: COLORS.muted }}>Keine Konfiguration beigefügt – reine Anfrage mit Nachricht.</Text>
      )}

      {isOrder ? (
        <>
          {/* Zwischensumme und Versand werden aus den Positionen abgeleitet statt aus
              order.subtotal: Eine aus der Datenbank rekonstruierte Bestellung (Zahlung per
              Karte/PayPal, nachgeholte Meldung) führt dort bereits die Endsumme. */}
          <Text style={{ margin: '12px 0 0', textAlign: 'right', fontSize: 13 }}>Zwischensumme: {formatiereGeld(warenwert)}</Text>
          <Text style={{ margin: '2px 0 0', textAlign: 'right', fontSize: 13 }}>
            Versand: {versand > 0 ? formatiereGeld(versand) : 'kostenlos'}
          </Text>
          <Text style={{ marginTop: 8, textAlign: 'right', fontSize: 16, fontWeight: 600 }}>
            Gesamtsumme: {formatiereGeld(order.totalPrice)}
          </Text>
        </>
      ) : (
        order.items.length > 0 && (
          <Text style={{ marginTop: 12, textAlign: 'right', fontSize: 16, fontWeight: 600 }}>
            Geschätzter Gesamtpreis (unverbindlich): {formatiereGeld(order.totalPrice)}
          </Text>
        )
      )}

      {productionSheetSignedUrl ? (
        <Text style={{ marginTop: 16 }}>
          <Link href={productionSheetSignedUrl} style={{ color: COLORS.gold }}>
            Produktionsblatt (PDF) öffnen
          </Link>{' '}
          — Link 7 Tage gültig.
        </Text>
      ) : (
        <Text style={{ marginTop: 16, color: '#b3402f' }}>
          Produktionsblatt konnte nicht verlinkt werden — bitte Storage-Bucket &quot;production-files&quot; in Supabase prüfen.
        </Text>
      )}
    </EmailLayout>
  );
}
