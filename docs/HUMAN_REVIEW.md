# Human Acceptance Review — Gate 9 / 9A / 9B / Gate F

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

## V1.1 Recipe Corpus Gate F — HUMAN ACCEPTANCE REQUIRED

Technical candidate state is bounded deliberately: the public recipe universe contains **84 recipes** — 76 curated project-authored records plus eight exact-revision English Wikibooks records — normalized into **83 dish families** with one explicit cross-source Spanish-potato-omelet family.

The Wikibooks lane is text-only under **CC BY-SA 4.0**. It carries page/revision provenance, contributor attribution, licence and transformation notice. No Wikibooks images are bundled, and source recipe nutrition is not promoted to authoritative NutritionSource evidence.

Only **Baba Ganoush** and **Bruschetta base** have enough source-backed hard metadata to enter the external Search lane. The other six records stay `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA`. No external record is admitted to weekly planning merely to increase recipe count.

The role audit truthfully leaves `contemporary_modern` and `genuinely_new_trending` uncovered in this initial tranche. These are explicit corpus gaps, not inferred labels.

### Human acceptance check

Before Gate F may be marked COMPLETE, review the deployed public app and confirm the external corpus is useful and presented truthfully. In particular:

1. confirm the status line reports `84 recipes · 76 curated + 8 open external · deterministic`;
2. Search for **aubergine** and inspect **Baba Ganoush**;
3. confirm the result is clearly identified as an open external recipe rather than project-authored content;
4. confirm nutrition says evidence is pending rather than presenting Wikibooks nutrition as authoritative;
5. inspect the Wikibooks source page, exact revision, CC BY-SA 4.0 attribution and transformation notice;
6. confirm the external result feels useful enough to retain as part of the public corpus;
7. confirm weekly planning does not surface the Search-only external records;
8. report any provenance, wording, usability, safety or recommendation concern.

A human **accept** decision closes Gate F. A rejection or requested change keeps Gate F open and should identify the specific public-corpus issue to repair.

Failure report format for future regressions: **screen / profile or action / expected / observed / screenshot if useful**.
