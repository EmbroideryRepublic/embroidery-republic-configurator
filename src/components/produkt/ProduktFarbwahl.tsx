'use client';

/**
 * Bildbereich der Produktseite: Farbwahl und Ansichtswechsel.
 *
 * Bewusst der EINZIGE Client-Teil der Produktseite. Alles andere ist
 * serverseitig gerendert und damit sofort sichtbar und indexierbar; nur die
 * Bildumschaltung braucht Interaktivität.
 *
 * Zeigt dieselben vier Ansichten wie der Konfigurator, damit der Kunde vor
 * dem Konfigurieren sieht, was ihn erwartet.
 */
import { useState } from 'react';
import Image from 'next/image';
import type { PrintView } from '@/types';
import type { ProductConfig } from '@/config/products/types';
import { bildFuerAnsicht, repraesentativBildVon } from '@/lib/assets';
import { sichtbareAnsichten } from '@/lib/products/ansichten';
import { waehlbareFarben, formatiereFarbname } from '@/lib/products/farben';
import { positionLabel } from '@/config/decorationPositions';
import { useProduktFarbe } from './ProduktFarbeContext';

export function ProduktFarbwahl({ produkt }: { produkt: ProductConfig }) {
  // Nur Farben anbieten, für die ein echtes Herstellerfoto vorliegt – sonst
  // klickte der Kunde eine Farbe an und bekam die Platzhalter-Silhouette.
  const farben = waehlbareFarben(produkt.id, produkt.colors);
  // Die Startfarbe kommt aus ProduktFarbeProvider (page.tsx) – derselbe
  // Zustand, den auch die „Jetzt konfigurieren"-Karte (KonfiguratorCta)
  // liest. So bleiben Bild, Farbwahl und Konfigurator-Link zwangsläufig
  // synchron, auch nachdem der Kunde hier eine andere Farbe gewählt hat.
  const { farbeId, setFarbeId } = useProduktFarbe();
  const farbeIndexRoh = farben.findIndex((c) => c.id === farbeId);
  const farbIndex = farbeIndexRoh === -1 ? 0 : farbeIndexRoh;
  const farbe = farben[farbIndex] ?? farben[0];
  // Nur Ansichten mit eigenem Bild anbieten (Ärmel sind nicht überall
  // fotografiert) – sonst zeigte „Ärmel links" schlicht die Vorderansicht.
  const ansichten = sichtbareAnsichten(produkt, farbe?.id);
  const [ansicht, setAnsicht] = useState<PrintView>(ansichten[0] ?? 'front');

  if (!farbe) return null;
  // Nach einem Farbwechsel kann die gewählte Ansicht wegfallen (z.B. Ärmelfoto
  // nur bei manchen Farben) – dann die erste zeigbare rendern.
  const aktiveAnsicht = ansichten.includes(ansicht) ? ansicht : (ansichten[0] ?? 'front');

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand/[0.08] bg-white">
        <Image
          // Prüfanker wie `data-preis` an der Kachel: Die Sichtprüfung muss das
          // Produktbild eindeutig greifen können – über `img[alt]` erwischte sie
          // das Seitenlogo. Diktiert die Gestaltung nicht.
          data-produktbild={`${farbe.id}/${aktiveAnsicht}`}
          src={bildFuerAnsicht(produkt.id, farbe.id, aktiveAnsicht) ?? repraesentativBildVon(produkt.id, farbe.id)}
          alt={`${produkt.name} in ${formatiereFarbname(farbe.name)}, ${positionLabel(aktiveAnsicht)}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6"
          priority
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ansichten.map((view) => (
          <button
            key={view}
            type="button"
            data-ansicht={view}
            onClick={() => setAnsicht(view)}
            aria-pressed={aktiveAnsicht === view}
            className={`rounded-full border px-3 py-2 text-xs transition ${
              aktiveAnsicht === view
                ? 'border-brand bg-brand text-white'
                : 'border-brand/15 bg-white text-brand/60 hover:border-gold/50 hover:text-brand'
            }`}
          >
            {positionLabel(view)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-brand">
          Farbe: <span className="font-normal text-brand/70">{formatiereFarbname(farbe.name)}</span>
        </p>
        <p className="mt-0.5 text-xs text-brand/50">{farben.length} Farben verfügbar</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {farben.map((c, i) => (
            <button
              key={c.id}
              type="button"
              data-farbe={c.id}
              onClick={() => setFarbeId(c.id)}
              title={formatiereFarbname(c.name)}
              aria-label={`Farbe ${formatiereFarbname(c.name)}`}
              aria-pressed={i === farbIndex}
              style={{ backgroundColor: c.hex }}
              className={`h-11 w-11 rounded-full border transition ${
                i === farbIndex
                  ? 'border-white ring-2 ring-gold ring-offset-1'
                  : 'border-black/10 hover:ring-2 hover:ring-gold/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
