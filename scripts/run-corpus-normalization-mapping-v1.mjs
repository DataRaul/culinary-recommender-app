import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { mapRecord, stateCounts, validateOverlayRecord } from "./corpus-normalization-mapping-v1-core.mjs";

const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const finite = value => typeof value === "number" && Number.isFinite(value);

function argsOf(argv) {
  const out = {
    baseline:"config/corpus_normalization_baseline_v1.json",
    mapping:"config/corpus_normalization_mapping_v1.json",
    unitools:null, forkrecipe:null, cc0:null, ora:null,
    output:".tmp/corpus-normalization-mapping-v1-full.json",
    summary:".tmp/corpus-normalization-mapping-v1.json"
  };
  for (const arg of argv) {
    const [key,...rest] = arg.replace(/^--/,"").split("=");
    if (!Object.hasOwn(out,key)) throw new Error("UNKNOWN_ARGUMENT_" + arg);
    out[key] = rest.join("=");
  }
  for (const key of ["unitools","forkrecipe","cc0","ora"]) if (!out[key]) throw new Error(key.toUpperCase() + "_ROOT_REQUIRED");
  return out;
}

function commitAt(root) {
  return execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
}

function section(body, headingPattern) {
  const match = new RegExp("^##\\s+" + headingPattern + "\\s*$","im").exec(String(body ?? ""));
  if (!match) return "";
  const rest = String(body).slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0,next.index) : rest).trim();
}

function record(base) {
  return {
    layer:base.layer,
    cohortId:base.cohortId,
    sourceSystem:base.sourceSystem,
    sourceRecordKey:String(base.sourceRecordKey ?? ""),
    titleKnown:nonEmpty(base.title),
    ingredientCount:Number(base.ingredientCount || 0),
    directionCount:Number(base.directionCount || 0),
    raw:{
      country:null, cuisine:null, culture:null, category:null, tags:[], diets:[],
      difficulty:null, prepMinutes:null, cookMinutes:null, totalMinutes:null,
      activeTime:null, totalTime:null, baseServings:null, collection:null,
      ...base.raw
    }
  };
}

async function loadUnitools(root,cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("UNITOOLS_PIN_MISMATCH");
  const dataset = JSON.parse(await readFile(resolve(root,cfg.dataPath),"utf8"));
  if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== cfg.expectedCount) throw new Error("UNITOOLS_COUNT_MISMATCH");
  return dataset.recipes.map(recipe => record({
    layer:cfg.layer, cohortId:cfg.cohortId, sourceSystem:"UNITOOLS", sourceRecordKey:recipe.slug,
    title:recipe.name?.en || recipe.nativeName || recipe.slug,
    ingredientCount:Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
    directionCount:Array.isArray(recipe.steps) ? recipe.steps.length : 0,
    raw:{
      country:recipe.country ?? null,
      category:recipe.category ?? null,
      diets:Array.isArray(recipe.diets) ? recipe.diets : [],
      difficulty:recipe.difficulty ?? null,
      prepMinutes:finite(recipe.prepMinutes) ? recipe.prepMinutes : null,
      cookMinutes:finite(recipe.cookMinutes) ? recipe.cookMinutes : null,
      totalMinutes:finite(recipe.totalMinutes) ? recipe.totalMinutes : null,
      baseServings:finite(recipe.baseServings) ? recipe.baseServings : recipe.baseServings ?? null
    }
  }));
}

async function loadForkrecipe(root,cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("FORKRECIPE_PIN_MISMATCH");
  const dir = resolve(root,cfg.recipesPath);
  const files = (await readdir(dir)).filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js").sort();
  const rows=[];
  for (const file of files) {
    const mod = await import(pathToFileURL(resolve(dir,file)).href);
    const recipe = mod.default || {};
    rows.push(record({
      layer:cfg.layer, cohortId:cfg.cohortId, sourceSystem:"FORKRECIPE", sourceRecordKey:file,
      title:recipe.title || recipe.slug,
      ingredientCount:Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
      directionCount:Array.isArray(recipe.processNodes) ? recipe.processNodes.length : 0,
      raw:{
        cuisine:recipe.cuisine ?? null,
        culture:recipe.culture ?? null,
        category:recipe.category ?? null,
        tags:Array.isArray(recipe.tags) ? recipe.tags : [],
        difficulty:recipe.difficulty ?? null,
        activeTime:recipe.activeTime ?? null,
        totalTime:recipe.totalTime ?? null
      }
    }));
  }
  if (rows.length !== cfg.expectedCount) throw new Error("FORKRECIPE_COUNT_MISMATCH_" + rows.length);
  return rows;
}

