import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC4HardAuthorityEvidence, validateC4HardAuthorityEvidenceSummary } from "./culinary-brain-c4-hard-authority-evidence-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["contract","nutrition","c4","output","summary"]) if(!args[key]) throw new Error("C4_HARD_AUTHORITY_ARGUMENT_REQUIRED_"+key);
const [contract,nutritionFull,c4MatrixSummary]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c4),"utf8").then(JSON.parse)
]);
const {summary,full}=buildC4HardAuthorityEvidence({contract,nutritionFull,c4MatrixSummary});
const errors=validateC4HardAuthorityEvidenceSummary(summary);
if(errors.length) throw new Error("C4_HARD_AUTHORITY_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_HARD_AUTHORITY_EVIDENCE="+JSON.stringify({
  terminal:summary.terminal,
  repairCohortCount:summary.repairCohortCount,
  distinctCanonicalIngredientCount:summary.distinctCanonicalIngredientCount,
  catalogDigest:summary.canonicalIngredientCatalogDigestSha256,
  recipesWithPositiveCatalogAllergenSignalCount:summary.recipesWithPositiveCatalogAllergenSignalCount,
  positiveAllergenSignalRecipeCounts:summary.positiveAllergenSignalRecipeCounts,
  hardAuthorityEarnedCount:summary.hardAuthorityEarnedCount,
  nextGate:summary.nextGate
})+"\n");
