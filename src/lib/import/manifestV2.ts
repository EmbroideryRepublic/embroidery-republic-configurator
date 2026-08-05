/**
 * Manifest v2 der Asset-Schicht (ADR 0006).
 *
 * Trägt je Produktfarbe die **volle Provenienz** jedes Assets (Ansicht, Rolle,
 * Herkunft, Quelle, Content-Hash-Version, Speicherort) und bleibt zugleich
 * **rückwärtskompatibel**: `views` (Rolle `ansicht-flach`) + `status` behalten
 * ihre Form, damit Konfigurator und die bestehenden Resolver
 * (`resolveColorImages`/`bildFuerAnsicht`/…) UNVERÄNDERT weiterlaufen. Neue
 * Konsumenten (Report, `resolveAsset` für Rollen) lesen `assets`.
 *
 * Reiner Aufbau aus den gemergten Referenzen (mediaMerge) – im Test-Gate
 * abgesichert; keine quellenspezifische Sonderlogik.
 */
import type { AssetRolle, AssetHerkunft, BildReferenz } from './imageSource';

/** Ein Asset im Manifest v2 – reiche Provenienz je (Ansicht, Rolle). */
export interface AssetV2 {
  view: string;
  rolle: AssetRolle;
  herkunft: AssetHerkunft;
  /** Provenienz-Label (z. B. `gildan.eu`, `needen.de`, `bestand`, `generiert:<verfahren>`). */
  quelle: string;
  /** Content-Hash der Bytes = Version (Änderungs-/Ersatzerkennung). */
  version: string;
  /** Browser-Pfad im Asset-Store (`/products/<storageKey>/<view>.webp`). */
  browserPfad: string;
}

/** `real` = mind. ein Originalfoto · `generiert` = nur Visualisierung(en) ·
 *  `platzhalter` = kein Asset. Externe Ausgaben zeigen nur `real`. */
export type AssetStatus = 'real' | 'generiert' | 'platzhalter';

/** Manifest-Eintrag v2 einer Produktfarbe. */
export interface ManifestEintragV2 {
  /** Rückwärtskompatibel: Rolle `ansicht-flach`, view → browserPfad. */
  views: Record<string, string>;
  status: AssetStatus;
  /** Volle Provenienz aller Assets (alle Rollen). */
  assets: AssetV2[];
}

/** Eine von der Pipeline verarbeitete Referenz: Merge-Ergebnis + zugewiesener
 *  Speicherort + Content-Hash-Version. */
export interface VerarbeiteteReferenz extends BildReferenz {
  browserPfad: string;
  version: string;
}

/**
 * Baut den Manifest-v2-Eintrag einer Farbe aus ihren (bereits gemergten +
 * verarbeiteten) Referenzen. `views` enthält NUR flache Ansichten
 * (`ansicht-flach`); Zusatzmedien (freisteller/detail/lifestyle/…) leben in
 * `assets` und tauchen im Konfigurator nicht auf, sind aber verwaltet.
 */
export function baueManifestEintrag(refs: readonly VerarbeiteteReferenz[]): ManifestEintragV2 {
  const assets: AssetV2[] = refs.map((r) => ({
    view: r.view,
    rolle: r.rolle,
    herkunft: r.herkunft,
    quelle: r.quelle,
    version: r.version,
    browserPfad: r.browserPfad,
  }));

  const views: Record<string, string> = {};
  for (const a of assets) {
    if (a.rolle === 'ansicht-flach') views[a.view] = a.browserPfad;
  }

  const status: AssetStatus = assets.some((a) => a.herkunft === 'original')
    ? 'real'
    : assets.length > 0
      ? 'generiert'
      : 'platzhalter';

  return { views, status, assets };
}

/**
 * Rollen-Resolver über einen Manifest-v2-Eintrag (ADR 0006). EINE Auflösungsstelle
 * für beliebige Medienrollen – der Konfigurator nutzt weiter `views` (Rolle
 * `ansicht-flach`), Galerie/Detail/Lifestyle/Video-Konsumenten künftig `resolveAsset`.
 * Bevorzugt ein Original vor einer generierten Variante (Qualitätsmaßstab).
 */
export function resolveAsset(
  eintrag: ManifestEintragV2 | undefined,
  opts: { rolle?: AssetRolle; view?: string } = {},
): AssetV2 | undefined {
  if (!eintrag) return undefined;
  const rolle = opts.rolle ?? 'ansicht-flach';
  const passend = eintrag.assets.filter(
    (a) => a.rolle === rolle && (opts.view === undefined || a.view === opts.view),
  );
  return passend.find((a) => a.herkunft === 'original') ?? passend[0];
}

/** Alle Assets einer Rolle (z. B. alle Lifestyle-Bilder einer Farbe). */
export function assetsMitRolle(eintrag: ManifestEintragV2 | undefined, rolle: AssetRolle): AssetV2[] {
  return eintrag ? eintrag.assets.filter((a) => a.rolle === rolle) : [];
}
