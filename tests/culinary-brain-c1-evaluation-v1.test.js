import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  C1_EVAL_PREDICTION_SCHEMA_VERSION,
  scoreC1Predictions,
  validateC1Predictions
} from "../scripts/culinary-brain-c1-evaluation-core.mjs";

const config=JSON.parse(readFileSync("config/culinary_brain_c1_evaluation_v1.json","utf8"));
const packet=JSON.parse(readFileSync("data/generated/culinary-brain-c1-evaluation-canary-input-v1.json","utf8"));

function predictionsFor(valueFn=()=>({dishCategory:"SOUP",mealRole:"MAIN"})) {
  return {
    schemaVersion:C1_EVAL_PREDICTION_SCHEMA_VERSION,
    protectedCorpusVersion:"v8018",
    rows:packet.rows.map((row,index)=>{
      const v=valueFn(row,index);
      return {
        recipeId:row.recipeId,
        dishCategory:{decision:"PROPOSE",value:v.dishCategory,confidence:"MEDIUM",reasonCode:"TEST"},
        mealRole:{decision:"PROPOSE",value:v.mealRole,confidence:"MEDIUM",reasonCode:"TEST"}
      };
    })
  };
}

test("C1 canary packet is exact, blind and includes all structural exceptions",()=>{
  assert.equal(packet.recipeCount,100);
  assert.equal(packet.rows.length,100);
  assert.equal(new Set(packet.rows.map(row=>row.recipeId)).size,100);
  assert.equal(packet.rows.filter(row=>row.sourceContext==="MODERN_OR_CONTEMPORARY_DATASET").length,44);
  assert.equal(packet.rows.filter(row=>row.sourceContext==="HISTORICAL_SOURCE").length,56);
  assert.equal(packet.rows.filter(row=>row.structuralBoundary==="STRUCTURAL_EXCEPTION").length,3);
  assert.equal(packet.blinded.authoritativeDishCategoryHidden,true);
  assert.equal(packet.blinded.authoritativeMealRoleHidden,true);
  assert.equal(packet.blinded.noProtectedBodyContent,true);
  assert.equal(packet.frozenSampleDigestSha256,config.frozenSample.digestSha256);
});

test("C1 prediction schema rejects hard authority and invalid vocabulary",()=>{
  const predictions=predictionsFor();
  assert.deepEqual(validateC1Predictions(predictions,packet.rows.map(row=>row.recipeId)),[]);
  predictions.rows[0].hardAuthorityClaim="ALLERGEN_SAFE";
  predictions.rows[1].dishCategory.value="MADE_UP_CATEGORY";
  const errors=validateC1Predictions(predictions,packet.rows.map(row=>row.recipeId));
  assert.ok(errors.some(error=>error.includes("hard authority")));
  assert.ok(errors.some(error=>error.includes("proposed value invalid")));
});

test("C1 scorer applies preregistered precision and overconfidence gates",()=>{
  const predictions=predictionsFor();
  const references=packet.rows.map(row=>({recipeId:row.recipeId,dishCategory:"SOUP",mealRole:"MAIN"}));
  const pass=scoreC1Predictions(predictions,references,config.preregisteredGates);
  assert.equal(pass.pass,true);
  assert.equal(pass.precision,1);
  assert.equal(pass.highConfidenceContradictions,0);

  predictions.rows[0].dishCategory={decision:"PROPOSE",value:"SALAD",confidence:"HIGH",reasonCode:"TEST"};
  const hold=scoreC1Predictions(predictions,references,config.preregisteredGates);
  assert.equal(hold.pass,false);
  assert.equal(hold.highConfidenceContradictions,1);
});

test("C1 scorer treats unknown reference as unscored and forbids high-confidence unsupported proposals",()=>{
  const predictions=predictionsFor();
  const references=packet.rows.map((row,index)=>({
    recipeId:row.recipeId,
    dishCategory:index<20?"SOUP":"UNKNOWN",
    mealRole:index<20?"MAIN":"UNKNOWN"
  }));
  predictions.rows[25].dishCategory={decision:"PROPOSE",value:"SOUP",confidence:"HIGH",reasonCode:"TITLE_GUESS"};
  const score=scoreC1Predictions(predictions,references,config.preregisteredGates);
  assert.equal(score.highConfidenceProposalsWhereReferenceUnknown,1);
  assert.equal(score.pass,false);
});
