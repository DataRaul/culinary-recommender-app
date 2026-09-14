import json
import re
import shutil
from pathlib import Path

root = Path('.')
roadmap_path = root / 'config/corpus_scale_step8_roadmap.json'
roadmap = json.loads(roadmap_path.read_text())
roadmap['status'] = 'STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_EXPLICIT_HUMAN_GATE__8G_READY'
for item in [
    'docs/CORPUS_SCALE_STEP8E_RECOMMENDATION_ELIGIBILITY_PASS.md',
    'data/generated/step8e/admission-evidence.json',
    'data/generated/step8e/eligible-subset.json',
    'tests/corpus-scale-step8f-decision-input.test.js',
    'scripts/browser-step8f-decision-input.mjs'
]:
    if item not in roadmap['evidenceBasis']:
        roadmap['evidenceBasis'].append(item)

gates = {g['id']: g for g in roadmap['gates']}
e = gates['8E']
e['status'] = 'COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY'
e['terminal'] = 'STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS'
e['terminalEvidence'] = {
    'date': '2026-09-14',
    'preflightRun': 34862136962,
    'validationAndBrowserRun': 34862136927,
    'reviewedStoredPopulation': 501,
    'eligibleSubsetCount': 1,
    'storedOnlyCount': 500,
    'exactEligibleSubsetPath': 'data/generated/step8e/eligible-subset.json',
    'evidencePath': 'data/generated/step8e/admission-evidence.json',
    'closeoutDoc': 'docs/CORPUS_SCALE_STEP8E_RECOMMENDATION_ELIGIBILITY_PASS.md',
    'sourceSlug': 'tortilla-espanola',
    'canonicalRecipeId': 'unitools_tortilla_espanola',
    'dishFamilyId': 'spanish_potato_omelet',
    'controlPlaneSha256': '055747a8d4209908a35b7f2391be480d2b27c530a013a661986c49f6887f7609',
    'pipelineSha256': 'c85be509e10d15b55a4a05e30eaf122a90154b25dd63888ca14823ace857f395',
    'admissionManifestSha256': 'a382db79f9dac4845bdae721b6e4231e6f10c7922183013b508a9d0c28662569',
    'sourceNutritionImportedAsAuthority': False,
    'sourceDietaryMetadataImportedAsAuthority': False,
    'sourceScalingMetadataImportedAsAuthority': False,
    'publicRuntimeChanged': False,
    'runtimeActivationAuthorized': False
}

f = gates['8F']
f['status'] = 'READY_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION'
f['decisionInput'] = {
    'prepared': True,
    'exactSubsetPath': 'data/generated/step8e/eligible-subset.json',
    'candidateCount': 1,
    'canonicalRecipeIds': ['unitools_tortilla_espanola'],
    'machineChecks': {
        'repositoryValidation': 'PASS',
        'browserPreactivationAcceptance': 'PASS',
        'hardFilterRegression': 'PASS',
        'rankingPlannerSearchRegression': 'PASS',
        'recipeSourceV1V2Parity': 'PASS',
        'attributionLicenseFirewall': 'PASS',
        'validationRun': 34862136927
    },
    'publicCorpusRecipeCountBeforeDecision': 84,
    'candidatePresentInPublicCorpus': False,
    'runtimeActivationAuthorized': False,
    'publicRuntimeChanged': False
}

roadmap['currentHumanGate'] = {
    'id': '8F',
    'status': 'EXPLICIT_HUMAN_PUBLIC_RUNTIME_ACTIVATION_DECISION_REQUIRED',
    'reason': 'Step 8E terminal PASS earned an exact one-record recommendation-eligible subset and all non-activating Step 8F machine decision-input checks pass. Public/runtime activation still requires explicit human authorization.',
    'exactDecisionInput': 'data/generated/step8e/eligible-subset.json',
    'candidateCount': 1,
    'canonicalRecipeIds': ['unitools_tortilla_espanola'],
    'activationAuthorized': False
}
roadmap['sourceStateCurrent']['uniTools'] = 'STEP8D_PROTECTED_POPULATED_501__STEP8E_ONE_RECOMMENDATION_ELIGIBLE__500_STORED_ONLY'
roadmap_path.write_text(json.dumps(roadmap, indent=2) + '\n')

