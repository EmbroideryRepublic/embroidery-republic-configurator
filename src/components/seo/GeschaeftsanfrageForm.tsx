'use client';

/**
 * Geschäftsanfrage auf /geschaeftskunden: das Kontaktformular, vorbelegt mit Betreff und Vorlage (config/seo/geschaeftsanfrage.ts).
 * Die Kennung aus dem QR-Code (`?ref=B2B-0011`) wird nach dem Laden gelesen; die Seite selbst bleibt statisch erzeugt.
 */
import { useEffect, useState } from 'react';
import { ContactForm } from '@/components/contact/ContactForm';
import { GESCHAEFTSANFRAGE_BETREFF, geschaeftsanfrageText, istGueltigeKennung } from '@/config/seo/geschaeftsanfrage';

export function GeschaeftsanfrageForm() {
  const [kennung, setKennung] = useState<string | null>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (istGueltigeKennung(ref)) setKennung(ref);
  }, []);
  // key: Mit der Kennung wird das Formular neu aufgebaut, damit die Vorlage sie enthält.
  return <ContactForm key={kennung ?? 'ohne'} vorbelegung={{ subject: GESCHAEFTSANFRAGE_BETREFF, message: geschaeftsanfrageText(kennung) }} />;
}
