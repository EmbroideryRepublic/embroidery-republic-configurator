/**
 * Anzeigenamen der Farben nach dem Namen des Lieferanten (Textil-Großhandel, ersatzweise L-Shop).
 *
 * Warum: In der Bestellung steht der Farbname des Shops. Der Einkauf muss daraus die Farbe beim Lieferanten finden – deshalb
 * soll der Name dort, wo er vom Lieferantennamen abweicht, dem Lieferantennamen entsprechen (Beispiel: „Anthrazit“ beim
 * Zoodie JH050 ist beim Lieferanten „Charcoal (Heather)“). Einfache Übersetzungen (Weiß/White, Schwarz/Black, Rot/Red)
 * bleiben deutsch.
 *
 * Nur der ANZEIGENAME ändert sich. Die Farb-ID bleibt, damit Bildordner, Warenkorb, bestehende Bestellungen und die
 * Lieferantenzuordnung unberührt bleiben. Angewendet wird die Tabelle zentral in products/index.ts.
 *
 * Stand 2026-11-26 (Farbprüfung gegen Textil-Großhandel und L-Shop, Betreiberfreigabe).
 * Ein Wächtertest (farbnamenLieferant.test.ts) prüft, dass jede Zeile zu einer echten Farbe gehört und Namen je Produkt eindeutig bleiben.
 */
