/**
 * Garnpaletten der Maschinenformate.
 *
 * PES (Brother, Babylock, Bernina Brother-Reihe) und JEF (Janome) tragen keine Garnfarben als RGB, sondern den PLATZ in der
 * festen Palette der Maschine: Die Maschine zeigt dann die Farbe und den Garnnamen aus ihrer eigenen Tabelle. Deshalb wird je
 * Farbblock der nächstliegende Palettenplatz bestimmt. Aufeinanderfolgende Farben mit demselben Platz würden sich an der
 * Maschine nicht unterscheiden – dann wird der zweitnächste Platz genommen.
 *
 * Die Tabellen entsprechen den Standardpaletten der Formate (Brother 64 Farben, Janome 78 Farben; Reihenfolge = Palettenplatz).
 * Quelle der Zahlenwerte: pyembroidery (MIT-Lizenz), EmbThreadPec.py / EmbThreadJef.py.
 * DST kennt keine Palette: Dort erfolgt die Garnzuordnung an der Maschine.
 */

export interface PalettenGarn {
  /** Palettenplatz (ab 1), wie er in der Datei steht. */
  platz: number;
  name: string;
  rgb: [number, number, number];
}

/** Brother PEC: Platz 1…64. */
const BROTHER: Array<[number, number, number, string]> = [
  [14, 31, 124, 'Prussian Blue'],
  [10, 85, 163, 'Blue'],
  [0, 135, 119, 'Teal Green'],
  [75, 107, 175, 'Cornflower Blue'],
  [237, 23, 31, 'Red'],
  [209, 92, 0, 'Reddish Brown'],
  [145, 54, 151, 'Magenta'],
  [228, 154, 203, 'Light Lilac'],
  [145, 95, 172, 'Lilac'],
  [158, 214, 125, 'Mint Green'],
  [232, 169, 0, 'Deep Gold'],
  [254, 186, 53, 'Orange'],
  [255, 255, 0, 'Yellow'],
  [112, 188, 31, 'Lime Green'],
  [186, 152, 0, 'Brass'],
  [168, 168, 168, 'Silver'],
  [125, 111, 0, 'Russet Brown'],
  [255, 255, 179, 'Cream Brown'],
  [79, 85, 86, 'Pewter'],
  [0, 0, 0, 'Black'],
  [11, 61, 145, 'Ultramarine'],
  [119, 1, 118, 'Royal Purple'],
  [41, 49, 51, 'Dark Gray'],
  [42, 19, 1, 'Dark Brown'],
  [246, 74, 138, 'Deep Rose'],
  [178, 118, 36, 'Light Brown'],
  [252, 187, 197, 'Salmon Pink'],
  [254, 55, 15, 'Vermilion'],
  [240, 240, 240, 'White'],
  [106, 28, 138, 'Violet'],
  [168, 221, 196, 'Seacrest'],
  [37, 132, 187, 'Sky Blue'],
  [254, 179, 67, 'Pumpkin'],
  [255, 243, 107, 'Cream Yellow'],
  [208, 166, 96, 'Khaki'],
  [209, 84, 0, 'Clay Brown'],
  [102, 186, 73, 'Leaf Green'],
  [19, 74, 70, 'Peacock Blue'],
  [135, 135, 135, 'Gray'],
  [216, 204, 198, 'Warm Gray'],
  [67, 86, 7, 'Dark Olive'],
  [253, 217, 222, 'Flesh Pink'],
  [249, 147, 188, 'Pink'],
  [0, 56, 34, 'Deep Green'],
  [178, 175, 212, 'Lavender'],
  [104, 106, 176, 'Wisteria Violet'],
  [239, 227, 185, 'Beige'],
  [247, 56, 102, 'Carmine'],
  [181, 75, 100, 'Amber Red'],
  [19, 43, 26, 'Olive Green'],
  [199, 1, 86, 'Dark Fuchsia'],
  [254, 158, 50, 'Tangerine'],
  [168, 222, 235, 'Light Blue'],
  [0, 103, 62, 'Emerald Green'],
  [78, 41, 144, 'Purple'],
  [47, 126, 32, 'Moss Green'],
  [255, 204, 204, 'Flesh Pink'],
  [255, 217, 17, 'Harvest Gold'],
  [9, 91, 166, 'Electric Blue'],
  [240, 249, 112, 'Lemon Yellow'],
  [227, 243, 91, 'Fresh Green'],
  [255, 153, 0, 'Orange'],
  [255, 240, 141, 'Cream Yellow'],
  [255, 200, 200, 'Applique'],
];

