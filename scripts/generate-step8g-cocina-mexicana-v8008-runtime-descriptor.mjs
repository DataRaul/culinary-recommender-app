import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import { parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { STEP8G_SHARD_COUNT, STEP8G_MAX_ROWS_PER_WRITE_BATCH } from "./corpus-scale-step8g-population-core.mjs";
import {
  STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT,
  STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT,
  STEP8G_COCINA_MEXICANA_V8008_LAYER_VERSION,
  STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT,
  STEP8G_COCINA_MEXICANA_V8008_PARENT_VERSION
} from "./corpus-scale-step8g-cocina-mexicana-v8008-prewrite-core.mjs";

const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const SOURCE_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const COLLECTION = "cocina-mexicana";
const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(String(value)).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

const SOURCES = Object.freeze([
  Object.freeze({
    cohortId: "ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C",
    source_url: "https://archive.org/details/bub_gb_NdQqAAAAYAAJ",
    source_title: "Diccionario de cocina, ó El nuevo cocinero mexicano",
    author: "Mariano Galván Rivera",
    authorClassification: "IDENTIFIED_AUTHOR",
    source_year: "1845",
    license: "public-domain",
    expectedRecipeCount: 4347,
    idPrefix: "ora_galvan_rivera_1845_",
    packetSchema: "STEP8G_ORA_GALVAN_RIVERA_1845_PROTECTED_SOURCE_PACKET_V1"
  }),
  Object.freeze({
    cohortId: "ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C",
    source_url: "https://archive.org/details/lacocinerapobla00unkngoog",
    source_title: "La cocinera poblana",
    author: "",
    authorClassification: "AUTHOR_NOT_IDENTIFIED_INDEPENDENTLY_DOCUMENTED",
    source_year: "1890",
    license: "public-domain",
    expectedRecipeCount: 2129,
    idPrefix: "ora_cocinera_poblana_1890_",
    packetSchema: "STEP8G_ORA_COCINERA_POBLANA_1890_PROTECTED_SOURCE_PACKET_V1"
  })
]);

function parseArgs(argv) {
  const out = { ora: null, output: "data/generated/step8g/v8008-runtime-descriptor.mjs" };
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
  return SOURCES.find(source =>
    row.collection === COLLECTION &&
    row.source_url === source.source_url &&
    row.source_title === source.source_title &&
    String(row.author ?? "") === source.author &&
    String(row.source_year ?? "") === source.source_year &&
    row.license === source.license
  ) || null;
}

async function loadRows(root) {
  const text = await readFile(resolve(root, `collections/${COLLECTION}/recipes.jsonl`), "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (const [sourceOrdinal, rawJson] of lines.entries()) {
    const sourceRow = JSON.parse(rawJson);
    const source = sourceForRaw(sourceRow);
    if (!source) throw new Error(`UNCLASSIFIED_COCINA_MEXICANA_SOURCE_ROW_${sourceOrdinal}`);
    const parsed = parseOraJsonlRecipe(sourceRow);
    if (!parsed.quality.hasTitle || !parsed.quality.hasIngredients || !parsed.quality.hasDirections) throw new Error(`STRUCTURAL_SOURCE_MISMATCH_${sourceOrdinal}`);
    rows.push({ ordinal: rows.length, sourceOrdinal, rawJson, sourceRow, source, parsed });
  }
  return rows;
}

function buildPackets(rows) {
  if (rows.length !== STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT) throw new Error(`EXPECTED_${STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT}_GOT_${rows.length}`);
  for (const source of SOURCES) {
    const count = rows.filter(row => row.source.cohortId === source.cohortId).length;
    if (count !== source.expectedRecipeCount) throw new Error(`SOURCE_COUNT_${source.cohortId}_${count}`);
  }
  const seen = new Set();
  return rows.map(row => {
    const sourceSlug = slug(row.parsed.slug || row.parsed.title || String(row.sourceOrdinal));
    const recipeId = `${row.source.idPrefix}${sourceSlug}`;
    if (!sourceSlug || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: row.source.packetSchema,
      canonicalRecipeId: recipeId,
      source: {
        cohortId: row.source.cohortId,
        repository: SOURCE_REPOSITORY,
        commit: SOURCE_COMMIT,
        path: `collections/${COLLECTION}/recipes.jsonl`,
        rowOrdinal: row.sourceOrdinal,
        sourceContentSha256: sha256(row.rawJson),
        sourceWork: row.source.source_title,
        sourceAuthor: row.source.author,
        sourceAuthorClassification: row.source.authorClassification,
        sourceAuthorDisplay: row.source.author || "author not identified",
        sourceYear: row.source.source_year,
        sourceUrl: row.source.source_url,
        licenseId: row.source.license,
        historicalCollectionLabel: COLLECTION,
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
      sourceCohortId: row.source.cohortId,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: utf8Bytes(bodyJson)
    };
  });
}

function buildPlan(packets) {
  return buildStep8APopulationPlan({
    corpusVersion: STEP8G_COCINA_MEXICANA_V8008_LAYER_VERSION,
    parentCorpusVersion: STEP8G_COCINA_MEXICANA_V8008_PARENT_VERSION,
    sourceCohorts: SOURCES.map(source => ({
      id: source.cohortId,
      sourceName: `${source.source_title} (${source.expectedRecipeCount}-record rights-cleared historical cohort)`,
      sourceVersion: SOURCE_COMMIT,
      admissionState: "STEP_8G_COCINA_MEXICANA_MEASUREMENT_EARNED_SOURCE_COHORT",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/cocina-mexicana-v8007-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_COCINA_MEXICANA_SOURCE_AUDIT.md",
        `https://github.com/${SOURCE_REPOSITORY}/tree/${SOURCE_COMMIT}/collections/${COLLECTION}`
      ]
    })),
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
    corpusVersion: STEP8G_COCINA_MEXICANA_V8008_LAYER_VERSION,
    shardNumber: batch.shardNumber,
    sourceCohortId: entry.sourceCohortId,
    bodySha256: entry.bodySha256,
    bodyBytes: entry.bodyBytes
  })));
  return Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) =>
    chunk(allEntries.filter(entry => entry.shardNumber === shardNumber).sort((a, b) => a.recipeId.localeCompare(b.recipeId)), STEP8G_MAX_ROWS_PER_WRITE_BATCH)
      .map(entries => sha256(JSON.stringify({
        compositionVersion: STEP8G_COCINA_MEXICANA_V8008_LAYER_VERSION,
        corpusVersion: STEP8G_COCINA_MEXICANA_V8008_LAYER_VERSION,
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
if (plan.manifest.recipeCount !== STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT) throw new Error("V8008_CHILD_COUNT_MISMATCH");
if (STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT + plan.manifest.recipeCount !== STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT) throw new Error("V8008_COMPOSED_COUNT_MISMATCH");

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
  parentCompositionRouteCount: STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT,
  composedRouteCount: STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT
};

const outputPath = resolve(args.output);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `export const STEP8G_V8008_RUNTIME_DESCRIPTOR=Object.freeze(${JSON.stringify(descriptor)});\n`, "utf8");
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