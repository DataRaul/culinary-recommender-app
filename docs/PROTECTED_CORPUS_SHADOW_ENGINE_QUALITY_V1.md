# V21 Shadow Engine Quality Evaluation V1

Date: 2026-10-03

## Entry state

The full-corpus V21 baseline passed with:

- 19,268 / 19,268 owner-searchable recipes;
- 7,714 new unrestricted shadow-evaluable recipes plus the already validated Pão de Queijo;
- 0 hard-safety violations;
- restricted dietary/allergen profiles fail-closed.

The baseline evidence distribution provides a natural first quality pool: **539 new candidates have shadow evidence score >= 0.60** (454 UniTools and 85 ForkRecipe). This gate evaluates that opportunity without live recommendation admission.

## Real-engine adapter

Protected candidates are adapted to the existing deterministic recommendation schema only for offline evaluation.

The adapter:

- carries exact known total time, servings and ingredient identities when available;
- preserves unresolved ingredients as explicit non-canonical shadow tokens;
- retains only positive known catalog-allergen signals;
- does not claim allergen-free status;
- does not invent dietary tags, cost, convenience, nutrition, difficulty equivalence or other missing soft facts;
- uses governance state `SHADOW_CANDIDATE_ONLY`.

The production recommendation engine recognizes that state **only when called with explicit `mode: "shadow"`** and only for an unrestricted profile with no allergens, permanent exclusions or unavailable ingredients. The same candidate is rejected in normal mode and for restricted profiles.

## Quality comparison

The gate measures two offline orderings over all 7,714 new unrestricted candidates:

1. **control** — the existing deterministic engine score;
2. **comparison** — existing engine score multiplied by the already-frozen shadow evidence-completeness score.

The second ordering is not a new production score. It tests whether confidence/evidence weighting reduces the risk that sparse candidates rank above richer candidates.

## First quality cohort

The first relevance-acceptance cohort is selected only from candidates with evidence score >= **0.60**.

Expected pool: **539**.

Frozen next cohort size: **500**, ordered by the offline comparison score.

This cohort remains shadow-only. It is not a recommendation admission or public runtime expansion.

## Safety and regression requirements

The gate requires:

- 0 shadow candidates eligible outside explicit shadow mode;
- 0 vegetarian shadow candidates eligible without reviewed dietary authority;
- 0 egg-allergy shadow candidates eligible without reviewed allergen authority;
- finite engine scores for every unrestricted eligible candidate;
- deterministic control and comparison ranking digests;
- evidence-weighted top-100 average evidence >= control top-100;
- the first-500 cohort minimum evidence score >= 0.60;
- current public runtime remains exactly 86;
- existing live ranking remains deterministic;
- a five-slot breakfast planner probe is deterministic;
- no D1 read/write, corpus rewrite, live admission, KC write, paid model/API, third shard or Barbecue mutation.

## Next gate

On pass:

`V21_FIRST_500_SHADOW_QUALITY_COHORT_RELEVANCE_ACCEPTANCE`

That gate should evaluate recommendation relevance and obvious category/meal mismatches on the frozen 500 before any progressive live recommendation exposure.
