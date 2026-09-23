import test from "node:test";
import assert from "node:assert/strict";

import {
  mapCategory,
  mapDifficulty,
  mapRecord,
  parseDurationMinutes,
  validateOverlayRecord
} from "../scripts/corpus-normalization-mapping-v1-core.mjs";

const config = {
  difficultyScales: { numeric:"NUMERIC_1_5", labels:"LABEL_EASY_MEDIUM_HARD" },
  dishCategoryVocabulary:["BEVERAGE","BREAD","CONDIMENT","DESSERT","EGG_DISH","FERMENTED_FOOD","GRAIN_DISH","PROTEIN_DISH","SALAD","SAUCE","SEAFOOD_DISH","SOUP","STOCK","VEGETABLE_DISH"],
  mealRoleVocabulary:["BEVERAGE","BREAKFAST","DESSERT","MAIN","SIDE","SNACK"],
  categoryMappings:{
    main:{dishCategory:null,mealRoles:["MAIN"]},
    desserts:{dishCategory:"DESSERT",mealRoles:["DESSERT"]},
    grains:{dishCategory:"GRAIN_DISH",mealRoles:[]}
  }
};

test("duration parser is deterministic and bounded", () => {
  assert.equal(parseDurationMinutes("10 min"), 10);
  assert.equal(parseDurationMinutes("1 hour 10 min"), 70);
  assert.equal(parseDurationMinutes("2 hr 25 min"), 145);
  assert.equal(parseDurationMinutes("1 hr"), 60);
  assert.equal(parseDurationMinutes("about an hour"), null);
});

test("category separates dish category from meal role", () => {
  assert.equal(mapCategory("main", config).dishCategory.state, "UNKNOWN");
  assert.deepEqual(mapCategory("main", config).mealRoles.value, ["MAIN"]);
  assert.equal(mapCategory("desserts", config).dishCategory.value, "DESSERT");
  assert.equal(mapCategory("grains", config).mealRoles.state, "UNKNOWN");
  assert.equal(mapCategory("mystery", config).dishCategory.state, "AMBIGUOUS");
});

test("difficulty preserves incompatible source scales", () => {
  assert.deepEqual(mapDifficulty(2, config).value, { scale:"NUMERIC_1_5", level:2 });
  assert.deepEqual(mapDifficulty("easy", config).value, { scale:"LABEL_EASY_MEDIUM_HARD", label:"EASY" });
  assert.equal(mapDifficulty("simple-ish", config).state, "AMBIGUOUS");
});

test("mapping does not infer country region tradition or prep time", () => {
  const overlay = mapRecord({
    layer:"v8002",
    cohortId:"FORKRECIPE_PINNED_STEP7E",
    sourceSystem:"FORKRECIPE",
    sourceRecordKey:"socca.js",
    raw:{
      country:null,
      cuisine:"French",
      culture:"Niçoise",
      category:"grains",
      difficulty:1,
      activeTime:"10 min",
      totalTime:"1 hour 10 min"
    }
  }, config);
  assert.equal(overlay.canonical.geography.country.state, "UNKNOWN");
  assert.equal(overlay.canonical.geography.region.state, "UNKNOWN");
  assert.equal(overlay.canonical.culinary.tradition.state, "UNKNOWN");
  assert.equal(overlay.canonical.time.prepMinutes.state, "UNKNOWN");
  assert.equal(overlay.canonical.time.totalMinutes.value, 70);
  assert.equal(validateOverlayRecord(overlay, config), true);
});

test("unitools-style explicit numeric fields normalize without guessing", () => {
  const overlay = mapRecord({
    layer:"v8001",
    cohortId:"unitools-world-recipes-v1_1_0",
    sourceSystem:"UNITOOLS",
    sourceRecordKey:"x",
    raw:{country:"Spain",category:"main",difficulty:3,prepMinutes:10,cookMinutes:20,baseServings:4}
  }, config);
  assert.equal(overlay.canonical.geography.country.value, "Spain");
  assert.equal(overlay.canonical.time.totalMinutes.value, 30);
  assert.equal(overlay.canonical.time.totalMinutes.state, "REVIEWED_MAPPING");
  assert.equal(overlay.canonical.serving.servings.value, 4);
  assert.equal(validateOverlayRecord(overlay, config), true);
});
