import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC4HardAuthorityPolicyReview, validateC4HardAuthorityPolicySummary } from "./culinary-brain-c4-hard-authority-policy-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["contract","evidence","output","summary"]) if(!args[key]) throw new Error("C4_POLICY_ARGUMENT_REQUIRED_"+key);

const [contract,evidence]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.evidence),"utf8").then(JSON.parse)
]);
const {summary,full}=buildC4HardAuthorityPolicyReview({contract,evidence});
const errors=validateC4HardAuthorityPolicySummary(summary);
if(errors.length) throw new Error("C4_POLICY_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_HARD_AUTHORITY_POLICY_REVIEW="+JSON.stringify({
  terminal:summary.terminal,
  policyCompleteRecipeCandidateCount:summary.policyCompleteRecipeCandidateCount,
  policyHeldRecipeCount:summary.policyHeldRecipeCount,
  heldPolicyIngredientIds:summary.heldPolicyIngredientIds,
  nextGate:summary.nextGate
})+"\n");
