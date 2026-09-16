import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_MAIN_SHA = "6bbbe1180b226772f1c1cae548e462e2f97ceaf4";
const TARGET_HANDOVER = "CULINARY_APP_STEP8G_TURABI_V8006_PREWRITE_PASS_IMPLEMENTATION_EARNED_V35";
const PREWRITE_RUN = 35066583080;
const PREWRITE_ARTIFACT = 10434820998;
const PREWRITE_DIGEST = "sha256:ead63fabbff3ed6d28be0b66488bbb0c4e6f077206faad4b56c6dd1ecf45b97c";
const PARENT_FINGERPRINT = "6a5c0a427b25e8b0592f48f7b293a6cd6f39fa06b12d141ce60bf284d92a036c";
const MANIFEST_SHA = "3ac76c7f8f107eaf811167e8245582e30204715d7b45a83eade26ae418f765db";
const PLAN_SHA = "b6dd9020fb6221a72c245feb2dd94d9b5ebe8bb758bd25ee508c9031fe5b59a0";

function parseArgs(argv) {
  const args = { output: ".tmp/step8g-ora-turabi-v8006-finalized" };
  for (const arg of argv) {
    if (arg.startsWith("--out=")) args.output = arg.slice(6) || args.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function addUnique(array, values) {
  const set = new Set(Array.isArray(array) ? array : []);
  for (const value of values) set.add(value);
  return [...set];
}

function replacePropertyRecursive(value, key, replacement) {
  if (!value || typeof value !== "object") return;
  if (Object.prototype.hasOwnProperty.call(value, key)) value[key] = replacement;
  for (const child of Object.values(value)) replacePropertyRecursive(child, key, replacement);
}

async function writeCanonicalSnapshot(out, roadmap, current, previous) {
  await mkdir(resolve(out, "config"), { recursive: true });
  await mkdir(resolve(out, "docs/handovers"), { recursive: true });
  await Promise.all([
    writeFile(resolve(out, "config/corpus_scale_step8_roadmap.json"), `${JSON.stringify(roadmap, null, 2)}\n`, "utf8"),
    writeFile(resolve(out, "docs/handovers/CURRENT.json"), `${JSON.stringify(current, null, 2)}\n`, "utf8"),
    writeFile(resolve(out, "docs/handovers/PREVIOUS.json"), `${JSON.stringify(previous, null, 2)}\n`, "utf8")
  ]);
}

const args = parseArgs(process.argv.slice(2));
const [roadmap, current, existingPrevious] = await Promise.all([
  readFile(resolve("config/corpus_scale_step8_roadmap.json"), "utf8").then(JSON.parse),
  readFile(resolve("docs/handovers/CURRENT.json"), "utf8").then(JSON.parse),
  readFile(resolve("docs/handovers/PREVIOUS.json"), "utf8").then(JSON.parse)
]);

// This finalizer belongs to the historical no-write prewrite gate. Once the
// repository has legitimately advanced to the merged/deployed v8006 runtime
// (or beyond), rerunning this workflow must validate the frozen evidence
// without rolling canonical roadmap/handover state backward to V35.
const advancedV8006State =
  current?.v8006?.implementation === "MERGED_DEPLOYED_VERIFIED" ||
  current?.live_protected_state?.active_version === "v8006" ||
  current?.active_human_gate?.id === "STEP8G_V8006_OWNER_AUTHENTICATED_PROTECTED_POPULATION";

if (advancedV8006State) {
  await writeCanonicalSnapshot(args.output, roadmap, current, existingPrevious);
  process.stdout.write(JSON.stringify({
    pass: true,
    mode: "ADVANCED_V8006_STATE_PRESERVED",
    handover: current.handover,
    implementation: current?.v8006?.implementation || null,
    liveActiveVersion: current?.live_protected_state?.active_version || null
  }, null, 2) + "\n");
  process.exit(0);
}

roadmap.status = "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PASS__8G_V8005_LIVE__TURABI_V8006_PREWRITE_PASS_IMPLEMENTATION_EARNED";
roadmap.evidenceBasis = addUnique(roadmap.evidenceBasis, [
  "docs/CORPUS_SCALE_STEP8G_ORA_TURABI_V8006_PREWRITE.md",
  "data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json",
  "data/generated/step8g/ora-turabi-v8006-prewrite-validation.json",
  "tests/corpus-scale-step8g-v8006-prewrite-closeout.test.js"
]);

const gate8g = Array.isArray(roadmap.gates) ? roadmap.gates.find(row => row.id === "8G") : null;
if (!gate8g) throw new Error("ROADMAP_STEP8G_GATE_REQUIRED");
if (gate8g?.latestIteration?.finalProtectedActiveVersion !== "v8005" || Number(gate8g?.latestIteration?.composedRecipeCount) !== 2464) {
  throw new Error("ROADMAP_LIVE_V8005_BASELINE_REQUIRED");
}
const existingNext = gate8g.nextIteration || {};
gate8g.nextIteration = {
  ...existingNext,
  status: "PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED",
  candidate: "ORA_TURABI_EFENDI_1864_OTTOMAN_SHELF_AE3BD2C",
  sourceRepository: "AdamBouhmad/open-recipe-archive",
  sourceCommit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  licenseId: "public-domain",
  layerVersion: "v8006",
  parentVersion: "v8005",
  prewriteStatus: "PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED",
  prewriteEvidence: "data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json",
  prewriteValidation: "data/generated/step8g/ora-turabi-v8006-prewrite-validation.json",
  prewriteCloseoutDoc: "docs/CORPUS_SCALE_STEP8G_ORA_TURABI_V8006_PREWRITE.md",
  prewriteWorkflowRun: PREWRITE_RUN,
  prewriteArtifactId: PREWRITE_ARTIFACT,
  prewriteArtifactDigest: PREWRITE_DIGEST,
  parentFingerprintSha256: PARENT_FINGERPRINT,
  layerManifestSha256: MANIFEST_SHA,
  populationPlanSha256: PLAN_SHA,
  plannedParentVersion: "v8005",
  plannedParentRecipeCount: 2464,
  plannedChildRecipeCount: 442,
  plannedComposedRecipeCount: 2906,
  shardCount: 2,
  bodyBatchCount: 45,
  routeBatchCount: 45,
  maxRowsPerBatch: 10,
  maxWriteRequestBytes: 16090,
  maxAllowedWriteRequestBytes: 262144,
  maxPlannedD1Subqueries: 16,
  d1BudgetHeadroomAssumed: false,
  implementationEarned: true,
  livePopulationPerformed: false,
  nextAction: "IMPLEMENT_V8006_PROTECTED_POPULATION",
  publicRuntimeChangeAuthorized: false,
  recommendationAdmissionAuthorized: false,
  thirdShardAuthorized: false,
  d1BudgetExpansionAuthorized: false,
  billingExpansionAuthorized: false,
  culturalAuthenticityAuthorityImported: false
};
replacePropertyRecursive(
  roadmap,
  "openRecipeArchiveTurabi1864",
  "STEP8G_V8006_PREWRITE_PASS_IMPLEMENTATION_EARNED__442_CHILD__2906_PLANNED__PUBLIC_DOMAIN__HISTORICAL_LABEL_ONLY__NO_LIVE_WRITE_YET__ZERO_PUBLIC_RECOMMENDATION_ADMISSION"
);
if (roadmap.currentHumanGate) {
  roadmap.currentHumanGate.id = "NONE";
  roadmap.currentHumanGate.status = "NO_HUMAN_GATE_CURRENTLY_REQUIRED";
  roadmap.currentHumanGate.reason = "Step 8G live protected state remains v8005 / 2,464 recipes. The exact 442-record Turabi Efendi 1864 cohort passed measurement and the v8006 no-write prewrite/capacity gate. Repository implementation is earned on the existing two-shard topology, but no live v8006 population has occurred. The route-write ceiling remains exactly 16/16 with zero assumed headroom.";
  roadmap.currentHumanGate.nextReservedHumanGate = null;
}

const previous = current.handover === TARGET_HANDOVER ? structuredClone(existingPrevious) : structuredClone(current);
current.handover = TARGET_HANDOVER;
current.handover_date = "2026-09-16";
current.status = "STEP8A_PASS__STEP8B_PASS__STEP8C_PASS__STEP8D_PASS__STEP8E_PASS__STEP8F_PUBLIC_ACTIVATION_PASS__STEP8G_V8005_LIVE_PASS__TURABI_V8006_PREWRITE_PASS_IMPLEMENTATION_EARNED";
current.human_needed = false;
current.handover_written_against_main_sha = BASE_MAIN_SHA;
current.repositories = {
  ...(current.repositories || {}),
  turabi_measurement_pr: 171,
  turabi_measurement_merge: BASE_MAIN_SHA,
  v8006_prewrite_pr: 172,
  v8006_prewrite_branch: "agent/step8g-turabi-v8006-prewrite"
};
current.operating_contract = {
  ...(current.operating_contract || {}),
  source_authority: "Bosse/Watanna and Turabi are historical public-domain source labels only. No cultural-authenticity, ontology, dietary, allergen, nutrition or scaling authority is imported.",
  d1_budget: "Fresh route writes remain exactly 16/16 D1 subqueries at 10 rows. Zero headroom is assumed; 11-row batches fail closed and no extra D1 query may be added without redesign."
};
current.canonical_documents = {
  ...(current.canonical_documents || {}),
  turabi_measurement: "data/generated/step8g/ora-turabi-1864-measurement.json",
  turabi_measurement_closeout: "docs/CORPUS_SCALE_STEP8G_ORA_TURABI_1864_MEASUREMENT_PASS.md",
  v8006_prewrite_evidence: "data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json",
  v8006_prewrite_validation: "data/generated/step8g/ora-turabi-v8006-prewrite-validation.json",
  v8006_prewrite_closeout: "docs/CORPUS_SCALE_STEP8G_ORA_TURABI_V8006_PREWRITE.md",
  v8006_prewrite_test: "tests/corpus-scale-step8g-v8006-prewrite-closeout.test.js"
};
if (!current.corpus_scale?.step8g || current.corpus_scale.step8g.final_protected_active_version !== "v8005" || Number(current.corpus_scale.step8g.composed_recipe_count) !== 2464) {
  throw new Error("HANDOVER_LIVE_V8005_BASELINE_REQUIRED");
}
current.v8006_prewrite = {
  status: "PASS_IMPLEMENTATION_EARNED_NO_LIVE_WRITE_YET",
  terminal_candidate: "STEP_8G_ORA_TURABI_EFENDI_V8006_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED",
  source_cohort_id: "ORA_TURABI_EFENDI_1864_OTTOMAN_SHELF_AE3BD2C",
  source_repository: "AdamBouhmad/open-recipe-archive",
  source_commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  source_work: "A Turkish Cookery Book",
  source_author: "Turabi Efendi",
  source_year: "1864",
  parent_version: "v8005",
  parent_recipe_count: 2464,
  layer_version: "v8006",
  child_recipe_count: 442,
  planned_composed_recipe_count: 2906,
  shard_count: 2,
  body_batch_count: 45,
  route_batch_count: 45,
  max_rows_per_batch: 10,
  max_write_request_bytes: 16090,
  max_observed_or_planned_d1_subqueries: 16,
  d1_budget_headroom_assumed: false,
  parent_fingerprint_sha256: PARENT_FINGERPRINT,
  layer_manifest_sha256: MANIFEST_SHA,
  population_plan_sha256: PLAN_SHA,
  workflow_run: PREWRITE_RUN,
  artifact_id: PREWRITE_ARTIFACT,
  artifact_digest: PREWRITE_DIGEST,
  implementation_earned: true,
  live_population_performed: false,
  public_runtime_changed: false,
  recommendation_admission_changed: false,
  third_shard_used: false,
  billing_expansion: false,
  cultural_authenticity_authority_imported: false
};
current.active_human_gate = "NONE";
current.next_human_gate = {
  status: "NONE_CURRENTLY",
  reason: "The v8006 prewrite PASS earns repository implementation only. After implementation is merged, deployed and verified, production population will become an owner-authenticated live-write boundary."
};
current.next_actions = [
  "Finish PR #172 by freezing canonical v8006 prewrite evidence, roadmap and handover state, then safely merge after green CI.",
  "Implement the exact Turabi v8006 protected-population path using the frozen 442-record plan and existing two-shard / 16-query envelope.",
  "After implementation merge and deployment verification, stop at the owner-authenticated live v8006 production-write gate.",
  "Do not reopen Step 8F or infer broader public recommendation admission from protected-scale success."
];
current.terminal_instruction_for_new_chat = "Fresh-reconcile GitHub. Live protected state remains v8005 / 2,464 recipes. Turabi Efendi 1864 measurement passed and v8006 prewrite passed for exactly 442 children / 2,906 planned composed recipes on two shards, 45 batches, 10 rows maximum, max request 16,090 bytes and routeWriteFresh exactly 16/16 D1 subqueries with zero assumed headroom. PR #172 is the v8006 prewrite branch; finish/merge it if still open, then implement the exact frozen v8006 protected population. No live v8006 D1 write has occurred. Public runtime remains 85 and Step 8F authority remains exactly unitools_tortilla_espanola. Preserve no billing, no third shard, no Nutrition/YT-CUL/Knowledge Core mutation and no cultural-authenticity authority import. Stop at the later owner-authenticated live production-write gate.";

await writeCanonicalSnapshot(args.output, roadmap, current, previous);

process.stdout.write(JSON.stringify({
  pass: true,
  mode: "PREWRITE_V35_FINALIZED",
  roadmapStatus: roadmap.status,
  latestLiveVersion: gate8g.latestIteration.finalProtectedActiveVersion,
  latestLiveCount: gate8g.latestIteration.composedRecipeCount,
  plannedVersion: gate8g.nextIteration.layerVersion,
  plannedCount: gate8g.nextIteration.plannedComposedRecipeCount,
  handover: current.handover
}, null, 2) + "\n");