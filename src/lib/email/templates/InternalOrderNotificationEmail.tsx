/**
 * Interne Benachrichtigung über eine neue Bestellung/Anfrage. Inhaltlich
 * 1:1 aus der früheren HTML-String-Version (`sendInternalNotification` in
 * orderEmails.ts) übernommen, jetzt als React-Komponente.
 */
import { Text, Link } from '@react-email/components';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import { EmailLayout, OrderItemsTable, COLORS } from './EmailLayout';
import { formatiereGeld } from '@/lib/format';

function PlacedElements({ order }: { order: OrderRecord }) {
  const rows = order.items.flatMap((item) =>
    item.elements.map((el, elIndex) => {
      const motif = el.type === 'logo' ? `Logo "${el.fileName ?? ''}"` : `Text "${el.content ?? ''}"`;
      return (
        <li key={`${item.productId}-${elIndex}`}>
          {item.productName} · {PRINT_VIEW_LABELS[el.view]}: {motif} — {el.widthCm.toFixed(1)}×{el.heightCm.toFixed(1)} cm bei ({el.xCm.toFixed(1)},{' '}
          {el.yCm.toFixed(1)}) cm
        </li>
      );
    })
  );
  if (rows.length === 0) return null;
  return (
    <>
      <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 4 }}>Platzierte Motive</Text>
      <ul style={{ fontSize: 13, color: '#3a3830', paddingLeft: 18, margin: 0 }}>{rows}</ul>
    </>
  );
}

export function InternalOrderNotificationEmail({
  order,
  productionSheetSignedUrl,
}: {
  order: OrderRecord;
  productionSheetSignedUrl: string | null;
}) {
  const isOrder = order.orderType === 'order';
  const title = `${isOrder ? 'Neue Bestellung' : 'Neue Anfrage'}: ${order.orderNumber}`;

  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        <strong>{order.contact.name}</strong>
        {order.contact.company ? ` (${order.contact.company})` : ''} · {order.contact.email}
        {order.contact.phone ? ` · ${order.contact.phone}` : ''}
      </Text>
      {order.shipping && (
        <Text style={{ margin: '4px 0 0' }}>
          {order.shipping.street}, {order.shipping.zip} {order.shipping.city}, {order.shipping.country}
        </Text>
      )}
      {order.message && (
        <Text style={{ backgroundColor: COLORS.background, padding: 10, borderRadius: 6, margin: '8px 0 0' }}>{order.message}</Text>
      )}
      <OrderItemsTable order={order} />
      <Text style={{ marginTop: 12, textAlign: 'right', fontSize: 16, fontWeight: 600 }}>Gesamtsumme: {formatiereGeld(order.totalPrice)}</Text>
      <PlacedElements order={order} />
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
