'use client';

/**
 * Geteilter Farbzustand der Produktseite.
 *
 * `ProduktFarbwahl` (Bildbereich) und `KonfiguratorCta` (Bestellkarte) sitzen
 * als GESCHWISTER unter der Server-Komponente `Produktseite` – die kann selbst
 * keinen Zustand halten. Dieser Provider ist der gemeinsame Client-Vorfahre:
 * Ohne ihn zeigte der „Jetzt konfigurieren"-Link immer die beim Laden
 * ermittelte Startfarbe, auch nachdem der Kunde auf der Seite eine andere
 * Farbe gewählt hatte – der Konfigurator öffnete dann auf der FALSCHEN Farbe.
 *
 * Startfarbe ist bewusst dieselbe Funktion auf denselben Daten wie die Kachel
 * (`repraesentativeFarbe(produktId, produkt.colors)` auf der VOLLEN Palette,
 * nicht der für die Anzeige gefilterten `waehlbareFarben()`-Liste) – nur so
 * ist rechnerisch garantiert, dass Kachel und Produktseite dieselbe Farbe
 * zeigen, ohne dass ein Zwischenzustand („erst Standardfarbe, dann Sprung zur
 * echten Farbe") sichtbar würde.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProductColorConfig } from '@/config/products/types';
import { repraesentativeFarbe } from '@/lib/assets';

interface ProduktFarbeContextValue {
  farbeId: string;
  setFarbeId: (id: string) => void;
}

const ProduktFarbeContext = createContext<ProduktFarbeContextValue | null>(null);

export function ProduktFarbeProvider({
  produktId,
  colors,
  children,
}: {
  produktId: string;
  colors: readonly ProductColorConfig[];
  children: ReactNode;
}) {
  const [farbeId, setFarbeId] = useState<string>(
    () => repraesentativeFarbe(produktId, colors)?.id ?? colors[0]?.id ?? ''
  );
  const value = useMemo(() => ({ farbeId, setFarbeId }), [farbeId]);
  return <ProduktFarbeContext.Provider value={value}>{children}</ProduktFarbeContext.Provider>;
}

/** Wirft absichtlich außerhalb des Providers – ein Aufruf ohne Provider ist
 *  ein Programmierfehler (fehlender Wrapper in page.tsx), kein Laufzeitfall. */
export function useProduktFarbe(): ProduktFarbeContextValue {
  const ctx = useContext(ProduktFarbeContext);
  if (!ctx) throw new Error('useProduktFarbe() muss innerhalb von <ProduktFarbeProvider> aufgerufen werden.');
  return ctx;
}
