const LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
const sourcePageUrl = title => `https://en.wikibooks.org/wiki/${encodeURIComponent(title.replace(/^Cookbook:/, "Cookbook:"))}`;
const sourceRevisionUrl = revid => `https://en.wikibooks.org/w/index.php?oldid=${revid}`;

export const WIKIBOOKS_GATE_F_SOURCE = Object.freeze({
  id: "WIKIBOOKS_COOKBOOK_GATE_F_V1",
  name: "English Wikibooks Cookbook",
  authorityType: "community_cookbook",
  category: "https://en.wikibooks.org/wiki/Category:Recipes",
  api: "https://en.wikibooks.org/w/api.php",
  license: "CC-BY-SA-4.0",
  licenseUrl: LICENSE_URL,
  attribution: "Wikibooks contributors; see the source page history.",
  transformationNotice: "Recipe text has been normalized and adapted into the Culinary Recommender schema.",
  runtimeFetch: false,
  imagesBundled: false,
  sourceNutritionImportedAsAuthority: false,
  evidenceTranche: "RECIPE_CORPUS_GATE_F_V1"
});

const provenance = ({ pageid, title, revid, timestamp, dishFamilyId, categories, recipeRoles, admissionState, notes = [] }) => ({
  sourceType: "EXTERNAL_OPEN_RECIPE",
  sourceName: WIKIBOOKS_GATE_F_SOURCE.name,
  sourcePageTitle: title,
  sourcePageId: pageid,
  sourceRevisionId: revid,
  sourceRevisionTimestamp: timestamp,
  sourceUrl: sourcePageUrl(title),
  sourceRevisionUrl: sourceRevisionUrl(revid),
  attribution: WIKIBOOKS_GATE_F_SOURCE.attribution,
  license: WIKIBOOKS_GATE_F_SOURCE.license,
  licenseUrl: LICENSE_URL,
  modifiedFromSource: true,
  transformation: WIKIBOOKS_GATE_F_SOURCE.transformationNotice,
  dishFamilyId,
  sourceCategories: categories,
  recipeRoles,
  admissionState,
  notes
});

const ingredient = (canonicalIngredientId, sourceText, quantity = null, unit = null, required = true, extra = {}) => ({
  canonicalIngredientId,
  quantity,
  unit,
  required,
  preparation: extra.preparation || "",
  sourceText,
  ...(extra.sourceQuantityExpression ? { sourceQuantityExpression: extra.sourceQuantityExpression } : {}),
  ...(extra.sourceAlternative ? { sourceAlternative: extra.sourceAlternative } : {})
});

const step = text => ({ text });
const unavailableNutrition = () => ({
  perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null },
  estimationState: "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED",
  confidence: "unknown",
  provenance: "The recipe source is not used as authoritative nutrition composition. Nutrition remains unavailable unless the separate reviewed NutritionSource can calculate it."
});

const runtime = ({ costTier = 2, mealPrep = 1, leftovers = 1, portability = 1, novelty = 2, learning = 2 }) => ({
  economics: {
    costTier,
    basis: "PROJECT_HEURISTIC_NOT_SOURCE_METADATA",
    note: "Relative runtime heuristic only; not a Wikibooks claim or live price."
  },
  convenience: {
    mealPrepSuitability: mealPrep,
    batchSuitability: leftovers,
    leftoverSuitability: leftovers,
    portability
  },
  discovery: {
    novelty,
    techniqueLearningValue: learning,
    provenance: "Project runtime metadata, separately identified from source facts."
  }
});

const record = ({ id, title, pageid, revid, timestamp, dishFamilyId, cuisine, mealTypes, difficulty, time, ingredients, instructions, equipment, servings, dietaryTags, allergens, geography, categories, recipeRoles, admissionState, sourceNotes = [], runtimeValues = {} }) => ({
  id,
  identity: { canonicalTitle: title },
  provenance: provenance({ pageid, title: `Cookbook:${title.replace(/ \(base\)$/, "")}`, revid, timestamp, dishFamilyId, categories, recipeRoles, admissionState, notes: sourceNotes }),
  corpusMetadata: {
    corpus: "wikibooks_gate_f_v1",
    dishFamilyId,
    recipeRoles,
    sourceMetadataCompleteness: time?.sourceState === "SOURCE_EXPLICIT" ? "BOUNDED_CORE_WITH_EXPLICIT_TIME" : "BOUNDED_CORE_TIME_UNKNOWN",
    admissionState
  },
  governance: {
    recommendationState: admissionState.includes("RECOMMENDATION_ELIGIBLE") ? "ELIGIBLE" : "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA",
    unknownIsNotZero: true,
    sourceNutritionIgnoredForAuthority: true,
    mediaExcluded: true
  },
  culinary: {
    cuisine,
    mealTypes,
    difficulty,
    techniqueTags: [],
    activeAttention: difficulty,
    timingSensitivity: Math.min(4, Math.max(1, difficulty)),
    simultaneousTasks: 1,
    finishingRisk: difficulty,
    errorRecovery: Math.max(1, 5 - difficulty),
    equipmentDependence: Math.min(4, Math.max(1, equipment.length))
  },
  time,
  ingredients,
  instructions,
  equipment,
  serving: { servings, sourceState: servings === null ? "SOURCE_UNKNOWN_OR_RANGE" : "SOURCE_EXPLICIT" },
  nutrition: unavailableNutrition(),
  dietaryTags,
  allergySafety: { declaredAllergens: allergens, basis: "CONSERVATIVE_FROM_NORMALIZED_INGREDIENT_ONTOLOGY" },
  ...runtime(runtimeValues),
  geography
});

