// Generated from USDA FoodData Central Foundation Foods Version 15.0 / 2026-04-30.
// Only portion rows for the already-reviewed bounded Foundation identities are retained.
// Absence of a row means USDA did not publish a portion weight for that selected food;
// it must not be replaced with a generic household-weight guess.
export const USDA_FOUNDATION_PORTION_SOURCE = {
  id: "usda-fdc-foundation-2026-04-portions-v1",
  name: "USDA FoodData Central — Foundation Foods portions",
  releaseDate: "2026-04-30",
  releaseVersion: "15.0",
  archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip",
  sourceUrl: "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip",
  license: "CC0-1.0 / U.S. public domain",
  state: "BOUNDED_STATIC_PORTION_EVIDENCE_IMPORTED"
};

export const USDA_FOUNDATION_PORTION_EVIDENCE_V1 = {
  banana: [
    {
      fdcId: "1105314",
      ndbNumber: "9040",
      description: "Bananas, ripe and slightly ripe, raw",
      amount: 1,
      gramWeight: 115,
      measureUnitId: "1119",
      measureUnit: "Banana",
      modifier: "Peeled",
      dataPoints: 102,
      minYearAcquired: 2019
    }
  ],
  tuna: [
    {
      fdcId: "334194",
      ndbNumber: "15121",
      description: "Fish, tuna, light, canned in water, drained solids",
      amount: 1,
      gramWeight: 107,
      measureUnitId: "1019",
      measureUnit: "can",
      modifier: "drained solids",
      dataPoints: 48,
      minYearAcquired: 2011
    },
    {
      fdcId: "334194",
      ndbNumber: "15121",
      description: "Fish, tuna, light, canned in water, drained solids",
      amount: 1,
      gramWeight: 142,
      measureUnitId: "1019",
      measureUnit: "can",
      modifier: "total can contents",
      dataPoints: 48,
      minYearAcquired: 2011
    }
  ]
};

// Automatic conversions are deliberately narrower than the raw portion evidence.
// `piece` for canonical banana is accepted because the USDA measure is one peeled
// Banana. Ordinary tuna `can` is intentionally NOT accepted: USDA publishes both
// drained-solids and total-contents weights, so a bare `can` is ambiguous.
export const USDA_FOUNDATION_PORTION_CONVERSIONS_V1 = {
  banana: {
    piece: {
      gramsPerUnit: 115,
      sourceUnit: "Banana",
      modifier: "Peeled",
      fdcId: "1105314",
      evidenceState: "USDA_FOUNDATION_PORTION_MATCH"
    },
    pieces: {
      gramsPerUnit: 115,
      sourceUnit: "Banana",
      modifier: "Peeled",
      fdcId: "1105314",
      evidenceState: "USDA_FOUNDATION_PORTION_MATCH"
    }
  }
};

export const USDA_FOUNDATION_AMBIGUOUS_PORTIONS_V1 = {
  tuna: {
    can: {
      reason: "USDA publishes both 107 g drained-solids and 142 g total-can-content portions; recipe form must disambiguate before conversion.",
      candidateGramWeights: [107, 142]
    },
    cans: {
      reason: "USDA publishes both 107 g drained-solids and 142 g total-can-content portions; recipe form must disambiguate before conversion.",
      candidateGramWeights: [107, 142]
    }
  }
};

export const usdaFoundationPortionConversion = (ingredientId, unit) =>
  USDA_FOUNDATION_PORTION_CONVERSIONS_V1[ingredientId]?.[String(unit || "").toLowerCase()] || null;

export const usdaFoundationAmbiguousPortion = (ingredientId, unit) =>
  USDA_FOUNDATION_AMBIGUOUS_PORTIONS_V1[ingredientId]?.[String(unit || "").toLowerCase()] || null;
