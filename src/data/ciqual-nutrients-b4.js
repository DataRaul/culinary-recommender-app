// Generated from the official ANSES-Ciqual 2025 XML dataset after reviewed food-form matching.
// Secondary/corroboration evidence only: this module MUST NOT silently replace USDA or project-authored values.
// Ciqual CHOAVL is available carbohydrate and is deliberately not normalized into USDA carbohydrate-by-difference.

export const CIQUAL_2025_SOURCE = {
  id: "anses-ciqual-2025-b4",
  name: "ANSES-Ciqual 2025 food composition table",
  releaseDate: "2025-11-19",
  version: "1.0",
  datasetDoi: "10.57745/RDMHWY",
  license: "Etalab Open Licence 2.0",
  requiredAttribution: "Anses. 2025. Table de composition nutritionnelle des aliments Ciqual",
  country: "France",
  region: "Europe",
  state: "BOUNDED_STATIC_SECONDARY_EVIDENCE",
  runtimePolicy: "CORROBORATION_ONLY_NOT_PRIMARY",
  trackedSemantics: {
    energyJonesWithFibreKcal: { constCode: "333", infoodsCode: "ENERC", comparability: "METHOD_DIFFERENT_COMPARE_WITH_CAUTION" },
    energyEu1169Kcal: { constCode: "328", infoodsCode: "ENERC", comparability: "REGULATORY_LABEL_ENERGY" },
    proteinJonesG: { constCode: "25000", infoodsCode: "PROCNT", comparability: "METHOD_DEPENDENT" },
    carbohydrateAvailableG: { constCode: "31000", infoodsCode: "CHOAVL", comparability: "NOT_DIRECTLY_COMPARABLE_TO_USDA_1005" },
    fatG: { constCode: "40000", infoodsCode: "FAT", comparability: "DIRECT_WITH_FORM_CAVEATS" },
    fibreG: { constCode: "34100", infoodsCode: "FIB-", comparability: "METHOD_DEPENDENT" }
  }
};

