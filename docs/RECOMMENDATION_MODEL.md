# Deterministic Recommendation Model V0

## Order of operations
1. normalize profile;
2. apply hard meal-type, dietary, skill, time, permanent ingredient and declared-allergen constraints;
3. resolve known temporary-availability substitutions; unresolved required ingredients fail closed;
4. score eligible recipes by interpretable base components;
5. apply bounded soft priority-pack bonuses that match the current meal scope;
6. stable-sort by score then recipe ID;
7. build the requested portfolio with ingredient-reuse bonus and cuisine/protein/flavour repetition penalties;
8. expose shortfall causes if selected slots cannot be filled.

## Base components
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

## Composable priority packs
Priority packs are optional, inspectable soft lenses over the base score. A profile may hold at most three unique packs, each scoped to `all`, `lunch` or `dinner`.

Current packs cover budget/ease, healthy convenience, premium healthy, meal prep, culinary exploration, technique building, high-protein convenience and weeknight speed. Each pack maps to recipe-level signals such as speed, simplicity, nutrition, protein, meal-prep suitability, batch suitability, leftovers, portability, novelty and learning value.

Only packs matching the current meal context contribute. Their combined additive bonus is capped at **0.24**, preventing stacked soft preferences from overpowering hard constraints or making the base scoring unreadable. Hard dietary, allergen, time, skill, exclusion and unresolved-availability rules always execute first.

This permits patterns such as **Meal Prep → Lunch** plus **Culinary Explorer → Dinner** without mutating the user's base skill/time/diet profile or pretending that a single persona describes every meal.

## Cuisine behavior
Cuisine preference is independent of priority packs. Multiple cuisines can be selected simultaneously. A matching cuisine receives the existing soft cuisine-fit benefit; non-matching cuisines remain eligible. No selected cuisine therefore becomes a hidden hard filter.

## Ingredient availability and permanent exclusions
Temporary availability and durable dislike are separate state machines.

### Temporary unavailable
`unavailableIngredientIds` means the ingredient cannot be obtained right now. The availability resolver may choose the first supported substitute that survives all hard safety and preference constraints. If a required unavailable ingredient has no supported candidate, the recipe is rejected.

### Permanent exclusion
`excludedIngredientIds` means the ingredient must not appear. The hard-filter pass removes recipes before scoring, and substitution candidates are checked against the same exclusion boundary so a replacement can never reintroduce a permanent dislike.

Exclusions may be exact canonical IDs or encoded ingredient-family IDs. Family matching uses the canonical ingredient ontology. For example, exclusion token `coconut` matches `coconut_milk` because that ingredient belongs to the coconut family. This allows a user to express **no coconut in any encoded form**, rather than accidentally excluding only one current representation.

Unknown but well-formed future tokens can persist in local profile state. They do not create fake knowledge or block unrelated recipes; if a future corpus later uses the same canonical token, the stored hard preference immediately applies.

## Declared allergens
Declared allergens are hard filters over the recipe's mapped allergen metadata and over substitution candidates. They are not soft score components. The user-facing V0 vocabulary matches the current ontology: gluten, milk, egg, fish, crustacean, soy, peanut, tree nut and sesame. This mechanism cannot establish cross-contamination safety.

## Fridge-first search
Search uses the same evaluator rather than a separate recommendation truth.

1. Normalize the requested main ingredient and optional secondary ingredients through the canonical ingredient ontology.
2. Hard pre-filter the corpus to recipes that explicitly contain the main ingredient.
3. If `require all secondary ingredients` is enabled, remove candidates that omit any requested secondary ingredient.
4. Build a temporary search profile. The user may keep saved soft preferences or neutralize them, and may temporarily override meal context, maximum time, skill ceiling and variety/discovery mood.
5. Dietary mode, declared allergens, permanent ingredient exclusions and unresolved temporary availability remain hard constraints in both profile modes.
6. When saved preferences are used, a selected lunch/dinner search context activates only the matching scoped priority packs. `Any meal` activates only all-meals packs.
7. Choosing the neutral ingredients-first lens clears cuisine and priority-pack soft preferences but leaves all safety constraints intact.
8. Rank eligible candidates first by the number of exact secondary-ingredient matches, then by the deterministic recommendation score, then by recipe ID.
9. Report blocked candidates and dominant hard-filter causes when nothing survives. No ingredient or profile constraint is silently substituted or relaxed.

This makes searches such as `salmon + rice` deterministic: recipes containing both rank ahead of salmon recipes that do not use rice, while the user's temporary intent can still favor fast/simple or more exploratory choices among eligible recipes.

## Portfolio behaviour
The planner greedily selects each requested slot from deterministic ranked candidates, adding a bounded reuse bonus and penalties for repeated cuisine, main protein and flavour. Exact recipe duplication is prohibited inside one plan when enough candidates exist.

## Shortfall principle
Impossible combinations return an explicit shortfall and top hard-filter causes. The engine does not silently relax allergies, dietary mode, maximum skill, maximum time, permanent ingredient exclusions or unresolved availability.
