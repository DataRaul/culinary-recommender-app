import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
  MATVARETABELLEN_COMPOSITION_SOURCE_B26
} from "../data/matvaretabellen-composition-b26.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B27,
  MATVARETABELLEN_COMPOSITION_SOURCE_B27
} from "../data/matvaretabellen-composition-b27.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B28,
  MATVARETABELLEN_COMPOSITION_SOURCE_B28
} from "../data/matvaretabellen-composition-b28.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B29,
  MATVARETABELLEN_COMPOSITION_SOURCE_B29
} from "../data/matvaretabellen-composition-b29.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30,
  MATVARETABELLEN_COMPOSITION_SOURCE_B30
} from "../data/matvaretabellen-composition-b30.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B31,
  MATVARETABELLEN_COMPOSITION_SOURCE_B31
} from "../data/matvaretabellen-composition-b31.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B32,
  MATVARETABELLEN_COMPOSITION_SOURCE_B32
} from "../data/matvaretabellen-composition-b32.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34,
  MATVARETABELLEN_COMPOSITION_SOURCE_B34
} from "../data/matvaretabellen-composition-b34.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B35,
  MATVARETABELLEN_COMPOSITION_SOURCE_B35
} from "../data/matvaretabellen-composition-b35.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B36,
  MATVARETABELLEN_COMPOSITION_SOURCE_B36
} from "../data/matvaretabellen-composition-b36.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B43,
  MATVARETABELLEN_COMPOSITION_SOURCE_B43
} from "../data/matvaretabellen-composition-b43.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B44,
  MATVARETABELLEN_COMPOSITION_SOURCE_B44
} from "../data/matvaretabellen-composition-b44.js";
import {
  MEXT_COMPOSITION_DENSITIES_B39,
  MEXT_COMPOSITION_SOURCE_B39
} from "../data/mext-composition-b39.js";
import {
  CIQUAL_RUNTIME_SOURCE_V1,
  EUROPEAN_PRIMARY_DENSITIES_V1 as BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  EUROPEAN_PRIMARY_POLICY_V1,
  europeanPrimaryPolicyCoverage as baseEuropeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient
} from "./nutrition-source-policy.js";

// Keep post-B25 evidence additions in a small additive runtime registry. The frozen
// historical policy module remains the baseline. Standalone composition tranches
// must be disjoint from the baseline and from each other; exact field-completion
// tranches may overlap a baseline ingredient only for explicitly missing fields.
const POST_B25_TRANCHES = Object.freeze([
  Object.freeze({
    key: "B26",
    countKey: "matvaretabellenB26SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B26
  }),
  Object.freeze({
    key: "B27",
    countKey: "matvaretabellenB27SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B27,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B27
  }),
  Object.freeze({
    key: "B28",
    countKey: "matvaretabellenB28SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B28,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B28
  }),
  Object.freeze({
    key: "B29",
    countKey: "matvaretabellenB29SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B29,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B29
  }),
  Object.freeze({
    key: "B31",
    countKey: "matvaretabellenB31SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B31,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B31
  }),
  Object.freeze({
    key: "B32",
    countKey: "matvaretabellenB32SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B32,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B32
  }),
  Object.freeze({
    key: "B35",
    countKey: "matvaretabellenB35SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B35,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B35
  }),
  Object.freeze({
    key: "B36",
    countKey: "matvaretabellenB36SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B36,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B36
  }),
  Object.freeze({
    key: "B43",
    countKey: "matvaretabellenB43SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B43,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B43
  }),
  Object.freeze({
    key: "B44",
    countKey: "matvaretabellenB44SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B44,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B44
  })
]);

const POST_B25_COMPLETION_TRANCHES = Object.freeze([
  Object.freeze({
    key: "B30",
    countKey: "matvaretabellenB30SelectedCount",
    completions: MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B30
  }),
  Object.freeze({
    key: "B34",
    countKey: "matvaretabellenB34SelectedCount",
    completions: MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B34
  })
]);

const MEXT_FIELDS = Object.freeze({
  energyKcal: Object.freeze({ field: "energyKcal", semantic: "ENERGY_MEXT_PUBLISHED" }),
  proteinG: Object.freeze({ field: "proteinG", semantic: "PROTEIN_MEXT" }),
  carbohydrateG: Object.freeze({ field: "carbohydrateG", semantic: "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF" }),
  fatG: Object.freeze({ field: "fatG", semantic: "TOTAL_FAT" }),
  fibreG: Object.freeze({ field: "fibreG", semantic: "DIETARY_FIBRE_MEXT" })
});

const POST_B25_PROVIDER_TRANCHES = Object.freeze([
  Object.freeze({
    key: "B39",
    countKey: "mextB39SelectedCount",
    sourceName: "mext",
    defaultMethod: "MEXT_PUBLISHED_VALUE",
    fields: MEXT_FIELDS,
    densities: MEXT_COMPOSITION_DENSITIES_B39,
    source: MEXT_COMPOSITION_SOURCE_B39
  })
]);

