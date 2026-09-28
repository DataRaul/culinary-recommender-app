import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { scanStep8EReadiness } from "./corpus-scale-step8e-core.mjs";
import { buildC4UnitoolsAliasReview } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,"").split("=");return [key,rest.join("=")];}));
for(const key of ["contract","design","step8d","unitools","summary"]) if(!args[key]) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_ARGUMENT_REQUIRED_"+key);
const read=p=>readFile(resolve(p),"utf8").then(JSON.parse);
const [contract,design,step8d,dataset]=await Promise.all([read(args.contract),read(args.design),read(args.step8d),read(resolve(args.unitools,"unitools-recipes-v1.json"))]);
const observedCommit=execFileSync("git",["-C",resolve(args.unitools),"rev-parse","HEAD"],{encoding:"utf8"}).trim();
const observedBlob=execFileSync("git",["hash-object",resolve(args.unitools,step8d.source.dataPath)],{encoding:"utf8"}).trim();
if(observedCommit!==step8d.source.commit||observedBlob!==step8d.source.dataBlobSha) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_SOURCE_PIN_MISMATCH");
const baselinePreflight=scanStep8EReadiness(dataset,step8d);
const summary=buildC4UnitoolsAliasReview({contract,design,dataset,baselinePreflight});
await mkdir(dirname(resolve(args.summary)),{recursive:true});
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_UNITOOLS_ALIAS_REVIEW="+JSON.stringify({terminal:summary.terminal,review:{mappedDecisionCount:summary.review.mappedDecisionCount,heldDecisionCount:summary.review.heldDecisionCount},identity:summary.identity,nextGate:summary.nextGate})+"\n");
