/**
 * Ladezustand des Konfigurators.
 *
 * Der Konfigurator ist die schwerste Route (Konva-Leinwand). Ohne diese Datei
 * sah der Nutzer beim ersten Aufruf kurz eine leere Fläche. Das Skeleton
 * zeichnet die spätere Grobstruktur in ruhigen Markentönen vor – das wirkt
 * wertiger und verkürzt die gefühlte Wartezeit. Rein visuell, keine Logik.
 */
export default function KonfiguratorLaden() {
  const kachel = 'animate-pulse rounded-2xl bg-brand/[0.06]';
  return (
    <div className="w-full bg-cream" aria-hidden>
      {/* Stepper-Leiste */}
      <div className="border-b border-gold/15 bg-cream/95">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 lg:px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-5 w-5 animate-pulse rounded-full bg-brand/[0.08]" />
              <span className="hidden h-3 w-24 animate-pulse rounded bg-brand/[0.06] sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Drei-Spalten-Grobstruktur */}
      <div className="mx-auto grid max-w-[1600px] gap-2 px-4 py-4 lg:grid-cols-[17rem_1fr_20rem]">
        <div className={`${kachel} h-[70vh]`} />
        <div className={`${kachel} hidden h-[70vh] lg:block`} />
        <div className={`${kachel} hidden h-[70vh] lg:block`} />
      </div>
    </div>
  );
}
