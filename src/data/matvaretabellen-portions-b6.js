export const MATVARETABELLEN_PORTION_SOURCE_B6 = Object.freeze({
  id: "matvaretabellen-2026-portions-b6",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/",
  licence: "NLOD 2.0 / Norsk lisens for offentlige data",
  attribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  state: "BOUNDED_STATIC_PORTION_EVIDENCE_BUNDLED",
  evidenceTranche: "B6",
  runtimeFetch: false,
  notes: "Only manually reviewed food/form + portion rows are bundled. Portion grams are used exactly as published by Matvaretabellen; no generic household-measure arithmetic or edible-fraction adjustment is inferred by this app."
});

const record = ({ canonicalIngredientId, foodId, foodName, portionName, gramsPerUnit, acceptedUnits, matchConfidence = "high", reviewNotes, supportingFoodRows = [] }) => Object.freeze({
  canonicalIngredientId,
  foodId,
  foodName,
  portionName,
  gramsPerUnit,
  acceptedUnits: Object.freeze([...acceptedUnits]),
  matchConfidence,
  reviewNotes,
  supportingFoodRows: Object.freeze(supportingFoodRows.map(item => Object.freeze({ ...item }))),
  evidenceState: "MATVARETABELLEN_2026_PORTION_MATCH",
  sourceId: MATVARETABELLEN_PORTION_SOURCE_B6.id,
  evidenceTranche: "B6"
});

export const MATVARETABELLEN_PORTION_EVIDENCE_B6 = Object.freeze({
  lemon: record({
    canonicalIngredientId: "lemon",
    foodId: "06.550",
    foodName: "Lemon, raw",
    portionName: "pcs",
    gramsPerUnit: 80,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw lemon + published piece portion match."
  }),
  garlic: record({
    canonicalIngredientId: "garlic",
    foodId: "06.038",
    foodName: "Garlic, raw",
    portionName: "clove",
    gramsPerUnit: 3,
    acceptedUnits: ["clove", "cloves"],
    reviewNotes: "Direct raw garlic + explicit clove portion. The separate 45 g whole-piece row is not used for clove quantities."
  }),
  olive_oil: record({
    canonicalIngredientId: "olive_oil",
    foodId: "08.112",
    foodName: "Oil, olive, Extra Virgin",
    portionName: "tablespoon",
    gramsPerUnit: 10,
    acceptedUnits: ["tbsp"],
    reviewNotes: "Direct extra-virgin olive-oil form match; EVOO is an explicit canonical alias."
  }),
  tomato: record({
    canonicalIngredientId: "tomato",
    foodId: "06.754",
    foodName: "Tomato, unspecified, raw",
    portionName: "pcs",
    gramsPerUnit: 95,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Generic unspecified raw tomato is preferred for the generic canonical ingredient."
  }),
  bell_pepper: record({
    canonicalIngredientId: "bell_pepper",
    foodId: "06.047",
    foodName: "Sweet pepper, green, raw",
    portionName: "pcs",
    gramsPerUnit: 145,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Green, red and yellow/orange raw sweet-pepper records each publish the same 145 g piece weight, supporting the generic bell-pepper canonical form without averaging.",
    supportingFoodRows: [
      { foodId: "06.047", foodName: "Sweet pepper, green, raw", gramsPerUnit: 145 },
      { foodId: "06.048", foodName: "Sweet pepper, red, raw", gramsPerUnit: 145 },
      { foodId: "06.088", foodName: "Sweet pepper, yellow/orange, raw", gramsPerUnit: 145 }
    ]
  }),
  soy_sauce: record({
    canonicalIngredientId: "soy_sauce",
    foodId: "10.126",
    foodName: "Soy sauce",
    portionName: "tablespoon",
    gramsPerUnit: 13,
    acceptedUnits: ["tbsp"],
    reviewNotes: "Direct generic soy-sauce + tablespoon match; sweet soy sauce is not substituted."
  }),
  onion: record({
    canonicalIngredientId: "onion",
    foodId: "06.042",
    foodName: "Onion, Norwegian, raw",
    portionName: "pcs",
    gramsPerUnit: 160,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw onion piece match. The app does not apply this weight to recipe unit 'small' because Matvaretabellen does not label this row as a small onion."
  }),
  carrot: record({
    canonicalIngredientId: "carrot",
    foodId: "06.036",
    foodName: "Carrot, Norwegian, raw",
    portionName: "pcs",
    gramsPerUnit: 80,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw carrot + published piece portion match."
  }),
  cucumber: record({
    canonicalIngredientId: "cucumber",
    foodId: "06.010",
    foodName: "Cucumber, Norwegian, raw",
    portionName: "pcs",
    gramsPerUnit: 325,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw cucumber + published piece portion match."
  }),
  eggs: record({
    canonicalIngredientId: "eggs",
    foodId: "02.001",
    foodName: "Egg, raw",
    portionName: "pcs",
    gramsPerUnit: 55,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct generic raw whole-egg piece row. This is separate from the more form-specific USDA large Grade-A evidence-only row."
  }),
  spring_onion: record({
    canonicalIngredientId: "spring_onion",
    foodId: "06.113",
    foodName: "Scallion, spring onion, raw",
    portionName: "pcs",
    gramsPerUnit: 19,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct spring-onion/scallion raw piece match."
  }),
  curry_powder: record({
    canonicalIngredientId: "curry_powder",
    foodId: "06.158",
    foodName: "Curry powder",
    portionName: "teaspoon",
    gramsPerUnit: 3,
    acceptedUnits: ["tsp"],
    reviewNotes: "Direct curry-powder + teaspoon match. No generic teaspoon arithmetic is introduced."
  }),
  aubergine: record({
    canonicalIngredientId: "aubergine",
    foodId: "06.015",
    foodName: "Aubergine, raw",
    portionName: "pcs",
    gramsPerUnit: 285,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw aubergine + published piece portion match."
  }),
  mango: record({
    canonicalIngredientId: "mango",
    foodId: "06.542",
    foodName: "Mango, raw",
    portionName: "pcs",
    gramsPerUnit: 335,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Direct raw mango + published piece portion match."
  })
});

