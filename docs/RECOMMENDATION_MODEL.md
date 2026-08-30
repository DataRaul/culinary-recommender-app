# Deterministic Recommendation Model V0

## Order of operations
1. normalize profile;
2. apply hard meal-type, dietary, skill, time, explicit ingredient and declared-allergen constraints;
3. resolve known availability substitutions; unresolved required ingredients fail closed;
4. score eligible recipes by interpretable components;
5. stable-sort by score then recipe ID;
6. build the requested portfolio with ingredient-reuse bonus and cuisine/protein/flavour repetition penalties;
7. expose shortfall causes if selected slots cannot be filled.

## Components
- nutrition fit;
- budget fit;
- speed fit;
- skill fit;
- cuisine fit;
- protein emphasis;
- meal-prep fit;
- novelty/variety fit;
- availability fit;
- current-pantry utilization;
- substitution burden penalty.

Weights are public V0 heuristics, not learned medical or behavioural truth. They are deliberately isolated behind the recommendation boundary so a later public-safe Brain-derived policy can replace them without UI coupling.

## Fridge-first search
Search uses the same evaluator rather than a separate recommendation truth.

1. Normalize the requested main ingredient and optional secondary ingredients through the canonical ingredient ontology.
2. Hard pre-filter the corpus to recipes that explicitly contain the main ingredient.
3. If `require all secondary ingredients` is enabled, remove candidates that omit any requested secondary ingredient.
4. Build a temporary search profile. The user may keep saved soft preferences or neutralize them, and may temporarily override maximum time, skill ceiling and variety/discovery mood.
5. Dietary mode, declared allergens, explicit ingredient exclusions and unresolved availability remain hard constraints in both profile modes.
6. Rank eligible candidates first by the number of exact secondary-ingredient matches, then by the deterministic recommendation score, then by recipe ID.
7. Report blocked candidates and dominant hard-filter causes when nothing survives. No ingredient or profile constraint is silently substituted or relaxed.

This makes searches such as `salmon + rice` deterministic: recipes containing both rank ahead of salmon recipes that do not use rice, while the user's temporary intent can still favor fast/simple or more exploratory choices among eligible recipes.

## Portfolio behaviour
The planner greedily selects each requested slot from deterministic ranked candidates, adding a bounded reuse bonus and penalties for repeated cuisine, main protein and flavour. Exact recipe duplication is prohibited inside one plan when enough candidates exist.

## Shortfall principle
Impossible combinations return an explicit shortfall and top hard-filter causes. The engine does not silently relax allergies, dietary mode, maximum skill, maximum time, explicit ingredient exclusions or unresolved availability.
