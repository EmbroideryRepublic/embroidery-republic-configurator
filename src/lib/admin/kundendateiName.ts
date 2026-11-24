/**
 * Dateinamen der Kundendateien im Adminbereich – reine Funktionen, auch von Client-Komponenten nutzbar.
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────
 * Der Konfigurator wandelt JEDEN Upload (SVG, JPG, PDF, PNG) im Browser in PNG um (lib/upload/pruefeUpload.ts, Kopfkommentar): Gespeichert
 * wird immer `…-original.png`. Der Dateiname der Kundschaft blieb dabei unverändert („logo.svg“) und wurde als Name des Downloads
 * verwendet – im Download-Ordner lag dann ein PNG mit der Endung .svg, das sich in Browsern und Grafikprogrammen nicht als SVG öffnen
 * ließ. Der Name eines Downloads muss zum INHALT passen: Er folgt der Endung des Speicherpfads, nicht der Endung des Kundennamens.
 */

/** Endungen, die der Speicherpfad tragen kann, und die Bezeichnung dazu. */
const BEKANNTE_ENDUNGEN: Record<string, string> = { png: 'PNG', jpg: 'JPG', jpeg: 'JPG', webp: 'WEBP', pdf: 'PDF' };

function endungVon(name: string): string {
  const punkt = name.lastIndexOf('.');
  if (punkt <= 0 || punkt === name.length - 1) return '';
  return name
    .slice(punkt + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function ohneEndung(name: string): string {
  const punkt = name.lastIndexOf('.');
  return punkt > 0 ? name.slice(0, punkt) : name;
}

/** Endung der gespeicherten Datei (ohne Punkt, kleingeschrieben); ohne erkennbare Endung „png“ – das ist das Speicherformat. */
export function speicherEndung(storageKey: string | null | undefined): string {
  const endung = endungVon(storageKey ?? '');
  return endung in BEKANNTE_ENDUNGEN ? (endung === 'jpeg' ? 'jpg' : endung) : 'png';
}

/** Name für den Download: Name der Kundschaft ohne ihre Endung, dafür mit der Endung des gespeicherten Formats („logo.svg“ → „logo.png“). */
export function downloadNameFuerInhalt(kundenName: string | null | undefined, storageKey: string | null | undefined): string {
  const roh = (kundenName ?? '').trim();
  const basis = roh.length > 0 ? ohneEndung(roh).trim() : '';
  return `${basis.length > 0 ? basis : 'logo'}.${speicherEndung(storageKey)}`;
}

/** Name der JPG-Fassung: wie der PNG-Name, mit Endung .jpg. */
export function jpgName(kundenName: string | null | undefined): string {
  return downloadNameFuerInhalt(kundenName, 'x.jpg');
}

/**
 * „SVG“, „JPG“ usw., wenn die Kundschaft ein ANDERES Format hochgeladen hat, als gespeichert ist – sonst null. Für die Anzeige
 * („PNG · 2,3 MB · hochgeladen als SVG“), damit klar ist, dass es sich um die umgewandelte Fassung handelt.
 */
export function hochgeladenAls(kundenName: string | null | undefined, storageKey: string | null | undefined): string | null {
  const hochgeladen = endungVon((kundenName ?? '').trim());
  if (hochgeladen === '') return null;
  const gespeichert = speicherEndung(storageKey);
  const gleich = hochgeladen === gespeichert || (hochgeladen === 'jpeg' && gespeichert === 'jpg');
  if (gleich) return null;
  return (BEKANNTE_ENDUNGEN[hochgeladen] ?? hochgeladen.toUpperCase()).toUpperCase();
}
