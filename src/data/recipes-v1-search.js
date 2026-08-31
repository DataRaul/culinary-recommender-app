const ing = (id, quantity, unit, preparation = null, required = true) => ({
  canonicalIngredientId: id,
  originalText: `${quantity ?? ""} ${unit ?? ""} ${id}`.trim(),
  normalizedIngredient: id,
  quantity,
  unit,
  required,
  preparation,
  substitutionGroup: id
});

const recipe = ({
  id, title, cuisine, region = null, mealTypes = ["lunch", "dinner"], techniques = [], difficulty = 1,
  failureRisk = "low", prep = 10, active = 20, passive = 0, servings = 2, ingredients, steps,
  equipment = ["hob", "pan"], nutrition, dietary = ["unrestricted"], allergens = [], costTier = 2,
  mealPrep = 2, batch = 2, freezer = 1, leftovers = 2, portable = 2, flavour = [], spice = 1,
  familiarity = 2, novelty = 2, learning = 1, availability = "high", mainProtein = null
}) => ({
  id,
  identity: { canonicalTitle: title, alternateTitle: null, language: "en" },
  provenance: {
    source: "Culinary Recommender project-authored V1 search-coverage corpus",
    sourceReference: "data/project-authored-v1-search-coverage",
    license: "PROJECT_AUTHORED_UNLICENSED",
    attributionRequirement: "None beyond repository provenance while no public content licence is granted.",
    originalAdaptedStatus: "original_v1_search_coverage",
    ingestionVersion: "1.0.3"
  },
  culinary: { cuisine, region, mealTypes, techniques, difficulty, techniqueComplexity: difficulty, failureRisk },
  time: { prepMinutes: prep, activeMinutes: active, passiveMinutes: passive, totalMinutes: prep + active + passive },
  ingredients,
  instructions: steps.map((text, index) => ({ order: index + 1, stage: `Step ${index + 1}`, text, techniqueNote: null })),
  equipment: { required: equipment, optional: [], substitutable: [] },
  serving: { servings, scalable: true, minimumSensibleBatch: servings },
  nutrition: {
    perServing: nutrition,
    provenance: "Project-authored rough estimate for ranking/display; not laboratory data. Authoritative static nutrition remains evidence-gated separately.",
    estimationState: "INFERRED_ESTIMATE",
    confidence: "low"
  },
  dietaryTags: dietary,
  allergySafety: { declaredAllergens: allergens, confidence: "ingredient-list-derived" },
  economics: {
    costTier,
    ingredientCostAssumptions: "Relative Spain/Canary supermarket basket heuristic; no live prices.",
    approximatePerServingTier: costTier,
    confidence: "low"
  },
  convenience: { mealPrepSuitability: mealPrep, batchSuitability: batch, freezerSuitability: freezer, leftoverSuitability: leftovers, portability: portable },
  discovery: { flavourProfile: flavour, spiceLevel: spice, familiarity, novelty, techniqueLearningValue: learning },
  geography: { likelySpainAvailability: availability, likelyCanaryAvailability: availability, hardToFindIngredientFlags: [], substitutionCandidates: [] },
  mainProtein
});

