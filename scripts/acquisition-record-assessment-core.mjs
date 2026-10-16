import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const normalizeText = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
export const BASELINE_PINS = Object.freeze({ ora: 'ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8', forkrecipe: 'c32255266af39bd77444d39452f3df8088ac8fd9', unitools: '1d09e9548d957dd0375301146a86dddf5e269c1b', cc0: 'b12e481d1c220a13e0847a34e148d5872a16928e' });
const text = value => typeof value === 'string' ? value : value?.en || value?.ru || '';

// A literal wording screen, not semantic identity, translated-title matching or clearance.
export function fingerprintRecipe(recipe) {
  const title = text(recipe.title || recipe.name || recipe.identity?.canonicalTitle || recipe.nativeName);
  const ingredients = (recipe.ingredients || []).map(row => typeof row === 'string' ? row : text(row.item || row.name || row.label));
  const methods = recipe.directions || recipe.instructions || recipe.steps || recipe.processNodes || [];
  const method = methods.map(row => typeof row === 'string' ? row : text(row.text || row.action));
  const normalizedIngredients = ingredients.map(normalizeText).filter(Boolean);
  const normalizedMethod = method.map(normalizeText).filter(Boolean);
  return {
    title: normalizeText(title), ingredientCount: normalizedIngredients.length, methodCount: normalizedMethod.length,
    // Quantities are excluded across heterogeneous schemas; these are wording matches only.
    wordingHash: normalizedIngredients.length && normalizedMethod.length
      ? sha256(JSON.stringify([normalizedIngredients, normalizedMethod])) : null
  };
}

export function assessRecords({ catalog, finalized, baseline, sourcePin }) {
  if (sourcePin !== '1d20e28de6df5bbe49447b3042336575f5b7bc01') throw new Error('SOURCE_PIN_MISMATCH');
  if (!Array.isArray(catalog?.recipes) || catalog.recipes.length !== 13 || finalized.length !== 13) throw new Error('SOURCE_COUNT_MISMATCH');
  if (baseline.version !== 'v8019' || baseline.records?.length !== 22086 || baseline.count !== 22086) throw new Error('BASELINE_IDENTITY_MISMATCH');
  if (Object.entries(BASELINE_PINS).some(([key, pin]) => baseline.sourcePins?.[key] !== pin)) throw new Error('BASELINE_PIN_MISMATCH');
  if (baseline.records.some((row, i) => row.index !== i)) throw new Error('BASELINE_INDEX_MISMATCH');
  if (baseline.records.some(row => !row.title || !Number.isInteger(row.ingredientCount) || !Number.isInteger(row.methodCount))) throw new Error('BASELINE_RECORD_INVALID');
  const seen = new Set();
  const rows = catalog.recipes.map(recipe => {
    if (!recipe.id || seen.has(recipe.id)) throw new Error('SOURCE_DUPLICATE_ID');
    seen.add(recipe.id);
    const file = finalized.find(row => row.recipe.id === recipe.id);
    if (!file || JSON.stringify(file.recipe) !== JSON.stringify(recipe)) throw new Error('CATALOG_FINALIZED_MISMATCH');
    const fp = fingerprintRecipe(recipe);
    const structured = Boolean(fp.title && recipe.ingredients?.length && recipe.instructions?.length &&
      recipe.ingredients.every(row => typeof row.item === 'string' && row.item.trim()) &&
      recipe.instructions.every((row, i) => row.step === i + 1 && typeof row.text === 'string' && row.text.trim()));
    const namedSource = Boolean(recipe.source?.name || recipe.source?.url);
    return {
      id: recipe.id, path: file.path, sha256: file.sha256,
      ingredients: fp.ingredientCount, steps: fp.methodCount, structure: structured ? 'PASS' : 'HOLD',
      declaredSource: recipe.source || null,
      rights: namedSource ? 'HOLD_THIRD_PARTY_ADAPTATION' : 'CC0_DECLARATION_FOUND__ORIGIN_REVIEW_REQUIRED',
      rightsReason: namedSource ? 'CC0 covers original repository data only; source attribution is not third-party permission.' : 'No named source; absence does not independently prove original authorship. Repository CC0 declaration is preserved, not converted to import authority.',
      comparison: {
        normalizedTitleMatches: baseline.records.filter(row => row.title === fp.title).map(row => row.index),
        ingredientMethodWordingMatches: fp.wordingHash ? baseline.records.filter(row => row.wordingHash === fp.wordingHash).map(row => row.index) : [],
        recipeNovelty: 'UNRESOLVED_SEMANTIC_AND_TRANSLATION_REVIEW'
      },
      importAuthorized: false
    };
  });
  return {
    schema: 'HOCHIPANTS_ACQUISITION_RECORD_ASSESSMENT_V1', source: { repository: 'HoChiPants/open-recipe-archive', commit: sourcePin },
    baseline: { version: baseline.version, count: baseline.count, sourcePins: baseline.sourcePins, fingerprintSha256: sha256(JSON.stringify(baseline)) },
    comparisonScope: 'Every v8019 reconstructed record compared by normalized title and ingredient/method wording; wording excludes quantities. No semantic dedup or live D1 equality claim.',
    counts: { records: rows.length, structured: rows.filter(r => r.structure === 'PASS').length, namedSources: rows.filter(r => r.declaredSource).length, withoutNamedSource: rows.filter(r => !r.declaredSource).length, titleMatchCandidates: rows.filter(r => r.comparison.normalizedTitleMatches.length).length, wordingMatchCandidates: rows.filter(r => r.comparison.ingredientMethodWordingMatches.length).length, imports: 0 },
    baselineCoverage: { title: baseline.records.filter(r => r.title).length, wording: baseline.records.filter(r => r.wordingHash).length },
    records: rows, status: 'ASSESSMENT_COMPLETE__IMPORT_HOLD',
    nextAction: 'Review origin of the seven CC0-declared records and semantic/translated duplicate candidates in one no-write package; six third-party adaptations remain held. Capacity/prewrite and import authority remain separate gates.'
  };
}
