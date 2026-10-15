import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const json = (path) => JSON.parse(read(path));

test('same-chat adapter pins exact implementation without relaxing lane safeguards', () => {
  const a = json('config/package_quality_adapter.json');
  assert.equal(a.review_mode, 'SAME_CHAT_SEQUENTIAL');
  assert.equal(a.shared_source.commit, '2e55b320c88df7fa75eaaf47113184ba44f5bb8d');
  assert.equal(Object.keys(a.shared_source.files).length, 8);
  for (const hash of Object.values(a.shared_source.files)) assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(a.roles.synthesis, 'skills/package-quality-gate/references/sequential.md');
  assert.equal(a.trigger.driver, 'next');
  assert.equal(a.trigger.background_launcher, false);
  assert.equal(a.max_rounds, 1);
  assert.equal(a.checkpoint.branch, 'continuity-state');
  assert.equal(a.checkpoint.stop_after_one_package, true);
  assert.equal(a.scheduled_actions, false);
  assert.equal(a.additional_paid_services, false);
});

test('contracts preserve historical mode and link stage evidence', () => {
  const t = json('docs/package_quality/CONTRACT_TEMPLATE.json');
  const c = json('docs/package_quality/contracts/same-chat-sequential-adoption-v1.json');
  assert.equal(t.review_mode, 'SAME_CHAT_SEQUENTIAL');
  assert.equal(c.review_mode, 'SAME_CHAT_SEQUENTIAL');
  for (const key of ['align', 'build_qa']) {
    assert.ok(c.stage_evidence[key].length > 0);
    assert.ok(c.stage_evidence[key].every(p => c.required_evidence.includes(p)));
  }
  assert.equal(c.budget.max_rounds, 1);
  assert.equal(json('docs/package_quality/contracts/install-quality-pilot-v1.json').review_mode, undefined);
});

test('wrapper and root protocol explicitly support sequential stages and hold gates', () => {
  const ag = read('AGENTS.md');
  const p = read('docs/PACKAGE_QUALITY_PROTOCOL.md');
  assert.match(ag, /SAME_CHAT_SEQUENTIAL/);
  assert.match(ag, /validate --synthesis/);
  for (const word of ['Supporter', 'Critic', 'synthesis', 'independent: false', 'continuity-state', 'next', 'HOLD']) {
    assert.ok(p.includes(word), 'missing protocol item: ' + word);
  }
  assert.match(p, /do not rewrite historical contracts/i);
  const h = read('docs/HANDOVER_PROTOCOL.md');
  assert.match(h, /SAME_CHAT_SEQUENTIAL/);
  assert.match(h, /independent: false/);
  assert.match(h, /Historical independent-session/);
  const w = read('scripts/package_quality.py');
  assert.match(w, /parse_known_args/);
  assert.match(w, /\*remainder/);
});
