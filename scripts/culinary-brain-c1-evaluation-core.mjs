export const C1_EVAL_SCHEMA_VERSION = "CULINARY_BRAIN_C1_EVALUATION_V1";
export const C1_EVAL_PREDICTION_SCHEMA_VERSION = "CULINARY_BRAIN_C1_EVALUATION_PREDICTIONS_V1";
export const C1_EVAL_CANARY_COUNT = 100;

export const C1_DISH_CATEGORIES = Object.freeze([
  "BEVERAGE","BREAD","CONDIMENT","DESSERT","EGG_DISH","FERMENTED_FOOD","GRAIN_DISH",
  "PROTEIN_DISH","SALAD","SAUCE","SEAFOOD_DISH","SOUP","STOCK","VEGETABLE_DISH"
]);
export const C1_MEAL_ROLES = Object.freeze(["BEVERAGE","BREAKFAST","DESSERT","MAIN","SIDE","SNACK"]);
export const C1_DECISIONS = Object.freeze(["PROPOSE","ABSTAIN","REVIEW"]);
export const C1_CONFIDENCE = Object.freeze(["LOW","MEDIUM","HIGH"]);

function validateFieldPrediction(value, vocabulary, row, field, errors) {
  if (!value || typeof value !== "object") {
    errors.push(`${row.recipeId} ${field} prediction missing`);
    return;
  }
  if (!C1_DECISIONS.includes(value.decision)) errors.push(`${row.recipeId} ${field} decision invalid`);
  if (!C1_CONFIDENCE.includes(value.confidence)) errors.push(`${row.recipeId} ${field} confidence invalid`);
  if (value.decision === "PROPOSE" && !vocabulary.includes(value.value)) errors.push(`${row.recipeId} ${field} proposed value invalid`);
  if (value.decision !== "PROPOSE" && value.value !== null) errors.push(`${row.recipeId} ${field} non-proposal value must be null`);
  if (typeof value.reasonCode !== "string" || !value.reasonCode.trim()) errors.push(`${row.recipeId} ${field} reasonCode required`);
}

export function validateC1Predictions(predictions, expectedIds) {
  const errors = [];
  if (!predictions || predictions.schemaVersion !== C1_EVAL_PREDICTION_SCHEMA_VERSION) errors.push("prediction schemaVersion mismatch");
  if (predictions?.protectedCorpusVersion !== "v8018") errors.push("prediction corpus version mismatch");
  if (!Array.isArray(predictions?.rows) || predictions.rows.length !== C1_EVAL_CANARY_COUNT) errors.push("prediction row count must be 100");
  const ids = Array.isArray(predictions?.rows) ? predictions.rows.map(row=>String(row?.recipeId||"")) : [];
  if (new Set(ids).size !== ids.length) errors.push("prediction recipe IDs must be unique");
  if (Array.isArray(expectedIds) && JSON.stringify(ids) !== JSON.stringify(expectedIds)) errors.push("prediction IDs/order must exactly match frozen canary");
  for (const row of predictions?.rows || []) {
    if (row.hardAuthorityClaim != null) errors.push(`${row.recipeId} hard authority claim forbidden`);
    validateFieldPrediction(row.dishCategory,C1_DISH_CATEGORIES,row,"dishCategory",errors);
    validateFieldPrediction(row.mealRole,C1_MEAL_ROLES,row,"mealRole",errors);
  }
  return errors;
}

function scoreField(prediction, reference) {
  const known = reference != null && reference !== "UNKNOWN";
  const proposed = prediction.decision === "PROPOSE";
  return {
    known,
    proposed,
    correct: known && proposed && prediction.value === reference,
    contradiction: known && proposed && prediction.value !== reference,
    highConfidenceContradiction: known && proposed && prediction.confidence === "HIGH" && prediction.value !== reference,
    highConfidenceUnknownProposal: !known && proposed && prediction.confidence === "HIGH"
  };
}

export function scoreC1Predictions(predictions, references, gates) {
  const refMap = new Map(references.map(row=>[row.recipeId,row]));
  let scoredAuthoritativeCells=0, proposedAuthoritativeCells=0, correctAuthoritativeCells=0;
  let highConfidenceContradictions=0, highConfidenceProposalsWhereReferenceUnknown=0;
  const perField={dishCategory:{known:0,proposed:0,correct:0},mealRole:{known:0,proposed:0,correct:0}};
  for (const row of predictions.rows) {
    const ref=refMap.get(row.recipeId);
    if (!ref) throw new Error("C1_REFERENCE_MISSING_"+row.recipeId);
    for (const field of ["dishCategory","mealRole"]) {
      const s=scoreField(row[field],ref[field]);
      if (s.known) {
        scoredAuthoritativeCells++;
        perField[field].known++;
        if (s.proposed) {
          proposedAuthoritativeCells++;
          perField[field].proposed++;
          if (s.correct) { correctAuthoritativeCells++; perField[field].correct++; }
        }
      }
      if (s.highConfidenceContradiction) highConfidenceContradictions++;
      if (s.highConfidenceUnknownProposal) highConfidenceProposalsWhereReferenceUnknown++;
    }
  }
  const precision = proposedAuthoritativeCells ? correctAuthoritativeCells / proposedAuthoritativeCells : 0;
  const hardAuthorityViolations = predictions.rows.filter(row=>row.hardAuthorityClaim != null).length;
  const invalidVocabularyOutputs = validateC1Predictions(predictions,predictions.rows.map(r=>r.recipeId)).length;
  const pass =
    scoredAuthoritativeCells >= gates.minimumScoredAuthoritativeCells &&
    proposedAuthoritativeCells >= gates.minimumScoredAuthoritativeCells &&
    precision >= gates.minimumPrecisionOnProposedAuthoritativeCells &&
    highConfidenceContradictions <= gates.maximumHighConfidenceContradictions &&
    highConfidenceProposalsWhereReferenceUnknown <= gates.maximumHighConfidenceProposalsWhereReferenceUnknown &&
    hardAuthorityViolations <= gates.maximumHardAuthorityViolations &&
    invalidVocabularyOutputs <= gates.maximumInvalidVocabularyOutputs;
  return {
    pass,
    terminal:pass?"CULINARY_BRAIN_C1_CANARY_PASS":"CULINARY_BRAIN_C1_CANARY_HOLD",
    scoredAuthoritativeCells,
    proposedAuthoritativeCells,
    correctAuthoritativeCells,
    precision:Number(precision.toFixed(6)),
    highConfidenceContradictions,
    highConfidenceProposalsWhereReferenceUnknown,
    hardAuthorityViolations,
    invalidVocabularyOutputs,
    perField
  };
}
