/**
 * ═══════════════════════════════════════════════════════════════════════
 * RECHNUNGS-PDF DES INTERNEN ANBIETERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Enthält die Pflichtangaben nach § 14 Abs. 4 UStG (Ausstellungsdatum,
 * fortlaufende Nummer, Anbieter- und Käuferanschrift, Menge/Art der
 * Leistung, Entgelt, Steuersatz bzw. Hinweis auf die Steuerbefreiung).
 *
 * ── Gestaltung (2026-09-01, Design-Überarbeitung) ─────────────────────────
 * Bewusst zurückhaltendes, markenkonformes Layout statt eines sichtbar
 * technisch erzeugten Dokuments: großzügiger Weißraum, dezente Trennlinien
 * statt schwerer Kästen, klare Hierarchie über Größe/Gewicht/Farbe statt
 * Rahmen. Dieselbe Farbpalette wie EmailLayout.tsx (lib/email/templates/) –
 * eine Rechnung soll sich wie derselbe Absender lesen wie eine E-Mail.
 * Helvetica/Helvetica-Bold bewusst beibehalten (kein Font-Embedding nötig,
 * dadurch keine zusätzliche Fehlerquelle) – die hochwertige Wirkung entsteht
 * über Abstand und Hierarchie, nicht über eine zweite Schriftfamilie.
 *
 * SEPA-QR-Code (GiroCode, EPC069-12) erscheint ausschließlich bei einer noch
 * OFFENEN Rechnung (Kauf auf Rechnung, `zahlungszielTage > 0`) – siehe
 * sepaQrCode.ts für das Format. Eine bereits bezahlte Bestellung
 * (Karte/PayPal) zeigt weiterhin ausschließlich eine klare Bezahlt-Meldung,
 * nie Kontodaten oder einen QR-Code.
 *
 * ── Import-Beschränkung ─────────────────────────────────────────────────
 * Diese Datei liegt unter lib/invoicing/ und wird deshalb von
 * __tests__/architektur.test.ts geprüft: KEIN explizites `import ... from
 * 'react'`, kein `@supabase`-Import.
 */
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { COMPANY, COMPANY_BANK, IST_KLEINUNTERNEHMER, KLEINUNTERNEHMER_HINWEIS } from '@/config/company';
import { formatiereGeld, formatiereDatum } from '@/lib/format';
import { erzeugeSepaQrPng } from './sepaQrCode';
import type { Rechnungsauftrag } from '../types';

/** Dieselbe Palette wie lib/email/templates/EmailLayout.tsx – eine
 *  Rechnung soll sich wie derselbe Absender lesen wie eine E-Mail. */
