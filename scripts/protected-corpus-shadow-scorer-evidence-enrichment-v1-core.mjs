export const SCORER_EVIDENCE_ENRICHMENT_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SCORER_EVIDENCE_ENRICHMENT_V1";
export const SCORER_EVIDENCE_ENRICHMENT_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SCORER_EVIDENCE_ENRICHMENT_SUMMARY_V1";
export const SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD="V21_SHADOW_SCORER_EVIDENCE_ENRICHMENT_PASS__NO_ADDITIONAL_SAFE_SCORER_SIGNAL__SCORER_POLICY_REVIEW_NEXT";
export const SCORER_EVIDENCE_ENRICHMENT_TERMINAL_READY="V21_SHADOW_SCORER_EVIDENCE_ENRICHMENT_PASS__LIVE_QUALITY_CANDIDATE_READY";

const REQUIRED_SIGNALS=["nutrition","protein","budget","mealPrep","novelty"];

function authoritativeDimensionCount(metadata,dimension){
  const row=(metadata?.rankedMetadataBlockers||[]).find(item=>item?.dimension===dimension);
  return Number(row?.authoritativeCount||0);
}

export function auditScorerEvidence({entry,metadata,nutrition,config}){
  if(config?.schemaVersion!==SCORER_EVIDENCE_ENRICHMENT_SCHEMA) throw new Error("SCORER_EVIDENCE_ENRICHMENT_CONFIG_SCHEMA");
  if(entry?.result?.terminal!==config.entryTerminal) throw new Error("SCORER_EVIDENCE_ENRICHMENT_ENTRY_TERMINAL");
  if(entry?.qualityCohortSize!==config.qualityCohortSize || entry?.qualityCohortDigestSha256!==config.qualityCohortDigestSha256) throw new Error("SCORER_EVIDENCE_ENRICHMENT_COHORT_DRIFT");
  if(metadata?.protectedCorpusVersion!==config.protectedCorpusVersion || nutrition?.protectedCorpusVersion!==config.protectedCorpusVersion) throw new Error("SCORER_EVIDENCE_ENRICHMENT_VERSION_DRIFT");

  const authoritativeNutritionCount=Number(nutrition?.protectedCorpusApplicability?.unitoolsCurrentEngine?.authoritativeCurrentEngineCount||0);
  const signalAudit={
    nutrition:{
      safeAdditionalEvidenceAvailable:false,
      authoritativeRecipeCount:authoritativeNutritionCount,
      reason:authoritativeNutritionCount===0
        ?"NO_AUTHORITATIVE_PROTECTED_RECIPE_NUTRITION"
        :"NO_JOINABLE_AUTHORITATIVE_NUTRIENT_VALUES_FROZEN_FOR_THIS_COHORT"
    },
    protein:{
      safeAdditionalEvidenceAvailable:false,
      authoritativeRecipeCount:authoritativeNutritionCount,
      reason:authoritativeNutritionCount===0
        ?"NO_AUTHORITATIVE_PROTECTED_RECIPE_NUTRITION"
        :"NO_JOINABLE_AUTHORITATIVE_PROTEIN_VALUES_FROZEN_FOR_THIS_COHORT"
    }
  };

  for(const signal of ["budget","mealPrep","novelty"]){
    const dimension=config.metadataAuthorityDimensionBySignal?.[signal];
    const count=authoritativeDimensionCount(metadata,dimension);
    signalAudit[signal]={
      safeAdditionalEvidenceAvailable:count>0,
      authoritativeRecipeCount:count,
      requiredAuthorityDimension:dimension,
      reason:count>0?"AUTHORITATIVE_NORMALIZED_DIMENSION_AVAILABLE":"NO_AUTHORITATIVE_NORMALIZED_DIMENSION"
    };
  }

  const safeAdditionalSignals=REQUIRED_SIGNALS.filter(signal=>signalAudit[signal]?.safeAdditionalEvidenceAvailable);
  const currentCoverage=Number(config.currentAverageAvailablePositiveWeightCoverage);
  const threshold=Number(config.minimumAverageAvailablePositiveWeightCoverageForLiveReadiness);
  return {
    signalAudit,
    safeAdditionalSignals,
    safeAdditionalSignalCount:safeAdditionalSignals.length,
    currentCoverage,
    postAuditCoverage:currentCoverage,
    coverageGap:Number(Math.max(0,threshold-currentCoverage).toFixed(6)),
    liveQualityEarned:currentCoverage>=threshold
  };
}

export function validateScorerEvidenceEnrichmentSummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==SCORER_EVIDENCE_ENRICHMENT_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==SCORER_EVIDENCE_ENRICHMENT_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true) errors.push("pass");
  const expectedTerminal=summary?.liveQualityEarned?SCORER_EVIDENCE_ENRICHMENT_TERMINAL_READY:SCORER_EVIDENCE_ENRICHMENT_TERMINAL_HELD;
  if(summary?.terminal!==expectedTerminal) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  if(summary?.safeAdditionalSignalCount!==config.expectedSafeAdditionalSignalCount) errors.push("safeAdditionalSignalCount");
  if(summary?.postAuditAverageAvailablePositiveWeightCoverage!==config.currentAverageAvailablePositiveWeightCoverage) errors.push("coverageMutation");
  if(summary?.liveQualityEarned!==false) errors.push("liveQuality");
  for(const signal of REQUIRED_SIGNALS) if(!summary?.signalAudit?.[signal]) errors.push("signal."+signal);
  if(summary?.disposition?.liveRecommendationAdmissionAuthorized!==false || summary?.disposition?.scorerBehaviorChangeAuthorized!==false || summary?.disposition?.neutralDefaultFillAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
