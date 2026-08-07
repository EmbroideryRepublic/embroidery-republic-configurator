/**
 * Bestätigt eine neu erteilte Newsletter-Einwilligung (bei Registrierung
 * oder später im Profil aktiviert – siehe lib/actions/konto.ts). Einfaches
 * Opt-in, kein Double-Opt-in mit Bestätigungslink: Es gibt (noch) keine
 * eigene Kampagnenversand-Infrastruktur, nur die Einwilligung selbst
 * (customer_profiles.newsletter_opt_in, Migration 0023). Rechtlich zulässig
 * (Double-Opt-in ist die EMPFOHLENE, nicht die einzig zulässige Praxis),
 * mit jederzeit einfachem Widerruf über das Profil – siehe Text unten.
 */
import { Text } from '@react-email/components';
import { basisUrl } from '@/lib/seo/basisUrl';
import { COLORS, EmailLayout } from './EmailLayout';

export function NewsletterOptInEmail(_props: Record<string, never>) {
  const title = 'Newsletter-Anmeldung bestätigt';
  return (
    <EmailLayout previewText={title} title={title}>
      <Text style={{ margin: 0 }}>
        Sie erhalten ab sofort gelegentlich Neuigkeiten und Angebote von Embroidery Republic per E-Mail.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12, color: COLORS.muted }}>
        Sie können die Newsletter-Einwilligung jederzeit widerrufen – öffnen Sie dazu einfach{' '}
        <a href={`${basisUrl()}/konto/profil`} style={{ color: COLORS.gold }}>
          Ihr Profil
        </a>{' '}
        und deaktivieren die entsprechende Option.
      </Text>
    </EmailLayout>
  );
}
