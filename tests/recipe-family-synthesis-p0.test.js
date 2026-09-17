import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeRecipeFamilyP0 } from '../src/domain/recipe-family-synthesis-p0.js';

const source = (id, role, group, overrides = {}) => ({
  publisher: id,
  url: `https://example.test/${id}`,
  accessedAt: '2026-09-17',
  independenceGroup: group,
  publisherLedgerKey: id,
  acquisitionMode: 'MANUAL_REVIEW',
  lawfulAccess: 'YES',
  termsState: 'UNKNOWN',
  termsCheckedAt: '2026-09-17',
  tdmReservation: 'NOT_APPLICABLE',
  reuseBasis: 'STANDARD_COPYRIGHT',
  databaseExtractionRisk: 'LOW',
  cumulativeExtractionRisk: 'LOW',
  role,
  sourceExpressionPersisted: false,
  rawExpressionRetention: 'NONE',
  publicAttributionRequirement: 'NOT_REQUIRED',
  publicAttributionState: 'NOT_APPLICABLE',
  ...overrides
});

const ingredient = (ingredientId, quantity, unit, role = 'STRUCTURAL') => ({ ingredientId, role, quantity, unit });
const observation = (id, role, group, ingredients, techniques, extra = {}) => ({
  observationId: id,
  familyCandidate: 'carbonara',
  source: source(id, role, group),
  servings: role === 'REFERENCE_EVIDENCE' ? null : 2,
  ingredients,
  techniques,
  times: role === 'REFERENCE_EVIDENCE' ? {} : { totalMinutes: 25 },
  equipment: role === 'REFERENCE_EVIDENCE' ? [] : ['pot', 'pan'],
  ...extra
});

const definition = {
  familyId: 'carbonara',
  principalIngredientId: 'pasta',
  independentPracticalMinimum: 3,
  requiredIngredientIds: ['pasta', 'egg_unit', 'hard_cheese', 'cured_pork'],
  referenceProfile: {
    identityClaims: ['pasta with an egg-and-cheese emulsion and rendered cured pork'],
    scopeLimits: ['observed popularity does not redefine reference identity'],
    requiredIngredientRoles: ['starch', 'egg_system', 'cheese', 'pork'],
    requiredTechniques: ['cook_pasta', 'render_pork', 'off_heat_emulsification']
  },
  allowedAdaptations: [],
  projection: {
    title: 'Project Carbonara Candidate',
    culinary: {
      cuisine: 'Italian',
      region: 'Lazio',
      mealTypes: ['lunch', 'dinner'],
      techniques: ['cook_pasta', 'render_pork', 'off_heat_emulsification'],
      difficulty: 2,
      techniqueComplexity: 2,
      failureRisk: 'medium'
    },
    time: { prepMinutes: 10, activeMinutes: 20, passiveMinutes: 0, totalMinutes: 30 },
    instructions: [
      'Cook the pasta until firm and reserve some cooking water.',
      'Render the cured pork until its fat is released.',
      'Away from direct heat, combine the hot pasta with the project egg-cheese mixture and loosen gradually until glossy.'
    ],
    equipment: ['hob', 'pot', 'pan', 'bowl'],
    nutrition: { energyKcal: 600, proteinG: 25, carbohydrateG: 70, fatG: 25, fibreG: 3 },
    dietaryTags: ['unrestricted'],
    allergySafety: { declaredAllergens: ['egg', 'milk', 'gluten'], confidence: 'ingredient-list-derived' },
    costTier: 2,
    convenience: { mealPrepSuitability: 1, batchSuitability: 1, freezerSuitability: 1, leftoverSuitability: 1, portability: 1 },
    discovery: { flavourProfile: ['savory'], spiceLevel: 1, familiarity: 4, novelty: 1, techniqueLearningValue: 3 },
    mainProtein: 'egg_pork'
  }
};

