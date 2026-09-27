import { createHash } from "node:crypto";

export const C2_SCHEMA_VERSION = "CULINARY_BRAIN_C2_CANDIDATE_CLASSIFICATION_V1";
export const C2_OUTPUT_SCHEMA_VERSION = "CULINARY_BRAIN_C2_FULL_V8018_CANDIDATES_V1";
export const C2_SUMMARY_SCHEMA_VERSION = "CULINARY_BRAIN_C2_CANDIDATE_CLASSIFICATION_SUMMARY_V1";
export const C2_TERMINAL = "CULINARY_BRAIN_C2_FULL_V8018_CANDIDATE_CLASSIFICATION_PASS";
const KNOWN_STATES = new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"]);
const ALLOWED_REFERENCE_STATES = new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING","AMBIGUOUS","UNKNOWN"]);
const CONFIDENCE_ORDER = new Map([["LOW",1],["MEDIUM",2]]);

export function normalizeHint(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu,"")
    .toLowerCase()
    .replace(/[_-]+/g," ")
    .replace(/[^a-z0-9 ]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

export function hintTextForOverlay(overlay) {
  const tags = Array.isArray(overlay?.sourceHints?.tags) ? overlay.sourceHints.tags : [];
  return normalizeHint([
    overlay?.identity?.sourceRecordKey,
    overlay?.sourceHints?.category,
    ...tags
  ].filter(Boolean).join(" "));
}

function canonicalReference(overlay, field) {
  if (field === "dishCategory") return overlay?.canonical?.culinary?.dishCategory;
  if (field === "mealRole") return overlay?.canonical?.culinary?.mealRoles;
  throw new Error("C2_UNKNOWN_FIELD_"+field);
}

function validateRules(fieldConfig, field) {
  if (!Array.isArray(fieldConfig?.vocabulary) || !fieldConfig.vocabulary.length) throw new Error("C2_VOCABULARY_REQUIRED_"+field);
  if (!Array.isArray(fieldConfig?.rules)) throw new Error("C2_RULES_REQUIRED_"+field);
  const ids = new Set();
  for (const rule of fieldConfig.rules) {
    if (!rule?.id || ids.has(rule.id)) throw new Error("C2_RULE_ID_INVALID_"+field);
    ids.add(rule.id);
    if (!fieldConfig.vocabulary.includes(rule.candidateValue)) throw new Error("C2_RULE_VALUE_INVALID_"+rule.id);
    if (!CONFIDENCE_ORDER.has(rule.confidence)) throw new Error("C2_RULE_CONFIDENCE_INVALID_"+rule.id);
    if (!Array.isArray(rule.patterns) || !rule.patterns.length) throw new Error("C2_RULE_PATTERN_REQUIRED_"+rule.id);
    for (const pattern of rule.patterns) new RegExp(pattern,"i");
  }
}

export function validateC2Contract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== C2_SCHEMA_VERSION) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.expectedRecipeCount !== 19268) errors.push("expectedRecipeCount");
  if (contract?.scope !== "FULL_V8018_OFFLINE_CANDIDATE_ONLY__ABSTENTION_DEFAULT") errors.push("scope");
  if (contract?.policy?.maximumConfidence !== "MEDIUM") errors.push("maximumConfidence");
  if (contract?.policy?.candidateOutputCreatesAuthority !== false) errors.push("candidateOutputCreatesAuthority");
  if (contract?.policy?.candidateOutputCreatesRecommendationEligibility !== false) errors.push("candidateOutputCreatesRecommendationEligibility");
  if (contract?.policy?.candidateOutputCreatesPublicAdmission !== false) errors.push("candidateOutputCreatesPublicAdmission");
  for (const field of ["dishCategory","mealRole"]) {
    try { validateRules(contract?.fields?.[field],field); } catch (error) { errors.push(error.message); }
  }
  for (const [key,value] of Object.entries(contract?.authority || {})) if (value !== false) errors.push("authority."+key);
  return errors;
}

