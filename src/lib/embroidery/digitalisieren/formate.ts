/**
 * Alle Maschinenformate aus EINEM Stickplan: DST (Tajima und viele Industriemaschinen), PES (Brother) und JEF (Janome).
 * Alle drei enthalten dieselbe Stichfolge mit denselben Fadenschnitten; sie unterscheiden sich nur in der Kodierung und
 * darin, wie sie die Garnfarben tragen (DST gar nicht, PES/JEF als Platz in der Palette der Maschine).
 */
import { planZuBefehlen } from './befehle';
import { schreibeDstAusBefehlen } from './dst';
import { BROTHER_PALETTE, JANOME_PALETTE, waehlePalettenGarne } from './garnpaletten';
import { schreibeJef } from './jef';
import { DST_MAX_SCHRITT_EINHEITEN, JEF_MAX_SCHRITT_EINHEITEN, PEC_MAX_SCHRITT_EINHEITEN, SCHNITT_AB_MM } from './parameter';
import { schreibePes } from './pes';
import type { Stickplan } from './stickplan';

export type StickFormat = 'dst' | 'pes' | 'jef';

export const STICK_FORMATE: ReadonlyArray<{ format: StickFormat; endung: string; maschinen: string }> = [
  { format: 'dst', endung: 'dst', maschinen: 'Tajima, Barudan, ZSK, SWF, Happy und viele weitere Industriemaschinen' },
  { format: 'pes', endung: 'pes', maschinen: 'Brother, Babylock, Bernina (Brother-Reihe)' },
  { format: 'jef', endung: 'jef', maschinen: 'Janome' },
];

export function istStickFormat(wert: string | null | undefined): wert is StickFormat {
  return wert === 'dst' || wert === 'pes' || wert === 'jef';
}

export interface GarnZuordnung {
  /** Garnfarbe des Motivs. */
  hex: string;
  /** Nächstliegender Platz der Brother-Palette (PES). */
  brother: { platz: number; name: string };
  /** Nächstliegender Platz der Janome-Palette (JEF). */
  janome: { platz: number; name: string };
}

export interface Stickdateien {
  dst: Buffer;
  pes: Buffer;
  jef: Buffer;
  garne: GarnZuordnung[];
  /** Zahl der Fadenschnitte in der Datei. */
  schnitte: number;
}

/**
 * Erzeugt alle drei Dateien. `name` steht im Kopf (nur ASCII, in PES nur die ersten 8 Zeichen); `datum` im JEF-Kopf.
 */
export function schreibeStickdateien(plan: Stickplan, name: string, datum?: Date): Stickdateien {
  const dstFolge = planZuBefehlen(plan, { maxSchritt: DST_MAX_SCHRITT_EINHEITEN, schnittAbMm: SCHNITT_AB_MM });
  const jefFolge = planZuBefehlen(plan, { maxSchritt: JEF_MAX_SCHRITT_EINHEITEN, schnittAbMm: SCHNITT_AB_MM });
  const pecFolge = planZuBefehlen(plan, { maxSchritt: PEC_MAX_SCHRITT_EINHEITEN, schnittAbMm: SCHNITT_AB_MM });

  const brother = waehlePalettenGarne(dstFolge.farben, BROTHER_PALETTE);
  const janome = waehlePalettenGarne(dstFolge.farben, JANOME_PALETTE);

  return {
    dst: schreibeDstAusBefehlen(dstFolge, name),
    pes: schreibePes(pecFolge, name, brother.map((g) => g.platz)),
    jef: schreibeJef(jefFolge, janome.map((g) => g.platz), datum),
    garne: dstFolge.farben.map((hex, i) => ({
      hex,
      brother: { platz: brother[i]!.platz, name: brother[i]!.name },
      janome: { platz: janome[i]!.platz, name: janome[i]!.name },
    })),
    schnitte: dstFolge.schnitte,
  };
}
