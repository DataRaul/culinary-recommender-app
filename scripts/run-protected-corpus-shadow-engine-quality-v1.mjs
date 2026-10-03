import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import {
  SHADOW_ENGINE_SUMMARY_SCHEMA,
  SHADOW_ENGINE_TERMINAL,
  averageEvidence,
  buildShadowEngineCandidates,
  rankingDigest,
  sourceCounts,
  validateShadowEngineSummary,
  weightedShadowRanking
} from "./protected-corpus-shadow-engine-quality-v1-core.mjs";

const sha=value=>createHash("sha256").update(String(value)).digest("hex");
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["mapping","nutrition","c2","baselineConfig","qualityConfig","output","summary"]) if(!args[key]) throw new Error("SHADOW_ENGINE_ARGUMENT_REQUIRED_"+key);

const [mapping,nutrition,c2Full,baselineConfig,qualityConfig]=await Promise.all([
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.baselineConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.qualityConfig),"utf8").then(JSON.parse)
]);

const {rows:candidates,evidenceRich}=buildShadowEngineCandidates({mapping,nutrition,c2Full,baselineConfig,qualityConfig});
const profile=normalizeProfile({...DEFAULT_PROFILE,...qualityConfig.shadowProfile});

const controlA=rankRecipes(candidates.map(row=>row.recipe),profile,{mode:"shadow"});
const controlB=rankRecipes(candidates.map(row=>row.recipe),profile,{mode:"shadow"});
if(controlA.eligible.length!==candidates.length) throw new Error("SHADOW_ENGINE_CONTROL_ELIGIBILITY_"+controlA.eligible.length);
const nonFiniteEligibleScoreCount=controlA.eligible.filter(row=>!Number.isFinite(row.score)).length;
const controlTop100=controlA.eligible.slice(0,100);

const comparisonA=weightedShadowRanking(controlA.eligible);
const comparisonB=weightedShadowRanking(controlB.eligible);
const evidenceRichIds=new Set(evidenceRich.map(row=>row.recipe.id));
const comparisonEvidenceRich=comparisonA.filter(row=>evidenceRichIds.has(row.recipe.id));
if(comparisonEvidenceRich.length!==qualityConfig.expectedEvidenceRichPoolCount) throw new Error("SHADOW_ENGINE_WEIGHTED_EVIDENCE_POOL_"+comparisonEvidenceRich.length);
const qualityCohort=comparisonEvidenceRich.slice(0,qualityConfig.firstQualityCohortSize);
const minEvidence=Math.min(...qualityCohort.map(row=>row.evidenceScore));

const outside=rankRecipes(candidates.map(row=>row.recipe),profile,{});
const vegetarianProfile=normalizeProfile({...profile,dietaryMode:"vegetarian"});
const eggProfile=normalizeProfile({...profile,allergens:["egg"]});
const vegetarian=rankRecipes(candidates.map(row=>row.recipe),vegetarianProfile,{mode:"shadow"});
const egg=rankRecipes(candidates.map(row=>row.recipe),eggProfile,{mode:"shadow"});

const liveA=rankRecipes(PUBLIC_RUNTIME_RECIPES,profile,{});
const liveB=rankRecipes(PUBLIC_RUNTIME_RECIPES,profile,{});
const qualityRecipes=qualityCohort.map(row=>row.recipe);
const combined=rankRecipes([...PUBLIC_RUNTIME_RECIPES,...qualityRecipes],profile,{mode:"shadow"});

const plannerSlots=Array.from({length:Number(qualityConfig.qualityEvaluation.plannerProbe.slotCount)},(_,i)=>({
  id:`shadow-breakfast-${i+1}`,order:i+1,day:`Probe ${i+1}`,mealType:"breakfast"
}));
const plannerA=planSlots([...PUBLIC_RUNTIME_RECIPES,...qualityRecipes],profile,plannerSlots,{mode:"shadow"});
const plannerB=planSlots([...PUBLIC_RUNTIME_RECIPES,...qualityRecipes],profile,plannerSlots,{mode:"shadow"});
const plannerDigest=p=>sha(JSON.stringify({
  items:p.items.map(row=>[row.slot.id,row.recipe.id,row.score,row.portfolioScore]),
  shortfalls:p.shortfalls,
  complete:p.complete
}));

const candidateById=new Map(candidates.map(row=>[row.recipe.id,row]));
const keyOf=id=>candidateById.get(id)?.recipeKey || id;
const qualityKeys=qualityCohort.map(row=>keyOf(row.recipe.id));
const controlDigestA=rankingDigest(controlA.eligible);
const controlDigestB=rankingDigest(controlB.eligible);
const comparisonDigestA=rankingDigest(comparisonA,"weightedShadowScore");
const comparisonDigestB=rankingDigest(comparisonB,"weightedShadowScore");
const controlTop100AverageEvidence=averageEvidence(controlTop100);
const comparisonTop100AverageEvidence=averageEvidence(comparisonA.slice(0,100));
const combinedTop20=combined.eligible.slice(0,20).map(row=>({
  recipeId:row.recipe.id,
  recipeKey:keyOf(row.recipe.id),
  shadowCandidate:row.recipe.governance?.recommendationState==="SHADOW_CANDIDATE_ONLY",
  score:row.score,
  evidenceScore:row.recipe.governance?.shadowEvidenceScore ?? null
}));

