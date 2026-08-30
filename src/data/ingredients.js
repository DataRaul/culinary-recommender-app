export const INGREDIENTS = {
  olive_oil: { id: "olive_oil", family: "fat", name: "olive oil", aliases: ["aceite de oliva", "extra virgin olive oil", "evoo"], allergens: [], pantryCandidate: true },
  salt: { id: "salt", family: "seasoning", name: "salt", aliases: ["sal"], allergens: [], pantryCandidate: true },
  black_pepper: { id: "black_pepper", family: "seasoning", name: "black pepper", aliases: ["pepper", "pimienta negra"], allergens: [], pantryCandidate: true },
  garlic: { id: "garlic", family: "allium", name: "garlic", aliases: ["ajo", "garlic clove", "garlic cloves"], allergens: [], pantryCandidate: true },
  onion: { id: "onion", family: "allium", name: "onion", aliases: ["onions", "cebolla", "yellow onion"], allergens: [], pantryCandidate: true },
  tomato: { id: "tomato", family: "tomato", name: "tomato", aliases: ["tomatoes", "tomate", "fresh tomato"], allergens: [], pantryCandidate: false },
  canned_tomato: { id: "canned_tomato", family: "tomato", name: "canned tomato", aliases: ["crushed tomato", "tomate triturado", "tinned tomato"], allergens: [], pantryCandidate: true },
  bell_pepper: { id: "bell_pepper", family: "pepper", name: "bell pepper", aliases: ["pepper", "pimiento", "red pepper"], allergens: [], pantryCandidate: false },
  spinach: { id: "spinach", family: "leafy_green", name: "spinach", aliases: ["espinaca", "baby spinach"], allergens: [], pantryCandidate: false },
  kale: { id: "kale", family: "leafy_green", name: "kale", aliases: ["curly kale"], allergens: [], pantryCandidate: false },
  cabbage: { id: "cabbage", family: "brassica", name: "cabbage", aliases: ["col", "white cabbage"], allergens: [], pantryCandidate: false },
  courgette: { id: "courgette", family: "squash", name: "courgette", aliases: ["zucchini", "calabacin", "calabacín"], allergens: [], pantryCandidate: false },
  aubergine: { id: "aubergine", family: "nightshade", name: "aubergine", aliases: ["eggplant", "berenjena"], allergens: [], pantryCandidate: false },
  carrot: { id: "carrot", family: "root", name: "carrot", aliases: ["carrots", "zanahoria"], allergens: [], pantryCandidate: false },
  potato: { id: "potato", family: "tuber", name: "potato", aliases: ["potatoes", "patata", "papa"], allergens: [], pantryCandidate: true },
  sweet_potato: { id: "sweet_potato", family: "tuber", name: "sweet potato", aliases: ["batata", "boniato"], allergens: [], pantryCandidate: false },
  broccoli: { id: "broccoli", family: "brassica", name: "broccoli", aliases: ["brócoli", "brocoli"], allergens: [], pantryCandidate: false },
  green_beans: { id: "green_beans", family: "vegetable", name: "green beans", aliases: ["judias verdes", "judías verdes"], allergens: [], pantryCandidate: false },
  lemon: { id: "lemon", family: "citrus", name: "lemon", aliases: ["limón", "lemon juice"], allergens: [], pantryCandidate: false },
  lime: { id: "lime", family: "citrus", name: "lime", aliases: ["lima", "lime juice"], allergens: [], pantryCandidate: false },
  parsley: { id: "parsley", family: "herb", name: "parsley", aliases: ["perejil"], allergens: [], pantryCandidate: false },
  coriander: { id: "coriander", family: "herb", name: "coriander", aliases: ["cilantro", "fresh coriander"], allergens: [], pantryCandidate: false },
  basil: { id: "basil", family: "herb", name: "basil", aliases: ["albahaca"], allergens: [], pantryCandidate: false },
  cumin: { id: "cumin", family: "spice", name: "ground cumin", aliases: ["cumin", "comino"], allergens: [], pantryCandidate: true },
  smoked_paprika: { id: "smoked_paprika", family: "spice", name: "smoked paprika", aliases: ["paprika", "pimenton", "pimentón"], allergens: [], pantryCandidate: true },
  curry_powder: { id: "curry_powder", family: "spice", name: "curry powder", aliases: ["curry"], allergens: [], pantryCandidate: true },
  chilli: { id: "chilli", family: "spice", name: "chilli", aliases: ["chili", "guindilla", "chilli flakes"], allergens: [], pantryCandidate: true },
  rice: { id: "rice", family: "grain", name: "rice", aliases: ["arroz", "long grain rice"], allergens: [], pantryCandidate: true },
  brown_rice: { id: "brown_rice", family: "grain", name: "brown rice", aliases: ["arroz integral"], allergens: [], pantryCandidate: true },
  couscous: { id: "couscous", family: "grain", name: "couscous", aliases: ["cuscus", "cuscús"], allergens: ["gluten"], pantryCandidate: true },
  pasta: { id: "pasta", family: "grain", name: "pasta", aliases: ["spaghetti", "penne"], allergens: ["gluten"], pantryCandidate: true },
  wholewheat_pasta: { id: "wholewheat_pasta", family: "grain", name: "wholewheat pasta", aliases: ["whole wheat pasta", "pasta integral"], allergens: ["gluten"], pantryCandidate: true },
  noodles: { id: "noodles", family: "grain", name: "wheat noodles", aliases: ["noodle", "fideos"], allergens: ["gluten"], pantryCandidate: true },
  oats: { id: "oats", family: "grain", name: "oats", aliases: ["oatmeal", "avena"], allergens: ["gluten"], pantryCandidate: true },
  bread: { id: "bread", family: "grain", name: "bread", aliases: ["pan", "wholegrain bread"], allergens: ["gluten"], pantryCandidate: true },
  lentils: { id: "lentils", family: "legume", name: "lentils", aliases: ["lentil", "lentejas", "brown lentils"], allergens: [], pantryCandidate: true },
  red_lentils: { id: "red_lentils", family: "legume", name: "red lentils", aliases: ["lenteja roja", "red split lentils"], allergens: [], pantryCandidate: true },
  chickpeas: { id: "chickpeas", family: "legume", name: "chickpeas", aliases: ["garbanzos", "garbanzo beans"], allergens: [], pantryCandidate: true },
  white_beans: { id: "white_beans", family: "legume", name: "white beans", aliases: ["cannellini beans", "judias blancas", "judías blancas"], allergens: [], pantryCandidate: true },
  black_beans: { id: "black_beans", family: "legume", name: "black beans", aliases: ["frijoles negros"], allergens: [], pantryCandidate: true },
  tofu_firm: { id: "tofu_firm", family: "soy", name: "firm tofu", aliases: ["tofu"], allergens: ["soy"], pantryCandidate: false },
  tempeh: { id: "tempeh", family: "soy", name: "tempeh", aliases: [], allergens: ["soy"], pantryCandidate: false },
  edamame: { id: "edamame", family: "soy", name: "edamame", aliases: ["soy beans"], allergens: ["soy"], pantryCandidate: false },
  eggs: { id: "eggs", family: "egg", name: "eggs", aliases: ["egg", "huevo", "huevos"], allergens: ["egg"], pantryCandidate: false },
  greek_yogurt: { id: "greek_yogurt", family: "dairy", name: "Greek yogurt", aliases: ["yogurt", "yoghurt", "yogur griego"], allergens: ["milk"], pantryCandidate: false },
  cottage_cheese: { id: "cottage_cheese", family: "dairy", name: "cottage cheese", aliases: ["queso cottage"], allergens: ["milk"], pantryCandidate: false },
  feta: { id: "feta", family: "dairy", name: "feta", aliases: ["feta cheese", "queso feta"], allergens: ["milk"], pantryCandidate: false },
  parmesan: { id: "parmesan", family: "dairy", name: "Parmesan", aliases: ["parmesan cheese", "parmigiano"], allergens: ["milk"], pantryCandidate: false },
  chicken_breast: { id: "chicken_breast", family: "poultry", name: "chicken breast", aliases: ["chicken", "pechuga de pollo"], allergens: [], pantryCandidate: false },
  turkey_mince: { id: "turkey_mince", family: "poultry", name: "turkey mince", aliases: ["ground turkey", "pavo picado"], allergens: [], pantryCandidate: false },
  salmon: { id: "salmon", family: "fish", name: "salmon", aliases: ["salmón"], allergens: ["fish"], pantryCandidate: false },
  tuna: { id: "tuna", family: "fish", name: "tuna", aliases: ["atún", "canned tuna"], allergens: ["fish"], pantryCandidate: true },
  prawns: { id: "prawns", family: "shellfish", name: "prawns", aliases: ["shrimp", "gambas"], allergens: ["crustacean"], pantryCandidate: false },
  beef_mince: { id: "beef_mince", family: "beef", name: "lean beef mince", aliases: ["ground beef", "carne picada"], allergens: [], pantryCandidate: false },
  peanuts: { id: "peanuts", family: "nut", name: "peanuts", aliases: ["cacahuetes", "peanut"], allergens: ["peanut"], pantryCandidate: true },
  peanut_butter: { id: "peanut_butter", family: "nut", name: "peanut butter", aliases: ["crema de cacahuete"], allergens: ["peanut"], pantryCandidate: true },
  almonds: { id: "almonds", family: "nut", name: "almonds", aliases: ["almendras"], allergens: ["tree_nut"], pantryCandidate: true },
  tahini: { id: "tahini", family: "seed", name: "tahini", aliases: ["sesame paste"], allergens: ["sesame"], pantryCandidate: true },
  sesame_oil: { id: "sesame_oil", family: "fat", name: "sesame oil", aliases: ["aceite de sésamo"], allergens: ["sesame"], pantryCandidate: true },
  soy_sauce: { id: "soy_sauce", family: "seasoning", name: "soy sauce", aliases: ["soya sauce", "salsa de soja"], allergens: ["soy", "gluten"], pantryCandidate: true },
  coconut_milk: { id: "coconut_milk", family: "coconut", name: "coconut milk", aliases: ["leche de coco"], allergens: [], pantryCandidate: true },
  quinoa: { id: "quinoa", family: "pseudo_grain", name: "quinoa", aliases: [], allergens: [], pantryCandidate: true },
  tortilla: { id: "tortilla", family: "flatbread", name: "tortilla wrap", aliases: ["wrap", "tortilla"], allergens: ["gluten"], pantryCandidate: true },
  corn_tortilla: { id: "corn_tortilla", family: "flatbread", name: "corn tortilla", aliases: ["tortilla de maiz", "tortilla de maíz"], allergens: [], pantryCandidate: true },
  avocado: { id: "avocado", family: "fruit", name: "avocado", aliases: ["aguacate"], allergens: [], pantryCandidate: false },
  banana: { id: "banana", family: "fruit", name: "banana", aliases: ["plátano", "platano"], allergens: [], pantryCandidate: false },
  apple: { id: "apple", family: "fruit", name: "apple", aliases: ["manzana"], allergens: [], pantryCandidate: false },
  frozen_berries: { id: "frozen_berries", family: "fruit", name: "frozen berries", aliases: ["berries", "frutos rojos congelados"], allergens: [], pantryCandidate: false }
};

const aliasIndex = new Map();
for (const ingredient of Object.values(INGREDIENTS)) {
  aliasIndex.set(ingredient.id, ingredient.id);
  aliasIndex.set(ingredient.name.toLowerCase(), ingredient.id);
  for (const alias of ingredient.aliases) aliasIndex.set(alias.toLowerCase(), ingredient.id);
}

export function normalizeIngredient(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ");
  return aliasIndex.get(cleaned) || null;
}

export function ingredientById(id) {
  return INGREDIENTS[id] || null;
}

export const DEFAULT_PANTRY_STAPLES = ["olive_oil", "salt", "black_pepper", "garlic", "onion", "rice", "cumin", "smoked_paprika"];
