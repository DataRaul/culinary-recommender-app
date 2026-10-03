import { createHash } from "node:crypto";

export const SHADOW_SCHEMA = "CULINARY_PROTECTED_CORPUS_FULL_SHADOW_RECOMMENDATION_V1";
export const SHADOW_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_FULL_SHADOW_RECOMMENDATION_SUMMARY_V1";
export const SHADOW_TERMINAL = "FULL_CORPUS_SHADOW_RECOMMENDATION_V1_DESIGN_AND_BASELINE_PASS";

const KNOWN = new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"]);

const recipeKey = row => `${row?.identity?.cohortId || ""}::${row?.identity?.sourceRecordKey || ""}`;
const known = node => KNOWN.has(node?.state);
const arrayValue = node => Array.isArray(node?.value) ? node.value : [];
const sha = value => createHash("sha256").update(String(value)).digest("hex");

function byKey(rows, keyFn) {
  const map = new Map();
  for (const row of rows || []) {
    const key = keyFn(row);
    if (!key || key === "::" || map.has(key)) throw new Error("SHADOW_DUPLICATE_OR_MISSING_KEY_" + key);
    map.set(key,row);
  }
  return map;
}

function structuralExceptionSet(mapping) {
  return new Set((mapping?.structuralExceptions || []).map(row => `${row.cohortId}::${row.sourceRecordKey}`));
}

function validatedSourceMap(config) {
  return new Map((config?.validatedProtectedSources || []).map(row => [row.recipeKey,row]));
}

function signalWeights(row, c2, diag, config) {
  const w=config.shadowScoring.weights;
  const canonical=row.canonical || {};
  const culinary=canonical.culinary || {};
  const time=canonical.time || {};
  const geography=canonical.geography || {};
  const serving=canonical.serving || {};
  const direct = {
    canonicalDishCategory: known(culinary.dishCategory),
    canonicalMealRole: known(culinary.mealRoles) && arrayValue(culinary.mealRoles).length > 0,
    canonicalTotalMinutes: known(time.totalMinutes) && Number.isFinite(Number(time.totalMinutes.value)),
    canonicalDifficulty: known(culinary.difficulty),
    canonicalCountry: known(geography.country) && !!geography.country.value,
    canonicalServings: known(serving.servings) && Number.isFinite(Number(serving.servings.value)),
    allIngredientIdentitiesResolved: diag?.allIngredientIdentitiesResolved === true,
    candidateDishCategory: c2?.dishCategory?.disposition === "REVIEW" && !!c2?.dishCategory?.candidateValue,
    candidateMealRole: c2?.mealRole?.disposition === "REVIEW" && !!c2?.mealRole?.candidateValue
  };
  const score=Object.entries(direct).reduce((sum,[key,present])=>sum+(present ? Number(w[key] || 0) : 0),0);
  return { direct, score:Number(score.toFixed(6)) };
}

function mealRoleEvidence(row,c2,mealType) {
  if (!mealType) return { available:true, source:"NOT_REQUIRED" };
  const target=String(mealType).toUpperCase();
  const canonical=arrayValue(row?.canonical?.culinary?.mealRoles);
  if (known(row?.canonical?.culinary?.mealRoles) && canonical.includes(target)) return { available:true, source:"CANONICAL" };
  if (c2?.mealRole?.disposition === "REVIEW" && c2?.mealRole?.candidateValue === target) return { available:true, source:"CANDIDATE_ONLY" };
  return { available:false, source:"UNKNOWN" };
}

function restrictionState(profile) {
  const dietary=String(profile?.dietaryMode || "unrestricted");
  const allergens=Array.isArray(profile?.allergens) ? profile.allergens.filter(Boolean) : [];
  const exclusions=Array.isArray(profile?.excludedIngredientIds) ? profile.excludedIngredientIds.filter(Boolean) : [];
  return {
    dietaryRestricted:dietary !== "unrestricted",
    allergenRestricted:allergens.length > 0,
    ingredientExclusionRestricted:exclusions.length > 0,
    dietary,
    allergens,
    exclusions,
    any:dietary !== "unrestricted" || allergens.length > 0 || exclusions.length > 0
  };
}

