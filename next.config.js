/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage – Domain nach Projekt-Setup anpassen
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Hero-Hintergrundbild (lizenzfrei, Unsplash License) – austauschbar
        // gegen eigenes Bildmaterial in src/components/layout/Hero.tsx
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
