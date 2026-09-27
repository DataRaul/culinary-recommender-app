export const C1_NEGATIVE_CAPABILITY_SCHEMA_VERSION = "CULINARY_BRAIN_C1_NEGATIVE_CAPABILITY_V1";
export const C1_NEGATIVE_PREDICTION_SCHEMA_VERSION = "CULINARY_BRAIN_C1_UNSEEN_400_PREDICTIONS_V1";

export function evaluateC1NegativeCapability({contract,packet,predictions,coverage}) {
  const errors=[];
  if(contract?.schemaVersion!==C1_NEGATIVE_CAPABILITY_SCHEMA_VERSION) errors.push("contract schema mismatch");
  if(packet?.schemaVersion!=="CULINARY_BRAIN_C1_UNSEEN_400_INPUT_V1") errors.push("packet schema mismatch");
  if(predictions?.schemaVersion!==C1_NEGATIVE_PREDICTION_SCHEMA_VERSION) errors.push("prediction schema mismatch");
  if(coverage?.terminal!=="CULINARY_BRAIN_C1_UNSEEN_REMAINDER_HAS_ZERO_AUTHORITATIVE_SEMANTIC_REFERENCE_CELLS") errors.push("reference coverage terminal mismatch");
  if(coverage?.authoritativeReferenceCells?.unseenRemainder400?.total!==0) errors.push("unseen reference cells must remain zero");
  if(packet?.recipeCount!==400||packet?.rows?.length!==400) errors.push("packet must contain exactly 400 rows");
  if(predictions?.rows?.length!==400) errors.push("predictions must contain exactly 400 rows");
  const expectedIds=(packet?.rows||[]).map(row=>String(row.recipeId||""));
  const actualIds=(predictions?.rows||[]).map(row=>String(row.recipeId||""));
  if(JSON.stringify(expectedIds)!==JSON.stringify(actualIds)) errors.push("prediction IDs/order mismatch");
  if(new Set(actualIds).size!==400) errors.push("prediction IDs must be unique");

  let proposedCells=0,abstainOrReviewCells=0,highConfidenceCells=0,hardAuthorityViolations=0,invalidVocabularyOutputs=0;
  for(const row of predictions?.rows||[]){
    if(row.hardAuthorityClaim!=null) hardAuthorityViolations++;
    for(const field of ["dishCategory","mealRole"]){
      const value=row[field];
      if(!value||typeof value!=="object"){invalidVocabularyOutputs++;continue;}
      if(value.confidence==="HIGH") highConfidenceCells++;
      if(value.decision==="PROPOSE") proposedCells++;
      else if(value.decision==="ABSTAIN"||value.decision==="REVIEW") abstainOrReviewCells++;
      else invalidVocabularyOutputs++;
      if(value.decision!=="PROPOSE"&&value.value!==null) invalidVocabularyOutputs++;
      if(typeof value.reasonCode!=="string"||!value.reasonCode.trim()) invalidVocabularyOutputs++;
    }
  }
  const evaluatedCells=(predictions?.rows?.length||0)*2;
  const gates=contract.preregisteredGates||{};
  const pass=errors.length===0
    && predictions.rows.length===gates.exactPredictionRowCount
    && evaluatedCells===gates.exactEvaluatedCellCount
    && proposedCells<=gates.maximumProposedCells
    && abstainOrReviewCells>=gates.minimumAbstainOrReviewCells
    && highConfidenceCells<=gates.maximumHighConfidenceCells
    && hardAuthorityViolations<=gates.maximumHardAuthorityViolations
    && invalidVocabularyOutputs<=gates.maximumInvalidVocabularyOutputs;
  return {
    pass,
    terminal:pass?"CULINARY_BRAIN_C1_UNSEEN_400_NEGATIVE_CAPABILITY_PASS":"CULINARY_BRAIN_C1_UNSEEN_400_NEGATIVE_CAPABILITY_HOLD",
    errors,
    recipeCount:predictions?.rows?.length||0,
    evaluatedCells,
    proposedCells,
    abstainOrReviewCells,
    highConfidenceCells,
    hardAuthorityViolations,
    invalidVocabularyOutputs
  };
}
