import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {reconcileTapiocaCandidate} from '../scripts/culinary-brain-c4-tapioca-reconciliation-core.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
test('exact source candidate meets reviewed metadata and duplicate guard',{skip:!existsSync('.tmp/unitools/unitools-recipes-v1.json')},()=>{
  const dataset=read('.tmp/unitools/unitools-recipes-v1.json');
  const identity=read('data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json');
  const source=read('config/corpus_scale_step8d_contract.json');
  assert.deepEqual(reconcileTapiocaCandidate({dataset,identity,source}),read('data/generated/culinary-brain-c4-tapioca-reconciliation-summary-v1.json'));
  const tampered=structuredClone(dataset);
  tampered.recipes.find(r=>r.slug==='pao-de-queijo').prepMinutes=null;
  assert.throws(()=>reconcileTapiocaCandidate({dataset:tampered,identity,source}),/METADATA_DRIFT/);
});
test('frozen evidence does not admit or activate candidate',()=>{
  const row=read('data/generated/culinary-brain-c4-tapioca-reconciliation-summary-v1.json');
  assert.equal(row.identityOverlayActivated,false);
  assert.equal(row.publicRuntimeChanged,false);
  assert.equal(row.recommendationAdmissionChanged,false);
});
