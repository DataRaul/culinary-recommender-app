// Bounded static household-portion evidence from the official Norwegian Food Composition Table 2026.
// This tranche is portion-only and intentionally separate from B6/B15 portions and B16 composition evidence.
// Only the exact reviewed Sesame paste, tahini + tablespoon source row is admitted. No teaspoon conversion,
// bread-spread portion substitution, generic sesame-butter mapping, or household arithmetic is permitted.

export const MATVARETABELLEN_PORTION_SOURCE_B17 = Object.freeze({
  id: "matvaretabellen-2026-portions-b17",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  licence: "NLOD 2.0 / Norsk lisens for offentlige data",
  attribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  evidenceTranche: "B17",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE",
  runtimeFetch: false
});

const tahiniTablespoon = Object.freeze({
  canonicalIngredientId: "tahini",
  foodId: "06.702",
  foodName: "Sesame paste, tahini",
  sourcePortionId: "spiseskje",
  sourcePortionName: "tablespoon",
  sourcePortionUnit: "stk",
  sourceQuantity: 16,
  sourceUnit: "g",
  gramsPerUnit: 16,
  units: Object.freeze(["tbsp"]),
  formNotes: "Exact B16 tahini identity only. The official source row is tablespoon = 16 g. The separate 'For a slice of bread' = 15 g row is not interchangeable and no teaspoon or other household conversion is inferred.",
  sourceId: MATVARETABELLEN_PORTION_SOURCE_B17.id,
  evidenceTranche: "B17",
  evidenceState: "MATVARETABELLEN_2026_EXACT_PORTION_MATCH"
});

export const MATVARETABELLEN_PORTION_EVIDENCE_B17 = Object.freeze({
  tahini: tahiniTablespoon
});

export const matvaretabellenPortionConversionB17 = (ingredientId, unit) => {
  const record = MATVARETABELLEN_PORTION_EVIDENCE_B17[ingredientId];
  if (!record || !record.units.includes(unit)) return null;
  return record;
};
