import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import { parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { STEP8G_SHARD_COUNT, STEP8G_MAX_ROWS_PER_WRITE_BATCH } from "./corpus-scale-step8g-population-core.mjs";
import {
  STEP8G_VIARD_V8013_CHILD_COUNT,
  STEP8G_VIARD_V8013_COMPOSED_COUNT,
  STEP8G_VIARD_V8013_LAYER_VERSION,
  STEP8G_VIARD_V8013_PARENT_COUNT,
  STEP8G_VIARD_V8013_PARENT_VERSION
} from "./corpus-scale-step8g-viard-v8013-prewrite-core.mjs";

const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const SOURCE_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const SOURCE = Object.freeze({
  cohortId: "ORA_VIARD_1806_LE_CUISINIER_IMPERIAL_LECUISINIERIMPE00VIARGOOG",
  collection: "cuisine-francaise",
  sourceUrl: "https://archive.org/details/lecuisinierimpe00viargoog",
  sourceTitle: "Le Cuisinier impérial",
  sourceAuthor: "A. Viard",
  sourceAuthorClassification: "IDENTIFIED_AUTHOR",
  sourceAuthorDisplay: "André Viard",
  sourceYearSemantics: "SOURCE_TUPLE_YEAR_ALIGNED_WITH_BNF_1806_FIRST_EDITION",
  workFirstPublicationYear: "1806",
  digitizedEditionYear: "1806",
  digitizedEditionLabel: "1806 first edition bibliographic alignment",
  sourceYear: "1806",
  license: "public-domain",
  expectedRecipeCount: 807,
  idPrefix: "ora_viard_1806_",
  packetSchema: "STEP8G_ORA_VIARD_1806_PROTECTED_SOURCE_PACKET_V1"
});
const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(String(value)).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const out = { ora: null, output: "data/generated/step8g/v8013-runtime-descriptor.mjs" };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) out.ora = arg.slice(6);
    else if (arg.startsWith("--out=")) out.output = arg.slice(6);
    else throw new Error(`UNKNOWN_ARGUMENT_${arg}`);
  }
  if (!out.ora) throw new Error("ORA_ROOT_REQUIRED");
  return out;
}
function slug(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function sourceForRaw(row) {
  return row.collection === SOURCE.collection &&
    row.source_url === SOURCE.sourceUrl &&
    row.source_title === SOURCE.sourceTitle &&
    String(row.author ?? "") === SOURCE.sourceAuthor &&
    String(row.source_year ?? "") === SOURCE.sourceYear &&
    row.license === SOURCE.license;
}
async function loadRows(root) {
  const text = await readFile(resolve(root, `collections/${SOURCE.collection}/recipes.jsonl`), "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (const [sourceOrdinal, rawJson] of lines.entries()) {
    const sourceRow = JSON.parse(rawJson);
    if (!sourceForRaw(sourceRow)) continue;
    const parsed = parseOraJsonlRecipe(sourceRow);
    if (!parsed.quality.hasTitle || !parsed.quality.hasIngredients || !parsed.quality.hasDirections) throw new Error(`STRUCTURAL_SOURCE_MISMATCH_${sourceOrdinal}`);
    rows.push({ ordinal: rows.length, sourceOrdinal, rawJson, parsed });
  }
  return rows;
}
function buildPackets(rows) {
  if (rows.length !== STEP8G_VIARD_V8013_CHILD_COUNT) throw new Error(`EXPECTED_${STEP8G_VIARD_V8013_CHILD_COUNT}_GOT_${rows.length}`);
  const seen = new Set();
  return rows.map(row => {
    const sourceSlug = slug(row.parsed.slug || row.parsed.title || String(row.sourceOrdinal));
    const recipeId = `${SOURCE.idPrefix}${sourceSlug}`;
    if (!sourceSlug || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: SOURCE.packetSchema,
      canonicalRecipeId: recipeId,
      source: {
        cohortId: SOURCE.cohortId,
        repository: SOURCE_REPOSITORY,
        commit: SOURCE_COMMIT,
        path: `collections/${SOURCE.collection}/recipes.jsonl`,
        rowOrdinal: row.sourceOrdinal,
        sourceContentSha256: sha256(row.rawJson),
        sourceWork: SOURCE.sourceTitle,
        sourceAuthor: SOURCE.sourceAuthor,
        sourceAuthorClassification: SOURCE.sourceAuthorClassification,
        sourceAuthorDisplay: SOURCE.sourceAuthorDisplay,
        workFirstPublicationYear: SOURCE.workFirstPublicationYear,
        sourceYearSemantics: SOURCE.sourceYearSemantics,
        digitizedEditionYear: SOURCE.digitizedEditionYear,
        digitizedEditionLabel: SOURCE.digitizedEditionLabel,
        sourceYear: SOURCE.sourceYear,
        sourceUrl: SOURCE.sourceUrl,
        licenseId: SOURCE.license,
        historicalCollectionLabel: SOURCE.collection,
        repositoryLayerLicense: "Unlicense"
      },
      sourceContent: {
        rawJson: row.rawJson,
        title: row.parsed.title,
        slug: row.parsed.slug,
        parsedIngredientsNonAuthoritative: row.parsed.ingredients,
        parsedDirectionsNonAuthoritative: row.parsed.directions
      },
      authority: {
        recommendationAdmissionAuthorized: false,
        publicRuntimeActivationAuthorized: false,
        ingredientOntologyAuthority: false,
        nutritionAuthority: false,
        dietaryAllergenAuthority: false,
        scalingAuthority: false,
        culturalAuthenticityAuthority: false,
        historicalSourceLabelOnly: true,
        knowledgeCoreWriteAuthorized: false
      }
    };
    const bodyJson = JSON.stringify(packet);
    return {
      ordinal: row.ordinal,
      sourceOrdinal: row.sourceOrdinal,
      recipeId,
      sourceCohortId: SOURCE.cohortId,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: utf8Bytes(bodyJson)
    };
  });
}
function buildPlan(packets) {
  return buildStep8APopulationPlan({
    corpusVersion: STEP8G_VIARD_V8013_LAYER_VERSION,
    parentCorpusVersion: STEP8G_VIARD_V8013_PARENT_VERSION,
    sourceCohorts: [{
      id: SOURCE.cohortId,
      sourceName: `${SOURCE.sourceTitle} (${SOURCE.expectedRecipeCount}-record rights-cleared historical cohort)`,
      sourceVersion: SOURCE_COMMIT,
      admissionState: "STEP_8G_ORA_VIARD_1806_MEASUREMENT_EARNED_COHORT_CANDIDATE",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/viard-1806-v8012-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_VIARD_1806_RIGHTS_AND_MEASUREMENT.md",
        SOURCE.sourceUrl,
        `https://github.com/${SOURCE_REPOSITORY}/tree/${SOURCE_COMMIT}/collections/${SOURCE.collection}`
      ]
    }],
    entries: packets.map(({ bodyJson, sourceOrdinal, ...descriptor }) => descriptor),
    recipeShardCount: STEP8G_SHARD_COUNT,
    rowsPerWriteBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH
  });
}
function chunk(values, size) {
  const out = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}
