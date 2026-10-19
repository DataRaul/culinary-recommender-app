import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { normalizePage } from './wikibooks-text-core.mjs';
import { checkBatch } from './acquire-wikibooks-text.mjs';
import { BASELINE_PINS, fingerprintRecipe } from './acquisition-record-assessment-core.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
const countBy = values => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});

export function compareLiteral(records, baseline) {
  if (baseline.version !== 'v8019' || baseline.count !== 22086 || baseline.records?.length !== 22086 || Object.entries(BASELINE_PINS).some(([key, value]) => baseline.sourcePins?.[key] !== value)) throw new Error('BASELINE_IDENTITY_MISMATCH');
  if (baseline.records.some((r, i) => r.index !== i || !r.title || !r.recipe || JSON.stringify(fingerprintRecipe(r.recipe)) !== JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !['index', 'recipe'].includes(k)))))) throw new Error('BASELINE_CONTENT_MISMATCH');
  const titles = new Map(), words = new Map();
  for (const row of baseline.records) {
    titles.set(row.title, [...(titles.get(row.title) || []), row.index]);
    if (row.wordingHash) words.set(row.wordingHash, [...(words.get(row.wordingHash) || []), row.index]);
  }
  const seen = new Map();
  return records.map(row => {
    const fp = fingerprintRecipe(row);
    const matches = fp.wordingHash ? words.get(fp.wordingHash) || [] : [];
    const within = fp.wordingHash ? seen.get(fp.wordingHash) || null : null;
    if (row.structure === 'PASS' && fp.wordingHash) seen.set(fp.wordingHash, within || row.id);
    return { ...row, comparison: {
      baselineRecordsCompared: baseline.count,
      normalizedTitleMatches: titles.get(fp.title) || [],
      ingredientMethodWordingMatches: matches,
      withinSourceWordingMatch: within,
      // Wording equality excludes quantities in heterogeneous baseline schemas.
      // It is a duplicate-review signal, not a safe automatic deletion rule.
      state: matches.length || within ? 'HOLD_WORDING_MATCH_REVIEW' : 'HOLD_SEMANTIC_AND_TRANSLATED_DEDUP',
      noveltyEstablished: false
    } };
  });
}

export async function assess(discoveryPath, cacheRoot, baselinePath, outputRoot) {
  const discoveryBytes = await readFile(discoveryPath);
  const discovery = JSON.parse(discoveryBytes);
  const cache = resolve(cacheRoot), output = resolve(outputRoot);
  const receipt = JSON.parse(await readFile(resolve(cache, 'receipt.json')));
  if (receipt.discoverySha256 !== sha(discoveryBytes) || !discovery.sourceUniverseComplete || receipt.records !== discovery.records.length) throw new Error('CACHE_DISCOVERY_MISMATCH');
  const revisions = new Map(), talks = new Map();
  for (const batch of receipt.receipts) {
    const bytes = await readFile(resolve(cache, batch.file));
    if (sha(bytes) !== batch.sha256) throw new Error('CACHE_HASH_MISMATCH');
    for (const page of checkBatch(JSON.parse(bytes), batch.requested, batch.kind)) {
      if (batch.kind === 'talk') talks.set(page.title, page);
      else for (const rev of page.revisions) revisions.set(rev.revid, page);
    }
  }
  const baselineBytes = await readFile(baselinePath);
  const baseline = JSON.parse(baselineBytes);
  const normalized = discovery.records.map(row => normalizePage(revisions.get(row.revid), talks.get(row.title.replace(/^Cookbook:/, 'Cookbook talk:')), row));
  const records = compareLiteral(normalized, baseline);
  const clean = records.filter(row => row.structure === 'PASS' && row.holdReasons.length === 0);
  const summary = {
    schema: 'WIKIBOOKS_ACQUISITION_TEXT_ASSESSMENT_V1', sourceAcquiredAt: receipt.acquiredAt,
    discoverySha256: sha(discoveryBytes), sourceUniverseComplete: true,
    baseline: { version: baseline.version, count: baseline.count, sourcePins: baseline.sourcePins, sha256: sha(baselineBytes), wordingCoverage: baseline.records.filter(r => r.wordingHash).length },
    counts: { acquired: records.length, structurallyExtracted: records.filter(r => r.structure === 'PASS').length, standardTextPathScreenPass: records.filter(r => rowRightsPass(r)).length, normalizedReviewCandidates: clean.length, heldAtExtractionOrRights: records.length - clean.length, wordingMatchCandidates: clean.filter(r => r.comparison.ingredientMethodWordingMatches.length || r.comparison.withinSourceWordingMatch).length, normalizedTitleMatchCandidates: clean.filter(r => r.comparison.normalizedTitleMatches.length).length, novelAdmitted: 0, indexedDelta: 0, productionWrites: 0 },
    holdReasonCounts: countBy(records.flatMap(r => r.holdReasons)),
    semanticDedupComplete: false, translatedDedupComplete: false,
    prewrite: 'NOT_EARNED__PAGE_REVIEW_AND_SEMANTIC_DEDUP_REQUIRED',
    productionVersion: 'v8019_UNCHANGED_NO_LIVE_PROBE',
    status: 'PINNED_TEXT_ACQUIRED_AND_NORMALIZED__ADMISSION_HOLD',
    nextAction: 'Review the cached normalized cohort and held notices; resolve full baseline semantic/translated equivalence before generating protected prewrite. Do not repeat source discovery or acquisition.',
    limitations: ['Standard text notice screening is not a page-by-page legal opinion.', 'Literal wording excludes heterogeneous quantity fields and is not semantic deduplication.', 'No v8020 version, protected-body population, FTS writes, deployment or owner live tests have been performed.']
  };
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'recipes.json'), JSON.stringify({ schema: 'WIKIBOOKS_TEXT_CANDIDATE_BUNDLE_V1', license: 'CC-BY-SA-4.0', productionAdmission: false, records }, null, 2) + '\n');
  await writeFile(resolve(output, 'assessment.json'), JSON.stringify(summary, null, 2) + '\n');
  await writeFile(resolve(output, 'discovery.json'), discoveryBytes);
  await writeFile(resolve(output, 'acquisition-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  // Public metadata only; baseline recipe bodies remain in their licensed sources.
  await writeFile(resolve(output, 'baseline-fingerprints.json'), JSON.stringify({ ...baseline, records: baseline.records.map(({ recipe, ...row }) => row) }, null, 2) + '\n');
  return summary;
}
function rowRightsPass(row) { return row.rights === 'STANDARD_TEXT_PATH_SCREEN_PASS'; }
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 6) throw new Error('Usage: node scripts/assess-wikibooks-text.mjs DISCOVERY CACHE BASELINE OUTPUT');
  console.log(JSON.stringify(await assess(...process.argv.slice(2)), null, 2));
}
