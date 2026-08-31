// Generated from the official ANSES-Ciqual 2025 XML dataset after strict B7 recipe-unlock review.
// This tranche is intentionally tiny: only records with defensible food/form identity and direct recipe-level value are retained.
// Missing or below-limit values remain null. Nutrient semantics are preserved by the source-policy layer.

const RAW = {
  quinoa: [
    "9340",
    "Quinoa, raw",
    "Quinoa, cru",
    null,
    "high",
    "Direct raw quinoa match. Authored recipes quantify dry quinoa in grams and then cook it, so the source form matches the measured recipe state.",
    [354, 358, 13.2, 58.1, 6.07, 7],
    ["D", "D", "B", "B", "B", "B"],
    ["444", "361"]
  ],
  prawns: [
    "10021",
    "Shrimp or prawn, raw",
    "Crevette, crue",
    "(Genus and species unknown or multiple)",
    "high",
    "Direct generic raw shrimp/prawn match. The priority authored recipe quantifies prawns in grams and explicitly cooks them until opaque, establishing raw input form.",
    [99, 99, 19.7, 3.21, 0.84, 0],
    ["D", "D", "D", "D", "D", "D"],
    ["444", "1868", "1135"]
  ],
  orzo: [
    "9810",
    "Pasta, dry, regular, raw",
    "Pâtes sèches, standard, crues",
    null,
    "medium",
    "Reviewed category-level match for canonical orzo/risoni: the ontology explicitly classifies orzo as wheat pasta with gluten, and the authored recipe quantifies dry grams before absorption cooking. No egg-pasta record is used. The source does not name the orzo shape, so provenance retains the category-level match rather than claiming exact shape identity.",
    [359, 364, 12, 72.7, 1.6, 2.91],
    ["D", "D", "C", "C", "C", "C"],
    ["444", "1107"]
  ]
};

const [energyJonesWithFibreKcal, energyEu1169Kcal, proteinJonesG, carbohydrateAvailableG, fatG, fibreG] = [0, 1, 2, 3, 4, 5];
const expand = ([alimCode, nameEn, nameFr, scientificName, matchConfidence, matchNotes, values, confidence, sourceCodes]) => ({
  alimCode,
  nameEn,
  nameFr,
  scientificName,
  matchConfidence,
  matchNotes,
  per100g: {
    energyJonesWithFibreKcal: values[energyJonesWithFibreKcal],
    energyEu1169Kcal: values[energyEu1169Kcal],
    proteinJonesG: values[proteinJonesG],
    carbohydrateAvailableG: values[carbohydrateAvailableG],
    fatG: values[fatG],
    fibreG: values[fibreG]
  },
  confidenceCodes: {
    energyJonesWithFibreKcal: confidence[energyJonesWithFibreKcal],
    energyEu1169Kcal: confidence[energyEu1169Kcal],
    proteinJonesG: confidence[proteinJonesG],
    carbohydrateAvailableG: confidence[carbohydrateAvailableG],
    fatG: confidence[fatG],
    fibreG: confidence[fibreG]
  },
  sourceCodes
});

export const CIQUAL_DENSITIES_B7 = Object.fromEntries(Object.entries(RAW).map(([ingredientId, record]) => [ingredientId, expand(record)]));
export const ciqualB7DensityForIngredient = ingredientId => CIQUAL_DENSITIES_B7[ingredientId] || null;
