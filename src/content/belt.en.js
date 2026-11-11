/**
 * SIIL Ostomy Belt: verified page content (English, US).
 *
 * Transcribed verbatim from section 4 of prompts/01-ostomy-belt-scroll-page.md
 * (facts captured from https://www.siilostomy.com/en/ostomy-belt/ on 2026-11-11).
 *
 * Rules that apply to this file (section 1 of the prompt):
 *  - Every word of customer-facing copy on the page comes from here. Nothing is
 *    paraphrased, extended or invented. If a fact is missing, the element is left
 *    out and a line is added to OPEN-QUESTIONS.md.
 *  - Nothing listed in section 5 of the prompt (held-back claims) may be added.
 *  - Interface labels and ARIA labels live in ./ui.en.js, not here.
 */
export const content = {
  meta: {
    title: "SIIL Ostomy Belt",
    product_url: "https://www.siilostomy.com/en/ostomy-belt/",
    price: "$76.99",
    currency_note: "USD, English (US) page"
  },
  nav: {
    brand: "SIIL Ostomy Belt",
    links: [
      "Why SIIL Belt",
      "Size guide",
      "Specifications",
      "FAQ"
    ],
    cta: "Add to cart — $76.99"
  },
  hero: {
    eyebrow: "Ostomy belt",
    title: "SIIL Ostomy Belt",
    headline: "Forget you're wearing a bag.",
    bullets: [
      "The inner pocket carries its weight: your pouch stays flat and still.",
      "Invisible under jeans, shirts and fitted dresses.",
      "Empty it, swim in it, sleep in it: the belt stays on."
    ],
    cta: "Add to cart — $76.99",
    secondary: "📏 Size guide",
    shipping: "Free US shipping on orders over $50",
    specline: "7 sizes XS–3XL · 55–140 cm waist · Beige, navy blue and black"
  },
  fit: {
    eyebrow: "Comfort that fits you",
    headline: "Put it on. Forget it's there.",
    body: "Stretch, take a walk or settle into your favorite chair. The inner pocket holds your pouch close, while the adjustable VELCRO® fastening lets you find a fit that feels right.",
    chips: [
      "7 sizes XS–3XL",
      "55–140 cm waist"
    ],
    cta: "Pick your size",
    counter1: {
      value: 7,
      unit: "sizes XS–3XL"
    },
    counter2: {
      from: 55,
      to: 140,
      unit: "cm waist"
    },
    hotspots: [
      {
        label: "Pouch pocket",
        text: "An inner pocket holds the pouch flat and carries its weight as it fills"
      },
      {
        label: "Fastening",
        text: "Adjustable VELCRO® closure, with a zipper for quick pouch access"
      },
      {
        label: "Fabric",
        text: "Breathable, quick-dry, antibacterial and hypoallergenic; pool and sea ready"
      }
    ]
  },
  clothes: {
    eyebrow: "Your clothes. Your choice.",
    headline: "Wear the clothes you love.",
    body: "Your pouch lies flat against your body, so nothing shows under your clothes. Wear the outfits that feel like you.",
    chips: [
      "Universal pouch fit",
      "1- & 2-piece systems"
    ],
    cta: "Shop the belt"
  },
  access: {
    eyebrow: "Keep your routine simple",
    headline: "Empty your pouch. Keep your belt on.",
    body: "The access opening lets you reach your pouch without taking the belt off. Empty it into the toilet, close your pouch and the opening, then get back to your day.",
    chips: [
      "Reinforced YKK zip",
      "Both-side access"
    ],
    cta: "Add yours to cart",
    list: [
      {
        label: "Works with",
        value: "All major pouch brands, one-piece or two-piece; colostomy, ileostomy or urostomy"
      },
      {
        label: "Fastening",
        value: "Adjustable VELCRO® closure, with a zipper for quick pouch access"
      },
      {
        label: "For",
        value: "Women and men"
      }
    ]
  },
  pool: {
    eyebrow: "Make room for your plans",
    headline: "Back in the pool.",
    body: "Swim, walk, chase the kids: the belt holds your pouch through all of it. Quick-dry fabric, comfortable from the sea to the towel to lunch.",
    chips: [
      "Hypoallergenic",
      "Pool + sea OK",
      "Machine wash"
    ],
    cta: "Get my belt"
  },
  colors: {
    eyebrow: "Colors",
    headline: "Beige, navy blue and black",
    body: "Choose Beige, Navy Blue or Black to suit your clothes and preferences.",
    options: [
      "Beige",
      "Navy Blue",
      "Black"
    ]
  },
  close: {
    eyebrow: "Why SIIL Belt",
    headline: "The bag stays put. You get your day back.",
    body: "A walk in the park, coffee with your best friend, the grandkids on your lap: you think about everything except your bag.",
    counter: {
      value: 30,
      unit: "days from delivery"
    },
    returns: "Try it at home: you have 30 days from delivery to return or exchange it, and your first size exchange ships free.",
    cta: "Add to cart — $76.99",
    lines: [
      "Free US shipping on orders over $50",
      "Order now · arrives in 3–5 business days",
      "Discreet packaging · Plain box, your privacy first"
    ]
  },
  sticky: {
    label: "SIIL Ostomy Belt · {color} · pick size",
    cta: "Add — $76.99"
  },
  difference: {
    eyebrow: "The difference",
    title: "SIIL Belt vs. cheap belt · surgical binder",
    headline: "Same waist. Different day.",
    columns: [
      "SIIL Belt",
      "Cheap belt",
      "Surgical binder"
    ],
    rows: [
      [
        "Internal pouch pocket",
        "Holds bag flat",
        "No pocket",
        "No pocket"
      ],
      [
        "Zipper pouch-access",
        "Empty without removing",
        "Remove every time",
        "Remove every time"
      ],
      [
        "Quick-dry, swim-ready",
        "Pool + sea OK",
        "Cotton only",
        "Not waterproof"
      ],
      [
        "Discreet under clothes",
        "Invisible",
        "Bulky seams",
        "Medical look"
      ],
      [
        "Hypoallergenic fabric",
        "Skin-safe daily wear",
        "Generic",
        "Stiff"
      ]
    ]
  },
  size_guide: {
    eyebrow: "Size guide",
    headline: "Find your perfect fit",
    body: "Measure your waist at the level of the stoma over light clothing. The VELCRO® gives you full adjustability.",
    toggle: [
      "Inches",
      "CM"
    ],
    columns: [
      "Size",
      "Waist",
      "Best for"
    ],
    rows: [
      [
        "XS",
        "21.7–29.5 in",
        "55–75 cm",
        "Petite frames · post-op recovery"
      ],
      [
        "S",
        "29.5–34.3 in",
        "75–87 cm",
        "Slim build"
      ],
      [
        "M",
        "34.6–38.2 in",
        "88–97 cm",
        "Average build · most common"
      ],
      [
        "L",
        "38.6–42.5 in",
        "98–108 cm",
        "Curvier · sturdy build"
      ],
      [
        "XL",
        "42.9–46.5 in",
        "109–118 cm",
        "Plus size"
      ],
      [
        "XXL",
        "46.9–50.8 in",
        "119–129 cm",
        "Extended plus"
      ],
      [
        "3XL",
        "51.2–55.1 in",
        "130–140 cm",
        "Extra-extended · large frames"
      ]
    ],
    link: {
      text: "📏 Open the interactive size finder →",
      url: "https://www.siilostomy.com/en/size-guide/"
    }
  },
  specifications: {
    eyebrow: "Specifications",
    headline: "The ostomy belt at a glance",
    body: "Everything you need to compare before you choose.",
    rows: [
      [
        "Works with",
        "All major pouch brands, one-piece or two-piece; colostomy, ileostomy or urostomy"
      ],
      [
        "Sizes",
        "7 sizes, XS–3XL: waist 21.7–55.1 in (55–140 cm)"
      ],
      [
        "Fastening",
        "Adjustable VELCRO® closure, with a zipper for quick pouch access"
      ],
      [
        "Pouch pocket",
        "An inner pocket holds the pouch flat and carries its weight as it fills"
      ],
      [
        "Fabric",
        "Breathable, quick-dry, antibacterial and hypoallergenic; pool and sea ready"
      ],
      [
        "Care",
        "Machine wash on a gentle cycle, cold water, no bleach; air dry"
      ],
      [
        "Colors",
        "Beige, navy blue and black"
      ],
      [
        "For",
        "Women and men"
      ],
      [
        "Shipping",
        "Ships in 24h, arrives in 3–5 business days; free US shipping on orders over $50"
      ],
      [
        "Returns",
        "30 days from delivery; your first size exchange is free"
      ]
    ]
  },
  faq: {
    eyebrow: "FAQ",
    headline: "Real questions, real answers",
    body: "Everything ostomates ask before their first SIIL belt.",
    items: [
      {
        q: "What is the SIIL Ostomy Belt?",
        a: "The SIIL Ostomy Belt supports the weight of your pouch and holds it close to your body, helping you feel more comfortable as you move. It helps smooth the pouch’s outline under clothes and lets you reach it for emptying without taking the belt off."
      },
      {
        q: "Can I wear it with any pouch system?",
        a: "Yes. The internal pocket fits all standard pouches from Coloplast, Hollister, ConvaTec, B.Braun, Welland, Salts, NuHope, Pelican and Marlen — both one-piece and two-piece systems."
      },
      {
        q: "Can I sleep with the SIIL belt?",
        a: "Absolutely — that's one of its main use cases. The breathable stretch fabric is comfortable through the night, and the internal pocket keeps the pouch flat when you turn over. Loosen the VELCRO® one notch for sleep mode."
      },
      {
        q: "Can I wear it for swimming or in the shower?",
        a: "Yes. The belt supports your pouch in the pool or sea, and its quick-drying fabric is suitable for use in water. Rinse it after swimming and follow the care instructions on the label."
      },
      {
        q: "How do I empty the bag without removing the belt?",
        a: "Use the access opening to reach your pouch and empty it into the toilet. Close your pouch securely, then close the opening. The belt can stay on throughout."
      },
      {
        q: "Is it for men, women, or both?",
        a: "Both. The belt is unisex and comes in seven sizes, XS–3XL, with an adjustable fastening. Choose Beige, Navy Blue or Black to suit your clothes and preferences."
      },
      {
        q: "How do I choose my size?",
        a: "Measure around your waist at stoma level, standing naturally and breathing normally. Open the size guide beside the size selector to compare your measurement in inches or centimeters. Use the belt guide, as sizing differs between product families."
      },
      {
        q: "How long should I wear it each day?",
        a: "Choose a comfortable fit and adjust it as needed. Follow your stoma care team’s advice after surgery."
      },
      {
        q: "Is the belt suitable just after surgery?",
        a: "Ask your stoma nurse or surgical team when a support garment is appropriate for you after surgery, and how it should fit. They can advise you based on your recovery."
      },
      {
        q: "What is the return policy?",
        a: "You have 30 days from delivery to request a return or exchange in our returns portal. Your first size exchange ships free. If anything isn't right, write to us and we'll help."
      },
      {
        q: "Is shipping free?",
        a: "Free standard shipping on orders over $50 (except Japan). Ships within 24 hours from our US fulfillment center — usually arrives in 3–5 business days. Canada delivery 3–5 business days."
      }
    ]
  },
  kit: {
    eyebrow: "Complete the kit",
    headline: "Often worn together",
    body: "Accessories to wear with the SIIL Belt",
    items: [
      {
        name: "Ostomy Bag Covers",
        url: "https://www.siilostomy.com/en/ostomy-bag-covers/"
      },
      {
        name: "Ostomy Wraps",
        url: "https://www.siilostomy.com/en/ostomy-wraps-siil-ostomy-line/"
      },
      {
        name: "Anti-Leak Panties",
        url: "https://www.siilostomy.com/en/ostomy-panty-anti-leak-post-op-menstrual-panty/"
      }
    ],
    cta: "View product"
  },
  footer: {
    strip: "30-day returns · First size exchange free",
    columns: {
      Shop: [
        [
          "Ostomy belts",
          "https://www.siilostomy.com/en/ostomy-belt/"
        ],
        [
          "Ostomy bag covers",
          "https://www.siilostomy.com/en/ostomy-bag-covers/"
        ],
        [
          "Swimwear",
          "https://www.siilostomy.com/en/ostomy-swimwear-siil-ostomy/"
        ],
        [
          "Stoma protectors",
          "https://www.siilostomy.com/en/stoma-guard-protector/"
        ],
        [
          "Ostomy supplies",
          "https://www.siilostomy.com/en/ostomy-supplies/"
        ]
      ],
      "Customer care": [
        [
          "Find your size",
          "https://www.siilostomy.com/en/size-guide-en/"
        ],
        [
          "Shipping & returns",
          "https://www.siilostomy.com/en/shipping/"
        ],
        [
          "Contact us",
          "https://www.siilostomy.com/en/contact/"
        ]
      ],
      "Guides & resources": [
        [
          "New patient guide",
          "https://www.siilostomy.com/en/new-ostomy-patient-guide/"
        ],
        [
          "Stoma care guide",
          "https://www.siilostomy.com/en/ostomy-troubleshooting-guide/"
        ],
        [
          "Nutrition guide",
          "https://www.siilostomy.com/en/ostomy-diet/"
        ],
        [
          "Ostomy associations",
          "https://www.siilostomy.com/en/ostomy-associations-support/"
        ]
      ],
      "About SIIL": [
        [
          "About SIIL",
          "https://www.siilostomy.com/en/about-us/"
        ],
        [
          "For stoma nurses",
          "https://www.siilostomy.com/en/ostomy-nurses/"
        ],
        [
          "Instagram",
          "https://www.instagram.com/siilostomy/"
        ],
        [
          "Facebook",
          "https://www.facebook.com/siilostomy"
        ]
      ]
    },
    contact: {
      label: "WE’RE HERE FOR YOU",
      email: "hola@siilostomy.com"
    },
    legal: [
      [
        "Privacy",
        "https://www.siilostomy.com/en/privacy-policy/"
      ],
      [
        "Cookies",
        "https://www.siilostomy.com/en/cookies-policy/"
      ],
      [
        "Terms & conditions",
        "https://www.siilostomy.com/en/terms-and-conditions/"
      ]
    ],
    copyright: "© 2026 SIIL Ostomy",
    logo: "https://www.siilostomy.com/wp-content/uploads/2026/01/logo_siil_Black-300x116-1.png"
  }
};

export default content;

/**
 * Strings dictated by the build prompt itself rather than by its section 4:
 *  - stageWord: the giant word behind the model (section 3, "giant word SIIL").
 *  - previewNote: the footer line required by section 1, rule 5.
 */
export const brief = {
  stageWord: 'SIIL',
  previewNote: 'Concept preview — not the live store',
};
