// Generated from the official ANSES-Ciqual 2025 XML dataset after strict B5 food-form review.
// This is a bounded extension of the existing Ciqual 2025 evidence lane, not a bulk database import.
// Missing or below-limit values remain null. Nutrient semantics are preserved by the source-policy layer.

const RAW = {"lemon":["13009","Lemon, flesh without skin, without seeds, raw","Citron, chair sans peau, sans pépins, cru","Citrus limon (L.) Burm. f.","high","Direct raw edible lemon flesh. Current recipe piece quantities remain separately quantity-gated; this mapping does not imply a juice conversion.",[24.3,24.3,0.25,1.56,null,null],["D","D","A","A","A","A"],["444","391"]],"olive_oil":["17270","Olive oil, extra virgin","Huile d'olive vierge extra",null,"high","Direct extra-virgin olive-oil match; EVOO is an explicit canonical alias.",[899,899,0.25,null,99.9,0],["D","D","A","A","A","C"],["444","399","1107"]],"lime":["13067","Lime, flesh without skin, without seeds, raw","Citron vert ou lime, chair sans peau, sans pépins, cru","Citrus aurantiifolia (Christm.) Swingle.","high","Direct raw edible lime flesh. Current piece quantities remain separately quantity-gated; this mapping does not imply a juice conversion.",[39.3,39.3,1.13,3.14,null,4.3],["D","D","A","A","A","A"],["444","394"]],"tomato":["20385","Tomato, raw (average)","Tomate sans précision, crue (aliment moyen)","Solanum lycopersicum L.","high","Generic raw tomato average; preferred over cultivar-specific records for the canonical unspecific tomato.",[19.2,19.2,0.6,3.69,null,1.02],["D","D","D","D","D","D"],["443"]],"bell_pepper":["20041","Sweet pepper, green, yellow or red, raw","Poivron, vert, jaune ou rouge, cru","Capsicum annuum","high","Generic raw sweet/bell pepper across common colours; matches the unspecific canonical bell pepper.",[22.6,22.6,0.8,3.5,0.27,1.5],["D","D","A","C","A","A"],["444","319"]],"parsley":["11014","Parsley, fresh","Persil, frais",null,"high","Direct fresh parsley match.",[42.5,42.5,2.97,4.1,0.63,4.3],["D","D","C","D","A","A"],["444","319"]],"cabbage":["20116","White cabbage, raw","Chou blanc, cru","Brassica oleracea L. convar. capitata L. var. alba","high","Direct raw white-cabbage match; white cabbage is an explicit canonical alias.",[35.2,35.2,1.38,4.63,0.6,3.5],["D","D","A","A","A","A"],["444","391"]],"spinach":["20059","Spinach, raw","Épinard, cru","Spinacia oleracea L.","high","Direct raw spinach match.",[33.3,33.3,2.68,3.06,0.39,2.6],["D","D","C","C","B","C"],["444","361","1107"]],"chickpeas":["20532","Chick pea, canned, drained","Pois chiche, appertisé, égoutté",null,"high","Current authored chickpea recipes use gram quantities explicitly marked drained; this record matches that form.",[122,122,6.74,15,2.68,5.45],["D","D","C","C","C","C"],["444","1107"]],"soy_sauce":["11104","Soy sauce, prepacked","Sauce soja, préemballée",null,"high","Direct generic prepacked soy-sauce match; sweetened soy sauce is a separate Ciqual record and is not used.",[39.9,39.9,7.25,1.72,null,0.9],["D","D","A","A","A","A"],["444","406"]],"fresh_ginger":["11074","Ginger, raw","Gingembre, racine fraîche",null,"high","Direct fresh ginger-root match.",[33.3,33.3,1.1,3.4,1.1,2.7],["D","D","A","A","A","A"],["444","382"]],"brown_rice":["9102","Rice, wholegrain, raw","Riz complet, cru",null,"high","Direct raw/dry wholegrain brown-rice match.",[349,350,7.02,71.4,2.8,5],["D","D","A","A","A","A"],["444","267"]],"sesame_oil":["17400","Sesame oil","Huile de sésame",null,"high","Direct sesame-oil match.",[900,900,0,0,100,0],["D","D","C","C","C","C"],["444","361"]],"peas":["20084","Garden peas, frozen, raw","Petits pois, surgelés, crus","Pisum sativum","high","Canonical peas explicitly supports frozen peas; raw frozen form is preferred over cooked or mixed-vegetable records.",[77.9,77.9,5.86,9.5,0.4,6.45],["D","D","C","C","C","A"],["444","361","199"]],"parmesan":["12120","Parmesan cheese, from cow's milk","Parmesan",null,"high","Direct Parmesan cheese match.",[413,411,31.1,1.14,31,0],["D","D","A","A","A","A"],["444","389","428"]],"coriander":["11094","Coriander, fresh","Coriandre, fraiche",null,"high","Direct fresh coriander/cilantro herb match.",[22.3,22.3,2.13,0.87,0.52,2.8],["D","D","C","C","C","C"],["444","361"]],"curry_powder":["11005","Curry, powder","Curry, poudre",null,"high","Direct curry-powder match.",[301,301,14.5,2.63,14,53.2],["D","D","B","B","B","B"],["444","361"]],"basil":["11033","Basil, fresh","Basilic, frais",null,"high","Direct fresh basil match.",[35.2,35.2,3.15,3.4,0.64,1.6],["D","D","B","D","B","B"],["444","361"]],"wholewheat_pasta":["9870","Pasta, dry, wholewheat, raw","Pâtes sèches, au blé complet, crues",null,"high","Direct dry/raw wholewheat-pasta match for authored uncooked gram quantities.",[350,353,11.8,67.6,2.2,6.1],["D","D","A","B","A","A"],["444","246"]],"couscous":["9681","Couscous (pre-cooked durum wheat semolina), raw","Graine de couscous (semoule de blé dur précuite), à cuire",null,"high","Direct dry couscous grain/semolina product match for authored uncooked gram quantities.",[361,366,12.3,72.7,1.32,4.5],["D","D","C","C","C","C"],["444","1107"]],"cherry_tomato":["20172","Tomato, cherry, raw","Tomate cerise, crue","Solanum lycopersicum esculentum M.","high","Direct raw cherry-tomato match.",[31.8,31.8,1.31,5.62,null,1.2],["D","D","A","B","A","A"],["444","391"]],"hake":["26044","European hake, raw","Merlu, cru","Merluccius merluccius (Linnaeus, 1758)","high","Direct raw European hake match and geographically appropriate for Spain/Canary use; frozen fillet and Cape hake remain distinct records.",[82.6,82.6,17.6,0,1.35,0],["D","D","D","D","D","D"],["444","759","817"]]};

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

export const CIQUAL_DENSITIES_B5 = Object.fromEntries(Object.entries(RAW).map(([ingredientId, record]) => [ingredientId, expand(record)]));
export const ciqualB5DensityForIngredient = ingredientId => CIQUAL_DENSITIES_B5[ingredientId] || null;
