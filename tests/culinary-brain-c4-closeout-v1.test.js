import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {closeC4} from '../scripts/culinary-brain-c4-closeout-core.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('C4 closeout requires full matrix and exact distinct candidate without activation',()=>{
  const inputs={matrix:read('data/generated/culinary-brain-c4-real-v8018-failure-matrix-summary-v1.json'),policy:read('data/generated/culinary-brain-c4-hard-authority-policy-review-summary-v1.json'),duplicate:read('data/generated/culinary-brain-c4-bounded-p3-duplicate-safe-admission-summary-v1.json'),alias:read('data/generated/culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-summary-v1.json'),gap:read('data/generated/culinary-brain-c4-unitools-canonical-gap-design-summary-v1.json'),identity:read('data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json'),reconciliation:read('data/generated/culinary-brain-c4-tapioca-reconciliation-summary-v1.json')};
  assert.deepEqual(closeC4(inputs),read('data/generated/culinary-brain-c4-closeout-summary-v1.json'));
  assert.throws(()=>closeC4({...inputs,reconciliation:{...inputs.reconciliation,identityOverlayActivated:true}}),/CANDIDATE_MISMATCH/);
  assert.throws(()=>closeC4({...inputs,matrix:{...inputs.matrix,recipeCount:19267}}),/FULL_MATRIX_MISSING/);
});