const RAW = {"chicken_breast":["36017","Chicken, breast, without skin, raw","Poulet, filet sans peau cru",null,"high","Direct raw skinless breast match.",[110,110,23.4,0,1.5,0],["D","D","A","A","A","C"],["1107","395","444"]],"white_beans":["20511","Haricot bean, canned, drained","Haricot blanc, appertisé, égoutté",null,"medium","Generic French white bean; close to canned/drained white-bean corpus form but not specifically cannellini.",[85.5,85.5,5.88,10.9,0.5,7],["D","D","C","C","C","A"],["199","355","444"]],"kidney_beans":["20524","Red kidney bean, canned, drained","Haricot rouge, appertisé, égoutté",null,"high","Matches canned/drained kidney-bean form; colour variety is less specific than USDA mapping.",[108,108,8.31,13,0.97,7],["D","D","C","C","C","C"],["1107","444"]],"green_beans":["20061","French bean, raw","Haricot vert, cru","Phaseolus vulgaris L.","high","Raw Phaseolus vulgaris match.",[31.9,31.9,1.83,4.14,0.22,2.7],["D","D","C","D","B","B"],["361","444"]],"avocado":["13004","Avocado, flesh without skin, pitted, raw","Avocat, chair sans peau, sans noyau, cru","Persea americana Mill.","high","Generic avocado rather than USDA Hass-specific mapping.",[203,203,1.56,null,20.6,3.6],["D","D","A","A","A","A"],["391","444"]],"banana":["13005","Banana, flesh without skin, raw","Banane, chair sans peau, crue","Musa spp.","high","Raw edible flesh; species group Musa spp.",[87.6,87.6,1.06,19.7,null,2.7],["D","D","A","A","A","A"],["391","444"]],"tuna":["26039","Tuna,  canned in brine, drained","Thon, au naturel, appertisé, égoutté","(Genus and species unknown or multiple)","medium","Drained canned tuna form; brine differs from USDA canned-in-water mapping.",[143,143,26.8,0,3.94,0],["D","D","A","C","A","C"],["314","355","444"]],"almonds":["15000","Almond, with peel, no added salt","Amande, avec peau, sans sel ajouté",null,"medium","Whole skin-on unsalted almond; Ciqual label does not explicitly say raw.",[600,615,18.8,9.51,51.3,12.5],["D","D","A","A","A","A"],["393","444"]],"walnuts":["15005","Walnut, kernel, dried","Noix, cerneau, séchée",null,"medium","Edible walnut kernel; dried form differs from USDA raw-halves wording.",[700,709,13.3,6.88,67.3,6.7],["D","D","A","A","A","A"],["382","444"]],"pumpkin_seeds":["15064","Pumpkin and squash, seed, dried","Courge, graine, séchée",null,"medium","Dried seed rather than USDA raw pepita-specific form.",[593,618,29.5,5.39,49.1,6],["D","D","C","C","C","C"],["429","444"]],"sunflower_seeds":["15011","Sunflower, seed","Tournesol, graine",null,"medium","Generic seed record; processing state is underspecified.",[637,653,21.3,10.1,55.5,6.4],["D","D","A","A","A","A"],["319","444"]],"broccoli":["20057","Broccoli, raw","Brocoli, cru","Brassica oleracea L. var. italica Plenck","high","Raw Brassica oleracea var. italica match.",[31.9,31.9,2.9,2.15,0.36,2.6],["D","D","C","C","C","B"],["361","444"]],"egg":["22000","Egg, raw","Oeuf cru",null,"high","Generic raw whole egg; USDA mapping is Grade-A large whole raw.",[140,140,12.8,0.06,9.83,0],["D","D","C","B","A","C"],["1107","1926","444"]],"red_onion":["20238","Red onion, raw","Oignon rouge, cru","Allium cepa L.","high","Direct raw red-onion match.",[35,35,1.31,5.63,0.4,2.5],["D","D","A","A","A","A"],["394","444"]],"onion":["20034","Onion, raw","Oignon, cru","Allium cepa L.","high","European generic raw onion average; USDA canonical mapping currently uses yellow onion with explicit qualification.",[39,39,1.1,6.25,0.62,1.7],["D","D","A","B","A","A"],["319","444"]],"garlic":["11000","Garlic, raw","Ail, cru",null,"high","Direct raw garlic match.",[109,109,5.31,18.6,null,5.8],["D","D","A","A","A","A"],["389","444"]],"mushrooms":["20056","Button mushroom or cultivated mushroom, raw","Champignon de Paris ou champignon de couche, cru","Agaricus bisporus","high","Agaricus bisporus; aligns with USDA white-button mapping.",[21,21,2.11,1.83,0.36,1],["D","D","B","B","A","A"],["319","444"]],"carrot":["20009","Carrot, raw","Carotte, crue","Daucus carota L. subsp. Sativus","high","Raw mature carrot match.",[30.2,30.2,0.78,5.16,null,2.9],["D","D","A","A","A","A"],["405","444"]],"pineapple":["13002","Pineapple, flesh without skin, raw","Ananas, chair sans peau, cru","Ananas comosus (L.) Merril","high","Raw edible flesh match.",[51.6,51.6,0.25,11.7,null,1.2],["D","D","A","A","A","A"],["391","444"]],"cucumber":["20019","Cucumber, flesh and skin, raw","Concombre, chair et peau, cru","Cucumis sativus L.","high","Direct flesh-and-skin raw match.",[16.8,16.8,0.65,2.87,0.11,0.5],["D","D","B","C","B","C"],["361","444"]],"rice":["9100","Rice, white, raw","Riz blanc, cru",null,"medium","Generic raw white rice; USDA mapping is raw long-grain white rice.",[348,350,7.02,77.5,0.79,1.53],["D","D","C","C","C","C"],["1107","444"]],"cauliflower":["20016","Cauliflower, raw","Chou-fleur, cru","Brassica oleracea L. var. botrytis L.","high","Direct raw cauliflower match.",[24.9,24.9,1.81,2.13,0.7,2.2],["D","D","A","A","A","A"],["391","444"]],"aubergine":["20053","Eggplant, raw","Aubergine, crue","Solanum melongena L.","high","Direct raw aubergine/eggplant match.",[22.9,22.9,0.98,2.7,0.18,3],["D","D","B","C","B","B"],["361","444"]],"tomato_paste":["20068","Tomato paste, concentrated, canned","Tomate, concentré, appertisé",null,"high","Direct concentrated canned tomato-paste form.",[99.2,99.2,4.4,17.1,0.53,4.2],["D","D","A","A","A","A"],["276","444"]],"canned_tomato":["20169","Tomato flesh without skin, canned","Tomate, chair, appertisée","Solanum lycopersicum L.","medium","European canned tomato flesh; differs from USDA crushed-canned mapping.",[22.6,22.6,1.2,3.63,null,1.8],["D","D","A","A","A","A"],["382","444"]],"salmon":["26036","Salmon, raw, farmed","Saumon, élevage, cru","Salmo salar (Linnaeus, 1758)","high","Salmo salar farmed raw; strong European form match not promoted in the bounded USDA lane.",[193,193,20.5,null,12.4,null],["D","D","A","B","A","D"],["1487","444","700"]],"milk":["19033","Milk, semi-skimmed (average)","Lait demi-écrémé (aliment moyen)",null,"medium","French average semi-skimmed milk; canonical app milk is less form-specific.",[47.8,47.5,3.46,4.97,1.55,0],["D","D","D","D","D","D"],["443"]],"yogurt":["19860","Yogurt, Greek-style, plain","Yaourt à la grecque nature",null,"high","Direct plain Greek-style yogurt match.",[103,103,3.02,3.73,8.16,0.071],["D","D","A","A","A","A"],["419","430","444"]],"apple":["13039","Apple, flesh and skin, raw","Pomme, chair et peau, crue","Malus domestica Borkhausen","high","Generic raw apple with skin; avoids cultivar-specific selection.",[54,54,0.25,11.6,0.25,1.4],["D","D","B","B","A","A"],["319","444"]],"mango":["13025","Mango, flesh without skin, pitted, raw","Mangue, chair sans peau, sans noyau, crue","Mangifera indica L.","high","Generic raw edible mango flesh.",[71.1,71.1,0.63,14.3,null,1.6],["D","D","A","A","A","A"],["391","444"]],"potato":["4008","Potato, peeled, raw","Pomme de terre, sans peau, crue",null,"high","Generic peeled raw potato.",[80,80,2.02,16.2,0.09,2.2],["D","D","B","D","B","B"],["361","444"]],"sweet_potato":["4101","Sweet potato, raw","Patate douce, crue",null,"high","Generic raw sweet potato.",[81.2,81.2,1.57,17.1,0.05,3],["D","D","B","B","B","C"],["361","444"]]};

