/**
 * Inhalt von /llms.txt – kurze, maschinenlesbare Übersicht für KI-Assistenten und Suchsysteme (llmstxt.org).
 *
 * Gedacht, damit Systeme, die Fragen wie „Wo kann ich einzelne Hoodies bedrucken lassen?“ beantworten, die wichtigsten Seiten
 * und Eckdaten finden. Alle Fakten kommen aus der Konfiguration (Versandsätze, Produktions- und Versandzeiten, Seitenregister) und
 * bleiben damit automatisch aktuell; Preise stehen bewusst NICHT hier – sie werden im Konfigurator live berechnet.
 *
 * Kundentext: Wortlaut nur nach Freigabe ändern (docs/seo/anlass-seiten-wortlaut.md).
 */
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import { KATEGORIE_SEITEN } from '@/config/seo/kategorieSeiten';
import { veredelungVerfuegbar } from '@/config/bestellweg';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import { produktTypLabelPlural } from '@/config/products/types';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld } from '@/lib/format';

export function llmsText(basis: string): string {
  const link = (pfad: string, label: string, text?: string) => `- [${label}](${basis}${pfad})${text ? `: ${text}` : ''}`;
  const sortiment = [
    ...KATEGORIE_SEITEN.map((s) => link(`/${s.slug}`, produktTypLabelPlural(s.art))),
    ...DTF_SEITEN.filter((s) => s.art).map((s) => link(`/${s.slug}`, produktTypLabelPlural(s.art!))),
  ];
  const marken = DTF_SEITEN.filter((s) => s.marke).map((s) => link(`/${s.slug}`, s.marke!));
  const anlaesse = ANLASS_SEITEN.map((s) => link(`/${s.slug}`, s.kurzname));

  const hinweise = [
    'Veredelung: DTF-Transferdruck, vollfarbig, auch fotorealistische Motive.',
    'Bestellung ab einem einzelnen Stück, ohne Mindestbestellmenge; Staffelpreise ab 5 Stück.',
    'Alle Preise werden live im Konfigurator berechnet. Es wird keine Umsatzsteuer ausgewiesen (§ 19 UStG).',
    `Produktion ${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktage, Versand ${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktage.`,
    `Lieferung nur innerhalb Deutschlands: Versandkosten ${formatiereGeld(SHIPPING_RATES.DE.cost)}, ab ${formatiereGeld(SHIPPING_RATES.DE.freeFrom)} Bestellwert versandkostenfrei.`,
    ...(veredelungVerfuegbar('embroidery') ? [] : ['Die Stickerei ist wegen Wartungs- und Umbauarbeiten vorübergehend nicht verfügbar.']),
  ];

  return [
    '# Embroidery Republic Germany',
    '',
    '> Online-Konfigurator für individuell bedruckte Textilien: T-Shirts, Hoodies, Polos, Jacken und Kinderbekleidung etablierter Marken – für Privatpersonen, Vereine und Unternehmen.',
    '',
    ...hinweise.map((h) => `- ${h}`),
    '',
    '## Bestellen',
    link('/konfigurator', 'Konfigurator', 'Motiv hochladen, platzieren, Preis in Echtzeit sehen'),
    link('/produkt', 'Alle Produkte'),
    link('/faq', 'Häufige Fragen', 'Bestellung, Dateien, Produktion, Versand, Zahlung'),
    link('/kontakt', 'Kontakt'),
    '',
    '## Anlässe und Ratgeber',
    ...anlaesse,
    '',
    '## Sortiment',
    ...sortiment,
    '',
    '## Marken',
    ...marken,
    '',
  ].join('\n');
}
