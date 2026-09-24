import assert from "node:assert/strict";
import test from "node:test";
import {
  addCandidatePointers,
  applySourceQualification,
  buildBarbecueQueryPortfolio,
  createDurableCandidatePointer,
  createInitialBarbecueState,
  evaluateLeafCompletion,
  evaluatePilotPass,
  loadBarbecueConfig,
  refreshBarbecueDiscoveryPhases,
  rejectCandidatePointer,
  selectBarbecueDailyQueries,
  setLeafSynthesis,
  validateBarbecueConfig,
  validateBarbecueState
} from "../scripts/barbecue-technique-corpus-control-plane.mjs";

const config = validateBarbecueConfig(await loadBarbecueConfig());

test("barbecue V1 freezes five conventional leaves across required products and traditions", () => {
  assert.equal(config.pilotLeaves.length, 5);
  assert.deepEqual(new Set(config.pilotLeaves.map(row => row.product)), new Set(["poultry","beef","pork","fish_seafood","vegetables"]));
  assert.ok(new Set(config.pilotLeaves.map(row => row.tradition)).size >= 2);
  assert.equal(config.requiredQualifiedIndependentSourcesPerLeaf, 5);
  assert.equal(config.dailySearchBudget, 16);
  assert.equal(config.routineProviderSearchCapacity, 90);
  assert.ok(config.minYoutubeRequestIntervalMs >= 1000);
  assert.equal(config.queryClassOrder[0], "WORLD_CHAMPION_DISCOVERY");
});

test("excluded underground and fire-pit scope fails closed", () => {
  const unsafe = structuredClone(config);
  unsafe.pilotLeaves[0].method = "UNDERGROUND_FIRE_PIT";
  assert.throws(() => validateBarbecueConfig(unsafe), /excluded fire-cooking scope/);
});

test("championship discovery precedes specialist fallback", () => {
  let state = createInitialBarbecueState(config);
  const initial = buildBarbecueQueryPortfolio(config, state);
  assert.ok(initial.length > 0);
  assert.equal(initial.some(row => row.queryClass === "SPECIALIST_FALLBACK_DISCOVERY"), false);
  assert.equal(initial.every(row => ["WORLD_CHAMPION_DISCOVERY","COMPETITION_CHAMPION_DISCOVERY"].includes(row.queryClass)), true);

  state = structuredClone(state);
  state.leaves[0].championshipSearchExhausted = true;
  state = validateBarbecueState(state, config);
  const next = buildBarbecueQueryPortfolio(config, state).filter(row => row.leafId === state.leaves[0].leafId);
  assert.ok(next.length > 0);
  assert.equal(next.every(row => row.queryClass === "SPECIALIST_FALLBACK_DISCOVERY"), true);
});

test("daily selection remains bounded and distributes across pilot leaves", () => {
  const state = createInitialBarbecueState(config);
  const selected = selectBarbecueDailyQueries(config, state, []);
  assert.ok(selected.length > 0);
  assert.ok(selected.length <= config.dailySearchBudget);
  assert.ok(new Set(selected.map(row => row.leafId)).size >= 5);
  assert.equal(selected[0].queryClass, "WORLD_CHAMPION_DISCOVERY");
});

test("durable candidate pointer strips raw title and description", () => {
  const state = createInitialBarbecueState(config);
  const query = buildBarbecueQueryPortfolio(config, state)[0];
  const pointer = createDurableCandidatePointer({
    id: { videoId: "abc123" },
    snippet: { channelId: "channel123", title: "World champion example", description: "raw prose" }
  }, query, "2026-09-24");
  assert.ok(pointer);
  assert.equal(pointer.youtubeVideoRef, "abc123");
  assert.equal(pointer.creatorChannelRef, "channel123");
  assert.equal("title" in pointer, false);
  assert.equal("description" in pointer, false);
  assert.equal(pointer.automaticQualificationAuthorized, false);
});

test("title wording alone cannot qualify a source and independence is enforced", () => {
  let state = createInitialBarbecueState(config);
  const leaf = state.leaves[0];
  const query = buildBarbecueQueryPortfolio(config, state).find(row => row.leafId === leaf.leafId);
  const pointer = createDurableCandidatePointer({ id: { videoId: "v1" }, snippet: { channelId: "c1" } }, query, "2026-09-24");
  state = addCandidatePointers(state, config, [pointer]);

  assert.throws(() => applySourceQualification(state, config, leaf.leafId, pointer.sourceRef, {
    independenceKey: "person-1",
    projectAuthoredRationale: "Title says champion but no independent evidence."
  }), /title wording alone cannot qualify/);

  state = applySourceQualification(state, config, leaf.leafId, pointer.sourceRef, {
    independenceKey: "person-1",
    credentialEvidenceRef: "https://example.org/competition/result-1",
    projectAuthoredRationale: "Independent competition result verifies relevant credential.",
    normalizedObservations: { heatApproach: "indirect then finish" }
  });
  assert.equal(state.leaves[0].qualifiedSources.length, 1);

  const pointer2 = createDurableCandidatePointer({ id: { videoId: "v2" }, snippet: { channelId: "c2" } }, query, "2026-09-24");
  state = addCandidatePointers(state, config, [pointer2]);
  assert.throws(() => applySourceQualification(state, config, leaf.leafId, pointer2.sourceRef, {
    independenceKey: "person-1",
    credentialEvidenceRef: "https://example.org/competition/result-2",
    projectAuthoredRationale: "Same independent person should not count twice."
  }), /independence key already used/);
});

