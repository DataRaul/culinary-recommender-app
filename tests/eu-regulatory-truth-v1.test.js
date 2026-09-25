import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { EU_REGULATORY_EVIDENCE_SOURCES_V1 } from "../src/data/eu-regulatory-evidence-sources-v1.js";

const config = JSON.parse(
  await readFile(new URL("../config/eu_regulatory_truth_v1.json", import.meta.url), "utf8")
);

test("EU regulatory Lane 3 contract is zero-D1 and behavior-isolated", () => {
  assert.equal(config.id, "EU_REGULATORY_TRUTH_SCAFFOLD_V1");
  assert.equal(config.lane, "LANE_3");
  assert.equal(config.nextGate, "EU_REGULATORY_TRUTH_SCAFFOLD_V1_PASS");
  assert.equal(config.boundaries.protectedD1Reads, 0);
  assert.equal(config.boundaries.protectedD1Writes, 0);
  assert.equal(config.boundaries.recommendationAuthorityChanges, 0);
  assert.equal(config.boundaries.nutritionCompositionAuthorityChanges, 0);
  assert.equal(config.boundaries.publicRuntimeBehaviorChanges, 0);
  assert.equal(config.boundaries.knowledgeCoreWrites, 0);
  assert.equal(config.boundaries.barbecueMutations, 0);
  assert.equal(config.boundaries.paidInfrastructureOrApiChanges, 0);
});

test("EU regulatory source registry is bounded to the seven approved official families", () => {
  const ids = EU_REGULATORY_EVIDENCE_SOURCES_V1.map(entry => entry.id);
  assert.deepEqual(ids, config.requiredSourceIds);
  assert.equal(ids.length, config.gateRequirements.officialSourceFamilies);

  const allowedHosts = new Set(["www.efsa.europa.eu", "food.ec.europa.eu", "eur-lex.europa.eu"]);
  for (const entry of EU_REGULATORY_EVIDENCE_SOURCES_V1) {
    assert.ok(entry.authority);
    assert.ok(entry.sourceRole);
    assert.ok(entry.legalWeight);
    assert.equal(entry.checkedAt, "2026-09-25");
    assert.equal(entry.currentnessPolicy, "REVERIFY_OFFICIAL_SOURCE_BEFORE_SUBSTANTIVE_USE");
    assert.equal(entry.runtimeFetch, false);
    assert.equal(entry.datasetImport, false);
    assert.equal(entry.appBehaviorAuthority, false);
    assert.equal(entry.recommendationAuthority, false);
    assert.equal(entry.nutritionCompositionAuthority, false);
    assert.ok(allowedHosts.has(new URL(entry.canonicalUrl).hostname));

    if (entry.sourceRole.includes("INFORMATIONAL")) {
      assert.ok(entry.controllingLegalSource, `${entry.id} must preserve its controlling-law boundary`);
    }
  }
});

async function jsFilesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await jsFilesUnder(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

test("regulatory registry is not imported by application runtime source", async () => {
  const srcRoot = fileURLToPath(new URL("../src/", import.meta.url));
  const registryPath = fileURLToPath(new URL("../src/data/eu-regulatory-evidence-sources-v1.js", import.meta.url));
  const references = [];

  for (const file of await jsFilesUnder(srcRoot)) {
    if (path.resolve(file) === path.resolve(registryPath)) continue;
    const content = await readFile(file, "utf8");
    if (content.includes("eu-regulatory-evidence-sources-v1")) references.push(path.relative(srcRoot, file));
  }

  assert.deepEqual(references, []);
});
