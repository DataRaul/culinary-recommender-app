import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderOwnerQualityReport } from '../scripts/owner-quality-report.mjs';

const contract = { package_id: 'bounded-audit', review_mode: 'SAME_CHAT_SEQUENTIAL', human_decisions: [] };
const supporter = { role: 'supporter', independent: false, stage: 3, verdict: 'PASS', findings: [
  { id: 'S1', material: true, disposition: 'RESOLVED' }
] };
const critic = { role: 'critic', independent: false, stage: 4, verdict: 'PASS', findings: [
  { id: 'C1', material: false, disposition: 'DEFERRED' }
] };
const synthesis = { role: 'synthesis', independent: false, stage: 5, verdict: 'PASS',
  goal_contribution: 'Quality evidence visible, not a new recipe', findings: [] };

test('owner report states value, findings, pending CI and zero independent assurance', () => {
  const text = renderOwnerQualityReport({ contract, supporter, critic, synthesis });
  for (const item of ['bounded-audit', 'Supporter', 'Critic', '1 finding(s) resolved',
    '1 deferred', 'Business value', 'CI and merge still required', 'independent:false']) {
    assert.ok(text.includes(item), item);
  }
  assert.doesNotMatch(text, /deployed successfully/i);
});

test('unresolved material defect makes the human-readable report HOLD', () => {
  const text = renderOwnerQualityReport({ contract, supporter,
    critic: { ...critic, findings: [{ id: 'C2', material: true, disposition: 'DEFERRED' }] }, synthesis });
  assert.match(text, /HOLD — no publication authority/);
  assert.match(text, /1 material unresolved/);
});

test('a PASS synthesis with its own unresolved material finding is a HOLD', () => {
  const output = renderOwnerQualityReport({
    contract, supporter, critic,
    synthesis: { ...synthesis, findings: [
      { id: 'SY1', kind: 'robustness_defect', material: true, disposition: 'DEFERRED' }
    ] }
  });
  assert.match(output, /HOLD — no publication authority/);
  assert.match(output, /1 material unresolved/);
  assert.doesNotMatch(output, /REVIEWED — CI and merge still required/);
});

test('report refuses fake independent reviewers or stages', () => {
  assert.throws(() => renderOwnerQualityReport({
    contract, supporter: { ...supporter, independent: true }, critic, synthesis
  }), /wrongly identified/);
  assert.throws(() => renderOwnerQualityReport({
    contract, supporter, critic: { ...critic, stage: 3 }, synthesis
  }), /wrongly identified/);
});

function gateEvent(created_at) {
  return { pull_request: { created_at, base: { sha: '0'.repeat(40) }, head: { sha: '1'.repeat(40) } } };
}

test('trusted PR check preserves pre-cutover PRs, rejects missing verification for new PR', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'culinary-quality-'));
  try {
    const event = path.join(dir, 'event.json');
    writeFileSync(event, JSON.stringify(gateEvent('2026-10-13T10:00:00Z')));
    const args = ['scripts/quality_pr_gate.py', '--event', event, '--candidate', dir, '--trusted', dir, '--shared', dir];
    let run = spawnSync('python3', args, { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /LEGACY_PR_GRANDFATHERED/);
    writeFileSync(event, JSON.stringify(gateEvent('2026-10-17T10:00:00Z')));
    run = spawnSync('python3', args, { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /QUALITY_EVIDENCE_HOLD/);
    assert.doesNotMatch(run.stdout, /QUALITY_EVIDENCE_PASS/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CI workflow uses trusted base and never executes scripts from PR checkout', () => {
  const flow = readFileSync(new URL('../.github/workflows/quality-evidence.yml', import.meta.url), 'utf8');
  assert.match(flow, /pull_request_target:/);
  assert.match(flow, /python3 trusted\/scripts\/quality_pr_gate\.py/);
  assert.match(flow, /node', 'trusted\/scripts\/owner-quality-report\.mjs'/);
  assert.match(flow, /persist-credentials: false/g);
  assert.doesNotMatch(flow, /python3 candidate\/scripts|node candidate\/scripts|npm .*candidate/);
});


test('a PASS synthesis cannot override HOLD or missing Supporter/Critic verdicts', () => {
  for (const role of ['supporter', 'critic']) {
    for (const verdict of ['HOLD', 'FAIL', undefined]) {
      const altered = { ...(role === 'supporter' ? supporter : critic), verdict };
      const input = {
        contract, supporter: role === 'supporter' ? altered : supporter,
        critic: role === 'critic' ? altered : critic, synthesis
      };
      const text = renderOwnerQualityReport(input);
      assert.match(text, /HOLD — no publication authority/, `${role} ${verdict}`);
      assert.doesNotMatch(text, /REVIEWED — CI and merge still required/);
    }
  }
});

test('a HOLD or missing synthesis verdict cannot promote valid prior stages', () => {
  for (const verdict of ['HOLD', undefined]) {
    const text = renderOwnerQualityReport({ contract, supporter, critic, synthesis: { ...synthesis, verdict } });
    assert.match(text, /HOLD — no publication authority/);
  }
});

test('post-cutover passing and failing trusted-gate wiring scenarios execute', () => {
  const run = spawnSync('python3', ['tests/quality-pr-gate-integration.test.py'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stderr, /Ran 8 tests/);
  assert.match(run.stderr, /OK/);
});
