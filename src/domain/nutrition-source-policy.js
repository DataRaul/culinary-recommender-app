import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../data/ciqual-nutrients-b4.js";
import { CIQUAL_DENSITIES_B5 } from "../data/ciqual-nutrients-b5.js";
import { CIQUAL_DENSITIES_B7 } from "../data/ciqual-nutrients-b7.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B9,
  MATVARETABELLEN_COMPOSITION_SOURCE_B9
} from "../data/matvaretabellen-composition-b9.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10,
  MATVARETABELLEN_COMPOSITION_SOURCE_B10
} from "../data/matvaretabellen-composition-b10.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B11,
  MATVARETABELLEN_COMPOSITION_SOURCE_B11
} from "../data/matvaretabellen-composition-b11.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12,
  MATVARETABELLEN_COMPOSITION_SOURCE_B12
} from "../data/matvaretabellen-composition-b12.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13,
  MATVARETABELLEN_COMPOSITION_SOURCE_B13
} from "../data/matvaretabellen-composition-b13.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B14,
  MATVARETABELLEN_COMPOSITION_SOURCE_B14
} from "../data/matvaretabellen-composition-b14.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B16,
  MATVARETABELLEN_COMPOSITION_SOURCE_B16
} from "../data/matvaretabellen-composition-b16.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B18,
  MATVARETABELLEN_COMPOSITION_SOURCE_B18
} from "../data/matvaretabellen-composition-b18.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B19,
  MATVARETABELLEN_COMPOSITION_SOURCE_B19
} from "../data/matvaretabellen-composition-b19.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B20,
  MATVARETABELLEN_COMPOSITION_SOURCE_B20
} from "../data/matvaretabellen-composition-b20.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21,
  MATVARETABELLEN_COMPOSITION_SOURCE_B21
} from "../data/matvaretabellen-composition-b21.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B22,
  MATVARETABELLEN_COMPOSITION_SOURCE_B22
} from "../data/matvaretabellen-composition-b22.js";
import {
  USDA_FOUNDATION_DENSITIES,
  USDA_FOUNDATION_SOURCE,
  nutritionEvidenceForIngredient
} from "../data/nutrition-evidence.js";

const CIQUAL_CANONICAL_ALIASES = {
  egg: "eggs",
  mushrooms: "mushroom",
  yogurt: "greek_yogurt"
};

const canonicalizeCiqual = (records, evidenceTranche) => Object.entries(records).map(([id, record]) => [
  CIQUAL_CANONICAL_ALIASES[id] || id,
  { ...record, evidenceTranche }
]);

const CIQUAL_B4_CANONICAL_ENTRIES = canonicalizeCiqual(CIQUAL_DENSITIES_B4, "B4");
const CIQUAL_B5_CANONICAL_ENTRIES = canonicalizeCiqual(CIQUAL_DENSITIES_B5, "B5");
const CIQUAL_B7_CANONICAL_ENTRIES = canonicalizeCiqual(CIQUAL_DENSITIES_B7, "B7");
const b4Ids = new Set(CIQUAL_B4_CANONICAL_ENTRIES.map(([id]) => id));
const b5Ids = new Set(CIQUAL_B5_CANONICAL_ENTRIES.map(([id]) => id));
const duplicateB5Ids = CIQUAL_B5_CANONICAL_ENTRIES.map(([id]) => id).filter(id => b4Ids.has(id));
if (duplicateB5Ids.length) throw new Error(`Ciqual B5 duplicates frozen B4 canonical IDs: ${duplicateB5Ids.sort().join(", ")}`);
const duplicateB7Ids = CIQUAL_B7_CANONICAL_ENTRIES.map(([id]) => id).filter(id => b4Ids.has(id) || b5Ids.has(id));
if (duplicateB7Ids.length) throw new Error(`Ciqual B7 duplicates earlier canonical IDs: ${duplicateB7Ids.sort().join(", ")}`);

