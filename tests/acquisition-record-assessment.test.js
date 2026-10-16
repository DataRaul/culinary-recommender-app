import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRecords, fingerprintRecipe, BASELINE_PINS } from '../scripts/acquisition-record-assessment-core.mjs';

const recipe = { id: 'recipe', name: 'Soup', ingredients: [{ item: 'water' }], instructions: [{ step: 1, text: 'Boil.' }] };
function fixture() {
  const recipes = Array.from({ length: 13 }, (_, i) => ({ ...recipe, id: `recipe-${i}`, ...(i < 6 ? { source: { name: 'Third party', url: 'https://example.org/recipe', adapted: true } } : {}) }));
  return { sourcePin: '1d20e28de6df5bbe49447b3042336575f5b7bc01', catalog: { recipes }, finalized: recipes.map(r => ({ recipe: r, path: `recipes/${r.id}.json`, sha256: 'fixture' })), baseline: { version: 'v8019', count: 22086, sourcePins: BASELINE_PINS, records: Array.from({ length: 22086 }, (_, index) => ({ index, ...fingerprintRecipe({ ...recipe, name: 'Other', instructions: [{text: 'Simmer.'}] }) })) } };
}
test('compares every record, flags exact wording/title candidates without granting rights or novelty', () => {
  const input = fixture();
  input.baseline.records[22085] = { index: 22085, ...fingerprintRecipe(recipe) };
  const out = assessRecords(input);
  assert.equal(out.counts.structured, 13);
  assert.equal(out.counts.namedSources, 6);
  assert.equal(out.counts.withoutNamedSource, 7);
  assert.deepEqual(out.records[0].comparison.ingredientMethodWordingMatches, [22085]);
  assert.deepEqual(out.records[0].comparison.normalizedTitleMatches, [22085]);
  assert.ok(out.records.every(r => r.importAuthorized === false && r.comparison.recipeNovelty.startsWith('UNRESOLVED')));
});
test('fails closed for wrong pins, omitted baseline rows, duplicate indices and catalog drift', () => {
  const input = fixture();
  assert.throws(() => assessRecords({ ...input, sourcePin: 'main' }), /SOURCE_PIN/);
  assert.throws(() => assessRecords({ ...input, baseline: { ...input.baseline, sourcePins: {} } }), /BASELINE_PIN/);
  assert.throws(() => assessRecords({ ...input, baseline: { ...input.baseline, records: input.baseline.records.slice(1) } }), /BASELINE_IDENTITY/);
  input.baseline.records[1].index = 0;
  assert.throws(() => assessRecords(input), /BASELINE_INDEX/);
  input.baseline.records[1].index = 1;
  input.finalized[0] = { ...input.finalized[0], recipe: { ...recipe, id: 'recipe-0', name: 'Changed' } };
  assert.throws(() => assessRecords(input), /CATALOG_FINALIZED/);
});
test('retains incomplete records as structure holds; empty methods never duplicate', () => {
  const input = fixture();
  input.catalog.recipes[0] = { ...input.catalog.recipes[0], instructions: [] };
  input.finalized[0].recipe = input.catalog.recipes[0];
  const out = assessRecords(input);
  assert.equal(out.records[0].structure, 'HOLD');
  assert.deepEqual(out.records[0].comparison.ingredientMethodWordingMatches, []);
  assert.equal(fingerprintRecipe({title: 'empty', ingredients: []}).wordingHash, null);
});
test('supports multilingual and graph-shaped baselines without dropping non-Latin titles', () => {
  assert.equal(fingerprintRecipe({name: {ru: 'Суп'}, ingredients: [{name: {en:'Water'}}], steps: [{text:{en:'Boil.'}}]}).wordingHash, fingerprintRecipe(recipe).wordingHash);
  assert.equal(fingerprintRecipe({title:'水', ingredients:['water'], processNodes:[{action:'Boil.'}]}).title, '水');
});