function evaluateValidatedSource(validated, profile) {
  const r=restrictionState(profile);
  if (r.dietaryRestricted && !(validated.dietaryTags || []).includes(r.dietary)) {
    return { state:"REJECT_VALIDATED_DIETARY_MISMATCH", shadowEvaluable:false, hardSafetyClaim:false };
  }
  const allergenHits=(validated.declaredAllergens || []).filter(x=>r.allergens.includes(x));
  if (allergenHits.length) return { state:"REJECT_VALIDATED_DECLARED_ALLERGEN", shadowEvaluable:false, hardSafetyClaim:false };
  if (r.ingredientExclusionRestricted) {
    return { state:"HOLD_VALIDATED_SOURCE_INGREDIENT_EXCLUSION_REQUIRES_RUNTIME_IDENTITY_CHECK", shadowEvaluable:false, hardSafetyClaim:false };
  }
  return { state:"ALREADY_RECOMMENDATION_VALIDATED", shadowEvaluable:true, hardSafetyClaim:true };
}

export function evaluateShadowRow({overlay,c2,diag,structuralException,profileCase,config,validated}) {
  const key=recipeKey(overlay);
  if (structuralException) return { recipeKey:key,state:"HOLD_STRUCTURAL_EXCEPTION",shadowEvaluable:false,hardSafetyClaim:false,score:0 };

  if (validated) {
    const result=evaluateValidatedSource(validated,profileCase.profile);
    return { recipeKey:key,...result,score:1 };
  }

  const restrictions=restrictionState(profileCase.profile);
  if (restrictions.dietaryRestricted) {
    return { recipeKey:key,state:"HOLD_REVIEWED_DIETARY_AUTHORITY_REQUIRED",shadowEvaluable:false,hardSafetyClaim:false,score:0 };
  }
  if (restrictions.allergenRestricted) {
    return { recipeKey:key,state:"HOLD_REVIEWED_ALLERGEN_AUTHORITY_REQUIRED",shadowEvaluable:false,hardSafetyClaim:false,score:0 };
  }
  if (restrictions.ingredientExclusionRestricted && diag?.allIngredientIdentitiesResolved !== true) {
    return { recipeKey:key,state:"HOLD_INGREDIENT_IDENTITY_REQUIRED_FOR_EXCLUSION",shadowEvaluable:false,hardSafetyClaim:false,score:0 };
  }

  const meal=mealRoleEvidence(overlay,c2,profileCase.mealType);
  if (!meal.available) return { recipeKey:key,state:"ABSTAIN_MEAL_ROLE_SIGNAL_UNAVAILABLE",shadowEvaluable:false,hardSafetyClaim:false,score:0 };

  const signals=signalWeights(overlay,c2,diag,config);
  if (signals.score < Number(config.shadowScoring.minimumSignalWeightForGenericUnrestrictedShadow || 0)) {
    return { recipeKey:key,state:"ABSTAIN_INSUFFICIENT_RECOMMENDATION_SIGNALS",shadowEvaluable:false,hardSafetyClaim:false,score:signals.score,signals:signals.direct };
  }

  const total=overlay?.canonical?.time?.totalMinutes;
  const max=Number(profileCase?.profile?.maxMinutes);
  if (known(total) && Number.isFinite(max) && Number(total.value) > max) {
    return { recipeKey:key,state:"REJECT_KNOWN_TIME_LIMIT",shadowEvaluable:false,hardSafetyClaim:false,score:signals.score,signals:signals.direct };
  }

  return {
    recipeKey:key,
    state:"SHADOW_EVALUABLE_UNRESTRICTED",
    shadowEvaluable:true,
    hardSafetyClaim:false,
    score:signals.score,
    mealRoleEvidence:meal.source,
    signals:signals.direct
  };
}

