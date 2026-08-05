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
 */
import { usePathname } from 'next/navigation';
import { CartDrawer } from './CartDrawer';
import { useUiStore } from '@/stores/uiStore';

export function CartDrawerHost() {
  const pfad = usePathname();
  const offen = useUiStore((s) => s.warenkorbOffen);
  const schliessen = useUiStore((s) => s.schliesseWarenkorb);

  if (pfad?.startsWith('/konfigurator')) return null;
  if (!offen) return null;
  return <CartDrawer onClose={schliessen} />;
}
