import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  ORA_IDUNS_1911_SOURCE,
  measureOraIduns1911Candidate
} from "./corpus-scale-step8g-ora-iduns-1911-core.mjs";

function parseArgs(argv) {
  const out = {
    ora:null,
    forkrecipe:null,
    unitools:null,
    cc0:null,
    rightsDoc:null,
    output:".tmp/step8g-iduns-1911-measurement"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) out.ora=arg.slice(6);
    else if (arg.startsWith("--forkrecipe=")) out.forkrecipe=arg.slice(13);
    else if (arg.startsWith("--unitools=")) out.unitools=arg.slice(11);
    else if (arg.startsWith("--cc0=")) out.cc0=arg.slice(6);
    else if (arg.startsWith("--rights-doc=")) out.rightsDoc=arg.slice(13);
    else if (arg.startsWith("--out=")) out.output=arg.slice(6) || out.output;
    else throw new Error(`UNKNOWN_ARGUMENT_${arg}`);
  }
  for (const key of ["ora","forkrecipe","unitools","cc0","rightsDoc"]) {
    if (!out[key]) throw new Error(`REQUIRED_${key.toUpperCase()}`);
  }
  return out;
}

const args=parseArgs(process.argv.slice(2));
const outputRoot=resolve(args.output);
const discoveryRoot=resolve(outputRoot,"discovery");
await mkdir(outputRoot,{recursive:true});

execFileSync(process.execPath,[
  "scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs",
  `--ora=${resolve(args.ora)}`,
  `--forkrecipe=${resolve(args.forkrecipe)}`,
  `--unitools=${resolve(args.unitools)}`,
  `--cc0=${resolve(args.cc0)}`,
  `--out=${discoveryRoot}`
],{cwd:process.cwd(),stdio:["ignore","pipe","inherit"]});

const [discovery,rightsDoc,oraLicense]=await Promise.all([
  readFile(resolve(discoveryRoot,"discovery.json"),"utf8").then(JSON.parse),
  readFile(resolve(args.rightsDoc),"utf8"),
  readFile(resolve(args.ora,"LICENSE.md"),"utf8")
]);

const candidate=(discovery.allMeasuredCandidates || []).find(row =>
  row.collection===ORA_IDUNS_1911_SOURCE.collection &&
  row.sourceUrl===ORA_IDUNS_1911_SOURCE.sourceUrl &&
  row.sourceTitle===ORA_IDUNS_1911_SOURCE.sourceTitle &&
  row.sourceAuthor===ORA_IDUNS_1911_SOURCE.sourceAuthor &&
  String(row.sourceYear)===ORA_IDUNS_1911_SOURCE.sourceYear
);
if (!candidate) throw new Error("IDUNS_EXACT_DISCOVERY_CANDIDATE_NOT_FOUND");

const repositoryReusePass=/unlicense/i.test(oraLicense) &&
  /free and unencumbered software released into the public domain/i.test(oraLicense);
const rightsDocumented=rightsDoc.includes(ORA_IDUNS_1911_SOURCE.rightsMarker);
const attributionClassified=rightsDoc.includes("CLASSIFIED_READY_FOR_PRIVATE_CORPUS__IDUNS_1911_EXACT_SOURCE_ATTRIBUTION");
const exactEditionClassified=rightsDoc.includes("CLASSIFIED_PROJECT_RUNEBERG_1911_FIRST_EDITION_FACSIMILE");
const authorTermClassified=rightsDoc.includes("CLASSIFIED_OSTMAN_DEATH_1933__SPAIN_1879_ACT_TERM_EXPIRED");
const independentExactSourceClassified=rightsDoc.includes("CLASSIFIED_PROJECT_RUNEBERG_PUBLIC_DOMAIN_POLICY__EXACT_1911_WORK");

const result=measureOraIduns1911Candidate({
  discovery,
  candidate,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified,
  exactEditionClassified,
  authorTermClassified,
  independentExactSourceClassified
});

const output={
  ...result,
  date:"2026-10-06",
  sourceRepository:ORA_IDUNS_1911_SOURCE.repository,
  sourceCommit:ORA_IDUNS_1911_SOURCE.commit,
  acquisitionPolicy:"OWNER_ACQUISITION_FIRST_2026_10_06",
  priorMarginalValueStopSuperseded:true
};

await writeFile(resolve(outputRoot,"measurement.json"),`${JSON.stringify(output,null,2)}\n`,"utf8");
process.stdout.write(`${JSON.stringify(output,null,2)}\n`);
