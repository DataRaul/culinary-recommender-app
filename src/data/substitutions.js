export const SUBSTITUTIONS = {
  feta: [
    { ingredientId: "cottage_cheese", type: "close_substitute", note: "Milder and less salty; texture is softer." },
    { ingredientId: "tofu_firm", type: "dietary_substitute", note: "Crumble and season assertively; this changes flavour and texture but can fill the same salty-creamy role." }
  ],
  ricotta: [
    { ingredientId: "cottage_cheese", type: "close_substitute", note: "Blend or mash for a smoother texture; slightly tangier and less rich." },
    { ingredientId: "greek_yogurt", type: "functional_substitute", note: "Useful in sauces off heat; thinner and tangier than ricotta." }
  ],
  parmesan: [
    { ingredientId: "feta", type: "flavour_direction", note: "Adds salty dairy character but not the same nutty aged flavour; reduce added salt." }
  ],
  greek_yogurt: [
    { ingredientId: "cottage_cheese", type: "functional_substitute", note: "Blend smooth for sauces or bowls; thicker and less tangy." },
    { ingredientId: "coconut_milk", type: "dietary_substitute", note: "Works for creaminess in cooked dishes but changes flavour and is not a protein-equivalent replacement." }
  ],
  butter: [
    { ingredientId: "olive_oil", type: "functional_substitute", note: "Good for sautéing and many savoury finishes; lacks butter's dairy flavour and water content." },
    { ingredientId: "neutral_oil", type: "emergency_approximation", note: "Provides cooking fat without butter flavour; use mainly for sautéing rather than finishing." }
  ],
  quinoa: [
    { ingredientId: "brown_rice", type: "functional_substitute", note: "Less nutty and lower in protein, but works as a grain base." },
    { ingredientId: "couscous", type: "emergency_approximation", note: "Faster-cooking wheat option; texture differs and it contains gluten." }
  ],
  bulgur: [
    { ingredientId: "couscous", type: "close_substitute", note: "Similar wheat-based role in salads and bowls, though couscous is softer and less chewy." },
    { ingredientId: "quinoa", type: "dietary_substitute", note: "Gluten-free grain-like base with a different flavour and texture." }
  ],
  barley: [
    { ingredientId: "brown_rice", type: "functional_substitute", note: "Less chewy but works in bowls and stews; gluten-free by ingredient." },
    { ingredientId: "quinoa", type: "functional_substitute", note: "Cooks faster and is less chewy; use when a lighter grain base is acceptable." }
  ],
  couscous: [
    { ingredientId: "bulgur", type: "close_substitute", note: "Chewier and generally needs a little more cooking time." },
    { ingredientId: "quinoa", type: "dietary_substitute", note: "Different flavour and texture but works well as a gluten-free bowl or salad base." }
  ],
  orzo: [
    { ingredientId: "wholewheat_pasta", type: "functional_substitute", note: "Use a small pasta shape if available; the eating texture will be less rice-like." },
    { ingredientId: "rice", type: "emergency_approximation", note: "Changes the dish substantially but can preserve a one-pan grain-base format." }
  ],
  noodles: [
    { ingredientId: "rice_noodles", type: "dietary_substitute", note: "Different chew and sauce absorption; useful when wheat is unsuitable." },
    { ingredientId: "wholewheat_pasta", type: "emergency_approximation", note: "Texture and culinary character differ, but many sauces still work." }
  ],
  rice_noodles: [
    { ingredientId: "noodles", type: "functional_substitute", note: "Wheat noodles are chewier and contain gluten; otherwise work in many stir-fry formats." },
    { ingredientId: "wholewheat_pasta", type: "emergency_approximation", note: "Use only when preserving the sauce matters more than noodle texture." }
  ],
  rice: [
    { ingredientId: "basmati_rice", type: "close_substitute", note: "More aromatic and separate-grained; broadly interchangeable in bowls and curries." },
    { ingredientId: "brown_rice", type: "functional_substitute", note: "Chewier and slower-cooking with a nuttier flavour." }
  ],
  basmati_rice: [
    { ingredientId: "jasmine_rice", type: "close_substitute", note: "More floral and slightly stickier, but works in most rice-bowl and curry contexts." },
    { ingredientId: "rice", type: "functional_substitute", note: "Neutral long-grain rice works reliably with less aroma." }
  ],
  jasmine_rice: [
    { ingredientId: "basmati_rice", type: "close_substitute", note: "Drier and more separate-grained but similarly aromatic." },
    { ingredientId: "rice", type: "functional_substitute", note: "Neutral long-grain rice is less fragrant but structurally reliable." }
  ],
  kale: [
    { ingredientId: "spinach", type: "close_substitute", note: "More delicate; add later in cooking." },
    { ingredientId: "cabbage", type: "functional_substitute", note: "Needs longer cooking and gives a firmer texture." }
  ],
  spinach: [
    { ingredientId: "kale", type: "functional_substitute", note: "More robust and fibrous; chop and cook longer." },
    { ingredientId: "rocket", type: "flavour_direction", note: "Pepperier and more delicate; best in quick wilting or fresh applications." }
  ],
  broccoli: [
    { ingredientId: "cauliflower", type: "close_substitute", note: "Similar cooking role with a milder flavour and slightly denser texture." },
    { ingredientId: "green_beans", type: "texture_substitute", note: "Keeps a crisp green vegetable role but changes shape and flavour." }
  ],
  cauliflower: [
    { ingredientId: "broccoli", type: "close_substitute", note: "More vegetal and greener in flavour; timing is broadly similar." },
    { ingredientId: "courgette", type: "functional_substitute", note: "Softer and wetter; brown in a wider pan and cook for less time." }
  ],
  courgette: [
    { ingredientId: "aubergine", type: "functional_substitute", note: "Needs longer cooking and more browning; richer texture." },
    { ingredientId: "bell_pepper", type: "flavour_direction", note: "Sweeter and firmer, but fills a quick-cooking vegetable role." }
  ],
  mushroom: [
    { ingredientId: "aubergine", type: "texture_substitute", note: "Can provide a browned, meaty texture but tastes different and usually needs more oil management." }
  ],
  edamame: [
    { ingredientId: "chickpeas", type: "functional_substitute", note: "Different flavour and less protein-dense, but easy to source." },
    { ingredientId: "peas", type: "texture_substitute", note: "Similar green pop and convenience, but substantially lower in protein." }
  ],
  tempeh: [
    { ingredientId: "tofu_firm", type: "functional_substitute", note: "Softer and milder; press and brown well." },
    { ingredientId: "chickpeas", type: "emergency_approximation", note: "Not a texture equivalent, but can preserve a plant-protein role in curries and bowls." }
  ],
  tofu_firm: [
    { ingredientId: "tempeh", type: "functional_substitute", note: "Firmer, nuttier and more assertive; slice thinly and reduce cooking time if already browned." },
    { ingredientId: "chickpeas", type: "emergency_approximation", note: "Changes texture completely but preserves a plant-protein component in many bowls and curries." }
  ],
  coconut_milk: [
    { ingredientId: "coconut_cream", type: "close_substitute", note: "Richer and thicker; dilute with water before using." },
    { ingredientId: "greek_yogurt", type: "functional_substitute", note: "Add off heat to avoid splitting; changes flavour and is not vegan." }
  ],
  coconut_cream: [
    { ingredientId: "coconut_milk", type: "close_substitute", note: "Thinner; simmer a little longer or use slightly less added liquid." },
    { ingredientId: "greek_yogurt", type: "functional_substitute", note: "Tangier and dairy-based; add off heat and expect a different flavour direction." }
  ],
  tahini: [
    { ingredientId: "peanut_butter", type: "functional_substitute", note: "More pronounced flavour; use only when peanut is acceptable." },
    { ingredientId: "greek_yogurt", type: "emergency_approximation", note: "Can replace creamy sauce body but loses sesame flavour and adds dairy." }
  ],
  peanut_butter: [
    { ingredientId: "tahini", type: "functional_substitute", note: "Less sweet and more sesame-forward; adjust acid and seasoning." }
  ],
  salmon: [
    { ingredientId: "hake", type: "functional_substitute", note: "Much leaner and milder; cook more gently and expect less richness." },
    { ingredientId: "cod", type: "functional_substitute", note: "Lean, flaky and mild; reduce cooking time if using thinner pieces." }
  ],
  hake: [
    { ingredientId: "cod", type: "close_substitute", note: "Similarly lean and flaky; thickness may require timing changes." },
    { ingredientId: "salmon", type: "flavour_direction", note: "Richer and oilier; works structurally but changes the dish substantially." }
  ],
  cod: [
    { ingredientId: "hake", type: "close_substitute", note: "Similar lean white-fish role; watch thickness and cooking time." },
    { ingredientId: "salmon", type: "flavour_direction", note: "Richer, oilier fish that changes flavour but can fill the protein role." }
  ],
  chicken_breast: [
    { ingredientId: "chicken_thigh", type: "close_substitute", note: "Juicier and richer; allow a little more cooking time and trim excess fat if desired." },
    { ingredientId: "turkey_mince", type: "emergency_approximation", note: "Changes shape and texture; suitable only in skillets, sauces or bowls where minced meat fits." }
  ],
  chicken_thigh: [
    { ingredientId: "chicken_breast", type: "close_substitute", note: "Leaner and quicker to dry out; reduce cooking time and avoid overcooking." }
  ],
  black_beans: [
    { ingredientId: "pinto_beans", type: "close_substitute", note: "Creamier and milder but highly compatible in bowls, tacos and stews." },
    { ingredientId: "kidney_beans", type: "functional_substitute", note: "Firmer and larger; works well in hearty bowls and stews." }
  ],
  pinto_beans: [
    { ingredientId: "black_beans", type: "close_substitute", note: "Slightly earthier and darker; broadly interchangeable in tacos and bowls." },
    { ingredientId: "kidney_beans", type: "functional_substitute", note: "Firmer texture and larger size but similar hearty-bean role." }
  ],
  white_beans: [
    { ingredientId: "chickpeas", type: "functional_substitute", note: "Firmer and nuttier but works in salads and tomato stews." },
    { ingredientId: "lentils", type: "emergency_approximation", note: "Changes texture and shape but can preserve a legume-protein role in soups and stews." }
  ],
  lemon: [
    { ingredientId: "lime", type: "close_substitute", note: "Sharper and more aromatic; good in most savoury applications." },
    { ingredientId: "rice_vinegar", type: "emergency_approximation", note: "Provides acidity but no citrus aroma; use less and taste as you go." }
  ],
  lime: [
    { ingredientId: "lemon", type: "close_substitute", note: "Less aromatic and slightly rounder acidity but broadly interchangeable." },
    { ingredientId: "rice_vinegar", type: "emergency_approximation", note: "Adds acidity without citrus character; use sparingly." }
  ],
  parsley: [
    { ingredientId: "coriander", type: "flavour_direction", note: "More distinctive and citrusy; suitable only when that flavour direction fits." },
    { ingredientId: "mint", type: "flavour_direction", note: "Cooler and sweeter; best in salads and Middle Eastern-style bowls." }
  ],
  coriander: [
    { ingredientId: "parsley", type: "functional_substitute", note: "Milder and less citrusy but gives fresh herb lift without coriander's distinctive flavour." }
  ]
};
