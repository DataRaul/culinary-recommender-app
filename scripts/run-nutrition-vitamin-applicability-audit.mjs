import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import {
  cleanIngredientIdentityCandidate,
  exactIdentityAudit,
  prepareUnitoolsNutritionCandidate,
  compactCoverageAudit,
  detectTrackedNutrientKeys,
  classifyVitaminMineralCapability
} from "./nutrition-vitamin-applicability-core.mjs";
import { AUTHORED_RECIPES, ALL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

function argsOf(argv) {
  const out = {
    baseline: "config/corpus_normalization_baseline_v1.json",
    contract: "config/nutrition_vitamin_applicability_audit_v1.json",
    unitools: null,
    forkrecipe: null,
    cc0: null,
    ora: null,
    output: ".tmp/nutrition-vitamin-applicability-audit-v1-full.json",
    summary: ".tmp/nutrition-vitamin-applicability-audit-v1.json"
  };
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (!Object.hasOwn(out, key)) throw new Error("UNKNOWN_ARGUMENT_" + arg);
    out[key] = rest.join("=");
  }
  for (const key of ["unitools", "forkrecipe", "cc0", "ora"]) {
    if (!out[key]) throw new Error(key.toUpperCase() + "_ROOT_REQUIRED");
  }
  return out;
}

