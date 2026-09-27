import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  C1_FREEZE_SCHEMA_VERSION,
  C1_FREEZE_SEED,
  buildCandidate,
  freezeC1Sample,
  summarizeC1Freeze
} from "./culinary-brain-c1-freeze-core.mjs";

function argsOf(argv) {
  const out={
    mappingFull:null,nutritionFull:null,prep:"data/generated/culinary-quota-gap-parallel-prep-v1.json",
    baseline:"config/corpus_normalization_baseline_v1.json",
    unitools:null,forkrecipe:null,cc0:null,ora:null,
    output:".tmp/culinary-brain-c1-exact-sample-freeze-v1.json"
  };
  for(const arg of argv){const [key,...rest]=arg.replace(/^--/,"").split("=");if(!Object.hasOwn(out,key))throw new Error("UNKNOWN_ARGUMENT_"+arg);out[key]=rest.join("=");}
  for(const key of ["mappingFull","nutritionFull","unitools","forkrecipe","cc0","ora"]) if(!out[key]) throw new Error(key.toUpperCase()+"_REQUIRED");
  return out;
}
function commitAt(root){return execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();}
function slug(value){return String(value??"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function fileSlug(file){return slug(String(file??"").replace(/\.[^.]+$/,""));}
function joinKey(cohortId,sourceRecordKey){return String(cohortId)+"::"+String(sourceRecordKey);}
function section(body,headingPattern){const match=new RegExp("^##\\s+"+headingPattern+"\\s*$","im").exec(String(body??""));if(!match)return"";const rest=String(body).slice(match.index+match[0].length),next=/^##\s+/m.exec(rest);return(next?rest.slice(0,next.index):rest).trim();}
function frontMatter(markdown){const match=/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown??""));const meta={};for(const line of (match?.[1]||"").split(/\r?\n/)){const f=/^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);if(!f)continue;let v=f[2].trim();v=v.replace(/^(["'])(.*)\1$/,"$2");meta[f[1]]=v;}return meta;}

async function runtimeIdMap(baseline, roots) {
  const map=new Map();
  if(commitAt(roots.unitools)!==baseline.sources.unitools.commit) throw new Error("C1_UNITOOLS_PIN_MISMATCH");
  const unitools=JSON.parse(await readFile(resolve(roots.unitools,baseline.sources.unitools.dataPath),"utf8")).recipes;
  for(const recipe of unitools) map.set(joinKey(baseline.sources.unitools.cohortId,recipe.slug),"unitools:"+recipe.slug);

  if(commitAt(roots.forkrecipe)!==baseline.sources.forkrecipe.commit) throw new Error("C1_FORKRECIPE_PIN_MISMATCH");
  const forkDir=resolve(roots.forkrecipe,baseline.sources.forkrecipe.recipesPath);
  for(const file of (await readdir(forkDir)).filter(f=>f.endsWith(".js")&&f!=="_template.js"&&f!=="index.js").sort()){
    const mod=await import(pathToFileURL(resolve(forkDir,file)).href), recipe=mod.default||{};
    const id="forkrecipe_"+String(recipe.slug||"").replace(/-/g,"_");
    if(id==="forkrecipe_") throw new Error("C1_FORKRECIPE_RUNTIME_ID_MISSING_"+file);
    map.set(joinKey(baseline.sources.forkrecipe.cohortId,file),id);
  }

  if(commitAt(roots.cc0)!==baseline.sources.cc0.commit) throw new Error("C1_CC0_PIN_MISMATCH");
  const cc0Dir=resolve(roots.cc0,baseline.sources.cc0.recipesPath);
  for(const file of (await readdir(cc0Dir)).filter(f=>f.endsWith(".md")).sort()) map.set(joinKey(baseline.sources.cc0.cohortId,file),"cc0_sgauthier_"+fileSlug(file));

  if(commitAt(roots.ora)!==baseline.sources.ora.commit) throw new Error("C1_ORA_PIN_MISMATCH");
  const prefixes={
    ORA_ABBOTT_1864_AE3BD2C:"ora_abbott_1864_",
    ORA_BOSSE_WATANNA_1914_JAPANESE_SHELF_AE3BD2C:"ora_bosse_watanna_1914_",
    ORA_TURABI_EFENDI_1864_OTTOMAN_SHELF_AE3BD2C:"ora_turabi_1864_",
    ORA_RIGAUD_1785_PORTUGUESE_SOURCE_AE3BD2C:"ora_rigaud_1785_",
    ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C:"ora_galvan_rivera_1845_",
    ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C:"ora_cocinera_poblana_1890_",
    ORA_MENON_1801_CUISINIERE_BOURGEOISE_B22019935:"ora_menon_1801_",
    ORA_ARTUSI_1891_SCIENZA_CUCINA_GUTENBERG_59047:"ora_artusi_1891_",
    ORA_FROKEN_JENSEN_1921_KOGEBOG_23RD_FRKENJENSENSKO00JENS:"ora_froken_jensen_1921_",
    ORA_SELESKOWITZ_1883_WIENER_KOCHBUCH_BUB_GB_OP8YAQAAMAAJ:"ora_seleskowitz_1883_",
    ORA_VIARD_1806_LE_CUISINIER_IMPERIAL_LECUISINIERIMPE00VIARGOOG:"ora_viard_1806_",
    ORA_HEARN_1885_LA_CUISINE_CREOLE_LACUISINECREOLEC00HEAR:"ora_hearn_1885_",
    ORA_CHAN_1917_CHINESE_COOK_BOOK_CHINESECOOKBOOK00CHAN:"ora_chan_1917_",
    ORA_KENNEY_HERBERT_1885_CULINARY_JOTTINGS_CULINARYJOTTINGS00KENN:"ora_kenney_herbert_1885_",
    ORA_FANNIE_FARMER_BOSTON_COOKING_SCHOOL_GUTENBERG_65061:"ora_fannie_farmer_1910_",
    ORA_ATRUTEL_1874_EASY_ECONOMICAL_JEWISH_COOKERY_B2807967X:"ora_atrutel_1874_"
  };
  const jsonlCache=new Map();
  for(const cohort of baseline.sources.ora.cohorts){
    const prefix=prefixes[cohort.cohortId]; if(!prefix) throw new Error("C1_ORA_PREFIX_MISSING_"+cohort.cohortId);
    if(cohort.representation==="markdown"){
      const dir=resolve(roots.ora,"collections",cohort.collection,"recipes");
      const files=(await readdir(dir)).filter(f=>f.endsWith(".md")).sort();
      for(const file of files){
        const markdown=await readFile(resolve(dir,file),"utf8"), meta=frontMatter(markdown);
        if(String(meta.source_url??"")!==cohort.sourceUrl||String(meta.source_title??"")!==cohort.sourceTitle||String(meta.source_year??"")!==cohort.sourceYear||String(meta.license??"")!=="public-domain") continue;
        map.set(joinKey(cohort.cohortId,file),prefix+fileSlug(file));
      }
      continue;
    }
    let rows=jsonlCache.get(cohort.collection);
    if(!rows){rows=(await readFile(resolve(roots.ora,"collections",cohort.collection,"recipes.jsonl"),"utf8")).split(/\r?\n/).filter(Boolean).map(JSON.parse);jsonlCache.set(cohort.collection,rows);}
    const selected=rows.filter(row=>String(row.source_url??"")===cohort.sourceUrl&&String(row.source_title??"")===cohort.sourceTitle&&String(row.source_year??"")===cohort.sourceYear&&String(row.license??"")==="public-domain");
    for(const [ordinal,row] of selected.entries()){
      const key=row.slug||row.title;
      map.set(joinKey(cohort.cohortId,key),prefix+slug(row.slug||row.title||String(ordinal)));
    }
  }
  return map;
}

const args=argsOf(process.argv.slice(2));
const [mapping,nutrition,prep,baseline]=await Promise.all([
  readFile(resolve(args.mappingFull),"utf8").then(JSON.parse),
  readFile(resolve(args.nutritionFull),"utf8").then(JSON.parse),
  readFile(resolve(args.prep),"utf8").then(JSON.parse),
  readFile(resolve(args.baseline),"utf8").then(JSON.parse)
]);
if(mapping.protectedCorpusVersion!=="v8018"||mapping.observedRecipeCount!==19268||!Array.isArray(mapping.overlays)||mapping.overlays.length!==19268) throw new Error("C1_FULL_MAPPING_REQUIRED");
const diagnostics=nutrition.protectedCorpusRecipeDiagnostics;
if(nutrition.protectedCorpusVersion!=="v8018"||!Array.isArray(diagnostics)||diagnostics.length!==19268) throw new Error("C1_FULL_NUTRITION_DIAGNOSTICS_REQUIRED");
const allocations=prep.c1SourceCohortQuotaPlan?.allocations;
if(!Array.isArray(allocations)||prep.c1SourceCohortQuotaPlan.targetRecipeCount!==500) throw new Error("C1_FROZEN_QUOTA_PLAN_REQUIRED");

const idMap=await runtimeIdMap(baseline,{unitools:resolve(args.unitools),forkrecipe:resolve(args.forkrecipe),cc0:resolve(args.cc0),ora:resolve(args.ora)});
const diagMap=new Map(diagnostics.map(row=>[joinKey(row.cohortId,row.sourceRecordKey),row]));
const exceptionSet=new Set((mapping.structuralExceptions||[]).map(row=>joinKey(row.cohortId,row.sourceRecordKey)));
const candidates=mapping.overlays.map(overlay=>{
  const key=joinKey(overlay.identity.cohortId,overlay.identity.sourceRecordKey);
  const diagnostic=diagMap.get(key),runtimeRecipeId=idMap.get(key);
  if(!diagnostic) throw new Error("C1_DIAGNOSTIC_MISSING_"+key);
  if(!runtimeRecipeId) throw new Error("C1_RUNTIME_ID_MISSING_"+key);
  return buildCandidate({overlay,diagnostic,runtimeRecipeId,structuralException:exceptionSet.has(key)});
});
if(candidates.length!==19268||new Set(candidates.map(row=>row.recipeId)).size!==19268) throw new Error("C1_CANDIDATE_UNIVERSE_MISMATCH");
const frozen=freezeC1Sample(candidates,allocations,{seed:C1_FREEZE_SEED});
const summary=summarizeC1Freeze(frozen.selected,allocations,frozen.digest);
if(summary.structuralExceptionCount!==3) throw new Error("C1_ALL_STRUCTURAL_EXCEPTIONS_MUST_BE_SELECTED");

const output={
  schemaVersion:C1_FREEZE_SCHEMA_VERSION,
  date:"2026-09-27",
  pass:true,
  terminal:"CULINARY_BRAIN_C1_EXACT_500_SAMPLE_FROZEN",
  protectedCorpusVersion:"v8018",
  sourcePins:mapping.sourcePins,
  selectionSeed:C1_FREEZE_SEED,
  selectionMethod:"SOURCE_COHORT_QUOTA__FORCE_STRUCTURAL_EXCEPTIONS__ROUND_ROBIN_SECONDARY_STRATA__STABLE_SHA256_ORDER",
  summary,
  allocations,
  recipeIds:frozen.recipeIds,
  strataReconstruction:{
    source:"DETERMINISTIC_EXACT_PINNED_RECONSTRUCTION",
    perRecipeStrataPersisted:false,
    reason:"Freeze persists exact IDs plus aggregate coverage; per-recipe strata are deterministically reproducible from exact pinned mapping and nutrition diagnostics."
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesPersistedOrExported:0,
    publicRuntimeChanged:false,recommendationBehaviorChanged:false,recommendationAuthorityWidened:false,
    knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardAuthorized:false,barbecueMutation:false
  },
  nextGate:"C1_EVALUATION_AND_P2_FULL_METADATA_USABILITY_EXECUTION"
};
await mkdir(dirname(resolve(args.output)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(output,null,2)+"\n","utf8");
process.stdout.write("C1_FREEZE_SUMMARY="+JSON.stringify({terminal:output.terminal,...summary})+"\n");
process.stdout.write("C1_FREEZE_RECIPE_IDS="+JSON.stringify(output.recipeIds)+"\n");
