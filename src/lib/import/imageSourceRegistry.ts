/**
 * Registry der Bildquellen (ADR 0006) – die EINZIGE Stelle, an der eine Quelle
 * angebunden wird. Ein neuer Hersteller: seinen `ImageSource`-Adapter hier
 * eintragen (Priorität 0…N, kleiner = Vorrang) + sein Farb-/Produkt-Mapping –
 * sonst nichts. Pipeline, Merge, Manifest, Konfigurator bleiben unverändert.
 *
 * Der Bestand (bereits vorhandene Fotos) ist als schwächste Quelle (hohe
 * Prioritätszahl) immer dabei: er bewahrt vorhandene Originale, tritt aber hinter
 * jedes echte Herstellerbild zurück.
 */
import type { ImageSource } from './imageSource';
import { bestandImageSource } from './sources/bestand';

/** Alle registrierten Bildquellen, nach Priorität aufsteigend (Vorrang zuerst). */
export function alleImageSources(): ImageSource[] {
  const quellen: ImageSource[] = [
    // ── Herstelleradapter (prioritaet 0…N) kommen hier hinzu, sobald die
    //    offiziellen Herstellerquellen vorliegen. Beispiel:
    //    gildanImageSource(), bandCImageSource(), …
    bestandImageSource(),
  ];
  return [...quellen].sort((a, b) => a.prioritaet - b.prioritaet);
}
