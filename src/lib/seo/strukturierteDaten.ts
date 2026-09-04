/**
 * Strukturierte Daten (JSON-LD) für Suchmaschinen – reine Logik.
 *
 * Ohne sie sieht Google eine Produktseite nur als Text. Mit ihr versteht sie
 * Marke, Preis, Verfügbarkeit und Bild und kann ein angereichertes Ergebnis
 * anzeigen (Preis und Verfügbarkeit direkt in der Trefferliste).
 *
 * ── Nur belegte Angaben ───────────────────────────────────────────────
 * Es werden ausschließlich Felder ausgegeben, die aus dem Katalog stammen.
 * Keine erfundenen Bewertungen, keine erfundene Verfügbarkeit. Insbesondere
 * gibt es **keine** `aggregateRating`/`review`-Angaben – Bewertungen ohne
 * echte Kundenstimmen wären eine Falschangabe und ein Verstoß gegen Googles
 * Richtlinien.
 *
 * ── Warum AggregateOffer statt Offer ──────────────────────────────────
 * Der Katalogpreis ist ein **Ab-Preis**: Veredelung, Menge und Staffel ändern
 * ihn. `AggregateOffer` mit `lowPrice` sagt genau das aus – ein einzelner
 * `price` würde einen Festpreis behaupten, den es nicht gibt.
 */
import type { ProductConfig } from '@/config/products/types';
import { repraesentativBildVon, PLATZHALTER_BILD } from '@/lib/assets';
import { waehlbareFarben, formatiereFarbname } from '@/lib/products/farben';
import { supplierRefVon } from '@/lib/suppliers/supplierRefs';
import { ermittleVerfuegbarkeit } from '@/lib/catalog/verfuegbarkeit';
import { COMPANY } from '@/config/company';

/** Schema.org-Verfügbarkeit aus dem Katalogstatus. */
function schemaVerfuegbarkeit(produkt: ProductConfig): string {
  switch (ermittleVerfuegbarkeit(produkt)) {
    case 'ausgelaufen':
      return 'https://schema.org/Discontinued';
    case 'voruebergehend_nicht_lieferbar':
      return 'https://schema.org/OutOfStock';
    default:
      return 'https://schema.org/InStock';
  }
}

/**
 * Product-Auszeichnung einer Produktseite.
 *
 * `basis` ist die öffentliche Basisadresse (ohne Schrägstrich am Ende).
 */
export function produktSchema(produkt: ProductConfig, basis: string): Record<string, unknown> {
  const url = `${basis}/produkt/${produkt.id}`;
  // Nur wählbare Farben auszeichnen – sonst verspricht das Suchergebnis eine
  // Farbe, die der Kunde auf der Seite gar nicht anklicken kann.
  const farben = waehlbareFarben(produkt.id, produkt.colors);
  const bilder = farben
    .map((farbe) => repraesentativBildVon(produkt.id, farbe.id))
    // Platzhalter (Bildimport noch offen) NIE als Produktbild veröffentlichen
    // (ADR 0004): keine Platzhalter in JSON-LD/Suchmaschinen.
    .filter((pfad) => pfad !== PLATZHALTER_BILD)
    .slice(0, 6)
    .map((pfad) => `${basis}${pfad}`);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produkt.name,
    description: produkt.description,
    url,
    brand: { '@type': 'Brand', name: produkt.brand },
    material: produkt.material,
    color: farben.map((f) => formatiereFarbname(f.name)),
    // Einheitsgrößen-/größenlose Produkte (künftig) zeichnen KEIN leeres size-Array aus.
    ...(produkt.sizes.length > 0 ? { size: produkt.sizes } : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: produkt.basePrice,
      availability: schemaVerfuegbarkeit(produkt),
      url,
    },
  };

  if (bilder.length > 0) schema.image = bilder;
  // Artikelnummer nur, wenn wirklich eine hinterlegt ist (aus der Lieferantenschicht).
  const supplierRef = supplierRefVon(produkt.id);
  if (supplierRef?.articleNumber) schema.sku = supplierRef.articleNumber;

  return schema;
}

