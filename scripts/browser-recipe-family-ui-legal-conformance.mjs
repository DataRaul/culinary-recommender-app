import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const prototype = JSON.parse(readFileSync("data/generated/recipe-family-p0-prototype.json", "utf8"));
const packet = JSON.parse(readFileSync("data/generated/recipe-family-p0-source-observations.json", "utf8"));
const hummusFamily = prototype.families.find(row => row.familyId === "hummus");
const candidate = hummusFamily?.candidateAppOwnedRecipeProjection;
if (!candidate) throw new Error("Recipe Family UI legal conformance requires the real Hummus candidate");

const observations = packet.observations.filter(row => candidate.provenanceObservationIds.includes(row.observationId));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });

const result = await page.evaluate(async ({ candidate, observations }) => {
  const module = await import("/src/domain/public-attribution.js");

  const bundle = module.buildRecipeFamilyAttributionBundle(candidate, observations);
  const html = module.renderRecipeFamilyAttributionBundle(bundle);
  const admission = module.recipeFamilyPublicRuntimeAdmission(candidate, observations, {
    publicAdmissionAuthorized: true,
    privateRuntimeAccess: true
  });

  const protectedRows = structuredClone(observations);
  for (const row of protectedRows) {
    row.source.protectedExpression = "DO_NOT_LEAK_PROTECTED_EXPRESSION";
    row.source.rawSourceText = "DO_NOT_LEAK_RAW_SOURCE_TEXT";
  }
  const protectedHtml = module.renderRecipeFamilyAttributionBundle(
    module.buildRecipeFamilyAttributionBundle(candidate, protectedRows)
  );

  const negative = {};
  for (const state of ["UNSATISFIABLE", "UNKNOWN"]) {
    const rows = structuredClone(observations);
    rows[0].source.publicAttributionState = state;
    const gated = module.buildRecipeFamilyAttributionBundle(candidate, rows);
    negative[state] = {
      allowed: gated.allowed,
      html: module.renderRecipeFamilyAttributionBundle(gated),
      admission: module.recipeFamilyPublicRuntimeAdmission(candidate, rows, {
        publicAdmissionAuthorized: true,
        privateRuntimeAccess: true
      }).allowed
    };
  }

  return {
    allowed: bundle.allowed,
    noticeCount: bundle.notices.length,
    sourceClassKeys: bundle.sourceClassKeys,
    html,
    admissionAllowed: admission.allowed,
    admissionReason: admission.reason,
    protectedHtml,
    negative
  };
}, { candidate, observations });

if (!result.allowed) throw new Error("Real Hummus candidate did not pass attribution conformance");
if (result.noticeCount !== 5) throw new Error(`Expected 5 real attribution notices, observed ${result.noticeCount}`);
if (result.sourceClassKeys.length < 4) throw new Error("Expected at least four distinct source classes");
for (const expected of [
  "ForkRecipe Kitchen",
  "Recipes Wiki / Fandom",
  "Recidemia contributors",
  "Wikibooks contributors",
  "CC BY-SA",
  "no third-party source expression is retained"
]) {
  if (!result.html.includes(expected)) throw new Error(`Real candidate browser attribution missing: ${expected}`);
}
if (/DO_NOT_LEAK/.test(result.protectedHtml)) throw new Error("Protected evidence expression leaked into browser attribution output");
if (result.admissionAllowed) throw new Error("UI legal conformance incorrectly authorized public runtime admission");
if (result.admissionReason !== "PUBLIC_RUNTIME_ADMISSION_NOT_SEPARATELY_AUTHORIZED") {
  throw new Error(`Unexpected admission result: ${result.admissionReason}`);
}
for (const state of ["UNSATISFIABLE", "UNKNOWN"]) {
  if (result.negative[state].allowed || result.negative[state].html !== "" || result.negative[state].admission) {
    throw new Error(`${state} attribution did not fail closed in browser acceptance`);
  }
}
if (errors.length) throw new Error(`Recipe Family UI legal conformance page errors: ${errors.join(" | ")}`);

await browser.close();
console.log("Recipe Family UI legal conformance browser acceptance passed with real Hummus candidate and fail-closed negatives.");