export const CIQUAL_CANONICAL_DENSITIES = Object.fromEntries([
  ...CIQUAL_B4_CANONICAL_ENTRIES,
  ...CIQUAL_B5_CANONICAL_ENTRIES,
  ...CIQUAL_B7_CANONICAL_ENTRIES
]);

export const CIQUAL_BOUNDED_RECORD_COUNTS = {
  b4: CIQUAL_B4_CANONICAL_ENTRIES.length,
  b5: CIQUAL_B5_CANONICAL_ENTRIES.length,
  b7: CIQUAL_B7_CANONICAL_ENTRIES.length,
  total: CIQUAL_B4_CANONICAL_ENTRIES.length + CIQUAL_B5_CANONICAL_ENTRIES.length + CIQUAL_B7_CANONICAL_ENTRIES.length
};

export const EUROPEAN_PRIMARY_POLICY_V1 = {
  id: "european-primary-v1",
  context: "CANARY_ISLANDS_SPAIN_EUROPE",
  principle: "Prefer reviewed European composition when food-form match is equally good or better and constituent evidence is sufficient; otherwise retain the stronger available source.",
  geographyTieBreak: "EUROPEAN_SOURCE_WINS_EQUAL_FORM_MATCH_WHEN_CIQUAL_FIELD_CONFIDENCE_IS_A_B_OR_C",
  dConfidenceRule: "CIQUAL_D_DOES_NOT_DISPLACE_AVAILABLE_USDA_BUT_MAY_BE_USED_WHEN_IT_IS_THE_ONLY_REVIEWED_SOURCE",
  fieldCompletionRule: "EXACT_REVIEWED_MATVARETABELLEN_MAY_FILL_ONLY_A_TRACKED_FIELD_MISSING_FROM_ALL_EXISTING_REVIEWED_USDA_AND_CIQUAL_CANDIDATES",
  carbohydrateRule: "USDA_CARBOHYDRATE_BY_DIFFERENCE_AND_EUROPEAN_AVAILABLE_CARBOHYDRATE_ARE_DISTINCT_SEMANTICS_AND_MUST_NOT_BE_SUMMED_IN_ONE_AUTHORITATIVE_RECIPE_TOTAL",
  averaging: "PROHIBITED",
  regulatoryEvidence: "SEPARATE_FROM_COMPOSITION",
  medicalPersonalization: "PROHIBITED"
};

// Preserve the frozen B4 source snapshot exactly as introduced while exposing the
// later human-approved runtime policy separately. Later bounded review tranches
// extend the same official Ciqual 2025 dataset without rewriting earlier records
// or broadening source-selection rules.
export const CIQUAL_RUNTIME_SOURCE_V1 = {
  ...CIQUAL_2025_SOURCE,
  evidenceIntroductionState: CIQUAL_2025_SOURCE.state,
  evidenceIntroductionPolicy: CIQUAL_2025_SOURCE.runtimePolicy,
  state: "BOUNDED_STATIC_REVIEWED_EVIDENCE_ELIGIBLE_FOR_POLICY_SELECTION",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  sourceSelectionPolicyId: EUROPEAN_PRIMARY_POLICY_V1.id,
  sourceSelectionContext: EUROPEAN_PRIMARY_POLICY_V1.context,
  selectionBoundary: "EXPLICIT_PER_INGREDIENT_PER_NUTRIENT_POLICY_ONLY",
  evidenceTranches: ["B4", "B5", "B7"],
  boundedRecordCounts: CIQUAL_BOUNDED_RECORD_COUNTS
};

const matvaretabellenCompositionIds = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B9);
const overlappingMatvaretabellenIds = matvaretabellenCompositionIds.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) || Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId)
);
if (overlappingMatvaretabellenIds.length) {
  throw new Error(`Matvaretabellen B9 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenIds.sort().join(", ")}`);
}

const matvaretabellenCompletionIds = Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10);
const invalidCompletionIds = matvaretabellenCompletionIds.filter(ingredientId =>
  !Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) || Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId)
);
if (invalidCompletionIds.length) {
  throw new Error(`Matvaretabellen B10 must remain a Ciqual-only exact field-completion lane: ${invalidCompletionIds.sort().join(", ")}`);
}

