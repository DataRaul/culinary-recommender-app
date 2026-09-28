import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { scanStep8EReadiness } from "./corpus-scale-step8e-core.mjs";
import { buildC4NextRepairCohortDesign } from "./culinary-brain-c4-next-repair-cohort-design-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,"").split("=");return [key,rest.join("=")];}));
for(const key of ["contract","p3","step8d","unitools","summary"]) if(!args[key]) throw new Error("C4_NEXT_REPAIR_DESIGN_ARGUMENT_REQUIRED_"+key);
const read=p=>readFile(resolve(p),"utf8").then(JSON.parse);
const [contract,p3,step8d,dataset]=await Promise.all([read(args.contract),read(args.p3),read(args.step8d),read(resolve(args.unitools,"unitools-recipes-v1.json"))]);
if(step8d?.contractVersion!=="CORPUS_SCALE_STEP8D_CONTRACT_V1"||step8d?.source?.sourceCohortId!=="unitools-world-recipes-v1_1_0") throw new Error("C4_NEXT_REPAIR_DESIGN_STEP8D_CONTRACT_REQUIRED");
const observedCommit=execFileSync("git",["-C",resolve(args.unitools),"rev-parse","HEAD"],{encoding:"utf8"}).trim();
const observedBlob=execFileSync("git",["hash-object",resolve(args.unitools,step8d.source.dataPath)],{encoding:"utf8"}).trim();
if(observedCommit!==step8d.source.commit||observedBlob!==step8d.source.dataBlobSha) throw new Error("C4_NEXT_REPAIR_DESIGN_UNITOOLS_SOURCE_PIN_MISMATCH");
const preflight=scanStep8EReadiness(dataset,step8d);
const summary=buildC4NextRepairCohortDesign({contract,p3,preflight});
await mkdir(dirname(resolve(args.summary)),{recursive:true});
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("C4_NEXT_REPAIR_COHORT_DESIGN="+JSON.stringify({terminal:summary.terminal,currentIdentityBaseline:summary.currentIdentityBaseline,hardMetadataLeverage:summary.hardMetadataLeverage,topCandidates:summary.selection.topCandidates.slice(0,10),nextGate:summary.nextGate})+"\n");