const FARBEN = {
  text: '#23211d',
  muted: '#6b675e',
  rule: '#e4dfd2',
  ruleLight: '#f0ece1',
  gold: '#9a6b2f',
  weiss: '#ffffff',
};

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48, fontSize: 9.5, fontFamily: 'Helvetica', color: FARBEN.text },

  // ── Titelbereich ──────────────────────────────────────────────────────
  eyebrow: { fontSize: 8, color: FARBEN.gold, letterSpacing: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  invoiceNumber: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  invoiceMeta: { fontSize: 9, color: FARBEN.muted, textAlign: 'right' },
  goldRule: { height: 1.5, backgroundColor: FARBEN.gold, marginTop: 14, marginBottom: 28, width: 48 },

  // ── Von/An ────────────────────────────────────────────────────────────
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerCol: { width: '46%' },
  sectionLabel: { fontSize: 7.5, color: FARBEN.muted, letterSpacing: 1.5, marginBottom: 6 },
  partyName: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 3 },
  partyLine: { fontSize: 9.5, marginBottom: 2, lineHeight: 1.35 },
  partyLineMuted: { fontSize: 8.5, color: FARBEN.muted, marginTop: 4, lineHeight: 1.4 },
  refLine: { fontSize: 8.5, color: FARBEN.muted, marginTop: 24, marginBottom: 24 },

  // ── Positionstabelle ──────────────────────────────────────────────────
  theadRow: { flexDirection: 'row', borderBottom: `1pt solid ${FARBEN.text}`, paddingBottom: 6 },
  thBezeichnung: { flex: 3, fontSize: 8, color: FARBEN.muted, letterSpacing: 0.5 },
  thMenge: { flex: 1, fontSize: 8, color: FARBEN.muted, letterSpacing: 0.5, textAlign: 'right' },
  thPreis: { flex: 1.3, fontSize: 8, color: FARBEN.muted, letterSpacing: 0.5, textAlign: 'right' },
  trow: { flexDirection: 'row', borderBottom: `0.75pt solid ${FARBEN.ruleLight}`, paddingVertical: 9 },
  tdBezeichnung: { flex: 3, fontSize: 9.5 },
  tdMenge: { flex: 1, fontSize: 9.5, textAlign: 'right', color: FARBEN.muted },
  tdPreis: { flex: 1.3, fontSize: 9.5, textAlign: 'right' },

  // ── Summe ─────────────────────────────────────────────────────────────
  summaryBlock: { alignItems: 'flex-end', marginTop: 4 },
  summaryTaxRow: { fontSize: 8.5, color: FARBEN.muted, marginTop: 10 },
  totalRule: { height: 1, backgroundColor: FARBEN.text, width: 200, marginTop: 12, marginBottom: 10 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 16 },
  totalLabel: { fontSize: 10, color: FARBEN.muted },
  totalAmount: { fontSize: 16, fontFamily: 'Helvetica-Bold' },

  // ── Zahlungsbereich ───────────────────────────────────────────────────
  paymentSection: { marginTop: 40, paddingTop: 24, borderTop: `0.75pt solid ${FARBEN.rule}` },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  paymentDetails: { width: '58%' },
  paymentLine: { flexDirection: 'row', marginBottom: 7 },
  paymentLabel: { width: 92, fontSize: 8.5, color: FARBEN.muted },
  paymentValue: { fontSize: 9.5, flex: 1 },
  paymentValueBold: { fontSize: 9.5, flex: 1, fontFamily: 'Helvetica-Bold' },
  qrBlock: { width: 132, alignItems: 'center' },
  qrImage: { width: 108, height: 108 },
  qrCaption: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 8, textAlign: 'center' },
  qrHint: { fontSize: 7, color: FARBEN.muted, marginTop: 3, textAlign: 'center', lineHeight: 1.35 },

  paidSection: { marginTop: 40, paddingTop: 24, borderTop: `0.75pt solid ${FARBEN.rule}` },
  paidText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: FARBEN.gold },
  paidSub: { fontSize: 8.5, color: FARBEN.muted, marginTop: 4 },

  // ── Fuß ───────────────────────────────────────────────────────────────
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 7.5, color: FARBEN.muted, lineHeight: 1.4 },
});