closeout = '''# Corpus Scale Step 8E — Recommendation Eligibility PASS

Status: **TERMINAL PASS / STEP 8F DECISION INPUT READY / PUBLIC ACTIVATION NOT AUTHORIZED**

Date: **2026-09-14**

Terminal: `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`

## Result

The exact pinned UniTools 1.1.0 cohort populated by Step 8D was evaluated through the existing app-owned ingredient identity, quantity, control-plane and ingestion-pipeline boundaries. The immutable source remained `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`.

The strict preflight reviewed **501 stored records** and **5,404 ingredient occurrences**. Existing canonical name/alias authority resolved 2,524 occurrences; 2,807 remained unresolved and 73 were conflicting. Exactly **one recipe** resolved every ingredient without inventing new alias or source-ID authority:

- source slug: `tortilla-espanola`
- canonical candidate: `unitools_tortilla_espanola`
- dish family: `spanish_potato_omelet`
- hard allergen: `egg`
- reviewed dietary tag: `vegetarian`
- remaining protected records: **500 stored-only**

This narrow result is intentional. Step 8E does not promote source IDs or convenient source prose into canonical ingredient identity merely to increase yield.

## Frozen evidence

- readiness/admission workflow: **34862136962 — PASS**
- full repository + browser preactivation validation: **34862136927 — PASS**
- frozen evidence: `data/generated/step8e/admission-evidence.json`
- exact eligible subset: `data/generated/step8e/eligible-subset.json`
- control-plane SHA-256: `055747a8d4209908a35b7f2391be480d2b27c530a013a661986c49f6887f7609`
- ingestion-pipeline SHA-256: `c85be509e10d15b55a4a05e30eaf122a90154b25dd63888ca14823ace857f395`
- admission-manifest SHA-256: `a382db79f9dac4845bdae721b6e4231e6f10c7922183013b508a9d0c28662569`

CI regenerates the frozen evidence and exact subset from the immutable source and fails on semantic drift.

## Step 8F preactivation checks

The one-record candidate was tested as an isolated fixture through the real recommendation modules. The current public corpus remains **84 recipes** and does not contain the candidate. Machine checks passed for:

- hard dietary/allergen/permanent-exclusion/time/skill filters;
- deterministic ranking and one-slot planner behavior;
- ingredient search behavior;
- RecipeSource direct/V2 parity over bounded profiles;
- CC-BY-SA attribution and transformation provenance;
- source nutrition firewall;
- headless browser preactivation behavior using real browser modules.

`runtimeActivationAuthorized` remains **false** and `publicRuntimeChanged` remains **false**.

## Boundaries preserved

Step 8E performed no D1 writes, created no third shard, authorized no billing, modified no Nutrition or YT-CUL state, wrote nothing to Knowledge Core, and did not activate normal public recommendations.

## Current gate

Step 8F is now the current explicit human gate. The only decision input is the exact frozen one-record subset above. No broader UniTools cohort is eligible or implicitly authorized.
'''
(root / 'docs/CORPUS_SCALE_STEP8E_RECOMMENDATION_ELIGIBILITY_PASS.md').write_text(closeout)

