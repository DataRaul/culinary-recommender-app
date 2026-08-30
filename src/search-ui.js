import { RECIPES } from "./data/recipes.js";
import { ingredientById, normalizeIngredient } from "./data/ingredients.js";
import { loadState } from "./domain/storage.js";
import { searchRecipesByIngredients } from "./domain/search.js";

const app = document.querySelector("#app");
const nav = document.querySelector("#bottomNav");
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
const labelIngredient = id => ingredientById(id)?.name || id?.replaceAll("_", " ") || "";
const euroTier = tier => "€".repeat(Number(tier) || 0);

function option(value, label, selected = false) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}

function searchForm() {
  return `<section class="page-heading search-heading"><div><p class="eyebrow">Fridge-first discovery</p><h1>Cook what you already have</h1><p class="lede">Start with one main ingredient, add whatever else is hanging around, then temporarily tune time, skill and discovery without rewriting your saved profile.</p></div></section>
  <section class="panel">
    <form id="ingredientSearchForm">
      <div class="search-ingredient-grid">
        <label class="field"><span>Main ingredient · required</span><input id="searchMainIngredient" autocomplete="off" placeholder="e.g. salmon, chickpeas, tofu" required></label>
        <label class="field"><span>Other ingredients · optional</span><input id="searchSecondaryIngredients" autocomplete="off" placeholder="e.g. rice, cabbage, lemon"></label>
      </div>
      <p class="hint">The main ingredient is a hard pre-filter. Other ingredients improve ranking; turn on “require all” when you specifically need to use every listed item.</p>
      <label class="check-row search-check"><input id="searchRequireAll" type="checkbox"><span>Require all listed secondary ingredients</span></label>
      <div class="search-intent-grid">
        <label class="field"><span>Cooking for</span><select id="searchMealType">
          ${option("any", "Any meal", true)}
          ${option("lunch", "Lunch")}
          ${option("dinner", "Dinner")}
        </select></label>
        <label class="field"><span>Recommendation lens</span><select id="searchProfileMode">
          ${option("profile", "Use my saved preferences", true)}
          ${option("ingredients", "Ingredients first · neutral preferences")}
        </select></label>
        <label class="field"><span>Time today</span><select id="searchTime">
          ${option("profile", "Use saved time limit", true)}
          ${option("20", "Very fast · ≤20 min")}
          ${option("30", "Fast · ≤30 min")}
          ${option("45", "I have time · ≤45 min")}
          ${option("60", "Leisurely · ≤60 min")}
          ${option("180", "No practical time limit")}
        </select></label>
        <label class="field"><span>Effort / skill today</span><select id="searchSkill">
          ${option("profile", "Use saved skill", true)}
          ${option("1", "Beginner-simple")}
          ${option("2", "Intermediate")}
          ${option("3", "Advanced")}
          ${option("4", "Expert / anything")}
        </select></label>
        <label class="field"><span>Discovery mood</span><select id="searchVariety">
          ${option("profile", "Use saved variety", true)}
          ${option("1", "Familiar")}
          ${option("2", "Balanced")}
          ${option("3", "Adventurous")}
          ${option("4", "Explore something new")}
        </select></label>
      </div>
      <div class="search-safety-note"><strong>Safety stays on.</strong> Dietary mode, declared allergens, explicit exclusions and unavailable ingredients remain hard constraints even when you choose the neutral “ingredients first” lens. Lunch/dinner priority packs apply only when that meal context is selected.</div>
      <button class="primary-action search-submit" type="submit">Find dishes <span aria-hidden="true">→</span></button>
    </form>
  </section>
  <section id="searchResults" aria-live="polite"></section>`;
}

function resultCard(item) {
  const recipe = item.recipe;
  const matched = item.secondaryMatches.map(labelIngredient);
  const missing = item.missingSecondary.map(labelIngredient);
  const n = recipe.nutrition.perServing;
  return `<article class="recipe-card search-result-card">
    <div class="recipe-top"><div><p class="eyebrow">${escapeHtml(recipe.culinary.cuisine)} · ingredient match</p><h3>${escapeHtml(recipe.identity.canonicalTitle)}</h3></div><span class="cost-pill">${euroTier(recipe.economics.costTier)}</span></div>
    <div class="meta-row"><span>${recipe.time.totalMinutes} min</span><span>Level ${recipe.culinary.difficulty}/4</span><span>~${n.proteinG}g protein</span><span>Novelty ${recipe.discovery.novelty}/4</span></div>
    <p class="reason">Uses <strong>${escapeHtml(labelIngredient(item.mainIngredientId))}</strong>${matched.length ? ` + ${matched.map(escapeHtml).join(", ")}` : ""}. ${escapeHtml(item.explanation)}</p>
    ${missing.length ? `<p class="micro">Also requested but not used in this dish: ${missing.map(escapeHtml).join(", ")}.</p>` : ""}
    <details><summary>Ingredients & method</summary><div class="recipe-detail"><ul>${recipe.ingredients.map(i => `<li>${i.quantity ?? ""} ${escapeHtml(i.unit || "")} ${escapeHtml(labelIngredient(i.canonicalIngredientId))}</li>`).join("")}</ul><ol>${recipe.instructions.map(step => `<li>${escapeHtml(step.text)}</li>`).join("")}</ol><p class="micro">Nutrition is a low-confidence V0 inferred estimate. Cost is a relative tier, not a live supermarket price.</p></div></details>
  </article>`;
}