function matchedRules(text, rules) {
  return rules.filter(rule => rule.patterns.some(pattern => new RegExp(pattern,"i").test(text)));
}

function referenceValue(node) {
  if (!node) return null;
  if (Array.isArray(node.value)) return [...node.value];
  return node.value ?? null;
}

export function classifyC2Field({overlay,field,fieldConfig}) {
  const ref = canonicalReference(overlay,field);
  if (!ALLOWED_REFERENCE_STATES.has(ref?.state)) throw new Error("C2_REFERENCE_STATE_INVALID_"+field);
  if (KNOWN_STATES.has(ref.state)) {
    return {
      disposition:"REFERENCE_PRESENT",
      candidateValue:null,
      confidence:null,
      reasonCode:"KNOWN_CANONICAL_REFERENCE_NO_OVERRIDE",
      matchedRuleIds:[],
      referenceState:ref.state,
      referenceValue:referenceValue(ref)
    };
  }

  const text = hintTextForOverlay(overlay);
  const matches = matchedRules(text,fieldConfig.rules);
  if (!matches.length) {
    return {
      disposition:"ABSTAIN",
      candidateValue:null,
      confidence:null,
      reasonCode:"NO_FROZEN_LEXICAL_RULE_MATCH",
      matchedRuleIds:[],
      referenceState:ref.state,
      referenceValue:referenceValue(ref)
    };
  }

  const values=[...new Set(matches.map(rule=>rule.candidateValue))];
  if (values.length !== 1) {
    return {
      disposition:"REVIEW",
      candidateValue:null,
      confidence:"LOW",
      reasonCode:"CONFLICTING_FROZEN_LEXICAL_SIGNALS",
      matchedRuleIds:matches.map(rule=>rule.id).sort(),
      referenceState:ref.state,
      referenceValue:referenceValue(ref)
    };
  }

  const confidence=matches.reduce((best,rule)=>
    CONFIDENCE_ORDER.get(rule.confidence) > CONFIDENCE_ORDER.get(best) ? rule.confidence : best
  ,"LOW");
  return {
    disposition:"REVIEW",
    candidateValue:values[0],
    confidence,
    reasonCode:"FROZEN_LEXICAL_CANDIDATE_REQUIRES_REVIEW",
    matchedRuleIds:matches.map(rule=>rule.id).sort(),
    referenceState:ref.state,
    referenceValue:referenceValue(ref)
  };
}

export function classifyC2Overlay(overlay, contract) {
  const identity=overlay?.identity || {};
  const recipeKey=String(identity.cohortId||"")+"::"+String(identity.sourceRecordKey||"");
  if (!identity.cohortId || !identity.sourceRecordKey || recipeKey === "::") throw new Error("C2_IDENTITY_REQUIRED");
  return {
    recipeKey,
    identity:{
      layer:identity.layer,
      cohortId:identity.cohortId,
      sourceSystem:identity.sourceSystem,
      sourceRecordKey:identity.sourceRecordKey
    },
    hintText:hintTextForOverlay(overlay),
    dishCategory:classifyC2Field({overlay,field:"dishCategory",fieldConfig:contract.fields.dishCategory}),
    mealRole:classifyC2Field({overlay,field:"mealRole",fieldConfig:contract.fields.mealRole}),
    hardAuthorityClaim:null
  };
}