function commitAt(root) {
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function section(body, headingPattern) {
  const match = new RegExp("^##\\s+" + headingPattern + "\\s*$", "im").exec(String(body ?? ""));
  if (!match) return "";
  const rest = String(body).slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function rawIngredientLines(body) {
  return section(body, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line));
}

function parseFrontMatter(markdown) {
  const text = String(markdown ?? "");
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text);
  const meta = {};
  for (const line of (match?.[1] || "").split(/\r?\n/)) {
    const field = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    let value = field[2].trim();
    if (/^\[.*\]$/.test(value)) {
      try { value = JSON.parse(value); } catch {}
    } else {
      value = value.replace(/^(["'])(.*)\1$/, "$2");
    }
    meta[field[1]] = value;
  }
  return meta;
}

function baseRecord({ layer, cohortId, sourceSystem, sourceRecordKey, identityNames, cleanIdentityNames, quantityModel }) {
  const identity = exactIdentityAudit(identityNames, { clean: cleanIdentityNames });
  return {
    layer,
    cohortId,
    sourceSystem,
    sourceRecordKey: String(sourceRecordKey ?? ""),
    ingredientOccurrenceCount: identity.occurrenceCount,
    resolvedIngredientOccurrenceCount: identity.resolvedOccurrenceCount,
    unresolvedIngredientOccurrenceCount: identity.unresolvedOccurrenceCount,
    allIngredientIdentitiesResolved: identity.allResolved,
    quantityModel,
    identityRows: identity.rows
  };
}

async function loadUnitools(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("UNITOOLS_PIN_MISMATCH");
  const dataset = JSON.parse(await readFile(resolve(root, cfg.dataPath), "utf8"));
  if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== cfg.expectedCount) {
    throw new Error("UNITOOLS_COUNT_MISMATCH");
  }
  return dataset.recipes.map(recipe => ({
    ...baseRecord({
      layer: cfg.layer,
      cohortId: cfg.cohortId,
      sourceSystem: "UNITOOLS",
      sourceRecordKey: recipe.slug,
      identityNames: (recipe.ingredients || []).map(item => item?.name?.en).filter(Boolean),
      cleanIdentityNames: false,
      quantityModel: "STRUCTURED_QUANTITY_UNIT_AND_SERVINGS_PRESENT_AT_SOURCE"
    }),
    unitoolsSourceRecipe: recipe
  }));
}

async function loadForkrecipe(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("FORKRECIPE_PIN_MISMATCH");
  const dir = resolve(root, cfg.recipesPath);
  const files = (await readdir(dir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const rows = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(resolve(dir, file)).href);
    const recipe = mod.default || {};
    rows.push(baseRecord({
      layer: cfg.layer,
      cohortId: cfg.cohortId,
      sourceSystem: "FORKRECIPE",
      sourceRecordKey: file,
      identityNames: (recipe.ingredients || []).map(item => item?.name).filter(Boolean),
      cleanIdentityNames: false,
      quantityModel: "RATIO_PARTS_ONLY_NO_ABSOLUTE_MASS_OR_SERVINGS"
    }));
  }
  if (rows.length !== cfg.expectedCount) throw new Error("FORKRECIPE_COUNT_MISMATCH_" + rows.length);
  return rows;
}

async function loadCc0(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("CC0_PIN_MISMATCH");
  const dir = resolve(root, cfg.recipesPath);
  const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
  const rows = [];
  for (const file of files) {
    const parsed = parseCc0MarkdownRecipe(await readFile(resolve(dir, file), "utf8"), { fileName: file });
    rows.push(baseRecord({
      layer: cfg.layer,
      cohortId: cfg.cohortId,
      sourceSystem: "CC0_MARKDOWN",
      sourceRecordKey: file,
      identityNames: parsed.ingredients,
      cleanIdentityNames: false,
      quantityModel: "RAW_TEXT_AMOUNT_STRIPPED_BY_CURRENT_PARSER_NO_CANONICAL_QUANTITY_OBJECT"
    }));
  }
  if (rows.length !== cfg.expectedCount) throw new Error("CC0_COUNT_MISMATCH_" + rows.length);
  return rows;
}

async function loadOra(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("ORA_PIN_MISMATCH");
  const output = [];
  const jsonlByCollection = new Map();

  for (const cohort of cfg.cohorts) {
    if (cohort.representation === "markdown") {
      const dir = resolve(root, "collections", cohort.collection, "recipes");
      const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
      const selected = [];
      for (const file of files) {
        const markdown = await readFile(resolve(dir, file), "utf8");
        const meta = parseFrontMatter(markdown);
        if (
          String(meta.source_url ?? "") === cohort.sourceUrl &&
          String(meta.source_title ?? "") === cohort.sourceTitle &&
          String(meta.source_year ?? "") === cohort.sourceYear &&
          String(meta.license ?? "") === "public-domain"
        ) {
          selected.push({ file, markdown });
        }
      }
      if (selected.length !== cohort.expectedCount) {
        throw new Error("ORA_MARKDOWN_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
      }
      for (const item of selected) {
        output.push(baseRecord({
          layer: cohort.layer,
          cohortId: cohort.cohortId,
          sourceSystem: "OPEN_RECIPE_ARCHIVE_MARKDOWN",
          sourceRecordKey: item.file,
          identityNames: rawIngredientLines(item.markdown),
          cleanIdentityNames: true,
          quantityModel: "RAW_TEXT_QUANTITY_NOT_CANONICALIZED"
        }));
      }
      continue;
    }

    let rows = jsonlByCollection.get(cohort.collection);
    if (!rows) {
      rows = (await readFile(resolve(root, "collections", cohort.collection, "recipes.jsonl"), "utf8"))
        .split(/\r?\n/)
        .filter(Boolean)
        .map(JSON.parse);
      jsonlByCollection.set(cohort.collection, rows);
    }

    const selected = rows.filter(row =>
      String(row.source_url ?? "") === cohort.sourceUrl &&
      String(row.source_title ?? "") === cohort.sourceTitle &&
      String(row.source_year ?? "") === cohort.sourceYear &&
      String(row.license ?? "") === "public-domain"
    );
    if (selected.length !== cohort.expectedCount) {
      throw new Error("ORA_JSONL_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
    }
    for (const row of selected) {
      output.push(baseRecord({
        layer: cohort.layer,
        cohortId: cohort.cohortId,
        sourceSystem: "OPEN_RECIPE_ARCHIVE_JSONL",
        sourceRecordKey: row.slug || row.title,
        identityNames: rawIngredientLines(row.body),
        cleanIdentityNames: true,
        quantityModel: "RAW_TEXT_QUANTITY_NOT_CANONICALIZED"
      }));
    }
  }

  return output;
}

function ratio(n, d) {
  return d ? Number((n / d).toFixed(6)) : 0;
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function sortedObject(map) {
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function summarizeRows(rows) {
  const sourceSystemCounts = new Map();
  const quantityModelCounts = new Map();
  let ingredientOccurrences = 0;
  let resolvedIngredientOccurrences = 0;
  let recipesWithIngredients = 0;
  let recipesWithAllIngredientIdentitiesResolved = 0;
  let structuralIngredientEmpty = 0;

  for (const row of rows) {
    increment(sourceSystemCounts, row.sourceSystem);
    increment(quantityModelCounts, row.quantityModel);
    ingredientOccurrences += row.ingredientOccurrenceCount;
    resolvedIngredientOccurrences += row.resolvedIngredientOccurrenceCount;
    if (row.ingredientOccurrenceCount > 0) recipesWithIngredients += 1;
    else structuralIngredientEmpty += 1;
    if (row.allIngredientIdentitiesResolved) recipesWithAllIngredientIdentitiesResolved += 1;
  }

  return {
    recipeCount: rows.length,
    recipesWithIngredients,
    structuralIngredientEmpty,
    ingredientOccurrences,
    resolvedIngredientOccurrences,
    unresolvedIngredientOccurrences: ingredientOccurrences - resolvedIngredientOccurrences,
    resolvedIngredientOccurrenceRatio: ratio(resolvedIngredientOccurrences, ingredientOccurrences),
    recipesWithAllIngredientIdentitiesResolved,
    allIngredientIdentityReadyRatio: ratio(recipesWithAllIngredientIdentitiesResolved, rows.length),
    sourceSystemCounts: sortedObject(sourceSystemCounts),
    quantityModelCounts: sortedObject(quantityModelCounts)
  };
}

function groupedSummaries(rows) {
  const byLayer = new Map();
  const byCohort = new Map();
  for (const row of rows) {
    if (!byLayer.has(row.layer)) byLayer.set(row.layer, []);
    byLayer.get(row.layer).push(row);
    if (!byCohort.has(row.cohortId)) byCohort.set(row.cohortId, []);
    byCohort.get(row.cohortId).push(row);
  }
  return {
    layers: [...byLayer.entries()]
      .map(([layer, values]) => ({ layer, ...summarizeRows(values) }))
      .sort((a, b) => a.layer.localeCompare(b.layer)),
    cohorts: [...byCohort.entries()]
      .map(([cohortId, values]) => ({ cohortId, layer: values[0].layer, ...summarizeRows(values) }))
      .sort((a, b) => a.layer.localeCompare(b.layer) || a.cohortId.localeCompare(b.cohortId))
  };
}

function unitoolsEngineAudit(rows) {
  const blockerCounts = new Map();
  const sourceSelectionStateCounts = new Map();
  const evidenceStateCounts = new Map();
  const authoritativeRecipeKeys = [];
  const readyRecipeKeys = [];
  const detail = [];

  for (const row of rows.filter(item => item.sourceSystem === "UNITOOLS")) {
    const prepared = prepareUnitoolsNutritionCandidate(row.unitoolsSourceRecipe);
    if (!prepared.ready) {
      for (const blocker of prepared.blockers) increment(blockerCounts, blocker.reason);
      detail.push({
        sourceRecordKey: row.sourceRecordKey,
        readyForCurrentEngine: false,
        blockerReasons: [...new Set(prepared.blockers.map(item => item.reason))].sort()
      });
      continue;
    }

    readyRecipeKeys.push(row.sourceRecordKey);
    const estimate = publicNutritionSource.estimate(prepared.recipe);
    const sourceSelectionState = estimate?.evidence?.sourceSelectionState || "UNKNOWN";
    const evidenceState = estimate?.evidence?.state || "UNKNOWN";
    increment(sourceSelectionStateCounts, sourceSelectionState);
    increment(evidenceStateCounts, evidenceState);
    const authoritative = evidenceState === "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE";
    if (authoritative) authoritativeRecipeKeys.push(row.sourceRecordKey);
    detail.push({
      sourceRecordKey: row.sourceRecordKey,
      readyForCurrentEngine: true,
      authoritative,
      sourceSelectionState,
      evidenceState,
      calculationState: estimate?.evidence?.staticCalculation?.calculationState || null,
      skippedReasonCounts: sortedObject((estimate?.evidence?.staticCalculation?.skipped || []).reduce((map, item) => {
        increment(map, item.reason || "unknown");
        return map;
      }, new Map()))
    });
  }

  return {
    sourceRecipeCount: rows.filter(item => item.sourceSystem === "UNITOOLS").length,
    structurallyReadyForCurrentEngineCount: readyRecipeKeys.length,
    authoritativeCurrentEngineCount: authoritativeRecipeKeys.length,
    structurallyReadyRatio: ratio(readyRecipeKeys.length, rows.filter(item => item.sourceSystem === "UNITOOLS").length),
    authoritativeRatio: ratio(authoritativeRecipeKeys.length, rows.filter(item => item.sourceSystem === "UNITOOLS").length),
    blockerCounts: sortedObject(blockerCounts),
    sourceSelectionStateCounts: sortedObject(sourceSelectionStateCounts),
    evidenceStateCounts: sortedObject(evidenceStateCounts),
    readyRecipeKeys: readyRecipeKeys.sort(),
    authoritativeRecipeKeys: authoritativeRecipeKeys.sort(),
    detail
  };
}

const args = argsOf(process.argv.slice(2));
const baseline = JSON.parse(await readFile(resolve(args.baseline), "utf8"));
const contract = JSON.parse(await readFile(resolve(args.contract), "utf8"));

const rows = [
  ...await loadUnitools(resolve(args.unitools), baseline.sources.unitools),
  ...await loadForkrecipe(resolve(args.forkrecipe), baseline.sources.forkrecipe),
  ...await loadCc0(resolve(args.cc0), baseline.sources.cc0),
  ...await loadOra(resolve(args.ora), baseline.sources.ora)
];

const expectedContracts = [
  baseline.sources.unitools,
  baseline.sources.forkrecipe,
  baseline.sources.cc0,
  ...baseline.sources.ora.cohorts
];
const expectedCounts = new Map(expectedContracts.map(item => [item.cohortId, item.expectedCount]));
const observedByCohort = new Map();
for (const row of rows) increment(observedByCohort, row.cohortId);
const cohortCountChecks = expectedContracts.map(item => ({
  cohortId: item.cohortId,
  expectedCount: item.expectedCount,
  observedCount: observedByCohort.get(item.cohortId) || 0,
  pass: (observedByCohort.get(item.cohortId) || 0) === item.expectedCount
}));

const grouped = groupedSummaries(rows);
const protectedCorpus = summarizeRows(rows);
const unitoolsEngine = unitoolsEngineAudit(rows);

const authoredCoverage = compactCoverageAudit(buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource));
const goldenCoverage = compactCoverageAudit(buildNutritionCoverageAudit(ALL_RECIPES, publicNutritionSource));
const publicRuntimeCoverage = compactCoverageAudit(buildNutritionCoverageAudit(PUBLIC_RUNTIME_RECIPES, publicNutritionSource));

const nutritionModuleText = await readFile(resolve("src/domain/nutrition.js"), "utf8");
const trackedNutrientKeys = detectTrackedNutrientKeys(nutritionModuleText);
const vitaminMineral = classifyVitaminMineralCapability(trackedNutrientKeys);

const sourcePins = {
  unitools: baseline.sources.unitools.commit,
  forkrecipe: baseline.sources.forkrecipe.commit,
  cc0: baseline.sources.cc0.commit,
  ora: baseline.sources.ora.commit
};

const directCurrentEngineEligibleSources = {
  UNITOOLS: "MEASURED_WITH_ACTUAL_CURRENT_NUTRITION_ENGINE_AFTER_EXACT_IDENTITY_AND_STRUCTURED_QUANTITY_SERVING_GATE",
  FORKRECIPE: "BLOCKED_RATIO_PARTS_NO_ABSOLUTE_MASS_OR_SERVINGS",
  CC0_MARKDOWN: "BLOCKED_CURRENT_PARSER_DOES_NOT_PRESERVE_CANONICAL_STRUCTURED_QUANTITY_OBJECTS",
  OPEN_RECIPE_ARCHIVE_MARKDOWN: "BLOCKED_RAW_TEXT_QUANTITY_NOT_CANONICALIZED",
  OPEN_RECIPE_ARCHIVE_JSONL: "BLOCKED_RAW_TEXT_QUANTITY_NOT_CANONICALIZED"
};

const pass =
  rows.length === contract.expectedRecipeCount &&
  cohortCountChecks.length === expectedContracts.length &&
  cohortCountChecks.every(item => item.pass) &&
  trackedNutrientKeys.length > 0 &&
  publicRuntimeCoverage.recipeCount === PUBLIC_RUNTIME_RECIPES.length;

const boundaries = {
  d1ReadsPerformed: 0,
  d1WritesPerformed: 0,
  protectedBodiesExported: 0,
  protectedBodiesRewritten: 0,
  publicRuntimeChanged: false,
  recommendationAdmissionChanged: false,
  nutritionEvidenceAdded: false,
  nutritionRuntimeChanged: false,
  youtubeLaneModified: false,
  knowledgeCoreWritePerformed: false,
  billingExpansion: false,
  thirdShardUsed: false
};

const summary = {
  schemaVersion: "CULINARY_NUTRITION_VITAMIN_APPLICABILITY_AUDIT_SUMMARY_V1",
  date: "2026-09-23",
  pass,
  terminal: pass ? "NUTRITION_VITAMIN_APPLICABILITY_AUDIT_PASS" : "NUTRITION_VITAMIN_APPLICABILITY_AUDIT_FAIL",
  protectedCorpusVersion: contract.protectedCorpusVersion,
  expectedRecipeCount: contract.expectedRecipeCount,
  observedRecipeCount: rows.length,
  sourcePins,
  cohortCountChecks,
  currentPublicNutritionEngine: {
    authored: authoredCoverage,
    golden84: goldenCoverage,
    publicRuntime: publicRuntimeCoverage,
    trackedNutrientKeys
  },
  protectedCorpusApplicability: {
    ...protectedCorpus,
    layerApplicability: grouped.layers,
    cohortApplicability: grouped.cohorts,
    directCurrentEngineEligibleSources,
    unitoolsCurrentEngine: {
      sourceRecipeCount: unitoolsEngine.sourceRecipeCount,
      structurallyReadyForCurrentEngineCount: unitoolsEngine.structurallyReadyForCurrentEngineCount,
      authoritativeCurrentEngineCount: unitoolsEngine.authoritativeCurrentEngineCount,
      structurallyReadyRatio: unitoolsEngine.structurallyReadyRatio,
      authoritativeRatio: unitoolsEngine.authoritativeRatio,
      blockerCounts: unitoolsEngine.blockerCounts,
      sourceSelectionStateCounts: unitoolsEngine.sourceSelectionStateCounts,
      evidenceStateCounts: unitoolsEngine.evidenceStateCounts,
      readyRecipeKeys: unitoolsEngine.readyRecipeKeys,
      authoritativeRecipeKeys: unitoolsEngine.authoritativeRecipeKeys
    }
  },
  vitaminMineralApplicability: vitaminMineral,
  interpretation: {
    auditPassMeansCoverageComplete: false,
    exactIdentityReadinessIsDiagnosticOnly: true,
    ingredientIdentityReadinessDoesNotAuthorizeRecommendationAdmission: true,
    rawTextQuantityParsingNotPromotedToAuthority: true,
    sourceRecipeNutritionNotImportedAsAuthority: true,
    currentMacroAuthorityRequiresCompleteExistingEngineCalculation: true,
    vitaminMineralUnknownMustRemainExplicit: !vitaminMineral.vitaminMineralSchemaReady,
    recommendationReadinessMayUseThisAuditAsFailClosedInput: true
  },
  boundaries,
  nextGate: pass ? contract.nextGateOnPass : "REPAIR_NUTRITION_VITAMIN_APPLICABILITY_AUDIT"
};

const full = {
  ...summary,
  grouped,
  unitoolsCurrentEngineDetail: unitoolsEngine.detail,
  protectedCorpusRecipeDiagnostics: rows.map(row => ({
    layer: row.layer,
    cohortId: row.cohortId,
    sourceSystem: row.sourceSystem,
    sourceRecordKey: row.sourceRecordKey,
    ingredientOccurrenceCount: row.ingredientOccurrenceCount,
    resolvedIngredientOccurrenceCount: row.resolvedIngredientOccurrenceCount,
    unresolvedIngredientOccurrenceCount: row.unresolvedIngredientOccurrenceCount,
    allIngredientIdentitiesResolved: row.allIngredientIdentitiesResolved,
    quantityModel: row.quantityModel
  }))
};

await mkdir(dirname(resolve(args.output)), { recursive: true });
await mkdir(dirname(resolve(args.summary)), { recursive: true });
await writeFile(resolve(args.output), JSON.stringify(full, null, 2) + "\n", "utf8");
await writeFile(resolve(args.summary), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!pass) process.exitCode = 1;
