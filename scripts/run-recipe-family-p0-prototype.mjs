#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { synthesizeRecipeFamilyP0 } from '../src/domain/recipe-family-synthesis-p0.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const validator = path.join(root, 'scripts', 'validate-recipe-family-source-compliance.mjs');
const definitionsPath = path.join(root, 'config', 'recipe_family_synthesis_p0_families.json');
const ledgerPath = path.join(root, 'data', 'recipe-family-p0', 'publisher-extraction-ledger.json');
const packetPaths = {
  carbonara: path.join(root, 'data', 'recipe-family-p0', 'carbonara-observations.json'),
  hummus: path.join(root, 'data', 'recipe-family-p0', 'hummus-observations.json')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runCompliance(packetPath) {
  const result = spawnSync(process.execPath, [validator, packetPath], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `validator exited ${result.status}`;
    throw new Error(`Source compliance failed for ${path.basename(packetPath)}: ${detail}`);
  }
  return JSON.parse(result.stdout);
}

function applyProjectionExtensions(candidateRecipe, definition) {
  if (!candidateRecipe) return null;
  const candidate = structuredClone(candidateRecipe);
  const overrides = definition.projection?.ingredientOverrides || [];
  for (const override of overrides) {
    const index = candidate.ingredients.findIndex(item => item.canonicalIngredientId === override.replaceCanonicalIngredientId);
    if (index === -1) continue;
    candidate.ingredients[index] = {
      canonicalIngredientId: override.canonicalIngredientId,
      normalizedIngredient: override.normalizedIngredient,
      quantity: override.quantity,
      unit: override.unit,
      required: override.required,
      preparation: override.preparation,
      substitutionGroup: override.substitutionGroup,
      synthesisBasis: override.basis
    };
  }
  for (const extra of definition.projection?.additionalIngredients || []) {
    candidate.ingredients.push({
      canonicalIngredientId: extra.canonicalIngredientId,
      normalizedIngredient: extra.normalizedIngredient,
      quantity: extra.quantity,
      unit: extra.unit,
      required: extra.required,
      preparation: extra.preparation,
      substitutionGroup: extra.substitutionGroup,
      synthesisBasis: extra.basis
    });
  }
  candidate.provenance.projectionExtensions = {
    ingredientOverrides: overrides.length,
    additionalProjectIngredients: definition.projection?.additionalIngredients?.length || 0,
    sourceExpressionUsed: false
  };
  return candidate;
}

function summarizePacket(packet) {
  const modes = {};
  const roles = {};
  const attributionStates = {};
  for (const observation of packet.observations) {
    modes[observation.source.acquisitionMode] = (modes[observation.source.acquisitionMode] || 0) + 1;
    roles[observation.source.role] = (roles[observation.source.role] || 0) + 1;
    const key = `${observation.source.publicAttributionRequirement}:${observation.source.publicAttributionState}`;
    attributionStates[key] = (attributionStates[key] || 0) + 1;
  }
  return {
    observationCount: packet.observations.length,
    acquisitionModes: modes,
    sourceRoles: roles,
    attributionStates,
    protectedSourceExpressionPersisted: packet.observations.some(item => item.source.sourceExpressionPersisted === true),
    scheduledRefreshAuthorized: false
  };
}

const definitions = readJson(definitionsPath).families;
const ledger = readJson(ledgerPath);
const familyReports = [];
let terminalPass = true;

for (const definition of definitions) {
  const packetPath = packetPaths[definition.familyId];
  if (!packetPath) throw new Error(`No packet configured for ${definition.familyId}`);
  const packet = readJson(packetPath);
  const sourceCompliance = runCompliance(packetPath);
  const synthesis = synthesizeRecipeFamilyP0(packet.observations, definition);
  const candidateRecipe = applyProjectionExtensions(synthesis.candidateRecipe, definition);
  const unresolved = synthesis.validationReport.unresolvedFacts.length;
  const contradictions = synthesis.validationReport.contradictionCount;
  const familyPass = sourceCompliance.pass === true && synthesis.appAuthoringGate.pass === true && synthesis.expressionIndependence.pass === true;
  if (!familyPass) terminalPass = false;

  familyReports.push({
    familyId: definition.familyId,
    sourceCompliance,
    sourceSummary: summarizePacket(packet),
    referenceProfile: synthesis.referenceProfile,
    observedProfile: synthesis.observedProfile,
    recommendedProfile: synthesis.recommendedProfile,
    variants: synthesis.variants,
    provenance: synthesis.provenance,
    attributionRequirements: synthesis.attributionRequirements,
    expressionIndependence: synthesis.expressionIndependence,
    validationReport: synthesis.validationReport,
    appAuthoringGate: synthesis.appAuthoringGate,
    candidateRecipe,
    additionalCollectionDecision: {
      triggerEarned: unresolved > 0 || contradictions > 0 || !synthesis.appAuthoringGate.pass,
      state: unresolved > 0 || contradictions > 0 || !synthesis.appAuthoringGate.pass
        ? 'REVIEW_GAP_BEFORE_STOPPING_BASELINE'
        : 'STOP_ONE_TIME_BASELINE_PENDING_CONSULTANT_COACH',
      reason: unresolved > 0 || contradictions > 0 || !synthesis.appAuthoringGate.pass
        ? 'A deterministic prototype gap remains.'
        : 'Minimum independent practical evidence is met with usable required ranges and no deterministic unresolved fact or validation contradiction.'
    }
  });
}

const ledgerPass = ledger.rules?.genericScrapingUsed === false
  && ledger.rules?.genericCrawlingUsed === false
  && ledger.rules?.rawSourceExpressionRetained === false
  && ledger.rules?.repeatedSystematicExtractionUsed === false
  && ledger.publishers?.every(item => item.cumulativeExtractionRisk === 'LOW');
if (!ledgerPass) terminalPass = false;

const report = {
  reportVersion: '0.3.0',
  runnerVersion: 'recipe-family-p0-prototype-v1',
  evidenceAsOf: '2026-09-17',
  state: terminalPass ? 'RECIPE_FAMILY_P0_PRE_REVIEW_PASS' : 'RECIPE_FAMILY_P0_PRE_REVIEW_FAIL',
  authority: {
    productionPopulationMutationAuthorized: false,
    publicRuntimeMutationAuthorized: false,
    billingAuthorized: false,
    nutritionAuthorityWideningAuthorized: false,
    tenFamilyExpansionAuthorized: false,
    publicActivationAuthorized: false,
    nextGate: 'CONSULTANT_COACH_REVIEW'
  },
  controls: {
    sourceCompliancePass: familyReports.every(item => item.sourceCompliance.pass === true),
    expressionIndependencePass: familyReports.every(item => item.expressionIndependence.pass === true),
    publisherExtractionLedgerPass: ledgerPass,
    genericScrapingUsed: ledger.rules.genericScrapingUsed,
    genericCrawlingUsed: ledger.rules.genericCrawlingUsed,
    protectedSourceExpressionPersisted: familyReports.some(item => item.provenance.protectedSourceExpressionPersisted === true),
    scheduledRefreshAuthorized: false
  },
  metrics: {
    familiesAttempted: familyReports.length,
    familiesAppAuthoringEligible: familyReports.filter(item => item.appAuthoringGate.pass).length,
    observationsReviewed: familyReports.reduce((sum, item) => sum + item.sourceSummary.observationCount, 0),
    independentPracticalObservations: Object.fromEntries(familyReports.map(item => [item.familyId, item.provenance.practicalEvidenceIds.length])),
    publisherLedgerEntries: ledger.publishers.length,
    legalSourceBlocks: familyReports.filter(item => !item.sourceCompliance.pass).length,
    validationContradictions: familyReports.reduce((sum, item) => sum + item.validationReport.contradictionCount, 0),
    unresolvedFacts: familyReports.reduce((sum, item) => sum + item.validationReport.unresolvedFacts.length, 0),
    attributionRequiredObservations: familyReports.reduce((sum, item) => sum + item.sourceCompliance.attributionRequiredObservations, 0)
  },
  publisherExtractionLedger: {
    totals: ledger.totals,
    allCumulativeExtractionRiskLow: ledger.publishers.every(item => item.cumulativeExtractionRisk === 'LOW')
  },
  familyReports,
  blockingReview: {
    consultantRequired: true,
    projectCoachRequired: true,
    reviewCompleted: false,
    expansionBlockedUntilReviewPass: true
  }
};

const output = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes('--write')) {
  const outPath = path.join(root, 'data', 'generated', 'recipe-family-p0', 'prototype-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output);
  console.error(`Wrote ${path.relative(root, outPath)}`);
}
process.stdout.write(output);
if (!terminalPass) process.exitCode = 1;
