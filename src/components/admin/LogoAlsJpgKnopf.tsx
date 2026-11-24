'use client';

/**
 * „Als JPG“ für eine Kundendatei im Adminbereich.
 *
 * Gespeichert wird das Logo als PNG (siehe lib/admin/kundendateiName.ts). Die JPG-Fassung entsteht erst beim Klick, im Browser des Admins:
 * PNG laden (derselbe geschützte Download wie „Herunterladen“), auf eine weiße Fläche zeichnen, als JPG speichern. Der Server braucht dafür
 * weder einen Bilddecoder noch Arbeitsspeicher für große Bilder – ein Logo darf bis 8000 × 8000 Pixel haben, und die Umwandlung dort würde
 * die Funktion unnötig belasten.
 *
 * JPG kennt keine Transparenz: Transparente Stellen werden weiß. Für den DTF-Druck gilt deshalb das PNG; das JPG ist zum Ansehen, Weitergeben
 * und für Programme, die kein PNG annehmen.
 */
import { useState } from 'react';

/** Obergrenze der Umwandlung im Browser (Pixel). Größere Bilder bleiben als PNG herunterladbar. */
const MAX_PIXEL = 100_000_000;
const JPG_QUALITAET = 0.95;

export function LogoAlsJpgKnopf({ quelle, dateiname, klasse }: { quelle: string; dateiname: string; klasse: string }) {
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function umwandeln() {
    setLaeuft(true);
    setFehler(null);
    try {
      const antwort = await fetch(quelle, { credentials: 'same-origin' });
      if (!antwort.ok) throw new Error('Die Datei konnte nicht geladen werden.');
      const bild = await createImageBitmap(await antwort.blob());
      try {
        if (bild.width * bild.height > MAX_PIXEL) throw new Error('Das Bild ist zu groß für die Umwandlung im Browser. Bitte das PNG verwenden.');
        const leinwand = document.createElement('canvas');
        leinwand.width = bild.width;
        leinwand.height = bild.height;
        const kontext = leinwand.getContext('2d');
        if (!kontext) throw new Error('Der Browser kann das Bild nicht umwandeln.');
        kontext.fillStyle = '#ffffff';
        kontext.fillRect(0, 0, leinwand.width, leinwand.height);
        kontext.drawImage(bild, 0, 0);
        const jpg = await new Promise<Blob | null>((fertig) => leinwand.toBlob(fertig, 'image/jpeg', JPG_QUALITAET));
        if (!jpg) throw new Error('Der Browser konnte das JPG nicht erzeugen.');
        const adresse = URL.createObjectURL(jpg);
        const verweis = document.createElement('a');
        verweis.href = adresse;
        verweis.download = dateiname;
        document.body.appendChild(verweis);
        verweis.click();
        verweis.remove();
        setTimeout(() => URL.revokeObjectURL(adresse), 10_000);
      } finally {
        bild.close();
      }
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Umwandlung ist fehlgeschlagen.');
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <>
      <button type="button" onClick={umwandeln} disabled={laeuft} className={klasse} title="Transparente Stellen werden weiß">
        {laeuft ? 'Wird umgewandelt …' : 'Als JPG'}
      </button>
      {fehler && (
        <span role="alert" className="max-w-[10rem] text-center text-[11px] leading-snug text-red-700">
          {fehler}
        </span>
      )}
    </>
  );
}
