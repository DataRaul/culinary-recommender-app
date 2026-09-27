import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC4FailureMatrix, validateC4Summary } from "./culinary-brain-c4-failure-loop-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for (const key of ["contract","nutrition","mapping","c2","c3","readiness","output","summary"]) {
  if (!args[key]) throw new Error("C4_ARGUMENT_REQUIRED_"+key);
}
const [contract,nutritionFull,mappingFull,c2Full,c3Summary,readinessSummary]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.c3),"utf8").then(JSON.parse),
  readFile(resolve(args.readiness),"utf8").then(JSON.parse)
]);
const {summary,full}=buildC4FailureMatrix({contract,nutritionFull,mappingFull,c2Full,c3Summary,readinessSummary});
const errors=validateC4Summary(summary);
if (errors.length) throw new Error("C4_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for (const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  recipeCount:summary.recipeCount,
  identityReadyRepairCohortCount:summary.repairCohort.recipeCount,
  identityReadyRepairCohortDigest:summary.repairCohort.digestSha256,
  hardAuthorityState:summary.failureMatrix.hardDietaryAllergenAuthority.state,
  unresolvedIdentityCount:summary.failureMatrix.identityNormalization.affectedRecipeCount,
  nextGate:summary.nextGate
})+"\n");