const observations = [
  observation('ref', 'REFERENCE_EVIDENCE', 'ref', [
    ingredient('pasta', null, null), ingredient('egg_unit', null, null), ingredient('hard_cheese', null, null), ingredient('cured_pork', null, null)
  ], ['cook_pasta', 'render_pork', 'off_heat_emulsification']),
  observation('p1', 'STRUCTURE_EVIDENCE', 'g1', [
    ingredient('pasta', 200, 'g'), ingredient('egg_unit', 2, 'count'), ingredient('hard_cheese', 50, 'g'), ingredient('cured_pork', 70, 'g')
  ], ['cook_pasta', 'render_pork', 'off_heat_emulsification']),
  observation('p2', 'STRUCTURE_EVIDENCE', 'g2', [
    ingredient('pasta', 220, 'g'), ingredient('egg_unit', 3, 'count'), ingredient('hard_cheese', 65, 'g'), ingredient('cured_pork', 90, 'g')
  ], ['cook_pasta', 'render_pork', 'off_heat_emulsification'], { variantKey: 'whole_egg_forward' }),
  observation('p3', 'STRUCTURE_EVIDENCE', 'g3', [
    ingredient('pasta', 180, 'g'), ingredient('egg_unit', 2, 'count'), ingredient('hard_cheese', 55, 'g'), ingredient('cured_pork', 75, 'g')
  ], ['cook_pasta', 'render_pork', 'off_heat_emulsification'], { variantKey: 'whole_egg_forward' }),
  observation('dup', 'STRUCTURE_EVIDENCE', 'g3', [
    ingredient('pasta', 400, 'g'), ingredient('egg_unit', 6, 'count'), ingredient('hard_cheese', 150, 'g'), ingredient('cured_pork', 160, 'g')
  ], ['cook_pasta', 'render_pork', 'off_heat_emulsification'])
];

test('keeps reference identity separate, deduplicates independence groups, and produces a prototype-only candidate', () => {
  const result = synthesizeRecipeFamilyP0(observations, definition);
  assert.equal(result.independentPracticalObservationCount, 3);
  assert.deepEqual(result.referenceProfile.evidenceIds, ['ref']);
  assert.equal(result.appAuthoringGate.pass, true);
  assert.equal(result.variants[0].state, 'OBSERVED_VARIANT');
  assert.equal(result.candidateRecipe.governance.publicActivationAuthorized, false);
  assert.equal(result.candidateRecipe.governance.uiLegalConformancePassed, false);
  assert.equal(result.provenance.protectedSourceExpressionPersisted, false);
});

test('does not turn a frequent observed ingredient into a reference identity claim', () => {
  const withCream = observations.map((item, index) => index > 0
    ? { ...item, ingredients: [...item.ingredients, ingredient('cream', 30, 'g', 'OPTIONAL')] }
    : item);
  const result = synthesizeRecipeFamilyP0(withCream, definition);
  const cream = result.observedProfile.ingredientSignals.find(item => item.ingredientId === 'cream');
  assert.equal(cream.supportBand, 'CORE_SIGNAL');
  assert.equal(result.referenceProfile.identityClaims.some(claim => claim.includes('cream')), false);
});

test('fails app authoring when a required ingredient has incompatible units instead of silently mixing them', () => {
  const conflicted = observations.map(item => item.observationId === 'p3'
    ? {
        ...item,
        ingredients: item.ingredients.map(value => value.ingredientId === 'hard_cheese'
          ? { ...value, quantity: 2, unit: 'oz' }
          : value)
      }
    : item);
  const result = synthesizeRecipeFamilyP0(conflicted, definition);
  const cheese = result.observedProfile.ingredientSignals.find(item => item.ingredientId === 'hard_cheese');
  assert.equal(cheese.unitConflict, true);
  assert.equal(cheese.recommendedRange.perServing, null);
  assert.equal(result.appAuthoringGate.pass, false);
  assert.equal(result.candidateRecipe, null);
});

test('propagates a ready source attribution obligation into the candidate without granting public activation', () => {
  const attributed = observations.map(item => item.observationId === 'p1'
    ? {
        ...item,
        source: {
          ...item.source,
          reuseBasis: 'OPEN_LICENCE',
          publicAttributionRequirement: 'REQUIRED',
          publicAttributionState: 'READY',
          attributionLabel: 'Example Source',
          attributionLicenseOrBasis: 'CC BY-SA 4.0'
        }
      }
    : item);
  const result = synthesizeRecipeFamilyP0(attributed, definition);
  assert.equal(result.appAuthoringGate.pass, true);
  assert.equal(result.attributionRequirements.length, 1);
  assert.equal(result.candidateRecipe.provenance.evidenceAttributionRequirements[0].licenseOrBasis, 'CC BY-SA 4.0');
  assert.equal(result.candidateRecipe.governance.publicActivationAuthorized, false);
});