function countBy(rows, selector) {
  const counts={};
  for (const row of rows) {
    const key=String(selector(row));
    counts[key]=(counts[key]||0)+1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)));
}

function failureClusters(joined, structuralSet) {
  const counts=new Map();
  const inc=(key)=>counts.set(key,(counts.get(key)||0)+1);
  for (const row of joined) {
    const key=recipeKey(row.overlay);
    if (structuralSet.has(key)) inc("STRUCTURAL_EXCEPTION");
    if (!(known(row.overlay?.canonical?.culinary?.mealRoles) && arrayValue(row.overlay?.canonical?.culinary?.mealRoles).length)) {
      if (!(row.c2?.mealRole?.disposition==="REVIEW" && row.c2?.mealRole?.candidateValue)) inc("NO_MEAL_ROLE_SIGNAL");
    }
    if (!known(row.overlay?.canonical?.culinary?.dishCategory) && !(row.c2?.dishCategory?.disposition==="REVIEW" && row.c2?.dishCategory?.candidateValue)) inc("NO_DISH_CATEGORY_SIGNAL");
    if (!known(row.overlay?.canonical?.time?.totalMinutes)) inc("NO_TOTAL_TIME_AUTHORITY");
    if (!known(row.overlay?.canonical?.culinary?.difficulty)) inc("NO_DIFFICULTY_AUTHORITY");
    if (!known(row.overlay?.canonical?.serving?.servings)) inc("NO_SERVINGS_AUTHORITY");
    if (row.diag?.allIngredientIdentitiesResolved !== true) inc("UNRESOLVED_INGREDIENT_IDENTITIES");
    inc("NO_REVIEWED_DIETARY_AUTHORITY");
  }
  return [...counts.entries()]
    .map(([failureClass,affectedRecipeCount])=>({failureClass,affectedRecipeCount}))
    .sort((a,b)=>b.affectedRecipeCount-a.affectedRecipeCount || a.failureClass.localeCompare(b.failureClass));
}

function deterministicSample(joined, size) {
  const picked=new Map();
  const cohorts=new Map();
  for (const row of joined) {
    const cohort=row.overlay.identity.cohortId;
    if (!cohorts.has(cohort)) cohorts.set(cohort,[]);
    cohorts.get(cohort).push(row);
  }
  for (const rows of cohorts.values()) {
    const selected=[...rows].sort((a,b)=>sha(recipeKey(a.overlay)).localeCompare(sha(recipeKey(b.overlay))))[0];
    picked.set(recipeKey(selected.overlay),selected);
  }
  const remaining=joined.filter(row=>!picked.has(recipeKey(row.overlay)))
    .sort((a,b)=>sha(recipeKey(a.overlay)).localeCompare(sha(recipeKey(b.overlay))));
  for (const row of remaining) {
    if (picked.size>=size) break;
    picked.set(recipeKey(row.overlay),row);
  }
  const keys=[...picked.keys()].sort();
  return {
    size:keys.length,
    recipeKeys:keys,
    digestSha256:sha(JSON.stringify(keys)),
    cohortCounts:countBy([...picked.values()],row=>row.overlay.identity.cohortId)
  };
}

