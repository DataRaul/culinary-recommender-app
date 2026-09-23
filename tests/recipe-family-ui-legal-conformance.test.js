import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildRecipeFamilyAttributionBundle,
  inspectExternalRecipeProvenance,
  inspectPublicAttributionSource,
  recipeFamilyPublicRuntimeAdmission,
  renderExternalRecipeProvenance,
  renderRecipeFamilyAttributionBundle
} from "../src/domain/public-attribution.js";
import { WIKIBOOKS_GATE_F_RECIPES } from "../src/data/external/wikibooks-gate-f-v1.js";

const prototype = JSON.parse(readFileSync(new URL("../data/generated/recipe-family-p0-prototype.json", import.meta.url), "utf8"));
const packet = JSON.parse(readFileSync(new URL("../data/generated/recipe-family-p0-source-observations.json", import.meta.url), "utf8"));
const hummusFamily = prototype.families.find(row => row.familyId === "hummus");
const hummus = hummusFamily.candidateAppOwnedRecipeProjection;
const hummusObservations = packet.observations.filter(row => hummus.provenanceObservationIds.includes(row.observationId));

const clone = value => JSON.parse(JSON.stringify(value));

test("real Hummus candidate renders generic attribution across multiple source classes", () => {
  const bundle = buildRecipeFamilyAttributionBundle(hummus, hummusObservations);
  assert.equal(bundle.allowed, true);
  assert.equal(bundle.notices.length, 5);
  assert.ok(bundle.sourceClassKeys.length >= 4);
  const html = renderRecipeFamilyAttributionBundle(bundle);
  for (const expected of ["ForkRecipe Kitchen", "Recipes Wiki / Fandom", "Recidemia contributors", "Wikibooks contributors", "CC BY-SA"]) {
    assert.ok(html.includes(expected), "missing rendered attribution: " + expected);
  }
  assert.match(html, /no third-party source expression is retained/i);
});

test("renderer whitelists attribution fields and does not leak protected evidence expression", () => {
  const observations = clone(hummusObservations);
  for (const row of observations) {
    row.source.protectedExpression = "DO_NOT_LEAK_PROTECTED_EXPRESSION";
    row.source.rawSourceText = "DO_NOT_LEAK_RAW_SOURCE_TEXT";
  }
  const html = renderRecipeFamilyAttributionBundle(buildRecipeFamilyAttributionBundle(hummus, observations));
  assert.doesNotMatch(html, /DO_NOT_LEAK/);
});

test("required but unsatisfiable and unknown attribution fail closed even for a private runtime context", () => {
  for (const state of ["UNSATISFIABLE", "UNKNOWN"]) {
    const observations = clone(hummusObservations);
    observations[0].source.publicAttributionState = state;
    const bundle = buildRecipeFamilyAttributionBundle(hummus, observations);
    assert.equal(bundle.allowed, false);
    assert.equal(renderRecipeFamilyAttributionBundle(bundle), "");
    const admission = recipeFamilyPublicRuntimeAdmission(hummus, observations, {
      publicAdmissionAuthorized: true,
      privateRuntimeAccess: true
    });
    assert.equal(admission.allowed, false);
  }
});

test("not-required attribution state proceeds without inventing a public source notice", () => {
  const decision = inspectPublicAttributionSource({
    publicAttributionRequirement: "NOT_REQUIRED",
    publicAttributionState: "NOT_APPLICABLE",
    sourceExpressionPersisted: false,
    rawExpressionRetention: "NONE"
  });
  assert.equal(decision.allowed, true);
  assert.equal(decision.required, false);
  assert.equal(decision.notice, null);
});

test("UI conformance pass does not itself authorize the Hummus candidate for public runtime", () => {
  const bundle = buildRecipeFamilyAttributionBundle(hummus, hummusObservations);
  assert.equal(bundle.allowed, true);
  const admission = recipeFamilyPublicRuntimeAdmission(hummus, hummusObservations, {
    publicAdmissionAuthorized: true
  });
  assert.equal(hummus.activationAuthority, "NONE");
  assert.equal(admission.allowed, false);
  assert.equal(admission.reason, "PUBLIC_RUNTIME_ADMISSION_NOT_SEPARATELY_AUTHORIZED");
});

test("existing Wikibooks external recipe uses the generic renderer and fails closed if required fields disappear", () => {
  const recipe = WIKIBOOKS_GATE_F_RECIPES.find(row => row.id === "wikibooks_baba_ganoush");
  const decision = inspectExternalRecipeProvenance(recipe.provenance);
  assert.equal(decision.allowed, true);
  const html = renderExternalRecipeProvenance(recipe.provenance, {
    nutritionNotice: "Source nutrition values are not imported as authoritative composition."
  });
  assert.match(html, /revision 4629606/);
  assert.match(html, /CC BY-SA 4.0/);
  assert.match(html, /Wikibooks contributors/);

  const broken = clone(recipe.provenance);
  broken.attribution = "";
  assert.equal(inspectExternalRecipeProvenance(broken).allowed, false);
  assert.equal(renderExternalRecipeProvenance(broken), "");
});