async function loadCc0(root,cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("CC0_PIN_MISMATCH");
  const dir=resolve(root,cfg.recipesPath);
  const files=(await readdir(dir)).filter(file=>file.endsWith(".md")).sort();
  const rows=[];
  for (const file of files) {
    const parsed=parseCc0MarkdownRecipe(await readFile(resolve(dir,file),"utf8"),{fileName:file});
    rows.push(record({
      layer:cfg.layer, cohortId:cfg.cohortId, sourceSystem:"CC0_MARKDOWN", sourceRecordKey:file,
      title:parsed.title, ingredientCount:parsed.ingredients.length, directionCount:parsed.directions.length,
      raw:{tags:parsed.tags}
    }));
  }
  if (rows.length !== cfg.expectedCount) throw new Error("CC0_COUNT_MISMATCH_" + rows.length);
  return rows;
}

function parseOraMarkdown(markdown) {
  const text=String(markdown ?? "");
  const match=/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text);
  const meta={};
  for (const line of (match?.[1] || "").split(/\r?\n/)) {
    const field=/^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    let value=field[2].trim();
    if (/^\[.*\]$/.test(value)) {
      try { value=JSON.parse(value); } catch {}
    } else value=value.replace(/^(["'])(.*)\1$/,"$2");
    meta[field[1]]=value;
  }
  return {
    meta,
    ingredients:section(text,"Ingredients").split(/\r?\n/).filter(line=>/^\s*[-*+]\s+/.test(line)).length,
    directions:section(text,"(?:Directions|Instructions|Method)").split(/\r?\n/).filter(line=>/^\s*(?:\d+[.)]|[-*+])\s+/.test(line)).length
  };
}

function oraStructure(row) {
  return {
    ingredients:section(row.body,"Ingredients").split(/\r?\n/).filter(line=>/^\s*[-*+]\s+/.test(line)).length,
    directions:section(row.body,"(?:Directions|Instructions|Method)").split(/\r?\n/).filter(line=>/^\s*(?:\d+[.)]|[-*+])\s+/.test(line)).length
  };
}