function synthesisFor(leafId) {
  return {
    projectAuthored: true,
    leafId,
    safetyAuthorityRefs: ["https://example.org/food-safety-authority"],
    adjustmentAxes: Object.fromEntries(config.adjustmentAxes.slice(0, 8).map(axis => [axis, { alternatives: ["A","B"] }]))
  };
}

test("successful query ids are not selected twice and fallback waits for championship review", () => {
  let state = createInitialBarbecueState(config);
  const firstPortfolio = buildBarbecueQueryPortfolio(config, state);
  const target = state.leaves[0];
  const championQueries = firstPortfolio.filter(row => row.leafId === target.leafId);
  state.usedQueryIds = championQueries.map(row => row.queryId);
  const firstCandidate = createDurableCandidatePointer(
    { id: { videoId: "review-me" }, snippet: { channelId: "review-channel" } },
    championQueries[0],
    "2026-09-24"
  );
  state = addCandidatePointers(state, config, [firstCandidate]);
  state = refreshBarbecueDiscoveryPhases(state, config);
  assert.equal(state.leaves[0].championshipSearchExhausted, false);
  assert.equal(buildBarbecueQueryPortfolio(config, state).filter(row => row.leafId === target.leafId).length, 0);

  state = rejectCandidatePointer(state, config, target.leafId, firstCandidate.sourceRef, {
    projectAuthoredRationale: "Independent credential review did not verify championship or sufficient domain competence."
  });
  assert.equal(state.leaves[0].championshipSearchExhausted, true);
  const fallback = buildBarbecueQueryPortfolio(config, state).filter(row => row.leafId === target.leafId);
  assert.ok(fallback.length > 0);
  assert.equal(fallback.every(row => row.queryClass === "SPECIALIST_FALLBACK_DISCOVERY"), true);

  state.usedQueryIds.push(fallback[0].queryId);
  const selected = selectBarbecueDailyQueries(config, state);
  assert.equal(selected.some(row => row.queryId === fallback[0].queryId), false);
});

test("five independent qualified sources plus safety-backed synthesis are required per leaf", () => {
  let state = createInitialBarbecueState(config);
  const leaf = state.leaves[0];
  const query = buildBarbecueQueryPortfolio(config, state).find(row => row.leafId === leaf.leafId);
  for (let i = 1; i <= 5; i++) {
    const pointer = createDurableCandidatePointer({ id: { videoId: `v${i}` }, snippet: { channelId: `c${i}` } }, query, "2026-09-24");
    state = addCandidatePointers(state, config, [pointer]);
    state = applySourceQualification(state, config, leaf.leafId, pointer.sourceRef, {
      independenceKey: `qualified-person-${i}`,
      domainCompetenceEvidenceRef: `https://example.org/expert/${i}`,
      projectAuthoredRationale: `Independent domain competence evidence ${i}.`,
      normalizedObservations: { endpoint: `observation-${i}` }
    });
    if (i < 5) assert.equal(evaluateLeafCompletion(state.leaves[0], config), false);
  }
  assert.throws(() => setLeafSynthesis(state, config, leaf.leafId, {
    projectAuthored: true,
    adjustmentAxes: synthesisFor(leaf.leafId).adjustmentAxes
  }), /safety-authority references/);
  state = setLeafSynthesis(state, config, leaf.leafId, synthesisFor(leaf.leafId));
  assert.equal(state.leaves[0].status, "COMPLETE");
  assert.equal(evaluateLeafCompletion(state.leaves[0], config), true);
  assert.equal(evaluatePilotPass(state, config), false);
});

test("pilot PASS requires all five completed leaves", () => {
  let state = createInitialBarbecueState(config);
  for (const leaf of [...state.leaves]) {
    const query = buildBarbecueQueryPortfolio(config, state).find(row => row.leafId === leaf.leafId);
    for (let i = 1; i <= 5; i++) {
      const pointer = createDurableCandidatePointer({ id: { videoId: `${leaf.leafId}-v${i}` }, snippet: { channelId: `${leaf.leafId}-c${i}` } }, query, "2026-09-24");
      state = addCandidatePointers(state, config, [pointer]);
      state = applySourceQualification(state, config, leaf.leafId, pointer.sourceRef, {
        independenceKey: `${leaf.leafId}-person-${i}`,
        credentialEvidenceRef: `https://example.org/credential/${leaf.leafId}/${i}`,
        projectAuthoredRationale: "Independent qualification evidence.",
        normalizedObservations: { normalized: true }
      });
    }
    state = setLeafSynthesis(state, config, leaf.leafId, synthesisFor(leaf.leafId));
  }
  assert.equal(evaluatePilotPass(state, config), true);
  assert.equal(state.pilotPass, true);
  assert.equal(state.programmeStatus, "BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS");
});
