import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {reviewTapiocaIdentity} from '../scripts/culinary-brain-c4-tapioca-identity-review-core.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
test('exact pinned identity and current-profile allergen review',{skip:!existsSync('.tmp/unitools/unitools-recipes-v1.json')},()=>{
  const dataset=read('.tmp/unitools/unitools-recipes-v1.json');
  const contract=read('config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json');
  const gap=read('data/generated/culinary-brain-c4-unitools-canonical-gap-design-summary-v1.json');
  assert.deepEqual(reviewTapiocaIdentity({dataset,contract,gap}),read('data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json'));
  const tampered=structuredClone(dataset);
  tampered.recipes.find(r=>r.slug==='pao-de-queijo').ingredients[0].name.en='Wheat starch';
  assert.throws(()=>reviewTapiocaIdentity({dataset:tampered,contract,gap}),/IDENTITY_DRIFT/);
});
test('candidate has no runtime admission or source diet claim promotion',()=>{
  const row=read('data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json');
  assert.deepEqual(row.candidateDeclaredAllergens,['egg','milk']);
  assert.deepEqual(row.candidateDietaryTags,['unrestricted']);
  assert.equal(row.overlayActivated,false);
  assert.equal(row.newRecommendationReadyRecipes,0);
  assert.equal(row.publicRuntimeChanged,false);
});
