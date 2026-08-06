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
        "back": "/products/bundc-t-shirt-e190-navy-blue/back.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-cobalt-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-cobalt-blue/back.webp"
      },
      "status": "real"
    },
    "stone-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-stone-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-stone-blue/back.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-urban-khaki/front.webp",
        "back": "/products/bundc-t-shirt-e190-urban-khaki/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-white/front.webp",
        "back": "/products/bundc-t-shirt-e190-white/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-black/front.webp",
        "back": "/products/bundc-t-shirt-e190-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-navy/front.webp",
        "back": "/products/bundc-t-shirt-e190-navy/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e190-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-royal-blue/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-red/front.webp",
        "back": "/products/bundc-t-shirt-e190-red/back.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-natural/front.webp",
        "back": "/products/bundc-t-shirt-e190-natural/back.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sand/front.webp",
        "back": "/products/bundc-t-shirt-e190-sand/back.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-solar-yellow/front.webp",
        "back": "/products/bundc-t-shirt-e190-solar-yellow/back.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-gold/front.webp",
        "back": "/products/bundc-t-shirt-e190-gold/back.webp"
      },
      "status": "real"
    },
    "apricot": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-apricot/front.webp",
        "back": "/products/bundc-t-shirt-e190-apricot/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-orange/front.webp",
        "back": "/products/bundc-t-shirt-e190-orange/back.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-urban-orange/front.webp",
        "back": "/products/bundc-t-shirt-e190-urban-orange/back.webp"
      },
      "status": "real"
    },
    "sunset-orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sunset-orange/front.webp",
        "back": "/products/bundc-t-shirt-e190-sunset-orange/back.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-fire-red/front.webp",
        "back": "/products/bundc-t-shirt-e190-fire-red/back.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-orchid-pink/front.webp",
        "back": "/products/bundc-t-shirt-e190-orchid-pink/back.webp"
      },
      "status": "real"
    },
    "sorbet": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sorbet/front.webp",
        "back": "/products/bundc-t-shirt-e190-sorbet/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-burgundy/front.webp",
        "back": "/products/bundc-t-shirt-e190-burgundy/back.webp"
      },
      "status": "real"
    },
    "swimming-pool": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-swimming-pool/front.webp",
        "back": "/products/bundc-t-shirt-e190-swimming-pool/back.webp"
      },
      "status": "real"
    },
    "atoll": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-atoll/front.webp",
        "back": "/products/bundc-t-shirt-e190-atoll/back.webp"
      },
      "status": "real"
    },
    "diva-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-diva-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-diva-blue/back.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-sky-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-sky-blue/back.webp"
      },
      "status": "real"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-millennial-lilac/front.webp",
        "back": "/products/bundc-t-shirt-e190-millennial-lilac/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-radiant-purple/front.webp",
        "back": "/products/bundc-t-shirt-e190-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-urban-purple/front.webp",
        "back": "/products/bundc-t-shirt-e190-urban-purple/back.webp"
      },
      "status": "real"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-pixel-lime/front.webp",
        "back": "/products/bundc-t-shirt-e190-pixel-lime/back.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-orchid-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-orchid-green/back.webp"
      },
      "status": "real"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-millennial-mint/front.webp",
        "back": "/products/bundc-t-shirt-e190-millennial-mint/back.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-kelly-green/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-bottle-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-bottle-green/back.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-ash-heather/front.webp",
        "back": "/products/bundc-t-shirt-e190-ash-heather/back.webp"
      },
      "status": "real"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-pacific-grey/front.webp",
        "back": "/products/bundc-t-shirt-e190-pacific-grey/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-dark-grey-solid/front.webp",
        "back": "/products/bundc-t-shirt-e190-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "used-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-used-black/front.webp",
        "back": "/products/bundc-t-shirt-e190-used-black/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-brown/front.webp",
        "back": "/products/bundc-t-shirt-e190-brown/back.webp"
      },
      "status": "real"
    },
    "chocolate": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-chocolate/front.webp",
        "back": "/products/bundc-t-shirt-e190-chocolate/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e190-women": {
    "urban-navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-urban-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-cobalt-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "stone-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-stone-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-urban-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-white/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-white/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-black/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-navy/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-navy/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-royal-blue/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-red/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-red/back.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-natural/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-solar-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "apricot": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-apricot/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-urban-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-fire-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunset-orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sunset-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-orchid-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sorbet": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sorbet/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "swimming-pool": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-swimming-pool/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "atoll": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-atoll/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "diva-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-diva-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-sky-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-millennial-lilac/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-radiant-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-urban-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-pixel-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-orchid-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-millennial-mint/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e190-women-kelly-green/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-pacific-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "used-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-used-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-brown/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "chocolate": {
      "views": {
        "front": "/products/bundc-t-shirt-e190-women-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-e150-t-shirt": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-navy-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-navy-blue/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-off-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-off-white/back.webp"
      },
      "status": "real"
    },
    "mocha": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-mocha/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-mocha/back.webp"
      },
      "status": "real"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-yellow-fizz/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-yellow-fizz/back.webp"
      },
      "status": "real"
    },
    "pure-orange": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-pure-orange/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-pure-orange/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-red/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-burgundy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-burgundy/back.webp"
      },
      "status": "real"
    },
    "soft-rose": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-soft-rose/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-soft-rose/back.webp"
      },
      "status": "real"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-magenta-pink/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-magenta-pink/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-radiant-purple/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-royal-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-royal-blue/back.webp"
      },
      "status": "real"
    },
    "blue-fog": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-blue-fog/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-blue-fog/back.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-sage/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-sage/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-lime/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-lime/back.webp"
      },
      "status": "real"
    },
    "apple-green": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-apple-green/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-apple-green/back.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-forest-green/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-forest-green/back.webp"
      },
      "status": "real"
    },
    "asphalt": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-asphalt/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-asphalt/back.webp"
      },
      "status": "real"
    },
    "black-pure": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-black-pure/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-black-pure/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-heather-grey/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-heather-grey/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-navy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-navy/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150": {
    "101145": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-101145/front.webp",
        "back": "/products/bundc-t-shirt-e150-101145/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-101145/sleeve-left.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-cobalt-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-cobalt-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-cobalt-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-urban-khaki/front.webp",
        "back": "/products/bundc-t-shirt-e150-urban-khaki/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-urban-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-white/front.webp",
        "back": "/products/bundc-t-shirt-e150-white/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e150-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-natural/front.webp",
        "back": "/products/bundc-t-shirt-e150-natural/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-sand/front.webp",
        "back": "/products/bundc-t-shirt-e150-sand/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-solar-yellow/front.webp",
        "back": "/products/bundc-t-shirt-e150-solar-yellow/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-solar-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-gold/front.webp",
        "back": "/products/bundc-t-shirt-e150-gold/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "apricot": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-apricot/front.webp",
        "back": "/products/bundc-t-shirt-e150-apricot/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-apricot/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-orange/front.webp",
        "back": "/products/bundc-t-shirt-e150-orange/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-fire-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-fire-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-fire-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-deep-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-deep-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-deep-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-fuchsia/front.webp",
        "back": "/products/bundc-t-shirt-e150-fuchsia/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-fuchsia/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-burgundy/front.webp",
        "back": "/products/bundc-t-shirt-e150-burgundy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-turquoise/front.webp",
        "back": "/products/bundc-t-shirt-e150-turquoise/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "atoll": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-atoll/front.webp",
        "back": "/products/bundc-t-shirt-e150-atoll/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-atoll/sleeve-left.webp"
      },
      "status": "real"
    },
    "real-turquoise": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-real-turquoise/front.webp",
        "back": "/products/bundc-t-shirt-e150-real-turquoise/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-real-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "diva-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-diva-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-diva-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-diva-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-sky-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-sky-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "azure": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-azure/front.webp",
        "back": "/products/bundc-t-shirt-e150-azure/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-azure/sleeve-left.webp"
      },
      "status": "real"
    },
    "denim": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-denim/front.webp",
        "back": "/products/bundc-t-shirt-e150-denim/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-denim/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-light-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-light-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-light-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-radiant-purple/front.webp",
        "back": "/products/bundc-t-shirt-e150-radiant-purple/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-radiant-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "pistachio": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-pistachio/front.webp",
        "back": "/products/bundc-t-shirt-e150-pistachio/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-pistachio/sleeve-left.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-orchid-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-orchid-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-orchid-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-kelly-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-bottle-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-bottle-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-ash-heather/front.webp",
        "back": "/products/bundc-t-shirt-e150-ash-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-dark-grey-solid/front.webp",
        "back": "/products/bundc-t-shirt-e150-dark-grey-solid/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "used-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-used-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-used-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-used-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bear-brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-bear-brown/front.webp",
        "back": "/products/bundc-t-shirt-e150-bear-brown/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-bear-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-urban-purple/front.webp",
        "back": "/products/bundc-t-shirt-e150-urban-purple/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-urban-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "electric-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-electric-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-electric-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-electric-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-urban-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-urban-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-urban-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-millennial-pink/front.webp",
        "back": "/products/bundc-t-shirt-e150-millennial-pink/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-millennial-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-millennial-khaki/front.webp",
        "back": "/products/bundc-t-shirt-e150-millennial-khaki/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-millennial-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-navy/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-e150-t-shirt-women": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-navy-blue/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-white/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-red/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-red/back.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-off-white/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-off-white/back.webp"
      },
      "status": "real"
    },
    "mocha": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-mocha/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-mocha/back.webp"
      },
      "status": "real"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-yellow-fizz/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-yellow-fizz/back.webp"
      },
      "status": "real"
    },
    "pure-orange": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-pure-orange/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-pure-orange/back.webp"
      },
      "status": "real"
    },
    "soft-rose": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-soft-rose/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-soft-rose/back.webp"
      },
      "status": "real"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-magenta-pink/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-magenta-pink/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-radiant-purple/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-burgundy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-burgundy/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-royal-blue/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-royal-blue/back.webp"
      },
      "status": "real"
    },
    "blue-fog": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-blue-fog/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-blue-fog/back.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-sage/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-sage/back.webp"
      },
      "status": "real"
    },
    "apple-green": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-apple-green/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-apple-green/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-heather-grey/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-heather-grey/back.webp"
      },
      "status": "real"
    },
    "asphalt": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-asphalt/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-asphalt/back.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-forest-green/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-forest-green/back.webp"
      },
      "status": "real"
    },
    "black-pure": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-black-pure/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-black-pure/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-lime/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-lime/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-e150-t-shirt-women-navy/front.webp",
        "back": "/products/bundc-inspire-e150-t-shirt-women-navy/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150-women": {
    "urban-navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-urban-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-urban-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-urban-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-cobalt-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-cobalt-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-cobalt-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-urban-khaki/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-urban-khaki/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-urban-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-white/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-white/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-royal-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-sport-grey-heather/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-natural/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-natural/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-sand/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-sand/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-millennial-pink/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-millennial-pink/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-millennial-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-solar-yellow/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-solar-yellow/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-solar-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-gold/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-gold/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "apricot": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-apricot/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-apricot/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-apricot/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-orange/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-orange/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-fire-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-fire-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-fire-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-deep-red/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-deep-red/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-deep-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-fuchsia/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-fuchsia/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-fuchsia/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-burgundy/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-burgundy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-turquoise/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-turquoise/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "atoll": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-atoll/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-turquoise": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-real-turquoise/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-real-turquoise/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-real-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "diva-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-diva-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-diva-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-diva-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-sky-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-sky-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "azure": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-azure/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-azure/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-azure/sleeve-left.webp"
      },
      "status": "real"
    },
    "denim": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-denim/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-denim/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-denim/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-light-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-light-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-light-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "electric-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-electric-blue/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-electric-blue/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-electric-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-radiant-purple/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-radiant-purple/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-radiant-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-urban-purple/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-urban-purple/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-urban-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "pistachio": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-pistachio/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-pistachio/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-pistachio/sleeve-left.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-orchid-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-orchid-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-orchid-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-kelly-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-kelly-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-bottle-green/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-bottle-green/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-millennial-khaki/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-millennial-khaki/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-millennial-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-dark-grey-solid/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-dark-grey-solid/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "used-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-used-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-used-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-used-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-urban-black/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-urban-black/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-urban-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bear-brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-bear-brown/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-bear-brown/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-bear-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-women-navy/front.webp",
        "back": "/products/bundc-t-shirt-e150-women-navy/back.webp",
        "sleeve_left": "/products/bundc-t-shirt-e150-women-navy/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "bundc-e220-t": {
    "black": {
      "views": {
        "front": "/products/bundc-e220-t-black/front.webp",
        "back": "/products/bundc-e220-t-black/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-e220-t-white/front.webp",
        "back": "/products/bundc-e220-t-white/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-e220-t-navy/front.webp",
        "back": "/products/bundc-e220-t-navy/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-e220-t-dark-grey-solid/front.webp",
        "back": "/products/bundc-e220-t-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/bundc-e220-t-off-white/front.webp",
        "back": "/products/bundc-e220-t-off-white/back.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-e220-t-khaki/front.webp",
        "back": "/products/bundc-e220-t-khaki/back.webp"
      },
      "status": "real"
    },
    "lake-blue": {
      "views": {
        "front": "/products/bundc-e220-t-lake-blue/front.webp",
        "back": "/products/bundc-e220-t-lake-blue/back.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-e220-t-mastic/front.webp",
        "back": "/products/bundc-e220-t-mastic/back.webp"
      },
      "status": "real"
    },
    "amalfi-teal": {
      "views": {
        "front": "/products/bundc-e220-t-amalfi-teal/front.webp",
        "back": "/products/bundc-e220-t-amalfi-teal/back.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/bundc-e220-t-orchid-pink/front.webp",
        "back": "/products/bundc-e220-t-orchid-pink/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-v-t-men": {
    "black": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-light-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-v-t-men-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-v-t-women": {
    "black": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-light-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-v-t-women-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-t-men": {
    "atoll": {
      "views": {
        "front": "/products/bundc-inspire-t-men-atoll/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-t-men-black/front.webp",
        "back": "/products/bundc-inspire-t-men-black/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-t-men-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/bundc-inspire-t-men-fuchsia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-inspire-t-men-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-inspire-t-men-khaki/front.webp",
        "back": "/products/bundc-inspire-t-men-khaki/back.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/bundc-inspire-t-men-light-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-t-men-navy/front.webp",
        "back": "/products/bundc-inspire-t-men-navy/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-inspire-t-men-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-green": {
      "views": {
        "front": "/products/bundc-inspire-t-men-real-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-t-men-red/front.webp",
        "back": "/products/bundc-inspire-t-men-red/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-t-men-royal-blue/front.webp",
        "back": "/products/bundc-inspire-t-men-royal-blue/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-t-men-white/front.webp",
        "back": "/products/bundc-inspire-t-men-white/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-inspire-t-men-sport-grey-heather/front.webp",
        "back": "/products/bundc-inspire-t-men-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/bundc-inspire-t-men-millennial-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-inspire-t-men-millennial-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-inspire-t-men-urban-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-inspire-t-men-urban-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-t-women": {
    "atoll": {
      "views": {
        "front": "/products/bundc-inspire-t-women-atoll/front.webp",
        "back": "/products/bundc-inspire-t-women-atoll/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-t-women-black/front.webp",
        "back": "/products/bundc-inspire-t-women-black/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-t-women-dark-grey-solid/front.webp",
        "back": "/products/bundc-inspire-t-women-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/bundc-inspire-t-women-fuchsia/front.webp",
        "back": "/products/bundc-inspire-t-women-fuchsia/back.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/bundc-inspire-t-women-gold/front.webp",
        "back": "/products/bundc-inspire-t-women-gold/back.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-inspire-t-women-khaki/front.webp",
        "back": "/products/bundc-inspire-t-women-khaki/back.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/bundc-inspire-t-women-light-grey/front.webp",
        "back": "/products/bundc-inspire-t-women-light-grey/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-inspire-t-women-navy/front.webp",
        "back": "/products/bundc-inspire-t-women-navy/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-inspire-t-women-orange/front.webp",
        "back": "/products/bundc-inspire-t-women-orange/back.webp"
      },
      "status": "real"
    },
    "real-green": {
      "views": {
        "front": "/products/bundc-inspire-t-women-real-green/front.webp",
        "back": "/products/bundc-inspire-t-women-real-green/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-inspire-t-women-red/front.webp",
        "back": "/products/bundc-inspire-t-women-red/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-inspire-t-women-royal-blue/front.webp",
        "back": "/products/bundc-inspire-t-women-royal-blue/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-t-women-white/front.webp",
        "back": "/products/bundc-inspire-t-women-white/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-inspire-t-women-sport-grey-heather/front.webp",
        "back": "/products/bundc-inspire-t-women-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-inspire-t-women-millennial-pink/front.webp",
        "back": "/products/bundc-inspire-t-women-millennial-pink/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-women-millennial-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-inspire-t-women-urban-orange/front.webp",
        "back": "/products/bundc-inspire-t-women-urban-orange/back.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-inspire-t-women-urban-purple/front.webp",
        "back": "/products/bundc-inspire-t-women-urban-purple/back.webp",
        "sleeve_left": "/products/bundc-inspire-t-women-urban-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/bundc-inspire-t-women-millennial-khaki/front.webp",
        "back": "/products/bundc-inspire-t-women-millennial-khaki/back.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-round-t-heavy": {
    "aubergine": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-aubergine/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-aubergine/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-aubergine/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-olive/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-olive/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-wine/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-acid-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-acid-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-aqua/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-ash-heather/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-ash-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-black/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-brown/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-dark-green/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-dark-grey-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-orange": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-dark-orange/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-dark-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-dark-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-dark-royal/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-dark-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-dark-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "fern-green": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-fern-green/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-fern-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-fern-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-gold-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-gold-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-grenadine/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-grenadine/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-grenadine/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-grey-heather/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-irish-green/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-irish-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-khaki/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-khaki/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-light-blue/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-light-grey/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-light-grey/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-light-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-yellow": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-light-yellow/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-light-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-light-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-lilac/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-lilac/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-lime-green/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mint": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-mint/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-mint/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-navy/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-orange/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pacific": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-pacific/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-pacific/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-pacific/sleeve-left.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-petrol/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-petrol/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-petrol/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-pink/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-pink/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-purple/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-red/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-rose/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-rose/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-royal/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-sky-blue/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-sky-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-stone/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "tomato": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-tomato/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-tomato/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-tomato/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-turquoise/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-white/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-round-t-heavy-yellow/front.webp",
        "back": "/products/jamesnicholson-round-t-heavy-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-round-t-heavy-yellow/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-ladies-active-t": {
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-acid-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-acid-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-black/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-melange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-dark-melange/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-dark-melange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-dark-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-green/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-grenadine/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-grenadine/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-grenadine/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-melange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-light-melange/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-light-melange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-light-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-lime-green/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-orange/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pacific": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-pacific/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-pacific/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-pacific/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-pink/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-pink/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-purple/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-red/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-turquoise/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-white/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-active-t-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-active-t-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-active-t-yellow/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-men-s-basic-t": {
    "light-denim-melange": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-light-denim-melange/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-light-denim-melange/back.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-olive/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-olive/back.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-wine/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-wine/back.webp"
      },
      "status": "real"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-acid-yellow/back.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-ash-heather/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-ash-heather/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-black/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "black-heather": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-black-heather/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-black-heather/back.webp"
      },
      "status": "real"
    },
    "cobalt": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-cobalt/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-cobalt/back.webp"
      },
      "status": "real"
    },
    "coral": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-coral/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-dark-green/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-dark-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-dark-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-dark-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-gold-yellow/back.webp"
      },
      "status": "real"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-graphite-solid/back.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-grey-heather/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-lime-green/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-lime-green/back.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-natural/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-natural/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-navy/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-orange/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-orange/back.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-petrol/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-petrol/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-red/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-sky-blue/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-sky-blue/back.webp"
      },
      "status": "real"
    },
    "steel-grey": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-steel-grey/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-steel-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-white/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-basic-t-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-yellow/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-yellow/back.webp"
      },
      "status": "real"
    },
    "vanilla": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-vanilla/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-vanilla/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-light-blue/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-light-blue/back.webp"
      },
      "status": "real"
    },
    "soft-grey": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-soft-grey/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-soft-grey/back.webp"
      },
      "status": "real"
    },
    "jade-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-basic-t-jade-green/front.webp",
        "back": "/products/jamesnicholson-men-s-basic-t-jade-green/back.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-ladies-basic-t": {
    "aubergine": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-aubergine/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-aubergine/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-aubergine/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-olive/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-olive/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-wine/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-acid-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-acid-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-aqua/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-ash-heather/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-ash-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-black/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-brown/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-dark-green/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-dark-grey-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-orange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-dark-orange/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-dark-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-dark-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-dark-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-dark-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-dark-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "fern-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-fern-green/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-fern-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-fern-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-gold-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-gold-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-grenadine/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-grenadine/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-grenadine/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-grey-heather/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-irish-green/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-irish-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-khaki/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-khaki/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-light-blue/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-light-grey/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-light-grey/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-light-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-light-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-light-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-light-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-lilac/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-lilac/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-lime-green/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mint": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-mint/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-mint/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-orange/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pacific": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-pacific/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-pacific/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-pacific/sleeve-left.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-petrol/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-petrol/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-petrol/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-pink/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-pink/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-purple/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-red/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-rose/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-rose/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-sky-blue/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-sky-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-stone/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "tomato": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-tomato/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-tomato/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-tomato/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-turquoise/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-white/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-basic-t-yellow/front.webp",
        "back": "/products/jamesnicholson-ladies-basic-t-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-basic-t-yellow/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-workwear-t-men": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-black/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-grey-heather/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-light-blue/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-orange/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-red/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-royal/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-men-white/front.webp",
        "back": "/products/jamesnicholson-workwear-t-men-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-men-white/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-workwear-t-women": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-black/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-dark-green/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-grey-heather/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-grey-heather/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-light-blue/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-light-blue/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-orange/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-orange/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-red/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-royal/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-t-women-white/front.webp",
        "back": "/products/jamesnicholson-workwear-t-women-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-t-women-white/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-mens-bio-workwear-t-shirt": {
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-wine/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-stone/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-gold-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-orange/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-aqua/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-turquoise/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-grey-heather/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-grey-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-brown/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-lime-green/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/front.webp",
        "back": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-mens-bio-workwear-t-shirt-dark-green/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-ladies-bio-workwear-t-shirt": {
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-wine/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-stone/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-gold-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-orange/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-aqua/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-turquoise/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-grey-heather/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-grey-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-brown/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-lime-green/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/front.webp",
        "back": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-ladies-bio-workwear-t-shirt-dark-green/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "russell-russell-classic-t": {
    "mocha": {
      "views": {
        "front": "/products/russell-russell-classic-t-mocha/front.webp",
        "back": "/products/russell-russell-classic-t-mocha/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-mocha/sleeve-left.webp"
      },
      "status": "real"
    },
    "0062ae": {
      "views": {
        "front": "/products/russell-russell-classic-t-0062ae/front.webp",
        "back": "/products/russell-russell-classic-t-0062ae/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-0062ae/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-russell-classic-t-black/front.webp",
        "back": "/products/russell-russell-classic-t-black/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-russell-classic-t-bottle-green/front.webp",
        "back": "/products/russell-russell-classic-t-bottle-green/back.webp"
      },
      "status": "real"
    },
    "bright-red": {
      "views": {
        "front": "/products/russell-russell-classic-t-bright-red/front.webp",
        "back": "/products/russell-russell-classic-t-bright-red/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-bright-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-russell-classic-t-bright-royal/front.webp",
        "back": "/products/russell-russell-classic-t-bright-royal/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-russell-classic-t-burgundy/front.webp",
        "back": "/products/russell-russell-classic-t-burgundy/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-russell-classic-t-classic-red/front.webp",
        "back": "/products/russell-russell-classic-t-classic-red/back.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-russell-classic-t-convoy-grey-solid/front.webp",
        "back": "/products/russell-russell-classic-t-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-russell-classic-t-french-navy/front.webp",
        "back": "/products/russell-russell-classic-t-french-navy/back.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-russell-classic-t-light-oxford-heather/front.webp",
        "back": "/products/russell-russell-classic-t-light-oxford-heather/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-light-oxford-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/russell-russell-classic-t-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-russell-classic-t-sky/front.webp",
        "back": "/products/russell-russell-classic-t-sky/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-sky/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-russell-classic-t-white/front.webp",
        "back": "/products/russell-russell-classic-t-white/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/russell-russell-classic-t-yellow/front.webp",
        "back": "/products/russell-russell-classic-t-yellow/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/russell-russell-classic-t-natural/front.webp",
        "back": "/products/russell-russell-classic-t-natural/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/russell-russell-classic-t-olive/front.webp",
        "back": "/products/russell-russell-classic-t-olive/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "mineral-blue": {
      "views": {
        "front": "/products/russell-russell-classic-t-mineral-blue/front.webp",
        "back": "/products/russell-russell-classic-t-mineral-blue/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-mineral-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "indigo": {
      "views": {
        "front": "/products/russell-russell-classic-t-indigo/front.webp",
        "back": "/products/russell-russell-classic-t-indigo/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-indigo/sleeve-left.webp"
      },
      "status": "real"
    },
    "powder-rose": {
      "views": {
        "front": "/products/russell-russell-classic-t-powder-rose/front.webp",
        "back": "/products/russell-russell-classic-t-powder-rose/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-powder-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "tan": {
      "views": {
        "front": "/products/russell-russell-classic-t-tan/front.webp",
        "back": "/products/russell-russell-classic-t-tan/back.webp",
        "sleeve_left": "/products/russell-russell-classic-t-tan/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "russell-classic-heavyweight-t-shirt": {
    "black": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-black/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-black/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-bright-royal/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-bright-royal/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-bright-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-classic-red/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-classic-red/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-classic-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-french-navy/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-french-navy/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-white/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-white/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "tan": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-tan/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-tan/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-tan/sleeve-left.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-convoy-grey-solid/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "petrol-blue": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-petrol-blue/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-petrol-blue/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-petrol-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-heather": {
      "views": {
        "front": "/products/russell-classic-heavyweight-t-shirt-sport-heather/front.webp",
        "back": "/products/russell-classic-heavyweight-t-shirt-sport-heather/back.webp",
        "sleeve_left": "/products/russell-classic-heavyweight-t-shirt-sport-heather/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "russell-mens-pure-organic-heavy-tee": {
    "white": {
      "views": {
        "front": "/products/russell-mens-pure-organic-heavy-tee-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-mens-pure-organic-heavy-tee-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "555b66": {
      "views": {
        "front": "/products/russell-mens-pure-organic-heavy-tee-555b66/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-mens-pure-organic-heavy-tee-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-ladies-pure-organic-heavy-tee": {
    "white": {
      "views": {
        "front": "/products/russell-ladies-pure-organic-heavy-tee-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-ladies-pure-organic-heavy-tee-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "555b66": {
      "views": {
        "front": "/products/russell-ladies-pure-organic-heavy-tee-555b66/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-ladies-pure-organic-heavy-tee-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-mens-pure-organic-v-neck-tee": {
    "white": {
      "views": {
        "front": "/products/russell-mens-pure-organic-v-neck-tee-white/front.webp",
        "back": "/products/russell-mens-pure-organic-v-neck-tee-white/back.webp",
        "sleeve_left": "/products/russell-mens-pure-organic-v-neck-tee-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-mens-pure-organic-v-neck-tee-black/front.webp",
        "back": "/products/russell-mens-pure-organic-v-neck-tee-black/back.webp",
        "sleeve_left": "/products/russell-mens-pure-organic-v-neck-tee-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-mens-pure-organic-v-neck-tee-french-navy/front.webp",
        "back": "/products/russell-mens-pure-organic-v-neck-tee-french-navy/back.webp",
        "sleeve_left": "/products/russell-mens-pure-organic-v-neck-tee-french-navy/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "gildan-ultra-cotton-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-navy/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "metro-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-metro-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "stone-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-stone-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "azalea": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-azalea/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-blue-dusk/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-cardinal-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-carolina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-charcoal-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cherry-red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-cherry-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cornsilk": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-cornsilk/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "daisy": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-daisy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-dark-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-forest-green/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-forest-green/back.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-cardinal": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-heather-cardinal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-navy": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-heather-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heliconia": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-heliconia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ice-grey-solid": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-ice-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "indigo-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-indigo-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "iris": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-iris/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-irish-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "jade-dome": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-jade-dome/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-kiwi/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-light-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-maroon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-military-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-natural/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-olive/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orchid": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-orchid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pistachio": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-pistachio/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "prairie-dust": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-prairie-dust/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-sapphire/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "tan": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-tan/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "tangerine": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-tangerine/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "texas-orange": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-texas-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "vegas-gold": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-vegas-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-ash-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-black/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-red/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-royal/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-royal/back.webp"
      },
      "status": "real"
    },
    "safety-green-neon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-safety-green-neon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "safety-orange-neon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-safety-orange-neon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ultra-cotton-t-shirt-white/front.webp",
        "back": "/products/gildan-ultra-cotton-t-shirt-white/back.webp"
      },
      "status": "real"
    }
  },
  "gildan-light-cotton-adult-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "graphite-heather": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-graphite-heather/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-graphite-heather/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-graphite-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-charcoal-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-light-pink/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-light-pink/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-military-green/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-military-green/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-military-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-sand/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-sand/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-sport-grey-heather/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-sport-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-ash-grey-heather/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-ash-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-ash-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "cherry-red": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-cherry-red/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-cherry-red/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-cherry-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "daisy": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-daisy/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-daisy/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-daisy/sleeve-left.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-forest-green/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-forest-green/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-forest-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "heliconia": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-heliconia/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-heliconia/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-heliconia/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-irish-green/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-irish-green/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-maroon/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-maroon/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-maroon/sleeve-left.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-off-white/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-off-white/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-off-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-orange/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-orange/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-purple/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-purple/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "safety-green": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-safety-green/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-safety-green/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-safety-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-sage/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-sage/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-sage/sleeve-left.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-sapphire/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-sapphire/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-sapphire/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/gildan-light-cotton-adult-t-shirt-sky/front.webp",
        "back": "/products/gildan-light-cotton-adult-t-shirt-sky/back.webp",
        "sleeve_left": "/products/gildan-light-cotton-adult-t-shirt-sky/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "neutral-men-s-classic-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "nature": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-nature/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-nature/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-light-blue/back.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-dusty-indigo/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-orange/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-orange/back.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-pink/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-pink/back.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-dusty-mint/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-lime/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-lime/back.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-sapphire/back.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-military/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-military/back.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-charcoal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-sand/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-sand/back.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-teal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-purple/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-purple/back.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-light-pink/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-brown/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-brown/back.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-dusty-yellow/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-dusty-yellow/back.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-okay-orange/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-okay-orange/back.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-dusty-purple/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-dusty-purple/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-sports-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-green/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-yellow/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-classic-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-classic-t-shirt-royal/back.webp"
      },
      "status": "real"
    }
  },
  "neutral-oversized-t-shirt": {
    "215732": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-215732/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sport-grey": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-sport-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-brown/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "raw": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-raw/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-teal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-dusty-indigo/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-dusty-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-oversized-t-shirt-dusty-mint/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "neutral-ladies-classic-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "nature": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-nature/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-nature/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-light-blue/back.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-dusty-indigo/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-orange/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-orange/back.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-pink/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-pink/back.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-dusty-mint/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-lime/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-lime/back.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-military/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-military/back.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-sapphire/back.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-charcoal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-sand/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-sand/back.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-teal/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-teal/back.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-purple/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-purple/back.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-light-pink/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-brown/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-brown/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-dusty-yellow/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-dusty-yellow/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-dusty-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-okay-orange/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-okay-orange/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-okay-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-dusty-purple/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-dusty-purple/back.webp",
        "sleeve_left": "/products/neutral-ladies-classic-t-shirt-dusty-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-black/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-navy/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-red/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-sports-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-white/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-green/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-yellow/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-classic-t-shirt-royal/front.webp",
        "back": "/products/neutral-ladies-classic-t-shirt-royal/back.webp"
      },
      "status": "real"
    }
  },
  "neutral-men-s-fit-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-bottle-green/back.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-teal/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-teal/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-teal/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-dusty-purple/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-dusty-purple/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-dusty-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-dusty-yellow/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-dusty-yellow/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-dusty-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-okay-orange/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-okay-orange/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-okay-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-brown/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-brown/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-charcoal/back.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-dusty-indigo/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-dusty-indigo/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-dusty-mint/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-dusty-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-light-pink/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-sports-grey/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-sports-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "ash-grey": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-ash-grey/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-ash-grey/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-ash-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-dark-heather/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-dark-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-bordeaux/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-bordeaux/sleeve-left.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-green/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-green/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-light-blue/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-military/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-military/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-military/sleeve-left.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-natural/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-natural/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-orange/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-orange/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-pink/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-pink/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-royal/back.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-sapphire/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-sapphire/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-yellow/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-yellow/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-lime/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-lime/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-lime/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-purple/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-purple/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-sand/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-sand/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/neutral-men-s-fit-t-shirt-white-navy-striped/front.webp",
        "back": "/products/neutral-men-s-fit-t-shirt-white-navy-striped/back.webp",
        "sleeve_left": "/products/neutral-men-s-fit-t-shirt-white-navy-striped/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "neutral-unisex-performance-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-white/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-white/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-charcoal/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-black/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-black/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-dusty-indigo/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-sapphire/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-navy/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-navy/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-red/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-red/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-okay-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-dusty-mint/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-bordeaux/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-dusty-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-dusty-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-royal/front.webp",
        "back": "/products/neutral-unisex-performance-t-shirt-royal/back.webp",
        "sleeve_left": "/products/neutral-unisex-performance-t-shirt-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-military/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-unisex-performance-t-shirt-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "neutral-ladies-fit-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-bottle-green/back.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-teal/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-teal/back.webp",
        "sleeve_left": "/products/neutral-ladies-fit-t-shirt-teal/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-dusty-purple/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-dusty-purple/back.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-dusty-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-okay-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-brown/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-brown/back.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-charcoal/back.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-dusty-indigo/back.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-dusty-mint/back.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-light-pink/back.webp"
      },
      "status": "real"
    },
    "ash-grey": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-ash-grey/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-ash-grey/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-black/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-green/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-light-blue/back.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-military/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-military/back.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-natural/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-natural/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-navy/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-orange/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-orange/back.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-pink/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-pink/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-red/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-sapphire/back.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-sports-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-white/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-yellow/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-lime/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-lime/back.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-purple/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-purple/back.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-sand/front.webp",
        "back": "/products/neutral-ladies-fit-t-shirt-sand/back.webp"
      },
      "status": "real"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/neutral-ladies-fit-t-shirt-white-navy-striped/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "neutral-unisex-regular-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-dusty-indigo/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-dusty-indigo/sleeve-left.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-sapphire/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-sapphire/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-lime/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-lime/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-lime/sleeve-left.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-military/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-military/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-military/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
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
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-sports-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-green/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-yellow/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "ash-grey": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-sand/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-sand/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-teal/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-teal/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-teal/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-dusty-mint/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-dusty-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-light-blue/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-light-pink/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-charcoal/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-charcoal/sleeve-left.webp"
      },
      "status": "real"
    },
    "nature": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-nature/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-nature/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-nature/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-brown/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-brown/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-yellow": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-dusty-yellow/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-dusty-yellow/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-dusty-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "okay-orange": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-okay-orange/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-okay-orange/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-okay-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-orange/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-orange/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-pink/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-pink/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-purple/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-purple/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-purple": {
      "views": {
        "front": "/products/neutral-unisex-regular-t-shirt-dusty-purple/front.webp",
        "back": "/products/neutral-unisex-regular-t-shirt-dusty-purple/back.webp",
        "sleeve_left": "/products/neutral-unisex-regular-t-shirt-dusty-purple/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "stedman-stedman-classic-t": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-slate-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy-red": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-burgundy-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-berry": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-deep-berry/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "hunters-green": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-hunters-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-kiwi-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy-blue": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-ocean-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-grey": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-real-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-lime": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-bright-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "brilliant-orange": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-brilliant-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "soft-grey": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-soft-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-sunflower-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "denim-blue": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-denim-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "marina-blue": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-marina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-bordeaux/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-natural/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-sweet-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "f7a30a": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-f7a30a/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "5a6f5e": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-5a6f5e/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/stedman-stedman-classic-t-teal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "stedman-classic-t-for-women": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-slate-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy-red": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-burgundy-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-berry": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-deep-berry/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "hunters-green": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-hunters-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-kiwi-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy-blue": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-ocean-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-grey": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-real-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-sweet-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-lime": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-bright-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "brilliant-orange": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-brilliant-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "soft-grey": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-soft-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-sunflower-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "denim-blue": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-denim-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "marina-blue": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-marina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-bordeaux/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-natural/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "f7a30a": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-f7a30a/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "5a6f5e": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-5a6f5e/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-teal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/stedman-classic-t-for-women-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "stedman-classic-t-v-neck": {
    "747679": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-747679/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-berry": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-deep-berry/front.webp",
        "back": "/products/stedman-classic-t-v-neck-deep-berry/back.webp",
        "sleeve_left": "/products/stedman-classic-t-v-neck-deep-berry/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-kiwi-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy-blue": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-ocean-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-sunflower-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "1c9a2c": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-1c9a2c/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "stedman-classic-t-v-neck-for-women": {
    "747679": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-747679/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-berry": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-deep-berry/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-kiwi-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy-blue": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-ocean-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sweet-pink": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-sweet-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-bottle-green/front.webp",
        "back": "/products/stedman-classic-t-v-neck-for-women-bottle-green/back.webp",
        "sleeve_left": "/products/stedman-classic-t-v-neck-for-women-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-sunflower-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "1c9a2c": {
      "views": {
        "front": "/products/stedman-classic-t-v-neck-for-women-1c9a2c/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "stedman-comfort-t": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/stedman-comfort-t-slate-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-comfort-t-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-comfort-t-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/stedman-comfort-t-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/stedman-comfort-t-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-comfort-t-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/stedman-comfort-t-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy-blue": {
      "views": {
        "front": "/products/stedman-comfort-t-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/stedman-comfort-t-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-grey": {
      "views": {
        "front": "/products/stedman-comfort-t-real-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-comfort-t-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-comfort-t-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/stedman-comfort-t-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/stedman-comfort-t-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sunflower-yellow": {
      "views": {
        "front": "/products/stedman-comfort-t-sunflower-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "marina-blue": {
      "views": {
        "front": "/products/stedman-comfort-t-marina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "89163e": {
      "views": {
        "front": "/products/stedman-comfort-t-89163e/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dac9af": {
      "views": {
        "front": "/products/stedman-comfort-t-dac9af/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kiwi-green": {
      "views": {
        "front": "/products/stedman-comfort-t-kiwi-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/stedman-comfort-t-military-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "soft-grey": {
      "views": {
        "front": "/products/stedman-comfort-t-soft-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "stedman-clive-crew-neck": {
    "slate-grey-solid": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-slate-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-opal": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-black-opal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-bordeaux/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "king-blue": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-king-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "marina-blue": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-marina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "salmon": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-salmon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-midnight": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-blue-midnight/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "scarlet-red": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-scarlet-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "293e11": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-293e11/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "051733": {
      "views": {
        "front": "/products/stedman-clive-crew-neck-051733/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-unisex-polo-id-001": {
    "anthracite": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-anthracite/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "atoll": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-atoll/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-atoll/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-black/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-black/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-bottle-green/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-bottle-green/back.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-brown/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-brown/back.webp"
      },
      "status": "real"
    },
    "chili-gold": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-chili-gold/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-chili-gold/back.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-fuchsia/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-fuchsia/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-heather-grey/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-heather-grey/back.webp"
      },
      "status": "real"
    },
    "009149": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-009149/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-009149/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-light-blue/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-light-blue/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-navy/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-navy/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-orange/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-orange/back.webp"
      },
      "status": "real"
    },
    "pixel-coral": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-pixel-coral/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-pixel-coral/back.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "real-green": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-real-green/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-real-green/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-red/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-red/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-royal-blue/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-royal-blue/back.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-sand/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-sand/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-white/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-white/back.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/bundc-unisex-polo-id-001-wine/front.webp",
        "back": "/products/bundc-unisex-polo-id-001-wine/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-my-polo-180": {
    "dark-forest": {
      "views": {
        "front": "/products/bundc-my-polo-180-dark-forest/front.webp",
        "back": "/products/bundc-my-polo-180-dark-forest/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-dark-forest/sleeve-left.webp"
      },
      "status": "real"
    },
    "camo-green": {
      "views": {
        "front": "/products/bundc-my-polo-180-camo-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-polo-180-black/front.webp",
        "back": "/products/bundc-my-polo-180-black/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-polo-180-navy/front.webp",
        "back": "/products/bundc-my-polo-180-navy/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-polo-180-white/front.webp",
        "back": "/products/bundc-my-polo-180-white/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-my-polo-180-dark-grey-solid/front.webp",
        "back": "/products/bundc-my-polo-180-dark-grey-solid/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-my-polo-180-sport-grey-heather/front.webp",
        "back": "/products/bundc-my-polo-180-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-polo-180-royal-blue/front.webp",
        "back": "/products/bundc-my-polo-180-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-polo-180-red/front.webp",
        "back": "/products/bundc-my-polo-180-red/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/bundc-my-polo-180-off-white/front.webp",
        "back": "/products/bundc-my-polo-180-off-white/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-off-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-my-polo-180-mastic/front.webp",
        "back": "/products/bundc-my-polo-180-mastic/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-mastic/sleeve-left.webp"
      },
      "status": "real"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/bundc-my-polo-180-roasted-coffee/front.webp",
        "back": "/products/bundc-my-polo-180-roasted-coffee/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-roasted-coffee/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-my-polo-180-burgundy/front.webp",
        "back": "/products/bundc-my-polo-180-burgundy/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "ivy-green": {
      "views": {
        "front": "/products/bundc-my-polo-180-ivy-green/front.webp",
        "back": "/products/bundc-my-polo-180-ivy-green/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-ivy-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy-pure": {
      "views": {
        "front": "/products/bundc-my-polo-180-navy-pure/front.webp",
        "back": "/products/bundc-my-polo-180-navy-pure/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-navy-pure/sleeve-left.webp"
      },
      "status": "real"
    },
    "meta-turquoise": {
      "views": {
        "front": "/products/bundc-my-polo-180-meta-turquoise/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "apple-green": {
      "views": {
        "front": "/products/bundc-my-polo-180-apple-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "meta-orange": {
      "views": {
        "front": "/products/bundc-my-polo-180-meta-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pixel-lime": {
      "views": {
        "front": "/products/bundc-my-polo-180-pixel-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "meta-lilac": {
      "views": {
        "front": "/products/bundc-my-polo-180-meta-lilac/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "meta-fuchsia": {
      "views": {
        "front": "/products/bundc-my-polo-180-meta-fuchsia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "meta-gold": {
      "views": {
        "front": "/products/bundc-my-polo-180-meta-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blush-blue": {
      "views": {
        "front": "/products/bundc-my-polo-180-blush-blue/front.webp",
        "back": "/products/bundc-my-polo-180-blush-blue/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-blush-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "blush-pink": {
      "views": {
        "front": "/products/bundc-my-polo-180-blush-pink/front.webp",
        "back": "/products/bundc-my-polo-180-blush-pink/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-blush-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "blush-mint": {
      "views": {
        "front": "/products/bundc-my-polo-180-blush-mint/front.webp",
        "back": "/products/bundc-my-polo-180-blush-mint/back.webp",
        "sleeve_left": "/products/bundc-my-polo-180-blush-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "lavender": {
      "views": {
        "front": "/products/bundc-my-polo-180-lavender/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pure-orange": {
      "views": {
        "front": "/products/bundc-my-polo-180-pure-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-my-polo-180-solar-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/bundc-my-polo-180-lotus-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-my-polo-180-radiant-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-polo-men": {
    "urban-navy": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-urban-navy/front.webp",
        "back": "/products/bundc-inspire-polo-men-urban-navy/back.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-cobalt-blue/front.webp",
        "back": "/products/bundc-inspire-polo-men-cobalt-blue/back.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-urban-khaki/front.webp",
        "back": "/products/bundc-inspire-polo-men-urban-khaki/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-white/front.webp",
        "back": "/products/bundc-inspire-polo-men-white/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-heather-grey/front.webp",
        "back": "/products/bundc-inspire-polo-men-heather-grey/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-dark-grey-solid/front.webp",
        "back": "/products/bundc-inspire-polo-men-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-black/front.webp",
        "back": "/products/bundc-inspire-polo-men-black/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-orange/front.webp",
        "back": "/products/bundc-inspire-polo-men-orange/back.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-fire-red/front.webp",
        "back": "/products/bundc-inspire-polo-men-fire-red/back.webp"
      },
      "status": "real"
    },
    "sorbet": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-sorbet/front.webp",
        "back": "/products/bundc-inspire-polo-men-sorbet/back.webp"
      },
      "status": "real"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-very-turquoise/front.webp",
        "back": "/products/bundc-inspire-polo-men-very-turquoise/back.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-sky-blue/front.webp",
        "back": "/products/bundc-inspire-polo-men-sky-blue/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-bottle-green/front.webp",
        "back": "/products/bundc-inspire-polo-men-bottle-green/back.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-solar-yellow/front.webp",
        "back": "/products/bundc-inspire-polo-men-solar-yellow/back.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-urban-orange/front.webp",
        "back": "/products/bundc-inspire-polo-men-urban-orange/back.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-orchid-pink/front.webp",
        "back": "/products/bundc-inspire-polo-men-orchid-pink/back.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-orchid-green/front.webp",
        "back": "/products/bundc-inspire-polo-men-orchid-green/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-radiant-purple/front.webp",
        "back": "/products/bundc-inspire-polo-men-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-millennial-lilac/front.webp",
        "back": "/products/bundc-inspire-polo-men-millennial-lilac/back.webp"
      },
      "status": "real"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/bundc-inspire-polo-men-millennial-mint/front.webp",
        "back": "/products/bundc-inspire-polo-men-millennial-mint/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-inspire-polo-women": {
    "urban-navy": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-urban-navy/front.webp",
        "back": "/products/bundc-inspire-polo-women-urban-navy/back.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-cobalt-blue/front.webp",
        "back": "/products/bundc-inspire-polo-women-cobalt-blue/back.webp"
      },
      "status": "real"
    },
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-urban-khaki/front.webp",
        "back": "/products/bundc-inspire-polo-women-urban-khaki/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-white/front.webp",
        "back": "/products/bundc-inspire-polo-women-white/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-heather-grey/front.webp",
        "back": "/products/bundc-inspire-polo-women-heather-grey/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-dark-grey-solid/front.webp",
        "back": "/products/bundc-inspire-polo-women-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-black/front.webp",
        "back": "/products/bundc-inspire-polo-women-black/back.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-solar-yellow/front.webp",
        "back": "/products/bundc-inspire-polo-women-solar-yellow/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-orange/front.webp",
        "back": "/products/bundc-inspire-polo-women-orange/back.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-urban-orange/front.webp",
        "back": "/products/bundc-inspire-polo-women-urban-orange/back.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-fire-red/front.webp",
        "back": "/products/bundc-inspire-polo-women-fire-red/back.webp"
      },
      "status": "real"
    },
    "sorbet": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-sorbet/front.webp",
        "back": "/products/bundc-inspire-polo-women-sorbet/back.webp"
      },
      "status": "real"
    },
    "orchid-pink": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-orchid-pink/front.webp",
        "back": "/products/bundc-inspire-polo-women-orchid-pink/back.webp"
      },
      "status": "real"
    },
    "very-turquoise": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-very-turquoise/front.webp",
        "back": "/products/bundc-inspire-polo-women-very-turquoise/back.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-sky-blue/front.webp",
        "back": "/products/bundc-inspire-polo-women-sky-blue/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-radiant-purple/front.webp",
        "back": "/products/bundc-inspire-polo-women-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "orchid-green": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-orchid-green/front.webp",
        "back": "/products/bundc-inspire-polo-women-orchid-green/back.webp"
      },
      "status": "real"
    },
    "millennial-mint": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-millennial-mint/front.webp",
        "back": "/products/bundc-inspire-polo-women-millennial-mint/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-bottle-green/front.webp",
        "back": "/products/bundc-inspire-polo-women-bottle-green/back.webp"
      },
      "status": "real"
    },
    "millennial-lilac": {
      "views": {
        "front": "/products/bundc-inspire-polo-women-millennial-lilac/front.webp",
        "back": "/products/bundc-inspire-polo-women-millennial-lilac/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-my-eco-polo-6535": {
    "dark-forest": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-dark-forest/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "camo-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-camo-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-white/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-white/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-black/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-black/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-navy/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-navy/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-red/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-red/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-mastic/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-mastic/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-mastic/sleeve-left.webp"
      },
      "status": "real"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-roasted-coffee/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-burgundy/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-burgundy/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "melon-orange": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-melon-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-lotus-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-lotus-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "acid-lime": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-acid-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-pacific-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-pop-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-tomato": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-pop-tomato/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-turquoise": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-pop-turquoise/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-pop-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-my-eco-polo-6535-women": {
    "dark-forest": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-dark-forest/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "camo-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-camo-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-red/front.webp",
        "back": "/products/bundc-my-eco-polo-6535-women-red/back.webp",
        "sleeve_left": "/products/bundc-my-eco-polo-6535-women-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-mastic/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "roasted-coffee": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-roasted-coffee/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "melon-orange": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-melon-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lotus-pink": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-lotus-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-lotus-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "acid-lime": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-acid-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pacific-grey": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-pacific-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-pop-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-tomato": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-pop-tomato/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-turquoise": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-pop-turquoise/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pop-green": {
      "views": {
        "front": "/products/bundc-my-eco-polo-6535-women-pop-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-classic-polo": {
    "aubergine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-aubergine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-aubergine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-aubergine/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-olive/front.webp",
        "back": "/products/jamesnicholson-classic-polo-olive/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-wine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-acid-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-acid-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-aqua/front.webp",
        "back": "/products/jamesnicholson-classic-polo-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-black/front.webp",
        "back": "/products/jamesnicholson-classic-polo-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-brown/front.webp",
        "back": "/products/jamesnicholson-classic-polo-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-orange": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-dark-orange/front.webp",
        "back": "/products/jamesnicholson-classic-polo-dark-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-dark-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-dark-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-dark-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-dark-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "fern-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-fern-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-fern-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-fern-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-gold-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-gold-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-classic-polo-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-grenadine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-grenadine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-grenadine/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-grey-heather/front.webp",
        "back": "/products/jamesnicholson-classic-polo-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-irish-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-irish-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-light-blue/front.webp",
        "back": "/products/jamesnicholson-classic-polo-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-light-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-light-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-light-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-lilac/front.webp",
        "back": "/products/jamesnicholson-classic-polo-lilac/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-lime-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mint": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-mint/front.webp",
        "back": "/products/jamesnicholson-classic-polo-mint/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-navy/front.webp",
        "back": "/products/jamesnicholson-classic-polo-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-orange/front.webp",
        "back": "/products/jamesnicholson-classic-polo-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pacific": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-pacific/front.webp",
        "back": "/products/jamesnicholson-classic-polo-pacific/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-pacific/sleeve-left.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-petrol/front.webp",
        "back": "/products/jamesnicholson-classic-polo-petrol/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-petrol/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-purple/front.webp",
        "back": "/products/jamesnicholson-classic-polo-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-rose/front.webp",
        "back": "/products/jamesnicholson-classic-polo-rose/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "signal-red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-signal-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-signal-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-signal-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-sky-blue/front.webp",
        "back": "/products/jamesnicholson-classic-polo-sky-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-stone/front.webp",
        "back": "/products/jamesnicholson-classic-polo-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "tomato": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-tomato/front.webp",
        "back": "/products/jamesnicholson-classic-polo-tomato/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-tomato/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-turquoise/front.webp",
        "back": "/products/jamesnicholson-classic-polo-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-white/front.webp",
        "back": "/products/jamesnicholson-classic-polo-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-yellow/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-classic-polo-ladies": {
    "aubergine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-aubergine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-aubergine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-aubergine/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-olive/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-olive/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-wine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-wine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-wine/sleeve-left.webp"
      },
      "status": "real"
    },
    "acid-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-acid-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-acid-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-acid-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-aqua/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-aqua/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-black/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-brown/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-orange": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-dark-orange/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-dark-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-dark-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-dark-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-dark-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-dark-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "fern-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-fern-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-fern-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-fern-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-gold-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-gold-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "graphite-solid": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "grenadine": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-grenadine/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-grenadine/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-grenadine/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-grey-heather/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-irish-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-irish-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-light-blue/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-light-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-light-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-light-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-lilac/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-lilac/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-lime-green/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-lime-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-lime-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mint": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-mint/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-mint/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-navy/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-orange/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "pacific": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-pacific/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-pacific/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-pacific/sleeve-left.webp"
      },
      "status": "real"
    },
    "petrol": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-petrol/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-petrol/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-petrol/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-purple/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-purple/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "rose": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-rose/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-rose/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-royal/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "signal-red": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-signal-red/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-signal-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-signal-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-sky-blue/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-sky-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-stone/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-stone/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-stone/sleeve-left.webp"
      },
      "status": "real"
    },
    "tomato": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-tomato/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-tomato/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-tomato/sleeve-left.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-turquoise/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-turquoise/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-turquoise/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-white/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/jamesnicholson-classic-polo-ladies-yellow/front.webp",
        "back": "/products/jamesnicholson-classic-polo-ladies-yellow/back.webp",
        "sleeve_left": "/products/jamesnicholson-classic-polo-ladies-yellow/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-men-s-bio-workwear-polo": {
    "wine": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-wine/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-wine/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-red/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-aqua/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-aqua/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-black/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "stone": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-stone/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-stone/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-white/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "brown": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-brown/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-brown/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-orange/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-orange/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-turquoise/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-turquoise/back.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-lime-green/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-lime-green/back.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-men-s-bio-workwear-polo-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold-yellow": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-gold-yellow/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-gold-yellow/back.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-men-s-bio-workwear-polo-grey-heather/front.webp",
        "back": "/products/jamesnicholson-men-s-bio-workwear-polo-grey-heather/back.webp"
      },
      "status": "real"
    }
  },
  "jamesnicholson-workwear-polo-men": {
    "black": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-black/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-black/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "carbon": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-carbon/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-carbon/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-carbon/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-dark-green/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-dark-green/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-heather": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-grey-heather/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-grey-heather/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-light-blue/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-light-blue/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-navy/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-navy/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-orange/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-orange/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-red/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-red/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-royal/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-royal/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jamesnicholson-workwear-polo-men-white/front.webp",
        "back": "/products/jamesnicholson-workwear-polo-men-white/back.webp",
        "sleeve_left": "/products/jamesnicholson-workwear-polo-men-white/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-pique-polo-shirt": {
    "black": {
      "views": {
        "front": "/products/earthpositive-pique-polo-shirt-black/front.webp",
        "back": "/products/earthpositive-pique-polo-shirt-black/back.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-jersey-polo-shirt": {
    "black": {
      "views": {
        "front": "/products/earthpositive-jersey-polo-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-strapazierfaehiges-poloshirt-599": {
    "black": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-black/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-black/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-bottle-green/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-bottle-green/back.webp"
      },
      "status": "real"
    },
    "bright-red": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-bright-red/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-bright-red/back.webp",
        "sleeve_left": "/products/russell-strapazierfaehiges-poloshirt-599-bright-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-bright-royal/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-bright-royal/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-burgundy/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-burgundy/back.webp",
        "sleeve_left": "/products/russell-strapazierfaehiges-poloshirt-599-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-classic-red/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-classic-red/back.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-convoy-grey-solid/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-strapazierfaehiges-poloshirt-599-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-french-navy/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-french-navy/back.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-light-oxford-heather/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-light-oxford-heather/back.webp",
        "sleeve_left": "/products/russell-strapazierfaehiges-poloshirt-599-light-oxford-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-sky/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-sky/back.webp",
        "sleeve_left": "/products/russell-strapazierfaehiges-poloshirt-599-sky/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-strapazierfaehiges-poloshirt-599-white/front.webp",
        "back": "/products/russell-strapazierfaehiges-poloshirt-599-white/back.webp"
      },
      "status": "real"
    }
  },
  "russell-men-s-ultimate-cotton-polo": {
    "azure-blue": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-azure-blue/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-azure-blue/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-black/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-black/back.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-bright-royal/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-bright-royal/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-classic-red/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-classic-red/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-french-navy/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-french-navy/back.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-sky/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-sky/back.webp"
      },
      "status": "real"
    },
    "titanium-solid": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-titanium-solid/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-titanium-solid/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-white/front.webp",
        "back": "/products/russell-men-s-ultimate-cotton-polo-white/back.webp"
      },
      "status": "real"
    },
    "00461c": {
      "views": {
        "front": "/products/russell-men-s-ultimate-cotton-polo-00461c/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-men-s-classic-cotton-polo": {
    "black": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-black/front.webp",
        "back": "/products/russell-men-s-classic-cotton-polo-black/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-bright-royal/front.webp",
        "back": "/products/russell-men-s-classic-cotton-polo-bright-royal/back.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-classic-red/front.webp",
        "back": "/products/russell-men-s-classic-cotton-polo-classic-red/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-french-navy/front.webp",
        "back": "/products/russell-men-s-classic-cotton-polo-french-navy/back.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-fuchsia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-men-s-classic-cotton-polo-white/front.webp",
        "back": "/products/russell-men-s-classic-cotton-polo-white/back.webp"
      },
      "status": "real"
    }
  },
  "russell-poloshirt-6535": {
    "black": {
      "views": {
        "front": "/products/russell-poloshirt-6535-black/front.webp",
        "back": "/products/russell-poloshirt-6535-black/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-poloshirt-6535-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-red": {
      "views": {
        "front": "/products/russell-poloshirt-6535-bright-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-poloshirt-6535-bright-royal/front.webp",
        "back": "/products/russell-poloshirt-6535-bright-royal/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-bright-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-poloshirt-6535-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-poloshirt-6535-classic-red/front.webp",
        "back": "/products/russell-poloshirt-6535-classic-red/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-classic-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-poloshirt-6535-french-navy/front.webp",
        "back": "/products/russell-poloshirt-6535-french-navy/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-poloshirt-6535-light-oxford-heather/front.webp",
        "back": "/products/russell-poloshirt-6535-light-oxford-heather/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-light-oxford-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/russell-poloshirt-6535-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-poloshirt-6535-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-poloshirt-6535-white/front.webp",
        "back": "/products/russell-poloshirt-6535-white/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/russell-poloshirt-6535-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-poloshirt-6535-convoy-grey-solid/front.webp",
        "back": "/products/russell-poloshirt-6535-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-poloshirt-6535-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "russell-ladies-poloshirt-6535": {
    "black": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-red": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-bright-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-classic-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-convoy-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-ladies-poloshirt-6535-light-oxford-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "sols-men-s-polo-shirt-prime": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-royal-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-royal-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "army": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-army/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-army/sleeve-left.webp"
      },
      "status": "real"
    },
    "chocolate": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-chocolate/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-aqua/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "pure-grey": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-pure-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-pure-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "apple-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-apple-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-apple-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-black/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-black/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-bottle-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-bottle-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-purple": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-dark-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-dark-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-french-navy/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-grey-melange/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-grey-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-red/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-red/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-sky-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-prime-white/front.webp",
        "back": "/products/sols-men-s-polo-shirt-prime-white/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-prime-white/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "sols-women-s-polo-shirt-prime": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-royal-blue/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-royal-blue/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-dark-grey-solid/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-dark-grey-solid/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "army": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-army/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-army/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-army/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-black/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-black/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-bottle-green/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-bottle-green/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-burgundy/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-burgundy/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-purple": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-dark-purple/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-dark-purple/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-dark-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-french-navy/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-french-navy/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-grey-melange/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-grey-melange/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-kelly-green/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-kelly-green/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "pure-grey": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-pure-grey/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-pure-grey/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-pure-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-red/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-red/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-sand/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-sand/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-sky-blue/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-sky-blue/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-white/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-white/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "4b271c": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-4b271c/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-4b271c/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-4b271c/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/sols-women-s-polo-shirt-prime-ash-heather/front.webp",
        "back": "/products/sols-women-s-polo-shirt-prime-ash-heather/back.webp",
        "sleeve_left": "/products/sols-women-s-polo-shirt-prime-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "cdea80": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "sols-men-s-polo-shirt-perfect": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-royal-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-royal-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-dark-grey-solid/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-dark-grey-solid/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-black/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-black/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-french-navy/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-grey-melange/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-grey-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-kelly-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-kelly-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-red/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-red/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-white/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-white/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-bottle-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-bottle-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "creamy-pink": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-creamy-pink/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-creamy-pink/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-creamy-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "creamy-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "spring-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-spring-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-spring-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-spring-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "01509d": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "apple-green": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-apple-green/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-apple-green/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-apple-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-aqua/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-aqua/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-ash-heather/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-ash-heather/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-ash-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-burgundy/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-burgundy/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "denim": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-denim/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-denim/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-denim/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-gold/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-gold/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "hibiscus": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "orange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-orange/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-orange/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-sand/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-sand/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-sky-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-sky-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "slate-blue": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-slate-blue/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-slate-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-slate-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "pure-grey": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-pure-grey/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-pure-grey/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-pure-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal-melange": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-charcoal-melange/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-charcoal-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-charcoal-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-oxblood": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-heather-oxblood/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-heather-oxblood/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-heather-oxblood/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-denim": {
      "views": {
        "front": "/products/sols-men-s-polo-shirt-perfect-heather-denim/front.webp",
        "back": "/products/sols-men-s-polo-shirt-perfect-heather-denim/back.webp",
        "sleeve_left": "/products/sols-men-s-polo-shirt-perfect-heather-denim/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "sols-unisex-pulse-polo-shirt": {
    "white": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-white/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-white/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "rope": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-rope/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-rope/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-rope/sleeve-left.webp"
      },
      "status": "real"
    },
    "linen": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-linen/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-linen/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-linen/sleeve-left.webp"
      },
      "status": "real"
    },
    "candy-pink": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-candy-pink/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-candy-pink/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-candy-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-lilac/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-lilac/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-orange/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-orange/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-red/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-red/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-kelly-green/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-kelly-green/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-bottle-green/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-bottle-green/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "aqua": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-aqua/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-aqua/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-aqua/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-sky-blue/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-sky-blue/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue-241": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-royal-blue-241/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-french-navy/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-french-navy/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "denim": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-denim/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-denim/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-denim/sleeve-left.webp"
      },
      "status": "real"
    },
    "pure-grey": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-pure-grey/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-pure-grey/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-pure-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-grey-melange/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-grey-melange/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "mouse-grey-solid": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-mouse-grey-solid/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-mouse-grey-solid/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-mouse-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-black/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-black/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/sols-unisex-pulse-polo-shirt-off-white/front.webp",
        "back": "/products/sols-unisex-pulse-polo-shirt-off-white/back.webp",
        "sleeve_left": "/products/sols-unisex-pulse-polo-shirt-off-white/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "gildan-heavy-blend-hooded-sweatshirt": {
    "navy": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "graphite-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-graphite-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "azalea": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-azalea/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "mint-green": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-mint-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "old-gold": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-old-gold/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orchid": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-orchid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "b23730": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "violet": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-violet/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "antique-cherry-red-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-antique-cherry-red-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "antique-sapphire-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-antique-sapphire-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-ash-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-carolina-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-charcoal-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cherry-red": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-cherry-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-dark-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "garnet": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-garnet/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "eead1a": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-eead1a/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heliconia": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-heliconia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "indigo-blue": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-indigo-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-irish-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-light-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-light-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-maroon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-military-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "safety-green": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-safety-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "safety-orange": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-safety-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-sand/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-sapphire/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "005683": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-005683/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "205c40": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-205c40/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "1c3775": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-1c3775/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-heavy-blend-hooded-sweatshirt-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-navy/back.webp"
      },
      "status": "real"
    },
    "cobalt": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "stone-blue": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "paragon": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-paragon/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-paragon/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-black/back.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-charcoal-solid/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-dark-heather/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-dark-heather/back.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-light-pink/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-light-pink/back.webp"
      },
      "status": "real"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-maroon/back.webp"
      },
      "status": "real"
    },
    "military-green": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-military-green/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "royal": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sand": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-sand/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-sand/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-white/back.webp"
      },
      "status": "real"
    },
    "yellow-haze": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cement": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cocoa": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-cocoa/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-cocoa/back.webp"
      },
      "status": "real"
    },
    "daisy": {
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
    "mustard": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pink-lemonade": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "pistachio": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-pistachio/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-pistachio/back.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-purple/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-purple/back.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "tangerine": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "aquatic": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-ash-grey-heather/back.webp"
      },
      "status": "real"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "brown-savana": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-carolina-blue/front.webp",
        "back": "/products/gildan-softstyle-midweight-sweat-adult-hoodie-carolina-blue/back.webp"
      },
      "status": "real"
    },
    "dusty-rose": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "off-white": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "sage": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "smoke": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "t-orange": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "393d47": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "gildan-hammer-maxweight-adult-hooded-sweatshirt": {
    "blue-dusk": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-blue-dusk/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cherry-red": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-cherry-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-royal": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-deep-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "garnet": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-garnet/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "888b8d": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-888b8d/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-off-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-olive/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "2d2926": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-2d2926/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "tan": {
      "views": {
        "front": "/products/gildan-hammer-maxweight-adult-hooded-sweatshirt-tan/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "fruit-of-the-loom-classic-hooded-sweat": {
    "purple": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-purple/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-purple/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-black/back.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-deep-navy/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-deep-navy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-deep-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-grey/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-white/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-white/back.webp"
      },
      "status": "real"
    },
    "dark-heather-grey": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-dark-heather-grey/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-dark-heather-grey/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-dark-heather-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-navy/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-navy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-royal": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-royal/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-royal/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-green/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-green/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-red": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-heather-red/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-bottle-green/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-burgundy/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-olive": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-classic-olive/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-classic-olive/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-classic-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-light-graphite-solid/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-light-graphite-solid/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-light-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-red/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-red/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-royal-blue/back.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-natural/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-natural/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "azure-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-azure-blue/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-azure-blue/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-azure-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-fuchsia/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-fuchsia/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-fuchsia/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-kelly-green/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-kelly-green/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-light-pink/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-light-pink/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-orange/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-orange/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-sky-blue/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-sky-blue/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-sky-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "sunflower": {
      "views": {
        "front": "/products/fruit-of-the-loom-classic-hooded-sweat-sunflower/front.webp",
        "back": "/products/fruit-of-the-loom-classic-hooded-sweat-sunflower/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-classic-hooded-sweat-sunflower/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "fruit-of-the-loom-premium-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-black/back.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-charcoal-solid/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-charcoal-solid/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-premium-hooded-sweat-charcoal-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-deep-navy/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-deep-navy/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-heather-grey/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-heather-grey/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-burgundy/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-premium-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-olive": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-classic-olive/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-classic-olive/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-premium-hooded-sweat-classic-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-red/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-red/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-premium-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-premium-hooded-sweat-royal-blue/back.webp"
      },
      "status": "real"
    }
  },
  "fruit-of-the-loom-lightweight-hooded-sweat": {
    "azure-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-azure-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-black/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-bottle-green/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-bottle-green/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-burgundy/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-deep-navy/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-deep-navy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-deep-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-heather-grey/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-heather-grey/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-heather-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-light-graphite-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-red/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-red/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-royal-blue/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-lightweight-hooded-sweat-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fruit-of-the-loom-lightweight-hooded-sweat-white/front.webp",
        "back": "/products/fruit-of-the-loom-lightweight-hooded-sweat-white/back.webp"
      },
      "status": "real"
    }
  },
  "fruit-of-the-loom-iconic-premium-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-black/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-white/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-white/back.webp"
      },
      "status": "real"
    },
    "athletic-heather": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-athletic-heather/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-athletic-heather/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-athletic-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-light-graphite-solid/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-light-graphite-solid/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-light-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-deep-navy/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-deep-navy/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-royal-blue/back.webp"
      },
      "status": "real"
    },
    "classic-olive": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-classic-olive/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-classic-olive/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-classic-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "desert-sand": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-desert-sand/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-desert-sand/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-desert-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-burgundy/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-red/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-premium-hooded-sweat-red/back.webp"
      },
      "status": "real"
    }
  },
  "fruit-of-the-loom-iconic-250-hooded-sweat": {
    "black": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-black/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-black/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "ffffff": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-ffffff/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-ffffff/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-ffffff/sleeve-left.webp"
      },
      "status": "real"
    },
    "athletic-heather": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-athletic-heather/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-athletic-heather/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-athletic-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-graphite-solid": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-light-graphite-solid/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-light-graphite-solid/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-light-graphite-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-navy": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-deep-navy/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-deep-navy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-deep-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "college-green": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-college-green/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-college-green/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-college-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "desert-sand": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-desert-sand/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-desert-sand/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-desert-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-burgundy/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-red/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-red/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-royal-blue/front.webp",
        "back": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-royal-blue/back.webp",
        "sleeve_left": "/products/fruit-of-the-loom-iconic-250-hooded-sweat-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "build-your-brand-heavy-hoody": {
    "bottle-green": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-bottle-green/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-bottle-green/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-burgundy/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-burgundy/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-sand/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-sand/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-navy": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-light-navy/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-light-navy/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-light-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-black/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-black/back.webp"
      },
      "status": "real"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-charcoal-heather/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-charcoal-heather/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-charcoal-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "cobaltblue": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-cobaltblue/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-cobaltblue/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-cobaltblue/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-heather-grey/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-heather-grey/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-heather-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-navy/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-navy/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-olive/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-olive/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "ultraviolett": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-ultraviolett/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-ultraviolett/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-ultraviolett/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-white/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "paradise-orange": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-paradise-orange/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-paradise-orange/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-paradise-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-forest-green/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-forest-green/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-forest-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "hibiskus-pink": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-hibiskus-pink/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-hibiskus-pink/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-hibiskus-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "neo-mint": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-neo-mint/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-neo-mint/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-neo-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-ocean-blue/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-ocean-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-ocean-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "frozen-yellow": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-frozen-yellow/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-frozen-yellow/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-frozen-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "city-red": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-city-red/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-city-red/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-city-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-lilac/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-lilac/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "ruby": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-ruby/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-ruby/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-ruby/sleeve-left.webp"
      },
      "status": "real"
    },
    "taxi-yellow": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-taxi-yellow/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-taxi-yellow/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-taxi-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "soft-yellow": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-soft-yellow/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-soft-yellow/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-soft-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "bark": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-bark/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-bark/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-bark/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-asphalt": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-light-asphalt/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-light-asphalt/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-light-asphalt/sleeve-left.webp"
      },
      "status": "real"
    },
    "purple-night": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-purple-night/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-purple-night/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-purple-night/sleeve-left.webp"
      },
      "status": "real"
    },
    "pale-leaf": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-pale-leaf/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-pale-leaf/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-pale-leaf/sleeve-left.webp"
      },
      "status": "real"
    },
    "white-sand": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-white-sand/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-white-sand/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-white-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-green": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-dark-green/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-dark-green/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-dark-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "baltic-blue": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-baltic-blue/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-baltic-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-baltic-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "chocoloate-brown": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-chocoloate-brown/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-chocoloate-brown/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-chocoloate-brown/sleeve-left.webp"
      },
      "status": "real"
    },
    "plum-purple": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-plum-purple/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-plum-purple/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-plum-purple/sleeve-left.webp"
      },
      "status": "real"
    },
    "soft-pink": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-soft-pink/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-soft-pink/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-soft-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "powder-blue": {
      "views": {
        "front": "/products/build-your-brand-heavy-hoody-powder-blue/front.webp",
        "back": "/products/build-your-brand-heavy-hoody-powder-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-heavy-hoody-powder-blue/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "build-your-brand-fluffy-hoody": {
    "bottle-green": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-bottle-green/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-bottle-green/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "pale-olive": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-pale-olive/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-pale-olive/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-white/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-fluffy-hoody-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-black/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-black/back.webp"
      },
      "status": "real"
    },
    "magnet": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-magnet/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-magnet/back.webp"
      },
      "status": "real"
    },
    "light-asphalt": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-light-asphalt/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "chocoloate-brown": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-chocoloate-brown/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-chocoloate-brown/back.webp"
      },
      "status": "real"
    },
    "u-beige": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-u-beige/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-u-beige/back.webp"
      },
      "status": "real"
    },
    "white-sand": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-white-sand/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-white-sand/back.webp"
      },
      "status": "real"
    },
    "soft-pink": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-soft-pink/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-soft-pink/back.webp"
      },
      "status": "real"
    },
    "plum-purple": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-plum-purple/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-plum-purple/back.webp"
      },
      "status": "real"
    },
    "powder-blue": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-powder-blue/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-powder-blue/back.webp"
      },
      "status": "real"
    },
    "beryl-blue": {
      "views": {
        "front": "/products/build-your-brand-fluffy-hoody-beryl-blue/front.webp",
        "back": "/products/build-your-brand-fluffy-hoody-beryl-blue/back.webp"
      },
      "status": "real"
    }
  },
  "build-your-brand-ultra-heavy-cotton-box-hoody": {
    "dark-grey": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-dark-grey/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-dark-grey/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-dark-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-black/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-white/back.webp"
      },
      "status": "real"
    },
    "grey": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-grey/back.webp"
      },
      "status": "real"
    },
    "ready-to-dye": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ready-to-dye/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ready-to-dye/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ready-to-dye/sleeve-left.webp"
      },
      "status": "real"
    },
    "vintage-blue": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-vintage-blue/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-vintage-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-vintage-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "union-beige": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-union-beige/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-union-beige/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-union-beige/sleeve-left.webp"
      },
      "status": "real"
    },
    "sand": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-sand/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-sand/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-sand/sleeve-left.webp"
      },
      "status": "real"
    },
    "city-red": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-city-red/back.webp"
      },
      "status": "real"
    },
    "lilac": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-lilac/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-lilac/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-lilac/sleeve-left.webp"
      },
      "status": "real"
    },
    "cobalt-blue": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cobalt-blue/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cobalt-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cobalt-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "ocean-blue": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ocean-blue/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ocean-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-ocean-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "beryl-blue": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-beryl-blue/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-beryl-blue/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-beryl-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-mint": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-light-mint/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-light-mint/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-light-mint/sleeve-left.webp"
      },
      "status": "real"
    },
    "bark": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-bark/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-bark/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-bark/sleeve-left.webp"
      },
      "status": "real"
    },
    "magnet": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-magnet/back.webp"
      },
      "status": "real"
    },
    "forgotten-orange": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-forgotten-orange/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-forgotten-orange/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-forgotten-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-olive/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-olive/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "retro-green": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-retro-green/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-retro-green/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-retro-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "e8e7e3": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "cloud": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cloud/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cloud/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-cloud/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-navy/back.webp"
      },
      "status": "real"
    },
    "soft-pink": {
      "views": {
        "front": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-soft-pink/front.webp",
        "back": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-soft-pink/back.webp",
        "sleeve_left": "/products/build-your-brand-ultra-heavy-cotton-box-hoody-soft-pink/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "build-your-brand-ladies-heavy-hoody": {
    "white": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-white/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-white/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-pink/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-pink/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-olive/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-olive/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-black/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-black/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-charcoal-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-heather-grey/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-heather-grey/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-heather-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "soft-yellow": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-soft-yellow/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-soft-yellow/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-soft-yellow/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusk-rose": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-dusk-rose/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-dusk-rose/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-dusk-rose/sleeve-left.webp"
      },
      "status": "real"
    },
    "soft-salvia": {
      "views": {
        "front": "/products/build-your-brand-ladies-heavy-hoody-soft-salvia/front.webp",
        "back": "/products/build-your-brand-ladies-heavy-hoody-soft-salvia/back.webp",
        "sleeve_left": "/products/build-your-brand-ladies-heavy-hoody-soft-salvia/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "bundc-id-333-hoodie": {
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-urban-khaki/front.webp",
        "back": "/products/bundc-id-333-hoodie-urban-khaki/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-navy/front.webp",
        "back": "/products/bundc-id-333-hoodie-navy/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-black/front.webp",
        "back": "/products/bundc-id-333-hoodie-black/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-id-333-hoodie-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-white/front.webp",
        "back": "/products/bundc-id-333-hoodie-white/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-dark-grey-solid/front.webp",
        "back": "/products/bundc-id-333-hoodie-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-red/front.webp",
        "back": "/products/bundc-id-333-hoodie-red/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-royal-blue/front.webp",
        "back": "/products/bundc-id-333-hoodie-royal-blue/back.webp"
      },
      "status": "real"
    },
    "off-white": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-off-white/front.webp",
        "back": "/products/bundc-id-333-hoodie-off-white/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-orange/front.webp",
        "back": "/products/bundc-id-333-hoodie-orange/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-burgundy/front.webp",
        "back": "/products/bundc-id-333-hoodie-burgundy/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-bottle-green/front.webp",
        "back": "/products/bundc-id-333-hoodie-bottle-green/back.webp"
      },
      "status": "real"
    },
    "pop-yellow": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-pop-yellow/front.webp",
        "back": "/products/bundc-id-333-hoodie-pop-yellow/back.webp"
      },
      "status": "real"
    },
    "nordic-blue": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-nordic-blue/front.webp",
        "back": "/products/bundc-id-333-hoodie-nordic-blue/back.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-mastic/front.webp",
        "back": "/products/bundc-id-333-hoodie-mastic/back.webp"
      },
      "status": "real"
    },
    "lotus-blue": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-lotus-blue/front.webp",
        "back": "/products/bundc-id-333-hoodie-lotus-blue/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-radiant-purple/front.webp",
        "back": "/products/bundc-id-333-hoodie-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "blush-mint": {
      "views": {
        "front": "/products/bundc-id-333-hoodie-blush-mint/front.webp",
        "back": "/products/bundc-id-333-hoodie-blush-mint/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-king-hooded-sweat": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-white/front.webp",
        "back": "/products/bundc-king-hooded-sweat-white/back.webp"
      },
      "status": "real"
    },
    "yellow-fizz": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-yellow-fizz/front.webp",
        "back": "/products/bundc-king-hooded-sweat-yellow-fizz/back.webp"
      },
      "status": "real"
    },
    "pure-orange": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-pure-orange/front.webp",
        "back": "/products/bundc-king-hooded-sweat-pure-orange/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-red/front.webp",
        "back": "/products/bundc-king-hooded-sweat-red/back.webp"
      },
      "status": "real"
    },
    "dark-cherry": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-dark-cherry/front.webp",
        "back": "/products/bundc-king-hooded-sweat-dark-cherry/back.webp"
      },
      "status": "real"
    },
    "soft-rose": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-soft-rose/front.webp",
        "back": "/products/bundc-king-hooded-sweat-soft-rose/back.webp"
      },
      "status": "real"
    },
    "magenta-pink": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-magenta-pink/front.webp",
        "back": "/products/bundc-king-hooded-sweat-magenta-pink/back.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-radiant-purple/front.webp",
        "back": "/products/bundc-king-hooded-sweat-radiant-purple/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-royal-blue/front.webp",
        "back": "/products/bundc-king-hooded-sweat-royal-blue/back.webp"
      },
      "status": "real"
    },
    "pure-sky": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-pure-sky/front.webp",
        "back": "/products/bundc-king-hooded-sweat-pure-sky/back.webp"
      },
      "status": "real"
    },
    "nordic-blue": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-nordic-blue/front.webp",
        "back": "/products/bundc-king-hooded-sweat-nordic-blue/back.webp"
      },
      "status": "real"
    },
    "aqua-green": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-aqua-green/front.webp",
        "back": "/products/bundc-king-hooded-sweat-aqua-green/back.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-khaki/front.webp",
        "back": "/products/bundc-king-hooded-sweat-khaki/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-bottle-green/front.webp",
        "back": "/products/bundc-king-hooded-sweat-bottle-green/back.webp"
      },
      "status": "real"
    },
    "grey-fog": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-grey-fog/front.webp",
        "back": "/products/bundc-king-hooded-sweat-grey-fog/back.webp"
      },
      "status": "real"
    },
    "asphalt": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-asphalt/front.webp",
        "back": "/products/bundc-king-hooded-sweat-asphalt/back.webp"
      },
      "status": "real"
    },
    "black-pure": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-black-pure/front.webp",
        "back": "/products/bundc-king-hooded-sweat-black-pure/back.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-heather-grey/front.webp",
        "back": "/products/bundc-king-hooded-sweat-heather-grey/back.webp"
      },
      "status": "real"
    },
    "heather-mid-grey": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-heather-mid-grey/front.webp",
        "back": "/products/bundc-king-hooded-sweat-heather-mid-grey/back.webp"
      },
      "status": "real"
    },
    "1f2532": {
      "views": {
        "front": "/products/bundc-king-hooded-sweat-1f2532/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-id-223-hoodie": {
    "black": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-black/front.webp",
        "back": "/products/bundc-id-223-hoodie-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-navy/front.webp",
        "back": "/products/bundc-id-223-hoodie-navy/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-id-223-hoodie-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-white/front.webp",
        "back": "/products/bundc-id-223-hoodie-white/back.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-royal-blue/front.webp",
        "back": "/products/bundc-id-223-hoodie-royal-blue/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-dark-grey-solid/front.webp",
        "back": "/products/bundc-id-223-hoodie-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-red/front.webp",
        "back": "/products/bundc-id-223-hoodie-red/back.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-forest-green/front.webp",
        "back": "/products/bundc-id-223-hoodie-forest-green/back.webp"
      },
      "status": "real"
    },
    "lake-blue": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-lake-blue/front.webp",
        "back": "/products/bundc-id-223-hoodie-lake-blue/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-orange/front.webp",
        "back": "/products/bundc-id-223-hoodie-orange/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-burgundy/front.webp",
        "back": "/products/bundc-id-223-hoodie-burgundy/back.webp"
      },
      "status": "real"
    },
    "acid-lime": {
      "views": {
        "front": "/products/bundc-id-223-hoodie-acid-lime/front.webp",
        "back": "/products/bundc-id-223-hoodie-acid-lime/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-influence-hoodie": {
    "black": {
      "views": {
        "front": "/products/bundc-influence-hoodie-black/front.webp",
        "back": "/products/bundc-influence-hoodie-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-influence-hoodie-navy/front.webp",
        "back": "/products/bundc-influence-hoodie-navy/back.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-influence-hoodie-sport-grey-heather/front.webp",
        "back": "/products/bundc-influence-hoodie-sport-grey-heather/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-influence-hoodie-white/front.webp",
        "back": "/products/bundc-influence-hoodie-white/back.webp"
      },
      "status": "real"
    },
    "mastic": {
      "views": {
        "front": "/products/bundc-influence-hoodie-mastic/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "amalfi-teal": {
      "views": {
        "front": "/products/bundc-influence-hoodie-amalfi-teal/front.webp",
        "back": "/products/bundc-influence-hoodie-amalfi-teal/back.webp"
      },
      "status": "real"
    }
  },
  "bundc-hoodie": {
    "navy-blue": {
      "views": {
        "front": "/products/bundc-hoodie-navy-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "elephant-grey": {
      "views": {
        "front": "/products/bundc-hoodie-elephant-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-hoodie-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "desert": {
      "views": {
        "front": "/products/bundc-hoodie-desert/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "melon-orange": {
      "views": {
        "front": "/products/bundc-hoodie-melon-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pale-yellow": {
      "views": {
        "front": "/products/bundc-hoodie-pale-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "solar-yellow": {
      "views": {
        "front": "/products/bundc-hoodie-solar-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "nude": {
      "views": {
        "front": "/products/bundc-hoodie-nude/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pure-orange": {
      "views": {
        "front": "/products/bundc-hoodie-pure-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-hoodie-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "wine": {
      "views": {
        "front": "/products/bundc-hoodie-wine/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "candy-pink": {
      "views": {
        "front": "/products/bundc-hoodie-candy-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pale-pink": {
      "views": {
        "front": "/products/bundc-hoodie-pale-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pink-fizz": {
      "views": {
        "front": "/products/bundc-hoodie-pink-fizz/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lavender": {
      "views": {
        "front": "/products/bundc-hoodie-lavender/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "radiant-purple": {
      "views": {
        "front": "/products/bundc-hoodie-radiant-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "hawaiian-blue": {
      "views": {
        "front": "/products/bundc-hoodie-hawaiian-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-hoodie-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pure-sky": {
      "views": {
        "front": "/products/bundc-hoodie-pure-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sage": {
      "views": {
        "front": "/products/bundc-hoodie-sage/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-jade": {
      "views": {
        "front": "/products/bundc-hoodie-light-jade/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/bundc-hoodie-kelly-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-khaki": {
      "views": {
        "front": "/products/bundc-hoodie-millennial-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-fog": {
      "views": {
        "front": "/products/bundc-hoodie-grey-fog/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-hoodie-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "asphalt": {
      "views": {
        "front": "/products/bundc-hoodie-asphalt/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black-pure": {
      "views": {
        "front": "/products/bundc-hoodie-black-pure/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/bundc-hoodie-heather-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-mid-grey": {
      "views": {
        "front": "/products/bundc-hoodie-heather-mid-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-red": {
      "views": {
        "front": "/products/bundc-hoodie-heather-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-asphalt": {
      "views": {
        "front": "/products/bundc-hoodie-heather-asphalt/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-purple": {
      "views": {
        "front": "/products/bundc-hoodie-heather-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-royal-blue": {
      "views": {
        "front": "/products/bundc-hoodie-heather-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-navy": {
      "views": {
        "front": "/products/bundc-hoodie-heather-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-dark-green": {
      "views": {
        "front": "/products/bundc-hoodie-heather-dark-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-earth-positive-pullover-hoodie": {
    "black": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "faded-black": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-black/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-black/back.webp"
      },
      "status": "real"
    },
    "stone-washed-green": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-green/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-green/back.webp"
      },
      "status": "real"
    },
    "faded-navy": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-navy/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-navy/back.webp"
      },
      "status": "real"
    },
    "faded-brown": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-brown/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-brown/back.webp"
      },
      "status": "real"
    },
    "faded-khaki": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-khaki/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-khaki/back.webp"
      },
      "status": "real"
    },
    "bone": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-bone/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-bone/back.webp"
      },
      "status": "real"
    },
    "cherry-red": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-cherry-red/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-cherry-red/back.webp"
      },
      "status": "real"
    },
    "denim-blue": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-denim-blue/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-denim-blue/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-dark-heather/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-dark-heather/back.webp"
      },
      "status": "real"
    },
    "faded-burgundy": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-burgundy/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-burgundy/back.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "faded-mustard": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-mustard/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-mustard/back.webp"
      },
      "status": "real"
    },
    "faded-pink": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-pink/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-pink/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "faded-white": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-faded-white/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-faded-white/back.webp"
      },
      "status": "real"
    },
    "light-grey": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-light-grey/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-light-grey/back.webp"
      },
      "status": "real"
    },
    "light-charcoal": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-light-charcoal/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-light-charcoal/back.webp"
      },
      "status": "real"
    },
    "light-heather": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-light-heather/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-light-heather/back.webp"
      },
      "status": "real"
    },
    "burnt-yellow-mango": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-burnt-yellow-mango/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-burnt-yellow-mango/back.webp"
      },
      "status": "real"
    },
    "miami-pink-purple-rose": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-miami-pink-purple-rose/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-miami-pink-purple-rose/back.webp"
      },
      "status": "real"
    },
    "rfd-ready-for-dye": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-rfd-ready-for-dye/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-rfd-ready-for-dye/back.webp"
      },
      "status": "real"
    },
    "light-beige-sand": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-light-beige-sand/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-light-beige-sand/back.webp"
      },
      "status": "real"
    },
    "stone-washed-black": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-black/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-black/back.webp"
      },
      "status": "real"
    },
    "stone-washed-burgundy": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-burgundy/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-burgundy/back.webp"
      },
      "status": "real"
    },
    "stone-washed-denim": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-denim/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-denim/back.webp"
      },
      "status": "real"
    },
    "stone-washed-grey": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "stone-washed-pink": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-pink/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-pink/back.webp"
      },
      "status": "real"
    },
    "stone-washed-sage-green": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-sage-green/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-sage-green/back.webp"
      },
      "status": "real"
    },
    "stone-washed-white": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-white/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-stone-washed-white/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/earthpositive-earth-positive-pullover-hoodie-blue-dusk/front.webp",
        "back": "/products/earthpositive-earth-positive-pullover-hoodie-blue-dusk/back.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-earth-positive-women-s-half-zip-hoodie": {
    "sueded-black": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-black/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-black/back.webp"
      },
      "status": "real"
    },
    "sueded-off-white": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-off-white/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-off-white/back.webp"
      },
      "status": "real"
    },
    "sueded-light-heather": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-light-heather/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-light-heather/back.webp"
      },
      "status": "real"
    },
    "sueded-fawn": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-fawn/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-fawn/back.webp"
      },
      "status": "real"
    },
    "sueded-pale-lemon": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-pale-lemon/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-pale-lemon/back.webp"
      },
      "status": "real"
    },
    "sueded-orange": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-orange/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-orange/back.webp"
      },
      "status": "real"
    },
    "sueded-miami-pink": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-miami-pink/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-miami-pink/back.webp"
      },
      "status": "real"
    },
    "sueded-slate-green": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-slate-green/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-slate-green/back.webp"
      },
      "status": "real"
    },
    "7e8f62": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-7e8f62/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-7e8f62/back.webp"
      },
      "status": "real"
    },
    "sueded-blue-dusk": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-blue-dusk/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-blue-dusk/back.webp"
      },
      "status": "real"
    },
    "sueded-light-blue-heather": {
      "views": {
        "front": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-light-blue-heather/front.webp",
        "back": "/products/earthpositive-earth-positive-women-s-half-zip-hoodie-sueded-light-blue-heather/back.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-earth-positive-super-heavy-hoodie": {
    "black": {
      "views": {
        "front": "/products/earthpositive-earth-positive-super-heavy-hoodie-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-earthpositive-organic-mensunisex-pullover-hoodie": {
    "black": {
      "views": {
        "front": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "mango": {
      "views": {
        "front": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-mango/front.webp",
        "back": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-mango/back.webp"
      },
      "status": "real"
    },
    "melange-grey": {
      "views": {
        "front": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-melange-grey/front.webp",
        "back": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-melange-grey/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ash-black": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "earthpositive-unisex-organic-pullover-hood-ep": {
    "black": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-pullover-hood-ep-black/front.webp",
        "back": "/products/earthpositive-unisex-organic-pullover-hood-ep-black/back.webp"
      },
      "status": "real"
    },
    "sage-green": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "burgundy": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-pullover-hood-ep-burgundy/front.webp",
        "back": "/products/earthpositive-unisex-organic-pullover-hood-ep-burgundy/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-pullover-hood-ep-navy/front.webp",
        "back": "/products/earthpositive-unisex-organic-pullover-hood-ep-navy/back.webp"
      },
      "status": "real"
    },
    "bright-blue": {
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
  "just-hoods-organic-hoodie-jh201": {
    "bottle-green": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ink-blue": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-ink-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-heather": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-charcoal-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "arctic-white": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-arctic-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "baby-pink": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-baby-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-black": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-deep-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-fire-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-heather-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "mustard": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-mustard/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-new-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lavender": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-lavender/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural-stone": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-natural-stone/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky-blue": {
      "views": {
        "front": "/products/just-hoods-organic-hoodie-jh201-sky-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "just-hoods-vision-heavyweight-hoodie": {
    "arctic-white": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-arctic-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "atlantic-blue": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-atlantic-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-black": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-deep-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-lilac": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-dusty-lilac/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-fire-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-heather-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "ice-blue": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-ice-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "moss-green": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-moss-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural-clay": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-natural-clay/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural-stone": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-natural-stone/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-new-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "solid-charcoal": {
      "views": {
        "front": "/products/just-hoods-vision-heavyweight-hoodie-solid-charcoal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-authentic-hooded-sweat": {
    "mocha": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-mocha/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-mocha/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-mocha/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-black/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-black/back.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-bright-royal/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-bright-royal/back.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-classic-red/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-classic-red/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-french-navy/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-french-navy/back.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-fuchsia/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-fuchsia/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-fuchsia/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-light-oxford-heather/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-light-oxford-heather/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-light-oxford-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "ffffff": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-ffffff/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-ffffff/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-ffffff/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-bottle-green/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-bottle-green/back.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-convoy-grey-solid/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-burgundy/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-burgundy/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-burgundy/sleeve-left.webp"
      },
      "status": "real"
    },
    "olive": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-olive/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-olive/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-olive/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-grey": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-urban-grey/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-urban-grey/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-urban-grey/sleeve-left.webp"
      },
      "status": "real"
    },
    "mineral-blue": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-mineral-blue/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-mineral-blue/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-mineral-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "indigo": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-indigo/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-indigo/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-indigo/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-heather": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-sport-heather/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-sport-heather/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-sport-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "natural": {
      "views": {
        "front": "/products/russell-authentic-hooded-sweat-natural/front.webp",
        "back": "/products/russell-authentic-hooded-sweat-natural/back.webp",
        "sleeve_left": "/products/russell-authentic-hooded-sweat-natural/sleeve-left.webp"
      },
      "status": "real"
    },
    "8fd491": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    },
    "fac511": {
      "views": {
        "front": "/products/_platzhalter/platzhalter.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "placeholder"
    }
  },
  "russell-ladies-authentic-hood": {
    "black": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-black/front.webp",
        "back": "/products/russell-ladies-authentic-hood-black/back.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-bright-royal/front.webp",
        "back": "/products/russell-ladies-authentic-hood-bright-royal/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-bright-royal/sleeve-left.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-classic-red/front.webp",
        "back": "/products/russell-ladies-authentic-hood-classic-red/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-classic-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-french-navy/front.webp",
        "back": "/products/russell-ladies-authentic-hood-french-navy/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-fuchsia/front.webp",
        "back": "/products/russell-ladies-authentic-hood-fuchsia/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-fuchsia/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-light-oxford-heather/front.webp",
        "back": "/products/russell-ladies-authentic-hood-light-oxford-heather/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-light-oxford-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-white/front.webp",
        "back": "/products/russell-ladies-authentic-hood-white/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-bottle-green/front.webp",
        "back": "/products/russell-ladies-authentic-hood-bottle-green/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-convoy-grey-solid/front.webp",
        "back": "/products/russell-ladies-authentic-hood-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-ladies-authentic-hood-burgundy/front.webp",
        "back": "/products/russell-ladies-authentic-hood-burgundy/back.webp",
        "sleeve_left": "/products/russell-ladies-authentic-hood-burgundy/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "russell-hooded-sweatshirt": {
    "black": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-classic-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fuchsia": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-fuchsia/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-oxford-heather": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-light-oxford-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "purple": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sky": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-sky/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-hooded-sweatshirt-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "just-hoods-signature-heavyweight-sweat": {
    "earthy-green": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-earthy-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "arctic-white": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-arctic-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-bright-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "deep-black": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-deep-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "heather-grey": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-heather-grey/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "natural-stone": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-natural-stone/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "new-french-navy": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-new-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "solid-charcoal": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-solid-charcoal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "4f758b": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-4f758b/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "4f413c": {
      "views": {
        "front": "/products/just-hoods-signature-heavyweight-sweat-4f413c/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "jhk-hooded-sweater": {
    "black": {
      "views": {
        "front": "/products/jhk-hooded-sweater-black/front.webp",
        "back": "/products/jhk-hooded-sweater-black/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-grey-melange": {
      "views": {
        "front": "/products/jhk-hooded-sweater-dark-grey-melange/front.webp",
        "back": "/products/jhk-hooded-sweater-dark-grey-melange/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-dark-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/jhk-hooded-sweater-grey-melange/front.webp",
        "back": "/products/jhk-hooded-sweater-grey-melange/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "khaki": {
      "views": {
        "front": "/products/jhk-hooded-sweater-khaki/front.webp",
        "back": "/products/jhk-hooded-sweater-khaki/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/jhk-hooded-sweater-navy/front.webp",
        "back": "/products/jhk-hooded-sweater-navy/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/jhk-hooded-sweater-red/front.webp",
        "back": "/products/jhk-hooded-sweater-red/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/jhk-hooded-sweater-royal-blue/front.webp",
        "back": "/products/jhk-hooded-sweater-royal-blue/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/jhk-hooded-sweater-white/front.webp",
        "back": "/products/jhk-hooded-sweater-white/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "kelly-green": {
      "views": {
        "front": "/products/jhk-hooded-sweater-kelly-green/front.webp",
        "back": "/products/jhk-hooded-sweater-kelly-green/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-kelly-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mustard": {
      "views": {
        "front": "/products/jhk-hooded-sweater-mustard/front.webp",
        "back": "/products/jhk-hooded-sweater-mustard/back.webp",
        "sleeve_left": "/products/jhk-hooded-sweater-mustard/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-premium-long-sleeve-t-shirt": {
    "black": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "faded-black": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-black/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-black/back.webp"
      },
      "status": "real"
    },
    "faded-navy": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-navy/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-navy/back.webp"
      },
      "status": "real"
    },
    "faded-brown": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-brown/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-brown/back.webp"
      },
      "status": "real"
    },
    "faded-khaki": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-khaki/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-khaki/back.webp"
      },
      "status": "real"
    },
    "blue-dusk": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-blue-dusk/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-blue-dusk/back.webp"
      },
      "status": "real"
    },
    "bone": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-bone/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-bone/back.webp"
      },
      "status": "real"
    },
    "faded-mustard": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-mustard/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-mustard/back.webp"
      },
      "status": "real"
    },
    "faded-pink": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-pink/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-pink/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-french-navy/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-french-navy/back.webp"
      },
      "status": "real"
    },
    "faded-white": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-white/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-faded-white/back.webp"
      },
      "status": "real"
    },
    "rfd-ready-for-dye": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-rfd-ready-for-dye/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-rfd-ready-for-dye/back.webp"
      },
      "status": "real"
    },
    "light-beige-sand": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-light-beige-sand/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-light-beige-sand/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/earthpositive-premium-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/earthpositive-premium-long-sleeve-t-shirt-white/back.webp"
      },
      "status": "real"
    }
  },
  "gildan-ultra-cotton-long-sleeve-t-shirt": {
    "navy": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-chocolate/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-chocolate/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-chocolate/sleeve-left.webp"
      },
      "status": "real"
    },
    "ash-grey-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-ash-grey-heather/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-ash-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-ash-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "cardinal-red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-cardinal-red/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-cardinal-red/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-cardinal-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "carolina-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-carolina-blue/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-carolina-blue/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-carolina-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-charcoal-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-heather/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-heather/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-dark-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "gold": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-gold/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-gold/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-gold/sleeve-left.webp"
      },
      "status": "real"
    },
    "irish-green": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-irish-green/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-irish-green/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-irish-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-blue/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-blue/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-pink/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-pink/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "maroon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-maroon/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-maroon/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-maroon/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-orange/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-orange/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "safety-green-neon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-green-neon/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-green-neon/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-green-neon/sleeve-left.webp"
      },
      "status": "real"
    },
    "safety-orange-neon": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-orange-neon/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-orange-neon/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-safety-orange-neon/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-sport-grey-heather/front.webp",
        "back": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-sport-grey-heather/back.webp",
        "sleeve_left": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/gildan-ultra-cotton-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "sols-men-s-long-sleeve-t-shirt-imperial": {
    "royal-blue": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-royal-blue/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-royal-blue/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "oxblood": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-oxblood/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-oxblood/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-oxblood/sleeve-left.webp"
      },
      "status": "real"
    },
    "dark-khaki": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-dark-khaki/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-dark-khaki/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-dark-khaki/sleeve-left.webp"
      },
      "status": "real"
    },
    "charcoal-melange": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-charcoal-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "deep-black": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-deep-black/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-deep-black/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-deep-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-grey-melange/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-bottle-green/sleeve-left.webp"
      },
      "status": "real"
    },
    "mouse-grey-solid": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-mouse-grey-solid/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-mouse-grey-solid/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-mouse-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/sols-men-s-long-sleeve-t-shirt-imperial-orange/front.webp",
        "back": "/products/sols-men-s-long-sleeve-t-shirt-imperial-orange/back.webp",
        "sleeve_left": "/products/sols-men-s-long-sleeve-t-shirt-imperial-orange/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "neutral-ladies-long-sleeve-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-dusty-indigo/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-orange/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-orange/back.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-dusty-mint/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-lime/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-lime/back.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-charcoal/back.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-teal/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-teal/back.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-light-blue/back.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-pink/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-pink/back.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-light-pink/back.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-military/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-military/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-sports-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-white-navy-striped/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-white-navy-striped/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-yellow/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-sapphire/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-green/front.webp",
        "back": "/products/neutral-ladies-long-sleeve-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-ladies-long-sleeve-t-shirt-royal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "russell-classic-t-long-sleeve": {
    "white": {
      "views": {
        "front": "/products/russell-classic-t-long-sleeve-white/front.webp",
        "back": "/products/russell-classic-t-long-sleeve-white/back.webp",
        "sleeve_left": "/products/russell-classic-t-long-sleeve-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/russell-classic-t-long-sleeve-black/front.webp",
        "back": "/products/russell-classic-t-long-sleeve-black/back.webp",
        "sleeve_left": "/products/russell-classic-t-long-sleeve-black/sleeve-left.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-classic-t-long-sleeve-french-navy/front.webp",
        "back": "/products/russell-classic-t-long-sleeve-french-navy/back.webp",
        "sleeve_left": "/products/russell-classic-t-long-sleeve-french-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-classic-t-long-sleeve-convoy-grey-solid/front.webp",
        "back": "/products/russell-classic-t-long-sleeve-convoy-grey-solid/back.webp",
        "sleeve_left": "/products/russell-classic-t-long-sleeve-convoy-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150-long-sleeve-unisex-exact": {
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-urban-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-sport-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-millennial-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bear-brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-unisex-exact-bear-brown/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "earthpositive-unisex-organic-longsleeve-t-shirt": {
    "black": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "faded-denim": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-faded-denim/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "denim-blue": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-denim-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "light-heather": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-light-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "stone-washed-black": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-stone-washed-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "f4f4ec": {
      "views": {
        "front": "/products/earthpositive-unisex-organic-longsleeve-t-shirt-f4f4ec/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "just-cool-long-sleeve-cool-t": {
    "purple": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sapphire-blue": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-sapphire-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "arctic-white": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-arctic-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-solid": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-charcoal-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "electric-yellow-neon": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-electric-yellow-neon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fire-red": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-fire-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-french-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "jet-black": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-jet-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "electric-green-neon": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-electric-green-neon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "electric-orange-neon": {
      "views": {
        "front": "/products/just-cool-long-sleeve-cool-t-electric-orange-neon/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-t-shirt-e150-long-sleeve-women-exact": {
    "urban-khaki": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-urban-khaki/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-sport-grey-heather/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "millennial-pink": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-millennial-pink/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-bottle-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "bear-brown": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-bear-brown/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-t-shirt-e150-long-sleeve-women-exact-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-mens-t-shirt-e190-long-sleeve-exact": {
    "white": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-white/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-white/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-white/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-black/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-navy/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-navy/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-navy/sleeve-left.webp"
      },
      "status": "real"
    },
    "sport-grey-heather": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-sport-grey-heather/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-sport-grey-heather/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-sport-grey-heather/sleeve-left.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-royal-blue/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-royal-blue/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-royal-blue/sleeve-left.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-red/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-red/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-red/sleeve-left.webp"
      },
      "status": "real"
    },
    "urban-orange": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-urban-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "urban-purple": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-urban-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-dark-grey-solid/front.webp",
        "back": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-dark-grey-solid/back.webp",
        "sleeve_left": "/products/bundc-mens-t-shirt-e190-long-sleeve-exact-dark-grey-solid/sleeve-left.webp"
      },
      "status": "real"
    }
  },
  "neutral-recycled-performance-long-sleeve-t-shirt": {
    "white": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-dusty-mint/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-recycled-performance-long-sleeve-t-shirt-yellow/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "neutral-men-s-long-sleeve-t-shirt": {
    "bottle-green": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-bottle-green/back.webp"
      },
      "status": "real"
    },
    "dusty-indigo": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-dusty-indigo/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-dusty-indigo/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-dusty-indigo/sleeve-left.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-orange/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-orange/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-orange/sleeve-left.webp"
      },
      "status": "real"
    },
    "dusty-mint": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-dusty-mint/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-dusty-mint/back.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-lime/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-lime/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-lime/sleeve-left.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-black/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-black/back.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-navy/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-navy/back.webp"
      },
      "status": "real"
    },
    "sports-grey": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-sports-grey/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-sports-grey/back.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-white/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-white/back.webp"
      },
      "status": "real"
    },
    "charcoal": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-charcoal/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "teal": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-teal/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-teal/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-teal/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-blue": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-light-blue/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-light-blue/back.webp"
      },
      "status": "real"
    },
    "pink": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-pink/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-pink/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "light-pink": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-light-pink/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-light-pink/back.webp",
        "sleeve_left": "/products/neutral-men-s-long-sleeve-t-shirt-light-pink/sleeve-left.webp"
      },
      "status": "real"
    },
    "b8b8b8": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-b8b8b8/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-b8b8b8/back.webp"
      },
      "status": "real"
    },
    "bordeaux": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-bordeaux/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-bordeaux/back.webp"
      },
      "status": "real"
    },
    "military": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-military/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-military/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-red/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-red/back.webp"
      },
      "status": "real"
    },
    "dark-heather": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-dark-heather/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-dark-heather/back.webp"
      },
      "status": "real"
    },
    "white-navy-striped": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-white-navy-striped/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-white-navy-striped/back.webp"
      },
      "status": "real"
    },
    "yellow": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-yellow/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-yellow/back.webp"
      },
      "status": "real"
    },
    "sapphire": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-sapphire/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-sapphire/back.webp"
      },
      "status": "real"
    },
    "green": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-green/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-green/back.webp"
      },
      "status": "real"
    },
    "royal": {
      "views": {
        "front": "/products/neutral-men-s-long-sleeve-t-shirt-royal/front.webp",
        "back": "/products/neutral-men-s-long-sleeve-t-shirt-royal/back.webp"
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
        "front": "/products/sols-men-s-plain-fleece-jacket-norman-charcoal-grey-solid/front.webp",
        "back": "/products/sols-men-s-plain-fleece-jacket-norman-charcoal-grey-solid/back.webp"
      },
      "status": "real"
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
        "front": "/products/sols-women-s-plain-fleece-jacket-norman-charcoal-grey-solid/front.webp",
        "back": "/products/sols-women-s-plain-fleece-jacket-norman-charcoal-grey-solid/back.webp"
      },
      "status": "real"
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
        "front": "/products/sols-women-s-fleecejacket-north-aqua/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "front": "/products/sols-women-s-fleecejacket-north-burgundy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "charcoal-grey-solid": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-charcoal-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-chocolate": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-dark-chocolate/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-purple": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-dark-purple/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "fir-green": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-fir-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "grey-melange": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-grey-melange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "lime": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-lime/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "front": "/products/sols-women-s-fleecejacket-north-neon-orange/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-neon-orange/back.webp"
      },
      "status": "real"
    },
    "neon-yellow": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-neon-yellow/front.webp",
        "back": "/products/sols-women-s-fleecejacket-north-neon-yellow/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/sols-women-s-fleecejacket-north-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "front": "/products/sols-women-s-fleecejacket-north-rope/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
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
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-charcoal-grey-solid/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-charcoal-grey-solid/back.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-red/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-red/back.webp"
      },
      "status": "real"
    },
    "orange": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-orange/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-orange/back.webp"
      },
      "status": "real"
    },
    "rope": {
      "views": {
        "front": "/products/sols-mens-factor-zipped-fleece-jacket-rope/front.webp",
        "back": "/products/sols-mens-factor-zipped-fleece-jacket-rope/back.webp"
      },
      "status": "real"
    }
  },
  "russell-outdoor-fleece-jacke": {
    "black": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-black/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-black/back.webp"
      },
      "status": "real"
    },
    "bottle-green": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-bottle-green/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-bottle-green/back.webp"
      },
      "status": "real"
    },
    "bright-royal": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-bright-royal/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-bright-royal/back.webp"
      },
      "status": "real"
    },
    "burgundy": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-burgundy/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-burgundy/back.webp"
      },
      "status": "real"
    },
    "classic-red": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-classic-red/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-classic-red/back.webp"
      },
      "status": "real"
    },
    "convoy-grey-solid": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-convoy-grey-solid/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-convoy-grey-solid/back.webp"
      },
      "status": "real"
    },
    "french-navy": {
      "views": {
        "front": "/products/russell-outdoor-fleece-jacke-french-navy/front.webp",
        "back": "/products/russell-outdoor-fleece-jacke-french-navy/back.webp"
      },
      "status": "real"
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
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-brown/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-brown/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-turquoise/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-turquoise/back.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-men-s-fleece-jacket-jn-lime-green/front.webp",
        "back": "/products/jamesnicholson-men-s-fleece-jacket-jn-lime-green/back.webp"
      },
      "status": "real"
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
        "front": "/products/id-identity-microfleece-jacke-grau/front.webp",
        "back": "/products/id-identity-microfleece-jacke-grau/back.webp"
      },
      "status": "real"
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
        "front": "/products/id-identity-microfleece-jacke-rot/front.webp",
        "back": "/products/id-identity-microfleece-jacke-rot/back.webp"
      },
      "status": "real"
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
        "front": "/products/id-identity-microfleece-jacke-navy/front.webp",
        "back": "/products/id-identity-microfleece-jacke-navy/back.webp"
      },
      "status": "real"
    },
    "schwarz": {
      "views": {
        "front": "/products/id-identity-microfleece-jacke-schwarz/front.webp",
        "back": "/products/id-identity-microfleece-jacke-schwarz/back.webp"
      },
      "status": "real"
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
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-brown/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-brown/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-dark-grey-solid/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-dark-grey-solid/back.webp"
      },
      "status": "real"
    },
    "turquoise": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-turquoise/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-turquoise/back.webp"
      },
      "status": "real"
    },
    "lime-green": {
      "views": {
        "front": "/products/jamesnicholson-ladies-fleece-jacket-jn781-lime-green/front.webp",
        "back": "/products/jamesnicholson-ladies-fleece-jacket-jn781-lime-green/back.webp"
      },
      "status": "real"
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
        "front": "/products/bundc-microfleece-duo-id501-atoll/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-black/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pumpkin-orange": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-pumpkin-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  },
  "bundc-microfleece-duo-id501-women": {
    "atoll": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-atoll/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "black": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-black/front.webp",
        "back": "/products/bundc-microfleece-duo-id501-women-black/back.webp"
      },
      "status": "real"
    },
    "dark-grey-solid": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-dark-grey-solid/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "forest-green": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-forest-green/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "navy": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-navy/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "pumpkin-orange": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-pumpkin-orange/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "red": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-red/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "royal-blue": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-royal-blue/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    },
    "white": {
      "views": {
        "front": "/products/bundc-microfleece-duo-id501-women-white/front.webp",
        "back": "/products/_platzhalter/platzhalter.webp"
      },
      "status": "real"
    }
  }
};