function Kopfbereich({ auftrag, rechnungsnummer }: { auftrag: Rechnungsauftrag; rechnungsnummer: string }) {
  return (
    <>
      <Text style={styles.eyebrow}>RECHNUNG</Text>
      <View style={styles.titleRow}>
        <Text style={styles.invoiceNumber}>{rechnungsnummer}</Text>
        <Text style={styles.invoiceMeta}>{formatiereDatum(auftrag.rechnungsdatum)}</Text>
      </View>
      <View style={styles.goldRule} />

      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <Text style={styles.sectionLabel}>VON</Text>
          <Text style={styles.partyName}>{COMPANY.legalName}</Text>
          <Text style={styles.partyLine}>{COMPANY.street}</Text>
          <Text style={styles.partyLine}>
            {COMPANY.zip} {COMPANY.city}
          </Text>
          <Text style={styles.partyLineMuted}>{COMPANY.email}</Text>
          {COMPANY.steuernummer ? <Text style={styles.partyLineMuted}>Steuernummer {COMPANY.steuernummer}</Text> : null}
          {COMPANY.vatId ? <Text style={styles.partyLineMuted}>USt-IdNr. {COMPANY.vatId}</Text> : null}
        </View>
        <View style={[styles.headerCol, { alignItems: 'flex-end' }]}>
          <Text style={[styles.sectionLabel, { textAlign: 'right' }]}>RECHNUNGSEMPFÄNGER</Text>
          {auftrag.kaeufer.firma ? (
            <Text style={[styles.partyName, { textAlign: 'right' }]}>{auftrag.kaeufer.firma}</Text>
          ) : null}
          <Text style={[auftrag.kaeufer.firma ? styles.partyLine : styles.partyName, { textAlign: 'right' }]}>
            {auftrag.kaeufer.name}
          </Text>
          <Text style={[styles.partyLine, { textAlign: 'right' }]}>{auftrag.kaeufer.strasse}</Text>
          <Text style={[styles.partyLine, { textAlign: 'right' }]}>
            {auftrag.kaeufer.plz} {auftrag.kaeufer.ort}
          </Text>
          {auftrag.kaeufer.land !== 'Deutschland' && (
            <Text style={[styles.partyLine, { textAlign: 'right' }]}>{auftrag.kaeufer.land}</Text>
          )}
          {auftrag.kaeufer.ustIdNr ? (
            <Text style={[styles.partyLineMuted, { textAlign: 'right' }]}>USt-IdNr. {auftrag.kaeufer.ustIdNr}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.refLine}>
        Leistungsdatum entspricht dem Rechnungsdatum · Bezug: Bestellung {auftrag.bestellnummer}
      </Text>
    </>
  );
}

function Positionstabelle({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <View>
      <View style={styles.theadRow}>
        <Text style={styles.thBezeichnung}>BEZEICHNUNG</Text>
        <Text style={styles.thMenge}>MENGE</Text>
        <Text style={styles.thPreis}>EINZELPREIS</Text>
      </View>
      {auftrag.positionen.map((position, index) => (
        <View key={index} style={styles.trow} wrap={false}>
          <Text style={styles.tdBezeichnung}>{position.bezeichnung}</Text>
          <Text style={styles.tdMenge}>{position.menge}</Text>
          <Text style={styles.tdPreis}>{formatiereGeld(position.einzelpreisBruttoCent / 100)}</Text>
        </View>
      ))}
      {auftrag.versandkostenBruttoCent !== 0 && (
        <View style={styles.trow} wrap={false}>
          <Text style={styles.tdBezeichnung}>Versand</Text>
          <Text style={styles.tdMenge}>1</Text>
          <Text style={styles.tdPreis}>{formatiereGeld(auftrag.versandkostenBruttoCent / 100)}</Text>
        </View>
      )}
    </View>
  );
}

function Summe({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <View style={styles.summaryBlock} wrap={false}>
      {!IST_KLEINUNTERNEHMER && (
        <Text style={styles.summaryTaxRow}>
          enthaltene USt. ({auftrag.positionen[0]?.steuersatzProzent ?? 0} %)
        </Text>
      )}
      <View style={styles.totalRule} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Gesamtbetrag</Text>
        <Text style={styles.totalAmount}>{formatiereGeld(auftrag.gesamtBruttoCent / 100)}</Text>
      </View>
    </View>
  );
}

/** Zahlungsziel als Frist UND als konkretes Fälligkeitsdatum – dynamisch aus
 *  dem echten Rechnungsdatum berechnet, nie fest verdrahtet. */
function zahlungszielFaelligAm(rechnungsdatum: string, tage: number): string {
  const datum = new Date(`${rechnungsdatum}T00:00:00Z`);
  datum.setUTCDate(datum.getUTCDate() + tage);
  return formatiereDatum(datum);
}

function PaymentLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.paymentLine}>
      <Text style={styles.paymentLabel}>{label}</Text>
      <Text style={bold ? styles.paymentValueBold : styles.paymentValue}>{value}</Text>
    </View>
  );
}

