# Nutrition B24 — Reviewed Feta Composition

Status: **CANDIDATE / EVIDENCE-GATED**

## Scope

B24 adds one bounded static composition record from the official Norwegian Food Composition Table 2026 for canonical `feta`.

Reviewed source record:

- Food ID: `01.188`
- source name: `Cheese, goat milk, Feta`
- FoodEx2: `Cheese, feta (A02RC)`
- energy: 1,081 kJ / 260 kcal per 100 g
- protein: 18.1 g per 100 g (`620`)
- available carbohydrate: 0.2 g per 100 g (`MI0181`)
- fat: 20.8 g per 100 g (`620`)
- dietary fibre: 0.0 g per 100 g (`50`, source-published logical zero)

## Identity boundary

The record is explicitly classified as feta, but the product name is narrower than the app's generic `feta` identity because it specifies goat milk. B24 therefore retains **medium** form confidence and preserves that qualifier in per-nutrient provenance.

B24 does not claim that all feta has identical composition and does not authorize sheep-milk, cow-milk or mixed-milk feta as separate identities. It does not authorize cottage cheese, ricotta, Parmesan, mozzarella, halloumi or generic goat cheese.

## Source-role boundary

B24 is **composition-only** evidence. It does not import or infer a household portion, edible-yield conversion, source recipe nutrition, dietary classification or allergen claim.

The existing carbohydrate semantic firewall remains unchanged: Matvaretabellen available carbohydrate cannot be summed into an authoritative recipe carbohydrate total with USDA carbohydrate-by-difference.

## Expected authored-corpus effect

The authored corpus has one direct-mass feta use: `med_lentil_feta_salad`, 90 g crumbled feta. B24 is expected to remove that feta `missing_density` event while the recipe remains estimate-preserved because generic `lentils` remains unresolved under the current strict evidence contract.

Candidate expectations to be validated by repository CI:

- authoritative authored recipes: 16 / 76 (unchanged)
- estimate-preserved authored recipes: 60 / 76 (unchanged)
- `missing_density`: 89 → 88
- ambiguous portion, unsupported quantity, tracked-field and carbohydrate-semantic blockers: unchanged

No Knowledge Core write, corpus admission, public-runtime expansion, billing authorization or Step 7F authority is part of B24.
