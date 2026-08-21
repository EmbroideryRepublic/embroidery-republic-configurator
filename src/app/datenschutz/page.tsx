import type { ReactNode } from 'react';
import Link from 'next/link';
import { TodoNote, Todo } from '@/components/legal/TodoNote';
import { LegalPageNotice } from '@/components/legal/LegalPageNotice';
import { COMPANY } from '@/config/company';

export const metadata = {
  title: 'Datenschutz',
  description:
    'Datenschutzerklärung von Embroidery Republic Germany: welche Daten wir verarbeiten, wofür, wie lange und welche Rechte Sie haben.',
  alternates: { canonical: '/datenschutz' },
  openGraph: {
    title: 'Datenschutzerklärung',
    description:
      'Welche Daten Embroidery Republic Germany verarbeitet, wofür, wie lange und welche Rechte Sie haben.',
  },
};

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-medium text-brand">
        {n}. {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-brand/70">
      <Link href="/" className="text-xs text-gold-dark hover:underline">
        ← Zurück zur Startseite
      </Link>

      <h1 className="mb-1 mt-4 font-serif text-2xl font-semibold text-brand">Datenschutzerklärung</h1>
      <p className="mb-6 text-xs text-brand/50">Stand: Juli 2026</p>

      <LegalPageNotice />

      <TodoNote>
        Noch zu ergänzen: die genaue Vercel-Serverregion (Ziffer 4) und die Region des Datenbank-
        und Speicher-Dienstes (Ziffer 5), Rechtsträger/Anschrift von Stripe, PayPal (Ziffer 11) und
        DHL (Ziffer 12) sowie der AVV-Status (Art. 28 DSGVO) mit Stripe/PayPal (Ziffer 11) und mit
        DHL (Ziffer 12). Eine datenschutzrechtliche Prüfung vor dem Go-live wird empfohlen.
      </TodoNote>

      <div className="space-y-6">
        <Section n={1} title="Verantwortlicher">
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der
            Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p>
            Embroidery Republic Germany
            <br />
            Ihsan Uzun &amp; Enes Malkoc GbR
            <br />
            Ingendorferweg 81, 50829 Köln, Deutschland
            <br />
            Telefon: {COMPANY.phone}
            <br />
            E-Mail:{' '}
            <a href={COMPANY.emailHref} className="text-gold-dark hover:underline">
              {COMPANY.email}
            </a>
          </p>
          <p>
            Ein Datenschutzbeauftragter ist gesetzlich nicht bestellt, da die Voraussetzungen des
            § 38 BDSG nicht vorliegen.
          </p>
        </Section>

        <Section n={2} title="Grundsätze">
          <p>
            Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der gesetzlichen
            Vorschriften und nur soweit dies zur Bereitstellung der Website, zur Beantwortung von
            Anfragen und zur Abwicklung von Aufträgen erforderlich ist.
          </p>
          <p>
            <strong className="font-medium text-brand">
              Wir setzen kein Tracking, keine Analyse-Werkzeuge, keine Werbe-Netzwerke und keine
              Social-Media-Plugins ein.
            </strong>{' '}
            Es findet kein Profiling und keine automatisierte Entscheidungsfindung statt. Ein
            Cookie-Banner ist daher nicht erforderlich (siehe Ziffer 7).
          </p>
        </Section>

        <Section n={3} title="Aufruf der Website">
          <p>
            Beim Aufruf dieser Website werden durch unseren Hosting-Anbieter technisch notwendige
            Verbindungsdaten in Server-Logfiles verarbeitet (insbesondere IP-Adresse, Datum und
            Uhrzeit, aufgerufene Ressource, übertragene Datenmenge, Browsertyp und Betriebssystem).
          </p>
          <p>
            Diese Verarbeitung ist zur sicheren und stabilen Bereitstellung der Website erforderlich.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).
          </p>
          <p>
            Sämtliche Schriftarten werden lokal von unserem Server ausgeliefert. Es besteht{' '}
            <strong className="font-medium text-brand">keine Verbindung zu Google Fonts</strong> oder
            anderen externen Anbietern beim Seitenaufruf.
          </p>
        </Section>

        <Section n={4} title="Hosting">
          <p>
            Die Website wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA
            gehostet.
          </p>
          <p>
            Region der eingesetzten Server-Funktionen: <Todo>Serverstandort/Vercel-Region ergänzen</Todo>{' '}
            (Projekteinstellung im Vercel-Dashboard, aus dem Quelltext nicht ablesbar).
          </p>
          <p>
            Mit dem Anbieter besteht ein Vertrag über die Auftragsverarbeitung nach Art. 28 DSGVO.
            Soweit eine Verarbeitung außerhalb der EU bzw. des EWR stattfindet, erfolgt diese auf
            Grundlage der EU-Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </Section>

        <Section n={5} title="Datenbank und Dateispeicher (Supabase)">
          <p>
            Bestelldaten, Anfragedaten sowie hochgeladene Motivdateien und erzeugte Produktionsunterlagen
            speichern wir in einer Datenbank und einem Dateispeicher des Anbieters Supabase, Inc., 970
            Folsom St, San Francisco, CA 94107, USA.
          </p>
          <p>
            Region des eingesetzten Projekts: <Todo>Region/Serverstandort des Supabase-Projekts ergänzen</Todo>
          </p>
          <p>
            Mit Supabase besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Soweit eine
            Verarbeitung außerhalb der EU bzw. des EWR stattfindet, erfolgt diese auf Grundlage der
            EU-Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO. Rechtsgrundlage der
            Speicherung ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche
            Maßnahmen).
          </p>
        </Section>

        <Section n={6} title="Kundenkonto">
          <p>
            Bei der Registrierung eines Kundenkontos unter /konto/registrieren verarbeiten wir die von
            Ihnen angegebene E-Mail-Adresse sowie Ihr Passwort. Nach Bestätigung Ihrer E-Mail-Adresse
            können Sie in Ihrem Profil zusätzlich folgende Angaben hinterlegen: Anzeigename,
            Telefonnummer, Firma sowie Umsatzsteuer-Identifikationsnummer.
          </p>
          <p>
            In Ihrem Adressbuch können Sie mehrere Lieferadressen (Name, Firma, Straße, Postleitzahl,
            Ort, Land, Telefonnummer) hinterlegen und eine davon als Standardadresse festlegen, damit Sie
            diese Angaben bei künftigen Bestellungen nicht erneut eingeben müssen.
          </p>
          <p>
            Optional können Sie bei der Registrierung oder in Ihrem Profil in den Erhalt unseres
            Newsletters einwilligen. Wirksam wird diese Einwilligung erst, nachdem Sie Ihre
            E-Mail-Adresse über den Bestätigungslink verifiziert haben; wir speichern dabei den
            Zeitpunkt dieser Einwilligung.
          </p>
          <p>
            Rechtsgrundlage für die Kontoführung und das Adressbuch ist Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung bzw. vorvertragliche Maßnahmen), für die Newsletter-Einwilligung Art. 6
            Abs. 1 lit. a DSGVO. Diese Daten verarbeiten wir – wie die übrigen in Ziffer 5 genannten
            Daten – ebenfalls bei Supabase. Sie können Ihr Konto samt Profildaten und Adressbuch
            jederzeit selbst in Ihrem Profil löschen (Art. 17 DSGVO).
          </p>
        </Section>

        <Section n={7} title="Cookies und lokale Speicherung im Browser">
          <p>
            Für Besucherinnen und Besucher dieser Website setzen wir{' '}
            <strong className="font-medium text-brand">grundsätzlich keine Cookies</strong>. Eine
            Ausnahme gilt für den Bereich unseres Kundenkontos (/konto und /auth): Melden Sie sich dort
            an oder registrieren Sie sich, setzen wir ein technisch notwendiges, httpOnly-gesichertes
            Sitzungs-Cookie zur Absicherung Ihrer Anmeldung. Ein separates Cookie desselben Typs wird
            außerdem im internen Verwaltungsbereich zur Absicherung der Anmeldung gesetzt; dieser
            Bereich ist öffentlich nicht zugänglich, das Kundenkonto hingegen schon. Beide Cookies sind
            technisch erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
            DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. f DSGVO.
          </p>
          <p>
            Damit Ihre Konfiguration beim Wechsel zwischen Seiten nicht verloren geht, speichern wir
            folgende Angaben ausschließlich lokal in Ihrem Browser (Local Storage bzw. IndexedDB):
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Inhalt des Warenkorbs</li>
            <li>aktuelle Konfiguration inklusive hochgeladener Motive (IndexedDB)</li>
            <li>gewählte Währung, gewählte Sprache sowie markierte Favoriten</li>
            <li>
              zuletzt geöffnete Produktgruppe im Produktbrowser, damit Sie dort weitermachen können,
              wo Sie aufgehört haben
            </li>
            <li>
              ein technischer Vermerk, der ein versehentlich doppeltes Absenden einer Bestellung
              verhindert
            </li>
          </ul>
          <p>
            Diese Daten verbleiben auf Ihrem Endgerät, werden nicht automatisch an uns übertragen und
            können jederzeit über die Einstellungen Ihres Browsers gelöscht werden. Die Speicherung ist
            technisch erforderlich, um die von Ihnen aufgerufene Funktion bereitzustellen
            (§ 25 Abs. 2 Nr. 2 TDDDG); Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </Section>

        <Section n={8} title="Kontaktformular">
          <p>
            Über unser Kontaktformular verarbeiten wir die von Ihnen angegebenen Daten: Name,
            E-Mail-Adresse, optional Betreff sowie Ihre Nachricht.
          </p>
          <p>
            Zusätzlich verarbeiten wir Ihre IP-Adresse, um die Anzahl der Absendevorgänge zu begrenzen
            und Missbrauch (Spam) zu verhindern. Die IP-Adresse wird dazu als Teil eines technischen
            Zählerschlüssels in einer Datenbanktabelle gespeichert und durch einen regelmäßig laufenden
            automatisierten Bereinigungsvorgang gelöscht, spätestens 24 Stunden nach der jeweiligen
            Zählung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
            Abwehr missbräuchlicher Nutzung).
          </p>
          <p>
            Die Verarbeitung Ihrer Nachricht erfolgt zur Beantwortung Ihrer Anfrage auf Grundlage von
            Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </Section>

        <Section n={9} title="Bestellungen und unverbindliche Anfragen">
          <p>Im Rahmen einer Bestellung verarbeiten wir:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Vor- und Nachname, optional Firmenname</li>
            <li>E-Mail-Adresse, optional Telefonnummer</li>
            <li>Lieferanschrift</li>
            <li>Bestelldaten (Produkte, Farben, Größen, Mengen, Preise)</li>
            <li>hochgeladene Logos und Motive sowie die daraus erzeugten Produktionsunterlagen</li>
          </ul>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Vertrages). Bei einer
            unverbindlichen Anfrage erheben wir keine Lieferanschrift und keine Zahlungsdaten; hier ist
            Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).
          </p>
          <p>
            Zur Erfüllung des Auftrags geben wir die für die Lieferung erforderlichen Daten an das
            beauftragte Versandunternehmen sowie – soweit für die Beschaffung der Textilien erforderlich
            – an unsere Lieferanten weiter. Es werden dabei nur die jeweils notwendigen Daten
            übermittelt.
          </p>
        </Section>

        <Section n={10} title="E-Mail-Versand (Resend)">
          <p>
            Für den Versand von Bestätigungs- und Benachrichtigungs-E-Mails nutzen wir den Dienst
            Resend (Resend, Inc., 2261 Market Street, San Francisco, CA 94114, USA). Dabei werden Ihre
            E-Mail-Adresse sowie der Inhalt der jeweiligen Nachricht verarbeitet.
          </p>
          <p>
            Mit dem Anbieter besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO; die
            Übermittlung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln nach Art. 46
            Abs. 2 lit. c DSGVO. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bzw. Art. 6 Abs. 1
            lit. f DSGVO.
          </p>
        </Section>

        <Section n={11} title="Zahlungsabwicklung (Stripe, PayPal)">
          <p>
            Bei Zahlung per Kreditkarte verarbeiten wir Ihre Zahlung über den Dienst Stripe (
            <Todo>Rechtsträger und Anschrift von Stripe ergänzen</Todo>). Bei Zahlung per PayPal
            verarbeiten wir Ihre Zahlung über PayPal (
            <Todo>Rechtsträger und Anschrift von PayPal ergänzen</Todo>).
          </p>
          <p>
            Von unserer Seite werden dabei ausschließlich der Zahlungsbetrag, die Währung sowie eine
            interne Bestellreferenz übermittelt. Die Erfassung Ihrer eigentlichen Zahlungsdaten (z. B.
            Kartendaten bzw. Ihre PayPal-Anmeldung) erfolgt direkt auf der jeweils gesicherten Seite des
            Zahlungsdienstleisters, nicht auf unserer Website; dabei kann der Anbieter zusätzliche Daten
            (z. B. E-Mail-Adresse, Rechnungsadresse) direkt bei Ihnen erheben.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Ob und in welcher Form
            mit den Anbietern eine Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO besteht:{' '}
            <Todo>AVV-Status mit Stripe/PayPal prüfen und ergänzen</Todo>.
          </p>
        </Section>

        <Section n={12} title="Versand (DHL)">
          <p>
            Zur Auslieferung Ihrer Bestellung übermitteln wir Ihren Namen und Ihre Lieferanschrift sowie
            die Bestellnummer an DHL (<Todo>Rechtsträger und Anschrift von DHL ergänzen</Todo>). Ihre
            E-Mail-Adresse und Telefonnummer werden dabei nicht übermittelt.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Ob und in welcher Form
            mit DHL eine Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO besteht:{' '}
            <Todo>AVV-Status mit DHL prüfen und ergänzen</Todo>.
          </p>
        </Section>

        <Section n={13} title="Speicherdauer">
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die genannten Zwecke
            erforderlich ist. Anfragen, die nicht zu einem Vertrag führen, löschen wir spätestens nach
            Ablauf von sechs Monaten, sofern keine weitergehende Aufbewahrungspflicht besteht.
          </p>
          <p>
            Für Vertrags- und Rechnungsdaten gelten die gesetzlichen Aufbewahrungsfristen von sechs
            bzw. zehn Jahren (§ 257 HGB, § 147 AO). Für die Dauer dieser Fristen ist die Verarbeitung
            auf die Erfüllung der Aufbewahrungspflicht beschränkt. Nach Ablauf der zehnjährigen Frist
            werden die personenbezogenen Angaben der Bestellung automatisiert anonymisiert.
          </p>
          <p>
            Von Ihnen hochgeladene Logos und Motive sowie die daraus erzeugten Druckvorschauen gehören
            nicht zu den aufbewahrungspflichtigen Rechnungsunterlagen. Wir entfernen sie bereits
            deutlich früher aus unserem Dateispeicher – 24 Monate, nachdem die zugehörige Bestellung
            abgeschlossen oder storniert wurde.
          </p>
        </Section>

        <Section n={14} title="Ihre Rechte">
          <p>Sie haben jederzeit das Recht auf:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Auskunft über die von uns verarbeiteten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>
              Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
              (Art. 21 DSGVO)
            </li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte genügt eine formlose Mitteilung an die unter Ziffer 1 genannten
            Kontaktdaten.
          </p>
          <p>
            Darüber hinaus steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu
            (Art. 77 DSGVO). Zuständig für uns ist die Landesbeauftragte für Datenschutz und
            Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.
          </p>
        </Section>

        <Section n={15} title="Datensicherheit">
          <p>
            Die Übertragung sämtlicher Daten erfolgt verschlüsselt über TLS. Der Zugriff auf Bestell-
            und Anfragedaten ist auf berechtigte Personen beschränkt und durch eine gesonderte
            Anmeldung geschützt.
          </p>
        </Section>

        <Section n={16} title="Änderungen dieser Datenschutzerklärung">
          <p>
            Wir passen diese Datenschutzerklärung an, sobald Änderungen an unseren Leistungen oder den
            eingesetzten Diensten dies erforderlich machen. Es gilt jeweils die auf dieser Seite
            veröffentlichte Fassung.
          </p>
        </Section>
      </div>
    </main>
  );
}
