import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { rankCandidates } from './hochipants-semantic-review-core.mjs';
import { sha256 } from './acquisition-record-assessment-core.mjs';

const [localRecordsPath, fingerprintsPath, sourceRoot, outputPath] = process.argv.slice(2);
if (!outputPath) throw new Error('Usage: node scripts/run-hochipants-semantic-review.mjs LOCAL_RECORDS FINGERPRINTS PINNED_SOURCE OUTPUT_METADATA');
const source = resolve(sourceRoot);
const git = args => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
if (git(['rev-parse', 'HEAD']) !== '1d20e28de6df5bbe49447b3042336575f5b7bc01' || git(['status', '--porcelain'])) throw new Error('CANDIDATE_SOURCE_PIN_OR_CLEANLINESS_MISMATCH');
const localBytes = await readFile(localRecordsPath, 'utf8');
const fingerprints = JSON.parse(await readFile(fingerprintsPath, 'utf8'));
if (sha256(JSON.stringify(fingerprints)) !== '426e44c607151b19ec85aeab7993e0a098a55c84c63202e227df18ae4b71562a') throw new Error('BASELINE_FINGERPRINT_HASH_MISMATCH');
const catalog = JSON.parse(await readFile(resolve(source, 'public/data/catalog.json'), 'utf8'));
const results = rankCandidates({ baseline: JSON.parse(localBytes), fingerprints, candidates: catalog.recipes.filter(row => !row.source) });
results.localRecordsSha256 = sha256(localBytes);
results.sourceCommit = git(['rev-parse', 'HEAD']);
// Only titles, indices and concept/score metadata leave the local source analysis.
await writeFile(outputPath, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify({ pairsScored: results.pairsScored, outputPath, sourceBodiesPublished: false }));