export const SEARCH_COVERAGE_RECIPES = [
  recipe({
    id: "se_asian_pineapple_tofu_jasmine_rice", title: "Pineapple, Tofu & Pepper Jasmine Rice", cuisine: "Southeast Asian", difficulty: 2,
    techniques: ["stir-frying", "sauce-reduction"], prep: 12, active: 20,
    ingredients: [ing("tofu_firm",300,"g","cubed"),ing("pineapple",220,"g","small chunks"),ing("jasmine_rice",140,"g"),ing("bell_pepper",1,"piece","sliced"),ing("soy_sauce",1.5,"tbsp"),ing("lime",1,"piece"),ing("fresh_ginger",12,"g","grated")],
    steps: ["Cook jasmine rice.","Brown tofu well, then stir-fry pepper and ginger until fragrant.","Add pineapple and soy sauce, toss until glossy, and serve over rice with lime."],
    nutrition: { energyKcal: 570, proteinG: 29, carbohydrateG: 82, fatG: 16, fibreG: 9 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","gluten"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["sweet_sour","ginger","lime"], spice: 1, novelty: 3, learning: 2, mainProtein: "soy"
  }),
  recipe({
    id: "latin_pineapple_black_bean_rice", title: "Pineapple, Black Bean & Lime Rice Bowl", cuisine: "Latin American", difficulty: 1,
    techniques: ["pan-searing", "assembly"], prep: 12, active: 17,
    ingredients: [ing("pineapple",220,"g","small chunks"),ing("black_beans",300,"g","drained"),ing("rice",140,"g"),ing("bell_pepper",1,"piece","diced"),ing("coriander",15,"g"),ing("lime",1,"piece"),ing("cumin",1,"tsp")],
    steps: ["Cook rice.","Sear pineapple and pepper briefly, then add black beans and cumin to warm through.","Serve over rice with coriander and lime."],
    nutrition: { energyKcal: 540, proteinG: 20, carbohydrateG: 105, fatG: 5, fibreG: 16 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["sweet","lime","cumin"], novelty: 3, mainProtein: "legume"
  }),
  recipe({
    id: "indian_chickpea_cauliflower_basmati", title: "Spiced Chickpea, Cauliflower & Basmati Pot", cuisine: "Indian", difficulty: 1,
    techniques: ["toasting-spices", "simmering"], prep: 10, active: 25,
    ingredients: [ing("chickpeas",320,"g","drained"),ing("cauliflower",350,"g","small florets"),ing("basmati_rice",140,"g"),ing("canned_tomato",220,"g"),ing("onion",1,"small"),ing("garam_masala",1.5,"tsp"),ing("turmeric",0.5,"tsp")],
    steps: ["Cook basmati rice.","Soften onion, toast garam masala and turmeric briefly, then add tomato and cauliflower.","Simmer until cauliflower is tender, fold in chickpeas to heat through, and serve with rice."],
    nutrition: { energyKcal: 560, proteinG: 22, carbohydrateG: 101, fatG: 9, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["warm_spice","tomato","earthy"], spice: 2, novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "middle_eastern_lentil_bulgur_herb_bowl", title: "Lentil, Bulgur & Herb Bowl", cuisine: "Middle Eastern", difficulty: 1,
    techniques: ["simmering", "assembly"], prep: 12, active: 20,
    ingredients: [ing("lentils",180,"g"),ing("bulgur",130,"g"),ing("tomato",2,"pieces","diced"),ing("cucumber",0.5,"piece","diced"),ing("parsley",20,"g"),ing("mint",10,"g"),ing("lemon",1,"piece")],
    steps: ["Cook lentils until tender and bulgur until fluffy, then cool slightly.","Combine with tomato, cucumber, parsley and mint.","Dress generously with lemon and season to taste."],
    nutrition: { energyKcal: 500, proteinG: 24, carbohydrateG: 94, fatG: 4, fibreG: 20 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 4, batch: 4, leftovers: 4, portable: 4, flavour: ["lemon","herbal","earthy"], novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "se_asian_mango_tofu_rice_noodle_salad", title: "Mango, Tofu & Rice Noodle Salad", cuisine: "Southeast Asian", difficulty: 2,
    techniques: ["pan-searing", "cold-assembly"], prep: 15, active: 15,
    ingredients: [ing("tofu_firm",280,"g","cubed"),ing("rice_noodles",150,"g"),ing("mango",1,"piece","sliced"),ing("cucumber",0.5,"piece","sliced"),ing("cabbage",120,"g","shredded"),ing("lime",1,"piece"),ing("coriander",15,"g"),ing("soy_sauce",1,"tbsp")],
    steps: ["Cook rice noodles, rinse cool and drain thoroughly.","Brown tofu until crisp at the edges.","Toss noodles with mango, cucumber, cabbage, lime and coriander; top with tofu and soy sauce."],
    nutrition: { energyKcal: 550, proteinG: 27, carbohydrateG: 86, fatG: 14, fibreG: 8 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","gluten"], costTier: 2, mealPrep: 3, leftovers: 2, portable: 4, flavour: ["fruity","lime","fresh"], novelty: 3, mainProtein: "soy"
  }),
  recipe({
    id: "latin_pinto_bean_tomato_rice_skillet", title: "Pinto Bean, Tomato & Pepper Rice Skillet", cuisine: "Latin American", difficulty: 1,
    techniques: ["one-pan-simmering"], prep: 10, active: 25,
    ingredients: [ing("pinto_beans",320,"g","drained"),ing("rice",150,"g"),ing("canned_tomato",250,"g"),ing("bell_pepper",1,"piece"),ing("onion",1,"small"),ing("cumin",1,"tsp"),ing("smoked_paprika",1,"tsp")],
    steps: ["Soften onion and pepper, then add cumin and paprika.","Stir in rice, tomato and enough water to cook the rice covered.","Fold in pinto beans for the final minutes and rest before serving."],
    nutrition: { energyKcal: 560, proteinG: 21, carbohydrateG: 105, fatG: 6, fibreG: 16 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["smoky","tomato","cumin"], mainProtein: "legume"
  }),
  recipe({
    id: "east_asian_chicken_edamame_noodles", title: "Chicken, Edamame & Cabbage Noodles", cuisine: "East Asian", difficulty: 2,
    techniques: ["stir-frying"], prep: 12, active: 18,
    ingredients: [ing("chicken_breast",300,"g","thin strips"),ing("edamame",160,"g"),ing("noodles",160,"g"),ing("cabbage",150,"g","shredded"),ing("spring_onion",2,"pieces","sliced"),ing("soy_sauce",1.5,"tbsp"),ing("fresh_ginger",12,"g","grated")],
    steps: ["Cook noodles and drain.","Stir-fry chicken until nearly cooked, then add ginger, edamame and cabbage.","Toss in noodles, soy sauce and spring onion until hot and evenly coated."],
    nutrition: { energyKcal: 610, proteinG: 55, carbohydrateG: 66, fatG: 14, fibreG: 9 }, allergens: ["soy","gluten"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["savory","ginger"], mainProtein: "poultry_soy"
  }),
  recipe({
    id: "middle_eastern_turkey_bulgur_pepper_bowl", title: "Cumin Turkey, Bulgur & Pepper Bowl", cuisine: "Middle Eastern", difficulty: 2,
    techniques: ["browning", "simmering"], prep: 10, active: 22,
    ingredients: [ing("turkey_mince",300,"g"),ing("bulgur",140,"g"),ing("bell_pepper",1,"piece","diced"),ing("tomato",2,"pieces","chopped"),ing("onion",1,"small"),ing("cumin",1.5,"tsp"),ing("parsley",15,"g")],
    steps: ["Cook bulgur until tender.","Brown turkey with onion and cumin, then add pepper and tomato until softened.","Serve over bulgur and finish with parsley."],
    nutrition: { energyKcal: 590, proteinG: 47, carbohydrateG: 65, fatG: 16, fibreG: 10 }, allergens: ["gluten"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["cumin","savory","herbal"], mainProtein: "poultry"
  }),
  recipe({
    id: "italian_turkey_white_bean_tomato_pot", title: "Turkey, White Bean & Tomato Pot", cuisine: "Italian", difficulty: 1,
    techniques: ["browning", "simmering"], prep: 10, active: 23,
    ingredients: [ing("turkey_mince",280,"g"),ing("white_beans",300,"g","drained"),ing("canned_tomato",300,"g"),ing("carrot",1,"piece","diced"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("basil",10,"g")],
    steps: ["Brown turkey with onion and carrot.","Add garlic, tomato and a splash of water; simmer until rich.","Fold in white beans to heat through and finish with basil."],
    nutrition: { energyKcal: 520, proteinG: 48, carbohydrateG: 44, fatG: 15, fibreG: 13 }, costTier: 2, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["tomato","herbal","savory"], mainProtein: "poultry_legume"
  }),
  recipe({
    id: "med_quinoa_egg_spinach_bowl", title: "Quinoa, Egg & Spinach Bowl", cuisine: "Mediterranean", difficulty: 1,
    techniques: ["simmering", "egg-cooking"], prep: 8, active: 18,
    ingredients: [ing("quinoa",140,"g"),ing("eggs",4,"pieces"),ing("spinach",120,"g"),ing("cherry_tomato",180,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Cook quinoa until tender.","Cook eggs to your preferred doneness and wilt spinach briefly.","Assemble quinoa, spinach and tomato, top with eggs, and finish with lemon and olive oil."],
    nutrition: { energyKcal: 520, proteinG: 28, carbohydrateG: 55, fatG: 22, fibreG: 9 }, dietary: ["unrestricted","vegetarian"], allergens: ["egg"], costTier: 2, mealPrep: 3, leftovers: 2, portable: 3, flavour: ["lemon","savory","fresh"], mainProtein: "egg"
  }),
  recipe({
    id: "spanish_chickpea_potato_spinach_pot", title: "Chickpea, Potato & Spinach Paprika Pot", cuisine: "Spanish", difficulty: 1,
    techniques: ["simmering"], prep: 10, active: 25,
    ingredients: [ing("chickpeas",320,"g","drained"),ing("potato",350,"g","small chunks"),ing("spinach",120,"g"),ing("canned_tomato",220,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("smoked_paprika",1,"tsp")],
    steps: ["Soften onion and garlic with paprika.","Add potato, tomato and enough water to simmer until the potato is tender.","Fold in chickpeas and spinach and cook until hot and lightly thickened."],
    nutrition: { energyKcal: 500, proteinG: 20, carbohydrateG: 86, fatG: 8, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["smoky","tomato","earthy"], mainProtein: "legume"
  }),
  recipe({
    id: "canarian_hake_sweet_potato_tomato", title: "Hake, Sweet Potato & Tomato Pan", cuisine: "Canarian", region: "Canary Islands-inspired", difficulty: 2,
    techniques: ["simmering", "gentle-poaching"], prep: 10, active: 24,
    ingredients: [ing("hake",320,"g"),ing("sweet_potato",350,"g","small chunks"),ing("tomato",3,"pieces","chopped"),ing("bell_pepper",1,"piece"),ing("garlic",2,"cloves"),ing("smoked_paprika",0.5,"tsp"),ing("lemon",1,"piece")],
    steps: ["Cook sweet potato and pepper with a splash of water until nearly tender.","Add tomato, garlic and paprika and simmer until saucy.","Nestle in hake, cover and cook gently until flaky; finish with lemon."],
    nutrition: { energyKcal: 480, proteinG: 41, carbohydrateG: 52, fatG: 10, fibreG: 9 }, allergens: ["fish"], costTier: 2, mealPrep: 2, leftovers: 2, portable: 2, flavour: ["tomato","smoky","lemon"], mainProtein: "fish"
  }),
  recipe({
    id: "east_asian_mushroom_pea_miso_rice", title: "Mushroom, Pea & Miso Rice Bowl", cuisine: "East Asian", difficulty: 1,
    techniques: ["pan-searing", "glazing"], prep: 10, active: 20,
    ingredients: [ing("mushroom",250,"g","sliced"),ing("peas",180,"g"),ing("brown_rice",140,"g"),ing("miso",1.5,"tbsp"),ing("spring_onion",2,"pieces"),ing("rice_vinegar",1,"tbsp")],
    steps: ["Cook brown rice.","Sear mushrooms until deeply browned and add peas.","Loosen miso with water and rice vinegar, glaze the vegetables, and serve over rice with spring onion."],
    nutrition: { energyKcal: 470, proteinG: 18, carbohydrateG: 81, fatG: 8, fibreG: 11 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy"], costTier: 1, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["umami","savory","tangy"], novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "med_pumpkin_white_bean_barley_stew", title: "Pumpkin, White Bean & Barley Stew", cuisine: "Mediterranean", difficulty: 1,
    techniques: ["simmering"], prep: 12, active: 28,
    ingredients: [ing("pumpkin",400,"g","small cubes"),ing("white_beans",300,"g","drained"),ing("barley",120,"g"),ing("canned_tomato",250,"g"),ing("celery",1,"piece","diced"),ing("onion",1,"small"),ing("thyme",1,"tsp")],
    steps: ["Soften onion and celery, then add tomato, pumpkin and barley.","Add water and simmer until barley and pumpkin are tender.","Fold in white beans and thyme and cook until thick and cohesive."],
    nutrition: { energyKcal: 500, proteinG: 20, carbohydrateG: 96, fatG: 5, fibreG: 19 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["earthy","tomato","herbal"], novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "italian_mushroom_pea_orzo", title: "Mushroom, Pea & Parmesan Orzo", cuisine: "Italian", difficulty: 2,
    techniques: ["pan-searing", "absorption-cooking"], prep: 10, active: 22,
    ingredients: [ing("orzo",160,"g"),ing("mushroom",250,"g","sliced"),ing("peas",160,"g"),ing("onion",0.5,"piece"),ing("garlic",1,"clove"),ing("parmesan",30,"g"),ing("lemon",0.5,"piece")],
    steps: ["Brown mushrooms well and set aside.","Soften onion and garlic, add orzo and cook with water until creamy but distinct.","Fold in peas, mushrooms and Parmesan and finish with lemon."],
    nutrition: { energyKcal: 540, proteinG: 24, carbohydrateG: 82, fatG: 13, fibreG: 10 }, dietary: ["unrestricted","vegetarian"], allergens: ["gluten","milk"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["umami","creamy","lemon"], learning: 2, mainProtein: "legume_dairy"
  })
];
