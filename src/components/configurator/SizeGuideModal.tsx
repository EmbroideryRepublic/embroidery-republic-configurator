'use client';

import { X, Ruler } from 'lucide-react';
import type { SizeGuide } from '@/config/products';

interface SizeGuideModalProps {
  productName: string;
  sizeGuide: SizeGuide;
  onClose: () => void;
}

const FIT_LABELS = ['klein', 'normal', 'groß'];

export function SizeGuideModal({ productName, sizeGuide, onClose }: SizeGuideModalProps) {
  const hasAermel = sizeGuide.measurements.some((m) => m.aermelCm !== undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-gold-dark" />
            <h2 className="font-serif text-lg font-semibold text-brand">Größenleitfaden</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 sm:grid-cols-[1fr_auto]">
          {/* Maßtabelle */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-wide text-brand/40">{productName} · Maße in cm</p>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/70 text-left text-xs uppercase tracking-wide text-brand/50">
                    <th className="px-4 py-2.5 font-medium">Größe</th>
                    <th className="px-4 py-2.5 font-medium">Breite</th>
                    <th className="px-4 py-2.5 font-medium">Höhe</th>
                    {hasAermel && <th className="px-4 py-2.5 font-medium">Ärmel</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sizeGuide.measurements.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 1 ? 'bg-cream/30' : ''}>
                      <td className="px-4 py-2.5 font-semibold text-brand">{row.size}</td>
                      <td className="px-4 py-2.5 text-brand/70">{row.breiteCm} cm</td>
                      <td className="px-4 py-2.5 text-brand/70">{row.hoeheCm} cm</td>
                      {hasAermel && (
                        <td className="px-4 py-2.5 text-brand/70">
                          {row.aermelCm !== undefined ? `${row.aermelCm} cm` : '–'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Passform-Skala */}
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-brand/40">Wie fällt der Artikel aus?</p>
              <div className="relative h-1.5 rounded-full bg-gray-100">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-gold shadow-md"
                  style={{ left: `calc(${sizeGuide.fitRating}% - 8px)` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-brand/40">
                {FIT_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Mess-Diagramm */}
          <div className="flex flex-col items-center justify-center">
            <svg width="180" height="220" viewBox="0 0 180 220" className="text-brand/70">
              {/* Vereinfachte Kleidungsstück-Silhouette */}
              <path
                d="M60 30 L45 15 L20 30 L10 55 L28 65 L35 55 L35 190 L145 190 L145 55 L152 65 L170 55 L160 30 L135 15 L120 30 Q90 45 60 30 Z"
                fill="#f8f3e9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Höhe-Pfeil */}
              <line x1="90" y1="35" x2="90" y2="185" stroke="#b8935a" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
              <text x="97" y="115" fontSize="12" fill="#8a6a3a" fontWeight="600">
                Höhe
              </text>
              {/* Breite-Pfeil */}
              <line x1="35" y1="120" x2="145" y2="120" stroke="#b8935a" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
              <text x="60" y="112" fontSize="12" fill="#8a6a3a" fontWeight="600">
                Breite
              </text>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#b8935a" />
                </marker>
              </defs>
            </svg>
            <p className="mt-2 max-w-[160px] text-center text-[11px] leading-relaxed text-brand/40">
              Breite = flach gemessen, Achsel zu Achsel × 2. Höhe = Schulternaht bis Saum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
