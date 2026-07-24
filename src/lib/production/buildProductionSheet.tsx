/**
 * Erzeugt das Produktionsblatt (PDF) für die Werkstatt: Kontakt/Lieferdaten,
 * Stückliste je Position nach Größe, gerenderte Druckvorschau je Ansicht
 * (Kleidungsstück + Motiv exakt wie im Editor platziert, siehe
 * src/lib/rendering/) und je platziertem Element die exakte Position/
 * Größe/Rotation in cm sowie (bei Text) Schriftart/-größe/-farbe. Bild und
 * Zahlen ergänzen sich bewusst, ersetzen sich nicht.
 */
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { OrderRecord } from '@/lib/actions/orderTypes';
import { PRINT_VIEW_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/actions/orderTypes';
import { formatiereGeld } from '@/lib/format';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#23211d' },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  h2: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  meta: { fontSize: 9, color: '#6b675e', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { border: '1pt solid #ddd8cc', borderRadius: 4, padding: 8, marginBottom: 8 },
  label: { color: '#6b675e', width: 90 },
  value: { flex: 1 },
  table: { border: '1pt solid #ddd8cc', borderRadius: 4, marginTop: 4 },
  tr: { flexDirection: 'row', borderBottom: '1pt solid #eee9db' },
  trLast: { flexDirection: 'row' },
  th: { flex: 1, padding: 5, fontWeight: 700, backgroundColor: '#f7f5f0' },
  td: { flex: 1, padding: 5 },
  itemHeading: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  itemSub: { fontSize: 9, color: '#6b675e', marginBottom: 6 },
  elementBlock: { marginTop: 4, padding: 6, backgroundColor: '#f7f5f0', borderRadius: 4 },
  elementTitle: { fontWeight: 700, marginBottom: 3 },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 6 },
  previewCard: { width: '48%' },
  previewImage: { width: '100%', borderRadius: 4 },
  previewLabel: { fontSize: 8, color: '#6b675e', marginTop: 2, marginBottom: 2 },
});

function ContactAndShipping({ order }: { order: OrderRecord }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Kontakt</Text>
        <Text style={styles.value}>
          {order.contact.name}
          {order.contact.company ? ` · ${order.contact.company}` : ''} · {order.contact.email}
          {order.contact.phone ? ` · ${order.contact.phone}` : ''}
        </Text>
      </View>
      {order.shipping && (
        <View style={styles.row}>
          <Text style={styles.label}>Lieferadresse</Text>
          <Text style={styles.value}>
            {order.shipping.street}, {order.shipping.zip} {order.shipping.city}, {order.shipping.country}
          </Text>
        </View>
      )}
      {order.paymentMethod && (
        <View style={styles.row}>
          <Text style={styles.label}>Zahlungsart</Text>
          <Text style={styles.value}>{PAYMENT_METHOD_LABELS[order.paymentMethod]} (gewählt, noch nicht abgewickelt)</Text>
        </View>
      )}
      {order.message && (
        <View style={styles.row}>
          <Text style={styles.label}>Nachricht</Text>
          <Text style={styles.value}>{order.message}</Text>
        </View>
      )}
    </View>
  );
}

function SizeTable({ sizeQuantities }: { sizeQuantities: Record<string, number> }) {
  const sizes = Object.entries(sizeQuantities).filter(([, qty]) => qty > 0);
  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        {sizes.map(([size]) => (
          <Text key={size} style={styles.th}>
            {size}
          </Text>
        ))}
      </View>
      <View style={styles.trLast}>
        {sizes.map(([size, qty]) => (
          <Text key={size} style={styles.td}>
            {qty}×
          </Text>
        ))}
      </View>
    </View>
  );
}

function ElementDetail({ element, index }: { element: OrderRecord['items'][number]['elements'][number]; index: number }) {
  return (
    <View style={styles.elementBlock}>
      <Text style={styles.elementTitle}>
        {index + 1}. {element.type === 'logo' ? 'Logo' : 'Text'} · {PRINT_VIEW_LABELS[element.view]}
      </Text>
      <View style={styles.row}>
        <Text style={styles.label}>Position</Text>
        <Text style={styles.value}>
          x: {element.xCm.toFixed(1)} cm, y: {element.yCm.toFixed(1)} cm
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Größe</Text>
        <Text style={styles.value}>
          {element.widthCm.toFixed(1)} × {element.heightCm.toFixed(1)} cm
          {element.rotationDeg ? `, gedreht ${element.rotationDeg.toFixed(0)}°` : ''}
        </Text>
      </View>
      {element.type === 'text' ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Text</Text>
            <Text style={styles.value}>&ldquo;{element.content}&rdquo;</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Schrift</Text>
            <Text style={styles.value}>
              {element.fontFamily}, {element.fontSizePx?.toFixed(0)} px
              {element.bold ? ', fett' : ''}
              {element.italic ? ', kursiv' : ''}
              {element.align ? `, ${element.align}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Farbe</Text>
            <Text style={styles.value}>{element.color}</Text>
          </View>
        </>
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>Datei</Text>
          <Text style={styles.value}>{element.fileName ?? '–'}</Text>
        </View>
      )}
    </View>
  );
}

function ItemPreviews({ item }: { item: OrderRecord['items'][number] }) {
  const entries = Object.entries(item.previews ?? {}) as [keyof typeof PRINT_VIEW_LABELS, Buffer][];
  if (entries.length === 0) return null;
  return (
    <View style={styles.previewRow}>
      {entries.map(([view, pngBuffer]) => (
        <View key={view} style={styles.previewCard}>
          <Text style={styles.previewLabel}>{PRINT_VIEW_LABELS[view]}</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image ist eine PDF-Zeichenprimitive ohne alt-Prop, keine HTML-<img>/next/image-Komponente. */}
          <Image src={pngBuffer} style={styles.previewImage} />
        </View>
      ))}
    </View>
  );
}

function ProductionSheetDocument({ order }: { order: OrderRecord }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Produktionsblatt {order.orderNumber}</Text>
        <Text style={styles.meta}>
          {order.orderType === 'order' ? 'Bestellung' : 'Unverbindliche Anfrage'} · {new Date(order.createdAt).toLocaleString('de-DE')}
        </Text>

        <ContactAndShipping order={order} />

        {order.items.map((item, itemIndex) => (
          <View key={itemIndex} wrap={false}>
            <Text style={styles.h2}>
              Position {itemIndex + 1} von {order.items.length}
            </Text>
            <Text style={styles.itemHeading}>
              {item.productName} · {item.colorName}
            </Text>
            <Text style={styles.itemSub}>
              {item.printMethod === 'embroidery' ? 'Stickerei' : 'DTF-Transferdruck'} · {item.quantity} Stück gesamt · Einzelpreis{' '}
              {formatiereGeld(item.unitPrice)} · Gesamt {formatiereGeld(item.totalPrice)}
            </Text>
            <SizeTable sizeQuantities={item.sizeQuantities} />
            <ItemPreviews item={item} />
            {item.elements.map((element, elementIndex) => (
              <ElementDetail key={elementIndex} element={element} index={elementIndex} />
            ))}
          </View>
        ))}

        <Text style={{ ...styles.meta, marginTop: 16 }}>Gesamtsumme: {formatiereGeld(order.totalPrice)}</Text>
      </Page>
    </Document>
  );
}

export async function renderProductionSheet(order: OrderRecord): Promise<Buffer> {
  return renderToBuffer(<ProductionSheetDocument order={order} />);
}
