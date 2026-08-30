# Product Contract — V0

## Purpose
Culinary Recommender is a public, mobile-first recommendation and discovery system for generally healthy adults. It helps users select only the meals they need and balances nutrition awareness, affordability, time, skill, cuisine, protein emphasis, variety, meal-prep utility, availability and pantry reuse.

It also supports a fridge-first entry path: the user can start from a main ingredient they already have, optionally add secondary ingredients, and temporarily change today's meal context, time, skill ceiling and discovery mood without rewriting their saved profile.

It is not primarily a diet app and does not assign permanent personas. The profile is built from independent dimensions plus optional composable priority packs.

## Profile composition
- users may choose zero to three priority packs;
- each pack is explicitly scoped to all meals, lunch or dinner;
- packs are bounded soft ranking signals, not hard personas and not hidden profile rewrites;
- a user can therefore be Meal Prep-oriented at lunch and Culinary Explorer-oriented at dinner;
- explicit budget, nutrition, speed, skill, variety, protein and meal-prep dimensions remain independently editable;
- dietary mode and safety exclusions remain independent hard constraints;
- cuisine preferences are a separate multi-select discovery dimension, never implied by a priority pack;
- cuisine ordering foregrounds broad corpus-backed choices including Indian and Thai / Southeast Asian, while Local / Canarian remains available without receiving default priority.

The three-pack cap is deliberate for V0: it supports a baseline plus contextual lunch/dinner intent without allowing stacked soft bonuses to dominate explainability.

## V0 boundaries
- deterministic local recommendation policy;
- deterministic ingredient-first search over the same canonical recipe corpus;
- main ingredient is a hard search pre-filter;
- secondary ingredients are ranking preferences unless the user explicitly makes them required;
- temporary search intent never silently mutates the saved profile;
- dietary mode, declared allergens, explicit ingredient exclusions and unavailable ingredients stay hard constraints even when soft profile preferences are neutralized;
- no runtime LLM calls;
- no account/backend requirement;
- no paid inference or data API;
- no private Knowledge Core runtime access;
- no diagnosis, therapeutic diet prescription or individualized supplement dosing;
- hard constraints fail closed rather than being silently relaxed;
- local browser persistence with explicit schema versioning and JSON export/import.

## Geography
The primary food environment is Canary Islands → Spain → Mediterranean Europe, while cuisine discovery remains global. Geography informs likely availability, substitution and cost confidence; it does not restrict or privilege cuisine preference ordering.

## Evidence language
Nutrition values in the project-authored V0 corpus are explicitly labelled `INFERRED_ESTIMATE` with low confidence. Cost is a four-tier heuristic, not a live supermarket price. The UI must not turn either into false precision.