const pass=
  candidates.length===qualityConfig.expectedNewUnrestrictedShadowCandidateCount &&
  evidenceRich.length===qualityConfig.expectedEvidenceRichPoolCount &&
  qualityCohort.length===qualityConfig.firstQualityCohortSize &&
  nonFiniteEligibleScoreCount===0 &&
  outside.eligible.length===0 &&
  vegetarian.eligible.length===0 &&
  egg.eligible.length===0 &&
  controlDigestA===controlDigestB &&
  comparisonDigestA===comparisonDigestB &&
  comparisonTop100AverageEvidence>=controlTop100AverageEvidence &&
  minEvidence>=qualityConfig.evidenceRichThreshold &&
  PUBLIC_RUNTIME_RECIPES.length===qualityConfig.expectedCurrentRuntimeRecipeCount &&
  plannerDigest(plannerA)===plannerDigest(plannerB);

const summary={
  schemaVersion:SHADOW_ENGINE_SUMMARY_SCHEMA,
  date:"2026-10-03",
  pass,
  terminal:pass ? SHADOW_ENGINE_TERMINAL : "V21_SHADOW_ENGINE_QUALITY_FAIL",
  protectedCorpusVersion:"v8018",
  searchableRecipeCount:qualityConfig.expectedSearchableRecipeCount,
  currentRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
  candidateCount:candidates.length,
  evidenceRichPoolCount:evidenceRich.length,
  control:{
    eligibleCount:controlA.eligible.length,
    rejectedCount:controlA.rejected.length,
    nonFiniteEligibleScoreCount,
    top100AverageEvidence:controlTop100AverageEvidence,
    top100MinimumEvidence:Math.min(...controlTop100.map(row=>Number(row.recipe.governance?.shadowEvidenceScore||0)))
  },
  comparison:{
    method:"ENGINE_SCORE_X_SHADOW_EVIDENCE_SCORE",
    top100AverageEvidence:comparisonTop100AverageEvidence,
    top100MinimumEvidence:Math.min(...comparisonA.slice(0,100).map(row=>row.evidenceScore)),
    averageEvidenceDelta:Number((comparisonTop100AverageEvidence-controlTop100AverageEvidence).toFixed(6))
  },
  qualityCohort:{
    size:qualityCohort.length,
    threshold:qualityConfig.evidenceRichThreshold,
    minimumEvidenceScore:minEvidence,
    averageEvidenceScore:averageEvidence(qualityCohort),
    digestSha256:sha(JSON.stringify(qualityKeys)),
    sourceCounts:sourceCounts(qualityCohort)
  },
  safety:{
    eligibleOutsideShadowMode:outside.eligible.length,
    vegetarianEligibleInShadowMode:vegetarian.eligible.length,
    eggAllergyEligibleInShadowMode:egg.eligible.length
  },
  determinism:{
    controlDigestA,controlDigestB,
    comparisonDigestA,comparisonDigestB,
    liveRuntimeDigestA:rankingDigest(liveA.eligible),
    liveRuntimeDigestB:rankingDigest(liveB.eligible),
    plannerDigestA:plannerDigest(plannerA),
    plannerDigestB:plannerDigest(plannerB)
  },
  currentRuntime:{
    eligibleCount:liveA.eligible.length,
    rejectedCount:liveA.rejected.length,
    top10RecipeIds:liveA.eligible.slice(0,10).map(row=>row.recipe.id)
  },
  combinedShadow:{
    universeCount:PUBLIC_RUNTIME_RECIPES.length+qualityRecipes.length,
    eligibleCount:combined.eligible.length,
    rejectedCount:combined.rejected.length,
    top20:combinedTop20
  },
  plannerProbe:{
    requestedSlots:plannerSlots.length,
    completedSlots:plannerA.items.length,
    complete:plannerA.complete,
    selectedRecipeIds:plannerA.items.map(row=>row.recipe.id),
    shadowSelectedCount:plannerA.items.filter(row=>row.recipe.governance?.recommendationState==="SHADOW_CANDIDATE_ONLY").length,
    shortfallCount:plannerA.shortfalls.length
  },
  interpretation:{
    qualityCohortIsLiveAdmission:false,
    controlUsesExistingEngineUnmodifiedScore:true,
    comparisonIsOfflineOnly:true,
    candidateOnlySignalsRemainNonAuthority:true,
    restrictedProfilesRemainFailClosed:true
  },
  boundaries:{
    protectedD1Reads:0,
    protectedD1Writes:0,
    protectedBodiesRewritten:0,
    publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,
    recommendationAuthorityWidened:false,
    candidateClassificationPromoted:false,
    dietaryAllergenAuthorityPromoted:false,
    knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,
    thirdShardUsed:false,
    barbecueMutation:false
  },
  nextGate:pass ? qualityConfig.nextGateOnPass : "REPAIR_V21_SHADOW_ENGINE_QUALITY"
};

const errors=validateShadowEngineSummary(summary,qualityConfig);
if(errors.length) throw new Error("SHADOW_ENGINE_SUMMARY_VALIDATION_FAIL__"+errors.join(","));

const full={
  ...summary,
  qualityCohortRecipeKeys:qualityKeys,
  controlTop100:controlTop100.map(row=>({recipeKey:keyOf(row.recipe.id),engineScore:row.score,evidenceScore:row.recipe.governance.shadowEvidenceScore})),
  comparisonTop100:comparisonA.slice(0,100).map(row=>({recipeKey:keyOf(row.recipe.id),engineScore:row.score,evidenceScore:row.evidenceScore,weightedShadowScore:row.weightedShadowScore}))
};

for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify(full,null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SHADOW_ENGINE_SUMMARY="+JSON.stringify({
  terminal:summary.terminal,
  candidateCount:summary.candidateCount,
  evidenceRichPoolCount:summary.evidenceRichPoolCount,
  control:summary.control,
  comparison:summary.comparison,
  qualityCohort:summary.qualityCohort,
  safety:summary.safety,
  plannerProbe:summary.plannerProbe,
  nextGate:summary.nextGate
})+"\n");
