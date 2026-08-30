import { ingredientById } from "./ingredients.js";

const CLASS_SCORE = { low: 1, medium: 2, high: 3, premium: 4 };

const PREMIUM = new Set(["salmon", "prawns"]);
const HIGH = new Set(["cod", "hake", "beef_mince", "pork_tenderloin", "chicken_breast", "chicken_thigh", "turkey_mince", "parmesan", "cashews", "almonds", "walnuts"]);
const LOW = new Set([
  "rice", "brown_rice", "basmati_rice", "jasmine_rice", "pasta", "wholewheat_pasta", "couscous", "bulgur", "barley", "oats",
  "lentils", "red_lentils", "chickpeas", "white_beans", "black_beans", "kidney_beans", "pinto_beans", "potato", "onion", "carrot",
  "canned_tomato", "passata", "tomato_paste", "peas", "sweetcorn", "eggs"
]);

const VARIABLE_CANARY = new Set(["tempeh", "miso", "edamame", "rice_noodles", "jasmine_rice", "tahini", "coconut_cream", "mango"]);
const PACKAGE_SENSITIVE = new Set(["miso", "tahini", "peanut_butter", "coconut_cream", "coconut_milk", "feta", "parmesan", "ricotta", "cottage_cheese", "sesame_oil", "rice_vinegar"]);

export function costHeuristicForIngredient(ingredientId) {
  const ingredient = ingredientById(ingredientId);
  const costClass = PREMIUM.has(ingredientId) ? "premium" : HIGH.has(ingredientId) ? "high" : LOW.has(ingredientId) ? "low" : "medium";
  const availability = VARIABLE_CANARY.has(ingredientId) ? "variable" : "high";
  const pantryCandidate = Boolean(ingredient?.pantryCandidate);
  return {
    ingredientId,
    costClass,
    classScore: CLASS_SCORE[costClass],
    availability,
    availabilityPenalty: availability === "variable" ? 0.35 : 0,
    packageSensitivity: PACKAGE_SENSITIVE.has(ingredientId) ? 1 : pantryCandidate ? 0.15 : 0.45,
    pantryCandidate,
    geography: "Spain / Canary Islands heuristic",
    confidence: "low",
    state: "RELATIVE_HEURISTIC_NO_LIVE_PRICE"
  };
}

export const COST_HEURISTIC_VERSION = "spain-canary-v1";
