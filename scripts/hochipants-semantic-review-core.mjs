import { fingerprintRecipe, sha256, BASELINE_PINS } from './acquisition-record-assessment-core.mjs';

export const normalize = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).filter(v => typeof v === 'string') : [];
// Explicit, bounded review vocabulary. This is retrieval, never a novelty oracle.
export const vocabulary = {
  oat: ['oat', 'oats', 'oatmeal', 'muesli', 'bircher', 'avena', 'avoine', 'hafer', 'havre', 'овся'],
  strawberry: ['strawberr', 'fresa', 'fraise', 'erdbeer', 'jordbaer', 'jordgubb', 'fragol', 'клубник'],
  banana: ['banana', 'banan', 'platan', 'банан'],
  milk: ['milk', 'leche', 'lait', 'milch', 'maelk', 'mjolk', 'latte', 'молок'],
  honey: ['honey', 'miel', 'honig', 'honning', 'honung', 'miele', 'мед'],
  sugar: ['sugar', 'azucar', 'sucre', 'zucker', 'sukker', 'socker', 'zucchero', 'сахар'],
  flour: ['flour', 'harina', 'farine', 'mehl', 'mel', 'mjol', 'farina', 'мук'],
  butter: ['butter', 'mantequilla', 'beurre', 'smor', 'burro', 'сливочное масло'],
  egg: ['egg', 'huevo', 'oeuf', 'eier', 'aeg', 'agg', 'uov', 'яйц'],
  soda: ['baking soda', 'bicarbonat', 'natron', 'сод'],
  lemon: ['lemon', 'limon', 'citron', 'zitrone', 'citroen', 'лимон'],
  sparkling: ['sparkling', 'carbonated', 'seltzer', 'soda water', 'eau gazeuse', 'gaseosa', 'sprudel', 'газирован'],
  tomato: ['tomato', 'tomate', 'tomat', 'pomodor', 'томат', 'помидор'],
  cucumber: ['cucumber', 'pepino', 'concombre', 'gurke', 'agurk', 'gurka', 'cetriol', 'огур'],
  onion: ['onion', 'cebolla', 'oignon', 'zwiebel', 'log', 'lok', 'cipolla', 'лук'],
  olive: ['olive oil', 'aceite de oliva', 'huile d olive', 'olivenol', 'olivenolie', 'olivolja', 'olio d oliva', 'оливков'],
  bread: ['bread', 'sourdough', 'pain', 'brot', 'brod', 'pane', 'panini', 'toast', 'хлеб'],
  mozzarella: ['mozzarella', 'моцарелл'],
  basil: ['basil', 'albahaca', 'basilic', 'basilikum', 'basilika', 'базилик'],
  chickpea: ['chickpea', 'garbanzo', 'garbonzo', 'pois chiche', 'kichererbse', 'kikaert', 'kikart', 'ceci', 'нут'],
  tahini: ['tahini', 'tahin', 'sesame paste', 'тахин'],
  garlic: ['garlic', 'ajo', 'ail', 'knoblauch', 'hvidlog', 'vitlok', 'aglio', 'чеснок'],
  lentil: ['lentil', 'lenteja', 'lentille', 'linse', 'linser', 'lenticch', 'чечевиц'],
  broth: ['broth', 'stock', 'bouillon', 'caldo', 'bruehe', 'bruhe', 'buljong', 'brodo', 'бульон'],
  salt: ['salt', 'sal', 'sel', 'salz', 'sale', 'соль'],
  pepper: ['pepper', 'pimienta', 'poivre', 'pfeffer', 'peber', 'peppar', 'pepe', 'перец'],
  ice: ['ice', 'hielo', 'glacon', 'eis', 'isbit', 'ghiaccio', 'лед'],
  hummus: ['hummus', 'houmous', 'хумус'],
  salad: ['salad', 'ensalada', 'salade', 'salat', 'sallad', 'insalata', 'салат'],
  soup: ['soup', 'sopa', 'potage', 'suppe', 'soppa', 'zuppa', 'суп'],
  cake: ['cake', 'loaf', 'bizcocho', 'gateau', 'kuchen', 'kage', 'kaka', 'torta', 'кекс'],
  cheese: ['cheese', 'queso', 'fromage', 'kase', 'ost', 'formaggio', 'сыр'],
  caprese: ['caprese'],
  sandwich: ['sandwich', 'panini', 'toastie', 'croque', 'бутерброд']
};
const methods = {
  cold_soak: ['overnight', 'refrigerat', 'chill', 'soak', 'remoj', 'tremp', 'einweich', 'blotlaeg', 'blotlag', 'ночь', 'замоч'],
  bake: ['bake', 'oven', 'horne', 'backen', 'ofen', 'bage', 'ugn', 'forno', 'выпек', 'духов'],
  blend: ['blend', 'puree', 'processor', 'mash', 'crush', 'mixer', 'tritur', 'mixeur', 'purier', 'mos', 'блендер', 'пюре', 'размять'],
  toss: ['toss', 'dressing', 'vinaigrette', 'aliñar', 'melanger', 'vend', 'blanda', 'перемеш'],
  fry: ['skillet', 'fry', 'grill', 'toast', 'sarten', 'poele', 'brat', 'stege', 'steka', 'жар'],
  simmer: ['simmer', 'boil', 'hervir', 'bouillir', 'kochen', 'koge', 'koka', 'cuocere', 'варить', 'кипен'],
  carbonate: ['sparkling', 'seltzer', 'carbonated', 'soda water', 'gazeuse', 'gaseosa', 'газирован']
};
function concepts(text, dictionary) {
  const haystack = normalize(text).split(' ');
  return Object.entries(dictionary).filter(([, variants]) => variants.some(value => {
    const needle = normalize(value).split(' ');
    return haystack.some((_, i) => needle.every((token, j) => (token.length <= 4 ? haystack[i + j] === token : haystack[i + j]?.startsWith(token))));
  })).map(([concept]) => concept);
}
export function features(recipe) {
  const title = [recipe.title, recipe.name, recipe.nativeName, recipe.identity?.canonicalTitle].flatMap(strings).join(' ');
  const ingredients = (recipe.ingredients || []).flatMap(row => typeof row === 'string' ? [row] : [row.item, row.name, row.label].flatMap(strings)).join(' ');
  const method = (recipe.directions || recipe.instructions || recipe.steps || recipe.processNodes || []).flatMap(row => typeof row === 'string' ? [row] : [row.text, row.action, row.instructions].flatMap(strings)).join(' ');
  return { title: fingerprintRecipe(recipe).title, titleConcepts: concepts(title, vocabulary), ingredients: concepts(ingredients, vocabulary), methods: concepts(method, methods) };
}
const overlap = (a, b) => a.filter(x => b.includes(x));
const jaccard = (a, b) => a.length || b.length ? overlap(a, b).length / new Set([...a, ...b]).size : 0;
const queries = {
  'strawberry-overnight-oats': ['overnight', 'bircher', 'muesli', 'oat', 'havre', 'avena', 'avoine'],
  'one-bowl-banana-cake': ['banana', 'banan', 'platan'],
  'strawberry-lemon-spritz': ['strawberry lemonade', 'strawberry soda', 'spritz', 'cup', 'lemonade'],
  'tomato-cucumber-salad': ['tomato and cucumber', 'cucumber and tomato', 'tomate y pepino', 'concombre'],
  'caprese-grilled-cheese': ['caprese', 'grilled cheese', 'panini', 'toastie', 'mozzarella sandwich', 'cheese sandwich', 'croque monsieur'],
  'classic-hummus': ['hummus', 'houmous', 'chickpea dip', 'хумус'],
  'everyday-lentil-soup': ['lentil soup', 'sopa de lentejas', 'soupe de lentilles', 'linsensuppe', 'linssoppa']
};
const essential = {
  'strawberry-overnight-oats': ['oat', 'strawberry'], 'one-bowl-banana-cake': ['banana', 'flour'],
  'strawberry-lemon-spritz': ['strawberry', 'lemon', 'sparkling'], 'tomato-cucumber-salad': ['tomato', 'cucumber'],
  'caprese-grilled-cheese': ['bread', 'mozzarella', 'basil'], 'classic-hummus': ['chickpea', 'tahini'], 'everyday-lentil-soup': ['lentil', 'broth']
};
export function rankCandidates({ baseline, fingerprints, candidates, limit = 12 }) {
  if (baseline.version !== 'v8019' || baseline.count !== 22086 || baseline.records.length !== 22086) throw new Error('BASELINE_IDENTITY_MISMATCH');
  if (Object.entries(BASELINE_PINS).some(([k, v]) => baseline.sourcePins[k] !== v)) throw new Error('BASELINE_PIN_MISMATCH');
  const replay = { version: baseline.version, count: baseline.count, sourcePins: baseline.sourcePins, records: baseline.records.map((r, index) => ({ index, ...fingerprintRecipe(r) })) };
  if (JSON.stringify(replay) !== JSON.stringify(fingerprints)) throw new Error('BASELINE_REPLAY_MISMATCH');
  if (candidates.length !== 7 || new Set(candidates.map(r => r.id)).size !== 7 || candidates.some(r => !essential[r.id])) throw new Error('CANDIDATE_IDENTITY_MISMATCH');
  const corpus = baseline.records.map(features);
  return {
    schema: 'HOCHIPANTS_FULL_RANGE_SEMANTIC_RETRIEVAL_V1', baselineFingerprintSha256: sha256(JSON.stringify(replay)),
    baselineCount: corpus.length, candidateCount: candidates.length, pairsScored: corpus.length * candidates.length,
    vocabularyLanguages: ['English', 'Spanish', 'French', 'German', 'Danish', 'Swedish', 'Italian', 'Russian'],
    method: 'Bounded concept vocabulary, token-prefix aliases; score = .35 essential-ingredient recall + .30 ingredient Jaccard + .20 method Jaccard + .15 title-concept Jaccard. All pairs scored, top 12 retained; scores are retrieval signals, never calibrated equivalence probabilities.',
    limits: ['Finite vocabulary is not exhaustive translation or synonym coverage.', 'Negation, optional ingredients, quantities, ordering and historical language are not resolved by scores.', 'Missing parsed text and weak concept coverage cannot prove novelty.', 'Manual adjudication covers retained ranks, not every source body. All candidates retain novelty/rights HOLD.'],
    results: candidates.map(candidate => {
      const f = features(candidate), required = essential[candidate.id];
      const ranked = corpus.map((r, index) => {
        const ingredientOverlap = overlap(f.ingredients, r.ingredients), methodOverlap = overlap(f.methods, r.methods);
        const essentialRecall = overlap(required, r.ingredients).length / required.length;
        const score = .35 * essentialRecall + .30 * jaccard(f.ingredients, r.ingredients) + .20 * jaccard(f.methods, r.methods) + .15 * jaccard(f.titleConcepts, r.titleConcepts);
        return { index, title: r.title, score: Number(score.toFixed(6)), essentialRecall, ingredientOverlap, methodOverlap };
      }).sort((a, b) => b.score - a.score || a.index - b.index);
      return { id: candidate.id, comparedRecords: corpus.length, candidateFeatures: f, topMatches: ranked.slice(0, limit), titleProbeHits: ranked.filter(r => queries[candidate.id].some(q => normalize(r.title).includes(normalize(q)))).slice(0, 30), titleProbeHitLimit: 30, essentialIngredientHits: ranked.filter(r => r.essentialRecall === 1).length, noveltyDisposition: 'HOLD_NOT_PROVEN_BY_RETRIEVAL' };
    })
  };
}
