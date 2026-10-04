import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import {
  SCORER_EVIDENCE_ENRICHMENT_SUMMARY_SCHEMA,
  SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD,
  SCORER_EVIDENCE_ENRICHMENT_TERMINAL_READY,
  auditScorerEvidence,
  validateScorerEvidenceEnrichmentSummary
} from "./protected-corpus-shadow-scorer-evidence-enrichment-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["entry","metadata","nutrition","config","output","summary"]) if(!args[key]) throw new Error("SCORER_EVIDENCE_ENRICHMENT_ARGUMENT_REQUIRED_"+key);

const [entry,metadata,nutrition,config]=await Promise.all([
  readFile(resolve(args.entry),"utf8").then(JSON.parse),
  readFile(resolve(args.metadata),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

const audit=auditScorerEvidence({entry,metadata,nutrition,config});
if(audit.safeAdditionalSignalCount!==config.expectedSafeAdditionalSignalCount) throw new Error("SCORER_EVIDENCE_ENRICHMENT_UNEXPECTED_SAFE_SIGNAL_COUNT");

const liveQualityEarned=audit.liveQualityEarned;
const summary={
  schemaVersion:SCORER_EVIDENCE_ENRICHMENT_SUMMARY_SCHEMA,
  date:"2026-10-04",
  pass:true,
  terminal:liveQualityEarned?SCORER_EVIDENCE_ENRICHMENT_TERMINAL_READY:SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD,
  protectedCorpusVersion:config.protectedCorpusVersion,
  currentPublicRuntimeRecipeCount:86,
  qualityCohort:{size:config.qualityCohortSize,digestSha256:config.qualityCohortDigestSha256},
  evidencePolicy:config.evidencePolicy,
  signalAudit:audit.signalAudit,
  safeAdditionalSignals:audit.safeAdditionalSignals,
  safeAdditionalSignalCount:audit.safeAdditionalSignalCount,
  baselineAverageAvailablePositiveWeightCoverage:audit.currentCoverage,
  postAuditAverageAvailablePositiveWeightCoverage:audit.postAuditCoverage,
  minimumAverageAvailablePositiveWeightCoverageForLiveReadiness:config.minimumAverageAvailablePositiveWeightCoverageForLiveReadiness,
  remainingCoverageGap:audit.coverageGap,
  liveQualityEarned,
  disposition:{
    auditComplete:true,
    evidenceEnrichmentApplied:false,
    liveRecommendationAdmissionAuthorized:false,
    scorerBehaviorChangeAuthorized:false,
    neutralDefaultFillAuthorized:false,
    nextDesignReviewRequired:!liveQualityEarned
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,scorerBehaviorChanged:false,
    candidateClassificationPromoted:false,dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:liveQualityEarned?config.nextGateIfLiveQualityEarned:config.nextGateIfNoSafeEnrichment
};

const errors=validateScorerEvidenceEnrichmentSummary(summary,config);
if(errors.length) throw new Error("SCORER_EVIDENCE_ENRICHMENT_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(summary,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SCORER_EVIDENCE_ENRICHMENT_SUMMARY="+JSON.stringify(summary)+"\n");
