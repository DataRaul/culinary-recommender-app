export const P2_SCHEMA_VERSION = "CULINARY_PROTECTED_CORPUS_P2_METADATA_USABILITY_V1";
export const P2_TERMINAL_MACHINE = "PROTECTED_CORPUS_P2_FULL_V8018_EXACT_SOURCE_MEASUREMENT_PASS__LIVE_ALIGNMENT_PENDING";

const POLICY = Object.freeze({
  mealRoles: {
    userVisibleLimitation: "Meal-role filters are authoritative only where source category semantics were explicitly reviewed.",
    repairDifficulty: "MEDIUM",
    evidenceRequirement: "EXPLICIT_SOURCE_MEAL_ROLE_OR_REVIEWED_CATEGORY_MAPPING",
    nextBoundedRepairTranche: "REVIEW_HIGH_FREQUENCY_SOURCE_CATEGORY_HINTS_FOR_MEAL_ROLE_ONLY"
  },
  dishCategory: {
    userVisibleLimitation: "Dish-category filters cover only records with reviewed source-category mappings.",
    repairDifficulty: "MEDIUM",
    evidenceRequirement: "EXPLICIT_SOURCE_DISH_CATEGORY_OR_REVIEWED_CATEGORY_MAPPING",
    nextBoundedRepairTranche: "REVIEW_HIGH_FREQUENCY_UNMAPPED_SOURCE_CATEGORY_HINTS"
  },
  culinaryTradition: {
    userVisibleLimitation: "Culinary tradition remains explicit UNKNOWN; cuisine, culture, collection, or title hints are not promoted automatically.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "EXPLICIT_SOURCE_TRADITION_OR_REVIEWED_PROVENANCE_BACKED_MAPPING",
    nextBoundedRepairTranche: "DESIGN_REVIEWED_TRADITION_AUTHORITY_CONTRACT_BEFORE_ANY_MAPPING"
  },
  techniqueFamilies: {
    userVisibleLimitation: "Technique-family filtering is unavailable because no reviewed technique authority exists yet.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "STRUCTURED_SOURCE_TECHNIQUE_OR_REVIEWED_DIRECTIONS_BASED_CLASSIFICATION",
    nextBoundedRepairTranche: "DEFINE_TECHNIQUE_VOCABULARY_AND_REVIEWED_CLASSIFICATION_PILOT"
  },
  totalMinutes: {
    userVisibleLimitation: "Total-time filtering is sparse; ambiguous source time strings remain excluded.",
    repairDifficulty: "LOW_TO_MEDIUM",
    evidenceRequirement: "EXPLICIT_OR_DETERMINISTICALLY_PARSEABLE_SOURCE_TIME",
    nextBoundedRepairTranche: "REVIEW_45_AMBIGUOUS_TOTAL_TIME_RECORDS_FIRST"
  },
  difficulty: {
    userVisibleLimitation: "Difficulty filtering is available only where an explicit source difficulty scale exists.",
    repairDifficulty: "MEDIUM",
    evidenceRequirement: "EXPLICIT_SOURCE_DIFFICULTY_SCALE_WITH_SCALE_PRESERVED",
    nextBoundedRepairTranche: "MEASURE_SOURCE_COHORTS_WITH_EXPLICIT_DIFFICULTY_HINTS_BEFORE_REVIEW"
  },
  servings: {
    userVisibleLimitation: "Serving-size filtering is sparse and cannot be inferred from prose or ingredient quantity.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "EXPLICIT_SOURCE_SERVING_OR_YIELD_VALUE",
    nextBoundedRepairTranche: "IDENTIFY_SOURCE_COHORTS_WITH_EXPLICIT_YIELD_FIELDS"
  },
  geographyCountry: {
    userVisibleLimitation: "Country filtering is authoritative only for recipes with an explicit source country field.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "EXPLICIT_SOURCE_COUNTRY_OR_SEPARATELY_REVIEWED_PROVENANCE_MAPPING",
    nextBoundedRepairTranche: "DESIGN_PROVENANCE_BACKED_COUNTRY_REVIEW_WITHOUT_TITLE_OR_CUISINE_INFERENCE"
  },
  geographyRegion: {
    userVisibleLimitation: "Region filtering is unavailable; region inference is explicitly prohibited in V1.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "EXPLICIT_SOURCE_REGION_OR_REVIEWED_PROVENANCE_MAPPING",
    nextBoundedRepairTranche: "NO_REPAIR_UNTIL_REGION_AUTHORITY_CONTRACT_EXISTS"
  },
  prepMinutes: {
    userVisibleLimitation: "Prep-time filtering is sparse; ForkRecipe activeTime is deliberately not relabeled as prep time.",
    repairDifficulty: "MEDIUM",
    evidenceRequirement: "EXPLICIT_SOURCE_PREP_TIME",
    nextBoundedRepairTranche: "IDENTIFY_SOURCE_COHORTS_WITH_EXPLICIT_PREP_TIME_FIELDS"
  },
  cookMinutes: {
    userVisibleLimitation: "Cook-time filtering is sparse and remains unknown where no explicit source field exists.",
    repairDifficulty: "MEDIUM",
    evidenceRequirement: "EXPLICIT_SOURCE_COOK_TIME",
    nextBoundedRepairTranche: "IDENTIFY_SOURCE_COHORTS_WITH_EXPLICIT_COOK_TIME_FIELDS"
  },
  reviewedDietaryTags: {
    userVisibleLimitation: "Protected dietary filtering has no reviewed authority and must remain unavailable for hard safety claims.",
    repairDifficulty: "VERY_HIGH",
    evidenceRequirement: "REVIEWED_DIETARY_ALLERGEN_AUTHORITY_WITH_FAIL_CLOSED_SEMANTICS",
    nextBoundedRepairTranche: "KEEP_ZERO_UNTIL_HARD_SAFETY_AUTHORITY_PIPELINE_IS_DEFINED_AND_REVIEWED"
  }
});

