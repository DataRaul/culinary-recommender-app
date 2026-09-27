import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildP2Measurement, validateP2Measurement } from "./protected-corpus-p2-metadata-usability-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [k,...v]=arg.replace(/^--/,"").split("=");return [k,v.join("=")];}));
const required=["mapping","nutrition","prep","p1","output"];
for(const key of required) if(!args[key]) throw new Error("P2_ARGUMENT_REQUIRED_"+key);
const [mappingSummary,nutritionSummary,prepEvidence,p1Evidence]=await Promise.all([
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.prep),"utf8").then(JSON.parse),
  readFile(resolve(args.p1),"utf8").then(JSON.parse)
]);
const evidence=buildP2Measurement({mappingSummary,nutritionSummary,prepEvidence,p1Evidence});
const errors=validateP2Measurement(evidence);
if(errors.length) throw new Error("P2_MEASUREMENT_VALIDATION_FAIL__"+errors.join(","));
await mkdir(dirname(resolve(args.output)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(evidence,null,2)+"\n","utf8");
process.stdout.write(JSON.stringify({terminal:evidence.terminal,recipeCount:evidence.recipeCount,topBlocker:evidence.rankedMetadataBlockers[0],ingredientIdentity:evidence.supplementalDiagnostics.ingredientIdentity,boundaries:evidence.boundaries},null,2)+"\n");
