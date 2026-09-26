import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  buildBarbecueQueryPortfolio,
  evaluateLeafCompletion,
  validateBarbecueConfig,
  validateBarbecueState
} from "../scripts/barbecue-technique-corpus-control-plane.mjs";

const packet = JSON.parse(await readFile(
  new URL("../config/barbecue_technique_corpus_poultry_synthesis_2026_09_26.json", import.meta.url),
  "utf8"
));
const state = JSON.parse(await readFile(
  new URL("../data/generated/barbecue-technique-corpus-state.json", import.meta.url),
  "utf8"
));
const config = validateBarbecueConfig(JSON.parse(await readFile(
  new URL("../config/barbecue_technique_corpus_v1.json", import.meta.url),
  "utf8"
)));

const forbiddenKeys = new Set(["transcript","recipeProse","creatorInstructions","image","images","audio","video","rawPayload","rawYoutubePayload"]);

function collectForbidden(value, path = "$", out = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbidden(entry, `${path}[${index}]`, out));
    return out;
  }
  if (!value || typeof value !== "object") return out;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) out.push(`${path}.${key}`);
    collectForbidden(nested, `${path}.${key}`, out);
  }
  return out;
}

test("poultry synthesis packet is zero-search, no-write and source-complete", () => {
  assert.equal(packet.synthesisId, "BARBECUE_POULTRY_SYNTHESIS_2026_09_26_V1");
  assert.equal(packet.leafId, "poultry_chicken_competition");
  assert.equal(packet.authority.youtubeSearchCalls, 0);
  assert.equal(packet.authority.protectedD1Reads, 0);
  assert.equal(packet.authority.protectedD1Writes, 0);
  assert.equal(packet.authority.protectedRecipeBodyAccess, 0);
  assert.equal(packet.authority.knowledgeCoreWrites, 0);
  assert.equal(packet.authority.automaticPublicationAuthorized, false);
  assert.equal(packet.sourceObservations.length, 6);
  assert.equal(new Set(packet.sourceObservations.map(row => row.independenceKey)).size, 6);
  assert.deepEqual(collectForbidden(packet), []);
});

test("all six qualified poultry sources have bounded normalized observations", () => {
  const poultry = state.leaves.find(leaf => leaf.leafId === packet.leafId);
  assert.ok(poultry);
  assert.equal(poultry.qualifiedSources.length, 6);
  const byKey = new Map(packet.sourceObservations.map(row => [row.independenceKey, row]));
  for (const source of poultry.qualifiedSources) {
    const evidence = byKey.get(source.independenceKey);
    assert.ok(evidence, source.independenceKey);
    assert.deepEqual(source.normalizedObservations, evidence.normalizedObservations);
    assert.ok(Array.isArray(source.normalizedObservations.sourceEvidenceRefs));
    assert.ok(source.normalizedObservations.sourceEvidenceRefs.length >= 1);
  }
  const lowResolution = poultry.qualifiedSources.find(row => row.independenceKey === "roel-westra-pitmaster-x");
  assert.equal(lowResolution.normalizedObservations.detailLevel, "LOW_RESOLUTION");
  assert.equal(lowResolution.normalizedObservations.numericTechniqueExtracted, false);
});

test("USDA safety firewall overrides practitioner endpoints below the poultry minimum", () => {
  assert.equal(packet.safety.authority, "USDA_FSIS");
  assert.equal(packet.safety.normalizedConstraints.minimumInternalTemperatureF, 165);
  assert.equal(packet.safety.normalizedConstraints.minimumInternalTemperatureC, 73.9);
  assert.ok(packet.safety.authorityRefs.length >= 2);
  assert.equal(packet.safety.authorityRefs.every(ref => ref.startsWith("https://www.fsis.usda.gov/")), true);

  const poultry = state.leaves.find(leaf => leaf.leafId === packet.leafId);
  const chefTom = poultry.qualifiedSources.find(row => row.independenceKey === "chef-tom-jackson-atbbq");
  assert.equal(chefTom.normalizedObservations.finish.reportedFinishFApprox, 160);
  assert.match(chefTom.normalizedObservations.finish.safetyDisposition, /USDA_165F_MINIMUM_GOVERNS/);
  assert.equal(poultry.synthesis.adjustmentAxes.time_endpoint.safetyFloorF, 165);
  assert.match(poultry.synthesis.adjustmentAxes.time_endpoint.nonPortableSourceEndpoint.disposition, /USDA_165F_MINIMUM_GOVERNS/);
});

test("poultry earns COMPLETE with structured axes while pilot remains open", () => {
  validateBarbecueState(state, config);
  const poultry = state.leaves.find(leaf => leaf.leafId === packet.leafId);
  assert.equal(poultry.status, "COMPLETE");
  assert.equal(evaluateLeafCompletion(poultry, config), true);
  assert.equal(Object.keys(poultry.synthesis.adjustmentAxes).length, config.adjustmentAxes.length);
  assert.equal(poultry.synthesis.completionBasis.prohibitedDurableContentRetained, false);
  assert.equal(state.pilotPass, false);
  assert.equal(state.programmeStatus, "ACTIVE_BOUNDED_DISCOVERY");

  const plannedLeaves = new Set(buildBarbecueQueryPortfolio(config, state).map(row => row.leafId));
  assert.equal(plannedLeaves.has(packet.leafId), false);
  for (const id of ["beef_brisket_competition","pork_ribs_competition","fish_parrilla","vegetables_parrilla"]) {
    assert.equal(plannedLeaves.has(id), true, id);
  }
});
