export const BRAIN_PUBLIC_POLICY_V1 = Object.freeze({
  id: "culinary-nutrition-brain-public-policy-v1",
  schemaVersion: 1,
  status: "CALIBRATION_ONLY_NO_RANKING_CHANGE",
  knowledgeCore: Object.freeze({
    domain: "culinary_nutrition",
    commit: "e5dcb29a7c6b78f59c062faf4c963c74aac10743",
    runtimeDependency: "PROHIBITED",
    exportMode: "STATIC_REVIEWED_PUBLIC_SAFE_ONLY"
  }),
  authorityOrder: Object.freeze([
    "HARD_SAFETY_AND_DIETARY_CONSTRAINTS",
    "OFFICIAL_NUTRITION_AND_FOOD_SAFETY_EVIDENCE",
    "BOUNDED_CULINARY_OPERATOR_HEURISTICS",
    "SOFT_USER_PREFERENCES"
  ]),
  publicReasoningDimensions: Object.freeze([
    "evidenceConfidence",
    "healthyPatternContribution",
    "pantryReuse",
    "costPackageBurden",
    "timeEffortEquipmentSkillFit",
    "culinaryMechanism",
    "learningValue",
    "uncertainty"
  ]),
  hardBoundaries: Object.freeze([
    "NEVER_RELAX_ALLERGEN_DIETARY_OR_PERMANENT_EXCLUSION",
    "NO_DIAGNOSIS_OR_THERAPEUTIC_DIET_PRESCRIPTION",
    "NO_INDIVIDUALIZED_SUPPLEMENT_DOSING",
    "NO_CREATOR_HEALTH_CLAIMS_AS_NUTRITION_AUTHORITY",
    "NO_PRIVATE_KNOWLEDGE_CORE_RUNTIME_FETCH",
    "NO_COPYRIGHTED_SOURCE_TEXT_IN_PUBLIC_EXPORT"
  ]),
  allowedExportClasses: Object.freeze([
    "VERSIONED_POLICY_PRIOR",
    "TECHNIQUE_AND_DIFFICULTY_CRITERIA",
    "FUNCTIONAL_SUBSTITUTION_METADATA",
    "HEALTHY_PATTERN_TAG",
    "CONFIDENCE_AND_EXPLANATION_LABEL"
  ])
});
