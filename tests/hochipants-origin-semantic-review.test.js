import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const origin = JSON.parse(readFileSync(new URL('../data/generated/step8g/hochipants-origin-semantic-review.json', import.meta.url), 'utf8'));
const assessment = JSON.parse(readFileSync(new URL('../data/generated/step8g/hochipants-acquisition-assessment.json', import.meta.url), 'utf8'));

test('origin review is tied to exact pinned catalog and baseline', () => {
  assert.equal(origin.source.sha, assessment.source.commit);
  assert.equal(origin.baseline.version, assessment.baseline.version);
  assert.equal(origin.baseline.count, 22086);
  assert.equal(origin.baseline.fingerprintSha256, assessment.baseline.fingerprintSha256);
  assert.equal(origin.records.length, 7);
  assert.equal(new Set(origin.records.map(row => row.id)).size, 7);
  const unsourced = assessment.records.filter(row => row.declaredSource === null).map(row => row.id).sort();
  assert.deepEqual(origin.records.map(row => row.id).sort(), unsourced);
});
test('per-record origin and semantic holds never authorize imports', () => {
  assert.equal(origin.source.rightsRegistrySourceCount, 0);
  assert.equal(origin.counts.admissible, 0);
  assert.equal(origin.counts.imported, 0);
  assert.equal(origin.counts.semanticResolved, 0);
  for (const row of origin.records) {
    assert.equal(row.sourceNamed, false);
    assert.equal(row.perRecordOriginalityAttestation, false);
    assert.equal(row.admissible, false);
    assert.equal(row.importAuthorized, false);
    assert.match(row.rightsDisposition, /^HOLD_/);
    assert.match(row.semanticDisposition, /^HOLD_/);
    assert.equal(row.semanticTermsType, 'REVIEW_SEARCH_TERMS_NOT_MATCHED_BASELINE_RECORDS');
    assert.ok(row.semanticProbeTerms.length >= 2);
  }
});
test('incomplete baseline fingerprints remain an explicit manual review gate', () => {
  assert.equal(origin.baseline.completeWordingFingerprints, assessment.baselineCoverage.wording);
  assert.equal(origin.baseline.count - origin.baseline.completeWordingFingerprints, 3);
  assert.equal(origin.baseline.incompleteWordingFingerprints, 3);
  assert.deepEqual(origin.baseline.incompleteBaselineRecordIndices, [1490, 1569, 1618]);
  assert.deepEqual(origin.baseline.incompleteBaselineRecords.map(row => row.sourceRecordKey), ['eggs.md', 'peanut-butter.md', 'spices-during-pregnancy.md']);
  assert.deepEqual(origin.baseline.incompleteBaselineRecords.map(row => row.index), origin.baseline.incompleteBaselineRecordIndices);
  for (const row of origin.baseline.incompleteBaselineRecords) {
    assert.equal(row.index, origin.baseline.incompleteBaselineIndexEvidence.cohortStartIndex + row.cohortSortedIndex);
    assert.equal(row.ingredientCount, 0);
    assert.equal(row.comparisonStatus, 'NOT_MANUALLY_COMPARED');
  }
  assert.equal(origin.baseline.incompleteBaselineStatus, 'REVIEW_REQUIRED__NO_MANUAL_EXCLUSION');
  assert.match(origin.baseline.semanticSimilarityExecution, /^NOT_EXECUTED_/);
  assert.equal(origin.quality.pinnedValidator, 'NOT_EXECUTED');
});
test('adaptations and production boundaries remain held', () => {
  assert.equal(assessment.records.filter(row => row.rights === 'HOLD_THIRD_PARTY_ADAPTATION').length, 6);
  assert.equal(origin.counts.adaptationsPreservedOnHold, 6);
  assert.equal(origin.boundary.productionWrites, false);
  assert.equal(origin.boundary.protectedCorpusChanges, false);
  assert.equal(origin.boundary.sourceBodiesPublished, false);
  assert.equal(origin.boundary.baselineRecipesPublished, false);
  assert.equal(origin.boundary.otherLanesChanged, false);
  assert.match(origin.status, /HOLD/);
});
