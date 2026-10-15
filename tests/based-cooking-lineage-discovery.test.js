import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discover } from '../scripts/discover-based-cooking-lineage.mjs';
const input = () => JSON.parse(readFileSync(new URL('../data/generated/step8g/based-cooking-discovery-inputs.json', import.meta.url)));
test('pinned inventory replays exact summary without claiming admitted or novel recipes', () => {
  const result = discover(input());
  const saved = JSON.parse(readFileSync(new URL('../data/generated/step8g/based-cooking-lineage-discovery.json', import.meta.url)));
  assert.deepEqual(result, saved);
  assert.equal(result.baseline.file_count, 226);
  assert.equal(result.counts.confirmed_new_usable_recipes, null);
  assert.equal(result.counts.added_to_protected_corpus, 0);
  assert.equal(result.counts.candidate_files, result.counts.exact_baseline_blobs + result.counts.overlapping_paths + result.counts.new_paths);
});
test('incomplete, floating, duplicate and unsafe inventories fail closed', () => {
  for (const mutate of [x => x.source.truncated = true, x => x.source.commit = 'main', x => x.source.tree.push(x.source.tree[0]), x => x.source.tree[0].path = '../escape']) {
    const x = input(); mutate(x); assert.throws(() => discover(x));
  }
});
test('renamed exact blobs remain duplicate candidates and symlinks never become recipes', () => {
  const x = input();
  const base = x.baseline.tree.find(r => r.path.startsWith('src/') && r.type === 'blob');
  x.source.tree.push({ ...base, path: 'content/a-renamed-duplicate.md' }, { ...base, path: 'content/unsafe-link.md', mode: '120000' });
  const r = discover(x);
  assert.equal(r.rows.find(r => r.path === 'content/a-renamed-duplicate.md').status, 'EXACT_BASELINE_BLOB');
  assert.ok(!r.rows.some(r => r.path === 'content/unsafe-link.md'));
});
test('malformed source placement is retained for record-level salvage', () => {
  const r = discover(input());
  assert.equal(r.rows.find(r => r.path === 'content/Mead').exception, 'MISSING_MARKDOWN_EXTENSION');
  assert.equal(r.rows.find(r => r.path === 'cinnaroll.md').exception, 'ROOT_ORPHAN_RESCUE');
  assert.ok(r.sample_observations.some(r => r.markdown_heading_shape === 'NONSTANDARD_PLAIN_HEADINGS'));
});
