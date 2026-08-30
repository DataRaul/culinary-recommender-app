import { RECIPES } from "./data/recipes.js";
import { DEFAULT_PANTRY_STAPLES, normalizeIngredient, ingredientById } from "./data/ingredients.js";
import { PRESETS, CUISINES, applyPreset, normalizeProfile } from "./domain/profile.js";
import { planSlots, swapSlot, allWeekSlots } from "./domain/planner.js";
import { buildGroceryList } from "./domain/grocery.js";
import { estimatePortfolioCost } from "./domain/cost.js";
import { loadState, saveState, exportState, importState } from "./domain/storage.js";
import { suggestSubstitutions } from "./domain/substitution.js";

const app = document.querySelector("#app");
const nav = document.querySelector("#bottomNav");
const statusPill = document.querySelector("#statusPill");
const toast = document.querySelector("#toast");
let state = loadState();
let activeView = state.plan ? "plan" : "start";

const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
const euroTier = tier => "€".repeat(Number(tier) || 0);
const labelIngredient = id => ingredientById(id)?.name || id.replaceAll("_", " ");
const selectedSlots = () => allWeekSlots().filter(slot => state.selectedSlotIds.includes(slot.id));

function announce(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function persist() { state = saveState(state); }

function nutritionLine(recipe) {
  const n = recipe.nutrition.perServing;
  return `~${n.energyKcal} kcal · ${n.proteinG}g protein · ${n.fibreG}g fibre`;
}

function renderHeaderStatus() {
  statusPill.textContent = `${RECIPES.length} curated V0 recipes · deterministic`;
}

function profileControls() {
  const p = state.profile;
  const presetOptions = Object.entries(PRESETS).map(([id, preset]) => `<option value="${id}" ${p.preset === id ? "selected" : ""}>${escapeHtml(preset.label)}</option>`).join("");
  const cuisineOptions = CUISINES.filter(item => item !== "Any").map(item => `<label class="check-chip"><input type="checkbox" name="cuisine" value="${escapeHtml(item)}" ${p.cuisinePreferences.includes(item) ? "checked" : ""}><span>${escapeHtml(item)}</span></label>`).join("");
  return `
    <div class="field-grid">
      <label class="field"><span>Preset</span><select id="presetSelect">${presetOptions}</select></label>
      <label class="field"><span>Dietary mode</span><select id="dietaryMode">
        <option value="unrestricted" ${p.dietaryMode === "unrestricted" ? "selected" : ""}>Unrestricted</option>
        <option value="vegetarian" ${p.dietaryMode === "vegetarian" ? "selected" : ""}>Vegetarian</option>
        <option value="vegan" ${p.dietaryMode === "vegan" ? "selected" : ""}>Vegan</option>
      </select></label>
      <label class="field"><span>Maximum total time</span><select id="maxMinutes">
        ${[20,25,30,35,45,60,90].map(value => `<option value="${value}" ${p.maxMinutes === value ? "selected" : ""}>${value} min</option>`).join("")}
      </select></label>
      <label class="field"><span>Cooking skill</span><select id="skill">
        ${[[1,"Beginner"],[2,"Intermediate"],[3,"Advanced"],[4,"Expert"]].map(([value,label]) => `<option value="${value}" ${p.skill === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="field"><span>Budget</span><select id="budget">
        ${[[1,"€ Very economical"],[2,"€€ Moderate"],[3,"€€€ Flexible"],[4,"€€€€ Unrestricted"]].map(([value,label]) => `<option value="${value}" ${p.budget === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="field"><span>Protein emphasis</span><select id="proteinEmphasis">
        ${[[1,"Normal"],[2,"Some"],[3,"High"],[4,"Very high"]].map(([value,label]) => `<option value="${value}" ${p.proteinEmphasis === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="field"><span>Nutrition priority</span><select id="nutritionPriority">
        ${[[1,"Basic awareness"],[2,"Useful"],[3,"Important"],[4,"Highly important"]].map(([value,label]) => `<option value="${value}" ${p.nutritionPriority === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="field"><span>Variety</span><select id="variety">
        ${[[1,"Familiar"],[2,"Balanced"],[3,"Adventurous"],[4,"Exploratory"]].map(([value,label]) => `<option value="${value}" ${p.variety === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="field"><span>Meal prep priority</span><select id="mealPrep">
        ${[[1,"Irrelevant"],[2,"Useful"],[3,"Important"],[4,"Central"]].map(([value,label]) => `<option value="${value}" ${p.mealPrep === value ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
    </div>
    <fieldset class="fieldset"><legend>Cuisine preferences</legend><div class="chip-grid">${cuisineOptions}</div></fieldset>`;
}

function slotPicker() {
  return `<fieldset class="fieldset"><legend>Which meals do you want help with?</legend><p class="hint">Choose only the slots you want. Five is a useful starting point, not a requirement.</p><div class="slot-grid">${allWeekSlots().map(slot => `<label class="slot-chip"><input type="checkbox" name="slot" value="${slot.id}" ${state.selectedSlotIds.includes(slot.id) ? "checked" : ""}><span><strong>${slot.day.slice(0,3)}</strong><small>${slot.mealType}</small></span></label>`).join("")}</div></fieldset>`;
}

function renderStart() {
  app.innerHTML = `<section class="hero"><p class="eyebrow">Cook for the week you actually have</p><h1>What should you cook?</h1><p class="lede">Choose the meals you need, tune the trade-offs, and get a deterministic plan with clear reasons, ingredient reuse, substitutions and a combined grocery list.</p><div class="trust-row"><span>Local-first</span><span>No account</span><span>No AI API</span><span>Explainable scoring</span></div></section>
  <section class="panel"><div class="section-heading"><div><p class="eyebrow">1 · Your priorities</p><h2>Shape this week</h2></div><span class="micro">Everything stays editable.</span></div>${profileControls()}</section>
  <section class="panel"><div class="section-heading"><div><p class="eyebrow">2 · Partial-week planning</p><h2>Pick exact meal slots</h2></div><span id="slotCount" class="count-badge">${selectedSlots().length} selected</span></div>${slotPicker()}</section>
  <section class="action-dock"><button id="generatePlan" class="primary-action" type="button">Build my plan <span aria-hidden="true">→</span></button><p>Hard constraints stay hard. If the corpus runs out, the app shows the shortfall instead of quietly weakening them.</p></section>`;
  bindProfileControls();
  document.querySelectorAll('input[name="slot"]').forEach(input => input.addEventListener("change", () => {
    state.selectedSlotIds = [...document.querySelectorAll('input[name="slot"]:checked')].map(el => el.value);
    persist();
    document.querySelector("#slotCount").textContent = `${state.selectedSlotIds.length} selected`;
  }));
  document.querySelector("#generatePlan").addEventListener("click", generatePlan);
}

function bindProfileControls() {
  const read = () => {
    const cuisines = [...document.querySelectorAll('input[name="cuisine"]:checked')].map(el => el.value);
    state.profile = normalizeProfile({
      ...state.profile,
      dietaryMode: document.querySelector("#dietaryMode")?.value || state.profile.dietaryMode,
      maxMinutes: Number(document.querySelector("#maxMinutes")?.value || state.profile.maxMinutes),
      skill: Number(document.querySelector("#skill")?.value || state.profile.skill),
      budget: Number(document.querySelector("#budget")?.value || state.profile.budget),
      proteinEmphasis: Number(document.querySelector("#proteinEmphasis")?.value || state.profile.proteinEmphasis),
      nutritionPriority: Number(document.querySelector("#nutritionPriority")?.value || state.profile.nutritionPriority),
      variety: Number(document.querySelector("#variety")?.value || state.profile.variety),
      mealPrep: Number(document.querySelector("#mealPrep")?.value || state.profile.mealPrep),
      cuisinePreferences: cuisines
    });
    persist();
  };
  document.querySelector("#presetSelect")?.addEventListener("change", event => {
    state.profile = applyPreset(state.profile, event.target.value);
    persist(); render();
  });
  document.querySelectorAll("#dietaryMode,#maxMinutes,#skill,#budget,#proteinEmphasis,#nutritionPriority,#variety,#mealPrep,input[name='cuisine']").forEach(el => el.addEventListener("change", read));
}

function generatePlan() {
  const slots = selectedSlots();
  if (!slots.length) { announce("Choose at least one meal slot."); return; }
  const result = planSlots(RECIPES, state.profile, slots);
  state.plan = { generatedAt: new Date().toISOString(), items: result.items, shortfalls: result.shortfalls, complete: result.complete };
  state.recommendationHistory = [...state.recommendationHistory.slice(-19), { generatedAt: state.plan.generatedAt, recipeIds: result.items.map(item => item.recipe.id), profile: state.profile }];
  persist(); activeView = "plan"; render();
}

function recipeCard(item) {
  const r = item.recipe;
  const adaptations = item.availability?.adaptations || [];
  return `<article class="recipe-card">
    <div class="recipe-top"><div><p class="eyebrow">${escapeHtml(item.slot.day)} · ${escapeHtml(item.slot.mealType)}</p><h3>${escapeHtml(r.identity.canonicalTitle)}</h3></div><span class="cost-pill" aria-label="Cost tier ${r.economics.costTier} of 4">${euroTier(r.economics.costTier)}</span></div>
    <div class="meta-row"><span>${r.time.totalMinutes} min</span><span>Level ${r.culinary.difficulty}/4</span><span>${escapeHtml(r.culinary.cuisine)}</span><span>${nutritionLine(r)}</span></div>
    <p class="reason">${escapeHtml(item.explanation)}</p>
    ${adaptations.length ? `<div class="adapt-note"><strong>Adapted for availability:</strong> ${adaptations.map(a => `${labelIngredient(a.from)} → ${labelIngredient(a.to)}`).join(", ")}</div>` : ""}
    <details><summary>Ingredients & method</summary><div class="recipe-detail"><ul>${r.ingredients.map(i => `<li>${i.quantity ?? ""} ${escapeHtml(i.unit || "")} ${escapeHtml(labelIngredient(i.canonicalIngredientId))}</li>`).join("")}</ul><ol>${r.instructions.map(step => `<li>${escapeHtml(step.text)}</li>`).join("")}</ol><p class="micro">Nutrition is a low-confidence V0 inferred estimate, not medical advice. Cost is a relative tier, not a live supermarket price.</p></div></details>
    <button class="secondary-action swap-button" type="button" data-slot-id="${item.slot.id}">Swap this dish</button>
  </article>`;
}

function renderPlan() {
  if (!state.plan) { activeView = "start"; renderStart(); return; }
  const cost = estimatePortfolioCost(state.plan.items);
  const grocery = buildGroceryList(state.plan.items, state.profile.pantryStapleIds);
  app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Your deterministic plan</p><h1>${state.plan.items.length} meal${state.plan.items.length === 1 ? "" : "s"}, built as a portfolio</h1><p class="lede">The planner balances individual fit with ingredient reuse and diversity. It does not simply pick the same highest-scoring pattern repeatedly.</p></div><button id="editWeek" class="secondary-action" type="button">Edit priorities</button></section>
    <section class="summary-strip"><div><strong>${state.plan.items.length}</strong><span>meals</span></div><div><strong>${grocery.portions}</strong><span>planned portions</span></div><div><strong>${grocery.shopping.length}</strong><span>shopping lines</span></div><div><strong>${grocery.reusedIngredientCount}</strong><span>reused ingredients</span></div><div><strong>${cost.label}</strong><span>basket tier</span></div></section>
    ${state.plan.shortfalls.length ? `<section class="shortfall"><strong>Plan shortfall</strong><p>I couldn't fill ${state.plan.shortfalls.length} selected slot${state.plan.shortfalls.length === 1 ? "" : "s"} without weakening hard constraints.</p>${state.plan.shortfalls.map(s => `<p>${escapeHtml(s.slot.day)} ${escapeHtml(s.slot.mealType)}: ${s.causes.map(c => `${escapeHtml(c.reason)} (${c.count})`).join("; ") || "no eligible recipe"}</p>`).join("")}</section>` : ""}
    <section class="recipe-list">${state.plan.items.map(recipeCard).join("")}</section>`;
  document.querySelector("#editWeek").addEventListener("click", () => { activeView = "start"; render(); });
  document.querySelectorAll(".swap-button").forEach(button => button.addEventListener("click", () => {
    state.plan = { ...swapSlot(RECIPES, state.profile, state.plan, button.dataset.slotId), generatedAt: new Date().toISOString() };
    persist(); announce("Dish swapped without rebuilding the rest of the plan."); renderPlan();
  }));
}

function renderGroceries() {
  if (!state.plan) { app.innerHTML = emptyPrompt("No grocery list yet", "Build a meal plan first."); return; }
  const grocery = buildGroceryList(state.plan.items, state.profile.pantryStapleIds);
  const cost = estimatePortfolioCost(state.plan.items);
  const line = item => `<li><span><strong>${escapeHtml(item.name)}</strong><small>${item.uses > 1 ? `used in ${item.uses} recipes` : "used once"}</small></span><span>${Number(item.quantity.toFixed?.(2) ?? item.quantity)} ${escapeHtml(item.unit || "")}</span></li>`;
  app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Combined grocery plan</p><h1>One list, normalized where practical</h1><p class="lede">${grocery.meals} meals · ${grocery.portions} planned portions · ${grocery.reusedIngredientCount} reused ingredients · basket tier ${cost.label}</p></div></section>
  <section class="two-column"><div class="panel"><h2>Buy</h2><ul class="grocery-list">${grocery.shopping.map(line).join("") || "<li>Nothing outside your pantry.</li>"}</ul></div><div class="panel"><h2>Pantry staples</h2><ul class="grocery-list">${grocery.pantryItems.map(line).join("") || "<li>No matching staples.</li>"}</ul></div></section>
  ${grocery.substitutions.length ? `<section class="panel"><h2>Substitutions in this plan</h2>${grocery.substitutions.map(item => `<p>${escapeHtml(labelIngredient(item.from))} → <strong>${escapeHtml(labelIngredient(item.to))}</strong>: ${escapeHtml(item.note)}</p>`).join("")}</section>` : ""}
  <section class="confidence-note"><strong>Cost confidence: ${cost.confidence}</strong><p>${escapeHtml(cost.note)}</p></section>`;
}

function renderPantry() {
  const staples = new Set(state.profile.pantryStapleIds);
  const unavailable = new Set(state.profile.unavailableIngredientIds);
  app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Availability memory</p><h1>Pantry & cannot-find list</h1><p class="lede">Staples are assumptions you control. Unavailable ingredients can trigger supported substitutions; if none exists, the recipe is excluded.</p></div></section>
  <section class="panel"><h2>Normally available staples</h2><div class="ingredient-grid">${DEFAULT_PANTRY_STAPLES.concat(["canned_tomato","lentils","chickpeas","white_beans","wholewheat_pasta","potato"]).filter((id,index,array)=>array.indexOf(id)===index).map(id => `<label class="check-row"><input type="checkbox" data-staple="${id}" ${staples.has(id)?"checked":""}><span>${escapeHtml(labelIngredient(id))}</span></label>`).join("")}</div></section>
  <section class="panel"><h2>Currently available</h2><form id="currentPantryForm" class="inline-form"><label class="field grow"><span>Add an ingredient</span><input id="currentPantryInput" placeholder="e.g. chickpeas or garbanzos"></label><button class="secondary-action" type="submit">Add</button></form><div class="token-list">${state.profile.currentPantryIngredientIds.map(id => `<button type="button" data-remove-current="${id}" class="token">${escapeHtml(labelIngredient(id))} ×</button>`).join("") || "<span class='micro'>Nothing added yet.</span>"}</div></section>
  <section class="panel"><h2>Cannot obtain / do not want</h2><form id="unavailableForm" class="inline-form"><label class="field grow"><span>Add an ingredient</span><input id="unavailableInput" placeholder="e.g. tahini"></label><button class="secondary-action" type="submit">Remember</button></form><div class="token-list">${[...unavailable].map(id => `<button type="button" data-remove-unavailable="${id}" class="token warning-token">${escapeHtml(labelIngredient(id))} ×</button>`).join("") || "<span class='micro'>No availability exclusions saved.</span>"}</div></section>
  <section class="panel"><h2>Try a substitution</h2><form id="substitutionForm" class="inline-form"><label class="field grow"><span>Ingredient</span><input id="substitutionInput" placeholder="e.g. feta"></label><button class="secondary-action" type="submit">Check</button></form><div id="substitutionResult" class="result-box" aria-live="polite"></div></section>`;
  document.querySelectorAll("[data-staple]").forEach(el => el.addEventListener("change", () => {
    const set = new Set(state.profile.pantryStapleIds); el.checked ? set.add(el.dataset.staple) : set.delete(el.dataset.staple); state.profile.pantryStapleIds = [...set]; persist();
  }));
  bindIngredientForm("#currentPantryForm", "#currentPantryInput", "currentPantryIngredientIds");
  bindIngredientForm("#unavailableForm", "#unavailableInput", "unavailableIngredientIds");
  document.querySelectorAll("[data-remove-current]").forEach(el => el.addEventListener("click",()=>removeIngredient("currentPantryIngredientIds",el.dataset.removeCurrent)));
  document.querySelectorAll("[data-remove-unavailable]").forEach(el => el.addEventListener("click",()=>removeIngredient("unavailableIngredientIds",el.dataset.removeUnavailable)));
  document.querySelector("#substitutionForm").addEventListener("submit", event => {
    event.preventDefault(); const id = normalizeIngredient(document.querySelector("#substitutionInput").value); const target = document.querySelector("#substitutionResult");
    if (!id) { target.innerHTML = "<p>I don't recognize that ingredient in the V0 ontology yet.</p>"; return; }
    const options = suggestSubstitutions(id, state.profile);
    target.innerHTML = options.length ? `<p><strong>${escapeHtml(labelIngredient(id))}</strong></p>${options.map(o=>`<p>${escapeHtml(labelIngredient(o.ingredientId))} · ${escapeHtml(o.type.replaceAll("_"," "))}<br><span class="micro">${escapeHtml(o.note)}</span></p>`).join("")}` : `<p>No supported substitute is encoded for ${escapeHtml(labelIngredient(id))}. The app will not pretend an approximation exists.</p>`;
  });
}

function bindIngredientForm(formSelector, inputSelector, key) {
  document.querySelector(formSelector).addEventListener("submit", event => {
    event.preventDefault(); const input = document.querySelector(inputSelector); const id = normalizeIngredient(input.value);
    if (!id) { announce("That ingredient is not in the V0 ontology yet."); return; }
    state.profile[key] = [...new Set([...state.profile[key], id])]; persist(); renderPantry();
  });
}
function removeIngredient(key,id) { state.profile[key] = state.profile[key].filter(value=>value!==id); persist(); renderPantry(); }

function renderProfile() {
  app.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Saved locally</p><h1>Profile & privacy</h1><p class="lede">No account or server is required. Your profile, plan and availability memory stay in this browser unless you export them.</p></div></section><section class="panel">${profileControls()}<div class="button-row"><button id="applyProfile" class="primary-action compact" type="button">Save profile</button><button id="exportProfile" class="secondary-action" type="button">Export JSON</button><label class="secondary-action file-button">Import JSON<input id="importProfile" type="file" accept="application/json" hidden></label></div></section><section class="confidence-note"><strong>Safety boundary</strong><p>For generally healthy adults. Nutrition is approximate educational information. Declared allergies are treated as hard filters where mapped, but this small corpus cannot guarantee allergen safety or cross-contamination.</p></section>`;
  bindProfileControls();
  document.querySelector("#applyProfile").addEventListener("click",()=>{ persist(); announce("Profile saved locally."); });
  document.querySelector("#exportProfile").addEventListener("click",()=>{
    const blob = new Blob([exportState(state)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`culinary-recommender-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  });
  document.querySelector("#importProfile").addEventListener("change", async event => { const file=event.target.files?.[0]; if(!file)return; try{state=importState(await file.text());persist();announce("Backup imported.");render();}catch(error){announce(error.message);} });
}

function emptyPrompt(title, body) { return `<section class="empty-state"><p class="eyebrow">Nothing here yet</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p><button class="primary-action compact" id="emptyStart">Start planning</button></section>`; }

function render() {
  renderHeaderStatus();
  nav.hidden = false;
  document.querySelectorAll("#bottomNav button").forEach(button => button.classList.toggle("active", button.dataset.view === activeView));
  if (activeView === "start") renderStart();
  if (activeView === "plan") renderPlan();
  if (activeView === "groceries") renderGroceries();
  if (activeView === "pantry") renderPantry();
  if (activeView === "profile") renderProfile();
  document.querySelector("#emptyStart")?.addEventListener("click",()=>{activeView="start";render();});
  window.scrollTo({top:0,behavior:state.preferences.reducedMotion?"auto":"smooth"});
}

nav.addEventListener("click", event => {
  const button = event.target.closest("button[data-view]"); if (!button) return; activeView = button.dataset.view; render();
});
document.querySelector("#brandButton").addEventListener("click",()=>{activeView=state.plan?"plan":"start";render();});

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
