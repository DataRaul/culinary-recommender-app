import json
from pathlib import Path

root = Path('.')
today = '2026-09-14'
runner = {
    'pass': True,
    'terminalCandidate': 'STEP_8D_PROTECTED_POPULATION_PASS',
    'externalUnauthenticatedProbePass': True,
    'externalUnauthenticatedProbeRun': 34834330389,
    'pinnedSourceBlobShaPass': True,
    'populationPlanSha256': '18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12',
    'recipeCount': 501,
    'verifiedBatchCount': 51,
    'shardCount': 2,
    'resumableInterruptionPass': True,
    'idempotentWritePass': True,
    'exactPostWrite501Pass': True,
    'authenticatedCrossShardReadPass': True,
    'rollbackPass': True,
    'fullCorpusScans': 0,
    'maxObservedD1Subqueries': 15,
    'normalPublicRecommendationRuntimeChanged': False,
    'thirdShardUsed': False,
    'billingExpansion': False,
    'completed': [
        'session', 'status', 'bindings', 'free-limit', 'source-and-packets',
        'initialize', 'progress-before', 'partial-checkpoint', 'resume-all-batches',
        'exact-progress', 'idempotent-replay', 'activate-protected-pointer',
        'rollback', 'evidence'
    ]
}

evidence = {
    'schema': 'CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS_V1',
    'date': today,
    'evidenceClass': 'HUMAN_OBSERVED_AUTHENTICATED_PRODUCTION_RUN_PLUS_MACHINE_EXTERNAL_PROBE',
    'terminal': 'STEP_8D_PROTECTED_POPULATION_PASS',
    'authenticatedProductionRunner': runner,
    'frozenContract': {
        'sourceRepository': 'farcrak/unitools-recipes',
        'sourceCommit': '1d09e9548d957dd0375301146a86dddf5e269c1b',
        'sourceBlobSha': 'a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed',
        'corpusVersion': 'v8001',
        'packetSchema': 'CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1',
        'recipeCount': 501,
        'verifiedBatchCount': 51,
        'shardCount': 2,
        'shardRows': {'0': 257, '1': 244},
        'maxRowsPerBatch': 10,
        'maxProtectedD1Subqueries': 16,
        'populationPlanSha256': '18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12',
        'manifestSha256': '0cb09afd9dd87ead733c3798c4832fdd96c8022867fb857a8730f74243562743',
        'packetSetSha256': '6b6e12011e9a12ffdc362acae32bc43304d66705c75325a898da1b84b3ed4c48'
    },
    'machineEvidence': {
        'terminalReadinessMerge': '1bd61fcc0ac70b15f5f529f17998fcb9b44890eb',
        'postMergeValidationRun': 34836427610,
        'postMergeLivePayloadPreflightRun': 34836427579,
        'postMergeUnauthenticatedProbeRun': 34836427544,
        'runnerEmbeddedExternalProbeRun': 34834330389,
        'cloudflareProductionDeployment': 'PASS'
    },
    'acceptance': {
        'exact501Closure': True,
        'all51BatchesVerified': True,
        'resumableInterruption': True,
        'idempotentReplay': True,
        'authenticatedCrossShardRead': True,
        'pointerOnlyRollback': True,
        'zeroFullCorpusScans': True,
        'observedD1SubqueriesWithinBudget': True,
        'normalPublicRecommendationRuntimeChanged': False,
        'thirdShardUsed': False,
        'billingExpansion': False,
        'nutritionMutation': False,
        'ytCulMutation': False,
        'knowledgeCoreWrite': False
    },
    'authority': {
        'protectedPopulationEarned': True,
        'recommendationEligibilityReviewUnlocked': True,
        'continuedProtectedScaleLoopUnlocked': True,
        'publicRuntimeActivationAuthorized': False,
        'step8fExplicitHumanGatePreserved': True
    }
}
(root / 'data/generated/corpus-scale-step8d-live-pass.json').write_text(json.dumps(evidence, indent=2) + '\n')

