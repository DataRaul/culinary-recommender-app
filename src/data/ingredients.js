const item = (id, family, name, aliases = [], allergens = [], pantryCandidate = false, families = []) => ({
  id,
  family,
  families: [...new Set([family, ...families])],
  name,
  aliases,
  allergens,
  pantryCandidate
});

export const INGREDIENTS = {
  olive_oil: item("olive_oil", "fat", "olive oil", ["aceite de oliva", "extra virgin olive oil", "evoo"], [], true),
  neutral_oil: item("neutral_oil", "fat", "neutral cooking oil", ["vegetable oil", "sunflower oil", "aceite vegetal", "aceite de girasol"], [], true),
  sesame_oil: item("sesame_oil", "fat", "sesame oil", ["aceite de sésamo", "aceite de sesamo"], ["sesame"], true, ["sesame"]),
  butter: item("butter", "dairy", "butter", ["mantequilla"], ["milk"], true),

  salt: item("salt", "seasoning", "salt", ["sal"], [], true),
  black_pepper: item("black_pepper", "seasoning", "black pepper", ["pepper", "pimienta negra", "peppercorns", "white pepper"], [], true),
  garlic: item("garlic", "allium", "garlic", ["ajo", "garlic clove", "garlic cloves"], [], true),
  onion: item("onion", "allium", "onion", ["onions", "cebolla", "yellow onion", "spanish onion", "white onion"], [], true),
  red_onion: item("red_onion", "allium", "red onion", ["cebolla roja", "cebolla morada"], [], false),
  spring_onion: item("spring_onion", "allium", "spring onion", ["green onion", "scallion", "cebolleta"], [], false),
  leek: item("leek", "allium", "leek", ["puerro"], [], false),
  fresh_ginger: item("fresh_ginger", "aromatic", "fresh ginger", ["ginger", "jengibre"], [], true),

  tomato: item("tomato", "tomato", "tomato", ["tomatoes", "tomate", "fresh tomato", "plum tomato", "plum tomatoes"], [], false),
  cherry_tomato: item("cherry_tomato", "tomato", "cherry tomatoes", ["cherry tomato", "tomates cherry"], [], false),
  canned_tomato: item("canned_tomato", "tomato", "canned tomato", ["crushed tomato", "tomate triturado", "tinned tomato"], [], true),
  passata: item("passata", "tomato", "tomato passata", ["passata", "tomate tamizado"], [], true),
  tomato_paste: item("tomato_paste", "tomato", "tomato paste", ["tomato puree", "concentrado de tomate", "tomate concentrado"], [], true),
  bell_pepper: item("bell_pepper", "pepper", "bell pepper", ["pimiento", "red pepper", "sweet pepper", "green bell pepper"], [], false),
  spinach: item("spinach", "leafy_green", "spinach", ["espinaca", "baby spinach"], [], false),
  kale: item("kale", "leafy_green", "kale", ["curly kale"], [], false),
  lettuce: item("lettuce", "leafy_green", "lettuce", ["lechuga"], [], false),
  rocket: item("rocket", "leafy_green", "rocket", ["arugula", "rúcula", "rucula"], [], false),
  cabbage: item("cabbage", "brassica", "cabbage", ["col", "white cabbage"], [], false),
  cauliflower: item("cauliflower", "brassica", "cauliflower", ["coliflor"], [], false),
  broccoli: item("broccoli", "brassica", "broccoli", ["brócoli", "brocoli"], [], false),
  courgette: item("courgette", "squash", "courgette", ["zucchini", "calabacin", "calabacín"], [], false),
  aubergine: item("aubergine", "nightshade", "aubergine", ["eggplant", "berenjena"], [], false),
  carrot: item("carrot", "root", "carrot", ["carrots", "zanahoria"], [], false),
  celery: item("celery", "vegetable", "celery", ["apio"], [], false),
  mushroom: item("mushroom", "fungus", "mushrooms", ["mushroom", "champignon", "champiñón", "champiñones"], [], false),
  green_beans: item("green_beans", "vegetable", "green beans", ["judias verdes", "judías verdes"], [], false),
  peas: item("peas", "legume_vegetable", "peas", ["green peas", "guisantes", "frozen peas"], [], true, ["legume"]),
  sweetcorn: item("sweetcorn", "vegetable", "sweetcorn", ["corn", "maiz", "maíz", "corn kernels"], [], true),
  cucumber: item("cucumber", "vegetable", "cucumber", ["cucumbers", "pepino"], [], false),
  potato: item("potato", "tuber", "potato", ["potatoes", "patata", "papa"], [], true),
  sweet_potato: item("sweet_potato", "tuber", "sweet potato", ["batata", "boniato"], [], false),
  pumpkin: item("pumpkin", "squash", "pumpkin", ["calabaza"], [], false),

  lemon: item("lemon", "citrus", "lemon", ["limón", "limon", "lemon juice"], [], false),
  lime: item("lime", "citrus", "lime", ["lima", "lime juice"], [], false),
  orange: item("orange", "citrus", "orange", ["naranja"], [], false),
  avocado: item("avocado", "fruit", "avocado", ["aguacate"], [], false),
  banana: item("banana", "fruit", "banana", ["plátano", "platano"], [], false),
  apple: item("apple", "fruit", "apple", ["manzana"], [], false),
  mango: item("mango", "fruit", "mango", [], [], false),
  pineapple: item("pineapple", "fruit", "pineapple", ["piña", "pina", "fresh pineapple"], [], false),
  frozen_berries: item("frozen_berries", "fruit", "frozen berries", ["berries", "frutos rojos congelados"], [], false),

  parsley: item("parsley", "herb", "parsley", ["perejil"], [], false),
  coriander: item("coriander", "herb", "coriander", ["cilantro", "fresh coriander"], [], false),
  basil: item("basil", "herb", "basil", ["albahaca"], [], false),
  mint: item("mint", "herb", "mint", ["menta", "hierbabuena"], [], false),
  oregano: item("oregano", "herb", "oregano", ["orégano"], [], true),
  thyme: item("thyme", "herb", "thyme", ["tomillo"], [], true),
  rosemary: item("rosemary", "herb", "rosemary", ["romero"], [], true),
  dill: item("dill", "herb", "dill", ["eneldo"], [], false),
  bay_leaf: item("bay_leaf", "herb", "bay leaf", ["bay leaves", "laurel", "hoja de laurel"], [], true),

  cumin: item("cumin", "spice", "ground cumin", ["cumin", "comino"], [], true),
  smoked_paprika: item("smoked_paprika", "spice", "smoked paprika", ["paprika", "pimenton", "pimentón"], [], true),
  turmeric: item("turmeric", "spice", "ground turmeric", ["turmeric", "cúrcuma", "curcuma"], [], true),
  ground_coriander: item("ground_coriander", "spice", "ground coriander", ["coriander powder", "cilantro molido"], [], true),
  curry_powder: item("curry_powder", "spice", "curry powder", ["curry"], [], true),
  garam_masala: item("garam_masala", "spice", "garam masala", [], [], true),
  cinnamon: item("cinnamon", "spice", "ground cinnamon", ["cinnamon", "canela"], [], true),
  chilli: item("chilli", "chilli", "chilli", ["chili", "guindilla", "chile pepper", "chile peppers"], [], true, ["spice"]),
  chilli_flakes: item("chilli_flakes", "chilli", "chilli flakes", ["chili flakes", "red pepper flakes", "copos de chile"], [], true, ["spice"]),
  chilli_powder: item("chilli_powder", "chilli", "chilli powder", ["chili powder", "chile powder"], [], true, ["spice"]),

  rice: item("rice", "grain", "rice", ["arroz", "long grain rice"], [], true, ["rice"]),
  brown_rice: item("brown_rice", "grain", "brown rice", ["arroz integral"], [], true, ["rice"]),
  basmati_rice: item("basmati_rice", "grain", "basmati rice", ["arroz basmati"], [], true, ["rice"]),
  jasmine_rice: item("jasmine_rice", "grain", "jasmine rice", ["arroz jazmín", "arroz jazmin"], [], true, ["rice"]),
  risotto_rice: item("risotto_rice", "grain", "risotto rice", ["arborio rice", "arroz arborio"], [], true, ["rice"]),
  couscous: item("couscous", "grain", "couscous", ["cuscus", "cuscús"], ["gluten"], true, ["wheat"]),
  bulgur: item("bulgur", "grain", "bulgur", ["bulgur wheat", "trigo bulgur"], ["gluten"], true, ["wheat"]),
  barley: item("barley", "grain", "barley", ["cebada"], ["gluten"], true),
  pasta: item("pasta", "grain", "pasta", ["spaghetti", "penne"], ["gluten"], true, ["pasta", "wheat"]),
  wholewheat_pasta: item("wholewheat_pasta", "grain", "wholewheat pasta", ["whole wheat pasta", "pasta integral"], ["gluten"], true, ["pasta", "wheat"]),
  orzo: item("orzo", "grain", "orzo pasta", ["orzo", "risoni"], ["gluten"], true, ["pasta", "wheat"]),
  noodles: item("noodles", "grain", "wheat noodles", ["noodle", "fideos"], ["gluten"], true, ["noodle", "wheat"]),
  rice_noodles: item("rice_noodles", "grain", "rice noodles", ["rice noodle", "fideos de arroz"], [], true, ["noodle", "rice"]),
  oats: item("oats", "grain", "oats", ["oatmeal", "avena"], ["gluten"], true),
  bread: item("bread", "grain", "bread", ["pan", "wholegrain bread"], ["gluten"], true, ["wheat"]),
  tortilla: item("tortilla", "flatbread", "tortilla wrap", ["wrap", "flour tortilla", "tortilla de trigo"], ["gluten"], true, ["wheat"]),
  corn_tortilla: item("corn_tortilla", "flatbread", "corn tortilla", ["tortilla de maiz", "tortilla de maíz", "corn tortillas"], [], true, ["corn"]),
  quinoa: item("quinoa", "pseudo_grain", "quinoa", [], [], true),

  lentils: item("lentils", "legume", "lentils", ["lentil", "lentejas", "brown lentils"], [], true),
  red_lentils: item("red_lentils", "legume", "red lentils", ["lenteja roja", "red split lentils"], [], true),
  chickpeas: item("chickpeas", "legume", "chickpeas", ["garbanzos", "garbanzo beans"], [], true),
  white_beans: item("white_beans", "legume", "white beans", ["cannellini beans", "judias blancas", "judías blancas"], [], true, ["bean"]),
  black_beans: item("black_beans", "legume", "black beans", ["frijoles negros"], [], true, ["bean"]),
  kidney_beans: item("kidney_beans", "legume", "kidney beans", ["red kidney beans", "alubias rojas"], [], true, ["bean"]),
  pinto_beans: item("pinto_beans", "legume", "pinto beans", ["frijoles pintos"], [], true, ["bean"]),

  tofu_firm: item("tofu_firm", "soy", "firm tofu", ["tofu"], ["soy"], false),
  tempeh: item("tempeh", "soy", "tempeh", [], ["soy"], false),
  edamame: item("edamame", "soy", "edamame", ["soy beans", "soybeans"], ["soy"], false, ["legume"]),
  miso: item("miso", "soy", "miso paste", ["miso"], ["soy"], true),
  soy_sauce: item("soy_sauce", "seasoning", "soy sauce", ["soya sauce", "salsa de soja"], ["soy", "gluten"], true, ["soy"]),

  eggs: item("eggs", "egg", "eggs", ["egg", "huevo", "huevos"], ["egg"], false),
  greek_yogurt: item("greek_yogurt", "dairy", "Greek yogurt", ["yogurt", "yoghurt", "yogur griego"], ["milk"], false),
  cottage_cheese: item("cottage_cheese", "dairy", "cottage cheese", ["queso cottage"], ["milk"], false),
  feta: item("feta", "dairy", "feta", ["feta cheese", "queso feta"], ["milk"], false),
  parmesan: item("parmesan", "dairy", "Parmesan", ["parmesan cheese", "parmigiano"], ["milk"], false),
  ricotta: item("ricotta", "dairy", "ricotta", ["ricotta cheese", "queso ricotta"], ["milk"], false),
  mozzarella: item("mozzarella", "dairy", "mozzarella", ["mozzarella cheese", "fresh mozzarella"], ["milk"], false),
  milk: item("milk", "dairy", "milk", ["leche"], ["milk"], false),
  oat_milk: item("oat_milk", "plant_milk", "oat drink", ["oat milk", "bebida de avena"], ["gluten"], false, ["oat"]),
  soy_milk: item("soy_milk", "plant_milk", "soy drink", ["soy milk", "soya milk", "bebida de soja"], ["soy"], false, ["soy"]),
  coconut_milk: item("coconut_milk", "coconut", "coconut milk", ["leche de coco"], [], true),
  coconut_cream: item("coconut_cream", "coconut", "coconut cream", ["crema de coco"], [], true),
  desiccated_coconut: item("desiccated_coconut", "coconut", "desiccated coconut", ["shredded coconut", "coco rallado"], [], true),

  chicken_breast: item("chicken_breast", "poultry", "chicken breast", ["chicken", "pechuga de pollo"], [], false, ["chicken"]),
  chicken_thigh: item("chicken_thigh", "poultry", "chicken thigh", ["chicken thighs", "muslo de pollo", "chicken pieces"], [], false, ["chicken"]),
  turkey_mince: item("turkey_mince", "poultry", "turkey mince", ["ground turkey", "pavo picado"], [], false, ["turkey"]),
  beef_mince: item("beef_mince", "beef", "lean beef mince", ["ground beef", "carne picada"], [], false),
  pork_tenderloin: item("pork_tenderloin", "pork", "pork tenderloin", ["pork fillet", "solomillo de cerdo"], [], false),

  salmon: item("salmon", "fish", "salmon", ["salmón", "salmon fillet"], ["fish"], false, ["seafood"]),
  tuna: item("tuna", "fish", "tuna", ["atún", "canned tuna", "tinned tuna"], ["fish"], true, ["seafood"]),
  cod: item("cod", "fish", "cod", ["bacalao", "cod fillet"], ["fish"], false, ["seafood"]),
  hake: item("hake", "fish", "hake", ["merluza", "hake fillet"], ["fish"], false, ["seafood"]),
  sardines: item("sardines", "fish", "sardines", ["sardine", "sardinas", "canned sardines"], ["fish"], true, ["seafood"]),
  prawns: item("prawns", "shellfish", "prawns", ["shrimp", "gambas"], ["crustacean"], false, ["seafood"]),
  fish_sauce: item("fish_sauce", "seasoning", "fish sauce", ["salsa de pescado"], ["fish"], true, ["seafood"]),

  peanuts: item("peanuts", "nut", "peanuts", ["cacahuetes", "peanut"], ["peanut"], true, ["peanut"]),
  peanut_butter: item("peanut_butter", "nut", "peanut butter", ["crema de cacahuete"], ["peanut"], true, ["peanut"]),
  almonds: item("almonds", "nut", "almonds", ["almendras"], ["tree_nut"], true, ["tree_nut"]),
  walnuts: item("walnuts", "nut", "walnuts", ["nueces", "walnut"], ["tree_nut"], true, ["tree_nut"]),
  cashews: item("cashews", "nut", "cashews", ["anacardos", "cashew nuts"], ["tree_nut"], true, ["tree_nut"]),
  tahini: item("tahini", "seed", "tahini", ["sesame paste"], ["sesame"], true, ["sesame"]),
  sesame_seeds: item("sesame_seeds", "seed", "sesame seeds", ["sesame", "semillas de sésamo", "semillas de sesamo"], ["sesame"], true, ["sesame"]),
  pumpkin_seeds: item("pumpkin_seeds", "seed", "pumpkin seeds", ["pepitas", "semillas de calabaza"], [], true),
  sunflower_seeds: item("sunflower_seeds", "seed", "sunflower seeds", ["semillas de girasol"], [], true),

  vinegar: item("vinegar", "acid", "vinegar", ["white vinegar", "wine vinegar", "red wine vinegar", "coconut vinegar", "vinagre"], [], true),
  rice_vinegar: item("rice_vinegar", "acid", "rice vinegar", ["vinagre de arroz"], [], true),
  balsamic_vinegar: item("balsamic_vinegar", "acid", "balsamic vinegar", ["vinagre balsámico", "vinagre balsamico"], [], true),
  sugar: item("sugar", "sweetener", "sugar", ["white sugar", "azúcar", "azucar"], [], true),
  honey: item("honey", "sweetener", "honey", ["miel"], [], true),
  maple_syrup: item("maple_syrup", "sweetener", "maple syrup", ["sirope de arce"], [], true),
  water: item("water", "water", "water", ["iced water", "agua"], [], true)
};

function normalizeAlias(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");
}

const aliasIndex = new Map();
for (const ingredient of Object.values(INGREDIENTS)) {
  aliasIndex.set(normalizeAlias(ingredient.id.replaceAll("_", " ")), ingredient.id);
  aliasIndex.set(normalizeAlias(ingredient.name), ingredient.id);
  for (const alias of ingredient.aliases) aliasIndex.set(normalizeAlias(alias), ingredient.id);
}

export function normalizeIngredient(value) {
  if (!value) return null;
  return aliasIndex.get(normalizeAlias(value)) || null;
}

export function ingredientById(id) {
  return INGREDIENTS[id] || null;
}

export function ingredientFamilies(id) {
  const ingredient = ingredientById(id);
  return ingredient ? ingredient.families || [ingredient.family] : [];
}

export const DEFAULT_PANTRY_STAPLES = ["olive_oil", "salt", "black_pepper", "garlic", "onion", "rice", "cumin", "smoked_paprika"];