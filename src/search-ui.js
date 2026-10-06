import { RECIPES } from "./data/recipes.js";
import { ingredientById, normalizeIngredient } from "./data/ingredients.js";
import { loadState } from "./domain/storage.js";
import { searchRecipesByIngredients } from "./domain/search.js";
import { inspectExternalRecipeProvenance, renderExternalRecipeProvenance } from "./domain/public-attribution.js";
import { bindRecipeImageFallbacks, recipeImageMarkup } from "./recipe-images-p0-runtime.js";

const app = document.querySelector("#app");
const nav = document.querySelector("#bottomNav");
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
const labelIngredient = id => ingredientById(id)?.name || id?.replaceAll("_", " ") || "";
const euroTier = tier => "€".repeat(Number(tier) || 0);
const finiteNutrition = value => typeof value === "number" && Number.isFinite(value);

const OWNER_CATALOG_API = "/api/protected-corpus/v1";
let ownerCatalogAccess = false;
let ownerCatalogChecked = false;
let searchSurfaceMode = "ingredients";
let ownerCatalogState = { query:"", cursor:"", items:[], loading:false, error:"", detail:null, detailLoading:false };

async function detectOwnerCatalogAccess() {
  if (ownerCatalogChecked) return ownerCatalogAccess;
  ownerCatalogChecked = true;
  try {
    const response = await fetch("/api/auth/session", { credentials:"same-origin", cache:"no-store" });
    if (!response.ok) return false;
    const body = await response.json();
    ownerCatalogAccess = body?.authenticated === true && body?.account?.owner === true;
  } catch {
    ownerCatalogAccess = false;
  }
  return ownerCatalogAccess;
}

function searchScopeControls() {
  if (!ownerCatalogAccess) return "";
  return `<div class="button-row" role="group" aria-label="Search scope">
    <button id="searchIngredientsMode" class="${searchSurfaceMode === "ingredients" ? "primary-action" : "secondary-action"} compact" type="button" aria-pressed="${searchSurfaceMode === "ingredients"}">By ingredients</button>
    <button id="searchAllRecipesMode" class="${searchSurfaceMode === "all-recipes" ? "primary-action" : "secondary-action"} compact" type="button" aria-pressed="${searchSurfaceMode === "all-recipes"}">All recipes · 19,268</button>
  </div>`;
}

function ownerCatalogStateLabel(value) {
  return value === "SEARCHABLE__RECOMMENDATION_VALIDATED"
    ? "Available · recommendation validated"
    : "Available · not recommendation-validated";
}

function ownerCatalogSourceLine(item) {
  return [item?.sourceWork, item?.sourceAuthor, item?.sourceYear].filter(Boolean).join(" · ") || item?.sourceCohortId || "Source recorded";
}