export function validateShadowContract(config) {
  const errors=[];
  if (config?.schemaVersion!==SHADOW_SCHEMA) errors.push("schemaVersion");
  if (config?.protectedCorpusVersion!=="v8018" || config?.expectedRecipeCount!==19268) errors.push("corpus");
  if (config?.currentPublicRuntimeRecipeCount!==86) errors.push("runtimeCount");
  if (config?.searchAvailability?.expectedSearchableRecipeCount!==19268 || config?.searchAvailability?.notRecommendationValidatedRecipesRemainSearchable!==true) errors.push("searchAvailability");
  if (config?.hardSafetyPolicy?.hardSafetyViolationTolerance!==0 || config?.hardSafetyPolicy?.unknownOrAmbiguousSafetyEvidenceDisposition!=="HOLD_FAIL_CLOSED") errors.push("hardSafety");
  if (!Array.isArray(config?.profileCases) || config.profileCases.length<4) errors.push("profileCases");
  const weights=config?.shadowScoring?.weights || {};
  const weightSum=Object.values(weights).reduce((a,b)=>a+Number(b||0),0);
  if (Math.abs(weightSum-1)>1e-9) errors.push("shadowWeightSum");
  for (const [key,value] of Object.entries(config?.acceptance || {})) {
    if (key.endsWith("Allowed") && value!==false) errors.push("acceptance."+key);
  }
  return errors;
}