export const WIKIBOOKS_GATE_F_RECIPES = Object.freeze([
  record({
    id: "wikibooks_philippine_chicken_adobo",
    title: "Adobo Chicken (Philippine)",
    pageid: 47816,
    revid: 4630209,
    timestamp: "2026-04-12T18:40:29Z",
    dishFamilyId: "philippine_chicken_adobo",
    cuisine: "Filipino",
    mealTypes: ["lunch", "dinner"],
    difficulty: 3,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("chicken_thigh", "6–8 chicken pieces, preferably legs and wings", null, "pieces", true, { sourceQuantityExpression: "6–8 pieces" }),
      ingredient("vinegar", "⅓ cup (80 ml) vinegar made from coconut juice", 80, "ml"),
      ingredient("soy_sauce", "¼ cup (60 ml) soy sauce", 60, "ml"),
      ingredient("garlic", "4 cloves garlic, crushed", 4, "cloves", true, { preparation: "crushed" }),
      ingredient("bay_leaf", "1–2 bay leaves", null, "leaves", true, { sourceQuantityExpression: "1–2" }),
      ingredient("black_pepper", "½ tsp freshly cracked peppercorns", 0.5, "tsp")
    ],
    instructions: [
      step("Combine the chicken, garlic, peppercorns, soy sauce and vinegar in a pan and bring to a boil."),
      step("Cook the chicken, then drain it while reserving the soy-vinegar cooking liquid."),
      step("Brown the drained chicken pieces in hot oil over medium heat."),
      step("Return the chicken to the reserved liquid, add bay leaf and simmer until the sauce is substantially reduced."),
      step("Serve hot; the source suggests steamed rice as an accompaniment.")
    ],
    equipment: ["pan", "colander"],
    servings: null,
    dietaryTags: [],
    allergens: ["soy", "gluten"],
    geography: { region: "Philippines", country: "Philippines", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Filipino recipes", "Medium Difficulty recipes", "Slow cooker recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "staple_everyday"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source does not specify total cooking time or servings; both remain unknown rather than inferred."],
    runtimeValues: { costTier: 2, mealPrep: 3, leftovers: 3, portability: 1, novelty: 3, learning: 3 }
  }),
  record({
    id: "wikibooks_baba_ganoush",
    title: "Baba Ganoush",
    pageid: 28381,
    revid: 4629606,
    timestamp: "2026-04-08T17:17:22Z",
    dishFamilyId: "baba_ganoush",
    cuisine: "Middle Eastern",
    mealTypes: ["lunch", "dinner"],
    difficulty: 2,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: 15, sourceState: "SOURCE_EXPLICIT" },
    ingredients: [
      ingredient("aubergine", "1 medium-large eggplant", 1, "piece"),
      ingredient("tahini", "2 tablespoons raw tahini", 2, "tbsp"),
      ingredient("lime", "Juice of 1 lime or lemon", 1, "piece", true, { sourceAlternative: "lemon" }),
      ingredient("garlic", "1 clove garlic, crushed", 1, "clove", true, { preparation: "crushed" }),
      ingredient("olive_oil", "3 tablespoons olive oil", 3, "tbsp"),
      ingredient("salt", "½ teaspoon salt", 0.5, "tsp"),
      ingredient("smoked_paprika", "Paprika or cayenne pepper, as a garnish", null, null, false, { sourceAlternative: "cayenne pepper" })
    ],
    instructions: [
      step("Roast the aubergine until the flesh is fully tender and the skin is charred and easy to remove."),
      step("Remove the skin, keeping a few charred flecks if desired."),
      step("Blend or finely chop the aubergine with tahini, citrus juice, garlic, most of the olive oil and salt until smooth."),
      step("Finish with the reserved oil and optional paprika or cayenne garnish.")
    ],
    equipment: ["broiler_or_oven", "blender_or_knife"],
    servings: 10,
    dietaryTags: ["vegetarian", "vegan"],
    allergens: ["sesame"],
    geography: { region: "Middle East / Mediterranean", country: null, sourceState: "SOURCE_CATEGORIES" },
    categories: ["Middle Eastern recipes", "Mediterranean recipes", "Vegan recipes", "Easy recipes", "Roasted recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "constraint_first", "technique_learning"],
    admissionState: "ADMIT_RECOMMENDATION_ELIGIBLE",
    sourceNotes: ["A source nutrition template exists but is deliberately not imported into NutritionSource."],
    runtimeValues: { costTier: 2, mealPrep: 2, leftovers: 2, portability: 2, novelty: 2, learning: 3 }
  }),
  record({
    id: "wikibooks_bruschetta_base",
    title: "Bruschetta (base)",
    pageid: 25256,
    revid: 4523487,
    timestamp: "2025-07-13T19:16:22Z",
    dishFamilyId: "bruschetta",
    cuisine: "Italian",
    mealTypes: ["lunch", "dinner"],
    difficulty: 1,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: 10, sourceState: "SOURCE_EXPLICIT" },
    ingredients: [
      ingredient("bread", "1 loaf Italian or French bread, sliced", 1, "loaf", true, { preparation: "sliced" }),
      ingredient("garlic", "½ head garlic", 0.5, "head"),
      ingredient("salt", "Kosher or sea salt", null, null),
      ingredient("black_pepper", "Freshly-ground black pepper", null, null),
      ingredient("olive_oil", "Extra-virgin olive oil", null, null)
    ],
    instructions: [
      step("Toast or grill sliced bread until golden."),
      step("Rub the hot bread with cut garlic, season with salt and black pepper, and drizzle with extra-virgin olive oil."),
      step("Serve the base warm; the source lists multiple optional seasonal topping families separately.")
    ],
    equipment: ["toaster_oven_broiler_or_grill"],
    servings: null,
    dietaryTags: ["vegetarian"],
    allergens: ["gluten"],
    geography: { region: "Italy", country: "Italy", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Italian recipes", "Appetizer recipes", "Vegetarian recipes", "Very Easy recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "technique_learning"],
    admissionState: "ADMIT_RECOMMENDATION_ELIGIBLE_BASE_VARIANT",
    sourceNotes: ["Gate F normalizes only the source's explicit base preparation; optional topping examples remain source variations rather than silently becoming required ingredients.", "The source states servings depend on loaf size, so serving count remains unknown."],
    runtimeValues: { costTier: 1, mealPrep: 1, leftovers: 1, portability: 2, novelty: 1, learning: 2 }
  }),
  record({
    id: "wikibooks_caprese_salad",
    title: "Caprese Salad",
    pageid: 424559,
    revid: 4605277,
    timestamp: "2025-12-04T00:34:05Z",
    dishFamilyId: "caprese_salad",
    cuisine: "Italian",
    mealTypes: ["lunch", "dinner"],
    difficulty: 1,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("tomato", "1 medium tomato", 1, "piece"),
      ingredient("basil", "A few basil leaves", null, "leaves", true, { sourceQuantityExpression: "a few" }),
      ingredient("mozzarella", "Mozzarella, about ¾ the weight of the tomato", null, null, true, { sourceQuantityExpression: "about ¾ the weight of the tomato" }),
      ingredient("olive_oil", "Olive oil", null, null),
      ingredient("balsamic_vinegar", "Balsamic vinegar", null, null),
      ingredient("oregano", "Italian seasoning or oregano", null, null, false),
      ingredient("black_pepper", "Pepper", null, null, false)
    ],
    instructions: [
      step("Slice the tomato and arrange mozzarella on the tomato slices."),
      step("Add basil and optional herbs."),
      step("Drizzle separately with balsamic vinegar and olive oil and serve fresh.")
    ],
    equipment: ["knife"],
    servings: null,
    dietaryTags: ["vegetarian"],
    allergens: ["milk"],
    geography: { region: "Italy", country: "Italy", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Italian recipes", "Very Easy recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source gives a 1–2 serving range and no cooking time; exact serving count and time remain unknown."],
    runtimeValues: { costTier: 2, mealPrep: 1, leftovers: 1, portability: 1, novelty: 1, learning: 1 }
  }),
  record({
    id: "wikibooks_gazpacho",
    title: "Gazpacho",
    pageid: 12749,
    revid: 4518408,
    timestamp: "2025-06-21T16:27:08Z",
    dishFamilyId: "gazpacho",
    cuisine: "Spanish",
    mealTypes: ["lunch", "dinner"],
    difficulty: 2,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("bread", "50 g 2–3 day-old white bread", 50, "g", false),
      ingredient("tomato", "450 g tomatoes, skinned and quartered", 450, "g"),
      ingredient("bell_pepper", "225 g green bell peppers", 225, "g"),
      ingredient("cucumber", "½ cucumber", 0.5, "piece"),
      ingredient("garlic", "1 clove garlic", 1, "clove"),
      ingredient("onion", "½ mild Spanish onion", 0.5, "piece"),
      ingredient("vinegar", "1 tbsp white or red wine vinegar", 1, "tbsp"),
      ingredient("olive_oil", "2 tbsp olive oil", 2, "tbsp"),
      ingredient("chilli", "¼ chile pepper", 0.25, "piece", false),
      ingredient("coriander", "Cilantro", null, null, false),
      ingredient("water", "2.4 dl iced water", 240, "ml"),
      ingredient("salt", "Sea salt", null, null),
      ingredient("black_pepper", "Black pepper", null, null)
    ],
    instructions: [
      step("If using bread, soak it in water for 30 minutes and squeeze it dry."),
      step("Blend the bread, vegetables, garlic, onion, vinegar, olive oil, optional chilli/coriander and iced water while retaining some texture."),
      step("Chill and season with salt and pepper."),
      step("Serve cold; the source describes diced vegetable and bread garnishes as optional table additions.")
    ],
    equipment: ["blender", "bowl"],
    servings: null,
    dietaryTags: ["vegetarian", "vegan"],
    allergens: ["gluten"],
    geography: { region: "Spain", country: "Spain", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Spanish recipes", "Vegan recipes", "Vegetarian recipes", "Easy recipes", "Refrigerated recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "constraint_first", "staple_everyday"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source omits servings and total cooking time; both remain unknown. Optional bread makes gluten status conservative for hard-allergen filtering."],
    runtimeValues: { costTier: 1, mealPrep: 2, leftovers: 2, portability: 1, novelty: 1, learning: 2 }
  }),
  record({
    id: "wikibooks_huevos_rancheros",
    title: "Huevos Rancheros",
    pageid: 85337,
    revid: 4511733,
    timestamp: "2025-06-17T15:23:15Z",
    dishFamilyId: "huevos_rancheros",
    cuisine: "Mexican",
    mealTypes: ["lunch"],
    difficulty: 3,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("neutral_oil", "3 tbsp (45 ml) vegetable oil", 45, "ml"),
      ingredient("onion", "1 medium onion", 1, "piece"),
      ingredient("garlic", "1 clove garlic", 1, "clove", false),
      ingredient("chilli", "Chopped chile peppers, to taste", null, null, false),
      ingredient("chilli_powder", "1 pinch chili powder", 1, "pinch"),
      ingredient("tomato", "4 plum tomatoes", 4, "pieces"),
      ingredient("corn_tortilla", "2 corn tortillas", 2, "pieces"),
      ingredient("eggs", "2 eggs", 2, "pieces"),
      ingredient("sugar", "½ tsp sugar", 0.5, "tsp"),
      ingredient("salt", "Salt to taste", null, null),
      ingredient("black_pepper", "Pepper to taste", null, null),
      ingredient("coriander", "1 tbsp cilantro or parsley", 1, "tbsp", false, { sourceAlternative: "parsley" })
    ],
    instructions: [
      step("Sauté onion and optional garlic in oil until softened."),
      step("Add tomatoes, chile, chili powder, salt and pepper and simmer until the ranchero sauce thickens."),
      step("Add optional coriander or parsley and keep the sauce warm."),
      step("Lightly fry the tortillas, then fry the eggs sunny-side up."),
      step("Place the eggs on the tortillas and cover with the ranchero sauce.")
    ],
    equipment: ["two_skillets"],
    servings: 2,
    dietaryTags: ["vegetarian"],
    allergens: ["egg"],
    geography: { region: "Mexico", country: "Mexico", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Mexican recipes", "Breakfast recipes", "Medium Difficulty recipes", "Pan fried recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "staple_everyday"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source specifies servings but not a total time; recommendation eligibility therefore remains fail-closed."],
    runtimeValues: { costTier: 1, mealPrep: 1, leftovers: 1, portability: 1, novelty: 2, learning: 3 }
  }),
  record({
    id: "wikibooks_spanish_omelet",
    title: "Spanish Omelet",
    pageid: 23021,
    revid: 4517807,
    timestamp: "2025-06-21T03:06:54Z",
    dishFamilyId: "spanish_potato_omelet",
    cuisine: "Spanish",
    mealTypes: ["lunch", "dinner"],
    difficulty: 3,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("potato", "450 g waxy potatoes", 450, "g"),
      ingredient("onion", "1 large white/Spanish onion", 1, "piece", false),
      ingredient("olive_oil", "About 1 liter oil, olive oil preferred", 1, "l"),
      ingredient("eggs", "6 eggs", 6, "pieces"),
      ingredient("salt", "1 pinch salt", 1, "pinch")
    ],
    instructions: [
      step("Peel and thinly slice the potatoes."),
      step("Cook the potatoes gently in oil until soft but not browned; cook the optional sliced onion until sweet."),
      step("Beat the eggs with salt, fold in the hot potato and onion, and rest briefly."),
      step("Drain and reserve excess oil, then cook the egg-potato mixture over low heat."),
      step("Invert the omelet onto a plate, slide it back into the pan, and repeat as needed until evenly cooked."),
      step("Transfer to a plate, cut into wedges and serve warm or cold.")
    ],
    equipment: ["saute_pan", "frying_pan", "large_plate"],
    servings: null,
    dietaryTags: ["vegetarian"],
    allergens: ["egg"],
    geography: { region: "Spain", country: "Spain", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Spanish recipes", "Breakfast recipes", "Pan fried recipes", "Medium Difficulty recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "staple_everyday", "technique_learning"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source omits servings and total cooking time. The external record shares a reviewed dish family with the app-authored Spanish potato-onion tortilla rather than being silently deduplicated."],
    runtimeValues: { costTier: 1, mealPrep: 2, leftovers: 2, portability: 2, novelty: 1, learning: 4 }
  }),
  record({
    id: "wikibooks_tzatziki",
    title: "Tzatziki",
    pageid: 128463,
    revid: 4519035,
    timestamp: "2025-06-21T17:20:31Z",
    dishFamilyId: "tzatziki",
    cuisine: "Greek",
    mealTypes: ["lunch", "dinner"],
    difficulty: 2,
    time: { prepMinutes: null, activeMinutes: null, passiveMinutes: null, totalMinutes: null, sourceState: "SOURCE_UNKNOWN" },
    ingredients: [
      ingredient("greek_yogurt", "1½ cups yogurt", 1.5, "cups"),
      ingredient("garlic", "4 cloves garlic", 4, "cloves"),
      ingredient("dill", "1 tbsp dill", 1, "tbsp"),
      ingredient("olive_oil", "2 tbsp olive oil", 2, "tbsp"),
      ingredient("lemon", "4 tbsp lemon juice", 4, "tbsp", false),
      ingredient("cucumber", "2 small cucumbers", 2, "small"),
      ingredient("salt", "Salt", null, null),
      ingredient("black_pepper", "White pepper to taste", null, null, false)
    ],
    instructions: [
      step("Drain the yogurt before use and salt/drain the diced cucumber to remove excess moisture."),
      step("Combine yogurt, garlic, olive oil and optional lemon juice, then refrigerate."),
      step("Mix in dill and cucumber until smooth."),
      step("Season with salt and optional pepper to taste.")
    ],
    equipment: ["sieve_or_cheesecloth", "bowl", "whisk"],
    servings: null,
    dietaryTags: ["vegetarian"],
    allergens: ["milk"],
    geography: { region: "Greece", country: "Greece", sourceState: "SOURCE_CATEGORY_AND_PAGE" },
    categories: ["Greek recipes", "Appetizer recipes", "Easy recipes", "Refrigerated recipes"],
    recipeRoles: ["canonical_classic", "regional_traditional", "constraint_first"],
    admissionState: "ADMIT_REFERENCE_METADATA_INCOMPLETE",
    sourceNotes: ["The source uses generic yogurt; the existing ontology normalizes yogurt to the app's yogurt canonical form. Source total time and servings remain unknown."],
    runtimeValues: { costTier: 2, mealPrep: 2, leftovers: 2, portability: 2, novelty: 1, learning: 2 }
  })
]);

export const WIKIBOOKS_GATE_F_RECOMMENDATION_ELIGIBLE_IDS = Object.freeze(
  WIKIBOOKS_GATE_F_RECIPES.filter(recipe => recipe.governance.recommendationState === "ELIGIBLE").map(recipe => recipe.id)
);
