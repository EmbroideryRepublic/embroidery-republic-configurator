/**
 * Gibt strukturierte Daten als JSON-LD aus.
 *
 * `dangerouslySetInnerHTML` ist hier der von Next empfohlene Weg – ein
 * `<script>`-Inhalt lässt sich nicht als React-Kind setzen. Die Daten stammen
 * ausschließlich aus dem eigenen Katalog, trotzdem wird `<` maskiert: Enthielte
 * ein Feld je einmal die Zeichenfolge `</script>`, bräche es sonst aus dem
 * Element aus. Zwei Zeichen Vorsicht sind billiger als eine Lücke.
 */
export function JsonLd({ daten }: { daten: Record<string, unknown> }) {
  const json = JSON.stringify(daten).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
