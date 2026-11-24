'use client';

/**
 * Globaler Wirt für die Warenkorb-Schublade.
 *
 * Liegt im Wurzel-Layout und macht den Warenkorb auf ALLEN Seiten öffenbar –
 * gesteuert über den UI-Store (useUiStore), den die Kopfzeile umschaltet. So
 * kann der Kunde seinen Korb jederzeit einsehen, ohne den Bereich zu verlassen.
 *
 * Ausnahme Konfigurator: Der bringt seine EIGENE Schublade mit (v1.0, mit
 * eigener Zustandsführung). Hier wird auf `/konfigurator` deshalb nichts
 * gerendert – sonst gäbe es zwei Schubladen übereinander.
 *
 * Ladezeit: Die Schublade zieht den kompletten Produktkatalog nach sich
 * (getProduct) und war bisher in JEDER Seite fest eingebunden – auch wenn der
 * Korb nie geöffnet wird. Sie wird deshalb erst beim Öffnen nachgeladen
 * (`ladeWarenkorbSchublade`); die Kopfzeile stößt das Laden schon beim
 * Darüberfahren/Antippen des Warenkorb-Knopfes an, sodass es beim Klick
 * praktisch ohne Wartezeit aufgeht.
 */
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores/uiStore';

/** Lädt den Baustein der Schublade vor (mehrfacher Aufruf ist unschädlich). */
export function ladeWarenkorbSchublade() {
  return import('./CartDrawer');
}

const CartDrawer = dynamic(() => ladeWarenkorbSchublade().then((m) => m.CartDrawer), {
  ssr: false,
});

export function CartDrawerHost() {
  const pfad = usePathname();
  const offen = useUiStore((s) => s.warenkorbOffen);
  const schliessen = useUiStore((s) => s.schliesseWarenkorb);

  if (pfad?.startsWith('/konfigurator')) return null;
  if (!offen) return null;
  return <CartDrawer onClose={schliessen} />;
}