async function requestOwnerCatalog(params) {
  const url = new URL(OWNER_CATALOG_API, location.origin);
  Object.entries(params).forEach(([key,value]) => {
    if (value !== "" && value != null) url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) throw new Error(body?.reason || body?.error || "Owner recipe search is unavailable.");
  return body;
}

function ownerCatalogCard(item) {
  return `<article class="recipe-card search-result-card">
    <div class="recipe-top"><div><p class="eyebrow">Owner corpus · v8018</p><h3>${escapeHtml(item.title)}</h3></div><span class="count-badge">${escapeHtml(item.structuralState || "record")}</span></div>
    <p class="micro">${escapeHtml(ownerCatalogSourceLine(item))}</p>
    <p class="reason">${escapeHtml(ownerCatalogStateLabel(item.recommendationState))}</p>
    <p class="micro">Available in search; recommendation, nutrition and dietary/allergen authority remain separate.</p>
    <button class="secondary-action" type="button" data-owner-catalog-id="${escapeHtml(item.recipeId)}">Open recipe</button>
  </article>`;
}

function ownerCatalogDetail(item) {
  if (!item) return "";
  const ingredients = Array.isArray(item.ingredients) && item.ingredients.length
    ? `<ul>${item.ingredients.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`
    : "<p class='micro'>Ingredient structure unavailable.</p>";
  const methodSteps = Array.isArray(item.methodSteps) && item.methodSteps.length
    ? item.methodSteps
    : (item.directions || []).map(text => ({ text, minutes:null }));
  const directions = methodSteps.length
    ? `<ol>${methodSteps.map(step => `<li>${escapeHtml(step?.text || "")}${step?.minutes == null ? "" : ` <span class="micro">· ${escapeHtml(step.minutes)} min</span>`}</li>`).join("")}</ol>`
    : "<p class='micro'>Method structure unavailable.</p>";
  const facts = [
    item.servings == null ? null : `serves ${item.servings}`,
    item.prepMinutes == null ? null : `prep ${item.prepMinutes} min`,
    item.cookMinutes == null ? null : `cook ${item.cookMinutes} min`,
    item.sourceDifficulty ? `source difficulty ${item.sourceDifficulty}` : null
  ].filter(Boolean).join(" · ");
  const sourceLink = item.sourceUrl
    ? `<p class="micro"><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Source / provenance</a></p>`
    : "";
  return `<section class="panel">
    <div class="section-heading"><div><p class="eyebrow">Recipe detail · all recipes</p><h2>${escapeHtml(item.title)}</h2></div><button id="closeOwnerCatalogDetail" class="secondary-action compact" type="button">Close</button></div>
    <p class="reason">${escapeHtml(ownerCatalogStateLabel(item.recommendationState))}</p>
    <p class="micro">${escapeHtml(ownerCatalogSourceLine(item))}${facts ? ` · ${escapeHtml(facts)}` : ""}</p>
    ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
    <div class="recipe-detail">${ingredients}${directions}${sourceLink}</div>
    <p class="micro"><strong>Authority boundary:</strong> search availability does not grant recommendation, nutrition, dietary/allergen or public-runtime authority.</p>
  </section>`;
}

async function loadOwnerCatalog({ reset = false } = {}) {
  if (!ownerCatalogAccess || ownerCatalogState.loading) return;
  ownerCatalogState = { ...ownerCatalogState, loading:true, error:"" };
  renderUnifiedSearch();
  try {
    const action = ownerCatalogState.query ? "search" : "browse";
    const body = await requestOwnerCatalog({
      action,
      q: action === "search" ? ownerCatalogState.query : "",
      cursor: reset ? "" : ownerCatalogState.cursor,
      limit:24
    });
    const rows = Array.isArray(body.items) ? body.items : [];
    ownerCatalogState = {
      ...ownerCatalogState,
      items:reset ? rows : [...ownerCatalogState.items, ...rows],
      cursor:body.nextCursor || "",
      loading:false,
      error:""
    };
  } catch (error) {
    ownerCatalogState = { ...ownerCatalogState, loading:false, error:String(error?.message || error).slice(0,180) };
  }
  renderUnifiedSearch();
}

async function openOwnerCatalogDetail(recipeId) {
  if (!ownerCatalogAccess || ownerCatalogState.detailLoading) return;
  ownerCatalogState = { ...ownerCatalogState, detailLoading:true, detail:null, error:"" };
  renderUnifiedSearch();
  try {
    const body = await requestOwnerCatalog({ action:"detail", recipeId });
    ownerCatalogState = { ...ownerCatalogState, detailLoading:false, detail:body.item || null };
  } catch (error) {
    ownerCatalogState = { ...ownerCatalogState, detailLoading:false, error:String(error?.message || error).slice(0,180) };
  }
  renderUnifiedSearch();
}

function ownerCatalogForm() {
  const cards = ownerCatalogState.items.map(ownerCatalogCard).join("");
  const status = ownerCatalogState.error
    ? `<section class="shortfall"><strong>Search stopped safely</strong><p>${escapeHtml(ownerCatalogState.error)}</p></section>`
    : ownerCatalogState.loading
      ? "<p class='micro'>Loading all-recipes search…</p>"
      : ownerCatalogState.items.length
        ? `<p class="micro">${ownerCatalogState.items.length.toLocaleString()} records loaded${ownerCatalogState.query ? ` for “${escapeHtml(ownerCatalogState.query)}”` : ""}.</p>`
        : "<p class='micro'>Browse all recipes or search title and recorded source metadata.</p>";
  return `<section class="panel">
    <form id="ownerCatalogSearchForm" class="inline-form">
      <label class="field grow"><span>Search all recipes</span><input id="ownerCatalogQuery" type="search" maxlength="80" value="${escapeHtml(ownerCatalogState.query)}" placeholder="Recipe title, source or author"></label>
      <button class="primary-action compact" type="submit">Search</button>
      <button id="ownerCatalogBrowseAll" class="secondary-action" type="button">Browse all</button>
    </form>
    <p class="hint">This searches the exact v8018 owner corpus. Availability is not the same as recommendation validation.</p>
  </section>
  ${status}
  <section class="recipe-list">${cards}</section>
  ${ownerCatalogState.cursor && !ownerCatalogState.loading ? '<button id="ownerCatalogMore" class="secondary-action" type="button">Load more</button>' : ""}
  ${ownerCatalogState.detailLoading ? "<section class='panel'><p class='micro'>Opening source-backed recipe detail…</p></section>" : ownerCatalogDetail(ownerCatalogState.detail)}`;
}

function bindSearchScope() {
  document.querySelector("#searchIngredientsMode")?.addEventListener("click", () => {
    searchSurfaceMode = "ingredients";
    renderUnifiedSearch();
  });
  document.querySelector("#searchAllRecipesMode")?.addEventListener("click", () => {
    searchSurfaceMode = "all-recipes";
    renderUnifiedSearch();
    if (!ownerCatalogState.items.length && !ownerCatalogState.loading && !ownerCatalogState.error) void loadOwnerCatalog({ reset:true });
  });
}

function bindOwnerCatalog() {
  document.querySelector("#ownerCatalogSearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const query = document.querySelector("#ownerCatalogQuery")?.value.trim().slice(0,80) || "";
    ownerCatalogState = { ...ownerCatalogState, query, cursor:"", items:[], detail:null, error:"" };
    void loadOwnerCatalog({ reset:true });
  });
  document.querySelector("#ownerCatalogBrowseAll")?.addEventListener("click", () => {
    ownerCatalogState = { ...ownerCatalogState, query:"", cursor:"", items:[], detail:null, error:"" };
    void loadOwnerCatalog({ reset:true });
  });
  document.querySelector("#ownerCatalogMore")?.addEventListener("click", () => { void loadOwnerCatalog({ reset:false }); });
  document.querySelectorAll("[data-owner-catalog-id]").forEach(button => button.addEventListener("click", () => {
    void openOwnerCatalogDetail(button.dataset.ownerCatalogId);
  }));
  document.querySelector("#closeOwnerCatalogDetail")?.addEventListener("click", () => {
    ownerCatalogState = { ...ownerCatalogState, detail:null, detailLoading:false };
    renderUnifiedSearch();
  });
}

