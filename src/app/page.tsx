import { ConfiguratorPrototype } from '@/components/configurator/ConfiguratorPrototype';

/**
 * Die Startseite IST der Konfigurator – kein Unterseiten-Layout.
 * Aktuell gebunden an das Testprodukt (schwarzer Hoodie), siehe
 * src/config/products.ts. Die Produktauswahl folgt in einer späteren Phase,
 * ohne dass diese Seite oder der Konfigurator-Kern geändert werden muss.
 */
export default function ConfiguratorPage() {
  return (
    <main className="w-full bg-cream">
      <ConfiguratorPrototype />
    </main>
  );
}
