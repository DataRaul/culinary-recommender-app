import { execFileSync } from "node:child_process";
import { readFile,writeFile,mkdir } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import { buildR1FrontierMeasurement, compactR1FrontierEvidence } from "./protected-corpus-recommendation-expansion-r1-frontier-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,"").split("=");return [key,rest.join("=")];}));
for(const key of ["contract","alias","unitools","summary"]) if(!args[key]) throw new Error("R1_ARGUMENT_REQUIRED_"+key);
const read=path=>readFile(resolve(path),"utf8").then(JSON.parse);
const [contract,aliasContract,dataset]=await Promise.all([
  read(args.contract),
  read(args.alias),
  read(resolve(args.unitools,"unitools-recipes-v1.json"))
]);
const r1=contract.r1FrontierMeasurement;
const observedCommit=execFileSync("git",["-C",resolve(args.unitools),"rev-parse","HEAD"],{encoding:"utf8"}).trim();
const observedBlob=execFileSync("git",["hash-object",resolve(args.unitools,"unitools-recipes-v1.json")],{encoding:"utf8"}).trim();
if(observedCommit!==r1.pinnedSourceCommit||observedBlob!==r1.pinnedSourceDataBlobSha) throw new Error("R1_SOURCE_PIN_MISMATCH");
const summary=buildR1FrontierMeasurement({contract,aliasContract,dataset});
await mkdir(dirname(resolve(args.summary)),{recursive:true});
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
if(args.compact){
  await mkdir(dirname(resolve(args.compact)),{recursive:true});
  await writeFile(resolve(args.compact),JSON.stringify(compactR1FrontierEvidence(summary),null,2)+"\n","utf8");
}
process.stdout.write("R1_FRONTIER_SUMMARY="+JSON.stringify(summary)+"\n");
