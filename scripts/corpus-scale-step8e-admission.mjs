import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  applyExplicitReviewDecision,
  createControlPlaneSnapshot
} from "./corpus-source-control-plane.mjs";
import {
  buildPipelineAdmissionManifest,
  createIngestionPipelineSnapshot,
  createPipelineRecord
} from "./corpus-ingestion-pipeline.mjs";
import { resolveStep8EIngredient, scanStep8EReadiness } from "./corpus-scale-step8e-core.mjs";

export const STEP8E_ADMISSION_VERSION = "CORPUS_SCALE_STEP8E_ADMISSION_V1";
export const STEP8E_ELIGIBLE_SOURCE_SLUG = "tortilla-espanola";
export const STEP8E_CANONICAL_RECIPE_ID = "unitools_tortilla_espanola";
export const STEP8E_DISH_FAMILY_ID = "spanish_potato_omelet";

const LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
const difficultyLevel = Object.freeze({ easy: 1, medium: 3, hard: 4 });

function sourceContract(contract) {
  return {
    id: contract.source.sourceCohortId,
    name: "UniTools World Recipes Dataset 1.1.0",
    adapterId: "unitools-step8e-v1",
    sourceFamily: "open_recipe_dataset",
    versioningMode: "immutable_git_commit_plus_blob",
    rightsEvidenceMode: "STEP8C_VERIFIED_CC_BY_SA_4_0",
    runtimeFetch: false,
    sourceNutritionImportedAsAuthority: false,
    mediaState: "EXCLUDED",
    license: contract.source.licenseId,
    licenseUrl: LICENSE_URL,
    attributionPolicy: contract.source.attributionText,
    automaticAdmissionAuthorized: false
  };
}

function sourceUrl(contract, recipe) {
  return recipe.url || `https://github.com/${contract.source.repository}/blob/${contract.source.commit}/${contract.source.dataPath}`;
}

function immutableLocator(contract, recipe) {
  return `https://github.com/${contract.source.repository}/blob/${contract.source.commit}/${contract.source.dataPath}#${recipe.slug}`;
}

function allergenUnion(canonicalIngredientIds) {
  return [...new Set(canonicalIngredientIds.flatMap(id => INGREDIENTS[id]?.allergens || []))].sort();
}

