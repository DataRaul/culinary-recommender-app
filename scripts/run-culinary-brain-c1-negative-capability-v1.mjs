import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { evaluateC1NegativeCapability } from "./culinary-brain-c1-negative-capability-core.mjs";

function argsOf(argv){
  const out={
    contract:"config/culinary_brain_c1_negative_capability_v1.json",
    packet:"data/generated/culinary-brain-c1-unseen-400-input-v1.json",
    predictions:"data/generated/culinary-brain-c1-unseen-400-predictions-v1.json",
    coverage:"data/generated/culinary-brain-c1-reference-coverage-audit-v1.json",
    output:".tmp/culinary-brain-c1-negative-capability-evidence-v1.json"
  };
  for(const arg of argv){const [key,...rest]=arg.replace(/^--/,"").split("=");if(!Object.hasOwn(out,key))throw new Error("UNKNOWN_ARGUMENT_"+arg);out[key]=rest.join("=");}
  return out;
}
const args=argsOf(process.argv.slice(2));
const [contract,packet,predictions,coverage]=await Promise.all([
  readFile(resolve(args.contract),"utf8").then(JSON.parse),
  readFile(resolve(args.packet),"utf8").then(JSON.parse),
  readFile(resolve(args.predictions),"utf8").then(JSON.parse),
  readFile(resolve(args.coverage),"utf8").then(JSON.parse)
]);
const result=evaluateC1NegativeCapability({contract,packet,predictions,coverage});
const output={
  schemaVersion:"CULINARY_BRAIN_C1_NEGATIVE_CAPABILITY_EVIDENCE_V1",
  date:"2026-09-27",
  protectedCorpusVersion:"v8018",
  frozenSampleDigestSha256:contract.frozenSampleDigestSha256,
  result,
  referenceCoverage:{
    unseenAuthoritativeSemanticCells:coverage.authoritativeReferenceCells.unseenRemainder400.total,
    semanticAccuracyMeasurable:false
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesReadOrExported:0,hardAuthorityGranted:false,
    publicRuntimeChanged:false,recommendationAdmissionChanged:false,knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:result.pass?"C1_COMBINED_500_CLOSEOUT_REVIEW":"C1_NEGATIVE_CAPABILITY_REPAIR"
};
await mkdir(dirname(resolve(args.output)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(output,null,2)+"\n","utf8");
process.stdout.write("C1_NEGATIVE_CAPABILITY="+JSON.stringify(output)+"\n");
if(!result.pass) process.exitCode=2;
