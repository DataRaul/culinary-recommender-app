export const ORA_IDUNS_1911_SOURCE = Object.freeze({
  cohortId: "ORA_IDUNS_1911_FIRST_EDITION_ARKIVKOPIA_RUNEBERG",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "svenska-koket",
  sourceTitle: "Iduns kokbok",
  sourceAuthor: "Elisabeth Östman",
  canonicalAuthor: "Laura Elisabeth Östman",
  sourceUrl: "https://archive.org/details/arkivkopia.se-runeberg-idunskok",
  sourceYear: "1911",
  digitizedEditionYear: "1911",
  digitizedEditionLabel: "1911 first edition",
  digitizedSource: "Project Runeberg",
  publisher: "Aktiebolaget Ljus",
  publicationPlace: "Stockholm",
  authorBirthYear: "1869",
  authorDeathYear: "1933",
  license: "public-domain",
  expectedRecipeCount: 2818,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_IDUNS_1911_FIRST_EDITION_AUTHOR_TERM_EXPIRED"
});

export const ORA_IDUNS_1911_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_IDUNS_1911_V8018_ACQUISITION_V1";
export const ORA_IDUNS_1911_CANDIDATE_TERMINAL = "STEP_8G_ORA_IDUNS_1911_MEASUREMENT_EARNED_ACQUISITION_CANDIDATE";
export const ORA_IDUNS_1911_REJECT_TERMINAL = "STEP_8G_STOP_ORA_IDUNS_1911_RIGHTS_OR_STRUCTURE_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_IDUNS_1911_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    String(candidate.sourceYear) === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraIduns1911Candidate({
  discovery,
  candidate,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified,
  exactEditionClassified,
  authorTermClassified,
  independentExactSourceClassified
}) {
  if (!discovery?.baseline) throw new Error("IDUNS_DISCOVERY_BASELINE_REQUIRED");
  if (!candidate) throw new Error("IDUNS_CANDIDATE_REQUIRED");

  const baselinePass = discovery.baseline.activeProtectedVersion === "v8018" &&
    Number(discovery.baseline.activeProtectedCount) === 19268;
  const exactCountPass = Number(candidate.recipeCount) === ORA_IDUNS_1911_SOURCE.expectedRecipeCount;
  const rightsMetadataPass = exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true &&
    repositoryReusePass === true &&
    attributionClassified === true &&
    exactEditionClassified === true &&
    authorTermClassified === true &&
    independentExactSourceClassified === true &&
    exactCountPass &&
    rightsMetadataPass;
  const structuralQualityPass = candidate.structuralPass === true &&
    Number(candidate.parseableRecipeRatio) >= 0.95;
  const acquisitionValuePass = candidate.acquisitionValuePass === true &&
    Number(candidate.novelNormalizedTitleCount) >= 50;
  const pass = baselinePass && rightsAuditPass && structuralQualityPass && acquisitionValuePass;

  return {
    schema: ORA_IDUNS_1911_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_IDUNS_1911_CANDIDATE_TERMINAL : ORA_IDUNS_1911_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: {
      cohortId: ORA_IDUNS_1911_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      canonicalAuthor: ORA_IDUNS_1911_SOURCE.canonicalAuthor,
      sourceYear: candidate.sourceYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_IDUNS_1911_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_IDUNS_1911_SOURCE.digitizedEditionLabel,
      digitizedSource: ORA_IDUNS_1911_SOURCE.digitizedSource,
      publisher: ORA_IDUNS_1911_SOURCE.publisher,
      publicationPlace: ORA_IDUNS_1911_SOURCE.publicationPlace,
      authorBirthYear: ORA_IDUNS_1911_SOURCE.authorBirthYear,
      authorDeathYear: ORA_IDUNS_1911_SOURCE.authorDeathYear,
      recipeCount: candidate.recipeCount,
      parseableRecipeCount: candidate.parseableRecipeCount,
      parseableRecipeRatio: candidate.parseableRecipeRatio,
      distinctNormalizedTitles: candidate.distinctNormalizedTitles,
      uniqueTitleRatio: candidate.uniqueTitleRatio,
      exactBaselineTitleOverlapCount: candidate.exactBaselineTitleOverlapCount,
      novelNormalizedTitleCount: candidate.novelNormalizedTitleCount,
      novelTitleRatio: candidate.novelTitleRatio,
      distinctIngredientPhraseCount: candidate.distinctIngredientPhraseCount,
      novelIngredientPhraseCount: candidate.novelIngredientPhraseCount,
      ontologyResolvedOccurrenceRatio: candidate.ontologyResolvedOccurrenceRatio,
      ontologyResolvedCanonicalIngredientCount: candidate.ontologyResolvedCanonicalIngredientCount,
      ontologyUnresolvedPhraseCount: candidate.ontologyUnresolvedPhraseCount,
      historicalSourceLabelOnly: true,
      culturalAuthorityImported: false
    },
    gates: {
      baselinePass,
      rightsDocumented: rightsDocumented === true,
      repositoryReusePass: repositoryReusePass === true,
      attributionClassified: attributionClassified === true,
      exactEditionClassified: exactEditionClassified === true,
      authorTermClassified: authorTermClassified === true,
      independentExactSourceClassified: independentExactSourceClassified === true,
      exactCountPass,
      rightsMetadataPass,
      rightsAuditPass,
      structuralQualityPass,
      acquisitionValuePass
    },
    nextAuthority: pass ? "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY" : "NONE_STOP_OR_SELECT_OTHER_SOURCE",
    boundaries: {
      liveD1WritesPerformed: 0,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      d1BudgetExpansionAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionLaneModified: false,
      recommendationQualificationModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false,
      culturalAuthenticityAuthorityImported: false
    }
  };
}
