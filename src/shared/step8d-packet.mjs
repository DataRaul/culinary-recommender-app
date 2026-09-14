export const STEP8D_PACKET_SCHEMA_VERSION = "CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1";
export const STEP8D_SOURCE_COHORT_ID = "unitools-world-recipes-v1_1_0";

const MEDIA_KEYS = new Set(["photo", "image", "images", "media", "thumbnail"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required`);
  return value.trim();
}

function requireFiniteOrNull(value, label) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite or null`);
  return value;
}

function localized(value, label) {
  if (value == null) return null;
  if (!isObject(value)) throw new Error(`${label} must be an object or null`);
  const result = {};
  if (value.ru != null) result.ru = String(value.ru);
  if (value.en != null) result.en = String(value.en);
  if (Object.keys(result).length === 0) throw new Error(`${label} must contain ru or en`);
  return result;
}

function normalizeSource(source) {
  if (!isObject(source)) throw new Error("Step 8D source contract is required");
  const normalized = {
    sourceCohortId: requireNonEmptyString(source.sourceCohortId, "sourceCohortId"),
    repository: requireNonEmptyString(source.repository, "repository"),
    commit: requireNonEmptyString(source.commit, "commit"),
    dataPath: requireNonEmptyString(source.dataPath, "dataPath"),
    dataBlobSha: requireNonEmptyString(source.dataBlobSha, "dataBlobSha"),
    datasetVersion: requireNonEmptyString(source.datasetVersion, "datasetVersion"),
    recordCount: Number(source.recordCount),
    licenseId: requireNonEmptyString(source.licenseId, "licenseId"),
    attributionText: requireNonEmptyString(source.attributionText, "attributionText")
  };
  if (!/^[a-f0-9]{40}$/.test(normalized.commit)) throw new Error("Step 8D source commit must be a 40-char lowercase Git SHA-1");
  if (!/^[a-f0-9]{40}$/.test(normalized.dataBlobSha)) throw new Error("Step 8D data blob SHA must be a 40-char lowercase Git SHA-1");
  if (normalized.sourceCohortId !== STEP8D_SOURCE_COHORT_ID) throw new Error("Unexpected Step 8D source cohort");
  if (normalized.recordCount !== 501) throw new Error("Step 8D source contract must freeze exactly 501 records");
  return normalized;
}

function assertNoMediaKeys(value, path = "packet") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoMediaKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (MEDIA_KEYS.has(key.toLowerCase())) throw new Error(`${path}.${key} is forbidden media in Step 8D packet`);
    assertNoMediaKeys(nested, `${path}.${key}`);
  }
}

function normalizeIngredient(ingredient, index) {
  if (!isObject(ingredient)) throw new Error(`ingredient ${index} must be an object`);
  return {
    id: requireNonEmptyString(ingredient.id, `ingredient ${index} id`),
    name: localized(ingredient.name, `ingredient ${index} name`),
    quantity: requireFiniteOrNull(ingredient.quantity, `ingredient ${index} quantity`),
    unit: ingredient.unit == null ? null : String(ingredient.unit),
    note: localized(ingredient.note, `ingredient ${index} note`)
  };
}

function normalizeStep(step, index) {
  if (!isObject(step)) throw new Error(`step ${index} must be an object`);
  return {
    text: localized(step.text, `step ${index} text`),
    minutes: requireFiniteOrNull(step.minutes, `step ${index} minutes`)
  };
}