const seenIngredientIds = new Set(Object.keys(BASE_EUROPEAN_PRIMARY_DENSITIES_V1));
for (const tranche of [...POST_B25_TRANCHES, ...POST_B25_PROVIDER_TRANCHES]) {
  const trancheIds = Object.keys(tranche.densities);
  const overlaps = trancheIds.filter(ingredientId => seenIngredientIds.has(ingredientId));
  if (overlaps.length) {
    throw new Error(`${tranche.source.id} ${tranche.key} must remain a bounded no-overlap composition extension: ${overlaps.sort().join(", ")}`);
  }
  for (const ingredientId of trancheIds) seenIngredientIds.add(ingredientId);
}

const MATVARETABELLEN_FIELDS = {
  energyKcal: { field: "energyKcal", semantic: "ENERGY_MATVARETABELLEN_PUBLISHED" },
  proteinG: { field: "proteinG", semantic: "PROTEIN_MATVARETABELLEN" },
  carbohydrateG: { field: "carbohydrateG", semantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO" },
  fatG: { field: "fatG", semantic: "TOTAL_FAT" },
  fibreG: { field: "fibreG", semantic: "DIETARY_FIBRE_MATVARETABELLEN" }
};

const nutrientKeys = Object.keys(MATVARETABELLEN_FIELDS);
const finiteOrNull = value => typeof value === "number" && Number.isFinite(value) ? value : null;

for (const tranche of POST_B25_COMPLETION_TRANCHES) {
  for (const [ingredientId, record] of Object.entries(tranche.completions)) {
    if (!Object.hasOwn(BASE_EUROPEAN_PRIMARY_DENSITIES_V1, ingredientId)) {
      throw new Error(`Matvaretabellen ${tranche.key} field completion requires an existing baseline ingredient: ${ingredientId}`);
    }
    const eligible = [...(record.eligibleCompletionFields || [])];
    if (!eligible.length || eligible.some(field => !nutrientKeys.includes(field))) {
      throw new Error(`Matvaretabellen ${tranche.key} field completion must declare valid eligibleCompletionFields: ${ingredientId}`);
    }
    for (const field of eligible) {
      if (selectBaseEuropeanPrimaryNutrient(ingredientId, field)) {
        throw new Error(`Matvaretabellen ${tranche.key} cannot displace an existing reviewed baseline field: ${ingredientId}.${field}`);
      }
      if (finiteOrNull(record.per100g?.[field]) === null) {
        throw new Error(`Matvaretabellen ${tranche.key} eligible completion field must contain a finite value: ${ingredientId}.${field}`);
      }
    }
  }
}

const candidateFromTranche = (tranche, ingredientId, nutrientKey) => {
  const record = tranche.densities[ingredientId];
  const spec = MATVARETABELLEN_FIELDS[nutrientKey];
  if (!record || !spec) return null;
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: "matvaretabellen",
    sourceId: tranche.source.id,
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
    sourceCodes: evidence?.sourceCode ? [evidence.sourceCode] : [],
    selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE"
  };
};

const candidateFromCompletionTranche = (tranche, ingredientId, nutrientKey) => {
  const record = tranche.completions[ingredientId];
  const spec = MATVARETABELLEN_FIELDS[nutrientKey];
  if (!record || !spec || !(record.eligibleCompletionFields || []).includes(nutrientKey)) return null;
  if (selectBaseEuropeanPrimaryNutrient(ingredientId, nutrientKey)) return null;
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: "matvaretabellen",
    sourceId: tranche.source.id,
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
    sourceCodes: evidence?.sourceCode ? [evidence.sourceCode] : [],
    selectionReason: "EUROPEAN_EXACT_FIELD_COMPLETION"
  };
};

const candidateFromProviderTranche = (tranche, ingredientId, nutrientKey) => {
  const record = tranche.densities[ingredientId];
  const spec = tranche.fields[nutrientKey];
  if (!record || !spec) return null;
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: tranche.sourceName,
    sourceId: tranche.source.id,
    sourceIdentifier: record.foodId,
    evidenceTranche: record.evidenceTranche,
    value,
    semantic: spec.semantic,
    method: evidence?.method || tranche.defaultMethod,
    formConfidence: record.matchConfidence,
    fieldConfidence: null,
    description: record.foodName,
    matchNotes: record.matchNotes,
    scientificName: record.scientificName || null,
    sourceCodes: evidence?.sourceCode ? [evidence.sourceCode] : [],
    selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE"
  };
};

const postBaselineCandidate = (ingredientId, nutrientKey) => {
  for (const tranche of POST_B25_TRANCHES) {
    const candidate = candidateFromTranche(tranche, ingredientId, nutrientKey);
    if (candidate) return candidate;
  }
  return null;
};