const matvaretabellenB11Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B11);
const overlappingMatvaretabellenB11Ids = matvaretabellenB11Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId)
);
if (overlappingMatvaretabellenB11Ids.length) {
  throw new Error(`Matvaretabellen B11 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB11Ids.sort().join(", ")}`);
}

const matvaretabellenB12CompletionIds = Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12);
const invalidB12CompletionIds = matvaretabellenB12CompletionIds.filter(ingredientId =>
  !Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId)
);
if (invalidB12CompletionIds.length) {
  throw new Error(`Matvaretabellen B12 must remain a Ciqual-only exact field-completion lane with no earlier Matvaretabellen overlap: ${invalidB12CompletionIds.sort().join(", ")}`);
}

const matvaretabellenB13CompletionIds = Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13);
const invalidB13CompletionIds = matvaretabellenB13CompletionIds.filter(ingredientId =>
  !Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId)
);
if (invalidB13CompletionIds.length) {
  throw new Error(`Matvaretabellen B13 must remain a Ciqual-only exact field-completion lane with no earlier Matvaretabellen overlap: ${invalidB13CompletionIds.sort().join(", ")}`);
}

const matvaretabellenB14Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B14);
const overlappingMatvaretabellenB14Ids = matvaretabellenB14Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (overlappingMatvaretabellenB14Ids.length) {
  throw new Error(`Matvaretabellen B14 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB14Ids.sort().join(", ")}`);
}

const matvaretabellenB16Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B16);
const overlappingMatvaretabellenB16Ids = matvaretabellenB16Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (overlappingMatvaretabellenB16Ids.length) {
  throw new Error(`Matvaretabellen B16 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB16Ids.sort().join(", ")}`);
}

const matvaretabellenB18Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B18);
const overlappingMatvaretabellenB18Ids = matvaretabellenB18Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B16, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (overlappingMatvaretabellenB18Ids.length) {
  throw new Error(`Matvaretabellen B18 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB18Ids.sort().join(", ")}`);
}

const matvaretabellenB19Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B19);
const overlappingMatvaretabellenB19Ids = matvaretabellenB19Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B16, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B18, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (overlappingMatvaretabellenB19Ids.length) {
  throw new Error(`Matvaretabellen B19 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB19Ids.sort().join(", ")}`);
}

const matvaretabellenB20Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B20);
const overlappingMatvaretabellenB20Ids = matvaretabellenB20Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B16, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B18, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B19, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (overlappingMatvaretabellenB20Ids.length) {
  throw new Error(`Matvaretabellen B20 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB20Ids.sort().join(", ")}`);
}

const matvaretabellenB21CompletionIds = Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21);
const invalidB21CompletionIds = matvaretabellenB21CompletionIds.filter(ingredientId =>
  !Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B16, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B18, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B19, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B20, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId)
);
if (invalidB21CompletionIds.length) {
  throw new Error(`Matvaretabellen B21 must remain a Ciqual-only exact field-completion lane with no earlier Matvaretabellen overlap: ${invalidB21CompletionIds.sort().join(", ")}`);
}

const matvaretabellenB22Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B22);
const overlappingMatvaretabellenB22Ids = matvaretabellenB22Ids.filter(ingredientId =>
  Object.hasOwn(CIQUAL_CANONICAL_DENSITIES, ingredientId) ||
  Object.hasOwn(USDA_FOUNDATION_DENSITIES, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B9, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B11, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B14, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B16, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B18, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B19, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_DENSITIES_B20, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, ingredientId) ||
  Object.hasOwn(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21, ingredientId)
);
if (overlappingMatvaretabellenB22Ids.length) {
  throw new Error(`Matvaretabellen B22 must remain a bounded no-overlap composition extension: ${overlappingMatvaretabellenB22Ids.sort().join(", ")}`);
}

const formRank = confidence => ({ high: 3, medium: 2, low: 1 }[confidence] || 0);
const ciqualFieldGoodEnoughToDisplace = confidence => ["A", "B", "C"].includes(confidence);

