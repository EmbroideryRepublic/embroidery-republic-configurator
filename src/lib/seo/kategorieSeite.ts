/**
 * Logik der Kategorie-Landingpages – rein bis auf `berechneBeispiele`
 * (ruft die Preis-Engine; dennoch ohne Datenbank, Netz oder Browser).
 *
 * Die TEXTE stehen in `config/seo/kategorieSeiten.ts`. Hier wird daraus die
 * Seite gebaut: Katalogfakten einsetzen, Preisbeispiele rechnen, Adressen
 * liefern. Nichts davon wird von Hand eingetragen, damit es nicht veraltet.
 *
 * ── Fail-fast statt stiller Annahmen ──────────────────────────────────
 * Ein unbekannter Platzhalter, ein nicht gefundenes Beispielprodukt oder ein
 * nicht berechenbarer Preis bricht den Bau ab (die Seiten entstehen statisch
 * beim Build). Lieber ein roter Build als eine veröffentlichte Preisangabe, die
 * falsch oder leer ist.
 */
import { PRODUCTS, getProduct } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import type { CartItem, ConfigElement, ProductType } from '@/types';
import { PRODUKTIONSTAGE, VERSANDTAGE } from '@/config/company';
import { ABLAUF_SCHRITTE, type KategorieBeispiel, type KategorieSeite } from '@/config/seo/kategorieSeiten';
import { produktAbfrage } from '@/lib/catalog/abfrage';
import { LEERE_KRITERIEN } from '@/lib/catalog/kriterien';
import { priceCart } from '@/lib/pricing/serverPricing';
import { formatiereGeld } from '@/lib/format';

// Adress-Funktionen liegen in einer leichten Datei (siehe dort) und werden hier
// der Bequemlichkeit halber mit ausgegeben.
export { alleKategorieSlugs, kategorieSeiteVon, kategorieLink } from './kategorieAdresse';

// ── Katalogfakten und Platzhalter ───────────────────────────────────────

export interface KategorieFakten {
  anzahl: number;
  /** Nach Modellanzahl absteigend, dann alphabetisch. */
  marken: string[];
  gewichtMin?: number;
  gewichtMax?: number;
  abPreis: number;
}

