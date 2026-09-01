from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"expected marker not found in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))


def normalize_trailing_whitespace(path):
    p = Path(path)
    text = p.read_text()
    p.write_text("\n".join(line.rstrip() for line in text.splitlines()) + "\n")


replace_once(
    "README.md",
    "| Nutrition evidence | ✅ MULTI-SOURCE POLICY ACTIVE | V1.1.1 B7 COMPLETE | residual composition/form + exact quantity unlocks |",
    "| Nutrition evidence | ✅ MULTI-SOURCE POLICY ACTIVE | V1.1.2 B8 CANDIDATE | first authoritative authored recipe earned; residual composition/form + semantic unlocks |",
)

readme = Path("README.md")
text = readme.read_text()
marker = "\n## Culinary & Nutrition Brain P0\n"
if "## Nutrition B8 — first authoritative recipe candidate" not in text:
    if marker not in text:
        raise SystemExit("README B8 insertion marker missing")
    section = """
## Nutrition B8 — first authoritative recipe candidate

B8 keeps recipe-level unlock value as the optimization target. One exact USDA FoodData Central **SR Legacy final-release (2018-04)** quantity row is admitted: raw onion FDC `170000` / NDB `11282`, portion row `85862`, explicitly labelled `small`, **1 = 70 g**. This is a quantity-only B8 lane: SR Legacy composition is not imported, ordinary onion `piece` remains the B6 Matvaretabellen 160 g mapping, and no diameter, red-onion or other size inference is introduced.

Candidate validation run `33494074325` measured the first complete authoritative authored recipe, **`indian_chicken_spinach_curry`**, moving the authored baseline to **1 / 76 authoritative** and **75 / 76 estimate-preserved**. Missing-density blockers remain **133**, unsupported quantity falls **27 → 7**, explicit ambiguous portions remain **20**, and mixed incompatible carbohydrate semantics remain **16**. Missing tracked-field events remain carbohydrate 28, energy 5, fat 65 and fibre 36.

B8 also exactly reviewed the highest-priority Foundation 2026-04 candidates without promoting weak or non-unlocking rows. Dry lentils, 93/7 raw ground turkey and full-fat cottage cheese remain deferred because tracked fibre is unpublished; turkey/cottage cheese are additionally more form-specific than their canonical IDs. Sesame butter remains deferred for tahini identity review; iodized salt is rejected for complete composition because tracked macros/fibre are unpublished; crushed canned tomato is not passata; prepared edamame is not forced onto an unspecified preparation state; exact smoked paprika remains unresolved. See `docs/NUTRITION_COVERAGE_AUDIT.md` and `scripts/usda-foundation-b8-reviewed-decisions.json`.

"""
    readme.write_text(text.replace(marker, "\n" + section + "## Culinary & Nutrition Brain P0\n", 1))

replace_once(
    "docs/ROADMAP.md",
    "| V1.x / Recipe-unlock evidence | NEXT | target residual composition/form, nutrient-field and exact quantity blockers by recipe-level unlock value; independent of external RecipeSource breadth |",
    "| V1.1.2 / Nutrition B8 | CANDIDATE | exact SR Legacy small-onion quantity evidence earns first authoritative authored recipe; strict Foundation review defers partial/wrong-form rows |\n| V1.x / Recipe-unlock evidence | CONTINUOUS | target residual composition/form, nutrient-field and exact quantity blockers by recipe-level unlock value; independent of external RecipeSource breadth |",
)

