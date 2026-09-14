import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { scanStep8EReadiness } from "./corpus-scale-step8e-core.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));
const source = contract.source;
const outputDir = resolve(process.env.STEP8E_ARTIFACT_DIR || "artifacts/step8e-preflight");

function gitBlobSha(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.dataPath}`;
const response = await fetch(rawUrl, { headers: { "user-agent": "culinary-recommender-step8e-preflight" } });
if (!response.ok) throw new Error(`Pinned UniTools fetch failed with HTTP ${response.status}`);

const sourceBytes = Buffer.from(await response.arrayBuffer());
const observedBlobSha = gitBlobSha(sourceBytes);
if (observedBlobSha !== source.dataBlobSha) {
  throw new Error(`Pinned UniTools Git blob mismatch: expected ${source.dataBlobSha}, observed ${observedBlobSha}`);
}

const dataset = JSON.parse(sourceBytes.toString("utf8"));
const evidence = scanStep8EReadiness(dataset, contract);
evidence.source.observedGitBlobSha = observedBlobSha;
evidence.source.sourceBytes = sourceBytes.length;

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "step8e-preflight.json"), `${JSON.stringify(evidence, null, 2)}\n`);

const logSummary = {
  preflightVersion: evidence.preflightVersion,
  pass: evidence.pass,
  terminalCandidate: evidence.terminalCandidate,
  source: evidence.source,
  inheritedStep8D: evidence.inheritedStep8D,
  ontology: {
    canonicalIngredientCount: evidence.ontology.canonicalIngredientCount,
    ingredientOccurrences: evidence.ontology.ingredientOccurrences,
    resolvedIngredientOccurrences: evidence.ontology.resolvedIngredientOccurrences,
    unresolvedIngredientOccurrences: evidence.ontology.unresolvedIngredientOccurrences,
    conflictingIngredientOccurrences: evidence.ontology.conflictingIngredientOccurrences,
    recipesAllIngredientsMapped: evidence.ontology.recipesAllIngredientsMapped,
    unresolvedTop: evidence.ontology.unresolvedTop.slice(0, 40)
  },
  quantities: evidence.quantities,
  hardMetadata: evidence.hardMetadata,
  duplicateSignals: evidence.duplicateSignals,
  boundaries: evidence.boundaries
};
console.log(JSON.stringify(logSummary, null, 2));
