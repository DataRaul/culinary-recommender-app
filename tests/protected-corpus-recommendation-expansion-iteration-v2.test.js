import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildIterationV2Summary, resolveIterationV2Identity, validateIterationV2Contract } from "../scripts/protected-corpus-recommendation-expansion-iteration-v2-core.mjs";

const read = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const contract = read("config/protected_corpus_recommendation_expansion_iteration_v2.json");
const aliasContract = read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json");
const committed = read("data/generated/protected-corpus-recommendation-expansion-iteration-v2-summary-v1.json");

test("iteration V2 is candidate-only and preserves all runtime/cost firewalls", () => {
  assert.deepEqual(validateIterationV2Contract(contract), []);
  assert.equal(contract.authority.runtimeActivationAuthorized, false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized, false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(contract.authority.ownerAdmissionGateOpen, false);
  assert.equal(contract.authority.protectedD1WriteAuthorized, false);
  assert.equal(contract.authority.barbecueMutationAuthorized, false);
});

test("V2 reviewed identity mappings stay bounded while ambiguous identities fail closed", () => {
  assert.equal(resolveIterationV2Identity({ id: "greenchili", name: { en: "Green chillies" } }, aliasContract, contract).canonicalIngredientId, "chilli");
  assert.equal(resolveIterationV2Identity({ id: "rice", name: { en: "Red rice" } }, aliasContract, contract).canonicalIngredientId, "rice");
  assert.equal(resolveIterationV2Identity({ id: "chickpeas", name: { en: "Dried chickpeas" } }, aliasContract, contract).canonicalIngredientId, "chickpeas");
  assert.equal(resolveIterationV2Identity({ id: "flour", name: { en: "Flour" } }, aliasContract, contract).status, "UNRESOLVED");
  assert.equal(resolveIterationV2Identity({ id: "pepper", name: { en: "Green pepper" } }, aliasContract, contract).status, "UNRESOLVED");
});

test("committed V2 evidence records one identity-ready candidate and no admission-ready candidate", () => {
  assert.deepEqual(committed.frontier.sourceSlugs, contract.frontier.expectedSourceSlugs);
  assert.equal(committed.identityReview.identityReadySourceSlugs.length, 1);
  assert.deepEqual(committed.identityReview.identityReadySourceSlugs, ["jasha-maroo"]);
  assert.deepEqual(committed.hardSafety.declaredAllergens, []);
  assert.deepEqual(committed.hardSafety.dietaryTags, ["unrestricted"]);
  assert.equal(committed.r3.sourceDeclaredTotalMinutes, 55);
  assert.equal(committed.r3.sourceInstructionMinuteSum, 60);
  assert.equal(committed.r3.runtimeTotalMinutes, null);
  assert.equal(committed.r3.admissionReadyCandidateCount, 0);
  assert.equal(committed.r3.ownerAdmissionGateOpen, false);
  assert.equal(committed.nextGate, "R1_NEXT_FRONTIER_ITERATION_V3");
});

test("exact pinned V2 iteration remains reproducible when source checkout is present", { skip: !existsSync(".tmp/unitools/unitools-recipes-v1.json") }, () => {
  const dataset = JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json", "utf8"));
  assert.deepEqual(buildIterationV2Summary({ contract, aliasContract, dataset }), committed);
});
