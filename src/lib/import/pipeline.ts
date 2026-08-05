/**
 * Zentrale Orchestrierung der Mehrquellen-Bildpipeline (ADR 0006).
 *
 * Für ein Produkt: alle Quellen fragen → mergen (Priorität/Herkunft/Wächter) →
 * jede gewonnene Referenz verarbeiten (Download → Normalisierung → webp/png →
 * Content-Hash → Speicherort; als `Verarbeiter` INJIZIERT, damit diese reine
 * Orchestrierung ohne Netzwerk/Dateisystem testbar bleibt) → je Farbe ein
 * Manifest-v2-Eintrag. Jede Farbe erhält einen Eintrag – auch ohne Asset
 * (`status:'platzhalter'`), damit der Bestand vollständig abgebildet ist.
 *
 * KEINE quellenspezifische Sonderlogik: ein neuer Hersteller ist eine weitere
 * `ImageSource` in `quellen` + sein Mapping – diese Datei ändert sich nicht.
 */
import type { ImageSource, BildReferenz, ImportProduktRef } from './imageSource';
import { mergeBildReferenzen } from './mediaMerge';
import { baueManifestEintrag, type ManifestEintragV2, type VerarbeiteteReferenz } from './manifestV2';

/** Verarbeitet eine gemergte Referenz zu einem gespeicherten, versionierten Asset
 *  (Download/Normalisierung/webp-png/Content-Hash/Store). Wird injiziert. */
export type Verarbeiter = (ref: BildReferenz) => Promise<VerarbeiteteReferenz>;

/** Manifest v2 EINES Produkts: colorId → Eintrag (jede Farbe des Produkts vertreten). */
export async function baueProduktManifest(
  produkt: ImportProduktRef,
  quellen: readonly ImageSource[],
  verarbeite: Verarbeiter,
  inferierbareViews?: readonly string[],
): Promise<Record<string, ManifestEintragV2>> {
  const alle: BildReferenz[] = [];
  for (const q of quellen) alle.push(...(await q.bilderFuer(produkt)));

  const gemergt = mergeBildReferenzen(alle, inferierbareViews);
  const verarbeitet = await Promise.all(gemergt.map((r) => verarbeite(r)));

  const proFarbe = new Map<string, VerarbeiteteReferenz[]>();
  for (const r of verarbeitet) {
    const liste = proFarbe.get(r.colorId);
    if (liste) liste.push(r);
    else proFarbe.set(r.colorId, [r]);
  }

  const eintrag: Record<string, ManifestEintragV2> = {};
  for (const c of produkt.colors) {
    eintrag[c.id] = baueManifestEintrag(proFarbe.get(c.id) ?? []);
  }
  return eintrag;
}