(root / 'docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md').write_text('''# Corpus Scale Step 8D — Live Protected Population PASS

Date: 2026-09-14

Terminal: `STEP_8D_PROTECTED_POPULATION_PASS`

## Result

The authenticated production Step 8D runner completed the exact pinned UniTools 501-record protected population across the two already-earned D1 recipe-body shards.

Observed terminal evidence:

- `pass: true`;
- exact recipes: **501**;
- verified batches: **51**;
- shards: **2**;
- resumable interruption: **PASS**;
- idempotent replay: **PASS**;
- exact post-write 501 closure: **PASS**;
- authenticated cross-shard read: **PASS**;
- pointer-only rollback: **PASS**;
- full-corpus scans: **0**;
- maximum observed D1 subqueries: **15**, within the frozen protected-request limit of **16**;
- normal public recommendation runtime changed: **false**;
- third shard used: **false**;
- billing expansion: **false**.

The runner also reported the frozen population-plan SHA-256 `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12` and pinned-source blob check PASS.

## External denial evidence

The runner incorporated the already-earned external unauthenticated probe (`34834330389`). Independent post-readiness production probing also passed with HTTP 401 before shard access, `protectedDataReturned: false` and `shardQueries: 0`.

## Authority earned

Step 8D is terminal PASS. This earns only:

- Step 8E recommendation-eligibility review on the stored protected cohort;
- Step 8G continued protected scale learning.

It does **not** authorize normal public recommendation activation. Step 8F remains an explicit human gate. It also does not authorize a third shard, billing expansion, Nutrition mutation, YT-CUL mutation, Knowledge Core writes, or promotion of source nutrition/diet/allergen/scaling metadata to canonical authority.

Canonical structured evidence: `data/generated/corpus-scale-step8d-live-pass.json`.
''')

roadmap_path = root / 'config/corpus_scale_step8_roadmap.json'
roadmap = json.loads(roadmap_path.read_text())
roadmap['status'] = 'STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_READY__8G_READY__8F_EXPLICIT_HUMAN_GATE'
for p in ['docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md', 'data/generated/corpus-scale-step8d-live-pass.json']:
    if p not in roadmap['evidenceBasis']:
        roadmap['evidenceBasis'].append(p)
gates = {g['id']: g for g in roadmap['gates']}
g8d = gates['8D']
g8d['status'] = 'COMPLETE_PASS_LIVE_PRODUCTION'
g8d['terminal'] = 'STEP_8D_PROTECTED_POPULATION_PASS'
g8d['livePopulationEvidence'] = {
    'date': today,
    'evidencePath': 'data/generated/corpus-scale-step8d-live-pass.json',
    'closeoutDoc': 'docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md',
    'recipeCount': 501,
    'verifiedBatchCount': 51,
    'shardCount': 2,
    'maxObservedD1Subqueries': 15,
    'fullCorpusScans': 0,
    'resumableInterruptionPass': True,
    'idempotentWritePass': True,
    'authenticatedCrossShardReadPass': True,
    'rollbackPass': True,
    'normalPublicRecommendationRuntimeChanged': False,
    'thirdShardUsed': False,
    'billingExpansion': False
}
gates['8E']['status'] = 'READY_RECOMMENDATION_ELIGIBILITY_REVIEW'
gates['8G']['status'] = 'READY_CONTINUED_PROTECTED_SCALE_LOOP'
roadmap['currentHumanGate'] = {
    'id': 'NONE',
    'status': 'NO_HUMAN_GATE_CURRENTLY_REQUIRED',
    'reason': 'Step 8D terminal PASS is earned. Step 8E and Step 8G are autonomous inside their existing boundaries.',
    'nextReservedHumanGate': 'STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION'
}
roadmap_path.write_text(json.dumps(roadmap, indent=2) + '\n')

runbook_path = root / 'docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_RUNBOOK.md'
runbook = runbook_path.read_text()
terminal_note = '> **Terminal status (2026-09-14):** `STEP_8D_PROTECTED_POPULATION_PASS` is earned. See `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md`. This runbook is retained for recovery/rebuild reference; do not rerun population blindly.\n\n'
if not runbook.startswith('> **Terminal status'):
    runbook_path.write_text(terminal_note + runbook)

