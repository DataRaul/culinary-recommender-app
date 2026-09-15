import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const readJson = async path => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const writeJson = async (path, value) => {
  const full = resolve(ROOT, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const replaceOrThrow = (text, from, to, label) => {
  if (!text.includes(from)) throw new Error(`closeout replacement not found: ${label}`);
  return text.replace(from, to);
};
const patchFile = async (path, patches) => {
  const full = resolve(ROOT, path);
  let text = await readFile(full, "utf8");
  for (const [from, to, label] of patches) text = replaceOrThrow(text, from, to, `${path}:${label}`);
  await writeFile(full, text, "utf8");
};

const activation = Object.freeze({
  date: "2026-09-15",
  terminal: "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED",
  recipeId: "unitools_tortilla_espanola",
  familyId: "spanish_potato_omelet",
  implementationPr: 160,
  mergeSha: "0848d51d8a0c58cccee84c8a9ffe6108232e9639",
  prValidationRun: 34958188189,
  prerequisiteRun: 34958188244,
  postMergeValidationRun: 34958332756,
  cloudflareDeploymentId: "468b1c6b-2e75-4d26-9979-cebc53ca1369",
  publicCountBefore: 84,
  publicCountAfter: 85,
  goldenCorpusCount: 84
});

const roadmapPath = "config/corpus_scale_step8_roadmap.json";
const roadmap = await readJson(roadmapPath);
roadmap.status = "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PASS__8G_V8003_LIVE_PASS_CONTINUING";
for (const ref of [
  "docs/CORPUS_SCALE_STEP8F_PUBLIC_RUNTIME_ACTIVATION_PASS.md",
  "data/generated/step8f/public-runtime-activation-pass.json",
  "tests/corpus-scale-step8f-activation.test.js",
  "tests/corpus-scale-step8f-activation-closeout.test.js"
]) if (!roadmap.evidenceBasis.includes(ref)) roadmap.evidenceBasis.push(ref);

const gate8f = roadmap.gates.find(gate => gate.id === "8F");
if (!gate8f) throw new Error("Step 8F gate missing");
gate8f.status = "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED";
gate8f.terminal = activation.terminal;
gate8f.parked = false;
gate8f.blockingActiveLane = false;
gate8f.resumeOnlyOnExplicitOwnerRequest = false;
gate8f.decisionInput.candidatePresentInPublicCorpus = true;
gate8f.decisionInput.runtimeActivationAuthorized = true;
gate8f.decisionInput.publicRuntimeChanged = true;
gate8f.decisionInput.publicCorpusRecipeCountAfterDecision = activation.publicCountAfter;
gate8f.humanAuthorization = {
  authorized: true,
  date: activation.date,
  scope: [activation.recipeId],
  scopeExact: true,
  authorizationSource: "OWNER_EXPLICIT_CHAT_AUTHORIZATION"
};
gate8f.activationEvidence = {
  implementationPr: activation.implementationPr,
  mergeSha: activation.mergeSha,
  prerequisiteRun: activation.prerequisiteRun,
  prValidationRun: activation.prValidationRun,
  postMergeValidationRun: activation.postMergeValidationRun,
  cloudflareDeployment: "PASS",
  cloudflareDeploymentId: activation.cloudflareDeploymentId,
  productionSmoke: "PASS",
  publicRuntimeRecipeCountBefore: activation.publicCountBefore,
  publicRuntimeRecipeCountAfter: activation.publicCountAfter,
  historicalGoldenCorpusCountPreserved: activation.goldenCorpusCount,
  activatedCanonicalRecipeIds: [activation.recipeId],
  broaderAutomaticAdmissionAuthorized: false
};
roadmap.sourceStateCurrent.uniTools = "STEP8D_PROTECTED_POPULATED_501__STEP8E_ONE_RECOMMENDATION_ELIGIBLE__STEP8F_ONE_PUBLIC_ACTIVE__500_STORED_ONLY";
roadmap.currentHumanGate = {
  id: "NONE",
  status: "NO_HUMAN_GATE_CURRENTLY_REQUIRED",
  reason: "Step 8F exact one-record public runtime activation passed in production. Step 8G remains independently active at v8003 / 1,642 protected recipes; no broader recommendation admission is authorized.",
  completedGate: activation.terminal,
  completedGateScope: [activation.recipeId],
  nextReservedHumanGate: null
};
await writeJson(roadmapPath, roadmap);

const oldCurrent = await readJson("docs/handovers/CURRENT.json");
await writeJson("docs/handovers/PREVIOUS.json", oldCurrent);
const current = {
  handover: "CULINARY_APP_STEP8F_PUBLIC_ACTIVATION_PASS_STEP8G_V8003_ACTIVE_V27",
  handover_date: activation.date,
  timezone: "Europe/Madrid",
  status: "STEP8A_PASS__STEP8B_PASS__STEP8C_PASS__STEP8D_PASS__STEP8E_PASS__STEP8F_PUBLIC_ACTIVATION_PASS__STEP8G_V8003_LIVE_PASS_ACTIVE",
  human_needed: false,
  handover_written_against_main_sha: activation.mergeSha,
  repositories: {
    primary: "DataRaul/culinary-recommender-app",
    read_only_reconciliation: "DataRaul/knowledge-core",
    source_of_truth: "GitHub",
    step8f_activation_pr: activation.implementationPr,
    step8f_activation_merge: activation.mergeSha,
    step8g_v8003_implementation_pr: 158,
    step8g_v8003_implementation_merge: "254b8694081d8edcddcc8a6164642b5b731c2602"
  },
  handover_protocol: {
    current: "docs/handovers/CURRENT.json",
    previous: "docs/handovers/PREVIOUS.json",
    protocol: "docs/HANDOVER_PROTOCOL.md",
    rule: "GitHub live state outranks this snapshot. Fresh-reconcile main, open PRs, CI and deployments before acting."
  },
  lane: {
    name: "Culinary App / Culinary Lab — Corpus Scale Step 8",
    active_lane: "STEP8G_CONTINUED_PROTECTED_SCALE_EXPANSION",
    completed_public_gate: "STEP8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED",
    knowledge_core: "READ_ONLY",
    nutrition_lane: "SEPARATE_CONCURRENT_LANE_DO_NOT_MUTATE",
    yt_cul_lane: "INDEPENDENT_READ_ONLY_FROM_CORPUS_SCALE"
  },
  operating_contract: {
    autonomy: "Continue Step 8G autonomously through technically resolvable protected-scale work. Step 8F is complete for exactly one public recipe; future public admissions require separately earned eligibility and explicit gate authority.",
    billing_firewall: "Never authorize paid infrastructure or automatic overage. Free exhaustion must fail closed.",
    public_activation: "Only unitools_tortilla_espanola is activated by Step 8F. Do not infer authority to expose any other protected recipe or to enable automatic public admission.",
    source_authority: "Source nutrition, dietary/allergen claims and scaling rules remain non-authoritative unless separately admitted.",
    topology: "Preserve the earned two-shard protected topology unless a later Step 8G gate explicitly earns a change.",
    standing_ci_authority: "Ordinary repository CI, browser acceptance and technically necessary ordinary reruns remain pre-authorized under AGENTS.md."
  },
  canonical_documents: {
    step8_roadmap: roadmapPath,
    step8f_activation_evidence: "data/generated/step8f/public-runtime-activation-pass.json",
    step8f_activation_closeout: "docs/CORPUS_SCALE_STEP8F_PUBLIC_RUNTIME_ACTIVATION_PASS.md",
    step8e_eligible_subset: "data/generated/step8e/eligible-subset.json",
    v8003_live_evidence: "data/generated/step8g/cc0-v8003-live-pass.json",
    v8003_live_closeout: "docs/CORPUS_SCALE_STEP8G_CC0_V8003_LIVE_POPULATION_PASS.md"
  },
  corpus_scale: {
    required_capacity: 170000,
    stress_capacity: 250000,
    step8d: {
      status: "COMPLETE_PASS_LIVE_PRODUCTION",
      terminal: "STEP_8D_PROTECTED_POPULATION_PASS",
      recipe_count: 501,
      verified_batch_count: 51,
      shard_count: 2,
      max_observed_d1_subqueries: 15,
      full_corpus_scans: 0,
      normal_public_recommendation_runtime_changed: false,
      third_shard_used: false,
      billing_expansion: false
    },
    step8e: {
      status: "COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY",
      terminal: "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS",
      reviewed_stored_population: 501,
      eligible_subset_count: 1,
      stored_only_count: 500,
      canonical_recipe_id: activation.recipeId,
      dish_family_id: activation.familyId
    },
    step8f: {
      status: "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED",
      terminal: activation.terminal,
      human_authorization_satisfied: true,
      activated_canonical_recipe_ids: [activation.recipeId],
      exact_activation_scope_count: 1,
      public_runtime_recipe_count_before: activation.publicCountBefore,
      public_runtime_recipe_count_after: activation.publicCountAfter,
      historical_golden_corpus_recipe_count: activation.goldenCorpusCount,
      runtime_activation_authorized: true,
      public_runtime_changed: true,
      automatic_broader_admission_authorized: false,
      implementation_pr: activation.implementationPr,
      merge_sha: activation.mergeSha,
      prerequisite_run: activation.prerequisiteRun,
      pr_validation_run: activation.prValidationRun,
      post_merge_validation_run: activation.postMergeValidationRun,
      cloudflare_deployment: "PASS",
      production_smoke: "PASS"
    },
    step8g: {
      status: "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP",
      depends_on_step8f: false,
      public_runtime_change_allowed: false,
      latest_live_terminal: "STEP_8G_CC0_V8003_PROTECTED_POPULATION_PASS",
      source_cohort_id: "SGAUTHIER_RECIPES_CC0_B12E481D",
      parent_corpus_version: "v8002",
      final_protected_active_version: "v8003",
      child_recipe_count: 226,
      parent_recipe_count: 1416,
      composed_recipe_count: 1642,
      shard_count: 2,
      three_layer_hydration_pass: true,
      rollback_pass: true,
      rollback_hydration_fail_closed_pass: true,
      full_corpus_scans: 0,
      max_observed_d1_subqueries: 16,
      third_shard_used: false,
      billing_expansion: false
    }
  },
  completed_human_gate: {
    id: "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION",
    terminal: activation.terminal,
    completed_date: activation.date,
    exact_scope: [activation.recipeId]
  },
  active_human_gate: "NONE",
  next_actions: [
    "Fresh-reconcile main, CI and deployments before new work.",
    "Continue Step 8G bounded protected-scale expansion only when the next rights-clean cohort earns marginal value.",
    "Any additional public recipe must independently earn recommendation eligibility; Step 8F authorizes no automatic or bulk admission beyond unitools_tortilla_espanola.",
    "Preserve the 84-record historical golden benchmark/oracle while the live public runtime remains 85 unless a later explicit baseline-revision gate is earned.",
    "Do not create a third shard, authorize billing, mutate Nutrition/YT-CUL, or write to Knowledge Core from this lane without separately earned authority."
  ],
  stop_conditions_for_active_work: [
    "A new cost or billing authorization would be required.",
    "A security/account/secrets action requires the owner.",
    "Source rights/provenance are materially unresolved and cannot be settled from documentary evidence.",
    "The earned two-shard topology or quota/capacity boundary is insufficient and expansion would require a new human/cost gate.",
    "A genuine unrecoverable error occurs.",
    "170k required protected capacity is reached or marginal value becomes too low under the Step 8G contract."
  ],
  terminal_instruction_for_new_chat: "Continue from docs/handovers/CURRENT.json and fresh-reconcile live GitHub. Step 8F is terminal PASS: exactly unitools_tortilla_espanola is active in the 85-recipe public runtime while the historical 84-recipe golden corpus remains frozen. Step 8G v8003 remains active at 1,642 protected recipes on two shards. Do not infer broader public-admission authority from the Step 8F canary."
};
await writeJson("docs/handovers/CURRENT.json", current);

const evidence = {
  schema: "CORPUS_SCALE_STEP8F_PUBLIC_RUNTIME_ACTIVATION_PASS_V1",
  evidenceClass: "OWNER_AUTHORIZATION_PLUS_MERGED_IMPLEMENTATION_PLUS_PRODUCTION_SMOKE",
  date: activation.date,
  pass: true,
  terminal: activation.terminal,
  ownerAuthorization: { authorized: true, scope: [activation.recipeId], scopeExact: true },
  candidate: { canonicalRecipeId: activation.recipeId, dishFamilyId: activation.familyId, licenseId: "CC-BY-SA-4.0" },
  publicRuntime: {
    recipeCountBefore: activation.publicCountBefore,
    recipeCountAfter: activation.publicCountAfter,
    externalCountAfter: 9,
    historicalGoldenCorpusCountPreserved: activation.goldenCorpusCount,
    activatedCandidatePresent: true,
    ordinaryRankingPass: true,
    plannerPass: true,
    ingredientSearchPass: true,
    hardAllergenPass: true,
    hardDietaryPass: true,
    permanentExclusionPass: true,
    explicitV1DirectVsV2ParityPass: true,
    attributionLicenseFirewallPass: true,
    sourceNutritionAuthorityImported: false
  },
  implementation: {
    pr: activation.implementationPr,
    mergeSha: activation.mergeSha,
    prerequisiteRun: activation.prerequisiteRun,
    prValidationRun: activation.prValidationRun,
    postMergeValidationRun: activation.postMergeValidationRun,
    cloudflareDeployment: "PASS",
    cloudflareDeploymentId: activation.cloudflareDeploymentId,
    productionSmoke: "PASS"
  },
  boundaries: {
    automaticBroaderRecommendationAdmissionAuthorized: false,
    additionalProtectedRecipesActivated: 0,
    protectedCorpusActiveVersion: "v8003",
    protectedCorpusRecipeCount: 1642,
    protectedShardCount: 2,
    thirdShardUsed: false,
    billingExpansion: false,
    nutritionLaneModified: false,
    youtubeCulinaryStateModified: false,
    knowledgeCoreWritePerformed: false
  }
};
await writeJson("data/generated/step8f/public-runtime-activation-pass.json", evidence);

await writeFile(resolve(ROOT, "docs/CORPUS_SCALE_STEP8F_PUBLIC_RUNTIME_ACTIVATION_PASS.md"), `# Corpus Scale Step 8F — public runtime activation PASS\n\nDate: 2026-09-15\n\nTerminal: \`STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED\`\n\nThe owner explicitly authorized the exact Step 8E one-record subset and PR #160 activated only \`unitools_tortilla_espanola\`. PR validation, browser acceptance, Cloudflare deployment and the post-merge production smoke all passed.\n\n## Public result\n\n- Live public runtime: **84 → 85 recipes**.\n- Public external records: **8 → 9**.\n- Activated record: \`unitools_tortilla_espanola\` only.\n- Historical \`ALL_RECIPES\` benchmark/oracle: **84 and unchanged**.\n- The activated record can participate in ordinary ranking, planning and ingredient search.\n- Egg-allergen, vegan, permanent-exclusion, time and skill hard filters remain enforced.\n- UniTools attribution and CC-BY-SA-4.0 provenance remain visible.\n- Source nutrition remains non-authoritative and unavailable unless separately calculated by the reviewed Nutrition lane.\n\n## Boundaries preserved\n\n- No automatic or bulk recommendation admission is authorized.\n- The other protected/stored-only records remain non-public.\n- Step 8G protected corpus remains v8003 with 1,642 recipes on two shards.\n- No third shard and no billing expansion.\n- Nutrition and YouTube Culinary lanes are unchanged.\n- Knowledge Core remains read-only from this lane.\n\nCanonical evidence: \`data/generated/step8f/public-runtime-activation-pass.json\`.\n`, "utf8");

const builderPath = "scripts/build-corpus-scale-step8g-roadmap-state.mjs";
await writeFile(resolve(ROOT, builderPath), `import { mkdir, readFile, writeFile } from "node:fs/promises";\nimport { dirname, resolve } from "node:path";\n\nfunction parseArgs(argv) {\n  const options = {\n    input: "config/corpus_scale_step8_roadmap.json",\n    output: ".tmp/step8g-forkrecipe-prewrite/corpus_scale_step8_roadmap.next.json"\n  };\n  for (const arg of argv) {\n    if (arg.startsWith("--input=")) options.input = arg.slice("--input=".length);\n    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length);\n  }\n  return options;\n}\n\nexport function reconcileStep8GRoadmapState(roadmap) {\n  const next = structuredClone(roadmap);\n  const gate8f = next.gates.find(gate => gate.id === "8F");\n  const gate8g = next.gates.find(gate => gate.id === "8G");\n  if (!gate8f) throw new Error("Step 8F gate missing from roadmap");\n  if (!gate8g) throw new Error("Step 8G gate missing from roadmap");\n\n  const step8fComplete = gate8f.terminal === "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED"\n    && gate8f.decisionInput?.runtimeActivationAuthorized === true\n    && gate8f.decisionInput?.publicRuntimeChanged === true;\n\n  next.status = step8fComplete\n    ? "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PASS__8G_ACTIVE"\n    : "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PARKED__8G_ACTIVE";\n\n  for (const ref of [\n    "docs/CORPUS_SCALE_STEP8G_PROTECTED_SCALE_LOOP.md",\n    "docs/CORPUS_SCALE_STEP8G_FORKRECIPE_PREWRITE.md",\n    "data/generated/step8g/forkrecipe-prewrite-evidence.json"\n  ]) if (!next.evidenceBasis.includes(ref)) next.evidenceBasis.push(ref);\n\n  if (!step8fComplete) {\n    gate8f.status = "PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION";\n    gate8f.parked = true;\n    gate8f.blockingActiveLane = false;\n    gate8f.resumeOnlyOnExplicitOwnerRequest = true;\n    gate8f.decisionInput.runtimeActivationAuthorized = false;\n    gate8f.decisionInput.publicRuntimeChanged = false;\n  }\n\n  gate8g.status = "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP";\n  gate8g.humanRequired = false;\n  gate8g.publicRuntimeChangeAllowed = false;\n\n  next.currentHumanGate = step8fComplete ? {\n    id: "NONE",\n    status: "NO_HUMAN_GATE_CURRENTLY_REQUIRED",\n    reason: "Step 8F exact one-record public activation is complete. Step 8G remains independently active and must not infer broader public-admission authority.",\n    completedGate: "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED"\n  } : {\n    id: "NONE",\n    status: "NO_HUMAN_GATE_CURRENTLY_REQUIRED",\n    reason: "Step 8F is intentionally parked and non-blocking while Step 8G protected-scale work remains available.",\n    nextReservedHumanGate: "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION",\n    parkedGateStatus: "PARKED_NOT_AUTHORIZED",\n    resumeOnlyOnExplicitOwnerRequest: true\n  };\n  return next;\n}\n\nconst args = parseArgs(process.argv.slice(2));\nconst input = JSON.parse(await readFile(resolve(args.input), "utf8"));\nconst output = reconcileStep8GRoadmapState(input);\nawait mkdir(dirname(resolve(args.output)), { recursive: true });\nawait writeFile(resolve(args.output), \`${'${JSON.stringify(output, null, 2)}'}\\n\`, "utf8");\nprocess.stdout.write(\`${'${JSON.stringify({ status: output.status, gate8f: output.gates.find(gate => gate.id === "8F").status, gate8g: output.gates.find(gate => gate.id === "8G").status, currentHumanGate: output.currentHumanGate.id, latestIteration: output.gates.find(gate => gate.id === "8G").latestIteration?.layerVersion ?? null }, null, 2)}'}\\n\`);\n`, "utf8");

await patchFile("tests/step8d-terminal-closeout.test.js", [
  ["assert.equal(gates.get(\"8F\").status, \"PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION\");", "assert.equal(gates.get(\"8F\").status, \"COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED\");", "8f status"],
  ["assert.equal(gates.get(\"8F\").decisionInput.runtimeActivationAuthorized, false);", "assert.equal(gates.get(\"8F\").decisionInput.runtimeActivationAuthorized, true);", "8f auth"],
  ["test(\"canonical handover preserves Step 8D while parking 8F and activating 8G\", () => {", "test(\"canonical handover preserves Step 8D while completed 8F coexists with active 8G\", () => {", "test title"],
  ["assert.equal(current.corpus_scale.step8f.status, \"PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_GATE\");", "assert.equal(current.corpus_scale.step8f.status, \"COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED\");", "handover status"],
  ["assert.equal(current.corpus_scale.step8f.runtime_activation_authorized, false);", "assert.equal(current.corpus_scale.step8f.runtime_activation_authorized, true);\n  assert.equal(current.corpus_scale.step8f.public_runtime_changed, true);\n  assert.equal(current.corpus_scale.step8f.public_runtime_recipe_count_after, 85);", "handover auth"]
]);

const step8eOld = `test("Step 8F remains unauthorized while the continuation state parks it and activates Step 8G", () => {\n  assert.equal(gate("8F").status, "PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION");\n  assert.equal(gate("8F").parked, true);\n  assert.equal(gate("8F").blockingActiveLane, false);\n  assert.equal(gate("8F").humanRequired, true);\n  assert.equal(gate("8F").decisionInput.runtimeActivationAuthorized, false);\n  assert.equal(gate("8F").decisionInput.publicRuntimeChanged, false);\n  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountBeforeDecision, 84);\n  assert.equal(gate("8F").decisionInput.candidatePresentInPublicCorpus, false);\n  assert.equal(gate("8G").status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(gate("8G").doesNotDependOn.includes("8F"), true);\n  assert.equal(handover.human_needed, false);\n  assert.equal(handover.parked_human_gate.id, "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION");\n  assert.equal(handover.parked_human_gate.status, "PARKED_NOT_AUTHORIZED");\n  assert.equal(handover.parked_human_gate.blocking_active_lane, false);\n  assert.equal(handover.active_human_gate, "NONE");\n  assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, false);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, false);\n  assert.equal(handover.corpus_scale.step8g.status, "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(handover.corpus_scale.step8g.depends_on_step8f, false);\n  assert.equal(handover.corpus_scale.step8g.public_runtime_change_allowed, false);\n});`;
const step8eNew = `test("Step 8F exact one-record activation is complete while Step 8G remains independently active", () => {\n  assert.equal(gate("8F").status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");\n  assert.equal(gate("8F").terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");\n  assert.equal(gate("8F").parked, false);\n  assert.equal(gate("8F").blockingActiveLane, false);\n  assert.equal(gate("8F").humanRequired, true);\n  assert.equal(gate("8F").decisionInput.runtimeActivationAuthorized, true);\n  assert.equal(gate("8F").decisionInput.publicRuntimeChanged, true);\n  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountBeforeDecision, 84);\n  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountAfterDecision, 85);\n  assert.equal(gate("8F").decisionInput.candidatePresentInPublicCorpus, true);\n  assert.equal(gate("8G").status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(gate("8G").doesNotDependOn.includes("8F"), true);\n  assert.equal(handover.human_needed, false);\n  assert.equal(handover.completed_human_gate.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");\n  assert.equal(handover.active_human_gate, "NONE");\n  assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, true);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, true);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_recipe_count_after, 85);\n  assert.equal(handover.corpus_scale.step8g.status, "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(handover.corpus_scale.step8g.depends_on_step8f, false);\n  assert.equal(handover.corpus_scale.step8g.public_runtime_change_allowed, false);\n});`;
await patchFile("tests/corpus-scale-step8e-closeout.test.js", [[step8eOld, step8eNew, "8f current state block"]]);

const bcOld = `test("Step 8F remains parked and unauthorized while Step 8G is active", () => {\n  const f = gate("8F");\n  const g = gate("8G");\n  assert.equal(f.status, "PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION");\n  assert.equal(f.parked, true);\n  assert.equal(f.blockingActiveLane, false);\n  assert.equal(f.humanRequired, true);\n  assert.equal(f.decisionInput.runtimeActivationAuthorized, false);\n  assert.equal(f.decisionInput.publicRuntimeChanged, false);\n  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(g.doesNotDependOn.includes("8F"), true);\n  assert.equal(g.humanRequired, false);\n  assert.equal(g.publicRuntimeChangeAllowed, false);\n});`;
const bcNew = `test("Step 8F exact public activation is complete while Step 8G remains active", () => {\n  const f = gate("8F");\n  const g = gate("8G");\n  assert.equal(f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");\n  assert.equal(f.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");\n  assert.equal(f.parked, false);\n  assert.equal(f.blockingActiveLane, false);\n  assert.equal(f.humanRequired, true);\n  assert.equal(f.decisionInput.runtimeActivationAuthorized, true);\n  assert.equal(f.decisionInput.publicRuntimeChanged, true);\n  assert.equal(f.decisionInput.publicCorpusRecipeCountAfterDecision, 85);\n  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");\n  assert.equal(g.doesNotDependOn.includes("8F"), true);\n  assert.equal(g.humanRequired, false);\n  assert.equal(g.publicRuntimeChangeAllowed, false);\n});`;
await patchFile("tests/corpus-scale-step8bc-closeout.test.js", [[bcOld, bcNew, "8f current state block"]]);

await patchFile("tests/corpus-scale-step8g-v8003-closeout.test.js", [
  ["test(\"roadmap and current handover point at the v8003 live PASS without reopening Step 8F\", () => {", "test(\"roadmap and current handover keep v8003 live while completed Step 8F stays exact and bounded\", () => {", "title"],
  ["assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, false);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, false);", "assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, true);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, true);\n  assert.equal(handover.corpus_scale.step8f.public_runtime_recipe_count_after, 85);\n  assert.deepEqual(handover.corpus_scale.step8f.activated_canonical_recipe_ids, [\"unitools_tortilla_espanola\"]);", "step8f handover assertions"]
]);

await writeFile(resolve(ROOT, "tests/corpus-scale-step8f-activation-closeout.test.js"), `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { readFileSync } from "node:fs";\nimport { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";\n\nconst roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));\nconst evidence = JSON.parse(readFileSync(new URL("../data/generated/step8f/public-runtime-activation-pass.json", import.meta.url), "utf8"));\nconst current = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));\nconst gate = id => roadmap.gates.find(row => row.id === id);\n\ntest("Step 8F terminal evidence freezes the exact one-record public activation", () => {\n  assert.equal(evidence.pass, true);\n  assert.equal(evidence.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");\n  assert.deepEqual(evidence.ownerAuthorization.scope, ["unitools_tortilla_espanola"]);\n  assert.equal(evidence.publicRuntime.recipeCountBefore, 84);\n  assert.equal(evidence.publicRuntime.recipeCountAfter, 85);\n  assert.equal(evidence.publicRuntime.historicalGoldenCorpusCountPreserved, 84);\n  assert.equal(evidence.implementation.cloudflareDeployment, "PASS");\n  assert.equal(evidence.implementation.productionSmoke, "PASS");\n});\n\ntest("machine roadmap and handover mark 8F complete without broad automatic admission", () => {\n  const f = gate("8F");\n  assert.equal(f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");\n  assert.equal(f.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");\n  assert.equal(f.decisionInput.runtimeActivationAuthorized, true);\n  assert.equal(f.decisionInput.publicRuntimeChanged, true);\n  assert.equal(f.decisionInput.publicCorpusRecipeCountAfterDecision, 85);\n  assert.equal(roadmap.boundaries.automaticPublicRecommendationAdmission, false);\n  assert.equal(current.corpus_scale.step8f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");\n  assert.equal(current.corpus_scale.step8f.automatic_broader_admission_authorized, false);\n  assert.equal(current.active_human_gate, "NONE");\n});\n\ntest("public runtime is 85 while the historical golden corpus remains 84 and Step 8G remains v8003", () => {\n  assert.equal(ALL_RECIPES.length, 84);\n  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);\n  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);\n  assert.equal(gate("8G").latestIteration.finalProtectedActiveVersion, "v8003");\n  assert.equal(gate("8G").latestIteration.composedRecipeCount, 1642);\n  assert.equal(current.corpus_scale.step8g.final_protected_active_version, "v8003");\n  assert.equal(current.corpus_scale.step8g.composed_recipe_count, 1642);\n});\n`, "utf8");

console.log(JSON.stringify({ terminal: activation.terminal, publicRuntime: 85, protectedRuntime: 1642, next: "STEP8G_CONTINUED_PROTECTED_SCALE_EXPANSION" }, null, 2));