const [energyJonesWithFibreKcal, energyEu1169Kcal, proteinJonesG, carbohydrateAvailableG, fatG, fibreG] = [0, 1, 2, 3, 4, 5];
const expand = ([alimCode, nameEn, nameFr, scientificName, matchConfidence, matchNotes, values, confidence, sourceCodes]) => ({
  alimCode,
  nameEn,
  nameFr,
  scientificName,
  matchConfidence,
  matchNotes,
  per100g: {
    energyJonesWithFibreKcal: values[energyJonesWithFibreKcal],
    energyEu1169Kcal: values[energyEu1169Kcal],
    proteinJonesG: values[proteinJonesG],
    carbohydrateAvailableG: values[carbohydrateAvailableG],
    fatG: values[fatG],
    fibreG: values[fibreG]
  },
  confidenceCodes: {
    energyJonesWithFibreKcal: confidence[energyJonesWithFibreKcal],
    energyEu1169Kcal: confidence[energyEu1169Kcal],
    proteinJonesG: confidence[proteinJonesG],
    carbohydrateAvailableG: confidence[carbohydrateAvailableG],
    fatG: confidence[fatG],
    fibreG: confidence[fibreG]
  },
  sourceCodes
});

export const CIQUAL_DENSITIES_B4 = Object.fromEntries(Object.entries(RAW).map(([ingredientId, record]) => [ingredientId, expand(record)]));
export const ciqualDensityForIngredient = ingredientId => CIQUAL_DENSITIES_B4[ingredientId] || null;