export function authoritativeCount(stateCounts) {
  return Number(stateCounts?.EXACT_SOURCE_NORMALIZATION || 0) + Number(stateCounts?.REVIEWED_MAPPING || 0);
}

export function buildP2Measurement({mappingSummary,nutritionSummary,prepEvidence,p1Evidence}) {
  if (mappingSummary?.protectedCorpusVersion !== "v8018" || mappingSummary?.observedRecipeCount !== 19268 || mappingSummary?.validOverlayCount !== 19268) {
    throw new Error("P2_MAPPING_SUMMARY_NOT_EXACT_V8018");
  }
  if (nutritionSummary?.protectedCorpusVersion !== "v8018" || nutritionSummary?.observedRecipeCount !== 19268) {
    throw new Error("P2_NUTRITION_SUMMARY_NOT_EXACT_V8018");
  }
  if (p1Evidence?.terminal !== "PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS" || p1Evidence?.indexedRecipeCount !== 19268 || p1Evidence?.ftsRecipeCount !== 19268 || p1Evidence?.structuralPartialCount !== 3) {
    throw new Error("P2_P1_TERMINAL_EVIDENCE_REQUIRED");
  }
  const priority = prepEvidence?.p2DimensionPriority;
  if (!Array.isArray(priority) || priority.length !== 12) throw new Error("P2_FROZEN_PRIORITY_REQUIRED");

  const coverage = mappingSummary.canonicalAuthorityCoverage || {};
  const rows = priority.map((dimension,index)=>{
    const counts = coverage[dimension];
    if (!counts) throw new Error("P2_DIMENSION_COUNTS_MISSING_"+dimension);
    const authoritative = authoritativeCount(counts);
    const ambiguous = Number(counts.AMBIGUOUS || 0);
    const unknown = Number(counts.UNKNOWN || 0);
    const unresolved = ambiguous + unknown;
    if (authoritative + unresolved !== 19268) throw new Error("P2_DIMENSION_TOTAL_MISMATCH_"+dimension);
    const policy=POLICY[dimension];
    if (!policy) throw new Error("P2_POLICY_MISSING_"+dimension);
    return {
      priority:index+1,
      dimension,
      authoritativeCount:authoritative,
      authoritativeCoverage:Number((authoritative/19268).toFixed(6)),
      ambiguousCount:ambiguous,
      unknownCount:unknown,
      unresolvedCount:unresolved,
      recipesPotentiallyUnlockedByCompleteAuthoritativeRepair:unresolved,
      ...policy
    };
  });

  const protectedStats = nutritionSummary.protectedCorpusApplicability || {};
  const ingredientIdentity = {
    recipeCount: protectedStats.recipeCount,
    ingredientOccurrenceCount: protectedStats.ingredientOccurrences,
    exactCanonicalIngredientOccurrences: protectedStats.resolvedIngredientOccurrences,
    unresolvedIngredientOccurrences: protectedStats.unresolvedIngredientOccurrences,
    exactIngredientOccurrenceCoverage: protectedStats.resolvedIngredientOccurrenceRatio,
    allIngredientIdentityReadyRecipes: protectedStats.recipesWithAllIngredientIdentitiesResolved,
    allIngredientIdentityReadyCoverage: protectedStats.allIngredientIdentityReadyRatio,
    unresolvedRecipeCount: 19268 - Number(protectedStats.recipesWithAllIngredientIdentitiesResolved || 0),
    userVisibleLimitation: "Ingredient search may use source text, but deterministic ingredient filtering and recommendation hard filters are not trustworthy for recipes with unresolved identities.",
    repairDifficulty: "HIGH",
    evidenceRequirement: "EXACT_CANONICAL_INGREDIENT_IDENTITY_OR_REVIEWED_ALIAS_MAPPING",
    nextBoundedRepairTranche: "RANK_HIGH_FREQUENCY_UNRESOLVED_INGREDIENT_ALIASES_AND_ADD_DETERMINISTIC_REVIEWED_MAPPINGS"
  };

  const sourceProvenance = {
    authoritativeRecipeCount: p1Evidence.indexedRecipeCount,
    authoritativeCoverage: 1,
    liveOwnerCanaryPass: true,
    detailProvenancePass: p1Evidence.sourceProvenancePass === true,
    userVisibleLimitation: "No corpus-wide provenance blocker observed in P1; individual source fields remain presented as recorded provenance, not nutritional or dietary authority."
  };

  return {
    schemaVersion:P2_SCHEMA_VERSION,
    date:"2026-09-27",
    pass:true,
    terminal:P2_TERMINAL_MACHINE,
    protectedCorpusVersion:"v8018",
    recipeCount:19268,
    sourcePins:mappingSummary.sourcePins,
    rankedMetadataBlockers:rows,
    supplementalDiagnostics:{ingredientIdentity,sourceProvenance},
    structuralExceptions:mappingSummary.structuralExceptions,
    machineMeasurement:{
      exactSourceReconstruction:true,
      liveProtectedStatusAnchoredByP1Terminal:true,
      live500IdAlignmentPerformed:false,
      liveAlignmentRequiredForTerminalP2Closeout:true
    },
    boundaries:{
      protectedD1ReadsPerformed:0,
      protectedD1WritesPerformed:0,
      protectedBodiesReadOrExported:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAuthorityWidened:false,
      nutritionAuthorityChanged:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false,
      missingMetadataInferred:false
    },
    nextGate:"P2_BOUNDED_LIVE_ALIGNMENT_OF_STATUS_PROVENANCE_AND_FROZEN_C1_500_IDS"
  };
}

