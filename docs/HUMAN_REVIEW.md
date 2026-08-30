# Human Acceptance Review — Gate 9 / 9A / 9B

## Gate 9 — ACCEPTED
The original public V0 review passed:
1. first-time onboarding;
2. Budget Beginner profile;
3. Mediterranean + vegetarian + high-protein profile;
4. advanced/exploratory profile;
5. generate only selected meal slots;
6. swap one recipe without rebuilding everything;
7. mark an ingredient unavailable;
8. inspect substitution wording;
9. inspect combined grocery list;
10. inspect approximate cost tier and uncertainty;
11. edit pantry/default staples;
12. test on a phone viewport/device;
13. intentionally create a constrained/impossible combination;
14. report confusing UI;
15. report recommendations that feel obviously wrong.

## Gate 9A — ACCEPTED
The deterministic fridge-first Search shell is accepted as functional. Automated acceptance covers main-ingredient hard filtering, secondary-ingredient ranking, require-all behavior, temporary time/skill/discovery overrides without saved-profile mutation, and preservation of safety constraints.

## Gate 9B — ACCEPTED
The composable profile shell is accepted as functional. Automated acceptance covers up to three scoped priority packs, fourth-pack rejection, cuisine multi-select, lunch/dinner scoping, Search scope behavior, and neutral ingredients-first behavior without weakening hard constraints.

## Preference and safety controls — ACCEPTED
Temporary **Can't get right now** availability and durable **Always exclude** preferences are separate. Permanent exclusions are saved locally as an unbounded deduplicated list subject only to practical browser-storage limits; there is no product-level small-number cap. Family-level exclusions such as **coconut** block every encoded ingredient in that ontology family, while future-only preferences such as **pineapple** are retained for later corpus expansion. Declared allergen controls remain hard filters for both recipes and substitutions.

## Baseline decision
The V0.9.3 shell/core functionality is accepted. Future work may expand recipe breadth, ingredient ontology coverage, nutrition evidence, prices, images and other deferred capabilities without reopening this core-functionality gate unless a later change materially alters these contracts.

Failure report format for future regressions: **screen / profile or action / expected / observed / screenshot if useful**.