handover_path = root / 'docs/ROADMAP_HANDOVER.md'
handover = handover_path.read_text()
if '- Step 8D live terminal closeout:' not in handover:
    handover = handover.replace(
        '- Step 8D live runbook: `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_RUNBOOK.md`\n',
        '- Step 8D live runbook: `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_RUNBOOK.md`\n- Step 8D live terminal closeout: `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md`\n- Step 8D live terminal evidence: `data/generated/corpus-scale-step8d-live-pass.json`\n'
    )
start = handover.index('### Step 8D —')
end = handover.index('## Current human gate', start)
step8d_section = '''### Step 8D — COMPLETE / LIVE PRODUCTION PASS

Terminal: `STEP_8D_PROTECTED_POPULATION_PASS`.

The exact pinned UniTools cohort completed protected population in production: **501 recipes**, **51 verified batches**, exactly **2 shards**, resume PASS, idempotent replay PASS, exact post-write closure PASS, cross-shard protected read PASS and pointer-only rollback PASS. Full-corpus scans were **0**. Maximum observed D1 subqueries were **15**, within the frozen limit of **16**.

The frozen population-plan SHA-256 remained `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12`; the pinned-source blob check passed. Normal public recommendation behavior remained unchanged. No third shard and no billing expansion occurred.

Canonical terminal evidence is `data/generated/corpus-scale-step8d-live-pass.json`; narrative closeout is `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md`.

Step 8D PASS unlocks Step 8E recommendation-eligibility review and Step 8G continued protected scale learning. Step 8F remains an explicit human public-runtime gate and is **not authorized** by Step 8D.

'''
handover = handover[:start] + step8d_section + handover[end:]
start = handover.index('## Current human gate')
end = handover.index('## Concurrency boundaries', start)
human_section = '''## Current human gate

None. Step 8D terminal PASS is earned. Step 8E and Step 8G may proceed autonomously inside the existing no-billing, no-public-activation and lane-separation boundaries.

The next reserved human gate is Step 8F public-runtime activation, after Step 8E produces decision input. Do not enter or authorize Step 8F without explicit human approval.

'''
handover = handover[:start] + human_section + handover[end:]
start = handover.index('## Next execution rule')
next_section = '''## Next execution rule

Continue from the earned Step 8D terminal. Step 8E recommendation-eligibility review and Step 8G protected-scale continuation are now eligible autonomous work. Preserve the exact two-shard/no-billing boundary unless a later gate separately earns expansion. Never activate public recommendations, mutate Nutrition/YT-CUL, write Knowledge Core, promote untrusted source metadata to canonical authority, or enter Step 8F without explicit human authorization.
'''
handover = handover[:start] + next_section
handover_path.write_text(handover)