export function kategorieFakten(art: ProductType): KategorieFakten {
  const produkte = PRODUCTS.filter((p) => p.productType === art);
  if (produkte.length === 0) {
    throw new Error(`Kategorieseite für "${art}": im Katalog gibt es kein Produkt dieser Art.`);
  }
  const zaehler = new Map<string, number>();
  for (const p of produkte) zaehler.set(p.brand, (zaehler.get(p.brand) ?? 0) + 1);
  const marken = [...zaehler.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .map(([marke]) => marke);
  const gewichte = produkte.map((p) => p.weightGsm).filter((g): g is number => typeof g === 'number');

  return {
    anzahl: produkte.length,
    marken,
    gewichtMin: gewichte.length ? Math.min(...gewichte) : undefined,
    gewichtMax: gewichte.length ? Math.max(...gewichte) : undefined,
    abPreis: Math.min(...produkte.map((p) => p.basePrice)),
  };
}

/** „A, B und C" aus einer Liste. */
function listeMitUnd(eintraege: string[]): string {
  if (eintraege.length <= 1) return eintraege[0] ?? '';
  return `${eintraege.slice(0, -1).join(', ')} und ${eintraege[eintraege.length - 1]}`;
}

/** Setzt {platzhalter} ein. Unbekannte oder nicht befüllbare Platzhalter werfen. */
export function fuelleVorlage(text: string, f: KategorieFakten): string {
  const werte: Record<string, () => string> = {
    anzahl: () => String(f.anzahl),
    markenAnzahl: () => String(f.marken.length),
    marken: () => listeMitUnd(f.marken),
    marken3: () => f.marken.slice(0, 3).join(', '),
    gewichtMin: () => {
      if (f.gewichtMin === undefined) throw new Error('{gewichtMin} verwendet, aber kein Produkt der Art hat ein Gewicht.');
      return String(f.gewichtMin);
    },
    gewichtMax: () => {
      if (f.gewichtMax === undefined) throw new Error('{gewichtMax} verwendet, aber kein Produkt der Art hat ein Gewicht.');
      return String(f.gewichtMax);
    },
    abPreis: () => formatiereGeld(f.abPreis),
    produktion: () => `${PRODUKTIONSTAGE.von} bis ${PRODUKTIONSTAGE.bis} Werktagen`,
    versand: () => `${VERSANDTAGE.von} bis ${VERSANDTAGE.bis} Werktagen`,
  };
  return text.replace(/\{(\w+)\}/g, (treffer, name: string) => {
    const wert = werte[name];
    if (!wert) throw new Error(`Unbekannter Platzhalter ${treffer} in Kategorietext: "${text.slice(0, 60)}…"`);
    return wert();
  });
}

/** Ablaufschritte mit eingesetzten Zeiten. */
export function ablaufSchritte(fakten: KategorieFakten): string[] {
  return ABLAUF_SCHRITTE.map((s) => fuelleVorlage(s, fakten));
}

// ── Produkte der Seite ──────────────────────────────────────────────────

/**
 * Die ersten Treffer der Produktart in der Standard-Sortierung des Katalogs
 * (dieselbe Abfrage wie die Filteransicht – Qualitätsstufe, dann Preis, solange
 * keine Verkaufszahlen vorliegen). `gesamt` = alle Produkte der Art.
 */
export function topProdukte(art: ProductType, anzahl: number): { produkte: ProductConfig[]; gesamt: number } {
  const ergebnis = produktAbfrage().finde({ ...LEERE_KRITERIEN, kategorie: [art] });
  return { produkte: ergebnis.produkte.slice(0, anzahl), gesamt: ergebnis.gesamt };
}

// ── Preisbeispiele aus der echten Preis-Engine ──────────────────────────

export interface BerechnetesBeispiel {
  beschriftung: string;
  menge: number;
  stueckpreis: number;
  gesamt: number;
  produktName: string;
  textilAb: number;
}

const runde2 = (n: number) => Math.round(n * 100) / 100;

function positionAlsCartItem(b: KategorieBeispiel, produkt: ProductConfig): CartItem {
  const farbe = produkt.colors[0];
  if (!farbe) throw new Error(`Beispielprodukt ${produkt.id} hat keine Farbe.`);
  const menge = Object.values(b.groessen).reduce((a, n) => a + n, 0);
  const elemente = b.flaechen.map(
    (f, i) =>
      ({
        id: `beispiel-${i}`,
        type: 'logo',
        view: f.ansicht,
        xCm: 0,
        yCm: 0,
        widthCm: f.breiteCm,
        heightCm: f.hoeheCm,
        rotationDeg: 0,
        isOutOfBounds: false,
        extraPrice: 0,
        estimatedStitches: f.stiche ?? 0,
        name: 'Beispiel',
        locked: false,
        hidden: false,
        fileUrl: '',
        fileName: 'beispiel.png',
        originalWidthPx: 800,
        originalHeightPx: 800,
        originalFileUrl: '',
        backgroundRemoved: false,
        contentFillRatio: 0.85,
      }) as ConfigElement
  );
  return {
    id: 'beispiel',
    printMethod: b.methode,
    productId: produkt.id,
    colorId: farbe.id,
    sizeQuantities: b.groessen,
    quantity: menge,
    elements: elemente,
    // Client-Preise werden von priceCart ohnehin ignoriert.
    unitPrice: 0,
    totalPrice: 0,
    addedAt: 0,
  };
}

/**
 * Rechnet die Beispiele der Seite über `priceCart` – dieselbe Funktion wie im
 * Checkout, ohne Lieferland (also ohne Versand). Der Stückpreis ist damit exakt
 * der, den der Konfigurator für diese Konfiguration anzeigt.
 */
export async function berechneBeispiele(seite: KategorieSeite): Promise<BerechnetesBeispiel[]> {
  const ergebnisse: BerechnetesBeispiel[] = [];
  for (const b of seite.beispiele) {
    const produkt = getProduct(b.produktId);
    if (!produkt) throw new Error(`Beispielprodukt "${b.produktId}" (${seite.slug}) nicht im Katalog.`);
    const preis = await priceCart([positionAlsCartItem(b, produkt)]);
    if (preis.blocked || preis.unpriceable.length > 0 || preis.totalQuantity < 1) {
      throw new Error(`Beispiel "${b.beschriftung}" ist nicht berechenbar: ${preis.issues.join('; ') || 'blockiert'}`);
    }
    ergebnisse.push({
      beschriftung: b.beschriftung,
      menge: preis.totalQuantity,
      stueckpreis: runde2(preis.subtotal / preis.totalQuantity),
      gesamt: runde2(preis.subtotal),
      produktName: `${produkt.brand} ${produkt.name}`,
      textilAb: produkt.basePrice,
    });
  }
  return ergebnisse;
}
