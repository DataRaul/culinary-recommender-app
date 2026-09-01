import test from "node:test";
import assert from "node:assert/strict";

import { RECIPES } from "../src/data/recipes.js";
import { ingredientById } from "../src/data/ingredients.js";
import { ALL_RECIPES, AUTHORED_RECIPES, EXTERNAL_RECIPES } from "../src/data/corpus-v1.js";
import { WIKIBOOKS_GATE_F_SOURCE, WIKIBOOKS_GATE_F_RECIPES } from "../src/data/external/wikibooks-gate-f-v1.js";
import { publicRecipeSource } from "../src/domain/catalog.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";
import { buildDishFamilyIndex, crossSourceDishFamilies } from "../src/data/dish-families-v1.js";
import { recipeUniverseCoverage } from "../src/domain/recipe-universe-coverage.js";

const permissiveProfile = normalizeProfile({
  ...DEFAULT_PROFILE,
  maxMinutes: 180,
  skill: 4,
  budget: 4,
  cuisinePreferences: [],
  nutritionPriority: 1,
  proteinEmphasis: 1,
  priorityPacks: [],
  allergens: [],
  excludedIngredientIds: [],
  unavailableIngredientIds: []
});

const externalById = id => EXTERNAL_RECIPES.find(recipe => recipe.id === id);

test("Gate F source contract is bounded, text-only, static and CC BY-SA 4.0", () => {
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.name, "English Wikibooks Cookbook");
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.license, "CC-BY-SA-4.0");
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.licenseUrl, "https://creativecommons.org/licenses/by-sa/4.0/");
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.runtimeFetch, false);
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.imagesBundled, false);
  assert.equal(WIKIBOOKS_GATE_F_SOURCE.sourceNutritionImportedAsAuthority, false);
});