function routeHashesForPlan(plan) {
  const allEntries = plan.batches.flatMap(batch => batch.entries.map(entry => ({
    recipeId: entry.recipeId,
    corpusVersion: STEP8G_VIARD_V8013_LAYER_VERSION,
    shardNumber: batch.shardNumber,
    sourceCohortId: entry.sourceCohortId,
    bodySha256: entry.bodySha256,
    bodyBytes: entry.bodyBytes
  })));
  return Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) =>
    chunk(allEntries.filter(entry => entry.shardNumber === shardNumber).sort((a,b) => a.recipeId.localeCompare(b.recipeId)), STEP8G_MAX_ROWS_PER_WRITE_BATCH)
      .map(entries => sha256(JSON.stringify({
        compositionVersion: STEP8G_VIARD_V8013_LAYER_VERSION,
        corpusVersion: STEP8G_VIARD_V8013_LAYER_VERSION,
        shardNumber,
        entries
      })))
      .join("")
  );
}

const args = parseArgs(process.argv.slice(2));
const oraRoot = resolve(args.ora);
const sourceCommit = execFileSync("git", ["-C", oraRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (sourceCommit !== SOURCE_COMMIT) throw new Error("ORA_SOURCE_PIN_MISMATCH");

const rows = await loadRows(oraRoot);
const packets = buildPackets(rows);
const plan = buildPlan(packets);
if (plan.manifest.recipeCount !== STEP8G_VIARD_V8013_CHILD_COUNT) throw new Error("V8012_CHILD_COUNT_MISMATCH");
if (STEP8G_VIARD_V8013_PARENT_COUNT + plan.manifest.recipeCount !== STEP8G_VIARD_V8013_COMPOSED_COUNT) throw new Error("V8012_COMPOSED_COUNT_MISMATCH");

const bodyHashHexByShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) =>
  plan.batches.filter(batch => batch.shardNumber === shardNumber).map(batch => batch.expectedSha256).join("")
);
const bodyShardRows = plan.manifest.recipeBodyShards.descriptors.map(row => row.rowCount);
const routeHashHexByShard = routeHashesForPlan(plan);
const descriptor = {
  sourceCommit: SOURCE_COMMIT,
  layerManifestSha256: plan.manifest.manifestSha256,
  populationPlanSha256: plan.populationPlanSha256,
  bodyHashHexByShard,
  routeHashHexByShard,
  bodyShardRows,
  parentCompositionRouteCount: STEP8G_VIARD_V8013_PARENT_COUNT,
  composedRouteCount: STEP8G_VIARD_V8013_COMPOSED_COUNT
};

const outputPath = resolve(args.output);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `export const STEP8G_V8013_RUNTIME_DESCRIPTOR=Object.freeze(${JSON.stringify(descriptor)});\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  pass: true,
  output: args.output,
  recipeCount: plan.manifest.recipeCount,
  bodyBatchCount: plan.batches.length,
  routeBatchCount: routeHashHexByShard.reduce((sum, value) => sum + value.length / 64, 0),
  bodyShardRows,
  layerManifestSha256: descriptor.layerManifestSha256,
  populationPlanSha256: descriptor.populationPlanSha256,
  sourceCommit: descriptor.sourceCommit,
  containsRecipeBodies: false
}, null, 2)}\n`);
