'use client';

/**
 * „Jetzt konfigurieren"-Link der Produktseite. Eigene, winzige Client-
 * Komponente statt eines Links direkt in der (Server-)Bestellkarte, weil der
 * Link die AKTUELL gewählte Farbe kennen muss (siehe ProduktFarbeContext) –
 * eine Server-Komponente kann diesen Zustand nicht lesen.
 *
 * Trägt die Farbe als `?farbe=`-Parameter in den Konfigurator weiter, damit
 * dieser dieselbe Variante öffnet, die der Kunde gerade betrachtet hat
 * (ConfiguratorPrototype.tsx wertet den Parameter aus).
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useProduktFarbe } from './ProduktFarbeContext';

export function KonfiguratorCta({
  produktId,
  className,
  children,
}: {
  produktId: string;
  className?: string;
  children: ReactNode;
}) {
  const { farbeId } = useProduktFarbe();
  return (
    <Link href={`/konfigurator?produkt=${produktId}&farbe=${farbeId}`} className={className}>
      {children}
    </Link>
  );
}
