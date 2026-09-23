import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildRecipeFamilyAttributionBundle,
  recipeFamilyPublicRuntimeAdmission,
  renderRecipeFamilyAttributionBundle
} from "../src/domain/public-attribution.js";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const prototypePath = resolve(args.prototype || "data/generated/recipe-family-p0-prototype.json");
const observationsPath = resolve(args.observations || "data/generated/recipe-family-p0-source-observations.json");
const output = resolve(args.output || "data/generated/recipe-family-ui-legal-conformance-v1.json");

const [prototype, packet] = await Promise.all([
  readFile(prototypePath, "utf8").then(JSON.parse),
  readFile(observationsPath, "utf8").then(JSON.parse)
]);

const hummus = prototype.families.find(row => row.familyId === "hummus")?.candidateAppOwnedRecipeProjection;
if (!hummus) throw new Error("Missing real Hummus candidate");

const observations = packet.observations.filter(row => hummus.provenanceObservationIds.includes(row.observationId));
const bundle = buildRecipeFamilyAttributionBundle(hummus, observations);
const rendered = renderRecipeFamilyAttributionBundle(bundle);
const admission = recipeFamilyPublicRuntimeAdmission(hummus, observations, { publicAdmissionAuthorized: true });

const protectedRows = structuredClone(observations);
for (const row of protectedRows) {
  row.source.protectedExpression = "DO_NOT_LEAK_PROTECTED_EXPRESSION";
  row.source.rawSourceText = "DO_NOT_LEAK_RAW_SOURCE_TEXT";
}
const protectedHtml = renderRecipeFamilyAttributionBundle(buildRecipeFamilyAttributionBundle(hummus, protectedRows));

const negative = {};
for (const state of ["UNSATISFIABLE", "UNKNOWN"]) {
  const rows = structuredClone(observations);
  rows[0].source.publicAttributionState = state;
  const negativeBundle = buildRecipeFamilyAttributionBundle(hummus, rows);
  negative[state] = {
    failClosed: negativeBundle.allowed === false && renderRecipeFamilyAttributionBundle(negativeBundle) === "",
    publicAdmissionAllowed: recipeFamilyPublicRuntimeAdmission(hummus, rows, { publicAdmissionAuthorized: true }).allowed
  };
}

const pass =
  bundle.allowed === true &&
  bundle.notices.length === 5 &&
  bundle.sourceClassKeys.length >= 4 &&
  !/DO_NOT_LEAK/.test(protectedHtml) &&
  negative.UNSATISFIABLE.failClosed === true &&
  negative.UNKNOWN.failClosed === true &&
  negative.UNSATISFIABLE.publicAdmissionAllowed === false &&
  negative.UNKNOWN.publicAdmissionAllowed === false &&
  admission.allowed === false &&
  hummus.activationAuthority === "NONE";

const result = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_SUMMARY_V1",
  date: "2026-09-24",
  pass,
  terminal: pass
    ? "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS"
    : "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_FAIL_CLOSED",
  realCandidate: {
    familyId: "hummus",
    projectionId: hummus.projectionId,
    attributionNoticeCount: bundle.notices.length,
    distinctSourceClassCount: bundle.sourceClassKeys.length,
    sourceClassKeys: bundle.sourceClassKeys,
    requiredAttributionReady: bundle.allowed === true
  },
  negativeCases: {
    attributionRequiredUnsatisfiableFailClosed: negative.UNSATISFIABLE.failClosed,
    attributionUnknownFailClosed: negative.UNKNOWN.failClosed,
    privateOrPublicAdmissionCannotBypassFailClosed:
      negative.UNSATISFIABLE.publicAdmissionAllowed === false &&
      negative.UNKNOWN.publicAdmissionAllowed === false,
    protectedEvidenceExpressionLeakCount: /DO_NOT_LEAK/.test(protectedHtml) ? 1 : 0
  },
  publicRuntime: {
    admissionAuthorizedByThisGate: false,
    candidateActivationAuthority: hummus.activationAuthority,
    admissionResult: admission.reason,
    recipeCountChanged: false
  },
  boundaries: {
    protectedCorpusChanged: false,
    d1Reads: 0,
    d1Writes: 0,
    knowledgeCoreWrites: 0,
    youtubeStateChanges: 0,
    newShard: false,
    billingExpansion: false
  },
  nextPrimaryAction: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_NONPUBLIC"
    : "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_REPAIR"
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
if (!pass) process.exitCode = 1;