measured_path = root / 'docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md'
measured = measured_path.read_text()
measured = re.sub(r'Status: \*\*[^\n]+\*\*', 'Status: **STEP 8A PASS / STEP 8B PASS / STEP 8C PASS / STEP 8D PASS / STEP 8E PASS / STEP 8F HUMAN DECISION READY / STEP 8G READY**', measured, count=1)
measured = measured.replace('- **8D — READY:** protected population may proceed autonomously on the earned two-shard topology.', '- **8D — COMPLETE PASS:** 501 pinned UniTools recipes populated across the exact two-shard protected topology.')
measured = measured.replace('- **8E — BLOCKED:** requires an 8D population result and remains recommendation-eligibility review only.', '- **8E — COMPLETE PASS:** exact one-record recommendation-eligible subset earned; 500 UniTools records remain stored-only.')
measured = measured.replace('- **8F — BLOCKED:** explicit human public-runtime decision remains mandatory.', '- **8F — READY / HUMAN GATE:** all non-activating machine decision-input checks pass; explicit public-runtime authorization is now required.')
measured = measured.replace('- **8G — BLOCKED:** requires an 8D PASS and does not depend on 8F.', '- **8G — READY:** protected scale continuation is independently unlocked by 8D PASS and does not depend on 8F.')
measured = measured.replace('Status: **READY / AUTONOMOUS INSIDE EARNED BOUNDARIES**\n\nPurpose: populate rights-clean cohorts only on the topology actually earned by 8B.', 'Status: **COMPLETE PASS / LIVE PRODUCTION**\n\nTerminal: `STEP_8D_PROTECTED_POPULATION_PASS`\n\nThe pinned UniTools cohort completed as 501 recipes / 51 verified batches / two shards, with zero full scans and maximum observed D1 subqueries 15 <= 16.\n\nPurpose: populate rights-clean cohorts only on the topology actually earned by 8B.')
measured = measured.replace('Status: **BLOCKED PENDING AN 8D ELIGIBLE COHORT**', 'Status: **COMPLETE PASS / EXACT ONE-RECORD ELIGIBLE SUBSET**')
marker = 'Storage is not recommendation admission.\n'
if marker in measured and 'unitools_tortilla_espanola' not in measured:
    measured = measured.replace(marker, marker + '\nTerminal: `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`. The 501-record readiness census earned exactly one candidate, `unitools_tortilla_espanola` (`tortilla-espanola`), in dish family `spanish_potato_omelet`; the other 500 records remain stored-only. Frozen evidence is `data/generated/step8e/admission-evidence.json` and the exact subset is `data/generated/step8e/eligible-subset.json`.\n')
measured = measured.replace('Status: **BLOCKED PENDING 8E + EXPLICIT HUMAN PUBLIC-RUNTIME GATE**', 'Status: **READY / EXPLICIT HUMAN PUBLIC-RUNTIME GATE**')
before = 'Before any newly earned external subset affects normal recommendations:\n'
if before in measured and 'All non-activating machine checks are complete' not in measured:
    measured = measured.replace(before, 'All non-activating machine checks are complete for the exact one-record Step 8E subset. Current public runtime remains 84 recipes and unchanged. `runtimeActivationAuthorized` is false.\n\n' + before)
measured = measured.replace('Status: **BLOCKED PENDING 8D PASS**', 'Status: **READY AFTER STEP 8D PASS**')
measured = measured.replace('    8D READY -----> 8G protected scale loop', '    8D PASS ------> 8G protected scale loop')
measured = measured.replace('     8E\n      |\n      v\n     8F explicit public-runtime decision', '     8E PASS\n      |\n      v\n     8F explicit human public-runtime decision')
measured_path.write_text(measured)