current_path = root / 'docs/handovers/CURRENT.json'
previous_path = root / 'docs/handovers/PREVIOUS.json'
previous_path.write_text(current_path.read_text())
current = {
    'handover': 'CULINARY_APP_STEP8D_TERMINAL_PASS_STEP8E_STEP8G_UNLOCKED_V23',
    'handover_date': today,
    'timezone': 'Europe/Madrid',
    'status': 'STEP8A_PASS__STEP8B_PASS__STEP8C_PASS__STEP8D_TERMINAL_PASS__STEP8E_READY__STEP8G_READY__STEP8F_EXPLICIT_HUMAN_GATE_NOT_AUTHORIZED',
    'human_needed': False,
    'repositories': {
        'primary': 'DataRaul/culinary-recommender-app',
        'read_only_reconciliation': 'DataRaul/knowledge-core',
        'source_of_truth': 'GitHub',
        'main_before_closeout': '9ba4147d616fd0365976e8d3bd023014697ad50e',
        'step8d_live_runtime_merge': 'e04f944954e48b4e4051f4443a54abc3badf280f',
        'step8d_cloudflare_runtime_fix_merge': '2a19a51bb457d961713bff14fbf0148779467db6',
        'step8d_terminal_readiness_merge': '1bd61fcc0ac70b15f5f529f17998fcb9b44890eb'
    },
    'handover_protocol': {
        'current': 'docs/handovers/CURRENT.json',
        'previous': 'docs/handovers/PREVIOUS.json',
        'protocol': 'docs/HANDOVER_PROTOCOL.md',
        'rotation': 'old CURRENT -> PREVIOUS; new latest state -> CURRENT',
        'new_chat_start': 'Read CURRENT, then fresh-reconcile main/open PRs/CI/deployments before acting. GitHub live state outranks this snapshot.'
    },
    'lane': {
        'name': 'Culinary App / Culinary Lab — Corpus Scale Step 8 / 170k No-Billing-Authorization',
        'knowledge_core': 'READ_ONLY',
        'nutrition_lane': 'SEPARATE_CONCURRENT_LANE_DO_NOT_MUTATE',
        'yt_cul_lane': 'INDEPENDENT_READ_ONLY_FROM_CORPUS_SCALE'
    },
    'operating_contract': {
        'autonomy': 'Proceed autonomously through technically resolvable work inside an earned gate.',
        'billing_firewall': 'Never authorize paid infrastructure or automatic overage. Free exhaustion must fail closed.',
        'public_activation': 'Step 8F remains an explicit human gate and is not authorized.',
        'source_authority': 'Source nutrition, diet/allergen claims and scaling rules remain untrusted metadata unless separately admitted.',
        'secrets': 'Never expose credentials, cookies, session tokens or reusable credentials.'
    },
    'corpus_scale': {
        'required_capacity': 170000,
        'stress_capacity': 250000,
        'step8a': {'status': 'COMPLETE_PASS', 'terminal': 'STEP_8A_POPULATION_CONTRACT_PASS'},
        'step8b': {'status': 'COMPLETE_PASS_LIVE_PRODUCTION', 'terminal': 'STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS'},
        'step8c': {'status': 'COMPLETE_PASS', 'terminal': 'STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE'},
        'step8d': {
            'status': 'COMPLETE_PASS_LIVE_PRODUCTION',
            'terminal': 'STEP_8D_PROTECTED_POPULATION_PASS',
            'evidence': 'data/generated/corpus-scale-step8d-live-pass.json',
            'closeout_doc': 'docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md',
            'recipe_count': 501,
            'verified_batch_count': 51,
            'shard_count': 2,
            'shard_rows': {'0': 257, '1': 244},
            'max_observed_d1_subqueries': 15,
            'max_allowed_d1_subqueries': 16,
            'full_corpus_scans': 0,
            'resumable_interruption_pass': True,
            'idempotent_write_pass': True,
            'exact_post_write_501_pass': True,
            'authenticated_cross_shard_read_pass': True,
            'rollback_pass': True,
            'normal_public_recommendation_runtime_changed': False,
            'third_shard_used': False,
            'billing_expansion': False
        },
        'step8e': 'READY_RECOMMENDATION_ELIGIBILITY_REVIEW',
        'step8f': 'EXPLICIT_HUMAN_PUBLIC_RUNTIME_GATE_NOT_AUTHORIZED',
        'step8g': 'READY_CONTINUED_PROTECTED_SCALE_LOOP__DOES_NOT_DEPEND_ON_8F'
    },
    'current_human_gate': 'NONE',
    'next_reserved_human_gate': 'STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION',
    'next_action': {
        'parallel_eligible': ['STEP8E_RECOMMENDATION_ELIGIBILITY_REVIEW', 'STEP8G_CONTINUED_PROTECTED_SCALE_LOOP'],
        'instruction': 'Fresh-reconcile current main, then continue autonomous Step 8E and/or Step 8G work within existing boundaries. Do not enter Step 8F without explicit authorization.'
    },
    'terminal_instruction_for_new_chat': 'Step 8D is terminal PASS from the authenticated production run: 501 recipes, 51 verified batches, two shards, resume/idempotency/cross-shard/rollback PASS, zero full scans and maxObservedD1Subqueries=15. Step 8E and Step 8G are unlocked. Step 8F public activation is not authorized. Preserve no-billing, no-third-shard-unless-earned, Nutrition/YT-CUL separation and Knowledge Core read-only boundaries.'
}
current_path.write_text(json.dumps(current, indent=2) + '\n')
