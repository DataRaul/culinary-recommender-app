import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { scoreC1Predictions, validateC1Predictions } from "./culinary-brain-c1-evaluation-core.mjs";

function argsOf(argv){
  const out={
    mappingFull:null,
    packet:"data/generated/culinary-brain-c1-evaluation-canary-input-v1.json",
    predictions:"data/generated/culinary-brain-c1-evaluation-predictions-v1.json",
    config:"config/culinary_brain_c1_evaluation_v1.json",
    baseline:"config/corpus_normalization_baseline_v1.json",
    unitools:null,forkrecipe:null,cc0:null,ora:null,
    output:".tmp/culinary-brain-c1-evaluation-evidence-v1.json"
  };
  for(const arg of argv){const [key,...rest]=arg.replace(/^--/,"").split("=");if(!Object.hasOwn(out,key))throw new Error("UNKNOWN_ARGUMENT_"+arg);out[key]=rest.join("=");}
  for(const key of ["mappingFull","unitools","forkrecipe","cc0","ora"]) if(!out[key]) throw new Error(key.toUpperCase()+"_REQUIRED");
  return out;
}
function commitAt(root){return execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();}
function slug(value){return String(value??"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function fileSlug(file){return slug(String(file??"").replace(/\.[^.]+$/,""));}
function joinKey(cohortId,sourceRecordKey){return String(cohortId)+"::"+String(sourceRecordKey);}
function frontMatter(markdown){const match=/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown??""));const meta={};for(const line of (match?.[1]||"").split(/\r?\n/)){const p=/^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);if(!p)continue;let v=p[2].trim();v=v.replace(/^(["'])(.*)\1$/,"$2");meta[p[1]]=v;}return meta;}

async function runtimeIdMap(baseline, roots) {
  const map=new Map();
  if(commitAt(roots.unitools)!==baseline.sources.unitools.commit) throw new Error("C1_UNITOOLS_PIN_MISMATCH");
  const unitools=JSON.parse(await readFile(resolve(roots.unitools,baseline.sources.unitools.dataPath),"utf8")).recipes;
  for(const recipe of unitools) map.set(joinKey(baseline.sources.unitools.cohortId,recipe.slug),"unitools:"+recipe.slug);

  if(commitAt(roots.forkrecipe)!==baseline.sources.forkrecipe.commit) throw new Error("C1_FORKRECIPE_PIN_MISMATCH");
  const forkDir=resolve(roots.forkrecipe,baseline.sources.forkrecipe.recipesPath);
  for(const file of (await readdir(forkDir)).filter(name=>name.endsWith(".js")&&name!=="_template.js"&&name!=="index.js").sort()){
    const mod=await import(pathToFileURL(resolve(forkDir,file)).href), recipe=mod.default||{};
    const id="forkrecipe_"+String(recipe.slug||"").replace(/-/g,"_");
    if(id==="forkrecipe_") throw new Error("C1_FORKRECIPE_RUNTIME_ID_MISSING_"+file);
    map.set(joinKey(baseline.sources.forkrecipe.cohortId,file),id);
  }

  if(commitAt(roots.cc0)!==baseline.sources.cc0.commit) throw new Error("C1_CC0_PIN_MISMATCH");
  const cc0Dir=resolve(roots.cc0,baseline.sources.cc0.recipesPath);
  for(const file of (await readdir(cc0Dir)).filter(name=>name.endsWith(".md")).sort()) {
    map.set(joinKey(baseline.sources.cc0.cohortId,file),"cc0_sgauthier_"+fileSlug(file));
  }

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
      for(const file of (await readdir(dir)).filter(name=>name.endsWith(".md")).sort()){
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

function mealRoleValue(overlay){
  const value=overlay?.canonical?.culinary?.mealRoles?.value;
  return Array.isArray(value)&&value.length===1?String(value[0]):"UNKNOWN";
}

const args=argsOf(process.argv.slice(2));
const [mapping,packet,predictions,config,baseline]=await Promise.all([
  readFile(resolve(args.mappingFull),"utf8").then(JSON.parse),
  readFile(resolve(args.packet),"utf8").then(JSON.parse),
  readFile(resolve(args.predictions),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse),
  readFile(resolve(args.baseline),"utf8").then(JSON.parse)
]);
if(mapping.protectedCorpusVersion!=="v8018"||mapping.observedRecipeCount!==19268||!Array.isArray(mapping.overlays)||mapping.overlays.length!==19268) throw new Error("C1_REFERENCE_MAPPING_NOT_EXACT_V8018");
const expectedIds=packet.rows.map(row=>row.recipeId);
const predictionErrors=validateC1Predictions(predictions,expectedIds);
if(predictionErrors.length) throw new Error("C1_PREDICTION_SCHEMA_INVALID__"+predictionErrors.join("__"));

const idMap=await runtimeIdMap(baseline,{unitools:resolve(args.unitools),forkrecipe:resolve(args.forkrecipe),cc0:resolve(args.cc0),ora:resolve(args.ora)});
const wanted=new Set(expectedIds);
const references=[];
for(const overlay of mapping.overlays){
  const key=joinKey(overlay.identity.cohortId,overlay.identity.sourceRecordKey);
  const id=idMap.get(key);
  if(!id || !wanted.has(id)) continue;
  references.push({
    recipeId:id,
    dishCategory:String(overlay?.canonical?.culinary?.dishCategory?.value||"UNKNOWN"),
    mealRole:mealRoleValue(overlay)
  });
}
const order=new Map(expectedIds.map((id,index)=>[id,index]));
references.sort((a,b)=>order.get(a.recipeId)-order.get(b.recipeId));
if(references.length!==100||new Set(references.map(row=>row.recipeId)).size!==100) {
  const found=new Set(references.map(row=>row.recipeId));
  const missing=expectedIds.filter(id=>!found.has(id));
  throw new Error("C1_REFERENCE_CANARY_ID_MISMATCH__MISSING_"+missing.join(","));
}

const score=scoreC1Predictions(predictions,references,config.preregisteredGates);
const referenceById=new Map(references.map(row=>[row.recipeId,row]));
const contradictions=[];
for(const row of predictions.rows){
  const ref=referenceById.get(row.recipeId);
  for(const field of ["dishCategory","mealRole"]){
    const prediction=row[field];
    const reference=ref[field];
    if(reference!=="UNKNOWN" && prediction.decision==="PROPOSE" && prediction.value!==reference){
      contradictions.push({
        recipeId:row.recipeId,
        field,
        predicted:prediction.value,
        reference,
        confidence:prediction.confidence,
        reasonCode:prediction.reasonCode
      });
    }
  }
}
const output={
  schemaVersion:"CULINARY_BRAIN_C1_EVALUATION_EVIDENCE_V1",
  date:"2026-09-27",
  protectedCorpusVersion:"v8018",
  frozenSampleDigestSha256:config.frozenSample.digestSha256,
  canaryRecipeCount:100,
  evaluatorInputAuthority:config.evaluator.inputAuthority,
  evaluatorProvenance:config.evaluator.provenance,
  evaluatorInterpretation:config.evaluator.interpretation,
  score,
  diagnostics:{
    contradictionCount:contradictions.length,
    contradictions
  },
  boundaries:{
    protectedD1Reads:0,
    protectedD1Writes:0,
    protectedBodiesReadOrExported:0,
    hardAuthorityGranted:false,
    publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,
    knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,
    thirdShardUsed:false,
    barbecueMutation:false
  },
  nextGate:score.pass?"C1_FULL_FROZEN_500_EVALUATION":"C1_CANARY_FAILURE_CLASS_REVIEW"
};
await mkdir(dirname(resolve(args.output)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(output,null,2)+"\n","utf8");
process.stdout.write("C1_EVAL_SCORE="+JSON.stringify(output)+"\n");
if(!score.pass) process.exitCode=2;
