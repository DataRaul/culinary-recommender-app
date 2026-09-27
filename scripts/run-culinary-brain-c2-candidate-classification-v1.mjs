import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC2Classification, validateC2Summary } from "./culinary-brain-c2-candidate-classification-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for (const key of ["mapping","contract","output","summary"]) if (!args[key]) throw new Error("C2_ARGUMENT_REQUIRED_"+key);

const [mapping,contract]=await Promise.all([
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.contract),"utf8").then(JSON.parse)
]);
const {full,summary}=buildC2Classification({mapping,contract});
const errors=validateC2Summary(summary);
if (errors.length) throw new Error("C2_SUMMARY_VALIDATION_FAIL__"+errors.join(","));

for (const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");

process.stdout.write("C2_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  recipeCount:summary.recipeCount,
  digest:summary.fullClassificationDigestSha256,
  dishCategory:summary.fields.dishCategory.dispositionCounts,
  mealRole:summary.fields.mealRole.dispositionCounts,
  invariants:summary.invariants,
  boundaries:summary.boundaries
})+"\n");