export function buildStep8ERuntimeCandidate(recipe, contract) {
  if (recipe?.slug !== STEP8E_ELIGIBLE_SOURCE_SLUG) throw new Error("Step 8E runtime candidate must be the reviewed tortilla-espanola source record");
  const mappings = (recipe.ingredients || []).map((ingredient, index) => {
    const resolved = resolveStep8EIngredient(ingredient);
    if (resolved.status !== "RESOLVED" || !resolved.canonicalIngredientId) {
      throw new Error(`Step 8E candidate ingredient ${index} does not resolve exactly`);
    }
    return {
      canonicalIngredientId: resolved.canonicalIngredientId,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      required: true,
      preparation: ingredient.note?.en || ingredient.note?.ru || "",
      sourceText: ingredient.name?.en || ingredient.name?.ru || String(ingredient.id || "")
    };
  });
  const ingredientIds = mappings.map(item => item.canonicalIngredientId);
  const declaredAllergens = allergenUnion(ingredientIds);
  if (declaredAllergens.length !== 1 || declaredAllergens[0] !== "egg") {
    throw new Error(`Step 8E reviewed tortilla allergen derivation changed: ${declaredAllergens.join(",")}`);
  }
  const prepMinutes = Number(recipe.prepMinutes);
  const cookMinutes = Number(recipe.cookMinutes);
  const servings = Number(recipe.baseServings);
  if (![prepMinutes, cookMinutes, servings].every(Number.isFinite) || prepMinutes < 0 || cookMinutes < 0 || servings <= 0) {
    throw new Error("Step 8E candidate requires explicit source prep/cook time and positive servings");
  }
  const difficulty = difficultyLevel[recipe.difficulty];
  if (!difficulty) throw new Error(`Unsupported Step 8E difficulty: ${recipe.difficulty}`);

  return {
    id: STEP8E_CANONICAL_RECIPE_ID,
    identity: { canonicalTitle: recipe.name?.en || recipe.nativeName || "Spanish tortilla" },
    provenance: {
      sourceType: "EXTERNAL_OPEN_RECIPE",
      sourceName: "UniTools World Recipes Dataset",
      sourceItemId: recipe.slug,
      sourceVersionId: `${contract.source.datasetVersion}@${contract.source.commit}:${contract.source.dataBlobSha}`,
      sourceUrl: sourceUrl(contract, recipe),
      sourceRevisionUrl: immutableLocator(contract, recipe),
      attribution: contract.source.attributionText,
      license: contract.source.licenseId,
      licenseUrl: LICENSE_URL,
      modifiedFromSource: true,
      transformation: "Normalized into the Culinary Recommender schema under the explicit Step 8E reviewed subset contract.",
      dishFamilyId: STEP8E_DISH_FAMILY_ID,
      sourceCategories: [recipe.category].filter(Boolean),
      recipeRoles: ["canonical_classic", "regional_traditional", "staple_everyday"],
      admissionState: "ADMIT_RECOMMENDATION_ELIGIBLE_REVIEWED_STEP8E"
    },
    corpusMetadata: {
      corpus: "unitools_step8e_v1",
      dishFamilyId: STEP8E_DISH_FAMILY_ID,
      recipeRoles: ["canonical_classic", "regional_traditional", "staple_everyday"],
      sourceMetadataCompleteness: "STEP8E_EXACT_REVIEWED_CORE",
      admissionState: "ADMIT_RECOMMENDATION_ELIGIBLE_REVIEWED_STEP8E"
    },
    governance: {
      recommendationState: "ELIGIBLE",
      runtimeActivationAuthorized: false,
      unknownIsNotZero: true,
      sourceNutritionIgnoredForAuthority: true,
      sourceDietaryMetadataIgnoredForAuthority: true,
      sourceScalingMetadataIgnoredForAuthority: true,
      mediaExcluded: true
    },
    culinary: {
      cuisine: "Spanish",
      mealTypes: ["lunch", "dinner"],
      difficulty,
      techniqueTags: [],
      activeAttention: difficulty,
      timingSensitivity: 3,
      simultaneousTasks: 1,
      finishingRisk: 3,
      errorRecovery: 2,
      equipmentDependence: 1
    },
    time: {
      prepMinutes,
      activeMinutes: null,
      passiveMinutes: null,
      totalMinutes: prepMinutes + cookMinutes,
      sourceState: "SOURCE_EXPLICIT_PREP_PLUS_COOK"
    },
    ingredients: mappings,
    instructions: (recipe.steps || []).map(step => ({ text: step.text?.en || step.text?.ru || "" })).filter(step => step.text),
    equipment: [],
    serving: { servings, sourceState: "SOURCE_EXPLICIT" },
    nutrition: {
      perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null },
      estimationState: "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED",
      confidence: "unknown",
      provenance: "UniTools nutrition metadata is not imported as NutritionSource authority."
    },
    dietaryTags: ["vegetarian"],
    allergySafety: {
      declaredAllergens,
      basis: "CONSERVATIVE_FROM_NORMALIZED_INGREDIENT_ONTOLOGY_STEP8E_REVIEW"
    },
    economics: {
      costTier: 1,
      basis: "PROJECT_HEURISTIC_NOT_SOURCE_METADATA",
      note: "Relative runtime heuristic only; not a UniTools price claim."
    },
    convenience: {
      mealPrepSuitability: 2,
      batchSuitability: 2,
      leftoverSuitability: 2,
      portability: 2
    },
    discovery: {
      novelty: 1,
      techniqueLearningValue: 4,
      provenance: "Project runtime metadata, separately identified from source facts."
    },
    geography: {
      region: "Spain",
      country: "Spain",
      sourceState: "SOURCE_COUNTRY_CODE_REVIEWED"
    }
  };
}

function reviewReadyRecord(recipe, contract) {
  const source = sourceContract(contract);
  return {
    controlId: `step8e:${recipe.slug}:${contract.source.dataBlobSha}`,
    externalRecordId: `unitools:${recipe.slug}`,
    sourceId: source.id,
    sourceItemId: recipe.slug,
    sourceVersionId: `${contract.source.datasetVersion}@${contract.source.commit}:${contract.source.dataBlobSha}`,
    title: recipe.name?.en || recipe.nativeName || recipe.slug,
    reviewState: "REVIEW_READY",
    rightsState: "ADMIT_RIGHTS_VERIFIED",
    nutritionState: "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED",
    mediaState: "EXCLUDED",
    runtimeActivationAuthorized: false,
    admissionState: null,
    runtimeArtifact: null,
    canonicalRecipeId: null,
    provenance: {
      sourceName: source.name,
      sourceItemId: recipe.slug,
      sourceVersionId: `${contract.source.datasetVersion}@${contract.source.commit}:${contract.source.dataBlobSha}`,
      sourceVersionTimestamp: null,
      sourceUrl: sourceUrl(contract, recipe),
      immutableLocator: immutableLocator(contract, recipe),
      license: contract.source.licenseId,
      licenseUrl: LICENSE_URL,
      attribution: contract.source.attributionText,
      mediaIncluded: false,
      sourceNutritionImportedAsAuthority: false
    }
  };
}

