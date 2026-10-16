import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assessRecords, sha256 } from './acquisition-record-assessment-core.mjs';

const [sourceRoot, baselinePath, outputPath] = process.argv.slice(2);
if (!sourceRoot || !baselinePath || !outputPath) throw new Error('usage: node scripts/run-hochipants-acquisition-assessment.mjs SOURCE_CHECKOUT BASELINE_FINGERPRINTS OUTPUT');
const root = resolve(sourceRoot);
const pin = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
// Read Git objects, not mutable worktree files, so provenance always binds actual input bytes.
const gitRead = path => execFileSync('git', ['-C', root, 'show', `${pin}:${path}`], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const paths = execFileSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', pin, 'recipes'], { encoding: 'utf8' }).trim().split('\n').filter(p => p.endsWith('.json'));
const finalized = paths.map(path => { const bytes = gitRead(path); return { path, sha256: sha256(bytes), recipe: JSON.parse(bytes) }; });
const catalogBytes = gitRead('public/data/catalog.json');
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const assessment = assessRecords({ catalog: JSON.parse(catalogBytes), finalized, baseline, sourcePin: pin });
assessment.sourceFiles = Object.fromEntries(['LICENSE.md', 'docs/CONTENT_POLICY.md', 'scraping/config/publication-rights.json', 'public/data/catalog.json'].map(path => [path, sha256(gitRead(path))]));
await mkdir(resolve(outputPath, '..'), { recursive: true });
await writeFile(outputPath, JSON.stringify(assessment, null, 2) + '\n');
console.log(JSON.stringify({ status: assessment.status, counts: assessment.counts, baselineCoverage: assessment.baselineCoverage }));
