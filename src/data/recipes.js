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
    source: "Culinary Recommender project-authored V0 corpus",
    sourceReference: "data/project-authored-v0",
    license: "PROJECT_AUTHORED_UNLICENSED",
    attributionRequirement: "None beyond repository provenance while no public content licence is granted.",
    originalAdaptedStatus: "original_v0",
    ingestionVersion: "0.2.0"
  },
  culinary: { cuisine, region, mealTypes, techniques, difficulty, techniqueComplexity: difficulty, failureRisk },
  time: { prepMinutes: prep, activeMinutes: active, passiveMinutes: passive, totalMinutes: prep + active + passive },
  ingredients,
  instructions: steps.map((text, index) => ({ order: index + 1, stage: `Step ${index + 1}`, text, techniqueNote: null })),
  equipment: { required: equipment, optional: [], substitutable: [] },
  serving: { servings, scalable: true, minimumSensibleBatch: servings },
  nutrition: {
    perServing: nutrition,
    provenance: "Project-authored rough estimate for V0 ranking/display; not laboratory or live database data.",
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

export const RECIPES = [
  recipe({
    id: "med_chickpea_spinach_skillet", title: "Smoky Chickpea & Spinach Skillet", cuisine: "Mediterranean", region: "Spain-inspired", difficulty: 1,
    prep: 8, active: 17, ingredients: [ing("olive_oil",1,"tbsp"),ing("onion",1,"small","diced"),ing("garlic",2,"cloves","sliced"),ing("chickpeas",400,"g","drained"),ing("canned_tomato",250,"g"),ing("spinach",120,"g"),ing("smoked_paprika",1,"tsp"),ing("cumin",0.5,"tsp"),ing("lemon",0.5,"piece")],
    steps: ["Soften onion in olive oil, then add garlic, paprika and cumin.","Add chickpeas and tomato; simmer until thickened.","Fold in spinach until just wilted and finish with lemon."],
    nutrition: { energyKcal: 410, proteinG: 20, carbohydrateG: 57, fatG: 11, fibreG: 15 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 3, flavour: ["smoky","tomato","lemon"], novelty: 1, mainProtein: "legume"
  }),
  recipe({
    id: "med_lentil_feta_salad", title: "Lentil, Pepper & Feta Lunch Salad", cuisine: "Mediterranean", difficulty: 1,
    prep: 15, active: 5, ingredients: [ing("lentils",300,"g","cooked"),ing("bell_pepper",1,"piece","diced"),ing("tomato",2,"pieces","chopped"),ing("feta",90,"g","crumbled"),ing("parsley",20,"g","chopped"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Combine lentils, pepper, tomato and parsley.","Dress with lemon and olive oil.","Fold in feta immediately before serving."],
    nutrition: { energyKcal: 430, proteinG: 24, carbohydrateG: 48, fatG: 17, fibreG: 14 }, dietary: ["unrestricted","vegetarian"], allergens: ["milk"], costTier: 2, mealPrep: 4, batch: 3, freezer: 1, leftovers: 4, portable: 4, flavour: ["fresh","salty","lemon"], novelty: 1, mainProtein: "legume_dairy"
  }),
  recipe({
    id: "italian_red_lentil_pasta", title: "Red Lentil Tomato Pasta", cuisine: "Italian", difficulty: 1,
    prep: 8, active: 22, ingredients: [ing("wholewheat_pasta",160,"g"),ing("red_lentils",120,"g"),ing("canned_tomato",300,"g"),ing("onion",1,"small","diced"),ing("garlic",2,"cloves"),ing("olive_oil",1,"tbsp"),ing("basil",10,"g")],
    steps: ["Cook pasta until just tender.","Meanwhile soften onion and garlic, then simmer tomato and red lentils with water until the lentils collapse.","Toss pasta through the sauce and finish with basil."],
    nutrition: { energyKcal: 520, proteinG: 27, carbohydrateG: 87, fatG: 8, fibreG: 18 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 3, batch: 4, freezer: 3, leftovers: 4, portable: 3, flavour: ["tomato","herbal"], mainProtein: "legume"
  }),
  recipe({
    id: "med_white_bean_kale_stew", title: "White Bean, Tomato & Kale Stew", cuisine: "Mediterranean", difficulty: 1,
    prep: 10, active: 20, ingredients: [ing("white_beans",400,"g","drained"),ing("canned_tomato",300,"g"),ing("kale",150,"g","chopped"),ing("onion",1,"piece"),ing("garlic",2,"cloves"),ing("olive_oil",1,"tbsp"),ing("smoked_paprika",1,"tsp")],
    steps: ["Soften onion and garlic with olive oil.","Add tomato, beans and paprika; simmer for 12 minutes.","Add kale and cook until tender, loosening with water if needed."],
    nutrition: { energyKcal: 390, proteinG: 21, carbohydrateG: 55, fatG: 10, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 3, flavour: ["savory","smoky"], mainProtein: "legume"
  }),
  recipe({
    id: "spanish_pepper_cottage_frittata", title: "Pepper, Spinach & Cottage Cheese Frittata", cuisine: "Spanish", difficulty: 2,
    prep: 10, active: 18, ingredients: [ing("eggs",5,"pieces"),ing("cottage_cheese",150,"g"),ing("bell_pepper",1,"piece","sliced"),ing("spinach",100,"g"),ing("onion",0.5,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Soften pepper and onion in an oven-safe pan, then wilt the spinach.","Whisk eggs with cottage cheese and pour over the vegetables.","Cook gently until mostly set, then finish under a grill or covered on low heat."],
    equipment: ["hob","oven_or_lid","oven_safe_pan"], nutrition: { energyKcal: 430, proteinG: 36, carbohydrateG: 15, fatG: 25, fibreG: 4 }, dietary: ["unrestricted","vegetarian"], allergens: ["egg","milk"], costTier: 2, mealPrep: 3, batch: 3, leftovers: 3, portable: 4, flavour: ["savory","sweet_pepper"], mainProtein: "egg_dairy"
  }),
  recipe({
    id: "med_quinoa_chickpea_bowl", title: "Lemon Chickpea Quinoa Bowl", cuisine: "Mediterranean", difficulty: 1,
    prep: 12, active: 18, ingredients: [ing("quinoa",140,"g"),ing("chickpeas",300,"g","drained"),ing("tomato",2,"pieces"),ing("courgette",1,"piece"),ing("parsley",15,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Cook quinoa until tender and let steam dry.","Pan-sear courgette while the quinoa cooks.","Combine quinoa, chickpeas, tomato and courgette; dress with lemon, parsley and oil."],
    nutrition: { energyKcal: 500, proteinG: 22, carbohydrateG: 75, fatG: 13, fibreG: 14 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["lemon","fresh","toasty"], novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "east_asian_tofu_edamame_rice", title: "Ginger-Style Tofu & Edamame Rice Bowl", cuisine: "East Asian", difficulty: 2,
    prep: 12, active: 20, ingredients: [ing("tofu_firm",300,"g","cubed"),ing("edamame",180,"g"),ing("brown_rice",140,"g"),ing("cabbage",160,"g","shredded"),ing("soy_sauce",2,"tbsp"),ing("sesame_oil",1,"tsp"),ing("lime",0.5,"piece")],
    steps: ["Cook brown rice.","Brown tofu well in a hot pan, then add edamame and cabbage.","Season with soy sauce and sesame oil and serve over rice with lime."],
    nutrition: { energyKcal: 590, proteinG: 36, carbohydrateG: 70, fatG: 21, fibreG: 12 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","sesame","gluten"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["savory","sesame","lime"], novelty: 2, mainProtein: "soy"
  }),
  recipe({
    id: "se_asian_peanut_tofu_noodles", title: "Peanut-Lime Tofu Noodles", cuisine: "Southeast Asian", difficulty: 2,
    prep: 12, active: 18, ingredients: [ing("tofu_firm",280,"g","cubed"),ing("noodles",160,"g"),ing("cabbage",140,"g","shredded"),ing("carrot",1,"piece","julienned"),ing("peanut_butter",2,"tbsp"),ing("soy_sauce",1.5,"tbsp"),ing("lime",1,"piece"),ing("chilli",0.5,"tsp")],
    steps: ["Cook noodles and reserve a splash of cooking water.","Brown tofu, then add cabbage and carrot for a brief stir-fry.","Mix peanut butter, soy, lime and cooking water into a sauce; toss through noodles and tofu."],
    nutrition: { energyKcal: 610, proteinG: 32, carbohydrateG: 73, fatG: 24, fibreG: 10 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","peanut","gluten"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["nutty","lime","spicy"], spice: 2, novelty: 3, mainProtein: "soy"
  }),
  recipe({
    id: "indian_red_lentil_spinach_dal", title: "Red Lentil & Spinach Dal", cuisine: "Indian", difficulty: 1,
    prep: 8, active: 24, ingredients: [ing("red_lentils",180,"g"),ing("spinach",120,"g"),ing("canned_tomato",200,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("cumin",1,"tsp"),ing("curry_powder",2,"tsp"),ing("rice",120,"g")],
    steps: ["Cook rice separately.","Soften onion and garlic with spices, then add tomato, lentils and water.","Simmer until creamy, fold in spinach and serve with rice."],
    nutrition: { energyKcal: 560, proteinG: 25, carbohydrateG: 101, fatG: 6, fibreG: 18 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["warm_spice","earthy"], spice: 2, novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "middle_eastern_chickpea_tahini_plate", title: "Warm Chickpea, Aubergine & Tahini Plate", cuisine: "Middle Eastern", difficulty: 2,
    prep: 12, active: 23, ingredients: [ing("chickpeas",350,"g","drained"),ing("aubergine",1,"piece","cubed"),ing("tomato",2,"pieces"),ing("tahini",2,"tbsp"),ing("lemon",1,"piece"),ing("cumin",1,"tsp"),ing("parsley",15,"g")],
    steps: ["Brown aubergine until tender and deeply coloured.","Warm chickpeas with cumin and chopped tomato.","Loosen tahini with lemon and water, then spoon over the chickpeas and aubergine."],
    nutrition: { energyKcal: 500, proteinG: 21, carbohydrateG: 59, fatG: 22, fibreG: 16 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["sesame"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["nutty","lemon","earthy"], novelty: 3, mainProtein: "legume"
  }),
  recipe({
    id: "latin_black_bean_sweet_potato_tacos", title: "Black Bean & Sweet Potato Tacos", cuisine: "Latin American", difficulty: 2,
    prep: 12, active: 22, ingredients: [ing("black_beans",320,"g","drained"),ing("sweet_potato",300,"g","small dice"),ing("corn_tortilla",6,"pieces"),ing("cabbage",120,"g","shredded"),ing("lime",1,"piece"),ing("cumin",1,"tsp"),ing("smoked_paprika",1,"tsp"),ing("avocado",0.5,"piece")],
    steps: ["Pan-roast the sweet potato with cumin and paprika until tender.","Warm black beans and tortillas.","Fill tortillas with beans, sweet potato and cabbage; finish with lime and avocado."],
    nutrition: { energyKcal: 590, proteinG: 22, carbohydrateG: 100, fatG: 15, fibreG: 22 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 2, flavour: ["smoky","lime","creamy"], novelty: 2, mainProtein: "legume"
  }),
  recipe({
    id: "med_egg_chickpea_flatbread", title: "Egg, Chickpea & Tomato Flatbread", cuisine: "Mediterranean", difficulty: 1,
    prep: 10, active: 15, ingredients: [ing("eggs",4,"pieces"),ing("chickpeas",200,"g","drained"),ing("tomato",2,"pieces"),ing("bread",4,"slices"),ing("greek_yogurt",100,"g"),ing("smoked_paprika",0.5,"tsp")],
    steps: ["Warm chickpeas with tomato and paprika until juicy.","Cook eggs to your preferred doneness.","Spread yogurt over toasted bread and top with chickpeas and eggs."],
    nutrition: { energyKcal: 510, proteinG: 31, carbohydrateG: 58, fatG: 18, fibreG: 10 }, dietary: ["unrestricted","vegetarian"], allergens: ["egg","milk","gluten"], costTier: 2, mealPrep: 2, leftovers: 2, portable: 2, flavour: ["savory","smoky","creamy"], mainProtein: "egg_legume"
  }),
  recipe({
    id: "spanish_chicken_pepper_rice", title: "Paprika Chicken & Pepper Rice", cuisine: "Spanish", difficulty: 2,
    prep: 10, active: 25, ingredients: [ing("chicken_breast",320,"g","bite-size"),ing("rice",150,"g"),ing("bell_pepper",1,"piece"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("canned_tomato",180,"g"),ing("smoked_paprika",1,"tsp")],
    steps: ["Brown chicken and set aside.","Soften onion and pepper, then add garlic, paprika, rice and tomato.","Add water, return chicken and cook covered until the rice is tender."],
    nutrition: { energyKcal: 590, proteinG: 48, carbohydrateG: 72, fatG: 11, fibreG: 6 }, dietary: ["unrestricted"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["smoky","savory"], mainProtein: "poultry"
  }),
  recipe({
    id: "med_lemon_chicken_couscous", title: "Lemon Chicken Couscous Bowl", cuisine: "Mediterranean", difficulty: 1,
    prep: 12, active: 18, ingredients: [ing("chicken_breast",300,"g","strips"),ing("couscous",150,"g"),ing("courgette",1,"piece"),ing("tomato",2,"pieces"),ing("lemon",1,"piece"),ing("parsley",15,"g"),ing("olive_oil",1,"tbsp")],
    steps: ["Cover couscous with hot water and leave to steam.","Sear chicken and courgette until cooked through.","Fluff couscous with tomato, parsley, lemon and oil; top with chicken."],
    nutrition: { energyKcal: 560, proteinG: 46, carbohydrateG: 67, fatG: 12, fibreG: 7 }, dietary: ["unrestricted"], allergens: ["gluten"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["lemon","herbal"], mainProtein: "poultry"
  }),
  recipe({
    id: "italian_turkey_tomato_pasta", title: "Turkey & Tomato Weeknight Pasta", cuisine: "Italian", difficulty: 1,
    prep: 8, active: 22, ingredients: [ing("turkey_mince",300,"g"),ing("wholewheat_pasta",160,"g"),ing("canned_tomato",300,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("basil",10,"g"),ing("parmesan",30,"g")],
    steps: ["Cook pasta.","Brown turkey with onion and garlic, then add tomato and simmer.","Toss with pasta, basil and Parmesan."],
    nutrition: { energyKcal: 620, proteinG: 50, carbohydrateG: 73, fatG: 16, fibreG: 11 }, dietary: ["unrestricted"], allergens: ["gluten","milk"], costTier: 2, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["tomato","savory"], mainProtein: "poultry"
  }),
  recipe({
    id: "east_asian_salmon_cabbage_rice", title: "Soy-Lime Salmon, Cabbage & Rice", cuisine: "East Asian", difficulty: 2,
    prep: 10, active: 20, ingredients: [ing("salmon",300,"g"),ing("rice",140,"g"),ing("cabbage",180,"g"),ing("soy_sauce",1.5,"tbsp"),ing("lime",1,"piece"),ing("sesame_oil",1,"tsp")],
    steps: ["Cook rice.","Sear salmon until just cooked and rest it.","Stir-fry cabbage briefly with soy and sesame; serve with rice, salmon and lime."],
    nutrition: { energyKcal: 650, proteinG: 42, carbohydrateG: 65, fatG: 24, fibreG: 6 }, dietary: ["unrestricted"], allergens: ["fish","soy","gluten","sesame"], costTier: 3, mealPrep: 2, leftovers: 2, portable: 2, flavour: ["savory","lime","sesame"], mainProtein: "fish"
  }),
  recipe({
    id: "canarian_tuna_potato_salad", title: "Tuna, Potato & Pepper Salad", cuisine: "Canarian", region: "Canary Islands-inspired", difficulty: 1,
    prep: 12, active: 18, ingredients: [ing("tuna",240,"g","drained"),ing("potato",400,"g","cubed"),ing("bell_pepper",1,"piece"),ing("tomato",2,"pieces"),ing("onion",0.5,"piece"),ing("olive_oil",1,"tbsp"),ing("lemon",1,"piece")],
    steps: ["Boil potatoes until tender and drain well.","Combine potato with pepper, tomato and onion.","Fold through tuna and dress with olive oil and lemon."],
    nutrition: { energyKcal: 500, proteinG: 38, carbohydrateG: 55, fatG: 14, fibreG: 8 }, dietary: ["unrestricted"], allergens: ["fish"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["fresh","lemon","savory"], mainProtein: "fish"
  }),
  recipe({
    id: "indian_chicken_spinach_curry", title: "Quick Chicken & Spinach Curry", cuisine: "Indian", difficulty: 2,
    prep: 10, active: 23, ingredients: [ing("chicken_breast",320,"g"),ing("spinach",150,"g"),ing("canned_tomato",220,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("curry_powder",2,"tsp"),ing("greek_yogurt",100,"g"),ing("rice",120,"g")],
    steps: ["Cook rice.","Brown chicken with onion, garlic and curry powder; add tomato and simmer until cooked through.","Stir in spinach, then remove from heat and fold in yogurt."],
    nutrition: { energyKcal: 590, proteinG: 50, carbohydrateG: 66, fatG: 13, fibreG: 7 }, dietary: ["unrestricted"], allergens: ["milk"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["warm_spice","creamy"], spice: 2, mainProtein: "poultry"
  }),
  recipe({
    id: "latin_beef_black_bean_bowl", title: "Beef, Black Bean & Pepper Bowl", cuisine: "Latin American", difficulty: 2,
    prep: 10, active: 22, ingredients: [ing("beef_mince",280,"g"),ing("black_beans",240,"g","drained"),ing("rice",130,"g"),ing("bell_pepper",1,"piece"),ing("tomato",2,"pieces"),ing("cumin",1,"tsp"),ing("lime",1,"piece")],
    steps: ["Cook rice.","Brown beef with cumin and pepper, then add black beans and tomato.","Serve over rice and finish with lime."],
    nutrition: { energyKcal: 690, proteinG: 46, carbohydrateG: 77, fatG: 22, fibreG: 13 }, dietary: ["unrestricted"], costTier: 3, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["savory","lime","cumin"], mainProtein: "beef"
  }),
  recipe({
    id: "med_prawn_tomato_couscous", title: "Garlic Prawn & Tomato Couscous", cuisine: "Mediterranean", difficulty: 2,
    prep: 10, active: 15, ingredients: [ing("prawns",300,"g"),ing("couscous",150,"g"),ing("tomato",3,"pieces"),ing("garlic",2,"cloves"),ing("lemon",1,"piece"),ing("parsley",15,"g"),ing("olive_oil",1,"tbsp")],
    steps: ["Steam couscous with hot water.","Sauté garlic briefly, add prawns and cook until opaque; add tomato for the final few minutes.","Fold parsley and lemon through couscous and top with prawns."],
    nutrition: { energyKcal: 530, proteinG: 40, carbohydrateG: 67, fatG: 11, fibreG: 6 }, dietary: ["unrestricted"], allergens: ["crustacean","gluten"], costTier: 3, mealPrep: 2, leftovers: 2, portable: 2, flavour: ["garlic","lemon","seafood"], mainProtein: "shellfish"
  }),
  recipe({
    id: "middle_eastern_chicken_tahini_bowl", title: "Cumin Chicken & Tahini Rice Bowl", cuisine: "Middle Eastern", difficulty: 2,
    prep: 12, active: 22, ingredients: [ing("chicken_breast",300,"g"),ing("brown_rice",140,"g"),ing("cabbage",140,"g"),ing("tomato",2,"pieces"),ing("tahini",2,"tbsp"),ing("lemon",1,"piece"),ing("cumin",1,"tsp")],
    steps: ["Cook brown rice.","Season chicken with cumin and sear until cooked through.","Loosen tahini with lemon and water; assemble with rice, cabbage, tomato and chicken."],
    nutrition: { energyKcal: 650, proteinG: 47, carbohydrateG: 69, fatG: 22, fibreG: 9 }, dietary: ["unrestricted"], allergens: ["sesame"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["nutty","lemon","cumin"], mainProtein: "poultry"
  }),
  recipe({
    id: "spanish_salmon_green_beans_potato", title: "Paprika Salmon with Green Beans & Potatoes", cuisine: "Spanish", difficulty: 2,
    prep: 10, active: 25, ingredients: [ing("salmon",300,"g"),ing("potato",350,"g"),ing("green_beans",220,"g"),ing("smoked_paprika",1,"tsp"),ing("garlic",2,"cloves"),ing("lemon",1,"piece")],
    steps: ["Boil potatoes until nearly tender; add green beans for the final minutes.","Season salmon with paprika and sear until just cooked.","Toss potatoes and beans with garlic and lemon and serve with salmon."],
    nutrition: { energyKcal: 610, proteinG: 41, carbohydrateG: 48, fatG: 27, fibreG: 9 }, dietary: ["unrestricted"], allergens: ["fish"], costTier: 3, mealPrep: 2, leftovers: 2, portable: 2, flavour: ["smoky","lemon"], mainProtein: "fish"
  }),
  recipe({
    id: "med_greek_yogurt_chickpea_wrap", title: "Herby Chickpea Yogurt Wrap", cuisine: "Mediterranean", difficulty: 1,
    prep: 15, active: 5, ingredients: [ing("chickpeas",300,"g","drained"),ing("greek_yogurt",150,"g"),ing("tortilla",4,"pieces"),ing("tomato",2,"pieces"),ing("cabbage",120,"g"),ing("lemon",1,"piece"),ing("parsley",15,"g")],
    steps: ["Lightly crush chickpeas with yogurt, lemon and parsley.","Warm wraps briefly.","Fill with chickpea mixture, tomato and cabbage."],
    nutrition: { energyKcal: 520, proteinG: 26, carbohydrateG: 75, fatG: 13, fibreG: 13 }, dietary: ["unrestricted","vegetarian"], allergens: ["milk","gluten"], costTier: 2, mealPrep: 4, leftovers: 3, portable: 4, flavour: ["creamy","lemon","herbal"], mainProtein: "legume_dairy"
  }),
  recipe({
    id: "east_asian_tuna_edamame_noodles", title: "Tuna & Edamame Noodle Bowl", cuisine: "East Asian", difficulty: 1,
    prep: 10, active: 15, ingredients: [ing("tuna",220,"g","drained"),ing("edamame",160,"g"),ing("noodles",160,"g"),ing("cabbage",120,"g"),ing("soy_sauce",1.5,"tbsp"),ing("lime",1,"piece")],
    steps: ["Cook noodles and edamame.","Toss with cabbage, tuna and soy sauce.","Finish with lime and serve warm or cool."],
    nutrition: { energyKcal: 560, proteinG: 45, carbohydrateG: 66, fatG: 11, fibreG: 10 }, dietary: ["unrestricted"], allergens: ["fish","soy","gluten"], costTier: 2, mealPrep: 4, leftovers: 3, portable: 4, flavour: ["savory","lime"], mainProtein: "fish_soy"
  }),
  recipe({
    id: "indian_tempeh_coconut_curry", title: "Tempeh, Broccoli & Coconut Curry", cuisine: "Indian", difficulty: 2,
    prep: 12, active: 23, ingredients: [ing("tempeh",280,"g"),ing("broccoli",250,"g"),ing("coconut_milk",250,"ml"),ing("canned_tomato",180,"g"),ing("curry_powder",2,"tsp"),ing("rice",120,"g"),ing("lime",1,"piece")],
    steps: ["Cook rice.","Brown tempeh, add curry powder, tomato, coconut milk and broccoli.","Simmer until broccoli is tender and finish with lime."],
    nutrition: { energyKcal: 690, proteinG: 34, carbohydrateG: 72, fatG: 31, fibreG: 13 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy"], costTier: 3, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["creamy","warm_spice","lime"], spice: 2, novelty: 3, mainProtein: "soy"
  })
];

export const recipeById = id => RECIPES.find(recipeItem => recipeItem.id === id) || null;