export const FARBNAMEN_LIEFERANT: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'bandc-inspire-hoodie': {
    black: 'Black Pure',
  },
  'bandc-inspire-zip-hood': {
    black: 'Black Pure',
  },
  'build-your-brand-fluffy-hoody': {
    'chocoloate-brown': 'Chocolate Brown',
  },
  'build-your-brand-heavy-hoody': {
    cobaltblue: 'Cobalt Blue',
    'chocoloate-brown': 'Chocolate Brown',
  },
  'build-your-brand-ultra-heavy-cotton-box-hoody': {
    'union-beige': 'U. Beige',
  },
  'bundc-inspire-e150-t-shirt': {
    'royal-blue': 'Royal',
  },
  'bundc-inspire-e150-t-shirt-women': {
    'royal-blue': 'Royal',
  },
  'bundc-inspire-polo-men': {
    'urban-navy': 'Navy Blue',
  },
  'bundc-inspire-polo-women': {
    'urban-navy': 'Navy Blue',
  },
  'bundc-king-hooded-sweat': {
    'royal-blue': 'Royal',
    '1f2532': 'Navy',
  },
  'bundc-unisex-polo-id-001': {
    '009149': 'Kelly Green',
  },
  'earthpositive-earth-positive-pullover-hoodie': {
    'faded-black': 'Faded Olive Black',
    'burnt-yellow-mango': 'Burnt Yellow',
    'miami-pink-purple-rose': 'Miami Pink',
  },
  'earthpositive-earth-positive-women-s-half-zip-hoodie': {
    '7e8f62': 'Sueded Bamboo Green',
  },
  'earthpositive-premium-long-sleeve-t-shirt': {
    'faded-black': 'Faded Olive Black',
  },
  'earthpositive-unisex-organic-longsleeve-t-shirt': {
    f4f4ec: 'Stone Washed White',
  },
  'fotl-iconic195-longsleeve': {
    navy: 'Deep Navy',
  },
  'fotl-iconic195-t': {
    azure: 'Azure Blue',
    royal: 'Royal Blue',
    olive: 'Classic Olive',
    sand: 'Desert Sand',
    graphite: 'Light Graphite (Solid)',
    khaki: 'Truffle',
    'solar-yellow': 'Sunflower',
  },
  'fotl-ladies-iconic195-t': {
    azure: 'Azure Blue',
    royal: 'Royal Blue',
    sand: 'Desert Sand',
    graphite: 'Light Graphite (Solid)',
    blush: 'Powder Rose',
    'solar-yellow': 'Sunflower',
    pink: 'Fuchsia',
    'very-turquoise': 'Ocean Teal',
  },
  'fotl-ladies-original-t': {
    royal: 'Royal Blue',
    pink: 'Fuchsia',
  },
  'fotl-ladies-premium-polo': {
    royal: 'Royal Blue',
  },
  'fotl-ladies-valueweight-t': {
    azure: 'Azure Blue',
    'solar-yellow': 'Sunflower',
    royal: 'Royal Blue',
    pink: 'Fuchsia',
    graphite: 'Light Graphite (Solid)',
    'lime-green': 'Lime',
  },
  'fotl-original-t': {
    'solar-yellow': 'Sunflower',
    royal: 'Royal Blue',
    graphite: 'Light Graphite (Solid)',
    azure: 'Azure Blue',
    'lime-green': 'Lime',
    pink: 'Fuchsia',
  },
  'fotl-premium-polo': {
    royal: 'Royal Blue',
  },
  'fotl-pure-cotton-t': {
    royal: 'Royal Blue',
    sand: 'Desert Sand',
    'very-turquoise': 'Ocean Teal',
  },
  'fotl-super-premium-t': {
    royal: 'Royal Blue',
    olive: 'Classic Olive',
    'dark-grey-solid': 'Light Graphite (Solid)',
  },
  'fotl-valueweight-t': {
    royal: 'Royal Blue',
    pink: 'Light Pink',
    olive: 'Classic Olive',
    graphite: 'Light Graphite (Solid)',
    'solar-yellow': 'Yellow',
    azure: 'Azure Blue',
  },
  'fotl-valueweight-vneck': {
    royal: 'Royal Blue',
    graphite: 'Light Graphite (Solid)',
    azure: 'Azure Blue',
    'solar-yellow': 'Sunflower',
  },
  'fruit-of-the-loom-iconic-250-hooded-sweat': {
    ffffff: 'White',
  },
  'gildan-hammer-maxweight-adult-hooded-sweatshirt': {
    '888b8d': 'Gravel',
    '2d2926': 'Pitch Black',
  },
  'gildan-heavy-blend-hooded-sweatshirt': {
    eead1a: 'Gold',
    '205c40': 'Fan Dark Green',
    '1c3775': 'Fan Deep Royal',
  },
  'gildan-heavy-t': {
    grey: 'Ash Grey (Heather)',
    charcoal: 'Dark Heather',
  },
  'gildan-ladies-heavy-t': {
    grey: 'Sport Grey (Heather)',
    charcoal: 'Dark Heather',
  },
  'gildan-ladies-polo': {
    grey: 'Sport Grey (Heather)',
  },
  'gildan-ladies-t': {
    grey: 'Sport Grey (Heather)',
  },
  'gildan-ladies-vneck-t': {
    grey: 'Sport Grey (Heather)',
  },
  'gildan-softstyle-midweight-sweat-adult-hoodie': {
    '393d47': 'Black (Heather)',
  },
  'gildan-softstyle-polo': {
    green: 'Forest Green',
  },
  'gildan-ultra-cotton-long-sleeve-t-shirt': {
    'safety-green-neon': 'Safety Green',
  },
  'gildan-ultra-cotton-t-shirt': {
    'safety-green-neon': 'Safety Green',
  },
  'gildan-vneck-t': {
    grey: 'Sport Grey (Heather)',
  },
  'gildan-zip-hoodie': {
    grey: 'Ash (Heather)',
  },
  'id-identity-microfleece-jacke': {
    hellblau: 'Light blue',
  },
  'jn-active-t': {
    'kelly-green': 'Green',
  },
  'just-cool-long-sleeve-cool-t': {
    'electric-yellow-neon': 'Electric Yellow',
    'electric-green-neon': 'Electric Green',
    'electric-orange-neon': 'Electric Orange',
  },
  'just-hoods-signature-heavyweight-sweat': {
    '4f758b': 'Airforce Blue',
    '4f413c': 'Espresso',
  },
  'justhoods-awdis-sweat': {
    white: 'Arctic White',
    red: 'Fire Red',
  },
  'justhoods-college-hoodie': {
    white: 'Arctic White',
    royal: 'Royal Blue',
    red: 'Fire Red',
  },
  'justhoods-zoodie': {
    royal: 'Royal Blue',
    green: 'Forest Green',
    black: 'Jet Black',
    navy: 'New French Navy',
    grey: 'Ash (Heather)',
    anthracite: 'Charcoal (Heather)',
  },
  'neutral-classic-polo': {
    grey: 'Sport Grey',
  },
  'neutral-ladies-classic-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-ladies-fit-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-ladies-long-sleeve-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-men-s-classic-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-men-s-fit-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-men-s-long-sleeve-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'neutral-oversized-t-shirt': {
    '215732': 'Bottle Green',
  },
  'neutral-rollsleeve-t': {
    grey: 'Sport Grey',
    olive: 'Military',
  },
  'neutral-unisex-regular-t-shirt': {
    'sports-grey': 'Sport Grey',
  },
  'russell-authentic-hooded-sweat': {
    ffffff: 'White',
    '8fd491': 'Eucalyptus Green',
    fac511: 'Mustard Yellow',
  },
  'russell-authentic-t': {
    navy: 'French Navy',
    red: 'Classic Red',
    royal: 'Bright Royal',
  },
  'russell-ladies-authentic-t': {
    navy: 'French Navy',
    red: 'Classic Red',
    royal: 'Bright Royal',
  },
  'russell-russell-classic-t': {
    '0062ae': 'Azure Blue',
  },
  'russell-workwear-t': {
    navy: 'French Navy',
    royal: 'Bright Royal',
    red: 'Classic Red',
  },
  'sols-imperial-t': {
    black: 'Deep Black',
  },
  'sols-men-s-long-sleeve-t-shirt-imperial': {
    'royal-blue': 'Royal Blue 241',
  },
  'sols-men-s-polo-shirt-perfect': {
    'royal-blue': 'Royal Blue 241',
  },
  'sols-men-s-polo-shirt-prime': {
    'royal-blue': 'Royal Blue 241',
  },
  'sols-mens-factor-zipped-fleece-jacket': {
    'royal-blue': 'Royal Blue 241',
  },
  'sols-north-fleece': {
    royal: 'Royal Blue 241',
    anthracite: 'Charcoal Grey (Solid)',
  },
  'sols-women-s-fleecejacket-north': {
    'royal-blue': 'Royal Blue 241',
  },
  'sols-women-s-polo-shirt-prime': {
    'royal-blue': 'Royal Blue 241',
  },
  'stedman-classic-t-for-women': {
    f7a30a: 'Gold',
    '5a6f5e': 'Military Green',
  },
  'stedman-classic-t-v-neck': {
    '747679': 'Slate Grey (Solid)',
    '1c9a2c': 'Kelly Green',
  },
  'stedman-classic-t-v-neck-for-women': {
    '747679': 'Slate Grey (Solid)',
    '1c9a2c': 'Kelly Green',
  },
  'stedman-clive-crew-neck': {
    '293e11': 'Bottle Green',
    '051733': 'Navy Blue',
  },
  'stedman-comfort-t': {
    '89163e': 'Bordeaux',
    dac9af: 'Natural',
  },
  'stedman-slimfit-t': {
    black: 'Black Opal',
    royal: 'Bright Royal',
    red: 'Scarlet Red',
  },
  'stedman-stedman-classic-t': {
    f7a30a: 'Gold',
    '5a6f5e': 'Military Green',
  },
};