function option(value, label, selected = false) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}

function searchForm() {
  return `<section class="page-heading search-heading"><div><p class="eyebrow">Fridge-first discovery</p><h1>Cook what you already have</h1><p class="lede">${ownerCatalogAccess ? "Start with ingredients here, or switch to All recipes to browse and search the full 19,268-recipe owner corpus." : "Start with one main ingredient, add whatever else is hanging around, then temporarily tune time, skill and discovery without rewriting your saved profile."}</p></div></section>
  ${searchScopeControls()}
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

function nutritionLabel(recipe) {
  const protein = recipe.nutrition?.perServing?.proteinG;
  return finiteNutrition(protein) ? `~${protein}g protein` : "nutrition evidence pending";
}

function provenanceLine(recipe) {
  const provenance = recipe.provenance;
  if (provenance?.sourceType !== "EXTERNAL_OPEN_RECIPE") {
    return `<p class="micro">Nutrition is a project-authored low-confidence estimate unless the separate reviewed NutritionSource can calculate the full recipe. Cost is a relative tier, not a live supermarket price.</p>`;
  }
  return renderExternalRecipeProvenance(provenance, {
    nutritionNotice: "Source nutrition values are not imported as authoritative composition."
  });
}

function resultCard(item) {
  const recipe = item.recipe;
  if (
    recipe.provenance?.sourceType === "EXTERNAL_OPEN_RECIPE" &&
    !inspectExternalRecipeProvenance(recipe.provenance).allowed
  ) return "";
  const matched = item.secondaryMatches.map(labelIngredient);
  const missing = item.missingSecondary.map(labelIngredient);
  const sourceBadge = recipe.provenance?.sourceType === "EXTERNAL_OPEN_RECIPE" ? " · open external recipe" : " · curated recipe";
  return `<article class="recipe-card search-result-card">
    ${recipeImageMarkup(recipe.id)}
    <div class="recipe-top"><div><p class="eyebrow">${escapeHtml(recipe.culinary.cuisine)} · ingredient match${sourceBadge}</p><h3>${escapeHtml(recipe.identity.canonicalTitle)}</h3></div><span class="cost-pill">${euroTier(recipe.economics.costTier)}</span></div>
    <div class="meta-row"><span>${recipe.time.totalMinutes} min</span><span>Level ${recipe.culinary.difficulty}/4</span><span>${escapeHtml(nutritionLabel(recipe))}</span><span>Novelty ${recipe.discovery.novelty}/4</span></div>
    <p class="reason">Uses <strong>${escapeHtml(labelIngredient(item.mainIngredientId))}</strong>${matched.length ? ` + ${matched.map(escapeHtml).join(", ")}` : ""}. ${escapeHtml(item.explanation)}</p>
    ${missing.length ? `<p class="micro">Also requested but not used in this dish: ${missing.map(escapeHtml).join(", ")}.</p>` : ""}
    <details><summary>Ingredients & method</summary><div class="recipe-detail"><ul>${recipe.ingredients.map(i => `<li>${i.quantity ?? ""} ${escapeHtml(i.unit || "")} ${escapeHtml(labelIngredient(i.canonicalIngredientId))}${i.sourceQuantityExpression ? ` <span class="micro">(${escapeHtml(i.sourceQuantityExpression)})</span>` : ""}</li>`).join("")}</ul><ol>${recipe.instructions.map(step => `<li>${escapeHtml(step.text)}</li>`).join("")}</ol>${provenanceLine(recipe)}</div></details>
  </article>`;
}

function renderSearchResults(result, mainId, secondaryIds) {
  const target = document.querySelector("#searchResults");
  if (!target) return;

  if (!result.catalogMatchCount) {
    target.innerHTML = `<section class="shortfall"><strong>No recipe in the current universe uses ${escapeHtml(labelIngredient(mainId))}</strong><p>The search does not fabricate a recipe or silently replace your main ingredient. Try another ingredient already covered by the recipe universe.</p></section>`;
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
  const renderedCards = result.eligible.map(resultCard).filter(Boolean);
  if (!renderedCards.length) {
    target.innerHTML = `<section class="shortfall"><strong>No public-renderable recipe remains after provenance checks.</strong><p>Required source attribution is incomplete or unclassified, so the app fails closed instead of showing an incomplete public notice.</p></section>`;
    return;
  }
  target.innerHTML = `<section class="search-result-summary"><div><p class="eyebrow">Deterministic results</p><h2>${renderedCards.length} dish${renderedCards.length === 1 ? "" : "es"} for ${escapeHtml(labelIngredient(mainId))}</h2><p class="hint">${coverageCopy}</p></div></section><section class="recipe-list">${renderedCards.join("")}</section>`;
  bindRecipeImageFallbacks(target);
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
      resultTarget.innerHTML = `<section class="shortfall"><strong>Some secondary ingredients are not in the ingredient ontology yet.</strong><p>${secondary.unknown.map(escapeHtml).join(", ")}</p><p>Remove or simplify those names before searching so the app never pretends it understood them.</p></section>`;
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

function renderUnifiedSearch() {
  app.innerHTML = searchSurfaceMode === "all-recipes" && ownerCatalogAccess
    ? `<section class="page-heading search-heading"><div><p class="eyebrow">Recipe discovery</p><h1>Search recipes</h1><p class="lede">Browse or search the full 19,268-recipe owner corpus without treating availability as recommendation validation.</p></div></section>${searchScopeControls()}${ownerCatalogForm()}`
    : searchForm();
  bindSearchScope();
  if (searchSurfaceMode === "all-recipes" && ownerCatalogAccess) bindOwnerCatalog();
  else bindSearchForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function renderIngredientSearch() {
  searchSurfaceMode = "ingredients";
  renderUnifiedSearch();
}

nav?.addEventListener("click", event => {
  const button = event.target.closest('button[data-view="search"]');
  if (!button) return;
  void detectOwnerCatalogAccess().finally(() => renderUnifiedSearch());
});
