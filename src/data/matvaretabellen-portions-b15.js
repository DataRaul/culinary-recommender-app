// Separate bounded portion evidence discovered from the same exact Matvaretabellen 2026
// food rows used by composition tranches B11/B14. This file deliberately does not
// change those composition contracts: portion eligibility is reviewed and routed here.

export const MATVARETABELLEN_PORTION_SOURCE_B15 = Object.freeze({
  id: "matvaretabellen-2026-portions-b15",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/",
  licence: "NLOD 2.0 / Norsk lisens for offentlige data",
  attribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  state: "BOUNDED_STATIC_PORTION_EVIDENCE_BUNDLED",
  evidenceTranche: "B15",
  runtimeFetch: false,
  notes: "Only exact manually reviewed food/form + published portion rows are bundled. No portion is inferred from composition, volume arithmetic, edible fractions or adjacent food identities."
});

const record = ({ canonicalIngredientId, foodId, foodName, scientificName, portionName, gramsPerUnit, acceptedUnits, reviewNotes }) => Object.freeze({
  canonicalIngredientId,
  foodId,
  foodName,
  scientificName,
  portionName,
  gramsPerUnit,
  acceptedUnits: Object.freeze([...acceptedUnits]),
  matchConfidence: "high",
  reviewNotes,
  evidenceState: "MATVARETABELLEN_2026_PORTION_MATCH",
  sourceId: MATVARETABELLEN_PORTION_SOURCE_B15.id,
  evidenceTranche: "B15"
});

export const MATVARETABELLEN_PORTION_EVIDENCE_B15 = Object.freeze({
  courgette: record({
    canonicalIngredientId: "courgette",
    foodId: "06.085",
    foodName: "Squash, zucchini, raw",
    scientificName: "Cucurbita pepo L.",
    portionName: "pcs",
    gramsPerUnit: 285,
    acceptedUnits: ["piece", "pieces"],
    reviewNotes: "Exact raw courgette/zucchini identity; canonical courgette explicitly includes zucchini as an alias. The published 285 g pcs row is used directly. The separate 15 g slice row is not generalized to piece quantities."
  }),
  cumin: record({
    canonicalIngredientId: "cumin",
    foodId: "06.266",
    foodName: "Cumin seeds, ground",
    scientificName: "Cuminum cyminum L.",
    portionName: "teaspoon",
    gramsPerUnit: 3,
    acceptedUnits: ["tsp"],
    reviewNotes: "Exact ground-cumin identity matching the B11 canonical form; the published teaspoon row is 3 g. This does not authorize whole cumin seed or generic spice teaspoon arithmetic."
  }),
  turmeric: record({
    canonicalIngredientId: "turmeric",
    foodId: "06.153",
    foodName: "Turmeric, ground",
    scientificName: "Curcuma longa L.",
    portionName: "teaspoon",
    gramsPerUnit: 3,
    acceptedUnits: ["tsp"],
    reviewNotes: "Exact ground-turmeric identity matching the B11 canonical form; the published teaspoon row is 3 g. This does not authorize whole turmeric root or generic spice teaspoon arithmetic."
  })
});

export function matvaretabellenPortionConversionB15(ingredientId, unit) {
  const record = MATVARETABELLEN_PORTION_EVIDENCE_B15[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return record;
}
