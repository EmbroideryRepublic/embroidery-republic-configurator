/**
 * Ladezustand der Katalogübersicht.
 *
 * `/produkt` wird serverseitig gefiltert (force-dynamic). Ohne diese Datei
 * blitzte beim Filtern/Navigieren kurz eine leere Fläche auf. Das Skeleton
 * zeichnet Titel, Filterzeile und Kartenraster in ruhigen Markentönen vor –
 * das wirkt wertiger und verkürzt die gefühlte Wartezeit. Rein visuell.
 */
export default function KatalogLaden() {
  const block = 'animate-pulse rounded-full bg-brand/[0.06]';
  return (
    <main className="min-h-screen bg-brand-light" aria-hidden>
      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-12 sm:px-8">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-brand/[0.06]" />
        <div className={`mt-3 h-4 w-80 max-w-full ${block}`} />

        {/* Filter-Chip-Zeile */}
        <div className="mt-10 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-brand/[0.06]" />
          ))}
        </div>

        {/* Kartenraster */}
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-brand/[0.06]" />
              <div className={`mt-5 h-3 w-20 ${block}`} />
              <div className={`mt-2 h-4 w-40 max-w-full ${block}`} />
              <div className={`mt-3 h-4 w-16 ${block}`} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