/**
 * Korrektur einzelner Farbpunkte (Hex der Farbkachel), wo der feste Katalogwert nicht zum Foto passt.
 * Stand 2026-11-26: SOL'S Women's Fleece North, Lime – der Katalog trug ein fast weißes Grün (#D0DEBB), das Foto zeigt ein kräftiges Lime.
 */
export const FARBPUNKTE_KORREKTUR: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'sols-women-s-fleecejacket-north': { lime: '#94C22B' },
};

/**
 * Frühere Farbnamen, die durch die Tabelle oben ersetzt wurden. Die Zuordnungstabellen der Filter (FARBGRUPPEN) sind nach dem
 * ursprünglichen Namen geführt und werden aus den Importdaten neu erzeugt; ihre Einträge sind deshalb nicht „tot“, nur weil der
 * Anzeigename jetzt ein anderer ist (siehe facetten.test.ts).
 */
export const ERSETZTE_FARBNAMEN: readonly string[] = [
  '0062AE',
  '009149',
  '051733',
  '1C3775',
  '1C9A2C',
  '1F2532',
  '205C40',
  '215732',
  '293E11',
  '2D2926',
  '393D47',
  '4F413C',
  '4F758B',
  '5A6F5E',
  '747679',
  '7E8F62',
  '888B8D',
  '89163E',
  '8FD491',
  'Anthrazit',
  'Azure',
  'Blush',
  'Burnt Yellow (Mango)',
  'Chocoloate Brown',
  'Cobaltblue',
  'DAC9AF',
  'Dark Grey (Solid)',
  'Dunkelgrau meliert',
  'EEAD1A',
  'Electric Green (Neon)',
  'Electric Orange (Neon)',
  'Electric Yellow (Neon)',
  'F4F4EC',
  'F7A30A',
  'FAC511',
  'FFFFFF',
  'Faded Black',
  'Graphite',
  'Grau',
  'Grün',
  'Hellblau',
  'Kelly Green',
  'Khaki',
  'Lime Green',
  'Miami Pink (Purple Rose)',
  'Navy',
  'Olive',
  'Pink',
  'Rot',
  'Royal',
  'Royal Blue',
  'Safety Green (Neon)',
  'Sand',
  'Schwarz',
  'Solar Yellow',
  'Sports Grey',
  'Union Beige',
  'Urban Navy',
  'Very Turquoise',
  'Weiß',
];