const USDA_FIELDS = {
  energyKcal: { field: "energyKcal", semantic: "ENERGY_ATWATER_FOUNDATION", method: "USDA_FOUNDATION_ATWATER" },
  proteinG: { field: "proteinG", semantic: "PROTEIN_USDA_FOUNDATION", method: "USDA_FOUNDATION" },
  carbohydrateG: { field: "carbohydrateG", semantic: "CARBOHYDRATE_BY_DIFFERENCE_USDA_1005", method: "USDA_1005_BY_DIFFERENCE" },
  fatG: { field: "fatG", semantic: "TOTAL_FAT", method: "USDA_FOUNDATION" },
  fibreG: { field: "fibreG", semantic: "DIETARY_FIBRE_USDA_1079", method: "USDA_1079" }
};

const CIQUAL_FIELDS = {
  energyKcal: { field: "energyEu1169Kcal", confidenceField: "energyEu1169Kcal", semantic: "ENERGY_EU_1169_2011", method: "CIQUAL_EU_1169_2011" },
  proteinG: { field: "proteinJonesG", confidenceField: "proteinJonesG", semantic: "PROTEIN_CIQUAL_JONES", method: "CIQUAL_JONES" },
  carbohydrateG: { field: "carbohydrateAvailableG", confidenceField: "carbohydrateAvailableG", semantic: "AVAILABLE_CARBOHYDRATE_CIQUAL_CHOAVL", method: "CIQUAL_CHOAVL" },
  fatG: { field: "fatG", confidenceField: "fatG", semantic: "TOTAL_FAT", method: "CIQUAL" },
  fibreG: { field: "fibreG", confidenceField: "fibreG", semantic: "DIETARY_FIBRE_CIQUAL", method: "CIQUAL" }
};

const MATVARETABELLEN_FIELDS = {
  energyKcal: { field: "energyKcal", semantic: "ENERGY_MATVARETABELLEN_PUBLISHED" },
  proteinG: { field: "proteinG", semantic: "PROTEIN_MATVARETABELLEN" },
  carbohydrateG: { field: "carbohydrateG", semantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO" },
  fatG: { field: "fatG", semantic: "TOTAL_FAT" },
  fibreG: { field: "fibreG", semantic: "DIETARY_FIBRE_MATVARETABELLEN" }
};

const finiteOrNull = value => typeof value === "number" && Number.isFinite(value) ? value : null;

const matvaretabellenCandidate = (ingredientId, nutrientKey, records, sourceMetadata) => {
  const record = records[ingredientId];
  if (!record) return null;
  const spec = MATVARETABELLEN_FIELDS[nutrientKey];
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: "matvaretabellen",
    sourceId: sourceMetadata.id,
    sourceIdentifier: record.foodId,
    evidenceTranche: record.evidenceTranche,
    value,
    semantic: spec.semantic,
    method: evidence?.method || "MATVARETABELLEN_PUBLISHED_VALUE",
    formConfidence: record.matchConfidence,
    fieldConfidence: null,
    description: record.foodName,
    matchNotes: record.matchNotes,
    scientificName: record.scientificName || null,
    sourceCodes: evidence?.sourceCode ? [evidence.sourceCode] : []
  };
};

