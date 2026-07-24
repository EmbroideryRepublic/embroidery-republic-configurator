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
        // Supabase Storage. Aktuell rendert keine Seite Storage-Bilder über
        // next/image; der Eintrag bleibt, weil es die eigene Infrastruktur ist
        // und die Druckvorschauen dort liegen (Admin-Anzeige ist absehbar).
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
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
