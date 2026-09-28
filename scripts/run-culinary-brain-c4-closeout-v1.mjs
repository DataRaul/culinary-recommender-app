import {readFile,writeFile} from 'node:fs/promises';
import {closeC4} from './culinary-brain-c4-closeout-core.mjs';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const [matrix,policy,duplicate,alias,gap,identity,reconciliation]=await Promise.all([
  'data/generated/culinary-brain-c4-real-v8018-failure-matrix-summary-v1.json',
  'data/generated/culinary-brain-c4-hard-authority-policy-review-summary-v1.json',
  'data/generated/culinary-brain-c4-bounded-p3-duplicate-safe-admission-summary-v1.json',
  'data/generated/culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-summary-v1.json',
  'data/generated/culinary-brain-c4-unitools-canonical-gap-design-summary-v1.json',
  'data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json',
  'data/generated/culinary-brain-c4-tapioca-reconciliation-summary-v1.json'
].map(read));
const output=process.argv[2]||'data/generated/culinary-brain-c4-closeout-summary-v1.json';
const summary=closeC4({matrix,policy,duplicate,alias,gap,identity,reconciliation});
await writeFile(output,JSON.stringify(summary,null,2)+'\n');
process.stdout.write(summary.terminal+'\n');
