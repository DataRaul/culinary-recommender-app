import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  summarizeRelevanceCohort,
  validateRelevanceSummary
} from "./protected-corpus-shadow-relevance-acceptance-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["quality","mapping","c2","config","output","summary"]) if(!args[key]) throw new Error("RELEVANCE_ARGUMENT_REQUIRED_"+key);

const [qualityFull,mapping,c2Full,config]=await Promise.all([
  readFile(resolve(args.quality),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

const {summary,details}=summarizeRelevanceCohort({qualityFull,mapping,c2Full,config});
const errors=validateRelevanceSummary(summary,config);
if(errors.length) throw new Error("RELEVANCE_SUMMARY_VALIDATION_FAIL__"+errors.join(","));

for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify({...summary,details},null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("RELEVANCE_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  mealRoleAudit:summary.mealRoleAudit,
  metadataAudit:summary.metadataAudit,
  broadRankingDiagnostic:summary.broadRankingDiagnostic,
  nextGate:summary.nextGate
})+"\n");