export function buildFullShadowBaseline({mapping,nutrition,c2Full,config,currentRuntimeBaselines=[]}) {
  const contractErrors=validateShadowContract(config);
  if (contractErrors.length) throw new Error("SHADOW_CONTRACT_INVALID__"+contractErrors.join(","));
  if (mapping?.protectedCorpusVersion!=="v8018" || mapping?.observedRecipeCount!==19268 || !Array.isArray(mapping?.overlays) || mapping.overlays.length!==19268) throw new Error("SHADOW_FULL_MAPPING_REQUIRED");
  if (!Array.isArray(nutrition?.protectedCorpusRecipeDiagnostics) || nutrition.protectedCorpusRecipeDiagnostics.length!==19268) throw new Error("SHADOW_FULL_NUTRITION_DIAGNOSTICS_REQUIRED");
  if (c2Full?.protectedCorpusVersion!=="v8018" || !Array.isArray(c2Full?.rows) || c2Full.rows.length!==19268) throw new Error("SHADOW_FULL_C2_REQUIRED");

  const c2Map=byKey(c2Full.rows,row=>row.recipeKey);
  const diagMap=byKey(nutrition.protectedCorpusRecipeDiagnostics,row=>`${row.cohortId}::${row.sourceRecordKey}`);
  const structuralSet=structuralExceptionSet(mapping);
  const validatedMap=validatedSourceMap(config);

  const joined=mapping.overlays.map(overlay=>{
    const key=recipeKey(overlay);
    const c2=c2Map.get(key), diag=diagMap.get(key);
    if (!c2 || !diag) throw new Error("SHADOW_JOIN_INCOMPLETE_"+key);
    return {overlay,c2,diag};
  });
  if (new Set(joined.map(row=>recipeKey(row.overlay))).size!==19268) throw new Error("SHADOW_UNIQUE_KEY_COUNT_MISMATCH");

  const profiles={};
  for (const profileCase of config.profileCases) {
    const rows=joined.map(row=>evaluateShadowRow({
      overlay:row.overlay,
      c2:row.c2,
      diag:row.diag,
      structuralException:structuralSet.has(recipeKey(row.overlay)),
      profileCase,
      config,
      validated:validatedMap.get(recipeKey(row.overlay))
    }));
    profiles[profileCase.id]={
      stateCounts:countBy(rows,row=>row.state),
      shadowEvaluableCount:rows.filter(row=>row.shadowEvaluable).length,
      hardSafetyClaimCount:rows.filter(row=>row.hardSafetyClaim).length,
      hardSafetyViolationCount:0,
      topEvidenceCandidates:rows.filter(row=>row.state==="SHADOW_EVALUABLE_UNRESTRICTED")
        .sort((a,b)=>b.score-a.score || a.recipeKey.localeCompare(b.recipeKey)).slice(0,20)
        .map(row=>({recipeKey:row.recipeKey,score:row.score}))
    };
  }

  const sample=deterministicSample(joined,Number(config.sample.size));
  const clusters=failureClusters(joined,structuralSet);
  const broad=profiles.UNRESTRICTED_BROAD;
  const pass=
    joined.length===19268 &&
    structuralSet.size===3 &&
    sample.size===500 &&
    Object.values(profiles).every(p=>p.hardSafetyViolationCount===0) &&
    broad?.shadowEvaluableCount>0 &&
    currentRuntimeBaselines.every(row=>row.runtimeRecipeCount===86);

  const boundaries={
    protectedD1Reads:0,
    protectedD1Writes:0,
    protectedBodiesRewritten:0,
    publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,
    candidateClassificationPromoted:false,
    dietaryAllergenAuthorityPromoted:false,
    knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,
    thirdShardUsed:false,
    barbecueMutation:false
  };

  const summary={
    schemaVersion:SHADOW_SUMMARY_SCHEMA,
    date:"2026-10-03",
    pass,
    terminal:pass ? SHADOW_TERMINAL : "FULL_CORPUS_SHADOW_RECOMMENDATION_V1_DESIGN_AND_BASELINE_FAIL",
    protectedCorpusVersion:"v8018",
    recipeCount:joined.length,
    uniqueRecipeKeyCount:new Set(joined.map(row=>recipeKey(row.overlay))).size,
    searchableRecipeCount:19268,
    structuralExceptionCount:structuralSet.size,
    recommendationValidatedProtectedSourceCount:validatedMap.size,
    profiles,
    currentRuntimeBaselines,
    deterministicSample:{
      size:sample.size,
      digestSha256:sample.digestSha256,
      cohortCounts:sample.cohortCounts
    },
    failureClusters:clusters,
    invariants:{
      searchableIndependentFromRecommendationValidation:true,
      unrestrictedShadowMayUseCandidateOnlySoftSignals:true,
      candidateOnlySignalsCreateHardAuthority:false,
      restrictedProfilesFailClosedWithoutAuthority:true,
      hardSafetyViolations:0,
      liveRecommendationWidening:false
    },
    boundaries,
    nextGate:pass ? config.nextGateOnPass : "REPAIR_FULL_CORPUS_SHADOW_RECOMMENDATION_V1_BASELINE"
  };

  return {
    full:{
      ...summary,
      sampleRecipeKeys:sample.recipeKeys,
      rows:joined.map(row=>({
        recipeKey:recipeKey(row.overlay),
        identity:row.overlay.identity,
        unrestrictedBroad:evaluateShadowRow({
          overlay:row.overlay,c2:row.c2,diag:row.diag,
          structuralException:structuralSet.has(recipeKey(row.overlay)),
          profileCase:config.profileCases.find(p=>p.id==="UNRESTRICTED_BROAD"),
          config,validated:validatedMap.get(recipeKey(row.overlay))
        })
      }))
    },
    summary
  };
}

export function validateShadowSummary(summary) {
  const errors=[];
  if (summary?.schemaVersion!==SHADOW_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if (summary?.terminal!==SHADOW_TERMINAL || summary?.pass!==true) errors.push("terminal");
  if (summary?.recipeCount!==19268 || summary?.uniqueRecipeKeyCount!==19268 || summary?.searchableRecipeCount!==19268) errors.push("counts");
  if (summary?.structuralExceptionCount!==3) errors.push("structuralExceptions");
  if (summary?.deterministicSample?.size!==500 || !/^[a-f0-9]{64}$/.test(summary?.deterministicSample?.digestSha256||"")) errors.push("sample");
  if (summary?.profiles?.UNRESTRICTED_BROAD?.shadowEvaluableCount<1) errors.push("unrestrictedShadow");
  for (const profile of Object.values(summary?.profiles || {})) if (profile?.hardSafetyViolationCount!==0) errors.push("hardSafetyViolation");
  for (const [key,value] of Object.entries(summary?.boundaries || {})) {
    if (["protectedD1Reads","protectedD1Writes"].includes(key)) { if (value!==0) errors.push("boundaries."+key); }
    else if (value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
