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
