import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildP3Summary } from "./culinary-brain-c4-tapioca-bounded-p3-admission-core.mjs";
const args=Object.fromEntries(process.argv.slice(2).filter(arg=>arg.startsWith("--")).map(arg=>{const [k,...v]=arg.slice(2).split("=");return [k,v.join("=")];}));
if(!args.unitools) throw new Error("P3_UNITOOLS_ROOT_REQUIRED");
const root=resolve(args.unitools);
const commit=execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(commit!=="1d09e9548d957dd0375301146a86dddf5e269c1b") throw new Error("P3_UNITOOLS_SOURCE_PIN_MISMATCH");
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const summary=buildP3Summary({
  contract:read("config/culinary_brain_c4_tapioca_bounded_p3_admission_contract_v1.json"),
  reconciliation:read("data/generated/culinary-brain-c4-tapioca-reconciliation-summary-v1.json"),
  aliasContract:read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json"),
  dataset:read(resolve(root,"unitools-recipes-v1.json")),
  candidateArtifact:read("data/generated/culinary-brain-c4-tapioca-p3-candidate-v1.json")
});
writeFileSync(args.output||"/tmp/p3-summary.json",JSON.stringify(summary,null,2)+"\n");
console.log(summary.terminal);