export function buildStep8EAdmission(dataset, contract) {
  const readiness = scanStep8EReadiness(dataset, contract);
  const candidates = readiness.recipeRows.filter(row => row.allIngredientsMapped);
  if (candidates.length !== 1 || candidates[0].sourceSlug !== STEP8E_ELIGIBLE_SOURCE_SLUG) {
    throw new Error(`Step 8E exact candidate set changed: ${candidates.map(row => row.sourceSlug).join(",")}`);
  }
  const sourceRecipe = dataset.recipes.find(recipe => recipe.slug === STEP8E_ELIGIBLE_SOURCE_SLUG);
  if (!sourceRecipe) throw new Error("Step 8E source candidate missing from pinned dataset");
  const runtimeCandidate = buildStep8ERuntimeCandidate(sourceRecipe, contract);
  const source = sourceContract(contract);
  const reviewed = applyExplicitReviewDecision(reviewReadyRecord(sourceRecipe, contract), {
    decisionAuthority: "EXPLICIT_REVIEW_DECISION",
    reviewState: "ADMITTED",
    rightsState: "ADMIT_RIGHTS_VERIFIED",
    admissionState: "ADMIT_RECOMMENDATION_ELIGIBLE_REVIEWED_STEP8E",
    canonicalRecipeId: STEP8E_CANONICAL_RECIPE_ID,
    runtimeArtifact: {
      artifactId: STEP8E_CANONICAL_RECIPE_ID,
      artifactState: "PREPARED_NOT_PUBLICLY_ACTIVATED",
      runtimeActivationAuthorized: false
    },
    decisionEvidence: {
      step: "8E",
      reason: "Only pinned UniTools record that resolves every ingredient through the existing canonical name/alias ontology without new identity authority.",
      exactCandidateCount: 1,
      dishFamilyId: STEP8E_DISH_FAMILY_ID,
      sourceNutritionAuthority: false,
      runtimeActivationAuthorized: false
    }
  }, source);
  const controlPlane = createControlPlaneSnapshot(source, [reviewed], { sourceUniverseState: "STEP8E_BOUNDED_EXACT_ELIGIBLE_SUBSET" });
  const pipelineRecord = createPipelineRecord(reviewed, {
    provenance: "VERIFIED",
    parse: "PASS",
    normalize: "PASS",
    deduplicate: "PASS",
    ingredientQuantityMapping: "PASS",
    hardMetadata: "PASS",
    nutrition: "FIREWALLED",
    decision: "PASS",
    portableArtifact: "READY"
  });
  const pipeline = createIngestionPipelineSnapshot(controlPlane, [pipelineRecord]);
  const admissionManifest = buildPipelineAdmissionManifest(controlPlane, pipeline, "v8002");

  return {
    admissionVersion: STEP8E_ADMISSION_VERSION,
    pass: true,
    terminalCandidate: "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS",
    sourceCohortId: contract.source.sourceCohortId,
    reviewedStoredPopulation: 501,
    eligibleSubsetCount: 1,
    storedOnlyCount: 500,
    eligibleSourceSlugs: [STEP8E_ELIGIBLE_SOURCE_SLUG],
    controlPlane,
    pipeline,
    admissionManifest,
    runtimeCandidates: [runtimeCandidate],
    boundaries: {
      publicRuntimeChanged: false,
      runtimeActivationAuthorized: false,
      automaticAdmissionAuthorized: false,
      sourceNutritionImportedAsAuthority: false,
      sourceDietaryMetadataImportedAsAuthority: false,
      sourceScalingMetadataImportedAsAuthority: false,
      d1WritesPerformed: 0,
      thirdShardUsed: false,
      billingExpansion: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false
    }
  };
}
