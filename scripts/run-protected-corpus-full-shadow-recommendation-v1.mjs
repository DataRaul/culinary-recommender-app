import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes, explainShortfall } from "../src/domain/recommendation.js";
import { buildFullShadowBaseline, validateShadowSummary } from "./protected-corpus-full-shadow-recommendation-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for (const key of ["mapping","nutrition","c2","config","output","summary"]) if (!args[key]) throw new Error("SHADOW_ARGUMENT_REQUIRED_"+key);

const [mapping,nutrition,c2Full,config]=await Promise.all([
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

const currentRuntimeBaselines=config.profileCases.map(profileCase=>{
  const profile=normalizeProfile({ ...DEFAULT_PROFILE, ...(profileCase.profile || {}) });
  const ranked=rankRecipes(PUBLIC_RUNTIME_RECIPES,profile,{ mealType:profileCase.mealType || null });
  return {
    profileCaseId:profileCase.id,
    runtimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
    eligibleCount:ranked.eligible.length,
    rejectedCount:ranked.rejected.length,
    topRecipeIds:ranked.eligible.slice(0,10).map(row=>row.recipe.id),
    topShortfallReasons:explainShortfall(ranked.rejected)
  };
});

const {full,summary}=buildFullShadowBaseline({mapping,nutrition,c2Full,config,currentRuntimeBaselines});
const errors=validateShadowSummary(summary);
if (errors.length) throw new Error("SHADOW_SUMMARY_VALIDATION_FAIL__"+errors.join(","));

for (const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");

process.stdout.write("SHADOW_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  searchableRecipeCount:summary.searchableRecipeCount,
  unrestrictedShadowEvaluableCount:summary.profiles.UNRESTRICTED_BROAD.shadowEvaluableCount,
  breakfastShadowEvaluableCount:summary.profiles.UNRESTRICTED_BREAKFAST.shadowEvaluableCount,
  sample:summary.deterministicSample,
  topFailureClusters:summary.failureClusters.slice(0,8),
  currentRuntimeBaselines:summary.currentRuntimeBaselines,
  nextGate:summary.nextGate
})+"\n");
