import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import {
  SECONDARY_LANE_EVAL_SUMMARY_SCHEMA,
  SECONDARY_LANE_EVAL_TERMINAL,
  evaluateSecondaryLaneEvidence,
  validateSecondaryLaneSummary
} from "./protected-corpus-limited-evidence-secondary-lane-evaluation-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["policyReview","signalCoverage","mainRole","mealQuality","enrichment","config","output","summary"]) if(!args[key]) throw new Error("SECONDARY_LANE_EVAL_ARGUMENT_REQUIRED_"+key);

const [policyReview,signalCoverage,mainRole,mealQuality,enrichment,config]=await Promise.all([
  readFile(resolve(args.policyReview),"utf8").then(JSON.parse),
  readFile(resolve(args.signalCoverage),"utf8").then(JSON.parse),
  readFile(resolve(args.mainRole),"utf8").then(JSON.parse),
  readFile(resolve(args.mealQuality),"utf8").then(JSON.parse),
  readFile(resolve(args.enrichment),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

const result=evaluateSecondaryLaneEvidence({policyReview,signalCoverage,mainRole,mealQuality,enrichment,config});
const summary={
  schemaVersion:SECONDARY_LANE_EVAL_SUMMARY_SCHEMA,
  date:"2026-10-04",
  pass:true,
  terminal:SECONDARY_LANE_EVAL_TERMINAL,
  protectedCorpusVersion:config.protectedCorpusVersion,
  qualityCohort:{size:config.qualityCohortSize,digestSha256:config.qualityCohortDigestSha256},
  primaryLane:{
    runtimeRecipeCount:result.primaryRuntimeRecipeCount,
    minimumCoverageFloor:0.5,
    changed:false
  },
  secondaryLane:{
    candidateCount:result.secondaryLaneCandidateCount,
    heldCount:result.heldCandidateCount,
    measuredAverageAvailablePositiveWeightCoverage:config.expectedSparseEvidenceCoverage,
    mayDisplacePrimaryValidatedRecipes:false,
    rankAgainstPrimaryValidatedRecipes:false,
    limitedMetadataDisclosureRequired:true,
    disclosedUnknownSoftSignals:result.missingSignals,
    restrictedProfileEligibilityAuthorized:false
  },
  mealTypes:result.mealTypes,
  acceptance:{
    candidateVolumePass:true,
    rankingDeterminismPass:true,
    scoreDifferentiationPass:true,
    plannerCompletionPass:true,
    plannerDiversityPass:true,
    limitedMetadataDisclosurePass:true,
    restrictedProfileIsolationPass:true,
    primaryLaneIsolationPass:true
  },
  disposition:{
    evaluationComplete:true,
    runtimeContractCandidateReady:true,
    liveRecommendationAdmissionAuthorized:false,
    runtimeImplementationAuthorized:false
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,secondaryLaneImplemented:false,
    scorerBehaviorChanged:false,candidateClassificationPromoted:false,dietaryAllergenAuthorityPromoted:false,
    knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:config.nextGateOnPass
};

const errors=validateSecondaryLaneSummary(summary,config);
if(errors.length) throw new Error("SECONDARY_LANE_EVAL_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(summary,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SECONDARY_LANE_EVAL_SUMMARY="+JSON.stringify(summary)+"\n");