const sourceCandidate = (ingredientId, nutrientKey, source) => {
  if (source === "ciqual") {
    const record = CIQUAL_CANONICAL_DENSITIES[ingredientId];
    if (!record) return null;
    const spec = CIQUAL_FIELDS[nutrientKey];
    const value = finiteOrNull(record.per100g?.[spec.field]);
    if (value === null) return null;
    const fieldConfidence = record.confidenceCodes?.[spec.confidenceField] || null;
    return {
      source: "ciqual",
      sourceId: CIQUAL_RUNTIME_SOURCE_V1.id,
      sourceIdentifier: record.alimCode,
      evidenceTranche: record.evidenceTranche,
      value,
      semantic: spec.semantic,
      method: spec.method,
      formConfidence: record.matchConfidence,
      fieldConfidence,
      description: record.nameEn,
      matchNotes: record.matchNotes,
      scientificName: record.scientificName || null,
      sourceCodes: record.sourceCodes || []
    };
  }

  if (source === "matvaretabellen-b9") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B9, MATVARETABELLEN_COMPOSITION_SOURCE_B9);
  }

  if (source === "matvaretabellen-b10") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10, MATVARETABELLEN_COMPOSITION_SOURCE_B10);
  }

  if (source === "matvaretabellen-b11") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B11, MATVARETABELLEN_COMPOSITION_SOURCE_B11);
  }

  if (source === "matvaretabellen-b12") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12, MATVARETABELLEN_COMPOSITION_SOURCE_B12);
  }

  if (source === "matvaretabellen-b13") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13, MATVARETABELLEN_COMPOSITION_SOURCE_B13);
  }

  if (source === "matvaretabellen-b14") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B14, MATVARETABELLEN_COMPOSITION_SOURCE_B14);
  }

  if (source === "matvaretabellen-b16") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B16, MATVARETABELLEN_COMPOSITION_SOURCE_B16);
  }

  if (source === "matvaretabellen-b18") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B18, MATVARETABELLEN_COMPOSITION_SOURCE_B18);
  }

  if (source === "matvaretabellen-b19") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B19, MATVARETABELLEN_COMPOSITION_SOURCE_B19);
  }

  if (source === "matvaretabellen-b20") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B20, MATVARETABELLEN_COMPOSITION_SOURCE_B20);
  }

  if (source === "matvaretabellen-b21") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21, MATVARETABELLEN_COMPOSITION_SOURCE_B21);
  }

  if (source === "matvaretabellen-b22") {
    return matvaretabellenCandidate(ingredientId, nutrientKey, MATVARETABELLEN_COMPOSITION_DENSITIES_B22, MATVARETABELLEN_COMPOSITION_SOURCE_B22);
  }

  const record = USDA_FOUNDATION_DENSITIES[ingredientId];
  if (!record) return null;
  const spec = USDA_FIELDS[nutrientKey];
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const identity = nutritionEvidenceForIngredient(ingredientId);
  return {
    source: "usda",
    sourceId: USDA_FOUNDATION_SOURCE.id,
    sourceIdentifier: record.fdcId,
    evidenceTranche: null,
    value,
    semantic: spec.semantic,
    method: spec.method,
    formConfidence: identity?.matchConfidence || "medium",
    fieldConfidence: null,
    description: record.description,
    matchNotes: identity?.notes || null,
    scientificName: null,
    sourceCodes: []
  };
};