/** Janome JEF: Platz 1…78 (Reihenfolge der Tabelle). */
const JANOME: Array<[number, string]> = [
  [0x000000, 'Black'],
  [0xffffff, 'White'],
  [0xffff17, 'Yellow'],
  [0xff6600, 'Orange'],
  [0x2f5933, 'Olive Green'],
  [0x237336, 'Green'],
  [0x65c2c8, 'Sky'],
  [0xab5a96, 'Purple'],
  [0xf669a0, 'Pink'],
  [0xff0000, 'Red'],
  [0xb1704e, 'Brown'],
  [0x0b2f84, 'Blue'],
  [0xe4c35d, 'Gold'],
  [0x481a05, 'Dark Brown'],
  [0xac9cc7, 'Pale Violet'],
  [0xfcf294, 'Pale Yellow'],
  [0xf999b7, 'Pale Pink'],
  [0xfab381, 'Peach'],
  [0xc9a480, 'Beige'],
  [0x970533, 'Wine Red'],
  [0xa0b8cc, 'Pale Sky'],
  [0x7fc21c, 'Yellow Green'],
  [0xe5e5e5, 'Silver Gray'],
  [0x889b9b, 'Gray'],
  [0x98d6bd, 'Pale Aqua'],
  [0xb2e1e3, 'Baby Blue'],
  [0x368ba0, 'Powder Blue'],
  [0x4f83ab, 'Bright Blue'],
  [0x386a91, 'Slate Blue'],
  [0x071650, 'Navy Blue'],
  [0xf999a2, 'Salmon Pink'],
  [0xf9676b, 'Coral'],
  [0xe3311f, 'Burnt Orange'],
  [0xe2a188, 'Cinnamon'],
  [0xb59474, 'Umber'],
  [0xe4cf99, 'Blond'],
  [0xffcb00, 'Sunflower'],
  [0xe1add4, 'Orchid Pink'],
  [0xc3007e, 'Peony Purple'],
  [0x80004b, 'Burgundy'],
  [0x540571, 'Royal Purple'],
  [0xb10525, 'Cardinal Red'],
  [0xcae0c0, 'Opal Green'],
  [0x899856, 'Moss Green'],
  [0x5c941a, 'Meadow Green'],
  [0x003114, 'Dark Green'],
  [0x5dae94, 'Aquamarine'],
  [0x4cbf8f, 'Emerald Green'],
  [0x007772, 'Peacock Green'],
  [0x595b61, 'Dark Gray'],
  [0xfffff2, 'Ivory White'],
  [0xb15818, 'Hazel'],
  [0xcb8a07, 'Toast'],
  [0x986c80, 'Salmon'],
  [0x98692d, 'Cocoa Brown'],
  [0x4d3419, 'Sienna'],
  [0x4c330b, 'Sepia'],
  [0x33200a, 'Dark Sepia'],
  [0x523a97, 'Violet Blue'],
  [0x0d217e, 'Blue Ink'],
  [0x1e77ac, 'Sola Blue'],
  [0xb2dd53, 'Green Dust'],
  [0xf33689, 'Crimson'],
  [0xde649e, 'Floral Pink'],
  [0x984161, 'Wine'],
  [0x4c5612, 'Olive Drab'],
  [0x4c881f, 'Meadow'],
  [0xe4de79, 'Mustard'],
  [0xcb8a1a, 'Yellow Ocher'],
  [0xcba21c, 'Old Gold'],
  [0xff9805, 'Honey Dew'],
  [0xfcb257, 'Tangerine'],
  [0xffe505, 'Canary Yellow'],
  [0xf0331f, 'Vermilion'],
  [0x1a842d, 'Bright Green'],
  [0x386cae, 'Ocean Blue'],
  [0xe3c4b4, 'Beige Gray'],
  [0xe3ac81, 'Bamboo'],
];

export const BROTHER_PALETTE: PalettenGarn[] = BROTHER.map(([r, g, b, name], i) => ({ platz: i + 1, name, rgb: [r, g, b] }));
export const JANOME_PALETTE: PalettenGarn[] = JANOME.map(([farbe, name], i) => ({
  platz: i + 1,
  name,
  rgb: [(farbe >> 16) & 255, (farbe >> 8) & 255, farbe & 255],
}));

export function hexZuRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const v = parseInt(m[1]!, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Farbabstand mit Gewichtung nach Rot-Mittelwert ("redmean"): näher am Seheindruck als der reine RGB-Abstand. */
function abstand(a: [number, number, number], b: [number, number, number]): number {
  const rm = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

/**
 * Bestimmt je Garnfarbe den Palettenplatz. Folgen zwei Farben direkt aufeinander und fielen auf denselben Platz, bekommt die
 * zweite den nächstbesten anderen (sonst sähe die Maschine keinen Farbwechsel).
 */
export function waehlePalettenGarne(hexFarben: string[], palette: PalettenGarn[]): PalettenGarn[] {
  const gewaehlt: PalettenGarn[] = [];
  for (const hex of hexFarben) {
    const rgb = hexZuRgb(hex);
    const vorher = gewaehlt[gewaehlt.length - 1];
    let beste: PalettenGarn | null = null;
    let besterAbstand = Infinity;
    for (const garn of palette) {
      if (vorher && garn.platz === vorher.platz) continue;
      const d = abstand(rgb, garn.rgb);
      if (d < besterAbstand) {
        besterAbstand = d;
        beste = garn;
      }
    }
    gewaehlt.push(beste ?? palette[0]!);
  }
  return gewaehlt;
}
