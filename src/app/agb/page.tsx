import type { ReactNode } from 'react';
import Link from 'next/link';
import { LegalPageNotice } from '@/components/legal/LegalPageNotice';

export const metadata = {
  title: 'AGB',
  description:
    'Allgemeine Geschäftsbedingungen von Embroidery Republic Germany: Vertragsschluss, Preise, Versand, Widerrufsrecht und Gewährleistung.',
  alternates: { canonical: '/agb' },
  openGraph: {
    title: 'Allgemeine Geschäftsbedingungen',
    description:
      'Vertragsschluss, Preise, Versand, Widerrufsrecht und Gewährleistung bei Embroidery Republic Germany.',
  },
};

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-medium text-brand">
        § {n} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function AgbPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-brand/70">
      <Link href="/" className="text-xs text-gold-dark hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="mb-1 mt-4 font-serif text-2xl font-semibold text-brand">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mb-6 text-xs text-brand/50">Stand: Juli 2026</p>

      <LegalPageNotice />

      <div className="space-y-6">
        <Section n={1} title="Geltungsbereich und Vertragspartner">
          <p>
            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend &bdquo;AGB&ldquo;) gelten für alle
            Verträge über die Lieferung individuell veredelter Textilien, die über diese Website
            zwischen Embroidery Republic Germany – Ihsan Uzun &amp; Enes Malkoc GbR, Ingendorferweg 81,
            50829 Köln (nachfolgend &bdquo;wir&ldquo; oder &bdquo;Anbieter&ldquo;) und der Kundin bzw.
            dem Kunden (nachfolgend &bdquo;Kunde&ldquo;) geschlossen werden.
          </p>
          <p>
            (2) Unser Angebot richtet sich sowohl an Verbraucher (§ 13 BGB) als auch an Unternehmer
            (§ 14 BGB). Der Schwerpunkt liegt auf der Belieferung von Unternehmen, Vereinen, Schulen,
            Gastronomiebetrieben und vergleichbaren Organisationen. Die für Verbraucher geltenden
            gesetzlichen Sonderregelungen bleiben unberührt und sind in § 9 gesondert geregelt.
          </p>
          <p>
            (3) Abweichenden Geschäftsbedingungen des Kunden wird widersprochen. Sie werden nur
            Vertragsbestandteil, wenn wir ihnen ausdrücklich in Textform zustimmen.
          </p>
        </Section>

        <Section n={2} title="Leistungsgegenstand">
          <p>
            (1) Wir veredeln Textilien im DTF-Transferdruck sowie im Stickverfahren nach den vom
            Kunden übermittelten Vorgaben. Die Textilien selbst beziehen wir von Herstellern und
            Großhändlern.
          </p>
          <p>
            (2) Die Darstellung im Konfigurator ist eine maßstabsgetreue Vorschau der Platzierung. Sie
            ersetzt kein Farbmuster: produktions-, chargen- und materialbedingte Abweichungen in
            Farbton, Oberfläche und Position sind branchenüblich und stellen keinen Mangel dar, soweit
            sie den Gesamteindruck nicht wesentlich beeinträchtigen.
          </p>
          <p>
            (3) Bei Stickerei wird das Motiv von uns in Garnfarben digitalisiert. Feine Details,
            Farbverläufe und fotografische Motive lassen sich verfahrensbedingt nicht oder nur
            eingeschränkt umsetzen; die Anzahl der Garnfarben ist begrenzt.
          </p>
        </Section>

        <Section n={3} title="Vertragsschluss">
          <p>
            (1) Die Darstellung der Produkte im Konfigurator stellt kein bindendes Angebot dar,
            sondern eine unverbindliche Aufforderung zur Bestellung.
          </p>
          <p>
            (2) Mit dem Absenden der Bestellung über die Schaltfläche &bdquo;Zahlungspflichtig
            bestellen&ldquo; gibt der Kunde ein verbindliches Angebot zum Abschluss eines Vertrages ab.
          </p>
          <p>
            (3) Der Eingang der Bestellung wird unverzüglich in Textform bestätigt. Diese
            Eingangsbestätigung stellt noch keine Annahme des Angebots dar. Der Vertrag kommt zustande,
            sobald wir die Bestellung ausdrücklich annehmen oder mit der Produktion beginnen.
          </p>
          <p>
            (4) Über den Weg &bdquo;Unverbindlich anfragen&ldquo; übermittelte Konfigurationen sind
            ausdrücklich unverbindlich. Es entsteht weder ein Vertrag noch eine Zahlungsverpflichtung.
          </p>
        </Section>

        <Section n={4} title="Preise">
          <p>
            (1) Maßgeblich sind die zum Zeitpunkt der Bestellung im Konfigurator angezeigten Preise.
            Der Preis ergibt sich aus dem Grundpreis des Textils, der gewählten Veredelung, der
            Motivgröße bzw. Stichzahl sowie der Bestellmenge (Mengenstaffel).
          </p>
          <p>
            (2) Umsatzsteuer: Alle angegebenen Preise sind Endpreise und enthalten die gesetzliche
            Umsatzsteuer von derzeit 19 %. Ein gesonderter Ausweis erfolgt in der Bestellbestätigung
            und auf der Rechnung.
          </p>
          <p>(3) Versandkosten werden gemäß § 7 gesondert ausgewiesen und kommen zum Warenwert hinzu.</p>
        </Section>

        <Section n={5} title="Zahlungsbedingungen">
          <p>
            (1) Die Bezahlung erfolgt wahlweise per Kreditkarte, PayPal oder auf Rechnung. Bei Zahlung
            per Kreditkarte oder PayPal wird der Betrag im Rahmen des Bestellvorgangs über den
            jeweiligen Zahlungsdienstleister eingezogen. Bei Kauf auf Rechnung wird im Bestellvorgang
            selbst kein Betrag eingezogen; die Rechnung wird separat im Zuge der Auftragsbearbeitung
            übermittelt.
          </p>
          <p>
            (2) Rechnungen sind innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug zur Zahlung
            fällig.
          </p>
          <p>
            (3) Wir behalten uns vor, bei Erstaufträgen, größeren Auftragsvolumina oder aus Gründen der
            Bonität eine Vorauszahlung oder Anzahlung zu verlangen. Der Kunde wird hierüber vor
            Produktionsbeginn informiert.
          </p>
          <p>
            (4) Bei Zahlungsverzug gelten die gesetzlichen Regelungen. Gegenüber Unternehmern behalten
            wir uns die Geltendmachung von Verzugszinsen sowie der Verzugspauschale nach § 288 Abs. 5
            BGB vor.
          </p>
        </Section>

        <Section n={6} title="Druckdaten, Rechte Dritter und Freistellung">
          <p>
            (1) Der Kunde ist für die von ihm übermittelten Logos, Grafiken, Schriftzüge und Texte
            allein verantwortlich. Mit der Übermittlung versichert er, dass er über sämtliche
            erforderlichen Nutzungs- und Verwertungsrechte verfügt und die Veredelung keine Rechte
            Dritter – insbesondere Urheber-, Marken-, Namens- oder Persönlichkeitsrechte – verletzt.
          </p>
          <p>
            (2) Der Kunde stellt uns von sämtlichen Ansprüchen Dritter frei, die aufgrund der
            Verletzung solcher Rechte gegen uns geltend gemacht werden, einschließlich angemessener
            Kosten der Rechtsverteidigung.
          </p>
          <p>
            (3) Wir sind berechtigt, Aufträge abzulehnen, deren Inhalte gegen geltendes Recht oder
            gegen die guten Sitten verstoßen, insbesondere bei verfassungsfeindlichen,
            diskriminierenden, gewaltverherrlichenden oder jugendgefährdenden Motiven. Eine allgemeine
            Prüfpflicht trifft uns nicht.
          </p>
          <p>
            (4) Wir prüfen eingehende Dateien kostenfrei auf technische Umsetzbarkeit (Auflösung,
            Platzierung, Verfahrenseignung) und melden uns bei erkennbaren Problemen. Diese Prüfung ist
            eine Serviceleistung und begründet keine Haftung für die inhaltliche Richtigkeit der
            Vorlage.
          </p>
        </Section>

        <Section n={7} title="Produktion, Lieferzeit und Versand">
          <p>
            (1) Die Produktion beginnt nach Bestellfreigabe, sobald sämtliche Druck- bzw. Stickdaten
            vollständig vorliegen.
          </p>
          <p>
            (2) Die reguläre Produktionszeit beträgt 3 bis 4 Werktage. Der anschließende Versand
            erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders
            aufwendigen Produktionen kann sich die Produktionszeit entsprechend verlängern; wir
            informieren den Kunden in diesem Fall unverzüglich.
          </p>
          <p>
            (3) Angegebene Liefertermine sind unverbindliche Circa-Angaben, sofern sie nicht
            ausdrücklich in Textform als verbindlich vereinbart wurden.
          </p>
          <p>
            (4) Wir liefern derzeit ausschließlich innerhalb Deutschlands. Es gelten folgende
            Versandkosten:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Innerhalb Deutschlands: 6,90 € – ab einem Bestellwert von 75,00 € versandkostenfrei.
            </li>
          </ul>
          <p>
            (5) Die für Ihre Bestellung geltenden Versandkosten werden im Bestellvorgang automatisch
            anhand des Bestellwertes berechnet und vor dem Absenden der Bestellung transparent
            ausgewiesen. Lieferungen ins Ausland bieten wir derzeit nicht über den Konfigurator an;
            sprechen Sie uns für ein individuelles Angebot gerne an.
          </p>
          <p>
            (6) Teillieferungen sind zulässig, soweit sie für den Kunden zumutbar sind. Zusätzliche
            Versandkosten entstehen dem Kunden dadurch nicht.
          </p>
        </Section>

        <Section n={8} title="Stornierung">
          <p>
            (1) Eine Stornierung der Bestellung ist innerhalb von zwei Stunden nach Bestelleingang
            möglich, sofern mit der Produktion noch nicht begonnen wurde.
          </p>
          <p>
            (2) Die Stornierung ist in Textform unter Angabe der Bestellnummer zu erklären.
          </p>
          <p>
            (3) Nach Ablauf dieser Frist oder nach Produktionsbeginn ist eine Stornierung
            ausgeschlossen, da die Ware individuell nach Kundenvorgaben gefertigt wird.
          </p>
        </Section>

        <Section n={9} title="Widerrufsrecht">
          <p>
            (1) Da sämtliche Produkte individuell nach Kundenvorgaben bedruckt oder bestickt werden,
            besteht für Verbraucher gemäß § 312g Abs. 2 Nr. 1 BGB kein Widerrufsrecht. Der Vertrag
            betrifft Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle
            Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist bzw. die eindeutig auf die
            persönlichen Bedürfnisse zugeschnitten sind.
          </p>
          <p>(2) Gegenüber Unternehmern besteht ohnehin kein gesetzliches Widerrufsrecht.</p>
          <p>
            (3) Die gesetzlichen Gewährleistungsrechte bei mangelhafter Ware bleiben hiervon unberührt
            (§ 10).
          </p>
        </Section>

        <Section n={10} title="Gewährleistung und Mängelrüge">
          <p>(1) Es gelten die gesetzlichen Gewährleistungsrechte.</p>
          <p>
            (2) Ist der Kunde Unternehmer, hat er die Ware unverzüglich nach Erhalt zu untersuchen und
            erkennbare Mängel unverzüglich, spätestens innerhalb von sieben Tagen nach Erhalt, in
            Textform anzuzeigen (§ 377 HGB). Versteckte Mängel sind unverzüglich nach Entdeckung
            anzuzeigen. Andernfalls gilt die Ware als genehmigt.
          </p>
          <p>
            (3) Geringfügige, technisch bedingte Abweichungen in Farbe, Größe und Platzierung im Rahmen
            der branchenüblichen Toleranzen stellen keinen Mangel dar (§ 2 Abs. 2).
          </p>
          <p>
            (4) Mängel, die auf vom Kunden gelieferten Vorlagen beruhen – etwa unzureichende Auflösung,
            fehlerhafte Schreibweise oder ungeeignete Dateiformate –, begründen keine
            Gewährleistungsansprüche, sofern wir auf ein erkennbares Problem hingewiesen haben oder das
            Problem für uns nicht erkennbar war.
          </p>
        </Section>

        <Section n={11} title="Eigentumsvorbehalt">
          <p>
            Die gelieferte Ware bleibt bis zur vollständigen Bezahlung sämtlicher Forderungen aus der
            Geschäftsbeziehung unser Eigentum.
          </p>
        </Section>

        <Section n={12} title="Haftung">
          <p>
            (1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei der Verletzung
            von Leben, Körper oder Gesundheit.
          </p>
          <p>
            (2) Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen
            Vertragspflicht (Kardinalpflicht), deren Erfüllung die ordnungsgemäße Durchführung des
            Vertrages überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen
            darf. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden
            begrenzt.
          </p>
          <p>
            (3) Im Übrigen ist die Haftung ausgeschlossen. Die Haftung nach dem Produkthaftungsgesetz
            bleibt unberührt.
          </p>
        </Section>

        <Section n={13} title="Schlussbestimmungen">
          <p>
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch der durch zwingende
            Bestimmungen des Rechts des Aufenthaltsstaates gewährte Schutz nicht entzogen wird.
          </p>
          <p>
            (2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder
            öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle
            Streitigkeiten aus diesem Vertragsverhältnis Köln.
          </p>
          <p>
            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
            Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </Section>
      </div>
    </main>
  );
}
