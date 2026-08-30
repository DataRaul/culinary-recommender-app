import { RECIPES, recipeById } from "../data/recipes.js";

export const publicRecipeSource = {
  list: () => RECIPES.map(recipe => structuredClone(recipe)),
  getById: id => {
    const recipe = recipeById(id);
    return recipe ? structuredClone(recipe) : null;
  }
};
