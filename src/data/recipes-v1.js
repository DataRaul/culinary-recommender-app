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
    source: "Culinary Recommender project-authored V1 corpus",
    sourceReference: "data/project-authored-v1",
    license: "PROJECT_AUTHORED_UNLICENSED",
    attributionRequirement: "None beyond repository provenance while no public content licence is granted.",
    originalAdaptedStatus: "original_v1",
    ingestionVersion: "1.0.0"
  },
  culinary: { cuisine, region, mealTypes, techniques, difficulty, techniqueComplexity: difficulty, failureRisk },
  time: { prepMinutes: prep, activeMinutes: active, passiveMinutes: passive, totalMinutes: prep + active + passive },
  ingredients,
  instructions: steps.map((text, index) => ({ order: index + 1, stage: `Step ${index + 1}`, text, techniqueNote: null })),
  equipment: { required: equipment, optional: [], substitutable: [] },
  serving: { servings, scalable: true, minimumSensibleBatch: servings },
  nutrition: {
    perServing: nutrition,
    provenance: "Project-authored rough estimate for V1 ranking/display; not laboratory or live database data.",
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

export const EXPANDED_RECIPES = [
  recipe({
    id: "spanish_potato_onion_tortilla", title: "Potato & Onion Tortilla", cuisine: "Spanish", difficulty: 2,
    techniques: ["pan-cooking", "egg-setting"], prep: 10, active: 30, ingredients: [ing("potato",450,"g","thinly sliced"),ing("onion",1,"piece","thinly sliced"),ing("eggs",6,"pieces"),ing("olive_oil",2,"tbsp"),ing("salt",0.5,"tsp")],
    steps: ["Cook potato and onion gently in olive oil until fully tender without hard browning.","Beat eggs with salt, fold in the warm potato mixture and rest for two minutes.","Cook in a non-stick pan until nearly set, then turn carefully and finish the second side."],
    nutrition: { energyKcal: 460, proteinG: 23, carbohydrateG: 43, fatG: 22, fibreG: 6 }, dietary: ["unrestricted","vegetarian"], allergens: ["egg"], costTier: 1, mealPrep: 3, batch: 3, leftovers: 4, portable: 4, flavour: ["savory","sweet_onion"], familiarity: 1, learning: 2, mainProtein: "egg"
  }),
  recipe({
    id: "spanish_lentil_vegetable_pot", title: "Everyday Lentil & Vegetable Pot", cuisine: "Spanish", difficulty: 1,
    techniques: ["simmering"], prep: 12, active: 28, ingredients: [ing("lentils",220,"g"),ing("carrot",2,"pieces","diced"),ing("bell_pepper",1,"piece","diced"),ing("onion",1,"piece"),ing("garlic",2,"cloves"),ing("canned_tomato",220,"g"),ing("smoked_paprika",1,"tsp")],
    steps: ["Soften onion, carrot and pepper, then add garlic and paprika.","Add lentils, tomato and water to cover generously.","Simmer until lentils are tender and the broth is lightly thickened."],
    nutrition: { energyKcal: 430, proteinG: 25, carbohydrateG: 72, fatG: 7, fibreG: 21 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["smoky","earthy"], mainProtein: "legume"
  }),
  recipe({
    id: "spanish_hake_tomato_potato", title: "Hake with Tomato, Pepper & Potatoes", cuisine: "Spanish", difficulty: 2,
    techniques: ["simmering", "gentle-poaching"], prep: 12, active: 25, ingredients: [ing("hake",320,"g"),ing("potato",350,"g","small chunks"),ing("bell_pepper",1,"piece"),ing("canned_tomato",260,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("smoked_paprika",0.5,"tsp")],
    steps: ["Soften onion and pepper, then add garlic, paprika and tomato.","Add potato and enough water to simmer until almost tender.","Nestle in hake and cook gently until it flakes and remains moist."],
    nutrition: { energyKcal: 500, proteinG: 42, carbohydrateG: 51, fatG: 12, fibreG: 8 }, allergens: ["fish"], costTier: 2, mealPrep: 2, leftovers: 2, flavour: ["tomato","smoky","seafood"], learning: 2, mainProtein: "fish"
  }),
  recipe({
    id: "canarian_sardine_potato_bowl", title: "Sardine, Potato & Tomato Bowl", cuisine: "Canarian", region: "Canary Islands-inspired", difficulty: 1,
    prep: 10, active: 18, ingredients: [ing("sardines",180,"g","drained"),ing("potato",380,"g","cubed"),ing("tomato",2,"pieces"),ing("red_onion",0.5,"piece"),ing("parsley",15,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Boil potato until tender and steam dry.","Combine warm potato with tomato, red onion and parsley.","Top with sardines and dress with lemon and olive oil."],
    nutrition: { energyKcal: 520, proteinG: 34, carbohydrateG: 49, fatG: 22, fibreG: 7 }, allergens: ["fish"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["salty","lemon","fresh"], mainProtein: "fish"
  }),
  recipe({
    id: "canarian_chicken_sweet_potato_pepper", title: "Paprika Chicken, Sweet Potato & Pepper", cuisine: "Canarian", region: "Canary Islands-inspired", difficulty: 1,
    prep: 10, active: 24, ingredients: [ing("chicken_breast",320,"g","cubed"),ing("sweet_potato",360,"g","small cubes"),ing("bell_pepper",1,"piece"),ing("garlic",2,"cloves"),ing("smoked_paprika",1,"tsp"),ing("cumin",0.5,"tsp"),ing("lime",1,"piece")],
    steps: ["Brown sweet potato in a covered pan with a splash of water until nearly tender.","Add chicken, pepper, garlic, paprika and cumin and cook through.","Finish with lime and a pinch of salt."],
    nutrition: { energyKcal: 550, proteinG: 48, carbohydrateG: 58, fatG: 12, fibreG: 10 }, costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["smoky","lime"], mainProtein: "poultry"
  }),
  recipe({
    id: "med_tuna_white_bean_salad", title: "Tuna, White Bean & Tomato Salad", cuisine: "Mediterranean", difficulty: 1,
    prep: 14, active: 3, ingredients: [ing("tuna",220,"g","drained"),ing("white_beans",300,"g","drained"),ing("cherry_tomato",220,"g","halved"),ing("cucumber",0.5,"piece","diced"),ing("red_onion",0.25,"piece"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Rinse and drain the beans well.","Combine beans, tomato, cucumber and red onion.","Fold through tuna and dress with lemon and olive oil."],
    nutrition: { energyKcal: 480, proteinG: 42, carbohydrateG: 42, fatG: 16, fibreG: 13 }, allergens: ["fish"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["fresh","lemon","savory"], mainProtein: "fish_legume"
  }),
  recipe({
    id: "med_chicken_orzo_vegetables", title: "Lemon Chicken & Vegetable Orzo", cuisine: "Mediterranean", difficulty: 2,
    prep: 12, active: 24, ingredients: [ing("chicken_breast",300,"g","small pieces"),ing("orzo",160,"g"),ing("courgette",1,"piece"),ing("cherry_tomato",180,"g"),ing("spinach",100,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Brown chicken and set aside.","Cook orzo with courgette and enough water to keep it loose, stirring occasionally.","Return chicken, fold in tomato and spinach, and finish with lemon."],
    nutrition: { energyKcal: 590, proteinG: 47, carbohydrateG: 70, fatG: 14, fibreG: 8 }, allergens: ["gluten"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["lemon","savory","fresh"], mainProtein: "poultry"
  }),
  recipe({
    id: "med_cauliflower_chickpea_bowl", title: "Cumin Cauliflower & Chickpea Bowl", cuisine: "Mediterranean", difficulty: 1,
    prep: 12, active: 23, ingredients: [ing("cauliflower",420,"g","small florets"),ing("chickpeas",300,"g","drained"),ing("couscous",140,"g"),ing("cumin",1,"tsp"),ing("smoked_paprika",0.5,"tsp"),ing("lemon",1,"piece"),ing("parsley",15,"g")],
    steps: ["Brown cauliflower in a wide pan with cumin and paprika until tender.","Warm chickpeas with the cauliflower while couscous steams.","Serve over couscous with parsley and lemon."],
    nutrition: { energyKcal: 530, proteinG: 22, carbohydrateG: 90, fatG: 10, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["toasty","cumin","lemon"], mainProtein: "legume"
  }),
  recipe({
    id: "med_cod_chickpea_tomato_stew", title: "Cod, Chickpea & Tomato Stew", cuisine: "Mediterranean", difficulty: 2,
    prep: 10, active: 24, ingredients: [ing("cod",300,"g","large pieces"),ing("chickpeas",280,"g","drained"),ing("canned_tomato",300,"g"),ing("spinach",100,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("smoked_paprika",0.5,"tsp")],
    steps: ["Soften onion and garlic, then add paprika and tomato.","Add chickpeas and simmer until the sauce thickens slightly.","Nestle in cod, cook gently until just flaky, then fold in spinach."],
    nutrition: { energyKcal: 470, proteinG: 46, carbohydrateG: 49, fatG: 9, fibreG: 13 }, allergens: ["fish"], costTier: 2, mealPrep: 3, leftovers: 3, flavour: ["tomato","smoky","savory"], mainProtein: "fish_legume"
  }),
  recipe({
    id: "med_cottage_tomato_pasta", title: "Creamy Cottage Cheese Tomato Pasta", cuisine: "Mediterranean", difficulty: 1,
    prep: 8, active: 18, ingredients: [ing("wholewheat_pasta",170,"g"),ing("cottage_cheese",180,"g"),ing("passata",250,"g"),ing("spinach",100,"g"),ing("garlic",1,"clove"),ing("basil",10,"g")],
    steps: ["Cook pasta and reserve a little cooking water.","Warm passata with garlic and wilt in spinach.","Remove from direct heat, fold in cottage cheese, then toss with pasta and enough cooking water to loosen."],
    nutrition: { energyKcal: 570, proteinG: 36, carbohydrateG: 82, fatG: 12, fibreG: 13 }, dietary: ["unrestricted","vegetarian"], allergens: ["gluten","milk"], costTier: 1, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["tomato","creamy","herbal"], mainProtein: "dairy"
  }),
  recipe({
    id: "italian_ricotta_spinach_pasta", title: "Ricotta, Spinach & Lemon Pasta", cuisine: "Italian", difficulty: 1,
    prep: 8, active: 17, ingredients: [ing("pasta",170,"g"),ing("ricotta",180,"g"),ing("spinach",130,"g"),ing("lemon",1,"piece"),ing("parmesan",20,"g"),ing("black_pepper",0.5,"tsp")],
    steps: ["Cook pasta and reserve a cup of cooking water.","Wilt spinach briefly and mix ricotta with lemon and black pepper.","Toss pasta with spinach and ricotta off heat, loosening gradually with cooking water; finish with Parmesan."],
    nutrition: { energyKcal: 600, proteinG: 31, carbohydrateG: 75, fatG: 21, fibreG: 8 }, dietary: ["unrestricted","vegetarian"], allergens: ["gluten","milk"], costTier: 2, mealPrep: 2, leftovers: 2, flavour: ["creamy","lemon","peppery"], mainProtein: "dairy"
  }),
  recipe({
    id: "italian_white_bean_mushroom_orzo", title: "Mushroom & White Bean Orzo", cuisine: "Italian", difficulty: 2,
    prep: 10, active: 24, ingredients: [ing("orzo",160,"g"),ing("white_beans",280,"g","drained"),ing("mushroom",250,"g","sliced"),ing("onion",0.5,"piece"),ing("garlic",2,"cloves"),ing("spinach",90,"g"),ing("parmesan",25,"g")],
    steps: ["Brown mushrooms well before adding onion and garlic.","Add orzo and water gradually, stirring until tender.","Fold in beans and spinach, then finish with Parmesan."],
    nutrition: { energyKcal: 560, proteinG: 27, carbohydrateG: 84, fatG: 13, fibreG: 15 }, dietary: ["unrestricted","vegetarian"], allergens: ["gluten","milk"], costTier: 2, mealPrep: 4, batch: 3, leftovers: 4, portable: 4, flavour: ["savory","earthy","creamy"], learning: 2, mainProtein: "legume_dairy"
  }),
  recipe({
    id: "italian_mushroom_risotto", title: "Mushroom Risotto", cuisine: "Italian", difficulty: 3, failureRisk: "medium",
    techniques: ["toasting", "incremental-liquid", "emulsifying"], prep: 10, active: 32, ingredients: [ing("risotto_rice",170,"g"),ing("mushroom",280,"g","sliced"),ing("onion",0.5,"piece","finely diced"),ing("garlic",1,"clove"),ing("parmesan",35,"g"),ing("butter",15,"g"),ing("black_pepper",0.5,"tsp")],
    steps: ["Brown mushrooms deeply and reserve half for topping.","Soften onion and garlic, add rice and stir until the grains look slightly translucent at the edges.","Add hot water in small additions while stirring until the rice is creamy but still has bite; beat in butter and Parmesan off heat."],
    nutrition: { energyKcal: 590, proteinG: 21, carbohydrateG: 83, fatG: 20, fibreG: 6 }, dietary: ["unrestricted","vegetarian"], allergens: ["milk"], costTier: 2, mealPrep: 1, leftovers: 1, portable: 1, flavour: ["earthy","savory","creamy"], novelty: 2, learning: 4, mainProtein: "dairy"
  }),
  recipe({
    id: "italian_turkey_mushroom_ragu", title: "Turkey & Mushroom Tomato Ragù", cuisine: "Italian", difficulty: 2,
    prep: 12, active: 28, ingredients: [ing("turkey_mince",320,"g"),ing("mushroom",220,"g","finely chopped"),ing("wholewheat_pasta",170,"g"),ing("passata",300,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("oregano",1,"tsp")],
    steps: ["Brown turkey thoroughly and set aside.","Cook mushroom and onion until reduced, then add garlic, oregano and passata.","Return turkey, simmer briefly, and toss with cooked pasta."],
    nutrition: { energyKcal: 630, proteinG: 51, carbohydrateG: 76, fatG: 15, fibreG: 12 }, allergens: ["gluten"], costTier: 2, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["tomato","savory","herbal"], mainProtein: "poultry"
  }),
  recipe({
    id: "indian_chickpea_cauliflower_curry", title: "Chickpea & Cauliflower Curry", cuisine: "Indian", difficulty: 1,
    prep: 10, active: 25, ingredients: [ing("chickpeas",320,"g","drained"),ing("cauliflower",380,"g","small florets"),ing("canned_tomato",260,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("fresh_ginger",15,"g"),ing("curry_powder",2,"tsp"),ing("basmati_rice",130,"g")],
    steps: ["Cook basmati rice.","Soften onion, garlic and ginger with curry powder, then add tomato and cauliflower.","Add chickpeas and simmer until cauliflower is tender and the sauce clings."],
    nutrition: { energyKcal: 590, proteinG: 23, carbohydrateG: 103, fatG: 9, fibreG: 18 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["warm_spice","tomato","ginger"], spice: 2, mainProtein: "legume"
  }),
  recipe({
    id: "indian_turmeric_chicken_pea_rice", title: "Turmeric Chicken, Pea & Basmati Rice", cuisine: "Indian", difficulty: 1,
    prep: 10, active: 24, ingredients: [ing("chicken_breast",320,"g","small pieces"),ing("basmati_rice",150,"g"),ing("peas",160,"g"),ing("onion",1,"small"),ing("fresh_ginger",12,"g"),ing("turmeric",1,"tsp"),ing("cumin",1,"tsp"),ing("greek_yogurt",100,"g")],
    steps: ["Cook basmati rice.","Brown chicken with onion, ginger, turmeric and cumin until cooked through.","Add peas, then serve over rice with yogurt spooned on top."],
    nutrition: { energyKcal: 610, proteinG: 52, carbohydrateG: 72, fatG: 13, fibreG: 8 }, allergens: ["milk"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["warm_spice","ginger","creamy"], mainProtein: "poultry"
  }),
  recipe({
    id: "indian_pumpkin_red_lentil_dal", title: "Pumpkin & Red Lentil Dal", cuisine: "Indian", difficulty: 1,
    prep: 10, active: 28, ingredients: [ing("pumpkin",380,"g","small cubes"),ing("red_lentils",180,"g"),ing("canned_tomato",180,"g"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("fresh_ginger",12,"g"),ing("turmeric",1,"tsp"),ing("garam_masala",1,"tsp")],
    steps: ["Soften onion, garlic and ginger with turmeric and garam masala.","Add pumpkin, lentils, tomato and water.","Simmer until the pumpkin is tender and lentils are creamy, adding water as needed."],
    nutrition: { energyKcal: 430, proteinG: 22, carbohydrateG: 78, fatG: 5, fibreG: 20 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 4, flavour: ["sweet","warm_spice","earthy"], spice: 2, mainProtein: "legume"
  }),
  recipe({
    id: "se_asian_lime_chicken_rice_noodles", title: "Lime Chicken & Rice Noodle Bowl", cuisine: "Southeast Asian", difficulty: 2,
    prep: 14, active: 18, ingredients: [ing("chicken_breast",300,"g","thin strips"),ing("rice_noodles",160,"g"),ing("cabbage",140,"g","shredded"),ing("carrot",1,"piece","julienned"),ing("fish_sauce",1,"tbsp"),ing("lime",1,"piece"),ing("fresh_ginger",10,"g"),ing("coriander",15,"g")],
    steps: ["Soak or cook rice noodles according to thickness and drain well.","Stir-fry chicken with ginger, then add cabbage and carrot briefly.","Toss with noodles, fish sauce and lime; finish with coriander."],
    nutrition: { energyKcal: 540, proteinG: 45, carbohydrateG: 70, fatG: 9, fibreG: 6 }, allergens: ["fish"], costTier: 2, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["lime","savory","ginger"], spice: 1, novelty: 3, mainProtein: "poultry"
  }),
  recipe({
    id: "se_asian_tofu_mango_rice_bowl", title: "Tofu, Mango & Lime Rice Bowl", cuisine: "Southeast Asian", difficulty: 2,
    prep: 15, active: 18, ingredients: [ing("tofu_firm",300,"g","cubed"),ing("jasmine_rice",140,"g"),ing("mango",1,"piece","diced"),ing("cucumber",0.5,"piece"),ing("cabbage",100,"g"),ing("soy_sauce",1.5,"tbsp"),ing("lime",1,"piece"),ing("coriander",15,"g")],
    steps: ["Cook jasmine rice.","Brown tofu until crisp at the edges and season with soy sauce.","Assemble with mango, cucumber, cabbage, lime and coriander."],
    nutrition: { energyKcal: 580, proteinG: 29, carbohydrateG: 84, fatG: 17, fibreG: 9 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","gluten"], costTier: 2, mealPrep: 3, leftovers: 2, portable: 3, flavour: ["sweet","lime","savory"], novelty: 4, mainProtein: "soy"
  }),
  recipe({
    id: "se_asian_peanut_chickpea_noodles", title: "Peanut Chickpea Rice Noodles", cuisine: "Southeast Asian", difficulty: 1,
    prep: 12, active: 15, ingredients: [ing("rice_noodles",160,"g"),ing("chickpeas",260,"g","drained"),ing("cabbage",140,"g"),ing("carrot",1,"piece"),ing("peanut_butter",2,"tbsp"),ing("soy_sauce",1,"tbsp"),ing("lime",1,"piece"),ing("chilli_flakes",0.25,"tsp")],
    steps: ["Cook rice noodles and reserve a little hot water.","Warm chickpeas with cabbage and carrot.","Mix peanut butter, soy sauce, lime and hot water into a sauce and toss everything together."],
    nutrition: { energyKcal: 600, proteinG: 24, carbohydrateG: 91, fatG: 18, fibreG: 14 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["peanut","soy","gluten"], costTier: 1, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["nutty","lime","spicy"], spice: 2, novelty: 3, mainProtein: "legume"
  }),
  recipe({
    id: "east_asian_miso_salmon_rice", title: "Miso Salmon & Sesame Greens Rice", cuisine: "East Asian", difficulty: 2,
    techniques: ["glazing", "pan-searing"], prep: 12, active: 20, ingredients: [ing("salmon",300,"g"),ing("jasmine_rice",140,"g"),ing("miso",1.5,"tbsp"),ing("cabbage",180,"g"),ing("sesame_oil",1,"tsp"),ing("rice_vinegar",1,"tbsp"),ing("spring_onion",2,"pieces")],
    steps: ["Cook jasmine rice.","Thin miso with a spoonful of water, coat salmon and sear gently until just cooked.","Stir-fry cabbage with sesame oil, finish with rice vinegar and spring onion, and serve with salmon and rice."],
    nutrition: { energyKcal: 650, proteinG: 43, carbohydrateG: 66, fatG: 25, fibreG: 6 }, allergens: ["fish","soy","sesame"], costTier: 3, mealPrep: 2, leftovers: 2, flavour: ["umami","sesame","savory"], learning: 2, mainProtein: "fish"
  }),
  recipe({
    id: "east_asian_egg_pea_fried_rice", title: "Egg & Pea Fried Rice", cuisine: "East Asian", difficulty: 1,
    prep: 8, active: 15, ingredients: [ing("rice",300,"g","cooked and cooled"),ing("eggs",4,"pieces"),ing("peas",160,"g"),ing("carrot",1,"piece","small dice"),ing("spring_onion",2,"pieces"),ing("soy_sauce",1.5,"tbsp"),ing("sesame_oil",1,"tsp")],
    steps: ["Scramble eggs quickly in a hot pan and remove.","Stir-fry carrot and peas, then add cold cooked rice and separate the grains.","Return egg, season with soy and sesame, and finish with spring onion."],
    nutrition: { energyKcal: 540, proteinG: 24, carbohydrateG: 73, fatG: 17, fibreG: 7 }, dietary: ["unrestricted","vegetarian"], allergens: ["egg","soy","gluten","sesame"], costTier: 1, mealPrep: 3, leftovers: 3, portable: 3, flavour: ["savory","sesame"], learning: 2, mainProtein: "egg"
  }),
  recipe({
    id: "east_asian_chicken_broccoli_noodles", title: "Chicken & Broccoli Noodles", cuisine: "East Asian", difficulty: 1,
    prep: 10, active: 18, ingredients: [ing("chicken_breast",300,"g","thin strips"),ing("noodles",160,"g"),ing("broccoli",260,"g","small florets"),ing("soy_sauce",1.5,"tbsp"),ing("fresh_ginger",10,"g"),ing("garlic",1,"clove"),ing("sesame_oil",1,"tsp")],
    steps: ["Cook noodles and drain.","Stir-fry chicken with ginger and garlic, then add broccoli with a splash of water.","Add noodles, soy sauce and sesame oil and toss until hot."],
    nutrition: { energyKcal: 580, proteinG: 47, carbohydrateG: 68, fatG: 14, fibreG: 8 }, allergens: ["soy","gluten","sesame"], costTier: 2, mealPrep: 4, leftovers: 3, portable: 4, flavour: ["savory","ginger","sesame"], mainProtein: "poultry"
  }),
  recipe({
    id: "middle_eastern_mujaddara", title: "Lentil Rice with Caramelized Onion", cuisine: "Middle Eastern", difficulty: 2,
    techniques: ["browning", "simmering"], prep: 10, active: 32, ingredients: [ing("lentils",180,"g"),ing("brown_rice",140,"g"),ing("onion",2,"pieces","thinly sliced"),ing("cumin",1,"tsp"),ing("olive_oil",1.5,"tbsp"),ing("parsley",15,"g")],
    steps: ["Cook lentils until just tender, then add brown rice and enough water to finish both together.","Meanwhile brown onions slowly until deep golden and sweet.","Fold half the onions through the lentil rice with cumin and top with the rest and parsley."],
    nutrition: { energyKcal: 520, proteinG: 22, carbohydrateG: 91, fatG: 10, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["sweet_onion","earthy","cumin"], learning: 2, mainProtein: "legume"
  }),
  recipe({
    id: "middle_eastern_bulgur_chickpea_salad", title: "Bulgur, Chickpea & Herb Salad", cuisine: "Middle Eastern", difficulty: 1,
    prep: 15, active: 10, ingredients: [ing("bulgur",150,"g"),ing("chickpeas",260,"g","drained"),ing("cucumber",0.5,"piece"),ing("tomato",2,"pieces"),ing("parsley",20,"g"),ing("mint",10,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Cover bulgur with hot water and rest until tender, then cool slightly.","Combine with chickpeas, cucumber, tomato and herbs.","Dress with lemon and olive oil."],
    nutrition: { energyKcal: 500, proteinG: 21, carbohydrateG: 82, fatG: 12, fibreG: 16 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["fresh","lemon","herbal"], mainProtein: "legume"
  }),
  recipe({
    id: "middle_eastern_chicken_aubergine_tahini", title: "Chicken, Aubergine & Tahini Bowl", cuisine: "Middle Eastern", difficulty: 2,
    prep: 12, active: 25, ingredients: [ing("chicken_thigh",320,"g","bite-size"),ing("aubergine",1,"piece","cubed"),ing("brown_rice",130,"g"),ing("tahini",2,"tbsp"),ing("lemon",1,"piece"),ing("cumin",1,"tsp"),ing("parsley",15,"g")],
    steps: ["Cook brown rice.","Brown aubergine, then cook chicken with cumin until safely cooked through.","Loosen tahini with lemon and water and assemble over rice with parsley."],
    nutrition: { energyKcal: 690, proteinG: 45, carbohydrateG: 66, fatG: 28, fibreG: 10 }, allergens: ["sesame"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["nutty","cumin","lemon"], mainProtein: "poultry"
  }),
  recipe({
    id: "latin_chicken_black_bean_tacos", title: "Chicken & Black Bean Tacos", cuisine: "Latin American", difficulty: 1,
    prep: 12, active: 18, ingredients: [ing("chicken_breast",280,"g","small pieces"),ing("black_beans",220,"g","drained"),ing("corn_tortilla",6,"pieces"),ing("cabbage",120,"g"),ing("tomato",2,"pieces"),ing("cumin",1,"tsp"),ing("lime",1,"piece")],
    steps: ["Cook chicken with cumin until browned and cooked through.","Warm black beans and corn tortillas.","Fill tortillas with chicken, beans, cabbage and tomato and finish with lime."],
    nutrition: { energyKcal: 590, proteinG: 49, carbohydrateG: 73, fatG: 13, fibreG: 15 }, costTier: 2, mealPrep: 3, leftovers: 3, portable: 2, flavour: ["cumin","lime","fresh"], mainProtein: "poultry_legume"
  }),
  recipe({
    id: "latin_quinoa_corn_black_bean_salad", title: "Quinoa, Corn & Black Bean Salad", cuisine: "Latin American", difficulty: 1,
    prep: 14, active: 16, ingredients: [ing("quinoa",140,"g"),ing("black_beans",260,"g","drained"),ing("sweetcorn",180,"g"),ing("tomato",2,"pieces"),ing("avocado",0.5,"piece"),ing("coriander",15,"g"),ing("lime",1,"piece")],
    steps: ["Cook quinoa and let it steam dry.","Combine with black beans, corn, tomato and coriander.","Fold in avocado and lime immediately before serving."],
    nutrition: { energyKcal: 540, proteinG: 22, carbohydrateG: 84, fatG: 15, fibreG: 20 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 2, mealPrep: 4, leftovers: 3, portable: 4, flavour: ["lime","fresh","creamy"], mainProtein: "legume"
  }),
  recipe({
    id: "latin_beef_sweet_potato_bowl", title: "Beef, Sweet Potato & Corn Bowl", cuisine: "Latin American", difficulty: 2,
    prep: 10, active: 24, ingredients: [ing("beef_mince",280,"g"),ing("sweet_potato",340,"g","small cubes"),ing("sweetcorn",160,"g"),ing("bell_pepper",1,"piece"),ing("cumin",1,"tsp"),ing("smoked_paprika",1,"tsp"),ing("lime",1,"piece")],
    steps: ["Cook sweet potato in a covered pan until nearly tender.","Brown beef with cumin and paprika, then add pepper and corn.","Combine with sweet potato and finish with lime."],
    nutrition: { energyKcal: 660, proteinG: 40, carbohydrateG: 64, fatG: 25, fibreG: 11 }, costTier: 3, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["smoky","cumin","lime"], mainProtein: "beef"
  }),
  recipe({
    id: "med_lentil_mushroom_barley", title: "Lentil, Mushroom & Barley Bowl", cuisine: "Mediterranean", difficulty: 2,
    prep: 10, active: 30, ingredients: [ing("lentils",160,"g"),ing("barley",130,"g"),ing("mushroom",250,"g"),ing("carrot",1,"piece"),ing("onion",1,"small"),ing("thyme",1,"tsp"),ing("lemon",0.5,"piece")],
    steps: ["Simmer barley and lentils until tender, adding water as needed.","Brown mushrooms with onion and carrot until deeply savory.","Fold the vegetables through the grains and finish with thyme and lemon."],
    nutrition: { energyKcal: 510, proteinG: 24, carbohydrateG: 91, fatG: 7, fibreG: 21 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["gluten"], costTier: 1, mealPrep: 4, batch: 4, freezer: 3, leftovers: 4, portable: 4, flavour: ["earthy","savory","lemon"], mainProtein: "legume"
  }),
  recipe({
    id: "spanish_prawn_pea_rice", title: "Prawn, Pea & Pepper Rice", cuisine: "Spanish", difficulty: 2,
    prep: 12, active: 26, ingredients: [ing("prawns",280,"g"),ing("rice",150,"g"),ing("peas",140,"g"),ing("bell_pepper",1,"piece"),ing("canned_tomato",160,"g"),ing("garlic",2,"cloves"),ing("smoked_paprika",1,"tsp")],
    steps: ["Soften pepper and garlic with paprika, then add rice and tomato.","Add water and cook until the rice is nearly tender.","Add peas and prawns for the final minutes and cook until the prawns are opaque."],
    nutrition: { energyKcal: 560, proteinG: 39, carbohydrateG: 72, fatG: 10, fibreG: 7 }, allergens: ["crustacean"], costTier: 3, mealPrep: 2, leftovers: 2, flavour: ["smoky","seafood","savory"], learning: 2, mainProtein: "shellfish"
  }),
  recipe({
    id: "med_hake_couscous_green_beans", title: "Lemon Hake, Couscous & Green Beans", cuisine: "Mediterranean", difficulty: 1,
    prep: 10, active: 18, ingredients: [ing("hake",300,"g"),ing("couscous",150,"g"),ing("green_beans",220,"g"),ing("lemon",1,"piece"),ing("parsley",15,"g"),ing("olive_oil",1,"tbsp")],
    steps: ["Steam couscous and cook green beans until just tender.","Sear hake gently until it flakes.","Fluff couscous with parsley, lemon and olive oil and serve with beans and hake."],
    nutrition: { energyKcal: 520, proteinG: 41, carbohydrateG: 65, fatG: 11, fibreG: 8 }, allergens: ["fish","gluten"], costTier: 2, mealPrep: 2, leftovers: 2, flavour: ["lemon","fresh","seafood"], mainProtein: "fish"
  }),
  recipe({
    id: "east_asian_tofu_miso_broccoli_rice", title: "Miso Tofu, Broccoli & Rice", cuisine: "East Asian", difficulty: 2,
    prep: 10, active: 20, ingredients: [ing("tofu_firm",300,"g","cubed"),ing("brown_rice",140,"g"),ing("broccoli",260,"g"),ing("miso",1.5,"tbsp"),ing("rice_vinegar",1,"tbsp"),ing("sesame_seeds",1,"tbsp"),ing("spring_onion",2,"pieces")],
    steps: ["Cook brown rice.","Brown tofu and steam-fry broccoli until bright and tender.","Thin miso with rice vinegar and a little hot water, toss through tofu and broccoli, and finish with sesame and spring onion."],
    nutrition: { energyKcal: 570, proteinG: 31, carbohydrateG: 70, fatG: 20, fibreG: 11 }, dietary: ["unrestricted","vegetarian","vegan"], allergens: ["soy","sesame"], costTier: 2, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["umami","sesame","savory"], novelty: 3, mainProtein: "soy"
  }),
  recipe({
    id: "middle_eastern_red_lentil_carrot_soup", title: "Red Lentil, Carrot & Cumin Soup", cuisine: "Middle Eastern", difficulty: 1,
    prep: 10, active: 25, ingredients: [ing("red_lentils",180,"g"),ing("carrot",3,"pieces","sliced"),ing("onion",1,"small"),ing("garlic",2,"cloves"),ing("cumin",1.5,"tsp"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Soften onion and carrot, then add garlic and cumin.","Add lentils and water and simmer until everything is very soft.","Mash or blend to your preferred texture and finish with lemon."],
    nutrition: { energyKcal: 390, proteinG: 21, carbohydrateG: 62, fatG: 9, fibreG: 17 }, dietary: ["unrestricted","vegetarian","vegan"], equipment: ["hob","pot"], costTier: 1, mealPrep: 4, batch: 4, freezer: 4, leftovers: 4, portable: 3, flavour: ["cumin","sweet_carrot","lemon"], mainProtein: "legume"
  }),
  recipe({
    id: "latin_pinto_bean_pepper_rice", title: "Pinto Bean, Pepper & Rice Skillet", cuisine: "Latin American", difficulty: 1,
    prep: 8, active: 20, ingredients: [ing("pinto_beans",300,"g","drained"),ing("rice",280,"g","cooked"),ing("bell_pepper",1,"piece"),ing("tomato",2,"pieces"),ing("cumin",1,"tsp"),ing("smoked_paprika",0.5,"tsp"),ing("lime",1,"piece")],
    steps: ["Cook pepper with cumin and paprika until softened.","Add beans and tomato and cook until juicy.","Fold in cooked rice, heat through and finish with lime."],
    nutrition: { energyKcal: 510, proteinG: 19, carbohydrateG: 91, fatG: 8, fibreG: 16 }, dietary: ["unrestricted","vegetarian","vegan"], costTier: 1, mealPrep: 4, leftovers: 4, portable: 4, flavour: ["smoky","lime","savory"], mainProtein: "legume"
  }),
  recipe({
    id: "med_salmon_barley_spinach", title: "Salmon, Barley & Spinach Bowl", cuisine: "Mediterranean", difficulty: 2,
    prep: 10, active: 26, ingredients: [ing("salmon",300,"g"),ing("barley",140,"g"),ing("spinach",130,"g"),ing("cherry_tomato",180,"g"),ing("lemon",1,"piece"),ing("olive_oil",1,"tbsp")],
    steps: ["Cook barley until tender and drain well.","Sear salmon until just cooked and rest it.","Wilt spinach into warm barley with tomato, lemon and olive oil and serve with salmon."],
    nutrition: { energyKcal: 650, proteinG: 43, carbohydrateG: 61, fatG: 27, fibreG: 10 }, allergens: ["fish","gluten"], costTier: 3, mealPrep: 2, leftovers: 2, flavour: ["lemon","nutty_grain","fresh"], mainProtein: "fish"
  })
];
