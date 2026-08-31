const AUTHORED_DISH_FAMILY_OVERRIDES = Object.freeze({
  spanish_potato_onion_tortilla: "spanish_potato_omelet"
});

export function dishFamilyIdForRecipe(recipe) {
  if (!recipe?.id) return null;
  return recipe.corpusMetadata?.dishFamilyId
    || AUTHORED_DISH_FAMILY_OVERRIDES[recipe.id]
    || recipe.id;
}

export function buildDishFamilyIndex(recipes = []) {
  const index = new Map();
  for (const recipe of recipes) {
    const familyId = dishFamilyIdForRecipe(recipe);
    if (!familyId) continue;
    const rows = index.get(familyId) || [];
    rows.push({
      recipeId: recipe.id,
      sourceType: recipe.provenance?.sourceType || "PROJECT_AUTHORED",
      sourceName: recipe.provenance?.sourceName || "Culinary Recommender project-authored corpus"
    });
    index.set(familyId, rows);
  }
  return new Map([...index.entries()].map(([familyId, rows]) => [
    familyId,
    rows.sort((a, b) => a.recipeId.localeCompare(b.recipeId))
  ]).sort((a, b) => a[0].localeCompare(b[0])));
}

export function crossSourceDishFamilies(recipes = []) {
  return [...buildDishFamilyIndex(recipes).entries()]
    .filter(([, rows]) => new Set(rows.map(row => row.sourceType)).size > 1)
    .map(([dishFamilyId, rows]) => ({ dishFamilyId, recipes: rows }));
}
