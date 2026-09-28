import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {designCanonicalGap} from './culinary-brain-c4-unitools-canonical-gap-design-core.mjs';

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...rest]=arg.replace(/^--/,'').split('=');return [key,rest.join('=')]}));
for (const key of ['unitools','summary']) if (!args[key]) throw new Error('C4_CANONICAL_GAP_ARGUMENT_REQUIRED_'+key);
const read=async path=>JSON.parse(await readFile(resolve(path),'utf8'));
const [dataset,contract,aliasSummary,step8d]=await Promise.all([
  read(resolve(args.unitools,'unitools-recipes-v1.json')),
  read('config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json'),
  read('data/generated/culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-summary-v1.json'),
  read('config/corpus_scale_step8d_contract.json')
]);
const commit=execFileSync('git',['-C',resolve(args.unitools),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const blob=execFileSync('git',['hash-object',resolve(args.unitools,step8d.source.dataPath)],{encoding:'utf8'}).trim();
if (commit!==step8d.source.commit || blob!==step8d.source.dataBlobSha) throw new Error('C4_CANONICAL_GAP_SOURCE_PIN_MISMATCH');
const summary=designCanonicalGap({dataset,contract,aliasSummary});
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+'\n');
process.stdout.write(summary.terminal+'\n');