handover_md = '''# Roadmap Handover Pointer

Status: ACTIVE — **STEP 8E TERMINAL PASS / STEP 8F EXPLICIT HUMAN GATE**

Live GitHub and `docs/handovers/CURRENT.json` outrank historical summaries.

## Canonical routing

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- canonical programme: `docs/ROADMAP.md`
- Step 8 roadmap: `docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md`
- Step 8 machine gate contract: `config/corpus_scale_step8_roadmap.json`
- Step 8D terminal evidence: `data/generated/corpus-scale-step8d-live-pass.json`
- Step 8E terminal closeout: `docs/CORPUS_SCALE_STEP8E_RECOMMENDATION_ELIGIBILITY_PASS.md`
- Step 8E terminal evidence: `data/generated/step8e/admission-evidence.json`
- Step 8E exact eligible subset / Step 8F decision input: `data/generated/step8e/eligible-subset.json`
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`

## Corpus Scale state

Steps 8A, 8B, 8C, 8D and 8E are terminal PASS. Step 8G remains independently eligible for later protected-scale work, but the requested execution boundary is now Step 8F.

Step 8D populated the exact pinned UniTools cohort: **501 recipes**, **51 verified batches**, exactly **2 shards**, zero full-corpus scans, and max observed D1 subqueries **15 <= 16**.

Step 8E then applied the existing app-owned admission semantics without broadening identity authority. Exactly **one** record earned recommendation eligibility: `unitools_tortilla_espanola`, family `spanish_potato_omelet`. The other **500** remain stored-only. Source nutrition/diet/scaling metadata remains non-authoritative.

All non-activating Step 8F machine decision-input checks pass: hard filters, ranking/planner/search, V1/V2 parity, attribution/licensing, nutrition firewall, and browser preactivation acceptance. The current public runtime remains **84 recipes** and the candidate is not present in `ALL_RECIPES`.

## Current human gate

**Step 8F — explicit human public-runtime activation decision.**

`runtimeActivationAuthorized: false` and `publicRuntimeChanged: false` remain frozen. Do not add `unitools_tortilla_espanola` to the public runtime, change normal recommendations, or broaden the approved subset unless the owner explicitly authorizes Step 8F.

## Boundaries unchanged

No paid infrastructure, no third shard, no Nutrition mutation, no YT-CUL mutation, and no Knowledge Core write are authorized by this closeout.
'''
(root / 'docs/ROADMAP_HANDOVER.md').write_text(handover_md)

current_path = root / 'docs/handovers/CURRENT.json'
previous_path = root / 'docs/handovers/PREVIOUS.json'
shutil.copyfile(current_path, previous_path)
current = {
    'handover': 'CULINARY_APP_STEP8E_TERMINAL_PASS_STEP8F_HUMAN_GATE_V24',
    'handover_date': '2026-09-14',
    'timezone': 'Europe/Madrid',
    'status': 'STEP8A_PASS__STEP8B_PASS__STEP8C_PASS__STEP8D_PASS__STEP8E_TERMINAL_PASS__STEP8F_EXPLICIT_HUMAN_GATE_READY_NOT_AUTHORIZED__STEP8G_READY',
    'human_needed': True,
    'repositories': {
        'primary': 'DataRaul/culinary-recommender-app',
        'read_only_reconciliation': 'DataRaul/knowledge-core',
        'source_of_truth': 'GitHub',
        'step8d_terminal_merge': 'bf7aefa5df1634aad2ee24ff94e609fd74d168de',
        'step8e_integration_pr': 150
    },
    'lane': {
        'name': 'Culinary App / Culinary Lab — Corpus Scale Step 8',
        'knowledge_core': 'READ_ONLY',
        'nutrition_lane': 'SEPARATE_CONCURRENT_LANE_DO_NOT_MUTATE',
        'yt_cul_lane': 'INDEPENDENT_READ_ONLY_FROM_CORPUS_SCALE'
    },
    'operating_contract': {
        'autonomy': 'Machine preparation may proceed autonomously only up to the explicit Step 8F public-runtime decision.',
        'billing_firewall': 'Never authorize paid infrastructure or automatic overage.',
        'public_activation': 'Step 8F is now the active human gate. Activation remains unauthorized until explicit owner approval.',
        'source_authority': 'Source nutrition, diet/allergen claims and scaling rules remain non-authoritative unless separately admitted.'
    },
    'corpus_scale': {
        'step8d': {
            'status': 'COMPLETE_PASS_LIVE_PRODUCTION',
            'terminal': 'STEP_8D_PROTECTED_POPULATION_PASS',
            'recipe_count': 501,
            'verified_batch_count': 51,
            'shard_count': 2,
            'max_observed_d1_subqueries': 15,
            'full_corpus_scans': 0
        },
        'step8e': {
            'status': 'COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY',
            'terminal': 'STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS',
            'reviewed_stored_population': 501,
            'eligible_subset_count': 1,
            'stored_only_count': 500,
            'eligible_subset': 'data/generated/step8e/eligible-subset.json',
            'evidence': 'data/generated/step8e/admission-evidence.json',
            'canonical_recipe_id': 'unitools_tortilla_espanola',
            'dish_family_id': 'spanish_potato_omelet'
        },
        'step8f': {
            'status': 'EXPLICIT_HUMAN_PUBLIC_RUNTIME_ACTIVATION_DECISION_REQUIRED',
            'machine_decision_input': 'PASS',
            'public_runtime_recipe_count': 84,
            'candidate_present_in_public_runtime': False,
            'runtime_activation_authorized': False,
            'public_runtime_changed': False
        },
        'step8g': 'READY_CONTINUED_PROTECTED_SCALE_LOOP__DOES_NOT_DEPEND_ON_8F'
    },
    'validation': {
        'step8e_source_and_admission_run': 34862136962,
        'repository_and_browser_run': 34862136927,
        'repository_validation': 'PASS',
        'browser_preactivation_acceptance': 'PASS'
    },
    'current_human_gate': 'STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION',
    'human_decision_options': [
        'APPROVE_ACTIVATION_OF_EXACT_ONE_RECORD_SUBSET_ONLY',
        'HOLD_PUBLIC_ACTIVATION'
    ],
    'next_action': 'STOP. Ask the owner for the explicit Step 8F decision. Do not activate or broaden public runtime before approval.',
    'terminal_instruction_for_new_chat': 'Step 8E is terminal PASS. Exact Step 8F decision input is one CC-BY-SA UniTools Spanish tortilla variant, unitools_tortilla_espanola, family spanish_potato_omelet; 500 other UniTools records remain stored-only. All non-activating machine checks pass and current public runtime remains 84 recipes. Stop for explicit Step 8F authorization.'
}
current_path.write_text(json.dumps(current, indent=2) + '\n')

