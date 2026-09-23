import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";

const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const norm = value => String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const finite = value => typeof value === "number" && Number.isFinite(value);

function argsOf(argv) {
  const out = { config: "config/corpus_normalization_baseline_v1.json", unitools: null, forkrecipe: null, cc0: null, ora: null, output: ".tmp/corpus-normalization-baseline.json" };
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (Object.hasOwn(out, key)) out[key] = rest.join("=");
    else throw new Error("UNKNOWN_ARGUMENT_" + arg);
  }
  for (const key of ["unitools","forkrecipe","cc0","ora"]) if (!out[key]) throw new Error(key.toUpperCase() + "_ROOT_REQUIRED");
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

function oraStructure(row) {
  const ingredients = section(row.body, "Ingredients").split(/\r?\n/).filter(line => /^\s*[-*+]\s+/.test(line));
  const directions = section(row.body, "(?:Directions|Instructions|Method)").split(/\r?\n/).filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line));
  return { ingredients: ingredients.length, directions: directions.length };
}

function emptySignals() {
  return {
    country: null, cuisine: null, culture: null, category: null, tags: [], diets: [],
    difficulty: null, timeKnown: false, servingsKnown: false, collection: null
  };
}

function standardized({ layer, cohortId, sourceSystem, title, ingredientCount, directionCount, signals }) {
  return {
    layer, cohortId, sourceSystem,
    titleKnown: nonEmpty(title),
    ingredientCount: Number(ingredientCount || 0),
    directionCount: Number(directionCount || 0),
    signals: { ...emptySignals(), ...signals }
  };
}

async function loadUnitools(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("UNITOOLS_PIN_MISMATCH");
  const dataset = JSON.parse(await readFile(resolve(root, cfg.dataPath), "utf8"));
  if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== cfg.expectedCount) throw new Error("UNITOOLS_COUNT_MISMATCH");
  return dataset.recipes.map(recipe => standardized({
    layer: cfg.layer, cohortId: cfg.cohortId, sourceSystem: "UNITOOLS",
    title: recipe.name?.en || recipe.nativeName || recipe.slug,
    ingredientCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
    directionCount: Array.isArray(recipe.steps) ? recipe.steps.length : 0,
    signals: {
      country: recipe.country ?? null,
      category: recipe.category ?? null,
      diets: Array.isArray(recipe.diets) ? recipe.diets : [],
      difficulty: recipe.difficulty ?? null,
      timeKnown: finite(recipe.prepMinutes) || finite(recipe.cookMinutes),
      servingsKnown: finite(recipe.baseServings)
    }
  }));
}

