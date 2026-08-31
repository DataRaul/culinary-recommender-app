import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAIN_PUBLIC_POLICY_V1 } from "../src/data/brain-public-policy-v1.js";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(TEST_DIR, "../src");
const POLICY_PATH = path.resolve(SRC_DIR, "data/brain-public-policy-v1.js");

function javascriptFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...javascriptFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(absolute);
  }
  return files;
}

test("Brain public policy is static, provenance-pinned and runtime-private-dependency free", () => {
  assert.equal(BRAIN_PUBLIC_POLICY_V1.schemaVersion, 1);
  assert.equal(BRAIN_PUBLIC_POLICY_V1.status, "CALIBRATION_ONLY_NO_RANKING_CHANGE");
  assert.match(BRAIN_PUBLIC_POLICY_V1.knowledgeCore.commit, /^[0-9a-f]{40}$/);
  assert.equal(BRAIN_PUBLIC_POLICY_V1.knowledgeCore.runtimeDependency, "PROHIBITED");
  assert.equal(BRAIN_PUBLIC_POLICY_V1.knowledgeCore.exportMode, "STATIC_REVIEWED_PUBLIC_SAFE_ONLY");
});

test("Brain policy preserves hard safety before soft culinary reasoning", () => {
  assert.equal(BRAIN_PUBLIC_POLICY_V1.authorityOrder[0], "HARD_SAFETY_AND_DIETARY_CONSTRAINTS");
  assert.ok(BRAIN_PUBLIC_POLICY_V1.hardBoundaries.includes("NEVER_RELAX_ALLERGEN_DIETARY_OR_PERMANENT_EXCLUSION"));
  assert.ok(BRAIN_PUBLIC_POLICY_V1.hardBoundaries.includes("NO_PRIVATE_KNOWLEDGE_CORE_RUNTIME_FETCH"));
});

test("Brain public export remains non-clinical and source-safe", () => {
  const serialized = JSON.stringify(BRAIN_PUBLIC_POLICY_V1);
  assert.match(serialized, /NO_DIAGNOSIS_OR_THERAPEUTIC_DIET_PRESCRIPTION/);
  assert.match(serialized, /NO_INDIVIDUALIZED_SUPPLEMENT_DOSING/);
  assert.match(serialized, /NO_COPYRIGHTED_SOURCE_TEXT_IN_PUBLIC_EXPORT/);
  assert.doesNotMatch(serialized, /https?:\/\//);
});

test("Brain adapter exposes policy metadata but does not authorize ranking changes", () => {
  assert.equal(BRAIN_PUBLIC_POLICY_V1.status, "CALIBRATION_ONLY_NO_RANKING_CHANGE");
  assert.ok(BRAIN_PUBLIC_POLICY_V1.allowedExportClasses.includes("FUNCTIONAL_SUBSTITUTION_METADATA"));
  assert.ok(BRAIN_PUBLIC_POLICY_V1.publicReasoningDimensions.includes("uncertainty"));
});

test("calibration-only Brain artifact is not imported by public runtime code", () => {
  const runtimeFiles = javascriptFiles(SRC_DIR).filter((file) => path.resolve(file) !== POLICY_PATH);
  const accidentalImports = [];
  for (const file of runtimeFiles) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("brain-public-policy-v1")) accidentalImports.push(path.relative(SRC_DIR, file));
  }
  assert.deepEqual(accidentalImports, []);
});
