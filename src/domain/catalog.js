import { ALL_RECIPES, recipeByIdV1 } from "../data/corpus-v1.js";

export const publicRecipeSource = {
  list: () => ALL_RECIPES.map(recipe => structuredClone(recipe)),
  getById: id => {
    const recipe = recipeByIdV1(id);
    return recipe ? structuredClone(recipe) : null;
  }
};