export function validateP2Measurement(evidence) {
  const errors=[];
  if (evidence?.terminal !== P2_TERMINAL_MACHINE) errors.push("terminal");
  if (evidence?.recipeCount !== 19268) errors.push("recipeCount");
  if (!Array.isArray(evidence?.rankedMetadataBlockers) || evidence.rankedMetadataBlockers.length !== 12) errors.push("rankedMetadataBlockers");
  if (evidence?.supplementalDiagnostics?.ingredientIdentity?.allIngredientIdentityReadyRecipes !== 112) errors.push("ingredientReadyCount");
  if (evidence?.supplementalDiagnostics?.sourceProvenance?.authoritativeRecipeCount !== 19268) errors.push("sourceProvenanceCount");
  if (evidence?.machineMeasurement?.live500IdAlignmentPerformed !== false) errors.push("liveAlignmentMustRemainPending");
  const boundaries=evidence?.boundaries || {};
  for(const key of ["protectedD1ReadsPerformed","protectedD1WritesPerformed","protectedBodiesReadOrExported"]) if(boundaries[key]!==0) errors.push(key);
  for(const key of ["publicRuntimeChanged","recommendationBehaviorChanged","recommendationAuthorityWidened","nutritionAuthorityChanged","knowledgeCoreWritePerformed","paidModelOrApiUsed","thirdShardUsed","barbecueMutation","missingMetadataInferred"]) if(boundaries[key]!==false) errors.push(key);
  return errors;
}
