/**
 * Titel (<title>-Tag) einer Produktseite.
 *
 * Er trägt die Suchbegriffe („bedrucken & besticken") und bleibt ungekürzt.
 *
 * ── Warum nicht mehr mit dem Marken-Anhang des Root-Layouts ───────────────
 * Das Root-Layout hängt an jeden Titel „ | Embroidery Republic Germany" an
 * (29 Zeichen). Für das Produkt blieben dadurch 31 Zeichen – gemessen am
 * Katalog (154 Produkte) wurde bei 22 Produkten der Name mitten im Wort
 * abgeschnitten („Iconic 195 Ringspun Premium…"), bei 100 fiel die Marke weg,
 * und zwei verschiedene B&C-Shirts trugen denselben Titel. Die Produktseite
 * setzt deshalb `title: { absolute }` – wie die Kategorieseiten. Der Name des
 * Shops erscheint in Google ohnehin separat (WebSite-Daten).
 *
 * ── Stufen ────────────────────────────────────────────────────────────────
 * Die erste, die in die Google-Trefferliste (60 Zeichen) passt:
 *   „{Name} bedrucken & besticken | {Marke}"
 *   „{Name} bedrucken | {Marke}"
 *   „{Name} | {Marke}"
 *   „{Name} bedrucken"
 *   „{Name}"
 * Marke und Suchbegriff gehen vor dem Namen verloren – gekürzt wird erst, wenn
 * selbst der Name nicht passt (am Wortende, mit „…").
 */
import { kuerzenAufLaenge } from './kuerzen';

/** Google schneidet Titel in der Trefferliste ab ca. 60 Zeichen ab. */
export const TITEL_ZIELLAENGE = 60;

export function produktTitel(name: string, marke: string): string {
  const stufen = [
    `${name} bedrucken & besticken | ${marke}`,
    `${name} bedrucken | ${marke}`,
    `${name} | ${marke}`,
    `${name} bedrucken`,
    name,
  ];
  return stufen.find((titel) => titel.length <= TITEL_ZIELLAENGE) ?? kuerzenAufLaenge(name, TITEL_ZIELLAENGE);
}
