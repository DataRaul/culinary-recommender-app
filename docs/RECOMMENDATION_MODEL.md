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

## Portfolio behaviour
The planner greedily selects each requested slot from deterministic ranked candidates, adding a bounded reuse bonus and penalties for repeated cuisine, main protein and flavour. Exact recipe duplication is prohibited inside one plan when enough candidates exist.

## Shortfall principle
Impossible combinations return an explicit shortfall and top hard-filter causes. The engine does not silently relax allergies, dietary mode, maximum skill, maximum time, explicit ingredient exclusions or unresolved availability.
