export const RECIPE_IMAGES_P0_BROWSER_REGISTRY = Object.freeze({
  spanish_potato_onion_tortilla: Object.freeze({
    assetId: "p0_spanish_potato_onion_tortilla",
    assetPath: "./assets/recipes/spanish_potato_onion_tortilla.svg",
    width: 960,
    height: 720,
    altText: "Stylized potato and onion tortilla cut into golden wedges on a plate."
  }),
  med_chicken_orzo_vegetables: Object.freeze({
    assetId: "p0_med_chicken_orzo_vegetables",
    assetPath: "./assets/recipes/med_chicken_orzo_vegetables.svg",
    width: 960,
    height: 720,
    altText: "Stylized bowl of lemon chicken, orzo, tomatoes and green vegetables."
  }),
  indian_chickpea_cauliflower_curry: Object.freeze({
    assetId: "p0_indian_chickpea_cauliflower_curry",
    assetPath: "./assets/recipes/indian_chickpea_cauliflower_curry.svg",
    width: 960,
    height: 720,
    altText: "Stylized orange curry with chickpeas, cauliflower and green herbs in a bowl."
  }),
  east_asian_miso_salmon_rice: Object.freeze({
    assetId: "p0_east_asian_miso_salmon_rice",
    assetPath: "./assets/recipes/east_asian_miso_salmon_rice.svg",
    width: 960,
    height: 720,
    altText: "Stylized miso salmon fillet with rice and green vegetables on a plate."
  }),
  middle_eastern_mujaddara: Object.freeze({
    assetId: "p0_middle_eastern_mujaddara",
    assetPath: "./assets/recipes/middle_eastern_mujaddara.svg",
    width: 960,
    height: 720,
    altText: "Stylized bowl of mujaddara with lentils, rice and browned onion strands."
  }),
  latin_chicken_black_bean_tacos: Object.freeze({
    assetId: "p0_latin_chicken_black_bean_tacos",
    assetPath: "./assets/recipes/latin_chicken_black_bean_tacos.svg",
    width: 960,
    height: 720,
    altText: "Stylized trio of chicken and black bean tacos with tomato and greens."
  })
});

export function recipeImageForId(recipeId) {
  return RECIPE_IMAGES_P0_BROWSER_REGISTRY[recipeId] || null;
}

export function recipeImageMarkup(recipeId) {
  const image = recipeImageForId(recipeId);
  if (!image) return "";
  const attrs = [
    `src="${image.assetPath}"`,
    `alt="${image.altText.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}"`,
    `width="${image.width}"`,
    `height="${image.height}"`,
    'loading="lazy"',
    'decoding="async"',
    'class="recipe-media-image"',
    'data-recipe-image'
  ].join(" ");
  return `<div class="recipe-media" data-recipe-id="${recipeId}" data-image-state="loading">
    <div class="recipe-media-fallback" aria-hidden="true"><span>Recipe image unavailable</span></div>
    <img ${attrs}>
  </div>`;
}

export function bindRecipeImageFallbacks(root = document) {
  root.querySelectorAll?.(".recipe-media[data-image-state='loading']").forEach(container => {
    const image = container.querySelector("img[data-recipe-image]");
    if (!image) {
      container.dataset.imageState = "error";
      return;
    }
    const markLoaded = () => { container.dataset.imageState = "loaded"; };
    const markError = () => { container.dataset.imageState = "error"; };
    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markError, { once: true });
    if (image.complete) {
      if (image.naturalWidth > 0) markLoaded();
      else markError();
    }
  });
}
