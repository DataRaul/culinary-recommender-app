import { RecipeSource } from "../core/contracts.js";
import { ALL_RECIPES, recipeByIdV1 } from "../data/corpus-v1.js";

const clone = value => typeof structuredClone === "function"
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

export class StaticRecipeSourceV1 extends RecipeSource {
  list() {
    return ALL_RECIPES.map(recipe => clone(recipe));
  }

  getById(id) {
    const recipe = recipeByIdV1(id);
    return recipe ? clone(recipe) : null;
  }
}

export class PortableJsonRecipeSourceV2 extends RecipeSource {
  constructor(recipes = []) {
    super();
    if (!Array.isArray(recipes)) throw new TypeError("RecipeSource V2 requires an array of recipes");

    this.ids = [];
    this.bodyById = new Map();
    for (const recipe of recipes) {
      const id = recipe?.id;
      if (typeof id !== "string" || !id.trim()) throw new Error("RecipeSource V2 requires every recipe to have a non-empty string id");
      if (this.bodyById.has(id)) throw new Error(`RecipeSource V2 duplicate recipe id: ${id}`);
      const body = JSON.stringify(recipe);
      if (typeof body !== "string") throw new Error(`RecipeSource V2 recipe is not JSON-serializable: ${id}`);
      this.ids.push(id);
      this.bodyById.set(id, body);
    }
    Object.freeze(this.ids);
  }

  list() {
    return this.ids.map(id => JSON.parse(this.bodyById.get(id)));
  }

  getById(id) {
    const body = this.bodyById.get(id);
    return body == null ? null : JSON.parse(body);
  }
}

export const recipeSourceV1 = new StaticRecipeSourceV1();

export function createRecipeSourceV2(recipes = ALL_RECIPES) {
  return new PortableJsonRecipeSourceV2(recipes);
}

// Step 2 proves V1/V2 compatibility before any runtime cut-over. Keep the
// reviewed V1 source as the browser default until a later explicit gate.
export const publicRecipeSource = recipeSourceV1;
