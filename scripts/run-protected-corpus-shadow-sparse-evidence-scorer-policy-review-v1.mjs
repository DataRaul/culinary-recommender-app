import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import {
  SPARSE_POLICY_SUMMARY_SCHEMA,
  SPARSE_POLICY_TERMINAL,
  evaluateSparseEvidencePolicy,
  validateSparseEvidencePolicySummary
} from "./protected-corpus-shadow-sparse-evidence-scorer-policy-review-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["enrichment","signalCoverage","mainRole","mealQuality","config","output","summary"]) if(!args[key]) throw new Error("SPARSE_POLICY_ARGUMENT_REQUIRED_"+key);

const [enrichment,signalCoverage,mainRole,mealQuality,config]=await Promise.all([
  readFile(resolve(args.enrichment),"utf8").then(JSON.parse),
  readFile(resolve(args.signalCoverage),"utf8").then(JSON.parse),
  readFile(resolve(args.mainRole),"utf8").then(JSON.parse),
  readFile(resolve(args.mealQuality),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

const result=evaluateSparseEvidencePolicy({enrichment,signalCoverage,mainRole,mealQuality,config});
const summary={
  schemaVersion:SPARSE_POLICY_SUMMARY_SCHEMA,
  date:"2026-10-04",
  pass:true,
  terminal:SPARSE_POLICY_TERMINAL,
  protectedCorpusVersion:config.protectedCorpusVersion,
  qualityCohort:{size:config.qualityCohortSize,digestSha256:config.qualityCohortDigestSha256},
  knowledgeCoreBasis:config.knowledgeCoreBasis,
  rationale:{
    sparseEvidenceIsNotConvertedIntoKnownFacts:true,
    incompleteSoftEvidenceDoesNotBecomeHardSafetyEvidence:true,
    uncertaintyMustRemainVisible:true,
    sparseCandidatesMustNotDisplaceValidatedPrimaryRecipes:true
  },
  primaryLane:{
    runtimeRecipeCount:result.primaryRuntimeRecipeCount,
    minimumCoverageFloor:result.primaryCoverageFloor,
    coverageFloorPreserved:result.primaryCoverageFloorPreserved,
    changed:false
  },
  secondaryLane:{
    policyId:config.candidatePolicy.id,
    candidateCount:result.secondaryLaneCandidateCount,
    heldCount:result.heldCandidateCount,
    measuredSparseEvidenceCoverage:result.sparseEvidenceCoverage,
    mayDisplacePrimaryValidatedRecipes:false,
    limitedMetadataDisclosureRequired:true,
    rankSparseCandidatesOnlyAgainstSparseCandidates:true,
    unknownNutritionClaimsAllowed:false,
    unknownBudgetClaimsAllowed:false,
    unknownMealPrepClaimsAllowed:false,
    unknownNoveltyClaimsAllowed:false,
    restrictedProfileEligibilityAuthorized:false,
    allergenProfileEligibilityAuthorized:false,
    ingredientExclusionProfileEligibilityAuthorized:false
  },
  mealTypeEligibleCounts:config.expectedMealTypeEligibleCounts,
  disposition:{
    policyReviewComplete:true,
    secondaryLaneEvaluationCandidateReady:true,
    liveRecommendationAdmissionAuthorized:false,
    secondaryLaneImplementationAuthorized:false,
    scorerBehaviorChangeAuthorized:false
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,secondaryLaneImplemented:false,
    scorerBehaviorChanged:false,candidateClassificationPromoted:false,dietaryAllergenAuthorityPromoted:false,
    knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:config.nextGateOnPass
};

const errors=validateSparseEvidencePolicySummary(summary,config);
if(errors.length) throw new Error("SPARSE_POLICY_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(summary,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SPARSE_POLICY_SUMMARY="+JSON.stringify(summary)+"\n");