test = '''import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8e/admission-evidence.json", import.meta.url), "utf8"));
const subset = JSON.parse(readFileSync(new URL("../data/generated/step8e/eligible-subset.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8E terminal closeout is exact and bounded", () => {
  assert.equal(gate("8E").status, "COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY");
  assert.equal(gate("8E").terminal, "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS");
  assert.equal(evidence.pass, true);
  assert.equal(evidence.reviewedStoredPopulation, 501);
  assert.equal(evidence.eligibleSubsetCount, 1);
  assert.equal(evidence.storedOnlyCount, 500);
  assert.deepEqual(evidence.canonicalRecipeIds, ["unitools_tortilla_espanola"]);
  assert.equal(subset.recipes.length, 1);
  assert.equal(subset.recipes[0].id, "unitools_tortilla_espanola");
});

test("Step 8F is current human gate and remains unauthorized", () => {
  assert.equal(gate("8F").status, "READY_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION");
  assert.equal(gate("8F").humanRequired, true);
  assert.equal(gate("8F").decisionInput.runtimeActivationAuthorized, false);
  assert.equal(gate("8F").decisionInput.publicRuntimeChanged, false);
  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountBeforeDecision, 84);
  assert.equal(gate("8F").decisionInput.candidatePresentInPublicCorpus, false);
  assert.equal(roadmap.currentHumanGate.id, "8F");
  assert.equal(roadmap.currentHumanGate.activationAuthorized, false);
  assert.equal(handover.human_needed, true);
  assert.equal(handover.current_human_gate, "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION");
  assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, false);
});

test("Step 8E closeout preserves cost and adjacent-lane firewalls", () => {
  assert.equal(roadmap.boundaries.noBillingAuthorization, true);
  assert.equal(roadmap.boundaries.nutritionBLaneIndependent, true);
  assert.equal(roadmap.boundaries.youtubeCulinaryStateMutableFromStep8, false);
  assert.equal(roadmap.boundaries.knowledgeCoreWriteAllowedFromAppLane, false);
  assert.equal(evidence.boundaries.d1WritesPerformed, 0);
  assert.equal(evidence.boundaries.thirdShardUsed, false);
  assert.equal(evidence.boundaries.billingExpansion, false);
  assert.equal(evidence.boundaries.nutritionLaneModified, false);
  assert.equal(evidence.boundaries.youtubeCulinaryStateModified, false);
  assert.equal(evidence.boundaries.knowledgeCoreWritePerformed, false);
});
'''
(root / 'tests/corpus-scale-step8e-closeout.test.js').write_text(test)
