import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const evidence = JSON.parse(
  await readFile(new URL("../data/generated/protected-corpus-p2-live-alignment-v1.json", import.meta.url), "utf8")
);

test("P2 terminal live alignment evidence is exact and bounded", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS");
  assert.equal(evidence.activeVersion, "v8018");
  assert.equal(evidence.indexedRecipeCount, 19268);
  assert.equal(evidence.ftsRecipeCount, 19268);
  assert.equal(evidence.structuralPartialCount, 3);
  assert.equal(evidence.frozenSampleRecipeCount, 500);
  assert.equal(evidence.matchedFrozenRecipeCount, 500);
  assert.equal(evidence.sourceProvenanceCount, 500);
  assert.equal(evidence.frozenSampleDigestSha256, "5d30214e9c0d4127d9c1ce62cff428a1c0621258051d9adecb8a4340ce983408");
  assert.equal(evidence.membershipQueryCount, 6);
  assert.equal(evidence.maxFrozenIdChunkSize, 90);
  assert.equal(evidence.maxObservedD1Subqueries, 8);
  assert.equal(evidence.protectedBodyReads, 0);
  assert.equal(evidence.rowsWritten, 0);
  assert.equal(evidence.fullCorpusScans, 0);
  assert.equal(evidence.publicRuntimeChanged, false);
  assert.equal(evidence.recommendationAdmissionChanged, false);
});

test("P2 terminal evidence preserves authority firewalls", () => {
  assert.deepEqual(evidence.authority, {
    protectedBrowseOnly:true,
    publicRuntimeWidening:false,
    recommendationAdmission:false,
    protectedBodyRewrite:false,
    thirdShard:false,
    paidInfrastructure:false,
    knowledgeCoreWrite:false,
    barbecueMutation:false
  });
});