test("Gate F freezes eight exact Wikibooks revisions with per-record attribution", () => {
  const expected = new Map([
    ["wikibooks_philippine_chicken_adobo", [47816, 4630209, "2026-04-12T18:40:29Z"]],
    ["wikibooks_baba_ganoush", [28381, 4629606, "2026-04-08T17:17:22Z"]],
    ["wikibooks_bruschetta_base", [25256, 4523487, "2025-07-13T19:16:22Z"]],
    ["wikibooks_caprese_salad", [424559, 4605277, "2025-12-04T00:34:05Z"]],
    ["wikibooks_gazpacho", [12749, 4518408, "2025-06-21T16:27:08Z"]],
    ["wikibooks_huevos_rancheros", [85337, 4511733, "2025-06-17T15:23:15Z"]],
    ["wikibooks_spanish_omelet", [23021, 4517807, "2025-06-21T03:06:54Z"]],
    ["wikibooks_tzatziki", [128463, 4519035, "2025-06-21T17:20:31Z"]]
  ]);
  assert.equal(WIKIBOOKS_GATE_F_RECIPES.length, 8);
  for (const recipe of WIKIBOOKS_GATE_F_RECIPES) {
    const [pageId, revisionId, timestamp] = expected.get(recipe.id);
    assert.equal(recipe.provenance.sourcePageId, pageId);
    assert.equal(recipe.provenance.sourceRevisionId, revisionId);
    assert.equal(recipe.provenance.sourceRevisionTimestamp, timestamp);
    assert.equal(recipe.provenance.license, "CC-BY-SA-4.0");
    assert.equal(recipe.provenance.modifiedFromSource, true);
    assert.match(recipe.provenance.sourceUrl, /^https:\/\/en\.wikibooks\.org\/wiki\//);
    assert.equal(recipe.provenance.sourceRevisionUrl, `https://en.wikibooks.org/w/index.php?oldid=${revisionId}`);
    assert.match(recipe.provenance.attribution, /Wikibooks contributors/);
  }
});

test("every normalized external ingredient resolves through the canonical ontology", () => {
  for (const recipe of EXTERNAL_RECIPES) {
    for (const ingredient of recipe.ingredients) {
      assert.ok(ingredientById(ingredient.canonicalIngredientId), `${recipe.id}:${ingredient.canonicalIngredientId}`);
    }
  }
});

test("external recipe nutrition never inherits Wikibooks nutrition templates as authority", () => {
  for (const recipe of EXTERNAL_RECIPES) {
    assert.equal(recipe.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
    assert.deepEqual(recipe.nutrition.perServing, {
      energyKcal: null,
      proteinG: null,
      carbohydrateG: null,
      fatG: null,
      fibreG: null
    });
    assert.match(recipe.nutrition.provenance, /separate reviewed NutritionSource/);
  }
});

test("external records with incomplete source-backed hard metadata remain reference-only", () => {
  const gazpacho = externalById("wikibooks_gazpacho");
  const ranked = rankRecipes([gazpacho], permissiveProfile, { mealType: "lunch" });
  assert.equal(ranked.eligible.length, 0);
  assert.match(ranked.rejected[0].hardReasons.join(" | "), /lacks source-backed hard recommendation metadata/);
  assert.match(ranked.rejected[0].hardReasons.join(" | "), /time is unknown/);
});

test("source-time-complete external recipes are ingredient-search-only, not planner candidates", () => {
  const baba = externalById("wikibooks_baba_ganoush");
  const bruschetta = externalById("wikibooks_bruschetta_base");
  assert.equal(baba.governance.recommendationState, "SEARCH_ONLY");
  assert.equal(bruschetta.governance.recommendationState, "SEARCH_ONLY");

  const plannerRank = rankRecipes([baba, bruschetta], permissiveProfile, { mealType: "lunch" });
  assert.equal(plannerRank.eligible.length, 0);
  assert.ok(plannerRank.rejected.every(item => item.hardReasons.includes("external recipe is admitted for ingredient search only")));

  const aubergineSearch = searchRecipesByIngredients(ALL_RECIPES, permissiveProfile, { mainIngredientId: "aubergine", maxMinutes: 180, skill: 4 });
  assert.ok(aubergineSearch.eligible.some(item => item.recipe.id === "wikibooks_baba_ganoush"));
  const breadSearch = searchRecipesByIngredients(ALL_RECIPES, permissiveProfile, { mainIngredientId: "bread", maxMinutes: 180, skill: 4 });
  assert.ok(breadSearch.eligible.some(item => item.recipe.id === "wikibooks_bruschetta_base"));
});

test("hard allergen and permanent-exclusion safety applies unchanged to external Search", () => {
  const sesameProfile = normalizeProfile({ ...permissiveProfile, allergens: ["sesame"] });
  const sesame = searchRecipesByIngredients(ALL_RECIPES, sesameProfile, { mainIngredientId: "aubergine", maxMinutes: 180, skill: 4 });
  const blockedBaba = sesame.blocked.find(item => item.recipe.id === "wikibooks_baba_ganoush");
  assert.ok(blockedBaba);
  assert.ok(blockedBaba.hardReasons.includes("declared allergen: sesame"));

  const exclusionProfile = normalizeProfile({ ...permissiveProfile, excludedIngredientIds: ["aubergine"] });
  const excluded = searchRecipesByIngredients(ALL_RECIPES, exclusionProfile, { mainIngredientId: "aubergine", maxMinutes: 180, skill: 4 });
  const excludedBaba = excluded.blocked.find(item => item.recipe.id === "wikibooks_baba_ganoush");
  assert.ok(excludedBaba);
  assert.match(excludedBaba.hardReasons.join(" | "), /contains excluded ingredient: aubergine/);
});

test("RecipeSource expands to 84 records without contaminating the authored 76-record baseline", () => {
  assert.equal(AUTHORED_RECIPES.length, 76);
  assert.equal(RECIPES.length, 76);
  assert.equal(EXTERNAL_RECIPES.length, 8);
  assert.equal(ALL_RECIPES.length, 84);
  const ids = ALL_RECIPES.map(recipe => recipe.id);
  assert.equal(new Set(ids).size, ids.length);

  const publicRows = publicRecipeSource.list();
  assert.equal(publicRows.length, 84);
  const external = publicRows.find(recipe => recipe.id === "wikibooks_baba_ganoush");
  assert.equal(external.provenance.sourceRevisionId, 4629606);
  external.identity.canonicalTitle = "mutated clone";
  assert.equal(publicRecipeSource.getById("wikibooks_baba_ganoush").identity.canonicalTitle, "Baba Ganoush");
});

test("dish-family normalization keeps authored and external Spanish tortilla variants visible", () => {
  const index = buildDishFamilyIndex(ALL_RECIPES);
  const family = index.get("spanish_potato_omelet");
  assert.ok(family);
  assert.deepEqual(family.map(row => row.recipeId), ["spanish_potato_onion_tortilla", "wikibooks_spanish_omelet"]);

  const crossSource = crossSourceDishFamilies(ALL_RECIPES);
  assert.ok(crossSource.some(row => row.dishFamilyId === "spanish_potato_omelet"));
});

test("Gate F coverage audit records both achieved roles and truthful gaps", () => {
  const audit = recipeUniverseCoverage();
  assert.equal(audit.totalRecipeCount, 84);
  assert.equal(audit.authoredRecipeCount, 76);
  assert.equal(audit.externalRecipeCount, 8);
  assert.equal(audit.externalSourceCount, 1);
  assert.equal(audit.externalSearchEligibleCount, 2);
  assert.equal(audit.externalReferenceOnlyCount, 6);
  assert.equal(audit.exactRevisionPinnedCount, 8);
  assert.equal(audit.externalTimeKnownCount, 2);
  assert.equal(audit.externalTimeUnknownCount, 6);
  assert.equal(audit.externalServingKnownCount, 2);
  assert.equal(audit.externalServingUnknownCount, 6);
  assert.equal(audit.externalRoleCounts.canonical_classic, 8);
  assert.equal(audit.externalRoleCounts.regional_traditional, 8);
  assert.equal(audit.externalRoleCounts.staple_everyday, 4);
  assert.equal(audit.externalRoleCounts.constraint_first, 3);
  assert.equal(audit.externalRoleCounts.technique_learning, 3);
  assert.equal(audit.externalRoleCounts.contemporary_modern, 0);
  assert.equal(audit.externalRoleCounts.genuinely_new_trending, 0);
  assert.deepEqual(audit.missingExternalRoles, ["contemporary_modern", "genuinely_new_trending"]);
  assert.equal(audit.crossSourceDishFamilyCount, 1);
  assert.equal(audit.unknownPolicy, "UNKNOWN_IS_EXPLICIT_AND_NEVER_COERCED_TO_ZERO_OR_GUESSED_METADATA");
});
