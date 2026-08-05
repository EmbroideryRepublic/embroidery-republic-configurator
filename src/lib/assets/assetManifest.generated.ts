/**
 * AUTO-GENERIERT von scripts/generateAssetManifest.mts – NICHT von Hand ändern.
 *
 * Asset-Manifest (ADR 0004): die einzige Wahrheit über Bildpfade je
 * (productId, colorId, view) + Status. Von der Asset-Schicht (src/lib/assets)
 * gelesen; die Produktdefinition kennt keine Pfade mehr. Quelle sind die
 * tatsächlichen Dateien unter public/products/ – erneut ausführen nach Bildimport.
 */
export type AssetManifestEintrag = { views: Record<string, string>; status: 'real' | 'placeholder' };
export const ASSET_MANIFEST: Record<string, Record<string, AssetManifestEintrag>> = {
  "fotl-heavy-t": {
    "white": {
      "views": {
        "front": "/products/fotl-heavy-t/front.webp",
        "back": "/products/fotl-heavy-t/back.webp",
        "sleeve_left": "/products/fotl-heavy-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-heavy-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-heavy-t-navy/front.webp",
        "back": "/products/fotl-heavy-t-navy/back.webp",
        "sleeve_left": "/products/fotl-heavy-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-heavy-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-heavy-t-black/front.webp",
        "back": "/products/fotl-heavy-t-black/back.webp",
        "sleeve_left": "/products/fotl-heavy-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-heavy-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-heavy-t-heather-grey/front.webp",
        "back": "/products/fotl-heavy-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-heavy-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-heavy-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-ladies-valueweight-vneck": {
    "black": {
      "views": {
        "front": "/products/fotl-ladies-vneck/front.webp",
        "back": "/products/fotl-ladies-vneck/back.webp",
        "sleeve_left": "/products/fotl-ladies-vneck/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-vneck/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-ladies-vneck-white/front.webp",
        "back": "/products/fotl-ladies-vneck-white/back.webp",
        "sleeve_left": "/products/fotl-ladies-vneck-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-vneck-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-ladies-vneck-heather-grey/front.webp",
        "back": "/products/fotl-ladies-vneck-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-ladies-vneck-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-vneck-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-original-longsleeve": {
    "black": {
      "views": {
        "front": "/products/fotl-original-longsleeve/front.webp",
        "back": "/products/fotl-original-longsleeve/back.webp",
        "sleeve_left": "/products/fotl-original-longsleeve/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-longsleeve/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-original-longsleeve-white/front.webp",
        "back": "/products/fotl-original-longsleeve-white/back.webp",
        "sleeve_left": "/products/fotl-original-longsleeve-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-longsleeve-white/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-original-vneck": {
    "black": {
      "views": {
        "front": "/products/fotl-original-vneck/front.webp",
        "back": "/products/fotl-original-vneck/back.webp",
        "sleeve_left": "/products/fotl-original-vneck/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-vneck/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-original-vneck-white/front.webp",
        "back": "/products/fotl-original-vneck-white/back.webp",
        "sleeve_left": "/products/fotl-original-vneck-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-vneck-white/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-ladies-original-t": {
    "white": {
      "views": {
        "front": "/products/fotl-ladies-original-t/front.webp",
        "back": "/products/fotl-ladies-original-t/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-ladies-original-t-black/front.webp",
        "back": "/products/fotl-ladies-original-t-black/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-ladies-original-t-red/front.webp",
        "back": "/products/fotl-ladies-original-t-red/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-ladies-original-t-royal/front.webp",
        "back": "/products/fotl-ladies-original-t-royal/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/fotl-ladies-original-t-pink/front.webp",
        "back": "/products/fotl-ladies-original-t-pink/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t-pink/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-ladies-original-t-heather-grey/front.webp",
        "back": "/products/fotl-ladies-original-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-ladies-original-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-original-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-iconic195-longsleeve": {
    "black": {
      "views": {
        "front": "/products/fotl-iconic195-longsleeve/front.webp",
        "back": "/products/fotl-iconic195-longsleeve/back.webp",
        "sleeve_left": "/products/fotl-iconic195-longsleeve/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-longsleeve/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-iconic195-longsleeve-white/front.webp",
        "back": "/products/fotl-iconic195-longsleeve-white/back.webp",
        "sleeve_left": "/products/fotl-iconic195-longsleeve-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-longsleeve-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-iconic195-longsleeve-red/front.webp",
        "back": "/products/fotl-iconic195-longsleeve-red/back.webp",
        "sleeve_left": "/products/fotl-iconic195-longsleeve-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-longsleeve-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-iconic195-longsleeve-heather-grey/front.webp",
        "back": "/products/fotl-iconic195-longsleeve-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-iconic195-longsleeve-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-longsleeve-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-iconic195-longsleeve-navy/front.webp",
        "back": "/products/fotl-iconic195-longsleeve-navy/back.webp",
        "sleeve_left": "/products/fotl-iconic195-longsleeve-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-longsleeve-navy/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-pure-cotton-t": {
    "black": {
      "views": {
        "front": "/products/fotl-pure-cotton-t/front.webp",
        "back": "/products/fotl-pure-cotton-t/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-white/front.webp",
        "back": "/products/fotl-pure-cotton-t-white/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-red/front.webp",
        "back": "/products/fotl-pure-cotton-t-red/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-royal/front.webp",
        "back": "/products/fotl-pure-cotton-t-royal/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-sage/front.webp",
        "back": "/products/fotl-pure-cotton-t-sage/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-sage/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-sage/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-navy/front.webp",
        "back": "/products/fotl-pure-cotton-t-navy/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-sand/front.webp",
        "back": "/products/fotl-pure-cotton-t-sand/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-sand/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-sand/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-grey/front.webp",
        "back": "/products/fotl-pure-cotton-t-grey/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-petrol/front.webp",
        "back": "/products/fotl-pure-cotton-t-petrol/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-petrol/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-petrol/sleeve-right.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-sky-blue/front.webp",
        "back": "/products/fotl-pure-cotton-t-sky-blue/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-sky-blue/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-sky-blue/sleeve-right.webp"
      },
      "status": "real"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/fotl-pure-cotton-t-very-turquoise/front.webp",
        "back": "/products/fotl-pure-cotton-t-very-turquoise/back.webp",
        "sleeve_left": "/products/fotl-pure-cotton-t-very-turquoise/sleeve-left.webp",
        "sleeve_right": "/products/fotl-pure-cotton-t-very-turquoise/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-super-premium-t": {
    "navy": {
      "views": {
        "front": "/products/fotl-super-premium-t/front.webp",
        "back": "/products/fotl-super-premium-t/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-super-premium-t-black/front.webp",
        "back": "/products/fotl-super-premium-t-black/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-super-premium-t-bottle-green/front.webp",
        "back": "/products/fotl-super-premium-t-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-super-premium-t-red/front.webp",
        "back": "/products/fotl-super-premium-t-red/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-super-premium-t-royal/front.webp",
        "back": "/products/fotl-super-premium-t-royal/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/fotl-super-premium-t-olive/front.webp",
        "back": "/products/fotl-super-premium-t-olive/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-olive/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-olive/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-super-premium-t-heather-grey/front.webp",
        "back": "/products/fotl-super-premium-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-super-premium-t-graphite/front.webp",
        "back": "/products/fotl-super-premium-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/fotl-super-premium-t-dark-grey-solid/front.webp",
        "back": "/products/fotl-super-premium-t-dark-grey-solid/back.webp",
        "sleeve_left": "/products/fotl-super-premium-t-dark-grey-solid/sleeve-left.webp",
        "sleeve_right": "/products/fotl-super-premium-t-dark-grey-solid/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-valueweight-t": {
    "white": {
      "views": {
        "front": "/products/fotl-valueweight-t/front.webp",
        "back": "/products/fotl-valueweight-t/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-valueweight-t-navy/front.webp",
        "back": "/products/fotl-valueweight-t-navy/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-valueweight-t-bottle-green/front.webp",
        "back": "/products/fotl-valueweight-t-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-valueweight-t-red/front.webp",
        "back": "/products/fotl-valueweight-t-red/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-valueweight-t-burgundy/front.webp",
        "back": "/products/fotl-valueweight-t-burgundy/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-valueweight-t-royal/front.webp",
        "back": "/products/fotl-valueweight-t-royal/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/fotl-valueweight-t-pink/front.webp",
        "back": "/products/fotl-valueweight-t-pink/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-pink/sleeve-right.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/fotl-valueweight-t-olive/front.webp",
        "back": "/products/fotl-valueweight-t-olive/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-olive/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-olive/sleeve-right.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/fotl-valueweight-t-natural/front.webp",
        "back": "/products/fotl-valueweight-t-natural/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-natural/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-natural/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-valueweight-t-heather-grey/front.webp",
        "back": "/products/fotl-valueweight-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-valueweight-t-graphite/front.webp",
        "back": "/products/fotl-valueweight-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-valueweight-t-solar-yellow/front.webp",
        "back": "/products/fotl-valueweight-t-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "azure": {
      "views": {
        "front": "/products/fotl-valueweight-t-azure/front.webp",
        "back": "/products/fotl-valueweight-t-azure/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-azure/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-azure/sleeve-right.webp"
      },
      "status": "real"
    },
    "brick-red": {
      "views": {
        "front": "/products/fotl-valueweight-t-brick-red/front.webp",
        "back": "/products/fotl-valueweight-t-brick-red/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-brick-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-brick-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "chocolate": {
      "views": {
        "front": "/products/fotl-valueweight-t-chocolate/front.webp",
        "back": "/products/fotl-valueweight-t-chocolate/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-chocolate/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-chocolate/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-royal": {
      "views": {
        "front": "/products/fotl-valueweight-t-heather-royal/front.webp",
        "back": "/products/fotl-valueweight-t-heather-royal/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-heather-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-heather-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/fotl-valueweight-t-purple/front.webp",
        "back": "/products/fotl-valueweight-t-purple/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-purple/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-purple/sleeve-right.webp"
      },
      "status": "real"
    },
    "sunflower": {
      "views": {
        "front": "/products/fotl-valueweight-t-sunflower/front.webp",
        "back": "/products/fotl-valueweight-t-sunflower/back.webp",
        "sleeve_left": "/products/fotl-valueweight-t-sunflower/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-t-sunflower/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-valueweight-vneck": {
    "white": {
      "views": {
        "front": "/products/fotl-valueweight-vneck/front.webp",
        "back": "/products/fotl-valueweight-vneck/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-navy/front.webp",
        "back": "/products/fotl-valueweight-vneck-navy/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-solar-yellow/front.webp",
        "back": "/products/fotl-valueweight-vneck-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-black/front.webp",
        "back": "/products/fotl-valueweight-vneck-black/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-red/front.webp",
        "back": "/products/fotl-valueweight-vneck-red/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-orange/front.webp",
        "back": "/products/fotl-valueweight-vneck-orange/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-orange/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-orange/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-royal/front.webp",
        "back": "/products/fotl-valueweight-vneck-royal/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-heather-grey/front.webp",
        "back": "/products/fotl-valueweight-vneck-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-deep-navy/front.webp",
        "back": "/products/fotl-valueweight-vneck-deep-navy/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-deep-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-deep-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-graphite/front.webp",
        "back": "/products/fotl-valueweight-vneck-graphite/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "azure": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-azure/front.webp",
        "back": "/products/fotl-valueweight-vneck-azure/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-azure/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-azure/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-charcoal": {
      "views": {
        "front": "/products/fotl-valueweight-vneck-heather-charcoal/front.webp",
        "back": "/products/fotl-valueweight-vneck-heather-charcoal/back.webp",
        "sleeve_left": "/products/fotl-valueweight-vneck-heather-charcoal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-valueweight-vneck-heather-charcoal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-iconic195-t": {
    "azure": {
      "views": {
        "front": "/products/fotl-iconic195-t/front.webp",
        "back": "/products/fotl-iconic195-t/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-iconic195-t-white/front.webp",
        "back": "/products/fotl-iconic195-t-white/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-iconic195-t-navy/front.webp",
        "back": "/products/fotl-iconic195-t-navy/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-iconic195-t-solar-yellow/front.webp",
        "back": "/products/fotl-iconic195-t-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-iconic195-t-black/front.webp",
        "back": "/products/fotl-iconic195-t-black/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-iconic195-t-bottle-green/front.webp",
        "back": "/products/fotl-iconic195-t-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-iconic195-t-red/front.webp",
        "back": "/products/fotl-iconic195-t-red/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-iconic195-t-burgundy/front.webp",
        "back": "/products/fotl-iconic195-t-burgundy/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/fotl-iconic195-t-sage/front.webp",
        "back": "/products/fotl-iconic195-t-sage/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-sage/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-sage/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-iconic195-t-royal/front.webp",
        "back": "/products/fotl-iconic195-t-royal/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/fotl-iconic195-t-olive/front.webp",
        "back": "/products/fotl-iconic195-t-olive/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-olive/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-olive/sleeve-right.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/fotl-iconic195-t-natural/front.webp",
        "back": "/products/fotl-iconic195-t-natural/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-natural/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-natural/sleeve-right.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fotl-iconic195-t-deep-navy/front.webp",
        "back": "/products/fotl-iconic195-t-deep-navy/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-deep-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-deep-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "cranberry": {
      "views": {
        "front": "/products/fotl-iconic195-t-cranberry/front.webp",
        "back": "/products/fotl-iconic195-t-cranberry/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-cranberry/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-cranberry/sleeve-right.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/fotl-iconic195-t-sand/front.webp",
        "back": "/products/fotl-iconic195-t-sand/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-sand/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-sand/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-iconic195-t-graphite/front.webp",
        "back": "/products/fotl-iconic195-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-iconic195-t-heather-grey/front.webp",
        "back": "/products/fotl-iconic195-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/fotl-iconic195-t-khaki/front.webp",
        "back": "/products/fotl-iconic195-t-khaki/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-khaki/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-khaki/sleeve-right.webp"
      },
      "status": "real"
    },
    "powder-blue": {
      "views": {
        "front": "/products/fotl-iconic195-t-powder-blue/front.webp",
        "back": "/products/fotl-iconic195-t-powder-blue/back.webp",
        "sleeve_left": "/products/fotl-iconic195-t-powder-blue/sleeve-left.webp",
        "sleeve_right": "/products/fotl-iconic195-t-powder-blue/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-ladies-iconic195-t": {
    "azure": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t/front.webp",
        "back": "/products/fotl-ladies-iconic195-t/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-navy/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-navy/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-solar-yellow/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-black/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-black/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-red/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-red/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-royal/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-royal/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-burgundy/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-burgundy/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-pink/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-pink/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-pink/sleeve-right.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-natural/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-natural/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-natural/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-natural/sleeve-right.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-deep-navy/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-deep-navy/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-deep-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-deep-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "cranberry": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-cranberry/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-cranberry/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-cranberry/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-cranberry/sleeve-right.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-sand/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-sand/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-sand/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-sand/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-graphite/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-white/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-white/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "blush": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-blush/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-blush/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-blush/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-blush/sleeve-right.webp"
      },
      "status": "real"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-millennial-lilac/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-millennial-lilac/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-millennial-lilac/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-millennial-lilac/sleeve-right.webp"
      },
      "status": "real"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/fotl-ladies-iconic195-t-very-turquoise/front.webp",
        "back": "/products/fotl-ladies-iconic195-t-very-turquoise/back.webp",
        "sleeve_left": "/products/fotl-ladies-iconic195-t-very-turquoise/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-iconic195-t-very-turquoise/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-original-t": {
    "white": {
      "views": {
        "front": "/products/fotl-original-t/front.webp",
        "back": "/products/fotl-original-t/back.webp",
        "sleeve_left": "/products/fotl-original-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-original-t-navy/front.webp",
        "back": "/products/fotl-original-t-navy/back.webp",
        "sleeve_left": "/products/fotl-original-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-original-t-solar-yellow/front.webp",
        "back": "/products/fotl-original-t-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-original-t-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fotl-original-t-black/front.webp",
        "back": "/products/fotl-original-t-black/back.webp",
        "sleeve_left": "/products/fotl-original-t-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-original-t-bottle-green/front.webp",
        "back": "/products/fotl-original-t-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-original-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-original-t-red/front.webp",
        "back": "/products/fotl-original-t-red/back.webp",
        "sleeve_left": "/products/fotl-original-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-original-t-burgundy/front.webp",
        "back": "/products/fotl-original-t-burgundy/back.webp",
        "sleeve_left": "/products/fotl-original-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/fotl-original-t-orange/front.webp",
        "back": "/products/fotl-original-t-orange/back.webp",
        "sleeve_left": "/products/fotl-original-t-orange/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-orange/sleeve-right.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/fotl-original-t-kelly-green/front.webp",
        "back": "/products/fotl-original-t-kelly-green/back.webp",
        "sleeve_left": "/products/fotl-original-t-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-kelly-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-original-t-royal/front.webp",
        "back": "/products/fotl-original-t-royal/back.webp",
        "sleeve_left": "/products/fotl-original-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/fotl-original-t-pink/front.webp",
        "back": "/products/fotl-original-t-pink/back.webp",
        "sleeve_left": "/products/fotl-original-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-pink/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fotl-original-t-heather-grey/front.webp",
        "back": "/products/fotl-original-t-heather-grey/back.webp",
        "sleeve_left": "/products/fotl-original-t-heather-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-heather-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fotl-original-t-deep-navy/front.webp",
        "back": "/products/fotl-original-t-deep-navy/back.webp",
        "sleeve_left": "/products/fotl-original-t-deep-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-deep-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "cranberry": {
      "views": {
        "front": "/products/fotl-original-t-cranberry/front.webp",
        "back": "/products/fotl-original-t-cranberry/back.webp",
        "sleeve_left": "/products/fotl-original-t-cranberry/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-cranberry/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-original-t-graphite/front.webp",
        "back": "/products/fotl-original-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-original-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/fotl-original-t-yellow/front.webp",
        "back": "/products/fotl-original-t-yellow/back.webp",
        "sleeve_left": "/products/fotl-original-t-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "azure": {
      "views": {
        "front": "/products/fotl-original-t-azure/front.webp",
        "back": "/products/fotl-original-t-azure/back.webp",
        "sleeve_left": "/products/fotl-original-t-azure/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-azure/sleeve-right.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/fotl-original-t-lime-green/front.webp",
        "back": "/products/fotl-original-t-lime-green/back.webp",
        "sleeve_left": "/products/fotl-original-t-lime-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-lime-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/fotl-original-t-sky-blue/front.webp",
        "back": "/products/fotl-original-t-sky-blue/back.webp",
        "sleeve_left": "/products/fotl-original-t-sky-blue/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-sky-blue/sleeve-right.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/fotl-original-t-urban-khaki/front.webp",
        "back": "/products/fotl-original-t-urban-khaki/back.webp",
        "sleeve_left": "/products/fotl-original-t-urban-khaki/sleeve-left.webp",
        "sleeve_right": "/products/fotl-original-t-urban-khaki/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-ladies-valueweight-t": {
    "azure": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t/front.webp",
        "back": "/products/fotl-ladies-valueweight-t/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-navy/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-navy/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-solar-yellow/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-solar-yellow/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-solar-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-solar-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-bottle-green/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-red/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-red/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-burgundy/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-burgundy/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-orange/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-orange/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-orange/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-orange/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-royal/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-royal/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-pink/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-pink/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-pink/sleeve-right.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-deep-navy/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-deep-navy/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-deep-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-deep-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-graphite/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-graphite/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-yellow/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-yellow/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-yellow/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "cranberry": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-cranberry/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-cranberry/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-cranberry/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-cranberry/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-white/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-white/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "blush": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-blush/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-blush/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-blush/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-blush/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-charcoal": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-heather-charcoal/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-heather-charcoal/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-heather-charcoal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-heather-charcoal/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-purple": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-heather-purple/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-heather-purple/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-heather-purple/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-heather-purple/sleeve-right.webp"
      },
      "status": "real"
    },
    "heather-royal": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-heather-royal/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-heather-royal/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-heather-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-heather-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-lime-green/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-lime-green/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-lime-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-lime-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/fotl-ladies-valueweight-t-purple/front.webp",
        "back": "/products/fotl-ladies-valueweight-t-purple/back.webp",
        "sleeve_left": "/products/fotl-ladies-valueweight-t-purple/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-valueweight-t-purple/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-baseball-t": {
    "white-navy": {
      "views": {
        "front": "/products/fotl-baseball-t/front.webp",
        "back": "/products/fotl-baseball-t/back.webp",
        "sleeve_left": "/products/fotl-baseball-t/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white-black": {
      "views": {
        "front": "/products/fotl-baseball-t-white-black/front.webp",
        "back": "/products/fotl-baseball-t-white-black/back.webp",
        "sleeve_left": "/products/fotl-baseball-t-white-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-t-white-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "white-royal": {
      "views": {
        "front": "/products/fotl-baseball-t-white-royal/front.webp",
        "back": "/products/fotl-baseball-t-white-royal/back.webp",
        "sleeve_left": "/products/fotl-baseball-t-white-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-t-white-royal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-premium-polo": {
    "black": {
      "views": {
        "front": "/products/fotl-premium-polo/front.webp",
        "back": "/products/fotl-premium-polo/back.webp",
        "sleeve_left": "/products/fotl-premium-polo/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-premium-polo-navy/front.webp",
        "back": "/products/fotl-premium-polo-navy/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-premium-polo-royal/front.webp",
        "back": "/products/fotl-premium-polo-royal/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/fotl-premium-polo-grey/front.webp",
        "back": "/products/fotl-premium-polo-grey/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-premium-polo-white/front.webp",
        "back": "/products/fotl-premium-polo-white/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-premium-polo-red/front.webp",
        "back": "/products/fotl-premium-polo-red/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fotl-premium-polo-bottle-green/front.webp",
        "back": "/products/fotl-premium-polo-bottle-green/back.webp",
        "sleeve_left": "/products/fotl-premium-polo-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/fotl-premium-polo-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-ladies-premium-polo": {
    "black": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo/front.webp",
        "back": "/products/fotl-ladies-premium-polo/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-white/front.webp",
        "back": "/products/fotl-ladies-premium-polo-white/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-navy/front.webp",
        "back": "/products/fotl-ladies-premium-polo-navy/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-red/front.webp",
        "back": "/products/fotl-ladies-premium-polo-red/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-royal/front.webp",
        "back": "/products/fotl-ladies-premium-polo-royal/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-grey/front.webp",
        "back": "/products/fotl-ladies-premium-polo-grey/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-grey/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fotl-ladies-premium-polo-burgundy/front.webp",
        "back": "/products/fotl-ladies-premium-polo-burgundy/back.webp",
        "sleeve_left": "/products/fotl-ladies-premium-polo-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/fotl-ladies-premium-polo-burgundy/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "fotl-baseball-longsleeve": {
    "white-navy": {
      "views": {
        "front": "/products/fotl-baseball-longsleeve/front.webp",
        "back": "/products/fotl-baseball-longsleeve/back.webp",
        "sleeve_left": "/products/fotl-baseball-longsleeve/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-longsleeve/sleeve-right.webp"
      },
      "status": "real"
    },
    "white-black": {
      "views": {
        "front": "/products/fotl-baseball-longsleeve-white-black/front.webp",
        "back": "/products/fotl-baseball-longsleeve-white-black/back.webp",
        "sleeve_left": "/products/fotl-baseball-longsleeve-white-black/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-longsleeve-white-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "white-royal": {
      "views": {
        "front": "/products/fotl-baseball-longsleeve-white-royal/front.webp",
        "back": "/products/fotl-baseball-longsleeve-white-royal/back.webp",
        "sleeve_left": "/products/fotl-baseball-longsleeve-white-royal/sleeve-left.webp",
        "sleeve_right": "/products/fotl-baseball-longsleeve-white-royal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "sols-imperial-t": {
    "black": {
      "views": {
        "front": "/products/sols-imperial-t/front.webp",
        "back": "/products/sols-imperial-t/back.webp",
        "sleeve_left": "/products/sols-imperial-t/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-imperial-t-white/front.webp",
        "back": "/products/sols-imperial-t-white/back.webp",
        "sleeve_left": "/products/sols-imperial-t-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/sols-imperial-t-navy/front.webp",
        "back": "/products/sols-imperial-t-navy/back.webp",
        "sleeve_left": "/products/sols-imperial-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-imperial-t-red/front.webp",
        "back": "/products/sols-imperial-t-red/back.webp",
        "sleeve_left": "/products/sols-imperial-t-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/sols-imperial-t-yellow/front.webp",
        "back": "/products/sols-imperial-t-yellow/back.webp",
        "sleeve_left": "/products/sols-imperial-t-yellow/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/sols-imperial-t-grey/front.webp",
        "back": "/products/sols-imperial-t-grey/back.webp",
        "sleeve_left": "/products/sols-imperial-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/sols-imperial-t-grey/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "sols-north-fleece": {
    "black": {
      "views": {
        "front": "/products/sols-north-fleece/front.webp",
        "back": "/products/sols-north-fleece/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/sols-north-fleece-navy/front.webp",
        "back": "/products/sols-north-fleece-navy/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/sols-north-fleece-royal/front.webp",
        "back": "/products/sols-north-fleece-royal/back.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/sols-north-fleece-grey/front.webp",
        "back": "/products/sols-north-fleece-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-north-fleece-white/front.webp",
        "back": "/products/sols-north-fleece-white/back.webp"
      },
      "status": "real"
    },
    "anthracite": {
      "views": {
        "front": "/products/sols-north-fleece-anthracite/front.webp",
        "back": "/products/sols-north-fleece-anthracite/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/sols-north-fleece-green/front.webp",
        "back": "/products/sols-north-fleece-green/back.webp"
      },
      "status": "real"
    }
  },
  "gildan-heavy-t": {
    "black": {
      "views": {
        "front": "/products/gildan-heavy-t/front.webp",
        "back": "/products/gildan-heavy-t/back.webp",
        "sleeve_left": "/products/gildan-heavy-t/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-heavy-t-white/front.webp",
        "back": "/products/gildan-heavy-t-white/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-heavy-t-grey/front.webp",
        "back": "/products/gildan-heavy-t-grey/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/gildan-heavy-t-charcoal/front.webp",
        "back": "/products/gildan-heavy-t-charcoal/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-charcoal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-charcoal/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-heavy-t-red/front.webp",
        "back": "/products/gildan-heavy-t-red/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-heavy-t-navy/front.webp",
        "back": "/products/gildan-heavy-t-navy/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/gildan-heavy-t-orange/front.webp",
        "back": "/products/gildan-heavy-t-orange/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-orange/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-orange/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-heavy-t-royal/front.webp",
        "back": "/products/gildan-heavy-t-royal/back.webp",
        "sleeve_left": "/products/gildan-heavy-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-t-royal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-softstyle-polo": {
    "black": {
      "views": {
        "front": "/products/gildan-softstyle-polo/front.webp",
        "back": "/products/gildan-softstyle-polo/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-softstyle-polo-white/front.webp",
        "back": "/products/gildan-softstyle-polo-white/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-softstyle-polo-navy/front.webp",
        "back": "/products/gildan-softstyle-polo-navy/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-softstyle-polo-grey/front.webp",
        "back": "/products/gildan-softstyle-polo-grey/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-softstyle-polo-royal/front.webp",
        "back": "/products/gildan-softstyle-polo-royal/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-softstyle-polo-red/front.webp",
        "back": "/products/gildan-softstyle-polo-red/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/gildan-softstyle-polo-green/front.webp",
        "back": "/products/gildan-softstyle-polo-green/back.webp",
        "sleeve_left": "/products/gildan-softstyle-polo-green/sleeve-left.webp",
        "sleeve_right": "/products/gildan-softstyle-polo-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-vneck-t": {
    "black": {
      "views": {
        "front": "/products/gildan-vneck-t/front.webp",
        "back": "/products/gildan-vneck-t/back.webp",
        "sleeve_left": "/products/gildan-vneck-t/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-vneck-t-navy/front.webp",
        "back": "/products/gildan-vneck-t-navy/back.webp",
        "sleeve_left": "/products/gildan-vneck-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-vneck-t-royal/front.webp",
        "back": "/products/gildan-vneck-t-royal/back.webp",
        "sleeve_left": "/products/gildan-vneck-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-vneck-t-grey/front.webp",
        "back": "/products/gildan-vneck-t-grey/back.webp",
        "sleeve_left": "/products/gildan-vneck-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-vneck-t-white/front.webp",
        "back": "/products/gildan-vneck-t-white/back.webp",
        "sleeve_left": "/products/gildan-vneck-t-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-vneck-t-red/front.webp",
        "back": "/products/gildan-vneck-t-red/back.webp",
        "sleeve_left": "/products/gildan-vneck-t-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-vneck-t-red/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-ladies-t": {
    "black": {
      "views": {
        "front": "/products/gildan-ladies-t/front.webp",
        "back": "/products/gildan-ladies-t/back.webp",
        "sleeve_left": "/products/gildan-ladies-t/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ladies-t-white/front.webp",
        "back": "/products/gildan-ladies-t-white/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-ladies-t-navy/front.webp",
        "back": "/products/gildan-ladies-t-navy/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ladies-t-royal/front.webp",
        "back": "/products/gildan-ladies-t-royal/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-ladies-t-grey/front.webp",
        "back": "/products/gildan-ladies-t-grey/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ladies-t-red/front.webp",
        "back": "/products/gildan-ladies-t-red/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/gildan-ladies-t-kelly-green/front.webp",
        "back": "/products/gildan-ladies-t-kelly-green/back.webp",
        "sleeve_left": "/products/gildan-ladies-t-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-t-kelly-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-ladies-heavy-t": {
    "black": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t/front.webp",
        "back": "/products/gildan-ladies-heavy-t/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-white/front.webp",
        "back": "/products/gildan-ladies-heavy-t-white/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-navy/front.webp",
        "back": "/products/gildan-ladies-heavy-t-navy/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-grey/front.webp",
        "back": "/products/gildan-ladies-heavy-t-grey/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-red/front.webp",
        "back": "/products/gildan-ladies-heavy-t-red/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-charcoal/front.webp",
        "back": "/products/gildan-ladies-heavy-t-charcoal/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-charcoal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-charcoal/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ladies-heavy-t-royal/front.webp",
        "back": "/products/gildan-ladies-heavy-t-royal/back.webp",
        "sleeve_left": "/products/gildan-ladies-heavy-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-heavy-t-royal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-ladies-vneck-t": {
    "black": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t/front.webp",
        "back": "/products/gildan-ladies-vneck-t/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t-white/front.webp",
        "back": "/products/gildan-ladies-vneck-t-white/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t-navy/front.webp",
        "back": "/products/gildan-ladies-vneck-t-navy/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t-red/front.webp",
        "back": "/products/gildan-ladies-vneck-t-red/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t-grey/front.webp",
        "back": "/products/gildan-ladies-vneck-t-grey/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/gildan-ladies-vneck-t-pink/front.webp",
        "back": "/products/gildan-ladies-vneck-t-pink/back.webp",
        "sleeve_left": "/products/gildan-ladies-vneck-t-pink/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-vneck-t-pink/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-ladies-polo": {
    "black": {
      "views": {
        "front": "/products/gildan-ladies-polo/front.webp",
        "back": "/products/gildan-ladies-polo/back.webp",
        "sleeve_left": "/products/gildan-ladies-polo/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-polo/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ladies-polo-white/front.webp",
        "back": "/products/gildan-ladies-polo-white/back.webp",
        "sleeve_left": "/products/gildan-ladies-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-polo-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/gildan-ladies-polo-navy/front.webp",
        "back": "/products/gildan-ladies-polo-navy/back.webp",
        "sleeve_left": "/products/gildan-ladies-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-polo-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-ladies-polo-grey/front.webp",
        "back": "/products/gildan-ladies-polo-grey/back.webp",
        "sleeve_left": "/products/gildan-ladies-polo-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-polo-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ladies-polo-royal/front.webp",
        "back": "/products/gildan-ladies-polo-royal/back.webp",
        "sleeve_left": "/products/gildan-ladies-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-ladies-polo-royal/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-zip-hoodie": {
    "navy": {
      "views": {
        "front": "/products/gildan-zip-hoodie/front.webp",
        "back": "/products/gildan-zip-hoodie/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/gildan-zip-hoodie-grey/front.webp",
        "back": "/products/gildan-zip-hoodie-grey/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-grey/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-zip-hoodie-red/front.webp",
        "back": "/products/gildan-zip-hoodie-red/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-red/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-zip-hoodie-royal/front.webp",
        "back": "/products/gildan-zip-hoodie-royal/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-royal/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/gildan-zip-hoodie-kelly-green/front.webp",
        "back": "/products/gildan-zip-hoodie-kelly-green/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-kelly-green/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/gildan-zip-hoodie-burgundy/front.webp",
        "back": "/products/gildan-zip-hoodie-burgundy/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/gildan-zip-hoodie-bottle-green/front.webp",
        "back": "/products/gildan-zip-hoodie-bottle-green/back.webp",
        "sleeve_left": "/products/gildan-zip-hoodie-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/gildan-zip-hoodie-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "russell-authentic-t": {
    "black": {
      "views": {
        "front": "/products/russell-authentic-t/front.webp",
        "back": "/products/russell-authentic-t/back.webp",
        "sleeve_left": "/products/russell-authentic-t/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-authentic-t-white/front.webp",
        "back": "/products/russell-authentic-t-white/back.webp",
        "sleeve_left": "/products/russell-authentic-t-white/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/russell-authentic-t-navy/front.webp",
        "back": "/products/russell-authentic-t-navy/back.webp",
        "sleeve_left": "/products/russell-authentic-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/russell-authentic-t-red/front.webp",
        "back": "/products/russell-authentic-t-red/back.webp",
        "sleeve_left": "/products/russell-authentic-t-red/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/russell-authentic-t-grey/front.webp",
        "back": "/products/russell-authentic-t-grey/back.webp",
        "sleeve_left": "/products/russell-authentic-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/russell-authentic-t-royal/front.webp",
        "back": "/products/russell-authentic-t-royal/back.webp",
        "sleeve_left": "/products/russell-authentic-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-authentic-t-burgundy/front.webp",
        "back": "/products/russell-authentic-t-burgundy/back.webp",
        "sleeve_left": "/products/russell-authentic-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/russell-authentic-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "russell-workwear-t": {
    "black": {
      "views": {
        "front": "/products/russell-workwear-t/front.webp",
        "back": "/products/russell-workwear-t/back.webp",
        "sleeve_left": "/products/russell-workwear-t/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/russell-workwear-t-navy/front.webp",
        "back": "/products/russell-workwear-t-navy/back.webp",
        "sleeve_left": "/products/russell-workwear-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/russell-workwear-t-royal/front.webp",
        "back": "/products/russell-workwear-t-royal/back.webp",
        "sleeve_left": "/products/russell-workwear-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/russell-workwear-t-grey/front.webp",
        "back": "/products/russell-workwear-t-grey/back.webp",
        "sleeve_left": "/products/russell-workwear-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-workwear-t-white/front.webp",
        "back": "/products/russell-workwear-t-white/back.webp",
        "sleeve_left": "/products/russell-workwear-t-white/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/russell-workwear-t-red/front.webp",
        "back": "/products/russell-workwear-t-red/back.webp",
        "sleeve_left": "/products/russell-workwear-t-red/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-workwear-t-bottle-green/front.webp",
        "back": "/products/russell-workwear-t-bottle-green/back.webp",
        "sleeve_left": "/products/russell-workwear-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/russell-workwear-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "russell-ladies-authentic-t": {
    "black": {
      "views": {
        "front": "/products/russell-ladies-authentic-t/front.webp",
        "back": "/products/russell-ladies-authentic-t/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-white/front.webp",
        "back": "/products/russell-ladies-authentic-t-white/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-white/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-navy/front.webp",
        "back": "/products/russell-ladies-authentic-t-navy/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-grey/front.webp",
        "back": "/products/russell-ladies-authentic-t-grey/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-red/front.webp",
        "back": "/products/russell-ladies-authentic-t-red/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-red/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-royal/front.webp",
        "back": "/products/russell-ladies-authentic-t-royal/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-ladies-authentic-t-bottle-green/front.webp",
        "back": "/products/russell-ladies-authentic-t-bottle-green/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-t-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/russell-ladies-authentic-t-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "neutral-classic-polo": {
    "black": {
      "views": {
        "front": "/products/neutral-classic-polo/front.webp",
        "back": "/products/neutral-classic-polo/back.webp",
        "sleeve_left": "/products/neutral-classic-polo/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-classic-polo-white/front.webp",
        "back": "/products/neutral-classic-polo-white/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-classic-polo-navy/front.webp",
        "back": "/products/neutral-classic-polo-navy/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-classic-polo-royal/front.webp",
        "back": "/products/neutral-classic-polo-royal/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-classic-polo-red/front.webp",
        "back": "/products/neutral-classic-polo-red/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/neutral-classic-polo-grey/front.webp",
        "back": "/products/neutral-classic-polo-grey/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-grey/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/neutral-classic-polo-bottle-green/front.webp",
        "back": "/products/neutral-classic-polo-bottle-green/back.webp",
        "sleeve_left": "/products/neutral-classic-polo-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/neutral-classic-polo-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "neutral-rollsleeve-t": {
    "black": {
      "views": {
        "front": "/products/neutral-rollsleeve-t/front.webp",
        "back": "/products/neutral-rollsleeve-t/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-grey/front.webp",
        "back": "/products/neutral-rollsleeve-t-grey/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-navy/front.webp",
        "back": "/products/neutral-rollsleeve-t-navy/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "anthracite": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-anthracite/front.webp",
        "back": "/products/neutral-rollsleeve-t-anthracite/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-anthracite/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-anthracite/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-white/front.webp",
        "back": "/products/neutral-rollsleeve-t-white/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-white/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-burgundy/front.webp",
        "back": "/products/neutral-rollsleeve-t-burgundy/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/neutral-rollsleeve-t-olive/front.webp",
        "back": "/products/neutral-rollsleeve-t-olive/back.webp",
        "sleeve_left": "/products/neutral-rollsleeve-t-olive/sleeve-left.webp",
        "sleeve_right": "/products/neutral-rollsleeve-t-olive/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "justhoods-college-hoodie": {
    "black": {
      "views": {
        "front": "/products/justhoods-college-hoodie/front.webp",
        "back": "/products/justhoods-college-hoodie/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/justhoods-college-hoodie-white/front.webp",
        "back": "/products/justhoods-college-hoodie-white/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-white/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/justhoods-college-hoodie-navy/front.webp",
        "back": "/products/justhoods-college-hoodie-navy/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-navy/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/justhoods-college-hoodie-grey/front.webp",
        "back": "/products/justhoods-college-hoodie-grey/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-grey/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/justhoods-college-hoodie-royal/front.webp",
        "back": "/products/justhoods-college-hoodie-royal/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-royal/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/justhoods-college-hoodie-red/front.webp",
        "back": "/products/justhoods-college-hoodie-red/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-red/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/justhoods-college-hoodie-bottle-green/front.webp",
        "back": "/products/justhoods-college-hoodie-bottle-green/back.webp",
        "sleeve_left": "/products/justhoods-college-hoodie-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-college-hoodie-bottle-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "justhoods-zoodie": {
    "black": {
      "views": {
        "front": "/products/justhoods-zoodie/front.webp",
        "back": "/products/justhoods-zoodie/back.webp",
        "sleeve_left": "/products/justhoods-zoodie/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/justhoods-zoodie-navy/front.webp",
        "back": "/products/justhoods-zoodie-navy/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-navy/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/justhoods-zoodie-royal/front.webp",
        "back": "/products/justhoods-zoodie-royal/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-royal/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/justhoods-zoodie-grey/front.webp",
        "back": "/products/justhoods-zoodie-grey/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-grey/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/justhoods-zoodie-burgundy/front.webp",
        "back": "/products/justhoods-zoodie-burgundy/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-burgundy/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-burgundy/sleeve-right.webp"
      },
      "status": "real"
    },
    "anthracite": {
      "views": {
        "front": "/products/justhoods-zoodie-anthracite/front.webp",
        "back": "/products/justhoods-zoodie-anthracite/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-anthracite/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-anthracite/sleeve-right.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/justhoods-zoodie-green/front.webp",
        "back": "/products/justhoods-zoodie-green/back.webp",
        "sleeve_left": "/products/justhoods-zoodie-green/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-zoodie-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "justhoods-awdis-sweat": {
    "black": {
      "views": {
        "front": "/products/justhoods-awdis-sweat/front.webp",
        "back": "/products/justhoods-awdis-sweat/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-white/front.webp",
        "back": "/products/justhoods-awdis-sweat-white/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-white/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-navy/front.webp",
        "back": "/products/justhoods-awdis-sweat-navy/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-navy/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-red/front.webp",
        "back": "/products/justhoods-awdis-sweat-red/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-red/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-royal/front.webp",
        "back": "/products/justhoods-awdis-sweat-royal/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-royal/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-grey/front.webp",
        "back": "/products/justhoods-awdis-sweat-grey/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-grey/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/justhoods-awdis-sweat-kelly-green/front.webp",
        "back": "/products/justhoods-awdis-sweat-kelly-green/back.webp",
        "sleeve_left": "/products/justhoods-awdis-sweat-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-awdis-sweat-kelly-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "justhoods-contrast-hoodie": {
    "navy-grey": {
      "views": {
        "front": "/products/justhoods-contrast-hoodie/front.webp",
        "back": "/products/justhoods-contrast-hoodie/back.webp",
        "sleeve_left": "/products/justhoods-contrast-hoodie/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-contrast-hoodie/sleeve-right.webp"
      },
      "status": "real"
    },
    "black-red": {
      "views": {
        "front": "/products/justhoods-contrast-hoodie-black-red/front.webp",
        "back": "/products/justhoods-contrast-hoodie-black-red/back.webp",
        "sleeve_left": "/products/justhoods-contrast-hoodie-black-red/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-contrast-hoodie-black-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey-navy": {
      "views": {
        "front": "/products/justhoods-contrast-hoodie-grey-navy/front.webp",
        "back": "/products/justhoods-contrast-hoodie-grey-navy/back.webp",
        "sleeve_left": "/products/justhoods-contrast-hoodie-grey-navy/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-contrast-hoodie-grey-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "burgundy-anthracite": {
      "views": {
        "front": "/products/justhoods-contrast-hoodie-burgundy-anthracite/front.webp",
        "back": "/products/justhoods-contrast-hoodie-burgundy-anthracite/back.webp",
        "sleeve_left": "/products/justhoods-contrast-hoodie-burgundy-anthracite/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-contrast-hoodie-burgundy-anthracite/sleeve-right.webp"
      },
      "status": "real"
    },
    "red-white": {
      "views": {
        "front": "/products/justhoods-contrast-hoodie-red-white/front.webp",
        "back": "/products/justhoods-contrast-hoodie-red-white/back.webp",
        "sleeve_left": "/products/justhoods-contrast-hoodie-red-white/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-contrast-hoodie-red-white/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "justhoods-quarterzip-sweat": {
    "grey": {
      "views": {
        "front": "/products/justhoods-quarterzip-sweat/front.webp",
        "back": "/products/justhoods-quarterzip-sweat/back.webp",
        "sleeve_left": "/products/justhoods-quarterzip-sweat/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-quarterzip-sweat/sleeve-right.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/justhoods-quarterzip-sweat-black/front.webp",
        "back": "/products/justhoods-quarterzip-sweat-black/back.webp",
        "sleeve_left": "/products/justhoods-quarterzip-sweat-black/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-quarterzip-sweat-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "anthracite": {
      "views": {
        "front": "/products/justhoods-quarterzip-sweat-anthracite/front.webp",
        "back": "/products/justhoods-quarterzip-sweat-anthracite/back.webp",
        "sleeve_left": "/products/justhoods-quarterzip-sweat-anthracite/sleeve-left.webp",
        "sleeve_right": "/products/justhoods-quarterzip-sweat-anthracite/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "bandc-inspire-hoodie": {
    "black": {
      "views": {
        "front": "/products/bandc-inspire-hoodie/front.webp",
        "back": "/products/bandc-inspire-hoodie/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-white/front.webp",
        "back": "/products/bandc-inspire-hoodie-white/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-navy/front.webp",
        "back": "/products/bandc-inspire-hoodie-navy/back.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-grey/front.webp",
        "back": "/products/bandc-inspire-hoodie-grey/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-royal/front.webp",
        "back": "/products/bandc-inspire-hoodie-royal/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-red/front.webp",
        "back": "/products/bandc-inspire-hoodie-red/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bandc-inspire-hoodie-burgundy/front.webp",
        "back": "/products/bandc-inspire-hoodie-burgundy/back.webp"
      },
      "status": "real"
    }
  },
  "bandc-inspire-zip-hood": {
    "black": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood/front.webp",
        "back": "/products/bandc-inspire-zip-hood/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-white/front.webp",
        "back": "/products/bandc-inspire-zip-hood-white/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-navy/front.webp",
        "back": "/products/bandc-inspire-zip-hood-navy/back.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-grey/front.webp",
        "back": "/products/bandc-inspire-zip-hood-grey/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-royal/front.webp",
        "back": "/products/bandc-inspire-zip-hood-royal/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-red/front.webp",
        "back": "/products/bandc-inspire-zip-hood-red/back.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/bandc-inspire-zip-hood-sage/front.webp",
        "back": "/products/bandc-inspire-zip-hood-sage/back.webp"
      },
      "status": "real"
    }
  },
  "stedman-slimfit-t": {
    "black": {
      "views": {
        "front": "/products/stedman-slimfit-t/front.webp",
        "back": "/products/stedman-slimfit-t/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-slimfit-t-white/front.webp",
        "back": "/products/stedman-slimfit-t-white/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-white/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/stedman-slimfit-t-navy/front.webp",
        "back": "/products/stedman-slimfit-t-navy/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/stedman-slimfit-t-grey/front.webp",
        "back": "/products/stedman-slimfit-t-grey/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-grey/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-grey/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/stedman-slimfit-t-royal/front.webp",
        "back": "/products/stedman-slimfit-t-royal/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/stedman-slimfit-t-red/front.webp",
        "back": "/products/stedman-slimfit-t-red/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-red/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/stedman-slimfit-t-olive/front.webp",
        "back": "/products/stedman-slimfit-t-olive/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-olive/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-olive/sleeve-right.webp"
      },
      "status": "real"
    },
    "graphite": {
      "views": {
        "front": "/products/stedman-slimfit-t-graphite/front.webp",
        "back": "/products/stedman-slimfit-t-graphite/back.webp",
        "sleeve_left": "/products/stedman-slimfit-t-graphite/sleeve-left.webp",
        "sleeve_right": "/products/stedman-slimfit-t-graphite/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "jn-active-t": {
    "black": {
      "views": {
        "front": "/products/jn-active-t/front.webp",
        "back": "/products/jn-active-t/back.webp",
        "sleeve_left": "/products/jn-active-t/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t/sleeve-right.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jn-active-t-royal/front.webp",
        "back": "/products/jn-active-t-royal/back.webp",
        "sleeve_left": "/products/jn-active-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-royal/sleeve-right.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jn-active-t-navy/front.webp",
        "back": "/products/jn-active-t-navy/back.webp",
        "sleeve_left": "/products/jn-active-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-navy/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jn-active-t-white/front.webp",
        "back": "/products/jn-active-t-white/back.webp",
        "sleeve_left": "/products/jn-active-t-white/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-white/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jn-active-t-red/front.webp",
        "back": "/products/jn-active-t-red/back.webp",
        "sleeve_left": "/products/jn-active-t-red/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-red/sleeve-right.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jn-active-t-yellow/front.webp",
        "back": "/products/jn-active-t-yellow/back.webp",
        "sleeve_left": "/products/jn-active-t-yellow/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-yellow/sleeve-right.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/jn-active-t-kelly-green/front.webp",
        "back": "/products/jn-active-t-kelly-green/back.webp",
        "sleeve_left": "/products/jn-active-t-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/jn-active-t-kelly-green/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "jn-halfzip-sweat": {
    "black": {
      "views": {
        "front": "/products/jn-halfzip-sweat/front.webp",
        "back": "/products/jn-halfzip-sweat/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jn-halfzip-sweat-navy/front.webp",
        "back": "/products/jn-halfzip-sweat-navy/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e190": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-navy-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-navy-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-navy-blue/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-navy-blue/front.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-white/front.webp",
        "back": "/products/bundc-t-shirt-e190-white/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-white/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-black/front.webp",
        "back": "/products/bundc-t-shirt-e190-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-black/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e190-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-red/front.webp",
        "back": "/products/bundc-t-shirt-e190-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-red/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-red/front.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apricot": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunset-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sorbet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "swimming-pool": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "diva-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-kelly-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-kelly-green/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-kelly-green/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "used-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-t-shirt-e190-women": {
    "urban-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-white/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-white/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-white/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-black/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-black/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-navy/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-navy/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-navy/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-red/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-red/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-red/front.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apricot": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunset-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sorbet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "swimming-pool": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "diva-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-kelly-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e190-women-kelly-green/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e190-women-kelly-green/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "used-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-inspire-e150-t-shirt": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-navy-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-navy-blue/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-navy-blue/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-navy-blue/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-white/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mocha": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-red/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-red/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-red/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-royal-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-royal-blue/front.webp"
      },
      "status": "real"
    },
    "blue-fog": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-pure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-heather-grey/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-heather-grey/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-heather-grey/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-heather-grey/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-navy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-navy/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-navy/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-navy/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150": {
    "101145": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-white/front.webp",
        "back": "/products/bundc-t-shirt-e150-white/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-white/front.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-black/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-black/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-royal-blue/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-royal-blue/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e150-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-sport-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-red/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-red/front.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apricot": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "diva-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "azure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pistachio": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-bottle-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-bottle-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-bottle-green/front.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "used-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bear-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "electric-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-navy/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-navy/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-e150-t-shirt-women": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-white/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-women-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-women-white/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mocha": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-fog": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-pure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-navy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-navy/back.webp",
        "sleeve_left": "/products/bundc-inspire-e150-t-shirt-women-navy/front.webp",
        "sleeve_right": "/products/bundc-inspire-e150-t-shirt-women-navy/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150-women": {
    "urban-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-white/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-white/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-white/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-black/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-black/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-royal-blue/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-red/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-red/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-sport-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apricot": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "diva-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "azure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "electric-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pistachio": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-kelly-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-kelly-green/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "used-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bear-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-navy/sleeve-left.webp",
        "sleeve_right": "/products/bundc-t-shirt-e150-women-navy/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-e220-t": {
    "black": {
      "views": {
        "front": "/products/bundc-e220-t-black/front.webp",
        "back": "/products/bundc-e220-t-black/back.webp",
        "sleeve_left": "/products/bundc-e220-t-black/front.webp",
        "sleeve_right": "/products/bundc-e220-t-black/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-e220-t-white/front.webp",
        "back": "/products/bundc-e220-t-white/back.webp",
        "sleeve_left": "/products/bundc-e220-t-white/front.webp",
        "sleeve_right": "/products/bundc-e220-t-white/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-e220-t-navy/front.webp",
        "back": "/products/bundc-e220-t-navy/back.webp",
        "sleeve_left": "/products/bundc-e220-t-navy/front.webp",
        "sleeve_right": "/products/bundc-e220-t-navy/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lake-blue": {
      "views": {
        "front": "/products/bundc-e220-t-lake-blue/front.webp",
        "back": "/products/bundc-e220-t-lake-blue/back.webp",
        "sleeve_left": "/products/bundc-e220-t-lake-blue/front.webp",
        "sleeve_right": "/products/bundc-e220-t-lake-blue/front.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "amalfi-teal": {
      "views": {
        "front": "/products/bundc-e220-t-amalfi-teal/front.webp",
        "back": "/products/bundc-e220-t-amalfi-teal/back.webp",
        "sleeve_left": "/products/bundc-e220-t-amalfi-teal/front.webp",
        "sleeve_right": "/products/bundc-e220-t-amalfi-teal/front.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-inspire-v-t-men": {
    "black": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-black/front.webp",
        "back": "/products/bundc-inspire-v-t-men-black/front.webp",
        "sleeve_left": "/products/bundc-inspire-v-t-men-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-v-t-men-black/front.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-white/front.webp",
        "back": "/products/bundc-inspire-v-t-men-white/front.webp",
        "sleeve_left": "/products/bundc-inspire-v-t-men-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-v-t-men-white/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-v-t-women": {
    "black": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-black/front.webp",
        "back": "/products/bundc-inspire-v-t-women-black/front.webp",
        "sleeve_left": "/products/bundc-inspire-v-t-women-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-v-t-women-black/front.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-white/front.webp",
        "back": "/products/bundc-inspire-v-t-women-white/front.webp",
        "sleeve_left": "/products/bundc-inspire-v-t-women-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-v-t-women-white/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-t-men": {
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-t-men-black/front.webp",
        "back": "/products/bundc-inspire-t-men-black/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-black/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-inspire-t-men-khaki/front.webp",
        "back": "/products/bundc-inspire-t-men-khaki/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-khaki/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-khaki/front.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-t-men-navy/front.webp",
        "back": "/products/bundc-inspire-t-men-navy/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-navy/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-t-men-red/front.webp",
        "back": "/products/bundc-inspire-t-men-red/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-red/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-red/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-t-men-royal-blue/front.webp",
        "back": "/products/bundc-inspire-t-men-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-royal-blue/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-t-men-white/front.webp",
        "back": "/products/bundc-inspire-t-men-white/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-white/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-inspire-t-men-sport-grey-heather/front.webp",
        "back": "/products/bundc-inspire-t-men-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-men-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-men-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-inspire-t-women": {
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-t-women-black/front.webp",
        "back": "/products/bundc-inspire-t-women-black/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-women-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-women-black/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-t-women-navy/front.webp",
        "back": "/products/bundc-inspire-t-women-navy/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-women-navy/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-women-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-t-women-white/front.webp",
        "back": "/products/bundc-inspire-t-women-white/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-women-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-t-women-white/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-round-t-heavy": {
    "aubergine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-black/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-dark-green/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-dark-green/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fern-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grenadine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-grey-heather/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-grey-heather/front.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-navy/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-red/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-red/front.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-royal/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-royal/front.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-white/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-round-t-heavy-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-ladies-active-t": {
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-black/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-black/front.webp"
      },
      "status": "real"
    },
    "dark-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-green/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-green/front.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-purple/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-purple/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-purple/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-red/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-royal/front.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-white/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-active-t-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-men-s-basic-t": {
    "light-denim-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-black/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-black/front.webp"
      },
      "status": "real"
    },
    "black-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "coral": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-dark-green/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-dark-green/front.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-grey-heather/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-grey-heather/front.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-navy/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-red/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-royal/front.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "steel-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-white/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-basic-t-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "vanilla": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "jade-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-ladies-basic-t": {
    "aubergine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-black/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-dark-green/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-dark-green/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fern-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grenadine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-grey-heather/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-grey-heather/front.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-red/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-red/front.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-royal/front.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-white/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-basic-t-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-workwear-t-men": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-black/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-men-black/front.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-carbon/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-men-carbon/front.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-men-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-red/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-men-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-white/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-men-white/front.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-workwear-t-women": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-black/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-black/front.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-carbon/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-carbon/front.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-dark-green/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-dark-green/front.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-red/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-royal/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-royal/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-white/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-t-women-white/front.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-mens-bio-workwear-t-shirt": {
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/front.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/front.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/front.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/front.webp",
        "sleeve_right": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/front.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-ladies-bio-workwear-t-shirt": {
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/front.webp"
      },
      "status": "real"
    }
  },
  "russell-russell-classic-t": {
    "mocha": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "0062ae": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mineral-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "powder-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tan": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-classic-heavyweight-t-shirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tan": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-mens-pure-organic-heavy-tee": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "555b66": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-ladies-pure-organic-heavy-tee": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "555b66": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-mens-pure-organic-v-neck-tee": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "gildan-ultra-cotton-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-navy/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-navy/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-navy/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "metro-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "azalea": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cherry-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cornsilk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "daisy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-forest-green/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-forest-green/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-forest-green/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-forest-green/front.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-cardinal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heliconia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ice-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "indigo-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "iris": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "jade-dome": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "maroon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pistachio": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "prairie-dust": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tan": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tangerine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "texas-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "vegas-gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-black/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-black/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-black/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-red/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-red/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-red/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-royal/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-royal/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-royal/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "safety-green-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-orange-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-white/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-white/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-t-shirt-white/front.webp",
        "sleeve_right": "/products/gildan-ultra-cotton-t-shirt-white/front.webp"
      },
      "status": "real"
    }
  },
  "gildan-light-cotton-adult-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cherry-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "daisy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heliconia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "maroon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-men-s-classic-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-bottle-green/front.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "nature": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-charcoal/front.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-men-s-classic-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-men-s-classic-t-shirt-royal/front.webp"
      },
      "status": "real"
    }
  },
  "neutral-oversized-t-shirt": {
    "215732": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "raw": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-ladies-classic-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-bottle-green/front.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "nature": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-charcoal/front.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-black/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-navy/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-red/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-white/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-royal/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-ladies-classic-t-shirt-royal/front.webp"
      },
      "status": "real"
    }
  },
  "neutral-men-s-fit-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-bottle-green/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "ash-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-men-s-fit-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-unisex-performance-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-white/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-white/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-charcoal/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-black/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-black/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-navy/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-navy/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-red/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-red/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-royal/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-royal/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-performance-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-ladies-fit-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-bottle-green/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-black/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-navy/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-red/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-royal/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-royal/front.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-white/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-ladies-fit-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-unisex-regular-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-bottle-green/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-black/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-navy/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-red/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-white/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-royal/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-royal/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-ash-grey/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-ash-grey/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-ash-grey/sleeve-left.webp",
        "sleeve_right": "/products/neutral-unisex-regular-t-shirt-ash-grey/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "nature": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "okay-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-stedman-classic-t": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-berry": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hunters-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brilliant-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "marina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "f7a30a": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "5a6f5e": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-classic-t-for-women": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-berry": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hunters-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brilliant-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "marina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "f7a30a": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "5a6f5e": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-classic-t-v-neck": {
    "747679": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-berry": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "1c9a2c": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-classic-t-v-neck-for-women": {
    "747679": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-berry": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "1c9a2c": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-comfort-t": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "marina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "89163e": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dac9af": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "stedman-clive-crew-neck": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-opal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "king-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "marina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "salmon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "293e11": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "051733": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-unisex-polo-id-001": {
    "anthracite": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-black/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-black/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-black/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-black/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-bottle-green/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-bottle-green/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-bottle-green/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-bottle-green/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chili-gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "009149": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-navy/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-navy/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-navy/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pixel-coral": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "real-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-red/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-red/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-red/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-red/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-royal-blue/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-royal-blue/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-royal-blue/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-white/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-white/front.webp",
        "sleeve_left": "/products/bundc-unisex-polo-id-001-white/front.webp",
        "sleeve_right": "/products/bundc-unisex-polo-id-001-white/front.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-my-polo-180": {
    "dark-forest": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "camo-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-polo-180-black/front.webp",
        "back": "/products/bundc-my-polo-180-black/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-black/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-polo-180-navy/front.webp",
        "back": "/products/bundc-my-polo-180-navy/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-navy/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-navy/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-polo-180-white/front.webp",
        "back": "/products/bundc-my-polo-180-white/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-white/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-white/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-my-polo-180-sport-grey-heather/front.webp",
        "back": "/products/bundc-my-polo-180-sport-grey-heather/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-polo-180-royal-blue/front.webp",
        "back": "/products/bundc-my-polo-180-royal-blue/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-polo-180-red/front.webp",
        "back": "/products/bundc-my-polo-180-red/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-red/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-red/front.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ivy-green": {
      "views": {
        "front": "/products/bundc-my-polo-180-ivy-green/front.webp",
        "back": "/products/bundc-my-polo-180-ivy-green/front.webp",
        "sleeve_left": "/products/bundc-my-polo-180-ivy-green/front.webp",
        "sleeve_right": "/products/bundc-my-polo-180-ivy-green/front.webp"
      },
      "status": "real"
    },
    "navy-pure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "meta-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "meta-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "meta-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "meta-fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "meta-gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blush-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blush-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blush-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lavender": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-inspire-polo-men": {
    "urban-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-white/front.webp",
        "back": "/products/bundc-inspire-polo-men-white/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-men-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-men-white/front.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-heather-grey/front.webp",
        "back": "/products/bundc-inspire-polo-men-heather-grey/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-men-heather-grey/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-men-heather-grey/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-dark-grey-solid/front.webp",
        "back": "/products/bundc-inspire-polo-men-dark-grey-solid/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-men-dark-grey-solid/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-men-dark-grey-solid/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-black/front.webp",
        "back": "/products/bundc-inspire-polo-men-black/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-men-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-men-black/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sorbet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-inspire-polo-women": {
    "urban-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-white/front.webp",
        "back": "/products/bundc-inspire-polo-women-white/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-women-white/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-women-white/front.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-heather-grey/front.webp",
        "back": "/products/bundc-inspire-polo-women-heather-grey/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-women-heather-grey/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-women-heather-grey/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-dark-grey-solid/front.webp",
        "back": "/products/bundc-inspire-polo-women-dark-grey-solid/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-women-dark-grey-solid/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-women-dark-grey-solid/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-black/front.webp",
        "back": "/products/bundc-inspire-polo-women-black/front.webp",
        "sleeve_left": "/products/bundc-inspire-polo-women-black/front.webp",
        "sleeve_right": "/products/bundc-inspire-polo-women-black/front.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sorbet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-my-eco-polo-6535": {
    "dark-forest": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "camo-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-camo-green/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-camo-green/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-camo-green/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-camo-green/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-white/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-white/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-white/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-black/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-black/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-black/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-navy/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-navy/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-navy/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-navy/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-royal-blue/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-royal-blue/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-red/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-red/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-red/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-red/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-dark-grey-solid/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-dark-grey-solid/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-dark-grey-solid/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-dark-grey-solid/front.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "melon-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-my-eco-polo-6535-women": {
    "dark-forest": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "camo-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-camo-green/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-camo-green/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-camo-green/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-camo-green/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-white/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-white/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-white/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-black/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-black/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-black/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-navy/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-navy/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-navy/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-navy/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-royal-blue/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-royal-blue/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-royal-blue/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-red/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-red/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-red/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-red/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-dark-grey-solid/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-dark-grey-solid/front.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-dark-grey-solid/front.webp",
        "sleeve_right": "/products/bundc-my-eco-polo-6535-women-dark-grey-solid/front.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "melon-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pop-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-classic-polo": {
    "aubergine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-black/front.webp",
        "back": "/products/jamesnicholson-classic-polo-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fern-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-classic-polo-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-graphite-solid/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-graphite-solid/front.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-grey-heather/front.webp",
        "back": "/products/jamesnicholson-classic-polo-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-grey-heather/front.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-navy/front.webp",
        "back": "/products/jamesnicholson-classic-polo-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-red/front.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-royal/front.webp"
      },
      "status": "real"
    },
    "signal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-white/front.webp",
        "back": "/products/jamesnicholson-classic-polo-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-classic-polo-ladies": {
    "aubergine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-black/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-black/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fern-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/front.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-grey-heather/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-grey-heather/front.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-navy/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pacific": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "petrol": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-red/front.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-royal/front.webp"
      },
      "status": "real"
    },
    "signal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tomato": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-white/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-classic-polo-ladies-white/front.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-men-s-bio-workwear-polo": {
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-red/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-red/front.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-black/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-black/front.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-white/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-white/front.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/front.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-workwear-polo-men": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-black/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-black/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-black/front.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-carbon/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-carbon/front.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-dark-green/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-dark-green/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-dark-green/front.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-navy/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-navy/front.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-red/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-red/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-red/front.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-royal/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-royal/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-royal/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-white/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-white/sleeve-left.webp",
        "sleeve_right": "/products/jamesnicholson-workwear-polo-men-white/front.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-pique-polo-shirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-jersey-polo-shirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-strapazierfaehiges-poloshirt-599": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-men-s-ultimate-cotton-polo": {
    "azure-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "titanium-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "00461c": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-men-s-classic-cotton-polo": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-poloshirt-6535": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-ladies-poloshirt-6535": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-men-s-polo-shirt-prime": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-royal-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-royal-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-royal-blue/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-royal-blue/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "army": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-black/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-black/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-black/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-black/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-bottle-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-bottle-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-bottle-green/front.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-french-navy/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-french-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-french-navy/front.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-grey-melange/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-grey-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-grey-melange/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-grey-melange/front.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-red/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-red/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-red/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-white/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-white/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-prime-white/front.webp"
      },
      "status": "real"
    }
  },
  "sols-women-s-polo-shirt-prime": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-royal-blue/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-royal-blue/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-royal-blue/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-royal-blue/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "army": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-black/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-black/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-black/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-black/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-bottle-green/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-bottle-green/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-bottle-green/front.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-french-navy/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-french-navy/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-french-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-french-navy/front.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-grey-melange/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-grey-melange/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-grey-melange/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-grey-melange/front.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-red/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-red/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-red/front.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-white/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-white/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-women-s-polo-shirt-prime-white/front.webp"
      },
      "status": "real"
    },
    "4b271c": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cdea80": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-men-s-polo-shirt-perfect": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-royal-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-royal-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-royal-blue/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-royal-blue/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-black/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-black/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-black/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-black/front.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-french-navy/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-french-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-french-navy/front.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-kelly-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-kelly-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-kelly-green/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-red/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-red/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-red/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-white/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-white/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-polo-shirt-perfect-white/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "creamy-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "creamy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "spring-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "01509d": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hibiscus": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "slate-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-oxblood": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-unisex-pulse-polo-shirt": {
    "white": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-white/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-white/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-white/front.webp"
      },
      "status": "real"
    },
    "rope": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "linen": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "candy-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-red/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-red/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-red/front.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-kelly-green/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-kelly-green/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-kelly-green/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-kelly-green/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue-241": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/front.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-french-navy/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-french-navy/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-french-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-french-navy/front.webp"
      },
      "status": "real"
    },
    "denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-grey-melange/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-grey-melange/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-grey-melange/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-grey-melange/front.webp"
      },
      "status": "real"
    },
    "mouse-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-black/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-black/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-black/sleeve-left.webp",
        "sleeve_right": "/products/sols-unisex-pulse-polo-shirt-black/front.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "gildan-heavy-blend-hooded-sweatshirt": {
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "graphite-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "azalea": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mint-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "old-gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orchid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "b23730": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "violet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "antique-cherry-red-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "antique-sapphire-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cherry-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "garnet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "eead1a": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heliconia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "indigo-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "maroon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "005683": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "205c40": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "1c3775": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-black/front.webp",
        "back": "/products/gildan-heavy-blend-hooded-sweatshirt-black/back.webp",
        "sleeve_left": "/products/gildan-heavy-blend-hooded-sweatshirt-black/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-blend-hooded-sweatshirt-black/sleeve-right.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-sport-grey-heather/front.webp",
        "back": "/products/gildan-heavy-blend-hooded-sweatshirt-sport-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-heavy-blend-hooded-sweatshirt-sport-grey-heather/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-blend-hooded-sweatshirt-sport-grey-heather/sleeve-right.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-white/front.webp",
        "back": "/products/gildan-heavy-blend-hooded-sweatshirt-white/back.webp",
        "sleeve_left": "/products/gildan-heavy-blend-hooded-sweatshirt-white/sleeve-left.webp",
        "sleeve_right": "/products/gildan-heavy-blend-hooded-sweatshirt-white/sleeve-right.webp"
      },
      "status": "real"
    }
  },
  "gildan-softstyle-midweight-sweat-adult-hoodie": {
    "navy": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-navy/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-navy/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-navy/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-navy/front.webp"
      },
      "status": "real"
    },
    "cobalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "paragon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/front.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/front.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/front.webp"
      },
      "status": "real"
    },
    "yellow-haze": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cement": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cocoa": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "daisy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink-lemonade": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pistachio": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tangerine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aquatic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/front.webp",
        "sleeve_right": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/front.webp"
      },
      "status": "real"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown-savana": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "smoke": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "t-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "393d47": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "gildan-hammer-maxweight-adult-hooded-sweatshirt": {
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cherry-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "garnet": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "888b8d": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "2d2926": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tan": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "fruit-of-the-loom-classic-hooded-sweat": {
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-black/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-black/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-black/front.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-navy/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-navy/front.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-navy/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-navy/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-white/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-white/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-white/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-white/front.webp"
      },
      "status": "real"
    },
    "dark-heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-red": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/front.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/front.webp",
        "sleeve_right": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/front.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "azure-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sunflower": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "fruit-of-the-loom-premium-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "fruit-of-the-loom-lightweight-hooded-sweat": {
    "azure-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "fruit-of-the-loom-iconic-premium-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "athletic-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "desert-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "fruit-of-the-loom-iconic-250-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ffffff": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "athletic-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "college-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "desert-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "build-your-brand-heavy-hoody": {
    "bottle-green": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-bottle-green/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-bottle-green/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-bottle-green/front.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-black/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-black/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-black/front.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-black/front.webp"
      },
      "status": "real"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-charcoal-heather/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-charcoal-heather/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-charcoal-heather/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-charcoal-heather/front.webp"
      },
      "status": "real"
    },
    "cobaltblue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-navy/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-navy/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-navy/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-navy/front.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ultraviolett": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-white/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-white/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-white/front.webp"
      },
      "status": "real"
    },
    "paradise-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hibiskus-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "neo-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "frozen-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "city-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ruby": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-ruby/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-ruby/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-ruby/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-heavy-hoody-ruby/front.webp"
      },
      "status": "real"
    },
    "taxi-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bark": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple-night": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pale-leaf": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "baltic-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chocoloate-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "plum-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "powder-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "build-your-brand-fluffy-hoody": {
    "bottle-green": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-bottle-green/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-bottle-green/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-fluffy-hoody-bottle-green/front.webp"
      },
      "status": "real"
    },
    "pale-olive": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-pale-olive/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-pale-olive/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-pale-olive/front.webp",
        "sleeve_right": "/products/build-your-brand-fluffy-hoody-pale-olive/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-white/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-white/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-fluffy-hoody-white/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-black/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-black/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-black/front.webp",
        "sleeve_right": "/products/build-your-brand-fluffy-hoody-black/front.webp"
      },
      "status": "real"
    },
    "magnet": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-magnet/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-magnet/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-magnet/front.webp",
        "sleeve_right": "/products/build-your-brand-fluffy-hoody-magnet/front.webp"
      },
      "status": "real"
    },
    "light-asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "chocoloate-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "u-beige": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "plum-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "powder-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "beryl-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "build-your-brand-ultra-heavy-cotton-box-hoody": {
    "dark-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/front.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/front.webp"
      },
      "status": "real"
    },
    "ready-to-dye": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "vintage-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "union-beige": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "city-red": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/front.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "beryl-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bark": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "magnet": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/front.webp"
      },
      "status": "real"
    },
    "forgotten-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "retro-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "e8e7e3": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cloud": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/front.webp",
        "sleeve_right": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/front.webp"
      },
      "status": "real"
    },
    "soft-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "build-your-brand-ladies-heavy-hoody": {
    "white": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-white/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-white/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-ladies-heavy-hoody-white/front.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-black/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-black/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-black/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-ladies-heavy-hoody-black/front.webp"
      },
      "status": "real"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/sleeve-left.webp",
        "sleeve_right": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/front.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusk-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-salvia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-id-333-hoodie": {
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-navy/front.webp",
        "back": "/products/bundc-id-333-hoodie-navy/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-navy/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-navy/front.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-black/front.webp",
        "back": "/products/bundc-id-333-hoodie-black/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-black/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-black/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-id-333-hoodie-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-white/front.webp",
        "back": "/products/bundc-id-333-hoodie-white/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-white/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-white/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-red/front.webp",
        "back": "/products/bundc-id-333-hoodie-red/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-red/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-red/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-royal-blue/front.webp",
        "back": "/products/bundc-id-333-hoodie-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-royal-blue/front.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-bottle-green/front.webp",
        "back": "/products/bundc-id-333-hoodie-bottle-green/back.webp",
        "sleeve_left": "/products/bundc-id-333-hoodie-bottle-green/front.webp",
        "sleeve_right": "/products/bundc-id-333-hoodie-bottle-green/front.webp"
      },
      "status": "real"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "nordic-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blush-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-king-hooded-sweat": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-navy-blue/front.webp",
        "back": "/products/bundc-king-hooded-sweat-navy-blue/front.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-navy-blue/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-navy-blue/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-white/front.webp",
        "back": "/products/bundc-king-hooded-sweat-white/back.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-white/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-white/front.webp"
      },
      "status": "real"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-red/front.webp",
        "back": "/products/bundc-king-hooded-sweat-red/back.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-red/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-red/front.webp"
      },
      "status": "real"
    },
    "dark-cherry": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "soft-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-royal-blue/front.webp",
        "back": "/products/bundc-king-hooded-sweat-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-royal-blue/front.webp"
      },
      "status": "real"
    },
    "pure-sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "nordic-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aqua-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-bottle-green/front.webp",
        "back": "/products/bundc-king-hooded-sweat-bottle-green/back.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-bottle-green/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-bottle-green/front.webp"
      },
      "status": "real"
    },
    "grey-fog": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-pure": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-heather-grey/front.webp",
        "back": "/products/bundc-king-hooded-sweat-heather-grey/back.webp",
        "sleeve_left": "/products/bundc-king-hooded-sweat-heather-grey/front.webp",
        "sleeve_right": "/products/bundc-king-hooded-sweat-heather-grey/front.webp"
      },
      "status": "real"
    },
    "heather-mid-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "1f2532": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-id-223-hoodie": {
    "black": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-black/front.webp",
        "back": "/products/bundc-id-223-hoodie-black/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-black/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-navy/front.webp",
        "back": "/products/bundc-id-223-hoodie-navy/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-navy/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-navy/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-id-223-hoodie-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-white/front.webp",
        "back": "/products/bundc-id-223-hoodie-white/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-white/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-white/front.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-royal-blue/front.webp",
        "back": "/products/bundc-id-223-hoodie-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-royal-blue/front.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-red/front.webp",
        "back": "/products/bundc-id-223-hoodie-red/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-red/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-red/front.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-forest-green/front.webp",
        "back": "/products/bundc-id-223-hoodie-forest-green/back.webp",
        "sleeve_left": "/products/bundc-id-223-hoodie-forest-green/front.webp",
        "sleeve_right": "/products/bundc-id-223-hoodie-forest-green/front.webp"
      },
      "status": "real"
    },
    "lake-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "acid-lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-influence-hoodie": {
    "black": {
      "views": {
        "front": "/products/bundc-influence-hoodie-black/front.webp",
        "back": "/products/bundc-influence-hoodie-black/back.webp",
        "sleeve_left": "/products/bundc-influence-hoodie-black/front.webp",
        "sleeve_right": "/products/bundc-influence-hoodie-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-influence-hoodie-navy/front.webp",
        "back": "/products/bundc-influence-hoodie-navy/back.webp",
        "sleeve_left": "/products/bundc-influence-hoodie-navy/front.webp",
        "sleeve_right": "/products/bundc-influence-hoodie-navy/front.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-influence-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-influence-hoodie-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-influence-hoodie-sport-grey-heather/front.webp",
        "sleeve_right": "/products/bundc-influence-hoodie-sport-grey-heather/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-influence-hoodie-white/front.webp",
        "back": "/products/bundc-influence-hoodie-white/back.webp",
        "sleeve_left": "/products/bundc-influence-hoodie-white/front.webp",
        "sleeve_right": "/products/bundc-influence-hoodie-white/front.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "amalfi-teal": {
      "views": {
        "front": "/products/bundc-influence-hoodie-amalfi-teal/front.webp",
        "back": "/products/bundc-influence-hoodie-amalfi-teal/back.webp",
        "sleeve_left": "/products/bundc-influence-hoodie-amalfi-teal/front.webp",
        "sleeve_right": "/products/bundc-influence-hoodie-amalfi-teal/front.webp"
      },
      "status": "real"
    }
  },
  "bundc-hoodie": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-hoodie-navy-blue/front.webp",
        "back": "/products/bundc-hoodie-navy-blue/front.webp",
        "sleeve_left": "/products/bundc-hoodie-navy-blue/front.webp",
        "sleeve_right": "/products/bundc-hoodie-navy-blue/front.webp"
      },
      "status": "real"
    },
    "elephant-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "desert": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "melon-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pale-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "nude": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pure-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/bundc-hoodie-red/front.webp",
        "back": "/products/bundc-hoodie-red/front.webp",
        "sleeve_left": "/products/bundc-hoodie-red/front.webp",
        "sleeve_right": "/products/bundc-hoodie-red/front.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "candy-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pale-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink-fizz": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lavender": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hawaiian-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-hoodie-royal-blue/front.webp",
        "back": "/products/bundc-hoodie-royal-blue/front.webp",
        "sleeve_left": "/products/bundc-hoodie-royal-blue/front.webp",
        "sleeve_right": "/products/bundc-hoodie-royal-blue/front.webp"
      },
      "status": "real"
    },
    "pure-sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-jade": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-fog": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black-pure": {
      "views": {
        "front": "/products/bundc-hoodie-black-pure/front.webp",
        "back": "/products/bundc-hoodie-black-pure/front.webp",
        "sleeve_left": "/products/bundc-hoodie-black-pure/front.webp",
        "sleeve_right": "/products/bundc-hoodie-black-pure/front.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-hoodie-heather-grey/front.webp",
        "back": "/products/bundc-hoodie-heather-grey/front.webp",
        "sleeve_left": "/products/bundc-hoodie-heather-grey/front.webp",
        "sleeve_right": "/products/bundc-hoodie-heather-grey/front.webp"
      },
      "status": "real"
    },
    "heather-mid-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-asphalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-dark-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-earth-positive-pullover-hoodie": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cherry-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-charcoal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burnt-yellow-mango": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "miami-pink-purple-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "rfd-ready-for-dye": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-beige-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-sage-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-earth-positive-women-s-half-zip-hoodie": {
    "sueded-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-light-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-fawn": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-pale-lemon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-miami-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-slate-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "7e8f62": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sueded-light-blue-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-earth-positive-super-heavy-hoodie": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-earthpositive-organic-mensunisex-pullover-hoodie": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mango": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "melange-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-unisex-organic-pullover-hood-ep": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "just-hoods-organic-hoodie-jh201": {
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ink-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "arctic-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "baby-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lavender": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural-stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "just-hoods-vision-heavyweight-hoodie": {
    "arctic-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "atlantic-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-lilac": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ice-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "moss-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural-clay": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural-stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solid-charcoal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-authentic-hooded-sweat": {
    "mocha": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ffffff": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "olive": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mineral-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "8fd491": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fac511": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-ladies-authentic-hood": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-hooded-sweatshirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fuchsia": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "just-hoods-signature-heavyweight-sweat": {
    "earthy-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "arctic-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "deep-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "heather-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "natural-stone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "solid-charcoal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "4f758b": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "4f413c": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jhk-hooded-sweater": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "kelly-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-premium-long-sleeve-t-shirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bone": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "rfd-ready-for-dye": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-beige-sand": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "gildan-ultra-cotton-long-sleeve-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "gold": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "irish-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "maroon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-green-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "safety-orange-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-men-s-long-sleeve-t-shirt-imperial": {
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "oxblood": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-melange": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/front.webp"
      },
      "status": "real"
    },
    "deep-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/front.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/front.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/front.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/sleeve-left.webp",
        "sleeve_right": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/front.webp"
      },
      "status": "real"
    },
    "mouse-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-ladies-long-sleeve-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-bottle-green/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-black/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-navy/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-red/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-red/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-white/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-royal/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-royal/front.webp",
        "sleeve_left": "/products/neutral-ladies-long-sleeve-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-ladies-long-sleeve-t-shirt-royal/front.webp"
      },
      "status": "real"
    }
  },
  "russell-classic-t-long-sleeve": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-t-shirt-e150-long-sleeve-unisex-exact": {
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bear-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-unisex-organic-longsleeve-t-shirt": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "faded-denim": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "denim-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-washed-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "f4f4ec": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "just-cool-long-sleeve-cool-t": {
    "purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "arctic-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "electric-yellow-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fire-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "jet-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "electric-green-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "electric-orange-neon": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-t-shirt-e150-long-sleeve-women-exact": {
    "urban-khaki": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bear-brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-mens-t-shirt-e190-long-sleeve-exact": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "urban-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-recycled-performance-long-sleeve-t-shirt": {
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "neutral-men-s-long-sleeve-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/front.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-black/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-black/front.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-navy/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-navy/front.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-white/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-white/front.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-charcoal/front.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-charcoal/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-charcoal/front.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "light-pink": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "b8b8b8": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bordeaux": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "military": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-red/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-red/front.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sapphire": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/_platzhalter/platzhalter.webp",
        "sleeve_right": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-royal/front.webp",
        "sleeve_right": "/products/neutral-men-s-long-sleeve-t-shirt-royal/front.webp"
      },
      "status": "real"
    }
  },
  "sols-men-s-plain-fleece-jacket-norman": {
    "black": {
      "views": {
        "front": "/products/sols-men-s-plain-fleece-jacket-norman-black/front.webp",
        "back": "/products/sols-men-s-plain-fleece-jacket-norman-black/back.webp"
      },
      "status": "real"
    },
    "charcoal-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/sols-men-s-plain-fleece-jacket-norman-navy/front.webp",
        "back": "/products/sols-men-s-plain-fleece-jacket-norman-navy/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-plain-fleece-jacket-norman-red/front.webp",
        "back": "/products/sols-men-s-plain-fleece-jacket-norman-red/back.webp"
      },
      "status": "real"
    }
  },
  "sols-women-s-plain-fleece-jacket-norman": {
    "black": {
      "views": {
        "front": "/products/sols-women-s-plain-fleece-jacket-norman-black/front.webp",
        "back": "/products/sols-women-s-plain-fleece-jacket-norman-black/back.webp"
      },
      "status": "real"
    },
    "charcoal-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/sols-women-s-plain-fleece-jacket-norman-navy/front.webp",
        "back": "/products/sols-women-s-plain-fleece-jacket-norman-navy/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-women-s-plain-fleece-jacket-norman-red/front.webp",
        "back": "/products/sols-women-s-plain-fleece-jacket-norman-red/back.webp"
      },
      "status": "real"
    }
  },
  "sols-women-s-fleecejacket-north": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-royal-blue/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-royal-blue/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-white/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-white/back.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-black/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-black/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "charcoal-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-purple": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fir-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "grey-melange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-navy/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-navy/back.webp"
      },
      "status": "real"
    },
    "neon-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "neon-yellow": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-red/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-red/back.webp"
      },
      "status": "real"
    },
    "rope": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-mens-factor-zipped-fleece-jacket": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-royal-blue/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-royal-blue/back.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-forest-green/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-forest-green/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-black/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-navy/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-navy/back.webp"
      },
      "status": "real"
    },
    "charcoal-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "rope": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-outdoor-fleece-jacke": {
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "bright-royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "classic-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "french-navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-men-s-fleece-jacket-jn": {
    "red": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-red/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-red/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-navy/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-navy/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-royal/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-black/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-black/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-white/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-white/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-dark-green/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-dark-green/back.webp"
      },
      "status": "real"
    }
  },
  "id-identity-microfleece-jacke": {
    "grau": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "weiss": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "rot": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "hellblau": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "schwarz": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "jamesnicholson-ladies-fleece-jacket-jn781": {
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-red/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-red/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-navy/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-royal/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-black/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-black/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-white/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-white/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "turquoise": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "lime-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-dark-green/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-dark-green/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-microfleece-duo-id501": {
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pumpkin-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "bundc-microfleece-duo-id501-women": {
    "atoll": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "forest-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "navy": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pumpkin-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  }
};
