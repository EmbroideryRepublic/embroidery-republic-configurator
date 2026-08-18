/**
 * ═══════════════════════════════════════════════════════════════════════
 * RECHNUNGS-PDF DES INTERNEN ANBIETERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach exakt demselben Muster wie lib/production/buildProductionSheet.tsx
 * (Document/Page/View/Text/StyleSheet + renderToBuffer). Enthält die
 * Pflichtangaben nach § 14 Abs. 4 UStG (Ausstellungsdatum, fortlaufende
 * Nummer, Anbieter- und Käuferanschrift, Menge/Art der Leistung, Entgelt,
 * Steuersatz bzw. Hinweis auf die Steuerbefreiung).
 *
 * ── Import-Beschränkung ─────────────────────────────────────────────────
 * Diese Datei liegt unter lib/invoicing/ und wird deshalb von
 * __tests__/architektur.test.ts geprüft: KEIN explizites `import ... from
 * 'react'`, kein `@supabase`-Import – exakt das bestehende Muster von
 * buildProductionSheet.tsx (nicht unter lib/invoicing/, aber als Vorbild
 * für denselben impliziten-JSX-Runtime-Ansatz).
 */
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { COMPANY, IST_KLEINUNTERNEHMER, KLEINUNTERNEHMER_HINWEIS } from '@/config/company';
import { formatiereGeld } from '@/lib/format';
import type { Rechnungsauftrag } from '../types';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#23211d' },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  meta: { fontSize: 9, color: '#6b675e', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  block: { fontSize: 9 },
  blockTitle: { color: '#6b675e', marginBottom: 3 },
  table: { border: '1pt solid #ddd8cc', borderRadius: 4, marginTop: 12 },
  tr: { flexDirection: 'row', borderBottom: '1pt solid #eee9db' },
  trLast: { flexDirection: 'row' },
  th: { flex: 3, padding: 5, fontWeight: 700, backgroundColor: '#f7f5f0' },
  thRight: { flex: 1, padding: 5, fontWeight: 700, backgroundColor: '#f7f5f0', textAlign: 'right' },
  td: { flex: 3, padding: 5 },
  tdRight: { flex: 1, padding: 5, textAlign: 'right' },
  summary: { marginTop: 10, alignItems: 'flex-end' },
  summaryRow: { flexDirection: 'row', gap: 24, marginTop: 2 },
  summaryLabel: { color: '#6b675e' },
  summaryTotal: { fontWeight: 700, fontSize: 11, marginTop: 4 },
  footer: { marginTop: 20, fontSize: 8, color: '#6b675e', lineHeight: 1.4 },
});

function RechnungsKopf({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Von</Text>
        <Text>{COMPANY.legalName}</Text>
        <Text>{COMPANY.street}</Text>
        <Text>
          {COMPANY.zip} {COMPANY.city}
        </Text>
        <Text>{COMPANY.email}</Text>
        {COMPANY.steuernummer ? <Text>Steuernummer: {COMPANY.steuernummer}</Text> : null}
        {COMPANY.vatId ? <Text>USt-IdNr.: {COMPANY.vatId}</Text> : null}
      </View>
      <View style={styles.block}>
        <Text style={styles.blockTitle}>An</Text>
        {auftrag.kaeufer.firma ? <Text>{auftrag.kaeufer.firma}</Text> : null}
        <Text>{auftrag.kaeufer.name}</Text>
        <Text>{auftrag.kaeufer.strasse}</Text>
        <Text>
          {auftrag.kaeufer.plz} {auftrag.kaeufer.ort}
        </Text>
        <Text>{auftrag.kaeufer.land}</Text>
        {auftrag.kaeufer.ustIdNr ? <Text>USt-IdNr.: {auftrag.kaeufer.ustIdNr}</Text> : null}
      </View>
    </View>
  );
}

function Positionstabelle({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        <Text style={styles.th}>Bezeichnung</Text>
        <Text style={styles.thRight}>Menge</Text>
        <Text style={styles.thRight}>Einzelpreis</Text>
      </View>
      {auftrag.positionen.map((position, index) => (
        <View key={index} style={index === auftrag.positionen.length - 1 && auftrag.versandkostenBruttoCent === 0 ? styles.trLast : styles.tr}>
          <Text style={styles.td}>{position.bezeichnung}</Text>
          <Text style={styles.tdRight}>{position.menge}</Text>
          <Text style={styles.tdRight}>{formatiereGeld(position.einzelpreisBruttoCent / 100)}</Text>
        </View>
      ))}
      {auftrag.versandkostenBruttoCent !== 0 && (
        <View style={styles.trLast}>
          <Text style={styles.td}>Versand</Text>
          <Text style={styles.tdRight}>1</Text>
          <Text style={styles.tdRight}>{formatiereGeld(auftrag.versandkostenBruttoCent / 100)}</Text>
        </View>
      )}
    </View>
  );
}

function ZahlungszielText({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <Text style={{ marginTop: 10 }}>
      {auftrag.zahlungszielTage > 0 ? `Zahlbar innerhalb von ${auftrag.zahlungszielTage} Tagen ohne Abzug.` : 'Bereits bezahlt.'}
    </Text>
  );
}

function RechnungDocument({ auftrag, rechnungsnummer }: { auftrag: Rechnungsauftrag; rechnungsnummer: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Rechnung {rechnungsnummer}</Text>
        <Text style={styles.meta}>
          Rechnungsdatum {auftrag.rechnungsdatum} · Leistungsdatum entspricht dem Rechnungsdatum · Bezug:
          Bestellung {auftrag.bestellnummer}
        </Text>

        <RechnungsKopf auftrag={auftrag} />
        <Positionstabelle auftrag={auftrag} />

        <View style={styles.summary}>
          {!IST_KLEINUNTERNEHMER && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>enthaltene USt. ({auftrag.positionen[0]?.steuersatzProzent ?? 0} %)</Text>
            </View>
          )}
          <Text style={styles.summaryTotal}>Gesamtbetrag: {formatiereGeld(auftrag.gesamtBruttoCent / 100)}</Text>
        </View>

        <ZahlungszielText auftrag={auftrag} />

        <Text style={styles.footer}>
          {IST_KLEINUNTERNEHMER
            ? KLEINUNTERNEHMER_HINWEIS
            : 'Im ausgewiesenen Betrag ist die gesetzliche Umsatzsteuer enthalten.'}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderRechnungPdf(auftrag: Rechnungsauftrag, rechnungsnummer: string): Promise<Buffer> {
  return renderToBuffer(<RechnungDocument auftrag={auftrag} rechnungsnummer={rechnungsnummer} />);
}