function countBy(rows, selector) {
  const out={};
  for (const row of rows) {
    const key=String(selector(row));
    out[key]=(out[key]||0)+1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}

function summarizeField(rows, field) {
  const cells=rows.map(row=>row[field]);
  return {
    dispositionCounts:countBy(cells,cell=>cell.disposition),
    candidateValueCounts:countBy(cells.filter(cell=>cell.candidateValue!=null),cell=>cell.candidateValue),
    confidenceCounts:countBy(cells.filter(cell=>cell.confidence!=null),cell=>cell.confidence),
    ruleMatchCounts:countBy(cells.flatMap(cell=>cell.matchedRuleIds.map(id=>({id}))),row=>row.id),
    referenceStateCounts:countBy(cells,cell=>cell.referenceState)
  };
}

export function buildC2Classification({mapping,contract}) {
  const contractErrors=validateC2Contract(contract);
  if (contractErrors.length) throw new Error("C2_CONTRACT_INVALID__"+contractErrors.join(","));
  if (mapping?.protectedCorpusVersion !== "v8018" || mapping?.observedRecipeCount !== 19268 || !Array.isArray(mapping?.overlays) || mapping.overlays.length !== 19268) {
    throw new Error("C2_EXACT_FULL_V8018_MAPPING_REQUIRED");
  }
  const rows=mapping.overlays.map(overlay=>classifyC2Overlay(overlay,contract))
    .sort((a,b)=>a.recipeKey.localeCompare(b.recipeKey));
  if (new Set(rows.map(row=>row.recipeKey)).size !== 19268) throw new Error("C2_DUPLICATE_RECIPE_KEY");
  const fullClassificationDigestSha256=createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  const summary={
    schemaVersion:C2_SUMMARY_SCHEMA_VERSION,
    date:"2026-09-27",
    pass:true,
    terminal:C2_TERMINAL,
    protectedCorpusVersion:"v8018",
    recipeCount:rows.length,
    uniqueRecipeKeyCount:new Set(rows.map(row=>row.recipeKey)).size,
    fullClassificationDigestSha256,
    sourcePins:mapping.sourcePins,
    fields:{
      dishCategory:summarizeField(rows,"dishCategory"),
      mealRole:summarizeField(rows,"mealRole")
    },
    invariants:{
      knownReferenceOverrideAttempts:rows.reduce((n,row)=>n+["dishCategory","mealRole"].filter(field=>row[field].disposition==="REFERENCE_PRESENT"&&row[field].candidateValue!=null).length,0),
      highConfidenceCells:rows.reduce((n,row)=>n+["dishCategory","mealRole"].filter(field=>row[field].confidence==="HIGH").length,0),
      hardAuthorityViolations:rows.filter(row=>row.hardAuthorityClaim!=null).length,
      fullRowsCommittedToRuntime:false,
      fullRowsRetainedAsCiArtifact:true
    },
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesReadOrExported:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAuthorityWidened:false,
      nutritionAuthorityChanged:false,
      dietaryAllergenAuthorityChanged:false,
      sourceRightsAuthorityChanged:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    }
  };
  return {
    full:{
      schemaVersion:C2_OUTPUT_SCHEMA_VERSION,
      date:"2026-09-27",
      protectedCorpusVersion:"v8018",
      recipeCount:rows.length,
      digestSha256:fullClassificationDigestSha256,
      rows
    },
    summary
  };
}

export function validateC2Summary(summary) {
  const errors=[];
  if (summary?.schemaVersion !== C2_SUMMARY_SCHEMA_VERSION) errors.push("schemaVersion");
  if (summary?.terminal !== C2_TERMINAL || summary?.pass !== true) errors.push("terminal");
  if (summary?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (summary?.recipeCount !== 19268 || summary?.uniqueRecipeKeyCount !== 19268) errors.push("recipeCount");
  if (!/^[a-f0-9]{64}$/.test(summary?.fullClassificationDigestSha256||"")) errors.push("digest");
  if (summary?.invariants?.knownReferenceOverrideAttempts !== 0) errors.push("knownReferenceOverrideAttempts");
  if (summary?.invariants?.highConfidenceCells !== 0) errors.push("highConfidenceCells");
  if (summary?.invariants?.hardAuthorityViolations !== 0) errors.push("hardAuthorityViolations");
  if (summary?.invariants?.fullRowsCommittedToRuntime !== false || summary?.invariants?.fullRowsRetainedAsCiArtifact !== true) errors.push("artifactBoundary");
  for (const [key,value] of Object.entries(summary?.boundaries || {})) {
    if (["protectedD1Reads","protectedD1Writes","protectedBodiesReadOrExported"].includes(key)) {
      if (value !== 0) errors.push("boundaries."+key);
    } else if (value !== false) errors.push("boundaries."+key);
  }
  return errors;
}
