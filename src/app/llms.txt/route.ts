/**
 * /llms.txt – kurze, maschinenlesbare Übersicht für KI-Assistenten und Suchsysteme (llmstxt.org).
 * Inhalt und Begründung: lib/seo/llmsText.ts (die Route selbst darf nur Handler exportieren).
 */
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { llmsText } from '@/lib/seo/llmsText';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(llmsText(kanonischeBasisUrl()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