export const selectEuropeanPrimaryNutrient = (ingredientId, nutrientKey) => {
  const standaloneMatvaretabellen =
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b9") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b11") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b14") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b16") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b18") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b19") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b20") ||
    sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b22");
  if (standaloneMatvaretabellen) return { ...standaloneMatvaretabellen, selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE" };

  const usda = sourceCandidate(ingredientId, nutrientKey, "usda");
  const ciqual = sourceCandidate(ingredientId, nutrientKey, "ciqual");
  if (!usda && !ciqual) {
    const completion =
      sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b10") ||
      sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b12") ||
      sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b13") ||
      sourceCandidate(ingredientId, nutrientKey, "matvaretabellen-b21");
    return completion ? { ...completion, selectionReason: "EUROPEAN_EXACT_FIELD_COMPLETION" } : null;
  }
  if (!usda) return { ...ciqual, selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE" };
  if (!ciqual) return { ...usda, selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE" };

  const ciqualFormRank = formRank(ciqual.formConfidence);
  const usdaFormRank = formRank(usda.formConfidence);
  if (ciqualFormRank > usdaFormRank && ciqualFieldGoodEnoughToDisplace(ciqual.fieldConfidence)) {
    return { ...ciqual, selectionReason: "EUROPEAN_FORM_MATCH_STRONGER" };
  }
  if (ciqualFormRank === usdaFormRank && ciqualFieldGoodEnoughToDisplace(ciqual.fieldConfidence)) {
    return { ...ciqual, selectionReason: "EUROPEAN_GEOGRAPHY_TIE_BREAK" };
  }
  return {
    ...usda,
    selectionReason: ciqualFormRank < usdaFormRank
      ? "USDA_FORM_MATCH_STRONGER"
      : ciqual.fieldConfidence === "D"
        ? "CIQUAL_D_CONFIDENCE_DOES_NOT_DISPLACE_USDA"
        : "USDA_RETAINED_BY_CONSERVATIVE_POLICY"
  };
};

export const europeanPrimaryDensityForIngredient = ingredientId => {
  const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];
  const selections = Object.fromEntries(nutrientKeys.map(key => [key, selectEuropeanPrimaryNutrient(ingredientId, key)]));
  if (!nutrientKeys.some(key => selections[key])) return null;
  return {
    per100g: Object.fromEntries(nutrientKeys.map(key => [key, selections[key]?.value ?? null])),
    provenanceByNutrient: Object.fromEntries(nutrientKeys.map(key => [key, selections[key] ? {
      source: selections[key].source,
      sourceId: selections[key].sourceId,
      sourceIdentifier: selections[key].sourceIdentifier,
      evidenceTranche: selections[key].evidenceTranche,
      semantic: selections[key].semantic,
      method: selections[key].method,
      selectionReason: selections[key].selectionReason,
      formConfidence: selections[key].formConfidence,
      fieldConfidence: selections[key].fieldConfidence,
      description: selections[key].description,
      matchNotes: selections[key].matchNotes,
      scientificName: selections[key].scientificName,
      sourceCodes: selections[key].sourceCodes
    } : null]))
  };
};

export const EUROPEAN_PRIMARY_DENSITIES_V1 = Object.fromEntries(
  [...new Set([
    ...Object.keys(USDA_FOUNDATION_DENSITIES),
    ...Object.keys(CIQUAL_CANONICAL_DENSITIES),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B9),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B11),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B14),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B16),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B18),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B19),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B20),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21),
    ...Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B22)
  ])]
    .map(ingredientId => [ingredientId, europeanPrimaryDensityForIngredient(ingredientId)])
    .filter(([, record]) => record)
);

export const europeanPrimaryPolicyCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const records = unique.map(ingredientId => ({ ingredientId, record: EUROPEAN_PRIMARY_DENSITIES_V1[ingredientId] || null }));
  const selections = records.flatMap(({ ingredientId, record }) => Object.entries(record?.provenanceByNutrient || {})
    .filter(([, provenance]) => provenance)
    .map(([nutrient, provenance]) => ({ ingredientId, nutrient, ...provenance })));
  return {
    policy: EUROPEAN_PRIMARY_POLICY_V1,
    ingredientCount: unique.length,
    evidenceIngredientCount: records.filter(item => item.record).length,
    ciqualSelectedCount: selections.filter(item => item.source === "ciqual").length,
    usdaSelectedCount: selections.filter(item => item.source === "usda").length,
    matvaretabellenSelectedCount: selections.filter(item => item.source === "matvaretabellen").length,
    ciqualB4SelectedCount: selections.filter(item => item.source === "ciqual" && item.evidenceTranche === "B4").length,
    ciqualB5SelectedCount: selections.filter(item => item.source === "ciqual" && item.evidenceTranche === "B5").length,
    ciqualB7SelectedCount: selections.filter(item => item.source === "ciqual" && item.evidenceTranche === "B7").length,
    matvaretabellenB9SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B9").length,
    matvaretabellenB10SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B10").length,
    matvaretabellenB11SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B11").length,
    matvaretabellenB12SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B12").length,
    matvaretabellenB13SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B13").length,
    matvaretabellenB14SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B14").length,
    matvaretabellenB16SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B16").length,
    matvaretabellenB18SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B18").length,
    matvaretabellenB19SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B19").length,
    matvaretabellenB20SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B20").length,
    matvaretabellenB21SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B21").length,
    matvaretabellenB22SelectedCount: selections.filter(item => item.source === "matvaretabellen" && item.evidenceTranche === "B22").length,
    selections
  };
};