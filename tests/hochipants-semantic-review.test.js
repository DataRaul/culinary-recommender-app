import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { features, rankCandidates } from '../scripts/hochipants-semantic-review-core.mjs';
import { BASELINE_PINS, fingerprintRecipe } from '../scripts/acquisition-record-assessment-core.mjs';

test('multilingual features retain actual process instructions without short-prefix false friends', () => {
  const f = features({ title: 'Houmous', ingredients: ['pois chiches', 'tahin', 'jus de citron', 'vegetable broth'], processNodes: [{ action: 'Prepare', instructions: 'Blend the tahini and chickpeas.' }] });
  assert.ok(f.ingredients.includes('chickpea'));
  assert.ok(f.ingredients.includes('tahini'));
  assert.ok(f.ingredients.includes('lemon'));
  assert.ok(!f.ingredients.includes('bread'));
  assert.ok(f.methods.includes('blend'));
  assert.ok(!features({ instructions: ['Divide among four glasses.'] }).methods.includes('bake'));
  assert.ok(!features({ ingredients: ['rice porridge'] }).ingredients.includes('oat'));
});

test('full-range retrieval reaches last record and never grants semantic novelty', () => {
  const records = Array.from({ length: 22086 }, (_, i) => ({ title: `Unrelated ${i}`, ingredients: ['rice'], directions: ['Steam rice.'] }));
  records[22085] = { title: 'Houmous', ingredients: ['pois chiches', 'tahin', 'jus de citron'], directions: ['Blend until smooth.'] };
  const baseline = { version: 'v8019', count: 22086, sourcePins: BASELINE_PINS, records };
  const fingerprints = { ...baseline, records: records.map((r, index) => ({ index, ...fingerprintRecipe(r) })) };
  const ids = ['strawberry-overnight-oats', 'one-bowl-banana-cake', 'strawberry-lemon-spritz', 'tomato-cucumber-salad', 'caprese-grilled-cheese', 'classic-hummus', 'everyday-lentil-soup'];
  const candidates = ids.map(id => ({ id, title: id, ingredients: ['chickpeas', 'tahini', 'lemon'], instructions: ['Blend.'] }));
  const report = rankCandidates({ baseline, fingerprints, candidates });
  assert.equal(report.pairsScored, 154602);
  assert.equal(report.results.find(r => r.id === 'classic-hummus').topMatches[0].index, 22085);
  for (const row of report.results) assert.match(row.noveltyDisposition, /^HOLD_/);
  assert.throws(() => rankCandidates({ baseline: { ...baseline, sourcePins: {} }, fingerprints, candidates }), /PIN_MISMATCH/);
  const changed = structuredClone(fingerprints); changed.records[0].title = 'changed';
  assert.throws(() => rankCandidates({ baseline, fingerprints: changed, candidates }), /REPLAY_MISMATCH/);
});

test('local source-body export fails before reading sources for an in-repository output', () => {
  const result = spawnSync(process.execPath, ['scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs', '--ora=missing', '--forkrecipe=missing', '--unitools=missing', '--cc0=missing', '--baseline-fingerprints=unused', '--local-review-records=must-not-be-created.json'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /LOCAL_REVIEW_MUST_STAY_OUTSIDE_REPOSITORY/);
});