const ambiguous = ({ canonicalIngredientId, acceptedUnits, foodId, foodName, reason, candidateGramWeights, sourceRows }) => Object.freeze({
  canonicalIngredientId,
  acceptedUnits: Object.freeze([...acceptedUnits]),
  foodId,
  foodName,
  reason,
  candidateGramWeights: Object.freeze([...candidateGramWeights]),
  sourceRows: Object.freeze(sourceRows.map(item => Object.freeze({ ...item }))),
  evidenceState: "MATVARETABELLEN_2026_PORTION_AMBIGUOUS",
  sourceId: MATVARETABELLEN_PORTION_SOURCE_B6.id,
  evidenceTranche: "B6"
});

export const MATVARETABELLEN_AMBIGUOUS_PORTIONS_B6 = Object.freeze({
  lime: ambiguous({
    canonicalIngredientId: "lime",
    acceptedUnits: ["piece", "pieces"],
    foodId: "06.603",
    foodName: "Lime, raw",
    reason: "The same source food publishes two distinct rows labelled pcs (65 g and 17 g); bare recipe piece semantics cannot choose between them.",
    candidateGramWeights: [17, 65],
    sourceRows: [
      { portionName: "pcs", gramsPerUnit: 65 },
      { portionName: "pcs", gramsPerUnit: 17 }
    ]
  }),
  avocado: ambiguous({
    canonicalIngredientId: "avocado",
    acceptedUnits: ["piece", "pieces"],
    foodId: "06.524",
    foodName: "Avocado, raw",
    reason: "Source rows distinguish small and large avocados, while the recipe unit is an unqualified piece.",
    candidateGramWeights: [130, 220],
    sourceRows: [
      { portionName: "pcs (small)", gramsPerUnit: 130 },
      { portionName: "pcs (large)", gramsPerUnit: 220 }
    ]
  })
});

export const MATVARETABELLEN_DEFERRED_PORTION_TARGETS_B6 = Object.freeze({
  "onion|small": "The reviewed raw-onion row publishes an unqualified piece weight, not a small-onion weight.",
  "sesame_oil|tsp": "The exact sesame-oil record publishes tablespoon/decilitre weights but no teaspoon; the app does not derive 1 tsp from 1/3 tbsp.",
  "red_onion|piece": "No exact acceptable raw red-onion piece row was established in the bounded discovery pass."
});

export function matvaretabellenPortionConversion(ingredientId, unit) {
  const record = MATVARETABELLEN_PORTION_EVIDENCE_B6[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return record;
}

export function matvaretabellenAmbiguousPortion(ingredientId, unit) {
  const record = MATVARETABELLEN_AMBIGUOUS_PORTIONS_B6[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return record;
}