roadmap = Path("docs/ROADMAP.md")
text = roadmap.read_text()
marker = "\n## Culinary & Nutrition Brain P0 — authorized foundation and active Atlas development\n"
if "## Nutrition B8 — first authoritative recipe candidate" not in text:
    if marker not in text:
        raise SystemExit("ROADMAP B8 insertion marker missing")
    section = """
## Nutrition B8 — first authoritative recipe candidate

B8 admits one exact USDA FoodData Central SR Legacy portion row: raw onion FDC `170000` / NDB `11282`, portion row `85862`, source modifier `small`, **70 g**. The source is quantity-only in B8; composition-source policy remains Foundation + Ciqual, Matvaretabellen remains B6 portion-only, and no generic-small or diameter inference is introduced.

Candidate run `33494074325` passed 104/104 deterministic tests and measured **1/76 authoritative authored recipes**: `indian_chicken_spinach_curry`. Unsupported quantity falls **27→7**; missing density remains **133**, ambiguous portions **20**, mixed carbohydrate semantics **16**, and tracked-field gaps remain visible separately.

Exact Foundation 2026-04 review also confirms that dry lentils, 93/7 raw ground turkey and full-fat cottage cheese are partial because tracked fibre is unpublished; tahini/sesame-butter identity remains insufficiently strict for this tranche; iodized salt is incomplete for tracked composition; crushed canned tomato is not passata; prepared edamame is not mapped to an unspecified state; exact smoked paprika remains unresolved. B8 therefore prefers one earned recipe unlock to a larger but weaker evidence ledger.

"""
    roadmap.write_text(text.replace(marker, "\n" + section + "## Culinary & Nutrition Brain P0 — authorized foundation and active Atlas development\n", 1))

append_sections = {
    "docs/GATES.md": """

## Nutrition B8 — first authoritative recipe candidate

B8 stays inside the approved fail-closed contract and adds one bounded quantity-only USDA FoodData Central SR Legacy row: raw onion FDC `170000` / NDB `11282`, exact portion row `85862`, modifier `small`, 70 g. SR Legacy composition is not imported. Generic onion piece remains the B6 160 g Matvaretabellen row and no size/diameter/red-onion inference is allowed.

Candidate run `33494074325` measured 1/76 authoritative authored recipes (`indian_chicken_spinach_curry`), 75/76 estimate-preserved, missing-density 133, unsupported quantity 7, ambiguous portions 20 and mixed carbohydrate semantics 16. Foundation review decisions remain fail-closed in `scripts/usda-foundation-b8-reviewed-decisions.json`; no weak candidate is promoted for count.
""",
    "docs/EUROPEAN_EVIDENCE.md": """

## Nutrition B8 — source-policy boundary preserved

B8 does not broaden the approved Foundation + Ciqual composition policy. Its only admitted runtime evidence is an exact USDA SR Legacy **portion** row for raw `onion|small` = 70 g (FDC `170000`, NDB `11282`, portion row `85862`). Matvaretabellen remains quantity-only under B6 and SR Legacy remains quantity-only under B8. A future Norwegian or SR-Legacy composition lane would require separate reviewed policy rather than being inferred from portion-source approval.

The resulting authored audit is 1/76 authoritative, with unsupported quantity reduced from 27 to 7 while missing density remains 133, ambiguous portions 20 and mixed carbohydrate semantics 16.
""",
    "docs/TESTING.md": """

## Nutrition B8 candidate checks

B8 adds deterministic proof that the SR Legacy final-release raw-onion row is pinned exactly to FDC `170000`, NDB `11282`, portion row `85862`, modifier `small`, 70 g; only canonical `onion|small` may use it. Generic onion piece stays on the B6 Matvaretabellen 160 g mapping, red onion and other size classes remain unsupported by this evidence, and SR Legacy is not a composition source in B8.

The B8 review-decision tests also prove that partial/form-qualified Foundation candidates remain unpromoted, crushed canned tomato does not become passata, prepared edamame is not forced onto an unspecified form, generic paprika does not become smoked paprika, and missing nutrient fields remain unknown rather than assumed zero.
""",
}

for path, section in append_sections.items():
    p = Path(path)
    text = p.read_text()
    heading = section.strip().splitlines()[0]
    if heading not in text:
        p.write_text(text.rstrip() + section.rstrip() + "\n")

for path in (
    "README.md",
    "docs/ROADMAP.md",
    "docs/GATES.md",
    "docs/EUROPEAN_EVIDENCE.md",
    "docs/TESTING.md",
):
    normalize_trailing_whitespace(path)
