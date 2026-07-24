'use client';

/**
 * Fehlergrenze für den gesamten Seitenbaum.
 *
 * Ohne sie zeigte ein Renderfehler Nexts nackte „Application error"-Seite:
 * markenfremd, ohne Erklärung und ohne Weg zurück. Diese Grenze fängt den
 * Fehler ab, bietet einen erneuten Versuch (`reset()` rendert das Segment neu)
 * und einen Ausweg in den Shop.
 *
 * Bewusst ohne technische Details für die Kundschaft – eine Fehlermeldung mit
 * Stacktrace verunsichert und verrät Interna. Die `digest`-Kennung wird
 * angezeigt, damit ein Anruf beim Support zuordenbar bleibt.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Fehlerseite({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Der Serverpfad protokolliert bereits strukturiert; hier landet nur, was
    // im Browser passiert. Ohne diese Zeile wäre der Fehler unauffindbar.
    console.error('Unbehandelter Fehler in der Oberfläche:', error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 py-20">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-light/60 text-gold-dark">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-[clamp(2rem,4.5vw,3rem)] font-normal leading-tight tracking-tight text-brand">
        Da ist etwas schiefgelaufen.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand/60">
        Der Fehler liegt bei uns, nicht bei Ihnen. Ein erneuter Versuch hilft meistens –
        andernfalls sind wir über das Kontaktformular erreichbar.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center gap-2.5 rounded-full bg-brand px-7 py-3 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-brand/90"
        >
          <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-90" aria-hidden />
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="border-b border-brand/25 pb-1 text-[14px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
        >
          Zur Startseite
        </Link>
        <Link
          href="/kontakt"
          className="border-b border-brand/25 pb-1 text-[14px] text-brand/70 transition-colors duration-300 hover:border-brand hover:text-brand"
        >
          Kontakt
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 text-[12px] text-brand/35">
          Kennung für den Support: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </main>
  );
}
