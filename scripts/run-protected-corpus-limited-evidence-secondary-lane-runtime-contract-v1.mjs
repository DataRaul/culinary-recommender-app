import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import {
  SECONDARY_RUNTIME_CONTRACT_SUMMARY_SCHEMA,
  SECONDARY_RUNTIME_CONTRACT_TERMINAL,
  buildSecondaryLaneEnvelope,
  normalizeSecondaryRequest,
  validateRuntimeContract,
  validateRuntimeContractSummary
} from "./protected-corpus-limited-evidence-secondary-lane-runtime-contract-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["evaluation","contract","output","summary"]) if(!args[key]) throw new Error("SECONDARY_RUNTIME_CONTRACT_ARGUMENT_REQUIRED_"+key);

const [evaluation,contract]=await Promise.all([
  readFile(resolve(args.evaluation),"utf8").then(JSON.parse),
  readFile(resolve(args.contract),"utf8").then(JSON.parse)
]);

const contractErrors=validateRuntimeContract(contract,evaluation);
if(contractErrors.length) throw new Error("SECONDARY_RUNTIME_CONTRACT_INVALID__"+contractErrors.join(","));

const unrestrictedProfile={dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]};
const explicit=normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile:unrestrictedProfile,limit:99},contract);
const defaultMode=normalizeSecondaryRequest({profile:unrestrictedProfile,limit:5},contract);
const restricted=normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile:{...unrestrictedProfile,allergens:["egg"]},limit:5},contract);
const envelope=buildSecondaryLaneEnvelope({
  primary:[{id:"primary-a"}],
  secondary:Array.from({length:explicit.limit},(_,i)=>({id:"secondary-"+(i+1)})),
  requestState:explicit,
  contract
});
if(explicit.eligible!==true||explicit.limit!==20) throw new Error("SECONDARY_RUNTIME_CONTRACT_EXPLICIT_FIXTURE");
if(defaultMode.eligible!==false||defaultMode.reason!=="SECONDARY_MODE_NOT_EXPLICITLY_ENABLED") throw new Error("SECONDARY_RUNTIME_CONTRACT_DEFAULT_FIXTURE");
if(restricted.eligible!==false||restricted.reason!=="RESTRICTED_PROFILE_NOT_ELIGIBLE") throw new Error("SECONDARY_RUNTIME_CONTRACT_RESTRICTED_FIXTURE");
if(envelope.primary.length!==1||envelope.secondaryLane.results.length!==20||envelope.secondaryLane.mayDisplacePrimary!==false) throw new Error("SECONDARY_RUNTIME_CONTRACT_ENVELOPE_FIXTURE");

const summary={
  schemaVersion:SECONDARY_RUNTIME_CONTRACT_SUMMARY_SCHEMA,
  date:"2026-10-04",
  pass:true,
  terminal:SECONDARY_RUNTIME_CONTRACT_TERMINAL,
  protectedCorpusVersion:contract.protectedCorpusVersion,
  primaryRuntimeRecipeCount:contract.primaryRuntimeRecipeCount,
  secondaryLaneCandidateCount:contract.secondaryLaneCandidateCount,
  heldCandidateCount:contract.heldCandidateCount,
  contractChecks:{
    ownerOnlyExplicitOptIn:true,
    defaultModeDisabled:true,
    rankingSeparation:true,
    restrictedProfilesFailClosed:true,
    maximumSecondaryResults:contract.requestContract.maximumSecondaryResults,
    boundedReadOnlyCost:true,
    maximumD1SubqueriesPerRequest:contract.runtimeCostContract.maximumD1SubqueriesPerRequest,
    fullCorpusScansAllowed:contract.runtimeCostContract.fullCorpusScansAllowed,
    limitedMetadataDisclosureRequired:true,
    singleFlagRollback:true
  },
  fixtures:{
    explicitUnrestricted:{eligible:explicit.eligible,limit:explicit.limit},
    defaultMode:{eligible:defaultMode.eligible,reason:defaultMode.reason},
    restrictedAllergen:{eligible:restricted.eligible,reason:restricted.reason},
    responseEnvelope:{primaryCount:envelope.primary.length,secondaryCount:envelope.secondaryLane.results.length}
  },
  disposition:{
    contractComplete:true,
    boundedImplementationCandidateReady:true,
    runtimeImplementationAuthorized:false,
    ownerCanaryActivationAuthorized:false,
    publicRuntimeWideningAuthorized:false
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,fullCorpusScans:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,secondaryLaneImplemented:false,candidateManifestWritten:false,
    knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:contract.nextGateOnPass
};

const errors=validateRuntimeContractSummary(summary,contract);
if(errors.length) throw new Error("SECONDARY_RUNTIME_CONTRACT_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(summary,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SECONDARY_RUNTIME_CONTRACT_SUMMARY="+JSON.stringify(summary)+"\n");