/** Zahlungsbereich für eine OFFENE Rechnung (Kauf auf Rechnung): links die
 *  Überweisungsdaten, rechts der SEPA-QR-Code (GiroCode) – siehe
 *  sepaQrCode.ts. Erscheint niemals bei einer bereits bezahlten Bestellung. */
function Zahlungsbereich({
  auftrag,
  rechnungsnummer,
  qrPng,
}: {
  auftrag: Rechnungsauftrag;
  rechnungsnummer: string;
  qrPng: Buffer;
}) {
  return (
    <View style={styles.paymentSection} wrap={false}>
      <Text style={styles.sectionLabel}>ZAHLUNGSINFORMATIONEN</Text>
      <View style={styles.paymentRow}>
        <View style={styles.paymentDetails}>
          <PaymentLine
            label="Zahlungsziel"
            value={`${auftrag.zahlungszielTage} Tage ohne Abzug (fällig am ${zahlungszielFaelligAm(auftrag.rechnungsdatum, auftrag.zahlungszielTage)})`}
          />
          <PaymentLine label="Kontoinhaber" value={COMPANY_BANK.kontoinhaber} bold />
          <PaymentLine label="IBAN" value={COMPANY_BANK.iban} bold />
          <PaymentLine label="Verwendungszweck" value={`Rechnung ${rechnungsnummer}`} bold />
        </View>
        <View style={styles.qrBlock}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image ist kein HTML-<img>, kennt kein alt */}
          <Image src={{ data: qrPng, format: 'png' }} style={styles.qrImage} />
          <Text style={styles.qrCaption}>Mit Banking-App bezahlen</Text>
          <Text style={styles.qrHint}>Scannen – die Überweisungsdaten werden automatisch übernommen.</Text>
        </View>
      </View>
    </View>
  );
}

/** Zahlungsbereich für eine BEREITS bezahlte Bestellung (Karte/PayPal) –
 *  klar und sauber, ohne jede Kontoangabe oder QR-Code. */
function BereitsBezahltBereich({ auftrag }: { auftrag: Rechnungsauftrag }) {
  return (
    <View style={styles.paidSection} wrap={false}>
      <Text style={styles.paidText}>Bereits bezahlt</Text>
      <Text style={styles.paidSub}>Diese Rechnung ist beglichen – es ist keine weitere Zahlung erforderlich.</Text>
    </View>
  );
}

function RechnungDocument({
  auftrag,
  rechnungsnummer,
  qrPng,
}: {
  auftrag: Rechnungsauftrag;
  rechnungsnummer: string;
  qrPng: Buffer | null;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Kopfbereich auftrag={auftrag} rechnungsnummer={rechnungsnummer} />
        <Positionstabelle auftrag={auftrag} />
        <Summe auftrag={auftrag} />

        {auftrag.zahlungszielTage > 0 && qrPng ? (
          <Zahlungsbereich auftrag={auftrag} rechnungsnummer={rechnungsnummer} qrPng={qrPng} />
        ) : (
          <BereitsBezahltBereich auftrag={auftrag} />
        )}

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
  // Der QR-Code wird NUR für eine offene Rechnung erzeugt (echter Betrag,
  // echte Rechnungsnummer dieses Belegs) – bei einer bereits bezahlten
  // Bestellung entsteht gar kein QR-Code, kein Leerlauf-Rendern eines dann
  // ungenutzten Bildes.
  const qrPng = auftrag.zahlungszielTage > 0
    ? await erzeugeSepaQrPng({
        empfaenger: COMPANY_BANK.kontoinhaber,
        iban: COMPANY_BANK.iban,
        betragEuro: auftrag.gesamtBruttoCent / 100,
        verwendungszweck: `Rechnung ${rechnungsnummer}`,
      })
    : null;

  return renderToBuffer(<RechnungDocument auftrag={auftrag} rechnungsnummer={rechnungsnummer} qrPng={qrPng} />);
}