const postBaselineCompletionCandidate = (ingredientId, nutrientKey) => {
  for (const tranche of POST_B25_COMPLETION_TRANCHES) {
    const candidate = candidateFromCompletionTranche(tranche, ingredientId, nutrientKey);
    if (candidate) return candidate;
  }
  return null;
};

const postBaselineProviderCandidate = (ingredientId, nutrientKey) => {
  for (const tranche of POST_B25_PROVIDER_TRANCHES) {
    const candidate = candidateFromProviderTranche(tranche, ingredientId, nutrientKey);
    if (candidate) return candidate;
  }
  return null;
};

export const selectEuropeanPrimaryNutrient = (ingredientId, nutrientKey) =>
  selectBaseEuropeanPrimaryNutrient(ingredientId, nutrientKey) ||
  postBaselineCandidate(ingredientId, nutrientKey) ||
  postBaselineCompletionCandidate(ingredientId, nutrientKey) ||
  postBaselineProviderCandidate(ingredientId, nutrientKey);

const densityFromSelections = ingredientId => {
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

const runtimeOverrideIngredientIds = [...new Set([
  ...POST_B25_TRANCHES.flatMap(tranche => Object.keys(tranche.densities)),
  ...POST_B25_COMPLETION_TRANCHES.flatMap(tranche => Object.keys(tranche.completions)),
  ...POST_B25_PROVIDER_TRANCHES.flatMap(tranche => Object.keys(tranche.densities))
])];
const POST_B25_EUROPEAN_PRIMARY_DENSITIES = Object.fromEntries(
  runtimeOverrideIngredientIds
    .map(ingredientId => [ingredientId, densityFromSelections(ingredientId)])
    .filter(([, record]) => record)
);

export const EUROPEAN_PRIMARY_DENSITIES_V1 = Object.freeze({
  ...BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  ...POST_B25_EUROPEAN_PRIMARY_DENSITIES
});

export const RUNTIME_MATVARETABELLEN_COMPOSITION_SOURCES = Object.freeze([
  ...POST_B25_TRANCHES.map(tranche => tranche.source),
  ...POST_B25_COMPLETION_TRANCHES.map(tranche => tranche.source)
]);

export const RUNTIME_PROVIDER_COMPOSITION_SOURCES = Object.freeze([
  ...POST_B25_PROVIDER_TRANCHES.map(tranche => tranche.source)
]);

export const europeanPrimaryPolicyCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const base = baseEuropeanPrimaryPolicyCoverage(unique);
  const matvarePostSelections = unique.flatMap(ingredientId => nutrientKeys
    .map(nutrient => ({
      ingredientId,
      nutrient,
      selection: postBaselineCandidate(ingredientId, nutrient) || postBaselineCompletionCandidate(ingredientId, nutrient)
    }))
    .filter(item => item.selection)
    .map(({ ingredientId: id, nutrient, selection }) => ({ ingredientId: id, nutrient, ...selection }))
  );
  const providerPostSelections = unique.flatMap(ingredientId => nutrientKeys
    .map(nutrient => ({
      ingredientId,
      nutrient,
      selection: postBaselineProviderCandidate(ingredientId, nutrient)
    }))
    .filter(item => item.selection)
    .map(({ ingredientId: id, nutrient, selection }) => ({ ingredientId: id, nutrient, ...selection }))
  );
  const postSelections = [...matvarePostSelections, ...providerPostSelections];
  const standaloneIngredientIds = new Set([
    ...POST_B25_TRANCHES.flatMap(tranche => Object.keys(tranche.densities)),
    ...POST_B25_PROVIDER_TRANCHES.flatMap(tranche => Object.keys(tranche.densities))
  ]);
  const postEvidenceIngredientCount = unique.filter(ingredientId => standaloneIngredientIds.has(ingredientId)).length;
  const allRuntimeTranches = [...POST_B25_TRANCHES, ...POST_B25_COMPLETION_TRANCHES, ...POST_B25_PROVIDER_TRANCHES];
  const trancheCounts = Object.fromEntries(allRuntimeTranches.map(tranche => [
    tranche.countKey,
    postSelections.filter(selection => selection.evidenceTranche === tranche.key).length
  ]));
  return {
    ...base,
    evidenceIngredientCount: base.evidenceIngredientCount + postEvidenceIngredientCount,
    matvaretabellenSelectedCount: base.matvaretabellenSelectedCount + matvarePostSelections.length,
    mextSelectedCount: providerPostSelections.filter(selection => selection.source === "mext").length,
    ...trancheCounts,
    selections: [...base.selections, ...postSelections]
  };
};

export { CIQUAL_RUNTIME_SOURCE_V1, EUROPEAN_PRIMARY_POLICY_V1 };
