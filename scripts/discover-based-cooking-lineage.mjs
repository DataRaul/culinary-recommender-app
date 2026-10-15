import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const sha = /^[a-f0-9]{40}$/;
function validateTree(snapshot) {
  if (!sha.test(snapshot.commit) || snapshot.sha !== snapshot.commit || snapshot.truncated !== false || !Array.isArray(snapshot.tree)) throw new Error('Complete pinned tree required');
  const paths = new Set();
  for (const row of snapshot.tree) {
    if (!row.path || row.path.startsWith('/') || row.path.includes('\\') || row.path.split('/').some(p => !p || p === '.' || p === '..') || paths.has(row.path) || !sha.test(row.sha)) throw new Error('Invalid or duplicate tree entry');
    paths.add(row.path);
  }
}
const key = p => p.replace(/^(content|src)\//, '').replace(/\.md$/i, '').toLowerCase();
export function discover(input) {
  validateTree(input.source);
  validateTree(input.baseline);
  const baseline = input.baseline.tree.filter(r => r.type === 'blob' && r.mode === '100644' && r.path.startsWith('src/'));
  const source = input.source.tree.filter(r => r.type === 'blob' && r.mode === '100644' && (r.path.startsWith('content/') && !r.path.split('/').at(-1).startsWith('_') || r.path === 'cinnaroll.md'));
  if (!baseline.length || !source.length) throw new Error('Empty source or baseline');
  const blobs = new Set(baseline.map(r => r.sha));
  const keys = new Set(baseline.map(r => key(r.path)));
  const rows = source.map(r => ({
    path: r.path, git_blob_sha: r.sha, bytes: r.size,
    status: blobs.has(r.sha) ? 'EXACT_BASELINE_BLOB' : keys.has(key(r.path)) ? 'PATH_OVERLAP_REQUIRES_CONTENT_COMPARE' : 'PATH_NEW_REQUIRES_CORPUS_DEDUP',
    exception: !r.path.startsWith('content/') ? 'ROOT_ORPHAN_RESCUE' : !r.path.endsWith('.md') ? 'MISSING_MARKDOWN_EXTENSION' : null
  })).sort((a,b) => a.path.localeCompare(b.path, 'en'));
  return {
    schema_version: 1, terminal: 'NON_ORA_LINEAGE_DISCOVERY_COMPLETE__RECORD_MEASUREMENT_NEXT',
    source: { repository: input.source.repository, commit: input.source.commit },
    baseline: { repository: input.baseline.repository, commit: input.baseline.commit, file_count: baseline.length, stored_count: 226, historical_structurally_parseable_count: 223, evidence: input.baseline_evidence },
    counts: {
      candidate_files: rows.length,
      exact_baseline_blobs: rows.filter(r => r.status === 'EXACT_BASELINE_BLOB').length,
      overlapping_paths: rows.filter(r => r.status === 'PATH_OVERLAP_REQUIRES_CONTENT_COMPARE').length,
      new_paths: rows.filter(r => r.status === 'PATH_NEW_REQUIRES_CORPUS_DEDUP').length,
      exceptions: rows.filter(r => r.exception).length,
      confirmed_new_usable_recipes: null, added_to_protected_corpus: 0
    },
    rights: { status: 'SOURCE_DECLARATION_FOUND__RECORD_REVIEW_REQUIRED', license_evidence: input.license_evidence, attribution: 'Preserve author, source URL, pinned commit and change history; final obligations require record review.', scope: 'README explicitly declares website content public domain; LICENSE.md is software-worded Unlicense. This is discovery evidence, not completed Spain-facing per-record clearance.' },
    sample_observations: input.samples,
    next_gate: 'BASED_COOKING_PINNED_RECORD_RIGHTS_STRUCTURE_AND_FULL_CORPUS_DEDUP_NO_WRITE',
    constraints: ['No recipe bodies or images in public Git', 'No D1 writes or runtime activation', 'No recommendation admission', 'Hemmets remains HOLD', 'No paid infrastructure or third shard', 'Preserve source omissions; do not infer safety metadata'],
    rows
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const result = discover(input);
  const text = JSON.stringify(result, null, 2) + '\n';
  if (process.argv[3]) writeFileSync(process.argv[3], text); else process.stdout.write(text);
}
