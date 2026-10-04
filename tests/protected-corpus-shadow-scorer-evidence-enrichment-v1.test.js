import test from "node:test";
import assert from "node:assert/strict";
import {
  SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD,
  auditScorerEvidence,
  validateScorerEvidenceEnrichmentSummary
} from "../scripts/protected-corpus-shadow-scorer-evidence-enrichment-v1-core.mjs";

const config={
  schemaVersion:"CULINARY_PROTECTED_CORPUS_SHADOW_SCORER_EVIDENCE_ENRICHMENT_V1",
  entryTerminal:"V21_SHADOW_SIGNAL_COVERAGE_ADAPTER_PASS__LIVE_QUALITY_STILL_HELD__EVIDENCE_ENRICHMENT_NEXT",
  protectedCorpusVersion:"v8018",
  qualityCohortSize:500,
  qualityCohortDigestSha256:"digest",
  currentAverageAvailablePositiveWeightCoverage:0.436975,
  minimumAverageAvailablePositiveWeightCoverageForLiveReadiness:0.5,
  missingPositiveScorerSignals:["nutrition","protein","budget","mealPrep","novelty"],
  metadataAuthorityDimensionBySignal:{budget:"costTier",mealPrep:"mealPrepSuitability",novelty:"novelty"},
  expectedSafeAdditionalSignalCount:0
};
const entry={qualityCohortSize:500,qualityCohortDigestSha256:"digest",result:{terminal:config.entryTerminal}};
const metadata={protectedCorpusVersion:"v8018",rankedMetadataBlockers:[{dimension:"totalMinutes",authoritativeCount:1371},{dimension:"difficulty",authoritativeCount:1416}]};
const nutrition={protectedCorpusVersion:"v8018",protectedCorpusApplicability:{unitoolsCurrentEngine:{authoritativeCurrentEngineCount:0}}};

test("audit keeps missing scorer signals unknown when no matching authority exists",()=>{
  const audit=auditScorerEvidence({entry,metadata,nutrition,config});
  assert.equal(audit.safeAdditionalSignalCount,0);
  assert.deepEqual(audit.safeAdditionalSignals,[]);
  assert.equal(audit.postAuditCoverage,0.436975);
  assert.equal(audit.coverageGap,0.063025);
  assert.equal(audit.liveQualityEarned,false);
  assert.equal(audit.signalAudit.mealPrep.reason,"NO_AUTHORITATIVE_NORMALIZED_DIMENSION");
  assert.equal(audit.signalAudit.nutrition.reason,"NO_AUTHORITATIVE_PROTECTED_RECIPE_NUTRITION");
});

test("audit detects a future authoritative normalized scorer dimension instead of silently ignoring it",()=>{
  const future={...metadata,rankedMetadataBlockers:[...metadata.rankedMetadataBlockers,{dimension:"costTier",authoritativeCount:12}]};
  const audit=auditScorerEvidence({entry,metadata:future,nutrition,config});
  assert.deepEqual(audit.safeAdditionalSignals,["budget"]);
});

test("summary validation preserves fail-closed authority and unchanged coverage",()=>{
  const audit=auditScorerEvidence({entry,metadata,nutrition,config});
  const summary={
    schemaVersion:"CULINARY_PROTECTED_CORPUS_SHADOW_SCORER_EVIDENCE_ENRICHMENT_SUMMARY_V1",
    pass:true,
    terminal:SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD,
    qualityCohort:{size:500,digestSha256:"digest"},
    signalAudit:audit.signalAudit,
    safeAdditionalSignalCount:0,
    postAuditAverageAvailablePositiveWeightCoverage:0.436975,
    liveQualityEarned:false,
    disposition:{liveRecommendationAdmissionAuthorized:false,scorerBehaviorChangeAuthorized:false,neutralDefaultFillAuthorized:false},
    boundaries:{protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false}
  };
  assert.deepEqual(validateScorerEvidenceEnrichmentSummary(summary,config),[]);
});
