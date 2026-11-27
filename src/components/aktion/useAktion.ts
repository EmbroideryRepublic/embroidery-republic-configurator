'use client';

import { useEffect, useState } from 'react';
import { aktuelleAktion, istAktionAktiv, type PreisAktion } from '@/config/aktion';

/**
 * Gilt die vom Server mitgegebene Aktion IM BROWSER noch? Der Server rendert statische Seiten mit dem Stand seiner letzten Erzeugung; läuft die
 * Aktion ab, während so eine Seite noch ausgeliefert wird, blendet der Browser sie nach dem Laden aus. Die erste Darstellung stimmt mit dem
 * Server überein (kein Hydrationsfehler, kein Sprung beim Einblenden).
 */
export function useAktionNochAktiv(aktion: PreisAktion): boolean {
  const [aktiv, setAktiv] = useState(true);
  useEffect(() => {
    setAktiv(istAktionAktiv(aktion));
  }, [aktion]);
  return aktiv;
}

/**
 * Die im Browser JETZT gültige Aktion (oder null). Erst nach dem Laden bekannt – davor null, damit Server- und Browserdarstellung gleich sind.
 * Für Stellen, die nur im Browser existieren (Warenkorb-Schublade, Konfigurator-Zusammenfassung).
 */
export function useAktuelleAktion(): PreisAktion | null {
  const [aktion, setAktion] = useState<PreisAktion | null>(null);
  useEffect(() => {
    setAktion(aktuelleAktion());
  }, []);
  return aktion;
}
