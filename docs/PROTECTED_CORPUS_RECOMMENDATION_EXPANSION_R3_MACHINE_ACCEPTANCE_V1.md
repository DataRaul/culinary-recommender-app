# Protected Corpus Recommendation Expansion R3 — machine acceptance V1

Status: **PASS WITH FAIL-CLOSED HOLD / NO OWNER ADMISSION GATE**

The only R2 identity-ready candidate, pinned UniTools `chimichurri`, is serialized into a candidate-only runtime shape and exercised against the existing deterministic recommendation and planner machinery.

R3 intentionally does **not** admit it. Two hard-metadata problems remain:

- the source category is `sauce`; that is not reviewed authority for any standalone runtime meal role, so `mealTypes` remains empty;
- the source declares 15 prep minutes and 0 cook minutes, while its four step-minute fields sum to 20 and the final instruction says to let the sauce stand for two hours. Runtime total time therefore remains unknown instead of treating 15 as authoritative elapsed time.

The already-reviewed UniTools difficulty mapping safely maps source `easy` to runtime difficulty 1. R2 ingredient-policy review supports candidate-only `unrestricted`, `vegetarian`, and `vegan` tags for current mapped profile tokens, with no declared mapped allergens. Those facts do not override the meal-role or time holds.

Machine acceptance passes because recommendation and planner behavior abstain deterministically for every current meal type. Public runtime stays 86 recipes, the candidate is absent from runtime, nutrition stays unimported, and all D1/KC/cost/shard/Barbecue firewalls remain unchanged.

Terminal: `PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_PASS__CHIMICHURRI_HELD__NEXT_FRONTIER_READY`.

Next: `R1_NEXT_FRONTIER_ITERATION_V2`. No human authorization is requested because no admission-ready recipe exists.