export function validateStep8DProtectedPacket(packet) {
  if (!isObject(packet)) throw new Error("Step 8D packet must be an object");
  if (packet.packetSchemaVersion !== STEP8D_PACKET_SCHEMA_VERSION) throw new Error("Step 8D packet schema version mismatch");
  const recipeId = packet.identity?.recipeId;
  if (typeof recipeId !== "string" || !recipeId.startsWith("unitools:") || recipeId.length <= "unitools:".length) {
    throw new Error("Step 8D packet recipeId must use unitools:<slug>");
  }
  if (packet.provenance?.sourceCohortId !== STEP8D_SOURCE_COHORT_ID) throw new Error("Step 8D packet source cohort mismatch");
  const authority = packet.authority || {};
  if (authority.storageState !== "PROTECTED_STORED_ONLY") throw new Error("Step 8D packet must remain protected stored-only");
  if (authority.publicRecommendationEligible !== false) throw new Error("Step 8D packet cannot be public-recommendation eligible");
  if (authority.automaticAppAdmissionAuthorized !== false) throw new Error("Step 8D packet cannot authorize automatic app admission");
  if (authority.nutritionAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D nutrition authority firewall mismatch");
  if (authority.dietaryAllergenAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D diet/allergen authority firewall mismatch");
  if (authority.scalingAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D scaling authority firewall mismatch");
  if (authority.knowledgeCoreWriteAuthorized !== false) throw new Error("Step 8D packet cannot authorize Knowledge Core writes");
  assertNoMediaKeys(packet);
  return true;
}

export function buildStep8DProtectedPacket(recipe, { source, ordinal } = {}) {
  if (!isObject(recipe)) throw new Error("UniTools recipe must be an object");
  if (!Number.isInteger(ordinal) || ordinal < 0) throw new Error("Step 8D ordinal must be a non-negative integer");
  const pinned = normalizeSource(source);
  const slug = requireNonEmptyString(recipe.slug, `recipe ${ordinal} slug`);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const packet = {
    packetSchemaVersion: STEP8D_PACKET_SCHEMA_VERSION,
    identity: {
      recipeId: `unitools:${slug}`,
      sourceOrdinal: ordinal,
      sourceSlug: slug
    },
    provenance: {
      sourceCohortId: pinned.sourceCohortId,
      repository: pinned.repository,
      commit: pinned.commit,
      dataPath: pinned.dataPath,
      dataBlobSha: pinned.dataBlobSha,
      datasetVersion: pinned.datasetVersion,
      sourceRecipeUrl: recipe.url == null ? null : String(recipe.url),
      licenseId: pinned.licenseId,
      attributionText: pinned.attributionText
    },
    recipe: {
      country: recipe.country == null ? null : String(recipe.country),
      name: localized(recipe.name, `recipe ${ordinal} name`),
      nativeName: recipe.nativeName == null ? null : String(recipe.nativeName),
      summary: localized(recipe.summary, `recipe ${ordinal} summary`),
      category: recipe.category == null ? null : String(recipe.category),
      difficulty: recipe.difficulty == null ? null : String(recipe.difficulty),
      baseServings: requireFiniteOrNull(recipe.baseServings, `recipe ${ordinal} baseServings`),
      prepMinutes: requireFiniteOrNull(recipe.prepMinutes, `recipe ${ordinal} prepMinutes`),
      cookMinutes: requireFiniteOrNull(recipe.cookMinutes, `recipe ${ordinal} cookMinutes`),
      ingredients: ingredients.map(normalizeIngredient),
      steps: steps.map(normalizeStep)
    },
    sourceMetadata: {
      diets: Array.isArray(recipe.diets) ? recipe.diets.map(value => String(value)) : [],
      nutritionPerServing: cloneJson(recipe.nutritionPerServing ?? null),
      ingredientScaling: ingredients.map((ingredient, index) => ({
        ingredientId: requireNonEmptyString(ingredient.id, `ingredient ${index} id`),
        scaling: ingredient.scaling == null ? null : String(ingredient.scaling)
      }))
    },
    authority: {
      storageState: "PROTECTED_STORED_ONLY",
      publicRecommendationEligible: false,
      automaticAppAdmissionAuthorized: false,
      nutritionAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      dietaryAllergenAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      scalingAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      knowledgeCoreWriteAuthorized: false
    }
  };

  assertNoMediaKeys(packet);
  validateStep8DProtectedPacket(packet);
  return packet;
}