/** Brotkrumenpfad einer Produktseite: Start → Produkte → Produkt. */
export function brotkrumenSchema(
  produkt: ProductConfig,
  artLabel: string,
  basis: string
): Record<string, unknown> {
  const stationen = [
    { name: 'Start', url: basis },
    { name: 'Produkte', url: `${basis}/produkt` },
    { name: artLabel, url: `${basis}/produkt?kategorie=${produkt.productType}` },
    { name: produkt.name, url: `${basis}/produkt/${produkt.id}` },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: stationen.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: s.url,
    })),
  };
}

/**
 * Das Unternehmen selbst – einmal auf der Startseite.
 *
 * Nur Angaben, die auch im Impressum stehen bzw. aus der Konfiguration
 * kommen. Keine erfundenen Telefonnummern oder Profile.
 *
 * Adresse, Telefon und USt-IdNr. kommen seit Migration von der zunächst
 * bewusst weggelassenen Fassung (die Firmendaten waren zum damaligen
 * Zeitpunkt noch Platzhalter) direkt aus `COMPANY` – derselben einzigen
 * Quelle, die auch das Impressum nutzt. `@type` trägt zusätzlich
 * `LocalBusiness`, damit lokale Suchen (z.B. "Stickerei Köln") das
 * Map-Pack-Signal bekommen, ohne die Organization-Auszeichnung zu verlieren.
 */
export function organisationSchema(basis: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: 'Embroidery Republic Germany',
    url: basis,
    logo: `${basis}/brand/logo.jpg`,
    description:
      'Firmen- und Teambekleidung individuell veredelt: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet.',
    areaServed: 'DE',
    telephone: COMPANY.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.street,
      postalCode: COMPANY.zip,
      addressLocality: COMPANY.city,
      addressCountry: 'DE',
    },
    vatID: COMPANY.vatId,
  };
}

/**
 * Die Website als Ganzes – im Root-Layout, erscheint also auf JEDER Seite
 * (anders als `organisationSchema`, bewusst nur auf der Startseite). Bisher
 * gab es nur eine eingebettete Kopie in `sammlungSchema` (`isPartOf`) – eine
 * eigenständige `WebSite`-Auszeichnung fehlte auf allen anderen Seiten.
 *
 * Bewusst OHNE `potentialAction`/`SearchAction`: Der Shop-Filter kennt keine
 * generische Freitextsuche über einen `q`-Parameter (nur Facetten wie
 * Marke/Farbe/Größe) – eine SearchAction, die dorthin zeigte, wäre eine
 * Suchmaschinen-Funktion, die beim Anklicken nicht das täte, was sie
 * verspricht.
 */
export function websiteSchema(basis: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Embroidery Republic Germany',
    url: basis,
    inLanguage: 'de-DE',
  };
}

/**
 * Katalogübersicht als CollectionPage + der zugehörige Brotkrumenpfad.
 *
 * Nur für die ungefilterte, indexierbare Ansicht gedacht (gefilterte Ansichten
 * sind `noindex`). Bewusst schlank: kein vollständiges ItemList mit 40+ Offers –
 * die einzelnen Produktseiten tragen die Produkt-Auszeichnung, die Übersicht
 * beschreibt nur die Sammlung.
 */
export function sammlungSchema(basis: string, anzahl: number): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Alle Produkte',
    description: `${anzahl} individuell veredelbare Produkte etablierter Marken – mit DTF-Transferdruck oder Stickerei, ab 1 Stück.`,
    url: `${basis}/produkt`,
    isPartOf: { '@type': 'WebSite', name: 'Embroidery Republic Germany', url: basis },
  };
}

export function katalogBrotkrumenSchema(basis: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: basis },
      { '@type': 'ListItem', position: 2, name: 'Produkte', item: `${basis}/produkt` },
    ],
  };
}

/**
 * FAQ-Auszeichnung der Häufig-gefragt-Seite.
 *
 * Ermöglicht ein FAQ-Rich-Result in der Google-Trefferliste. Die Fragen und
 * Antworten sind wortgleich mit der sichtbaren Seite – Google verlangt das
 * ausdrücklich (keine versteckten, nur für die Auszeichnung erzeugten Inhalte).
 */
export function faqSchema(fragen: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: fragen.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
