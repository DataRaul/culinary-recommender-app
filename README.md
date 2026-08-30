# Culinary Recommender

> **Public V0 control surface** — deterministic, mobile-first culinary recommendations, partial-week planning, substitutions and groceries.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe data | ✅ COMPLETE | V0.2 / Gate 2 | authoritative nutrition mapping expansion |
| Recommender | ✅ COMPLETE | V0.3 / Gate 3 | future policy evidence |
| Planning | ✅ COMPLETE | V0.4 / Gate 4 | broader corpus |
| Grocery / pantry / substitution / budget | ✅ COMPLETE | V0.4 / Gate 5 | price evidence later |
| UX/UI | ✅ COMPLETE | V0.5 / Gate 6 | human acceptance |
| Automated acceptance | ✅ COMPLETE | V0.9 / Gate 7 | human acceptance |
| Public deployment | ✅ COMPLETE | V0.9 / Gate 8 | human acceptance |
| Human review | 🟠 HUMAN_GATE | V0.9 / Gate 9 | V1.0 acceptance |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | September KC refresh + explicit authorization |

**Current version:** V0.9 human-review candidate  
**Current gate:** Gate 9 — Human Acceptance Review  
**Current status:** HUMAN_GATE  
**Completed:** deterministic engine, 24-recipe project-authored corpus, ingredient ontology, exact-slot planner, grocery/pantry/substitution/cost, polished mobile UI, 15,552-profile matrix, public CI, public deployment  
**Being built:** nothing until human review evidence is received  
**Next gate:** V1.0 acceptance after Gate 9  
**Human action required:** complete the Gate 9 review checklist and report failures or acceptance  
**Major deferred:** nutrient-gap awareness, supplements, images, local price intelligence, fitness adapter, advanced culinary exploration, Culinary & Nutrition Brain  
**Public app URL:** https://dataraul.github.io/culinary-recommender-app/

## What it does
Choose exactly which lunch/dinner slots need help, then tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference. The app ranks recipes deterministically, optimizes the group for reuse/diversity, explains recommendations, supports one-dish swaps, remembers pantry/availability locally and builds one grocery list.

The target flow already covered by deterministic tests is: **2 lunches + 3 dinners · moderate budget · Mediterranean leaning · vegetarian · high protein · ≤35 minutes · intermediate · slightly adventurous**.

## Runtime principles
- no account or backend required;
- no runtime LLM or paid API;
- no private Knowledge Core dependency;
- hard constraints run before ranking;
- identical inputs/data/version produce identical recommendations;
- impossible profiles show a shortfall rather than silently weakening hard constraints;
- nutrition/cost uncertainty is explicit;
- local state is versioned and exportable/importable.

## Hosting and validation
The app is published as a static GitHub Pages site from `main` / repository root, matching the simpler pattern used by the related public apps. There is no dedicated Pages deployment workflow. Public validation remains in `.github/workflows/validate.yml` on standard GitHub-hosted runners.

```bash
npm run validate
```

The deterministic suite includes 16 direct tests plus a 15,552-combination representative profile matrix. Public CI also runs one targeted Playwright mobile browser smoke test without live third-party data.

## Data and licensing
The shipped V0 recipe corpus is project-authored and no third-party recipe database is bundled. USDA FoodData Central is an approved future CC0 nutrition candidate; BEDCA is excluded from V0 bundling because its published reuse terms require care; Open Food Facts remains a future ODbL compatibility decision. See `docs/DATA_SOURCES.md`.

This repository currently has **no general licence**. Public visibility is not permission to reuse repository content.

## Documentation
- `docs/PRODUCT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/GATES.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_SOURCES.md`
- `docs/RECOMMENDATION_MODEL.md`
- `docs/TESTING.md`
- `docs/HUMAN_REVIEW.md`
- `docs/DEFERRED_CAPABILITIES.md`
