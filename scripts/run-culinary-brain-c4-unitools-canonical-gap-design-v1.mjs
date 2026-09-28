import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildC4UnitoolsCanonicalGapDesign } from "./culinary-brain-c4-unitools-canonical-gap-design-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,"").split("=");return [key,rest.join("=")];}));
for(const key of ["contract","alias-summary","alias-contract","step8d","unitools","summary"]) if(!args[key]) throw new Error("C4_UNITOOLS_CANONICAL_GAP_ARGUMENT_REQUIRED_"+key);
const read=p=>readFile(resolve(p),"utf8").then(JSON.parse);
const [contract,aliasReviewSummary,aliasContract,step8d,dataset]=await Promise.all([
  read(args.contract),read(args["alias-summary"]),read(args["alias-contract"]),read(args.step8d),read(resolve(args.unitools,"unitools-recipes-v1.json"))
]);
const observedCommit=execFileSync("git",["-C",resolve(args.unitools),"rev-parse","HEAD"],{encoding:"utf8"}).trim();
const observedBlob=execFileSync("git",["hash-object",resolve(args.unitools,step8d.source.dataPath)],{encoding:"utf8"}).trim();
if(observedCommit!==step8d.source.commit||observedBlob!==step8d.source.dataBlobSha) throw new Error("C4_UNITOOLS_CANONICAL_GAP_SOURCE_PIN_MISMATCH");
const summary=buildC4UnitoolsCanonicalGapDesign({contract,aliasReviewSummary,aliasContract,dataset});
await mkdir(dirname(resolve(args.summary)),{recursive:true});
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_UNITOOLS_CANONICAL_GAP="+JSON.stringify({terminal:summary.terminal,baseline:summary.baseline,minDistinctGapCount:summary.gapInventory.minDistinctGapCount,minGapRecipeCount:summary.gapInventory.minGapRecipeCount,minGapRows:summary.gapInventory.minGapRows.slice(0,20),topGapAggregates:summary.gapInventory.topGapAggregates.slice(0,20),nextGate:summary.nextGate})+"\n");
