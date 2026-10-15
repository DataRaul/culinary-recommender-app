#!/usr/bin/env node
/** Owner-facing summary of recorded, same-chat review evidence (never proof of merger). */
import { readFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const safe = x => String(x ?? 'unknown').replace(/[\r\n<>|]/g, ' ').slice(0, 320);
const count = (report, predicate) => (report.findings ?? []).filter(predicate).length;

export function renderOwnerQualityReport({ contract, supporter, critic, synthesis }) {
  if (contract.review_mode !== 'SAME_CHAT_SEQUENTIAL' ||
      supporter.role !== 'supporter' || critic.role !== 'critic' ||
      synthesis.role !== 'synthesis' ||
      supporter.independent !== false || critic.independent !== false ||
      synthesis.independent !== false ||
      supporter.stage !== 3 || critic.stage !== 4 || synthesis.stage !== 5) {
    throw new Error('Unreviewed or wrongly identified reports cannot produce an owner summary');
  }
  const reports = [supporter, critic];
  const unresolved = reports.flatMap(r => (r.findings ?? []).filter(f => f.material && f.disposition !== 'RESOLVED'));
  // Fail closed: synthesis cannot overrule a HOLD or missing verdict in either review.
  const reviewHold = [supporter, critic, synthesis].some(r => r.verdict !== 'PASS') || unresolved.length > 0;
  const result = reviewHold ? 'HOLD — no publication authority' : 'REVIEWED — CI and merge still required';
  const resolved = reports.reduce((n, r) => n + count(r, f => f.disposition === 'RESOLVED'), 0);
  const deferred = reports.reduce((n, r) => n + count(r, f => f.disposition === 'DEFERRED'), 0);
  const lines = [
    `## Owner quality result — ${safe(contract.package_id)}`,
    `- **Result:** ${result}`,
    `- **Aligner:** Scope and acceptance criteria recorded in the package contract.`,
    `- **Builder:** Candidate and QA evidence frozen; this summary does not prove code correctness.`,
    `- **Supporter:** ${safe(supporter.verdict)}; ${(supporter.findings ?? []).length} finding(s).`,
    `- **Critic:** ${safe(critic.verdict)}; ${(critic.findings ?? []).length} finding(s).`,
    `- **Synthesis:** ${safe(synthesis.verdict)}; ${resolved} finding(s) resolved, ${deferred} deferred, ${unresolved.length} material unresolved.`,
    `- **Business value:** ${safe(synthesis.goal_contribution)}`,
    `- **Remaining gate:** ${reviewHold ? 'Repair or human decision before publication' : 'Required PR CI, eligible merge, verified lane checkpoint and STOP'}.`,
    `- **Owner action:** ${contract.human_decisions?.length ? 'Human decision remains required' : 'None recorded at this review boundary'}.`,
    '- **Assurance limitation:** Same-chat self-review (independent:false). Evidence validity is checked separately; neither this report nor its PASS proves merge, deployment or user acceptance.'
  ];
  return lines.join('\n') + '\n';
}

export function loadOwnerReport(root, packetRelative) {
  const resolve = rel => path.resolve(root, rel);
  const packet = JSON.parse(readFileSync(resolve(packetRelative), 'utf8'));
  const folder = path.dirname(packetRelative);
  const read = rel => JSON.parse(readFileSync(resolve(rel), 'utf8'));
  return renderOwnerQualityReport({
    contract: read(packet.subject.contract_path),
    supporter: read(path.join(folder, 'supporter.json')),
    critic: read(path.join(folder, 'critic.json')),
    synthesis: read(path.join(folder, 'synthesis.json'))
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , root, packet] = process.argv;
  if (!root || !packet) {
    process.stderr.write('Usage: node owner-quality-report.mjs <candidate-root> <packet-relative-path>\n');
    process.exitCode = 2;
  } else {
    try {
      const message = loadOwnerReport(root, packet);
      process.stdout.write(message);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, message);
    } catch (error) {
      process.stderr.write('Owner report unavailable: ' + error.message + '\n');
      process.exitCode = 1;
    }
  }
}
