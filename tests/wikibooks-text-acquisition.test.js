import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBatch } from '../scripts/acquire-wikibooks-text.mjs';
import { normalizePage, plainText } from '../scripts/wikibooks-text-core.mjs';
import { buildWikibooksPrewrite } from '../scripts/wikibooks-prewrite-core.mjs';

const expected = { pageid: 1, title: 'Cookbook:Test', revid: 10, timestamp: '2026-10-18T00:00:00Z' };
const raw = '{{recipe}}\n==Ingredients==\n* ½ cup [[Cookbook:Milk|milk]], optionally\n* 2 eggs\n==Procedure==\n# Mix.\n# Cook until set.\n[[Category:Recipes]]';
const page = (text = raw) => ({ pageid: 1, title: expected.title, revisions: [{ revid: 10, timestamp: expected.timestamp, slots: { main: { content: text, contentmodel: 'wikitext' } } }] });
const talk = { title: 'Cookbook talk:Test', missing: true };
test('normalization preserves quantities and optionality without category metadata becoming ingredients', () => {
  const row = normalizePage(page(), talk, expected);
  assert.equal(row.structure, 'PASS'); assert.deepEqual(row.holdReasons, []);
  assert.equal(row.ingredients[0], '½ cup milk, optionally');
  assert.deepEqual(row.instructions, ['Mix.', 'Cook until set.']);
  assert.equal(row.provenance.mediaIncluded, false); assert.equal(row.importAuthorized, false);
});
test('unknown templates, extra rights notices and nonempty talk cannot silently pass', () => {
  for (const text of ['{{ExternalSource}}\n' + raw, 'Adapted from a copyrighted book.\n' + raw]) {
    assert.equal(normalizePage(page(text), talk, expected).rights, 'HOLD_PAGE_SPECIFIC_REVIEW');
  }
  const present = { title: talk.title, revisions: [{ revid: 11, timestamp: expected.timestamp, slots: { main: { content: 'Attribution discussion' } } }] };
  assert.equal(normalizePage(page(), present, expected).rights, 'HOLD_PAGE_SPECIFIC_REVIEW');
});
test('subdivided or repeated recipe sections do not truncate to a false usable recipe', () => {
  for (const text of [raw.replace('* 2 eggs', '===Filling===\n* 2 eggs'), raw + '\n==Ingredients==\n* flour']) {
    assert.equal(normalizePage(page(text), talk, expected).structure, 'HOLD');
  }
});
test('unsupported expressions are held instead of deleting required cooking information', () => {
  for (const text of ['Heat to {{convert|180|C}}.', 'Add <ref>source</ref> milk.', '[[File:Food.jpg]]', '[[milk|]]']) assert.throws(() => plainText(text));
  const row = normalizePage(page(raw.replace('# Mix.', '# Mix {{unknown}}.')), talk, expected);
  assert.equal(row.structure, 'HOLD');
});
test('revision batches and source normalization reject stale or incomplete identities', () => {
  assert.throws(() => checkBatch({ query: { pages: [page()] } }, [10, 11], 'revisions'));
  assert.throws(() => normalizePage(page(), talk, { ...expected, pageid: 2 }));
  assert.throws(() => normalizePage(page(), { title: 'Cookbook talk:Other', missing: true }, expected));
  assert.deepEqual(checkBatch({ query: { pages: [talk] } }, [talk.title], 'talk'), [talk]);
});
const row = normalizePage(page(), talk, expected);
const bundle = { schema: 'WIKIBOOKS_TEXT_CANDIDATE_BUNDLE_V1', productionAdmission: false, records: [row] };
const assessment = { baseline: { version: 'v8019', count: 22086, sha256: 'b'.repeat(64) }, discoverySha256: 'd'.repeat(64) };
const review = { recipeId: row.id, sourceTextSha256: row.provenance.sourceTextSha256, talkTextSha256: row.provenance.talkTextSha256, baselineSha256: assessment.baseline.sha256, rights: 'PASS', novelty: 'NOVEL', comparisonCoverage: 'FULL_V8019', unresolvedComparisons: 0, reviewer: 'test-only fixture', rationale: 'Synthetic admission fixture; never live evidence.', evidence: [{ path: 'fixture.json', sha256: 'e'.repeat(64) }] };
const args = { bundle, assessment, reviews: [review], evidenceHashes: { 'fixture.json': 'e'.repeat(64) } };
test('prewrite rejects discovery-only admission, stale baseline, unresolved dedup and unbound evidence', () => {
  assert.throws(() => buildWikibooksPrewrite({ ...args, reviews: [] }));
  for (const patch of [{ baselineSha256: 'f'.repeat(64) }, { unresolvedComparisons: 1 }, { novelty: 'UNKNOWN' }, { rights: 'HOLD' }]) assert.throws(() => buildWikibooksPrewrite({ ...args, reviews: [{ ...review, ...patch }] }));
  assert.throws(() => buildWikibooksPrewrite({ ...args, evidenceHashes: {} }));
  assert.throws(() => buildWikibooksPrewrite({ ...args, bundle: { ...bundle, records: [{ ...row, ingredients: ['invented ingredient'] }] } }));
  assert.throws(() => buildWikibooksPrewrite({ ...args, bundle: { ...bundle, records: [{ ...row, sourceWikitext: raw + ' altered' }] } }));
});
test('reviewed synthetic recipe uses existing two-shard plan with attribution and no write authority', () => {
  const result = buildWikibooksPrewrite(args);
  assert.equal(result.productionWriteAuthorized, false);
  assert.equal(result.fullFtsRebuildAuthorized, false);
  assert.equal(result.packets[0].source.license, 'CC-BY-SA-4.0');
  assert.equal(result.packets[0].recommendationAdmission, false);
  assert.equal(result.plan.manifest.corpusVersion, 'v8020');
});
