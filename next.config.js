/** @type {import('next').NextConfig} */
const nextConfig = {
  // Verrät sonst per `X-Powered-By: Next.js`, womit gearbeitet wird – eine
  // unnötige Information für jeden, der nach passenden Angriffen sucht.
  poweredByHeader: false,
  experimental: {
    // Standardlimit (1 MB) reicht nicht: Logo-Dateien kommen als Data-URLs
    // (LogoElement.fileUrl/originalFileUrl) direkt als Server-Action-
    // Argument mit (submitOrder/submitInquiry, src/lib/actions/orders.ts).
    serverActions: {
      bodySizeLimit: '15mb',
    },
    // @resvg/resvg-js (Druckvorschau-Rendering, src/lib/rendering/) bringt
    // eine native .node-Binärdatei mit, die Webpack nicht bundeln kann
    // ("Unexpected character" beim Build). Als externes Server-Paket
    // markiert, lädt Next es stattdessen zur Laufzeit ganz normal per
    // require() – korrekt sowohl für den Dev-Server als auch für den
    // eigentlichen Produktions-Build.
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
    // Schriftdateien fürs serverseitige Rendern (Druckvorschau, Text-Download,
    // src/lib/rendering/fonts.ts): Sie werden zur Laufzeit per Dateipfad gelesen
    // und von Next nur für Routen mitgepackt, die das Rendern DIREKT einbinden
    // (Webhook, Cron, Download-Routen). Der Knopf "Vorschau & Produktionsblatt neu
    // erzeugen" ist aber eine Server-Action der SEITE /admin/bestellung/[id] –
    // dort fehlten die Schriften (nur 24 statt rund 12.000 Dateien im Paket), und
    // resvg lässt Text ohne passende Schrift stillschweigend weg: die neu erzeugte
    // Vorschau zeigte die Rückseite ohne Text (2026-11-08, ER-2026-F5EE03).
    // Die Produktbilder brauchen das nicht, sie werden notfalls per HTTP geholt
    // (garmentImageInfo.ts). Die Schriften sind klein (rund 3 MB).
    outputFileTracingIncludes: {
      '/admin/bestellung/\\[id\\]': ['./src/lib/rendering/assets/fonts/**/*'],
    },
  },
  // Basis-Sicherheitsheader (Produktion). Bewusst OHNE Content-Security-Policy:
  // eine CSP muss gegen Konva/Canvas, data:-Logo-URLs und Supabase getestet
  // werden (sonst bricht der Konfigurator) – als eigener, getesteter Schritt
  // nachziehen. Die folgenden Header sind funktional risikofrei.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Produktfotos, Marken- und Bühnenbilder (public/products, /brand, /buehne).
      // Vercel liefert Dateien aus public/ standardmäßig mit
      // `max-age=0, must-revalidate`: Jeder Seitenaufruf schickte für JEDES Foto
      // eine Rückfrage an den Server (Katalogseite: ein Foto je Karte, Konfigurator:
      // vier Ansichten plus Farbwechsel), auch wenn sich nichts geändert hatte.
      // Zehn Minuten Zwischenspeicher sparen diese Rückfragen beim Blättern durch
      // Katalog, Produktseite und Konfigurator; die Dateinamen sind nicht
      // versioniert und Fotos werden gelegentlich korrigiert (Druckflächen hängen
      // an den Bildkoordinaten), deshalb bewusst KEIN langer/immutable-Wert und
      // danach höchstens eine Stunde „veraltet, aber sofort" mit Aktualisierung im
      // Hintergrund. Die Fassung mit gleichem Namen ist also spätestens nach einer
      // Stunde überall ersetzt.
      {
        source: '/:ordner(products|brand|buehne)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=600, stale-while-revalidate=3600' }],
      },
      // Die technischen Vercel-Adressen (ergermany.vercel.app, die Branch- und
      // Vorschau-Adressen) liefern denselben Shop aus wie die echte Domain.
      // Ohne diese Zeile könnte Google dieselben Seiten ein zweites Mal unter
      // fremder Adresse indexieren (Duplicate Content, verwässerte Signale).
      // `X-Robots-Tag` gilt auch für Bilder/PDFs, anders als ein Meta-Tag.
      // Betrifft NUR *.vercel.app – nicht www.ergermany.de / ergermany.de.
      {
        source: '/:path*',
        has: [{ type: 'host', value: '.*\\.vercel\\.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  images: {
    // Jede Freigabe erlaubt es, fremde Bilder über den eigenen Optimierer zu
    // leiten – deshalb bewusst knapp halten. Der Produktkatalog liegt lokal
    // unter public/ und braucht hier keinen Eintrag.
    //
    // Entfernt (2026-07-23): `images.unsplash.com`. Der Eintrag verwies auf ein
    // Hero-Hintergrundbild in `src/components/layout/Hero.tsx` – diese Datei
    // existiert nicht mehr, und im gesamten Quelltext wird kein Unsplash-Bild
    // verwendet. Eine Freigabe für einen fremden Host ohne jeden Nutzen.
    remotePatterns: [
      {
        // Supabase Storage, öffentlicher Bucket (Produktkatalog-Assets u.Ä.).
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase Storage, SIGNIERTE URLs auf den privaten "production-files"-
        // Bucket – anderer Pfad als oben ("sign" statt "public"). Genutzt von
        // der Admin-Produktionsvorschau (ProductionPreview.tsx), die die in
        // Phase 2 gerenderten Druckvorschauen und Logo-Dateien anzeigt.
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
      // NUR außerhalb der Produktion: Gegenstück zum Eintrag oben für den
      // Testmodus (Fund vom 2026-08-31) – getProductionFileSignedUrl()
      // liefert dort statt einer Supabase-Signed-URL eine lokale URL auf
      // /api/testablage/[...path] (lib/supabase/storage.ts), damit die
      // Admin-Produktionsvorschau auch im Testmodus echt rendert statt mit
      // "Invalid src prop" abzustürzen. `NODE_ENV==='production'` schließt
      // das in jedem echten Produktionsbuild wieder aus.
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'http', hostname: 'localhost', pathname: '/api/testablage/**' }]
        : []),
    ],
  },
  webpack: (config) => {
    // Konva prüft intern, ob es serverseitig (Node.js) läuft, und enthält
    // dafür einen bedingten `require('canvas')` für optionales Node-Canvas-
    // Rendering. Webpack versucht diesen Import beim Build statisch
    // aufzulösen – auch wenn der Code dank `next/dynamic({ ssr: false })`
    // nie serverseitig ausgeführt wird. Das Node-Paket `canvas` ist eine
    // native Abhängigkeit, die hier nicht installiert ist und für eine
    // reine Browser-Anwendung auch nicht installiert werden soll.
    // Diese Alias-Regel weist Webpack an, den Import zu ignorieren.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
