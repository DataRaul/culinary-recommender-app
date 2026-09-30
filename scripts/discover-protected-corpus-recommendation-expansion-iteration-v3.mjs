import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectUnitoolsRecipe } from "./protected-corpus-recommendation-expansion-r1-frontier-core.mjs";

const unitoolsPath = process.argv[2];
if (!unitoolsPath) throw new Error("UNITOOLS_DATASET_PATH_REQUIRED");

const aliasContract = JSON.parse(await readFile(resolve("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json"), "utf8"));
const dataset = JSON.parse(await readFile(resolve(unitoolsPath), "utf8"));

const processedSourceSlugs = new Set([
  "pao-de-queijo",
  "tortilla-espanola",
  "cachapas",
  "chapati-kenyan",
  "ajvar",
  "arepas",
  "arroz-con-coco",
  "avgolemono",
  "burek-bosanski",
  "chimichurri",
  "dograma",
  "draniki",
  "flia",
  "gurasa",
  "halloumi-grilled",
  "hangi-style-chicken",
  "hummus",
  "injera",
  "jasha-maroo",
  "karjalanpiirakka",
  "matapa",
  "moros-y-cristianos"
]);

const rows = dataset.recipes
  .map(recipe => inspectUnitoolsRecipe(recipe, aliasContract))
  .filter(row => !processedSourceSlugs.has(row.sourceSlug))
  .filter(row => row.requiredHardMetadataReady)
  .filter(row => row.conflictIngredientOccurrenceCount === 0)
  .sort((a, b) =>
    a.uniqueUnresolvedIngredientKeyCount - b.uniqueUnresolvedIngredientKeyCount
    || a.unresolvedIngredientOccurrenceCount - b.unresolvedIngredientOccurrenceCount
    || a.sourceSlug.localeCompare(b.sourceSlug)
  );

const frontier = rows.slice(0, 10);
const sourceSlugs = frontier.map(row => row.sourceSlug);
const result = {
  schemaVersion: "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V3_DISCOVERY_V1",
  protectedCorpusVersion: "v8018",
  sourcePin: {
    commit: "1d09e9548d957dd0375301146a86dddf5e269c1b",
    dataBlobSha: "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed"
  },
  processedSourceSlugCount: processedSourceSlugs.size,
  remainingRankedCount: rows.length,
  zeroGapCount: rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 0).length,
  oneGapCount: rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 1).length,
  frontier: frontier.map(row => ({
    sourceSlug: row.sourceSlug,
    unresolvedIngredientOccurrenceCount: row.unresolvedIngredientOccurrenceCount,
    uniqueUnresolvedIngredientKeyCount: row.uniqueUnresolvedIngredientKeyCount,
    unresolvedIngredientKeys: row.unresolvedIngredientKeys
  })),
  frontierDigestSha256: createHash("sha256").update(JSON.stringify(sourceSlugs)).digest("hex")
};

process.stdout.write("ITERATION_V3_DISCOVERY=" + JSON.stringify(result) + "\n");
