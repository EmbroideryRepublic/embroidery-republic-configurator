'use client';

/**
 * Letzte Fehlergrenze – greift, wenn das Wurzel-Layout selbst bricht.
 *
 * In diesem Fall ersetzt Next das gesamte Dokument, deshalb müssen `<html>`
 * und `<body>` hier selbst geliefert werden und es steht kein Layout (und
 * damit weder Kopfzeile noch Fußzeile) zur Verfügung.
 *
 * Bewusst genügsam gehalten: Da nicht garantiert ist, dass in dieser Lage
 * jedes Stylesheet geladen wurde, tragen die wenigen Elemente zusätzlich
 * Inline-Stile. Eine unlesbare Fehlerseite wäre der schlechteste Abschluss.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, background: '#faf7f2', color: '#141210', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: '36rem', margin: '0 auto', padding: '5rem 1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
            Die Seite konnte nicht geladen werden.
          </h1>
          <p style={{ marginTop: '1rem', lineHeight: 1.6, color: 'rgba(20,18,16,0.65)' }}>
            Bitte laden Sie die Seite neu. Besteht das Problem weiter, erreichen Sie uns
            unter <a href="/kontakt" style={{ color: '#b93a0a' }}>Kontakt</a>.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem', padding: '0.75rem 1.75rem', borderRadius: '9999px',
              border: 'none', background: '#141210', color: '#fff', fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
          {error.digest && (
            <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'rgba(20,18,16,0.4)' }}>
              Kennung für den Support: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
