import test from "node:test";
import assert from "node:assert/strict";
import { quantile, quantitativeGroups, supportBand, synthesizeFamily } from "../scripts/recipe-family-synthesis-core.mjs";

const config = {
  supportBands: { CORE_SIGNAL_MIN: 0.7, COMMON_SIGNAL_MIN: 0.4, VARIANT_SIGNAL_MIN: 0.2 },
  variantPromotion: { candidateIndependentObservations: 1, observedIndependentObservations: 2, establishedIndependentObservations: 3 }
};

const source = id => ({
  publisher: id,
  publisherLedgerKey: id,
  independenceGroup: id,
  publicAttributionRequirement: "REQUIRED",
  publicAttributionState: "READY",
  sourceExpressionPersisted: false,
  sourceUrl: "https://example.invalid/" + id,
  reuseBasis: "OPEN_LICENCE",
  role: "STRUCTURE_EVIDENCE"
});

test("quantile interpolation is deterministic", () => {
  assert.equal(quantile([25, 25, 25, 50], 0.25), 25);
  assert.equal(quantile([25, 25, 25, 50], 0.75), 31.25);
});

test("support bands use configured thresholds", () => {
  assert.equal(supportBand(0.8, config.supportBands), "CORE_SIGNAL");
  assert.equal(supportBand(0.5, config.supportBands), "COMMON_SIGNAL");
  assert.equal(supportBand(0.2, config.supportBands), "VARIANT_SIGNAL");
  assert.equal(supportBand(0.19, config.supportBands), "ISOLATED_SIGNAL");
});

test("quantitative synthesis never mixes incompatible bases", () => {
  const observations = [
    { observationId:"a",source:source("a"),normalized:{quantitative:[{roleId:"x",lower:10,upper:10,basis:"MASS",unit:"pct"}]}},
    { observationId:"b",source:source("b"),normalized:{quantitative:[{roleId:"x",lower:12,upper:12,basis:"MASS",unit:"pct"}]}},
    { observationId:"c",source:source("c"),normalized:{quantitative:[{roleId:"x",lower:14,upper:14,basis:"MASS",unit:"pct"}]}},
    { observationId:"d",source:source("d"),normalized:{quantitative:[{roleId:"x",lower:99,upper:99,basis:"VOLUME",unit:"pct"}]}}
  ];
  const groups=quantitativeGroups(observations);
  assert.equal(groups.length,2);
  assert.equal(groups.find(x=>x.basis==="MASS").independentObservationCount,3);
  assert.equal(groups.find(x=>x.basis==="VOLUME").recommendedRange,null);
});

test("duplicate independence groups do not inflate family support", () => {
  const same = source("one");
  const rows = [
    {observationId:"a",familyId:"f",source:same,normalized:{ingredientRoles:["core"],techniques:["t"],quantitative:[],variantSignals:[]}},
    {observationId:"b",familyId:"f",source:{...same,publisher:"duplicate"},normalized:{ingredientRoles:["other"],techniques:["other"],quantitative:[],variantSignals:[]}},
    {observationId:"c",familyId:"f",source:source("two"),normalized:{ingredientRoles:["core"],techniques:["t"],quantitative:[],variantSignals:[]}},
    {observationId:"d",familyId:"f",source:source("three"),normalized:{ingredientRoles:["core"],techniques:["t"],quantitative:[],variantSignals:[]}}
  ];
  const out=synthesizeFamily(rows,config,{
    familyId:"f",minimumIndependentObservations:3,
    quantitativePolicy:{minimumIndependent:3,maxRobustSpreadRatio:4},
    requiredIngredientRoles:["core"],requiredTechniques:["t"],requiredQuantitativeRoles:[],
    projectCandidate:()=>({ok:true})
  });
  assert.equal(out.independentObservationCount,3);
  assert.equal(out.gate.appAuthoringEligible,true);
});

test("candidate gate fails closed when a required quantitative role has insufficient compatible evidence", () => {
  const rows=["a","b","c"].map((id,index)=>({
    observationId:id,familyId:"f",source:source(id),
    normalized:{ingredientRoles:["core"],techniques:["t"],variantSignals:[],quantitative:index<2?[{roleId:"q",lower:20,upper:20,basis:"B",unit:"pct"}]:[]}
  }));
  const out=synthesizeFamily(rows,config,{
    familyId:"f",minimumIndependentObservations:3,
    quantitativePolicy:{minimumIndependent:3,maxRobustSpreadRatio:4},
    requiredIngredientRoles:["core"],requiredTechniques:["t"],
    requiredQuantitativeRoles:[{roleId:"q",allowedBases:["B"]}],
    projectCandidate:()=>({ok:true})
  });
  assert.equal(out.gate.appAuthoringEligible,false);
  assert.equal(out.candidateAppOwnedRecipeProjection,null);
});