async function loadForkrecipe(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("FORKRECIPE_PIN_MISMATCH");
  const dir = resolve(root, cfg.recipesPath);
  const files = (await readdir(dir)).filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js").sort();
  const rows = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(resolve(dir, file)).href);
    const recipe = mod.default || {};
    rows.push(standardized({
      layer: cfg.layer, cohortId: cfg.cohortId, sourceSystem: "FORKRECIPE",
      title: recipe.title || recipe.slug,
      ingredientCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
      directionCount: Array.isArray(recipe.processNodes) ? recipe.processNodes.length : 0,
      signals: {
        cuisine: recipe.cuisine ?? null,
        culture: recipe.culture ?? null,
        category: recipe.category ?? null,
        tags: Array.isArray(recipe.tags) ? recipe.tags : [],
        difficulty: recipe.difficulty ?? null,
        timeKnown: nonEmpty(recipe.activeTime) || nonEmpty(recipe.totalTime)
      }
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
    rows.push(standardized({
      layer: cfg.layer, cohortId: cfg.cohortId, sourceSystem: "CC0_MARKDOWN",
      title: parsed.title,
      ingredientCount: parsed.ingredients.length,
      directionCount: parsed.directions.length,
      signals: { tags: parsed.tags }
    }));
  }
  if (rows.length !== cfg.expectedCount) throw new Error("CC0_COUNT_MISMATCH_" + rows.length);
  return rows;
}

function parseOraMarkdown(markdown) {
  const text = String(markdown ?? "");
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text);
  const meta = {};
  for (const line of (match?.[1] || "").split(/\r?\n/)) {
    const field = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    let value = field[2].trim();
    if (/^\[.*\]$/.test(value)) {
      try { value = JSON.parse(value); } catch {}
    } else value = value.replace(/^(["'])(.*)\1$/, "$2");
    meta[field[1]] = value;
  }
  return {
    meta,
    ingredients: section(text, "Ingredients").split(/\r?\n/).filter(line => /^\s*[-*+]\s+/.test(line)).length,
    directions: section(text, "(?:Directions|Instructions|Method)").split(/\r?\n/).filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line)).length
  };
}

async function loadOra(root, cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("ORA_PIN_MISMATCH");
  const jsonlByCollection = new Map();
  const output = [];
  for (const cohort of cfg.cohorts) {
    if (cohort.representation === "markdown") {
      const dir = resolve(root, "collections", cohort.collection, "recipes");
      const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
      const selected = [];
      for (const file of files) {
        const parsed = parseOraMarkdown(await readFile(resolve(dir, file), "utf8"));
        const meta = parsed.meta;
        if (String(meta.source_url ?? "") === cohort.sourceUrl &&
            String(meta.source_title ?? "") === cohort.sourceTitle &&
            String(meta.source_year ?? "") === cohort.sourceYear &&
            String(meta.license ?? "") === "public-domain") selected.push(parsed);
      }
      if (selected.length !== cohort.expectedCount) throw new Error("ORA_MARKDOWN_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
      for (const row of selected) {
        output.push(standardized({
          layer: cohort.layer, cohortId: cohort.cohortId, sourceSystem: "OPEN_RECIPE_ARCHIVE_MARKDOWN",
          title: row.meta.title,
          ingredientCount: row.ingredients,
          directionCount: row.directions,
          signals: {
            culture: row.meta.culture ?? null,
            tags: Array.isArray(row.meta.tags) ? row.meta.tags : [],
            collection: row.meta.collection ?? cohort.collection
          }
        }));
      }
      continue;
    }

    let rows = jsonlByCollection.get(cohort.collection);
    if (!rows) {
      const text = await readFile(resolve(root, "collections", cohort.collection, "recipes.jsonl"), "utf8");
      rows = text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
      jsonlByCollection.set(cohort.collection, rows);
    }
    const selected = rows.filter(row =>
      String(row.source_url ?? "") === cohort.sourceUrl &&
      String(row.source_title ?? "") === cohort.sourceTitle &&
      String(row.source_year ?? "") === cohort.sourceYear &&
      String(row.license ?? "") === "public-domain"
    );
    if (selected.length !== cohort.expectedCount) throw new Error("ORA_JSONL_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
    for (const row of selected) {
      const structure = oraStructure(row);
      output.push(standardized({
        layer: cohort.layer, cohortId: cohort.cohortId, sourceSystem: "OPEN_RECIPE_ARCHIVE_JSONL",
        title: row.title,
        ingredientCount: structure.ingredients,
        directionCount: structure.directions,
        signals: {
          culture: row.culture ?? null,
          tags: Array.isArray(row.tags) ? row.tags : [],
          collection: row.collection ?? cohort.collection
        }
      }));
    }
  }
  return output;
}

function ratio(n, d) { return d ? Number((n / d).toFixed(6)) : 0; }
function inc(map, value) {
  const key = norm(value);
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}
function top(map, limit = 25) {
  return [...map.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([value,count]) => ({ value, count }));
}

function summarize(records) {
  const total = records.length;
  const fields = ["country","cuisine","culture","category","difficulty","collection"];
  const signalMaps = Object.fromEntries(fields.map(field => [field, new Map()]));
  signalMaps.tags = new Map();
  signalMaps.diets = new Map();
  const coverage = Object.fromEntries([...fields,"tags","diets","time","servings"].map(key => [key,0]));
  let titleKnown=0, structural=0;
  for (const record of records) {
    if (record.titleKnown) titleKnown++;
    if (record.titleKnown && record.ingredientCount > 0 && record.directionCount > 0) structural++;
    for (const field of fields) {
      if (nonEmpty(record.signals[field]) || typeof record.signals[field] === "number") {
        coverage[field]++;
        inc(signalMaps[field], record.signals[field]);
      }
    }
    if (record.signals.tags.length) coverage.tags++;
    for (const value of record.signals.tags) inc(signalMaps.tags, value);
    if (record.signals.diets.length) coverage.diets++;
    for (const value of record.signals.diets) inc(signalMaps.diets, value);
    if (record.signals.timeKnown) coverage.time++;
    if (record.signals.servingsKnown) coverage.servings++;
  }
  const taxonomy = {};
  for (const [field,map] of Object.entries(signalMaps)) {
    taxonomy[field] = {
      recordCoverageCount: coverage[field],
      recordCoverageRatio: ratio(coverage[field], total),
      distinctNormalizedValueCount: map.size,
      singletonValueCount: [...map.values()].filter(count => count === 1).length,
      topValues: top(map)
    };
  }
  taxonomy.time = { recordCoverageCount: coverage.time, recordCoverageRatio: ratio(coverage.time,total) };
  taxonomy.servings = { recordCoverageCount: coverage.servings, recordCoverageRatio: ratio(coverage.servings,total) };

  const valueSignals = new Map();
  for (const field of ["country","cuisine","culture","category","tags","diets","collection"]) {
    for (const value of signalMaps[field].keys()) {
      if (!valueSignals.has(value)) valueSignals.set(value, new Set());
      valueSignals.get(value).add(field);
    }
  }
  const collisions = [...valueSignals.entries()]
    .filter(([,signals]) => signals.size > 1)
    .sort((a,b) => b[1].size-a[1].size || a[0].localeCompare(b[0]))
    .slice(0,50)
    .map(([value,signals]) => ({ value, signals:[...signals].sort() }));

  return {
    recipeCount: total,
    titleKnownCount: titleKnown,
    titleKnownRatio: ratio(titleKnown,total),
    structurallyParseableCount: structural,
    structurallyParseableRatio: ratio(structural,total),
    rawSignalCoverage: taxonomy,
    crossSignalNormalizedValueCollisions: collisions
  };
}

function groupSummaries(records) {
  const byCohort = new Map();
  const byLayer = new Map();
  for (const row of records) {
    if (!byCohort.has(row.cohortId)) byCohort.set(row.cohortId, []);
    byCohort.get(row.cohortId).push(row);
    if (!byLayer.has(row.layer)) byLayer.set(row.layer, []);
    byLayer.get(row.layer).push(row);
  }
  return {
    cohorts: [...byCohort.entries()].map(([cohortId,rows]) => ({ cohortId, layer: rows[0].layer, sourceSystem: rows[0].sourceSystem, ...summarize(rows) }))
      .sort((a,b) => a.layer.localeCompare(b.layer) || a.cohortId.localeCompare(b.cohortId)),
    layers: [...byLayer.entries()].map(([layer,rows]) => ({ layer, ...summarize(rows) })).sort((a,b) => a.layer.localeCompare(b.layer))
  };
}

const args = argsOf(process.argv.slice(2));
const config = JSON.parse(await readFile(resolve(args.config), "utf8"));
const records = [
  ...await loadUnitools(resolve(args.unitools), config.sources.unitools),
  ...await loadForkrecipe(resolve(args.forkrecipe), config.sources.forkrecipe),
  ...await loadCc0(resolve(args.cc0), config.sources.cc0),
  ...await loadOra(resolve(args.ora), config.sources.ora)
];

const grouped = groupSummaries(records);
const corpus = summarize(records);
const expectedCohortCounts = new Map([
  [config.sources.unitools.cohortId, config.sources.unitools.expectedCount],
  [config.sources.forkrecipe.cohortId, config.sources.forkrecipe.expectedCount],
  [config.sources.cc0.cohortId, config.sources.cc0.expectedCount],
  ...config.sources.ora.cohorts.map(row => [row.cohortId,row.expectedCount])
]);
const countMismatches = grouped.cohorts
  .filter(row => expectedCohortCounts.get(row.cohortId) !== row.recipeCount)
  .map(row => ({ cohortId: row.cohortId, expected: expectedCohortCounts.get(row.cohortId), actual: row.recipeCount }));

const pass = records.length === config.expectedRecipeCount &&
  countMismatches.length === 0 &&
  corpus.titleKnownCount === records.length &&
  corpus.structurallyParseableCount === records.length;

const output = {
  schemaVersion:"CULINARY_CORPUS_NORMALIZATION_BASELINE_AUDIT_V1",
  date:"2026-09-23",
  pass,
  terminal: pass ? "CORPUS_NORMALIZATION_CATEGORIZATION_BASELINE_PASS" : "CORPUS_NORMALIZATION_CATEGORIZATION_BASELINE_FAIL",
  protectedCorpusVersion:config.protectedCorpusVersion,
  expectedRecipeCount:config.expectedRecipeCount,
  observedRecipeCount:records.length,
  sourcePins:{
    unitools:config.sources.unitools.commit,
    forkrecipe:config.sources.forkrecipe.commit,
    cc0:config.sources.cc0.commit,
    ora:config.sources.ora.commit
  },
  countMismatches,
  corpus,
  ...grouped,
  canonicalTaxonomyAuthorityCoverage:{
    geographyCountry:0,
    geographyRegion:0,
    culinaryTradition:0,
    dishCategory:0,
    mealRoles:0,
    techniqueFamilies:0,
    difficulty:0,
    normalizedTime:0,
    normalizedServings:0,
    reviewedDietaryTags:0,
    note:"Counts are zero because protected source metadata remains source-hint/provenance material until a separate reviewed mapping earns canonical app authority. This does not mean source hints are absent."
  },
  interpretation:{
    titleAndStructureReadyForNormalization: corpus.structurallyParseableCount === records.length,
    rawSignalCoverageIsHeterogeneous:true,
    sourceSchemasAreNotSemanticallyInterchangeable:true,
    tagsRequireControlledMapping:true,
    collectionLabelsAreProvenanceOnly:true,
    unknownAndAmbiguousMustRemainExplicit:true,
    firstImplementationShouldBeNonDestructiveOverlay:true
  },
  proposedNextGate:{
    id:"CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1",
    requiredMappingStates:config.mappingStates,
    canonicalDimensions:config.proposedCanonicalDimensions,
    acceptanceCriteria:config.acceptanceCriteria,
    firstImplementationScope:[
      "versioned normalization overlay only",
      "exact/reviewed mappings for low-ambiguity geography, time, servings and difficulty",
      "separate controlled vocabularies for dish category and meal role",
      "source culture/cuisine/tag values retained as hints and provenance",
      "no protected body rewrite and no recommendation behavior change"
    ]
  },
  boundaries:{
    d1ReadsPerformed:0,
    d1WritesPerformed:0,
    protectedBodiesExported:0,
    publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,
    nutritionLaneModified:false,
    youtubeLaneModified:false,
    knowledgeCoreWritePerformed:false,
    billingExpansion:false,
    thirdShardUsed:false
  }
};

await mkdir(dirname(resolve(args.output)), { recursive:true });
await writeFile(resolve(args.output), JSON.stringify(output,null,2) + "\n", "utf8");
process.stdout.write(JSON.stringify({ pass:output.pass, terminal:output.terminal, observedRecipeCount:output.observedRecipeCount, deficientCohorts:output.cohorts.filter(row => row.structurallyParseableCount !== row.recipeCount), corpus:output.corpus, canonicalTaxonomyAuthorityCoverage:output.canonicalTaxonomyAuthorityCoverage, boundaries:output.boundaries }, null, 2) + "\n");
if (!pass) process.exitCode=1;
