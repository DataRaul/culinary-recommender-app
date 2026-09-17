#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/validate-recipe-family-source-compliance.mjs <observations.json>');
  process.exit(2);
}

const raw = fs.readFileSync(path.resolve(inputPath), 'utf8');
const parsed = JSON.parse(raw);
const observations = Array.isArray(parsed) ? parsed : parsed.observations;

if (!Array.isArray(observations) || observations.length === 0) {
  console.error('FAIL: expected a non-empty observation array or { observations: [...] }.');
  process.exit(1);
}

const acquisitionModes = new Set(['MANUAL_REVIEW', 'AUTOMATED_TDM', 'API_OPEN_DATA', 'LICENSED_REUSE']);
const lawfulAccessStates = new Set(['YES', 'NO', 'UNKNOWN']);
const termsStates = new Set([
  'ALLOWS_INTENDED_USE',
  'NO_RELEVANT_RESTRICTION_FOUND',
  'PROHIBITS_AUTOMATION',
  'REQUIRES_PERMISSION',
  'UNKNOWN'
]);
const tdmStates = new Set(['NONE_FOUND', 'EXPRESSLY_RESERVED', 'UNKNOWN', 'NOT_APPLICABLE']);
const reuseStates = new Set(['OPEN_LICENCE', 'PERMISSION', 'PUBLIC_DOMAIN', 'STANDARD_COPYRIGHT', 'UNKNOWN']);
const extractionStates = new Set(['LOW', 'MATERIAL', 'UNKNOWN']);
const roles = new Set([
  'REFERENCE_EVIDENCE',
  'STRUCTURE_EVIDENCE',
  'VARIANT_EVIDENCE',
  'VALIDATION_ONLY',
  'REUSABLE_CONTENT',
  'DO_NOT_USE'
]);
const retentionStates = new Set(['NONE', 'TEMPORARY_DELETE_AFTER_NORMALIZATION']);
const attributionRequirements = new Set(['REQUIRED', 'NOT_REQUIRED', 'UNKNOWN']);
const attributionStates = new Set(['READY', 'NOT_APPLICABLE', 'UNSATISFIABLE', 'UNKNOWN']);

const errors = [];

function requiredString(obj, key, label) {
  if (!obj || typeof obj[key] !== 'string' || obj[key].trim() === '') {
    errors.push(`${label}: missing ${key}`);
    return null;
  }
  return obj[key];
}

