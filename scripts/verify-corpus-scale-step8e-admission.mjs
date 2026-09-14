import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildStep8EAdmission } from "./corpus-scale-step8e-admission.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));
const source = contract.source;
const outputDir = resolve(process.env.STEP8E_ARTIFACT_DIR || "artifacts/step8e-admission");

function gitBlobSha(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

function assertJsonEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} differs from deterministic pinned-source regeneration`);
}

const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.dataPath}`;
const response = await fetch(rawUrl, { headers: { "user-agent": "culinary-recommender-step8e-admission" } });
if (!response.ok) throw new Error(`Pinned UniTools fetch failed with HTTP ${response.status}`);
const sourceBytes = Buffer.from(await response.arrayBuffer());
const observedBlobSha = gitBlobSha(sourceBytes);
if (observedBlobSha !== source.dataBlobSha) throw new Error(`Pinned UniTools Git blob mismatch: ${observedBlobSha}`);

const dataset = JSON.parse(sourceBytes.toString("utf8"));
const result = buildStep8EAdmission(dataset, contract);
if (result.eligibleSubsetCount !== 1 || result.storedOnlyCount !== 500) throw new Error("Step 8E subset cardinality changed");
if (result.boundaries.publicRuntimeChanged !== false || result.boundaries.runtimeActivationAuthorized !== false) throw new Error("Step 8E cannot activate public runtime");

const evidence = {
  admissionVersion: result.admissionVersion,
  pass: result.pass,
  terminalCandidate: result.terminalCandidate,
  source: {
    sourceCohortId: result.sourceCohortId,
    commit: source.commit,
    dataBlobSha: source.dataBlobSha,
    observedGitBlobSha: observedBlobSha,
    datasetVersion: dataset.version,
    sourceBytes: sourceBytes.length
  },
  reviewedStoredPopulation: result.reviewedStoredPopulation,
  eligibleSubsetCount: result.eligibleSubsetCount,
  storedOnlyCount: result.storedOnlyCount,
  eligibleSourceSlugs: result.eligibleSourceSlugs,
  canonicalRecipeIds: result.runtimeCandidates.map(recipe => recipe.id),
  dishFamilyIds: result.runtimeCandidates.map(recipe => recipe.corpusMetadata.dishFamilyId),
  declaredAllergens: result.runtimeCandidates.map(recipe => recipe.allergySafety.declaredAllergens),
  dietaryTags: result.runtimeCandidates.map(recipe => recipe.dietaryTags),
  controlPlaneSha256: result.controlPlane.snapshotSha256,
  pipelineSha256: result.pipeline.pipelineSha256,
  admissionManifestSha256: result.admissionManifest.manifestSha256,
  admissionManifestCounts: result.admissionManifest.counts,
  boundaries: result.boundaries
};
const eligibleSubset = {
  schemaVersion: "CORPUS_SCALE_STEP8E_ELIGIBLE_SUBSET_V1",
  runtimeActivationAuthorized: false,
  publicRuntimeChanged: false,
  recipes: result.runtimeCandidates
};

const frozenEvidence = JSON.parse(readFileSync(new URL("../data/generated/step8e/admission-evidence.json", import.meta.url), "utf8"));
const frozenSubset = JSON.parse(readFileSync(new URL("../data/generated/step8e/eligible-subset.json", import.meta.url), "utf8"));
assertJsonEqual(frozenEvidence, evidence, "Frozen Step 8E admission evidence");
assertJsonEqual(frozenSubset, eligibleSubset, "Frozen Step 8E eligible subset");

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "step8e-admission-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
writeFileSync(resolve(outputDir, "step8e-eligible-subset.json"), `${JSON.stringify(eligibleSubset, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
