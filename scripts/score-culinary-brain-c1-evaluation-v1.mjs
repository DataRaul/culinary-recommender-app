import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { scoreC1Predictions, validateC1Predictions } from "./culinary-brain-c1-evaluation-core.mjs";

function argsOf(argv){
  const out={mappingFull:null,packet:"data/generated/culinary-brain-c1-evaluation-canary-input-v1.json",predictions:"data/generated/culinary-brain-c1-evaluation-predictions-v1.json",config:"config/culinary_brain_c1_evaluation_v1.json",output:".tmp/culinary-brain-c1-evaluation-evidence-v1.json"};
  for(const arg of argv){const [key,...rest]=arg.replace(/^--/,"").split("=");if(!Object.hasOwn(out,key))throw new Error("UNKNOWN_ARGUMENT_"+arg);out[key]=rest.join("=");}
  if(!out.mappingFull) throw new Error("MAPPINGFULL_REQUIRED");
  return out;
}
function slug(value){return String(value??"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function fileSlug(value){return slug(String(value??"").replace(/\.[^.]+$/,""));}
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
function runtimeId(overlay){
  const cohort=String(overlay?.identity?.cohortId||"");
  const key=String(overlay?.identity?.sourceRecordKey||"");
  if(cohort==="unitools-world-recipes-v1_1_0") return "unitools:"+key;
  if(cohort==="FORKRECIPE_PINNED_STEP7E") return "forkrecipe_"+fileSlug(key).replace(/-/g,"_");
  if(cohort==="SGAUTHIER_RECIPES_CC0_B12E481D") return "cc0_sgauthier_"+fileSlug(key);
  const prefix=prefixes[cohort];
  if(!prefix) throw new Error("C1_REFERENCE_PREFIX_MISSING_"+cohort);
  return prefix+slug(key);
}
function mealRoleValue(overlay){
  const value=overlay?.canonical?.culinary?.mealRoles?.value;
  return Array.isArray(value)&&value.length===1?String(value[0]):"UNKNOWN";
}
const args=argsOf(process.argv.slice(2));
const [mapping,packet,predictions,config]=await Promise.all([
  readFile(resolve(args.mappingFull),"utf8").then(JSON.parse),
  readFile(resolve(args.packet),"utf8").then(JSON.parse),
  readFile(resolve(args.predictions),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);
if(mapping.protectedCorpusVersion!=="v8018"||mapping.observedRecipeCount!==19268||!Array.isArray(mapping.overlays)||mapping.overlays.length!==19268) throw new Error("C1_REFERENCE_MAPPING_NOT_EXACT_V8018");
const expectedIds=packet.rows.map(row=>row.recipeId);
const predictionErrors=validateC1Predictions(predictions,expectedIds);
if(predictionErrors.length) throw new Error("C1_PREDICTION_SCHEMA_INVALID__"+predictionErrors.join("__"));
const wanted=new Set(expectedIds);
const references=[];
for(const overlay of mapping.overlays){
  const id=runtimeId(overlay);
  if(!wanted.has(id)) continue;
  references.push({
    recipeId:id,
    dishCategory:String(overlay?.canonical?.culinary?.dishCategory?.value||"UNKNOWN"),
    mealRole:mealRoleValue(overlay)
  });
}
references.sort((a,b)=>expectedIds.indexOf(a.recipeId)-expectedIds.indexOf(b.recipeId));
if(references.length!==100||new Set(references.map(row=>row.recipeId)).size!==100) throw new Error("C1_REFERENCE_CANARY_ID_MISMATCH");
const score=scoreC1Predictions(predictions,references,config.preregisteredGates);
const output={
  schemaVersion:"CULINARY_BRAIN_C1_EVALUATION_EVIDENCE_V1",
  date:"2026-09-27",
  protectedCorpusVersion:"v8018",
  frozenSampleDigestSha256:config.frozenSample.digestSha256,
  canaryRecipeCount:100,
  evaluatorInputAuthority:config.evaluator.inputAuthority,
  score,
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
