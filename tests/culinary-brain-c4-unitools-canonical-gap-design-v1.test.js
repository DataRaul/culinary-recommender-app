import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {designCanonicalGap} from '../scripts/culinary-brain-c4-unitools-canonical-gap-design-core.mjs';

const read=path=>JSON.parse(readFileSync(path,'utf8'));
test('pinned source identifies the three remaining single ingredient blockers without admission',{skip:!existsSync('.tmp/unitools/unitools-recipes-v1.json')},()=>{
  const summary=designCanonicalGap({dataset:read('.tmp/unitools/unitools-recipes-v1.json'),contract:read('config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json'),aliasSummary:read('data/generated/culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-summary-v1.json')});
  assert.deepEqual(summary,read('data/generated/culinary-brain-c4-unitools-canonical-gap-design-summary-v1.json'));
  assert.equal(summary.newFullyMappedRecipes,0);
  assert.equal(summary.recommendationAdmissionChanged,false);
});
test('missing or drifted entry evidence cannot produce a gap decision',()=>{
  assert.throws(()=>designCanonicalGap({dataset:{recipes:[]},contract:{},aliasSummary:{pass:true}}),/ENTRY_MISMATCH/);
  const frozen=read('data/generated/culinary-brain-c4-unitools-canonical-gap-design-summary-v1.json');
  assert.equal(frozen.oneUnresolvedIngredientRecipes.length,3);
  assert.equal(frozen.hardAuthorityPromoted,false);
  assert.equal(frozen.nextGate,'C4_TAPIOCA_CANONICAL_IDENTITY_AND_HARD_POLICY_REVIEW_V1');
});