for (const [index, observation] of observations.entries()) {
  const label = observation?.observationId || `observation[${index}]`;
  const source = observation?.source;
  if (!source || typeof source !== 'object') {
    errors.push(`${label}: missing source object`);
    continue;
  }

  requiredString(source, 'publisher', label);
  requiredString(source, 'url', label);
  requiredString(source, 'accessedAt', label);
  requiredString(source, 'independenceGroup', label);
  requiredString(source, 'publisherLedgerKey', label);
  requiredString(source, 'termsCheckedAt', label);

  if (!acquisitionModes.has(source.acquisitionMode)) errors.push(`${label}: invalid acquisitionMode`);
  if (!lawfulAccessStates.has(source.lawfulAccess)) errors.push(`${label}: invalid lawfulAccess`);
  if (!termsStates.has(source.termsState)) errors.push(`${label}: invalid termsState`);
  if (source.tdmReservation !== undefined && !tdmStates.has(source.tdmReservation)) errors.push(`${label}: invalid tdmReservation`);
  if (!reuseStates.has(source.reuseBasis)) errors.push(`${label}: invalid reuseBasis`);
  if (!extractionStates.has(source.databaseExtractionRisk)) errors.push(`${label}: invalid databaseExtractionRisk`);
  if (!extractionStates.has(source.cumulativeExtractionRisk)) errors.push(`${label}: invalid cumulativeExtractionRisk`);
  if (!roles.has(source.role)) errors.push(`${label}: invalid source role`);
  if (!retentionStates.has(source.rawExpressionRetention)) errors.push(`${label}: invalid rawExpressionRetention`);
  if (!attributionRequirements.has(source.publicAttributionRequirement)) errors.push(`${label}: invalid publicAttributionRequirement`);
  if (!attributionStates.has(source.publicAttributionState)) errors.push(`${label}: invalid publicAttributionState`);
  if (typeof source.sourceExpressionPersisted !== 'boolean') errors.push(`${label}: sourceExpressionPersisted must be boolean`);

  if (source.lawfulAccess !== 'YES') {
    errors.push(`${label}: lawfulAccess must be YES for an eligible observation`);
  }
  if (source.role === 'DO_NOT_USE') {
    errors.push(`${label}: DO_NOT_USE source cannot enter an eligible observation packet`);
  }
  if (source.reuseBasis === 'UNKNOWN') {
    errors.push(`${label}: reuseBasis=UNKNOWN must fail closed until classified`);
  }
  if (source.publicAttributionRequirement === 'UNKNOWN') {
    errors.push(`${label}: publicAttributionRequirement=UNKNOWN must fail closed until classified`);
  }
  if (source.publicAttributionRequirement === 'REQUIRED') {
    if (source.publicAttributionState !== 'READY') {
      errors.push(`${label}: required public attribution must be READY before eligible use`);
    }
    requiredString(source, 'attributionLabel', label);
    requiredString(source, 'attributionLicenseOrBasis', label);
  }
  if (source.publicAttributionRequirement === 'NOT_REQUIRED' && source.publicAttributionState === 'UNKNOWN') {
    errors.push(`${label}: publicAttributionState=UNKNOWN is not an eligible terminal state`);
  }
  if (source.publicAttributionState === 'UNSATISFIABLE') {
    errors.push(`${label}: required/recorded public attribution is unsatisfiable; reject this use`);
  }
  if (source.acquisitionMode === 'MANUAL_REVIEW' && source.termsState === 'REQUIRES_PERMISSION') {
    errors.push(`${label}: manual review requires permission under the recorded termsState`);
  }

  if (source.acquisitionMode === 'AUTOMATED_TDM') {
    requiredString(source, 'tdmReservationCheckedAt', label);
    requiredString(source, 'tdmReservationEvidence', label);

    if (!['ALLOWS_INTENDED_USE', 'NO_RELEVANT_RESTRICTION_FOUND'].includes(source.termsState)) {
      errors.push(`${label}: automated TDM blocked by termsState=${source.termsState}`);
    }
    if (source.tdmReservation !== 'NONE_FOUND') {
      errors.push(`${label}: automated TDM requires tdmReservation=NONE_FOUND`);
    }
    if (source.databaseExtractionRisk !== 'LOW') {
      errors.push(`${label}: automated TDM requires databaseExtractionRisk=LOW`);
    }
    if (source.cumulativeExtractionRisk !== 'LOW') {
      errors.push(`${label}: automated TDM requires cumulativeExtractionRisk=LOW`);
    }
  }

  if (source.acquisitionMode === 'API_OPEN_DATA' || source.acquisitionMode === 'LICENSED_REUSE') {
    if (!['OPEN_LICENCE', 'PERMISSION', 'PUBLIC_DOMAIN'].includes(source.reuseBasis)) {
      errors.push(`${label}: ${source.acquisitionMode} requires explicit reusable rights basis`);
    }
  }

  if (source.role === 'REUSABLE_CONTENT' && !['OPEN_LICENCE', 'PERMISSION', 'PUBLIC_DOMAIN'].includes(source.reuseBasis)) {
    errors.push(`${label}: REUSABLE_CONTENT requires OPEN_LICENCE, PERMISSION or PUBLIC_DOMAIN`);
  }

  if (source.databaseExtractionRisk !== 'LOW' || source.cumulativeExtractionRisk !== 'LOW') {
    errors.push(`${label}: extraction risk is not LOW; source must fail closed or be separately reviewed`);
  }

  if (source.reuseBasis === 'STANDARD_COPYRIGHT' && source.sourceExpressionPersisted !== false) {
    errors.push(`${label}: standard-copyright source expression must not persist`);
  }

  if (source.sourceExpressionPersisted === true && source.role !== 'REUSABLE_CONTENT') {
    errors.push(`${label}: persistent source expression is only permitted for REUSABLE_CONTENT with valid rights`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ pass: false, error: 'RECIPE_FAMILY_SOURCE_COMPLIANCE_FAIL', errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  terminalCandidate: 'RECIPE_FAMILY_SOURCE_COMPLIANCE_PASS',
  eligibleObservations: observations.length,
  protectedSourceExpressionPersisted: observations.some((o) => o?.source?.sourceExpressionPersisted === true),
  attributionRequiredObservations: observations.filter((o) => o?.source?.publicAttributionRequirement === 'REQUIRED').length
}, null, 2));
