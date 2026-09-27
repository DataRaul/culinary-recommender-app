import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { BRAIN_PUBLIC_POLICY_V1 } from "../src/data/brain-public-policy-v1.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { normalizeProfile } from "../src/domain/profile.js";
import { runC3Calibration, validateC3Summary } from "./culinary-brain-c3-prior-calibration-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for (const key of ["contract","c2","output"]) if (!args[key]) throw new Error("C3_ARGUMENT_REQUIRED_"+key);

const [contract,c2Summary,recommendationSource]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve("src/domain/recommendation.js"),"utf8")
]);
const summary=runC3Calibration({
  recipes:PUBLIC_RUNTIME_RECIPES,
  contract,
  c2Summary,
  brainPolicy:BRAIN_PUBLIC_POLICY_V1,
  rankRecipes,
  normalizeProfile,
  recommendationSource
});
const errors=validateC3Summary(summary);
if (errors.length) throw new Error("C3_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
await mkdir(dirname(resolve(args.output)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C3_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  matrixDigestSha256:summary.calibration.matrixDigestSha256,
  deterministicMismatchCount:summary.calibration.deterministicMismatchCount,
  hardConstraintViolations:summary.calibration.hardConstraintViolations,
  unknownNutritionNonNumericCases:summary.calibration.unknownNutritionNonNumericCases,
  priorDecisions:summary.calibration.priorDecisions,
  promotedPriorCount:summary.calibration.promotedPriorCount,
  nextGate:summary.nextGate
})+"\n");