function renderSearchResults(result, mainId, secondaryIds) {
  const target = document.querySelector("#searchResults");
  if (!target) return;

  if (!result.catalogMatchCount) {
    target.innerHTML = `<section class="shortfall"><strong>No V0 recipe currently uses ${escapeHtml(labelIngredient(mainId))}</strong><p>The search does not fabricate a recipe or silently replace your main ingredient. Try another ingredient already covered by the corpus.</p></section>`;
    return;
  }

  if (!result.eligible.length) {
    const blockers = result.shortfall.map(item => `${escapeHtml(item.reason)} (${item.count})`).join("; ");
    const secondaryNote = result.requiredSecondaryMismatchCount
      ? `<p>${result.requiredSecondaryMismatchCount} main-ingredient recipe(s) were also removed because “require all secondary ingredients” was enabled.</p>`
      : "";
    target.innerHTML = `<section class="shortfall"><strong>${result.catalogMatchCount} recipe(s) use ${escapeHtml(labelIngredient(mainId))}, but none survive today's constraints.</strong><p>${blockers || "No eligible recipe remains under the selected search settings."}</p>${secondaryNote}<p class="micro">Nothing was silently relaxed.</p></section>`;
    return;
  }

  const coverageCopy = secondaryIds.length
    ? `Secondary ingredients are ranked by exact use${result.requiredSecondaryMismatchCount ? `; ${result.requiredSecondaryMismatchCount} candidate(s) were excluded by the require-all setting` : ""}.`
    : "Add secondary ingredients when you want to prioritize leftovers that pair with the main ingredient.";
  target.innerHTML = `<section class="search-result-summary"><div><p class="eyebrow">Deterministic results</p><h2>${result.eligible.length} dish${result.eligible.length === 1 ? "" : "es"} for ${escapeHtml(labelIngredient(mainId))}</h2><p class="hint">${coverageCopy}</p></div></section><section class="recipe-list">${result.eligible.map(resultCard).join("")}</section>`;
}

function parseSecondary(raw) {
  const tokens = raw.split(",").map(value => value.trim()).filter(Boolean);
  const recognized = [];
  const unknown = [];
  for (const token of tokens) {
    const id = normalizeIngredient(token);
    if (id) recognized.push(id); else unknown.push(token);
  }
  return { recognized: [...new Set(recognized)], unknown };
}

function bindSearchForm() {
  const form = document.querySelector("#ingredientSearchForm");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const mainText = document.querySelector("#searchMainIngredient").value.trim();
    const mainId = normalizeIngredient(mainText);
    const resultTarget = document.querySelector("#searchResults");
    if (!mainId) {
      resultTarget.innerHTML = `<section class="shortfall"><strong>I don't recognize “${escapeHtml(mainText)}” yet.</strong><p>Try a simpler ingredient name such as salmon, rice, chickpeas, tofu, potato or their Spanish aliases.</p></section>`;
      return;
    }

    const secondary = parseSecondary(document.querySelector("#searchSecondaryIngredients").value);
    if (secondary.unknown.length) {
      resultTarget.innerHTML = `<section class="shortfall"><strong>Some secondary ingredients are not in the V0 ontology yet.</strong><p>${secondary.unknown.map(escapeHtml).join(", ")}</p><p>Remove or simplify those names before searching so the app never pretends it understood them.</p></section>`;
      return;
    }

    const state = loadState();
    const timeValue = document.querySelector("#searchTime").value;
    const skillValue = document.querySelector("#searchSkill").value;
    const varietyValue = document.querySelector("#searchVariety").value;
    const mealTypeValue = document.querySelector("#searchMealType").value;
    const result = searchRecipesByIngredients(RECIPES, state.profile, {
      mainIngredientId: mainId,
      secondaryIngredientIds: secondary.recognized,
      requireAllSecondary: document.querySelector("#searchRequireAll").checked,
      followProfilePreferences: document.querySelector("#searchProfileMode").value === "profile",
      mealType: mealTypeValue === "any" ? null : mealTypeValue,
      maxMinutes: timeValue === "profile" ? null : Number(timeValue),
      skill: skillValue === "profile" ? null : Number(skillValue),
      variety: varietyValue === "profile" ? null : Number(varietyValue)
    });
    renderSearchResults(result, mainId, secondary.recognized);
  });
}

export function renderIngredientSearch() {
  app.innerHTML = searchForm();
  bindSearchForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nav?.addEventListener("click", event => {
  const button = event.target.closest('button[data-view="search"]');
  if (!button) return;
  renderIngredientSearch();
});
