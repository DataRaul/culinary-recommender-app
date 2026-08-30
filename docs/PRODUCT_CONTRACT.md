# Product Contract — V0

## Purpose
Culinary Recommender is a public, mobile-first recommendation and discovery system for generally healthy adults. It helps users select only the meals they need and balances nutrition awareness, affordability, time, skill, cuisine, protein emphasis, variety, meal-prep utility, availability and pantry reuse.

It is not primarily a diet app and does not assign permanent personas. Presets are editable starting points over independent dimensions.

## V0 boundaries
- deterministic local recommendation policy;
- no runtime LLM calls;
- no account/backend requirement;
- no paid inference or data API;
- no private Knowledge Core runtime access;
- no diagnosis, therapeutic diet prescription or individualized supplement dosing;
- hard constraints fail closed rather than being silently relaxed;
- local browser persistence with explicit schema versioning and JSON export/import.

## Geography
The primary food environment is Canary Islands → Spain → Mediterranean Europe, while cuisine discovery remains global. Geography informs likely availability, substitution and cost confidence; it does not restrict cuisine.

## Evidence language
Nutrition values in the project-authored V0 corpus are explicitly labelled `INFERRED_ESTIMATE` with low confidence. Cost is a four-tier heuristic, not a live supermarket price. The UI must not turn either into false precision.
