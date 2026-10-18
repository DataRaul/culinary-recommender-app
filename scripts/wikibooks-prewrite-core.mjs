import { createHash } from 'node:crypto';
import { buildStep8APopulationPlan } from './corpus-scale-step8a-core.mjs';
import { normalizePage } from './wikibooks-text-core.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');

// Only an exact reviewed cohort may reach the existing protected-storage planner.
// A generated discovery/normalization record is never an admission receipt.
export function buildWikibooksPrewrite({ bundle, assessment, reviews, evidenceHashes }) {
  if (bundle?.schema !== 'WIKIBOOKS_TEXT_CANDIDATE_BUNDLE_V1' || bundle.productionAdmission !== false || !Array.isArray(bundle.records)) throw new Error('CANDIDATE_BUNDLE_REQUIRED');
  if (assessment?.baseline?.version !== 'v8019' || assessment.baseline.count !== 22086) throw new Error('V8019_BASELINE_REQUIRED');
  if (!Array.isArray(reviews) || !reviews.length) throw new Error('REVIEWED_COHORT_REQUIRED');
  const seen = new Set();
  const packets = reviews.map(review => {
    if (seen.has(review.recipeId)) throw new Error('DUPLICATE_REVIEW');
    seen.add(review.recipeId);
    const recipe = bundle.records.find(row => row.id === review.recipeId);
    if (!recipe || recipe.structure !== 'PASS' || recipe.holdReasons.length) throw new Error('SOURCE_OR_STRUCTURE_HOLD');
    const p = recipe.provenance;
    if (sha(recipe.sourceWikitext) !== p.sourceTextSha256 || sha(recipe.talkWikitext) !== p.talkTextSha256) throw new Error('SOURCE_TEXT_HASH_MISMATCH');
    const replay = normalizePage({ pageid: p.sourcePageId, title: p.sourcePageTitle, revisions: [{ revid: p.sourceRevisionId, timestamp: p.sourceRevisionTimestamp, slots: { main: { content: recipe.sourceWikitext } } }] },
      p.talkMissing ? { title: p.talkPageTitle, missing: true } : { title: p.talkPageTitle, revisions: [{ revid: p.talkRevisionId, timestamp: p.talkRevisionTimestamp, slots: { main: { content: recipe.talkWikitext } } }] },
      { pageid: p.sourcePageId, title: p.sourcePageTitle, revid: p.sourceRevisionId, timestamp: p.sourceRevisionTimestamp });
    for (const field of ['id', 'title', 'ingredients', 'instructions', 'supplementary', 'provenance', 'holdReasons', 'structure', 'rights']) if (JSON.stringify(recipe[field]) !== JSON.stringify(replay[field])) throw new Error('NORMALIZED_SOURCE_REPLAY_MISMATCH');
    if (review.sourceTextSha256 !== p.sourceTextSha256 || review.talkTextSha256 !== p.talkTextSha256 || review.baselineSha256 !== assessment.baseline.sha256) throw new Error('STALE_ADMISSION_REVIEW');
    if (review.rights !== 'PASS' || !['NOVEL', 'MEANINGFUL_VARIANT'].includes(review.novelty) || review.comparisonCoverage !== 'FULL_V8019' || review.unresolvedComparisons !== 0) throw new Error('RIGHTS_OR_DEDUP_HOLD');
    if (!review.reviewer || !review.rationale || !review.evidence?.length || review.evidence.some(row => !row.path || !/^[a-f0-9]{64}$/.test(row.sha256) || evidenceHashes?.[row.path] !== row.sha256)) throw new Error('BOUND_REVIEW_EVIDENCE_REQUIRED');
    if (p.license !== 'CC-BY-SA-4.0' || p.mediaIncluded !== false || p.sourceNutritionImportedAsAuthority !== false || p.modifiedFromSource !== true || !p.attribution || !p.sourceRevisionUrl || !p.licenseUrl) throw new Error('ATTRIBUTION_FIREWALL');
    return { schema: 'WIKIBOOKS_PROTECTED_SOURCE_PACKET_V1', canonicalRecipeId: recipe.id, source: p,
      sourceContent: { title: recipe.title, ingredients: recipe.ingredients, directions: recipe.instructions, supplementary: recipe.supplementary },
      admissionReview: review, availability: 'SEARCHABLE__NOT_RECOMMENDATION_VALIDATED', recommendationAdmission: false };
  });
  const entries = packets.map((packet, ordinal) => {
    const bodyJson = JSON.stringify(packet);
    return { ordinal, recipeId: packet.canonicalRecipeId, sourceCohortId: 'WIKIBOOKS_PINNED_TEXT_20261018', bodySha256: sha(bodyJson), bodyBytes: Buffer.byteLength(bodyJson) };
  });
  const plan = buildStep8APopulationPlan({ corpusVersion: 'v8020', parentCorpusVersion: 'v8019', recipeShardCount: 2, rowsPerWriteBatch: 10,
    sourceCohorts: [{ id: 'WIKIBOOKS_PINNED_TEXT_20261018', sourceName: 'English Wikibooks Cookbook', sourceVersion: assessment.discoverySha256, admissionState: 'REVIEWED_TEXT_ONLY_SEARCH_ADMISSION', protectedPopulationAllowed: true, publicRuntimeActivationAuthorized: false, evidenceRefs: [...new Set(reviews.flatMap(r => r.evidence.map(e => e.path)))] }], entries });
  return { packets, plan, productionWriteAuthorized: false, incrementalFtsRequired: true, fullFtsRebuildAuthorized: false };
}
