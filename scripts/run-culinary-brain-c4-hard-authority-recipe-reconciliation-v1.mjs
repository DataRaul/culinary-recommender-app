import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC4RecipeReconciliation, validateC4RecipeReconciliationSummary } from "./culinary-brain-c4-hard-authority-recipe-reconciliation-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,"").split("=");return [key,rest.join("=")];}));
for(const key of ["contract","policy","mapping","p2","output","summary"]) if(!args[key]) throw new Error("C4_RECONCILIATION_ARGUMENT_REQUIRED_"+key);
const [contract,policyFull,mappingFull,p2Measurement]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.policy),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.p2),"utf8").then(JSON.parse)
]);
const {summary,full}=buildC4RecipeReconciliation({contract,policyFull,mappingFull,p2Measurement});
const errors=validateC4RecipeReconciliationSummary(summary);
if(errors.length) throw new Error("C4_RECONCILIATION_SUMMARY_INVALID__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_RECIPE_RECONCILIATION="+JSON.stringify({
  terminal:summary.terminal,
  policyCompleteCandidateCount:summary.policyCompleteCandidateCount,
  mealRoleAuthorityReadyCount:summary.mealRoleAuthorityReadyCount,
  sourceDifficultyEvidencePresentCount:summary.sourceDifficultyEvidencePresentCount,
  totalMinutesAuthorityReadyCount:summary.totalMinutesAuthorityReadyCount,
  readyExceptDifficultyCount:summary.readyExceptDifficultyCount,
  runtimeHardMetadataReadyCount:summary.runtimeHardMetadataReadyCount,
  blockerCounts:summary.blockerCounts,
  nextGate:summary.nextGate
})+"\n");