async function loadOra(root,cfg) {
  if (commitAt(root) !== cfg.commit) throw new Error("ORA_PIN_MISMATCH");
  const output=[], jsonlByCollection=new Map();
  for (const cohort of cfg.cohorts) {
    if (cohort.representation === "markdown") {
      const dir=resolve(root,"collections",cohort.collection,"recipes");
      const files=(await readdir(dir)).filter(file=>file.endsWith(".md")).sort();
      const selected=[];
      for (const file of files) {
        const parsed=parseOraMarkdown(await readFile(resolve(dir,file),"utf8"));
        const meta=parsed.meta;
        if (String(meta.source_url ?? "") === cohort.sourceUrl &&
            String(meta.source_title ?? "") === cohort.sourceTitle &&
            String(meta.source_year ?? "") === cohort.sourceYear &&
            String(meta.license ?? "") === "public-domain") selected.push({...parsed,file});
      }
      if (selected.length !== cohort.expectedCount) throw new Error("ORA_MARKDOWN_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
      for (const row of selected) output.push(record({
        layer:cohort.layer, cohortId:cohort.cohortId, sourceSystem:"OPEN_RECIPE_ARCHIVE_MARKDOWN", sourceRecordKey:row.file,
        title:row.meta.title, ingredientCount:row.ingredients, directionCount:row.directions,
        raw:{
          culture:row.meta.culture ?? null,
          tags:Array.isArray(row.meta.tags) ? row.meta.tags : [],
          collection:row.meta.collection ?? cohort.collection
        }
      }));
      continue;
    }

    let rows=jsonlByCollection.get(cohort.collection);
    if (!rows) {
      rows=(await readFile(resolve(root,"collections",cohort.collection,"recipes.jsonl"),"utf8")).split(/\r?\n/).filter(Boolean).map(JSON.parse);
      jsonlByCollection.set(cohort.collection,rows);
    }
    const selected=rows.filter(row =>
      String(row.source_url ?? "") === cohort.sourceUrl &&
      String(row.source_title ?? "") === cohort.sourceTitle &&
      String(row.source_year ?? "") === cohort.sourceYear &&
      String(row.license ?? "") === "public-domain"
    );
    if (selected.length !== cohort.expectedCount) throw new Error("ORA_JSONL_COUNT_MISMATCH_" + cohort.cohortId + "_" + selected.length);
    for (const row of selected) {
      const structure=oraStructure(row);
      output.push(record({
        layer:cohort.layer, cohortId:cohort.cohortId, sourceSystem:"OPEN_RECIPE_ARCHIVE_JSONL", sourceRecordKey:row.slug || row.title,
        title:row.title, ingredientCount:structure.ingredients, directionCount:structure.directions,
        raw:{
          culture:row.culture ?? null,
          tags:Array.isArray(row.tags) ? row.tags : [],
          collection:row.collection ?? cohort.collection
        }
      }));
    }
  }
  return output;
}

function ratio(n,d) { return d ? Number((n/d).toFixed(6)) : 0; }

const args=argsOf(process.argv.slice(2));
const baseline=JSON.parse(await readFile(resolve(args.baseline),"utf8"));
const mapping=JSON.parse(await readFile(resolve(args.mapping),"utf8"));

const records=[
  ...await loadUnitools(resolve(args.unitools),baseline.sources.unitools),
  ...await loadForkrecipe(resolve(args.forkrecipe),baseline.sources.forkrecipe),
  ...await loadCc0(resolve(args.cc0),baseline.sources.cc0),
  ...await loadOra(resolve(args.ora),baseline.sources.ora)
];

const expectedContracts=[
  baseline.sources.unitools,
  baseline.sources.forkrecipe,
  baseline.sources.cc0,
  ...baseline.sources.ora.cohorts
];
const expectedCounts=new Map(expectedContracts.map(row=>[row.cohortId,row.expectedCount]));
const minStructural=new Map(expectedContracts.map(row=>[row.cohortId,Number(row.minStructuralRatio ?? 1)]));
const byCohort=new Map();
for (const row of records) {
  if (!byCohort.has(row.cohortId)) byCohort.set(row.cohortId,[]);
  byCohort.get(row.cohortId).push(row);
}
const cohortChecks=[...byCohort.entries()].map(([cohortId,rows])=>{
  const structural=rows.filter(row=>row.titleKnown && row.ingredientCount>0 && row.directionCount>0).length;
  const observedRatio=ratio(structural,rows.length);
  return {
    cohortId,
    expectedCount:expectedCounts.get(cohortId),
    observedCount:rows.length,
    observedStructuralRatio:observedRatio,
    minimumStructuralRatio:minStructural.get(cohortId) ?? 1,
    pass:rows.length === expectedCounts.get(cohortId) && observedRatio >= (minStructural.get(cohortId) ?? 1)
  };
}).sort((a,b)=>a.cohortId.localeCompare(b.cohortId));

const structuralExceptions=records.filter(row=>!(row.titleKnown && row.ingredientCount>0 && row.directionCount>0))
  .map(row=>({layer:row.layer,cohortId:row.cohortId,sourceSystem:row.sourceSystem,sourceRecordKey:row.sourceRecordKey,titleKnown:row.titleKnown,ingredientCount:row.ingredientCount,directionCount:row.directionCount}));

const overlays=records.map(row=>mapRecord(row,mapping));
const validOverlayCount=overlays.filter(row=>validateOverlayRecord(row,mapping)).length;
const uniqueIdentityCount=new Set(overlays.map(row=>[row.identity.cohortId,row.identity.sourceRecordKey].join("::"))).size;
const counts=stateCounts(overlays);

const dimensions={
  geographyCountry:counts["geography.country"],
  geographyRegion:counts["geography.region"],
  culinaryTradition:counts["culinary.tradition"],
  dishCategory:counts["culinary.dishCategory"],
  mealRoles:counts["culinary.mealRoles"],
  techniqueFamilies:counts["culinary.techniqueFamilies"],
  difficulty:counts["culinary.difficulty"],
  prepMinutes:counts["time.prepMinutes"],
  cookMinutes:counts["time.cookMinutes"],
  totalMinutes:counts["time.totalMinutes"],
  servings:counts["serving.servings"],
  reviewedDietaryTags:counts["dietary.reviewedTags"]
};

const sourcePins={
  unitools:baseline.sources.unitools.commit,
  forkrecipe:baseline.sources.forkrecipe.commit,
  cc0:baseline.sources.cc0.commit,
  ora:baseline.sources.ora.commit
};

const pass=
  records.length === mapping.expectedRecipeCount &&
  cohortChecks.length === expectedContracts.length &&
  cohortChecks.every(row=>row.pass) &&
  structuralExceptions.length === 3 &&
  validOverlayCount === overlays.length &&
  uniqueIdentityCount === overlays.length &&
  dimensions.geographyRegion.UNKNOWN === overlays.length &&
  dimensions.culinaryTradition.UNKNOWN === overlays.length &&
  dimensions.reviewedDietaryTags.UNKNOWN === overlays.length;

const boundaries={
  d1ReadsPerformed:0,
  d1WritesPerformed:0,
  protectedBodiesExported:0,
  protectedBodiesRewritten:0,
  publicRuntimeChanged:false,
  recommendationBehaviorChanged:false,
  nutritionLaneModified:false,
  youtubeLaneModified:false,
  knowledgeCoreWritePerformed:false,
  billingExpansion:false,
  thirdShardUsed:false
};

const summary={
  schemaVersion:"CULINARY_CORPUS_NORMALIZATION_MAPPING_SUMMARY_V1",
  date:"2026-09-23",
  pass,
  terminal:pass ? "CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_PASS" : "CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_FAIL",
  protectedCorpusVersion:mapping.protectedCorpusVersion,
  expectedRecipeCount:mapping.expectedRecipeCount,
  observedRecipeCount:records.length,
  validOverlayCount,
  uniqueIdentityCount,
  sourcePins,
  cohortChecks,
  structuralExceptions,
  canonicalAuthorityCoverage:dimensions,
  controlledVocabularies:{
    dishCategory:mapping.dishCategoryVocabulary,
    mealRoles:mapping.mealRoleVocabulary,
    difficultyScales:mapping.difficultyScales
  },
  semantics:{
    country:"ONLY_EXPLICIT_SOURCE_COUNTRY",
    region:"UNKNOWN_V1_NO_INFERENCE",
    tradition:"UNKNOWN_V1_SOURCE_CUISINE_CULTURE_TAGS_RETAINED_AS_HINTS_ONLY",
    forkrecipeActiveTime:"SOURCE_HINT_ONLY_NOT_PREP_MINUTES",
    category:"REVIEWED_EXPLICIT_SPLIT_BETWEEN_DISH_CATEGORY_AND_MEAL_ROLE",
    difficulty:"SOURCE_SCALE_PRESERVED_NO_CROSS_SCALE_EQUIVALENCE",
    dietary:"UNKNOWN_V1_NO_AUTOMATIC_DIETARY_PROMOTION"
  },
  boundaries,
  nextGate:pass ? "NUTRITION_VITAMIN_APPLICABILITY_AUDIT" : "REPAIR_CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1"
};

const full={
  ...summary,
  overlaySchemaVersion:"CULINARY_CORPUS_NORMALIZATION_OVERLAY_RECORD_V1",
  overlays
};

await mkdir(dirname(resolve(args.output)),{recursive:true});
await mkdir(dirname(resolve(args.summary)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write(JSON.stringify(summary,null,2)+"\n");
if (!pass) process.exitCode=1;
