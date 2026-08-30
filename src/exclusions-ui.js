import { loadState, saveState } from "./domain/storage.js";
import { resolvePermanentExclusion, permanentExclusionLabel } from "./domain/exclusions.js";

const RETURN_KEY = "culinary-recommender.return-pantry";
const MESSAGE_KEY = "culinary-recommender.exclusion-message";

function showMessage(message) {
  const toast = document.querySelector("#toast");
  if (!toast || !message) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 2800);
}

function reloadToPantry(message) {
  sessionStorage.setItem(RETURN_KEY, "1");
  sessionStorage.setItem(MESSAGE_KEY, message);
  location.reload();
}

function savePermanentExclusion(raw) {
  const resolved = resolvePermanentExclusion(raw);
  if (!resolved) return { ok: false, message: "Enter an ingredient to exclude." };
  const state = loadState();
  state.profile.excludedIngredientIds = [...new Set([...(state.profile.excludedIngredientIds || []), resolved.id])];
  saveState(state);
  const note = resolved.futureOnly
    ? `${resolved.label} is permanently excluded and reserved for future corpus matches.`
    : `${resolved.label} is permanently excluded from recommendations.`;
  return { ok: true, message: note };
}

function removePermanentExclusion(id) {
  const state = loadState();
  state.profile.excludedIngredientIds = (state.profile.excludedIngredientIds || []).filter(value => value !== id);
  saveState(state);
  reloadToPantry(`${permanentExclusionLabel(id)} is no longer permanently excluded.`);
}

function enhancePantry() {
  const unavailableForm = document.querySelector("#unavailableForm");
  if (!unavailableForm || document.querySelector("#permanentExclusionPanel")) return;

  const temporaryPanel = unavailableForm.closest(".panel");
  const heading = temporaryPanel?.querySelector("h2");
  if (heading) heading.textContent = "Can't get right now";
  if (temporaryPanel && !temporaryPanel.querySelector(".temporary-availability-note")) {
    const note = document.createElement("p");
    note.className = "hint temporary-availability-note";
    note.textContent = "Temporary availability problem. Supported substitutions may be used; otherwise matching recipes are skipped for now.";
    temporaryPanel.insertBefore(note, unavailableForm);
  }

  const state = loadState();
  const excluded = state.profile.excludedIngredientIds || [];
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.id = "permanentExclusionPanel";
  panel.innerHTML = `
    <h2>Always exclude</h2>
    <p class="hint">For ingredients you simply do not want. These are hard exclusions: no substitution and no recommendation containing the ingredient. They stay saved locally until you remove them.</p>
    <form id="permanentExclusionForm" class="inline-form">
      <label class="field grow"><span>Ingredient to avoid</span><input id="permanentExclusionInput" autocomplete="off" placeholder="e.g. coconut or pineapple"></label>
      <button class="secondary-action" type="submit">Exclude</button>
    </form>
    <div class="token-list">${excluded.map(id => `<button type="button" data-remove-exclusion="${id}" class="token warning-token">${permanentExclusionLabel(id)} ×</button>`).join("") || "<span class='micro'>No permanent ingredient exclusions saved.</span>"}</div>
    <p class="micro">If an ingredient is not in today's small V0 corpus, the preference is still retained as a future exclusion token. Example: pineapple can be saved even though no current V0 recipe uses it.</p>`;
  temporaryPanel?.after(panel);

  panel.querySelector("#permanentExclusionForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = panel.querySelector("#permanentExclusionInput");
    const result = savePermanentExclusion(input?.value || "");
    if (!result.ok) { showMessage(result.message); return; }
    reloadToPantry(result.message);
  });
  panel.querySelectorAll("[data-remove-exclusion]").forEach(button => button.addEventListener("click", () => removePermanentExclusion(button.dataset.removeExclusion)));
}

const observer = new MutationObserver(enhancePantry);
observer.observe(document.querySelector("#app"), { childList: true, subtree: true });
enhancePantry();

if (sessionStorage.getItem(RETURN_KEY) === "1") {
  sessionStorage.removeItem(RETURN_KEY);
  setTimeout(() => {
    document.querySelector('#bottomNav button[data-view="pantry"]')?.click();
    const message = sessionStorage.getItem(MESSAGE_KEY);
    sessionStorage.removeItem(MESSAGE_KEY);
    showMessage(message);
  }, 0);
}
