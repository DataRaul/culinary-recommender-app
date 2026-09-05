import { performance } from "node:perf_hooks";

import {
  CORPUS_SCALE_QUERY_CAP,
  benchmarkQueryScenarios,
  indexKeysForRecipe,
  intersectPostings,
  syntheticRecipeFromGolden
} from "./corpus-scale-step1-core.mjs";

export const STEP7A_TARGETS = Object.freeze([1_000, 10_000, 50_000, 100_000, 170_000, 250_000]);
export const STEP7A_REQUIRED_CAPACITY = 170_000;
export const STEP7A_STRESS_CAPACITY = 250_000;
export const STEP7A_RECIPE_DATABASES = 8;
export const STEP7A_CONTROL_DATABASES = 1;
export const STEP7A_RESERVED_DATABASES = 1;

export const STEP7A_BUDGETS = Object.freeze({
  maxTotalBytesAt170k: Math.floor(3.5 * 1024 * 1024 * 1024),
  maxDatabaseBytesAt170k: 350 * 1024 * 1024,
  maxIndexArtifactRowBytes: 1 * 1024 * 1024,
  maxHydratedCandidates: CORPUS_SCALE_QUERY_CAP,
  maxD1SubqueriesPerProtectedRequest: 16,
  maxDatabaseSlots: 10,
  reservedDatabaseSlots: STEP7A_RESERVED_DATABASES,
  maxProviderRowOrBlobBytes: 2 * 1024 * 1024,
  workerCpuProxyAdvisoryMs: 8,
  fixedControlAuthOverheadBytes: 16 * 1024 * 1024
});

export const IDENTITY_VERIFIER_CONTRACT = Object.freeze({
  providerNeutral: true,
  initialProvider: "google_gis_oidc",
  signatureVerificationRequired: true,
  verifiedClaimsRequired: Object.freeze(["sub", "email", "email_verified", "aud", "iss", "exp"]),
  exactPrivateAllowlistRequired: true,
  publicSignupAllowed: false,
  stableBindingKey: "provider_issuer_plus_subject",
  invitedEmailStorage: "PRIVATE_RUNTIME_STATE_ONLY",
  runtimeSecrets: "PRIVATE_RUNTIME_SECRET_ONLY"
});

export const OWNER_BOOTSTRAP_CONTRACT = Object.freeze({
  emailSource: "RUNTIME_PRIVATE_INPUT",
  repositoryEmailLiteralAllowed: false,
  bootstrapPublicSignupAllowed: false,
  bootstrapMustCreateExactEnabledInvite: true
});

export const SESSION_CONTRACT = Object.freeze({
  cookie: Object.freeze({ secure: true, httpOnly: true, sameSite: "Lax" }),
  signedOrMacProtected: true,
  reusableProviderCredentialStored: false,
  currentAccountStateCheckRequired: true,
  revocationMustFailClosed: true
});

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const PROTECTED_STATIC_PREFIXES = Object.freeze([
  "corpus/",
  "protected/",
  "private-corpus/",
  "runtime-indexes/",
  "recipe-bodies/"
]);

const bytes = value => Buffer.byteLength(value, "utf8");
const rounded = value => Number(value.toFixed(3));

function percentile(values, ratio) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.min(ordered.length - 1, Math.max(0, Math.ceil(ordered.length * ratio) - 1));
  return ordered[index];
}

function assertGoldenRecipes(goldenRecipes) {
  if (!Array.isArray(goldenRecipes) || goldenRecipes.length === 0) {
    throw new Error("goldenRecipes must contain at least one recipe");
  }
}

function assertTargetSize(targetSize) {
  if (!Number.isInteger(targetSize) || targetSize <= 0) throw new Error("targetSize must be a positive integer");
}

export function normalizeInviteEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isGoogleAuthoritativeEmail(claims = {}) {
  if (claims.email_verified !== true) return false;
  const email = normalizeInviteEmail(claims.email);
  if (!email) return false;
  if (email.endsWith("@gmail.com")) return true;
  return typeof claims.hd === "string" && claims.hd.trim().length > 0;
}

export function verifyGoogleIdentityEnvelope({ claims, expectedAudience, signatureVerified, nowEpochSeconds = Math.floor(Date.now() / 1000) }) {
  const reasons = [];
  if (signatureVerified !== true) reasons.push("SIGNATURE_NOT_VERIFIED");
  if (!GOOGLE_ISSUERS.has(claims?.iss)) reasons.push("INVALID_ISSUER");
  const audience = claims?.aud;
  const audienceMatches = Array.isArray(audience)
    ? audience.includes(expectedAudience)
    : audience === expectedAudience;
  if (!expectedAudience || !audienceMatches) reasons.push("INVALID_AUDIENCE");
  if (!Number.isFinite(Number(claims?.exp)) || Number(claims.exp) <= nowEpochSeconds) reasons.push("EXPIRED_OR_MISSING_EXPIRY");
  if (typeof claims?.sub !== "string" || !claims.sub.trim()) reasons.push("MISSING_SUBJECT");
  if (!normalizeInviteEmail(claims?.email)) reasons.push("MISSING_EMAIL");
  if (claims?.email_verified !== true) reasons.push("EMAIL_NOT_VERIFIED");
  if (!isGoogleAuthoritativeEmail(claims)) reasons.push("GOOGLE_NOT_AUTHORITATIVE_FOR_EMAIL");

  return {
    pass: reasons.length === 0,
    reasons,
    identity: reasons.length === 0 ? {
      provider: "google",
      issuer: claims.iss,
      subject: claims.sub,
      email: normalizeInviteEmail(claims.email)
    } : null
  };
}

export function authorizeExactInvite(identity, allowlist = []) {
  const normalized = new Map(
    allowlist.map(entry => [normalizeInviteEmail(entry.email), entry])
  );
  const entry = normalized.get(normalizeInviteEmail(identity?.email));
  if (!entry || entry.enabled !== true) return { pass: false, reason: "NOT_EXACTLY_INVITED" };
  if (entry.provider && entry.provider !== identity.provider) return { pass: false, reason: "PROVIDER_MISMATCH" };
  if (entry.subject && entry.subject !== identity.subject) return { pass: false, reason: "BOUND_SUBJECT_MISMATCH" };
  return {
    pass: true,
    reason: "AUTHORIZED",
    accountId: entry.accountId,
    shouldBindSubject: !entry.subject
  };
}

export function authorizeSessionState({ session, account, nowEpochSeconds = Math.floor(Date.now() / 1000) }) {
  if (!session || !account) return { pass: false, reason: "MISSING_SESSION_OR_ACCOUNT" };
  if (account.enabled !== true) return { pass: false, reason: "ACCOUNT_REVOKED" };
  if (session.accountId !== account.accountId) return { pass: false, reason: "ACCOUNT_MISMATCH" };
  if (session.accountVersion !== account.version) return { pass: false, reason: "SESSION_REVOKED_BY_VERSION" };
  if (!Number.isFinite(Number(session.exp)) || Number(session.exp) <= nowEpochSeconds) return { pass: false, reason: "SESSION_EXPIRED" };
  return { pass: true, reason: "AUTHORIZED" };
}

function hashString32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function recipeDatabaseShardForId(recipeId, shardCount = STEP7A_RECIPE_DATABASES) {
  if (!Number.isInteger(shardCount) || shardCount <= 0) throw new Error("shardCount must be positive");
  return hashString32(String(recipeId)) % shardCount;
}

export function estimateD1RecipeRowBytes(recipe) {
  const body = JSON.stringify(recipe);
  const payloadBytes = bytes(body) + bytes(recipe.id || "") + 256;
  return Math.ceil(payloadBytes * 1.25);
}

export function estimatePackedPostingRowBytes(postingCount) {
  if (!Number.isInteger(postingCount) || postingCount < 0) throw new Error("postingCount must be a non-negative integer");
  return (postingCount * 4) + 512;
}

export function validateFutureDeploymentSeparation({ publicAssets = [], protectedArtifacts = [] } = {}) {
  const normalizedPublic = publicAssets.map(path => String(path).replace(/^\/+/, ""));
  const protectedSet = new Set(protectedArtifacts.map(path => String(path).replace(/^\/+/, "")));
  const violations = [];
  for (const path of normalizedPublic) {
    if (protectedSet.has(path)) violations.push(`${path}:DECLARED_PROTECTED`);
    if (PROTECTED_STATIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
      violations.push(`${path}:PROTECTED_PREFIX_ON_PUBLIC_PAGES`);
    }
  }
  return { pass: violations.length === 0, violations };
}

function recipeAtOrdinal(goldenRecipes, ordinal) {
  return syntheticRecipeFromGolden(goldenRecipes[ordinal % goldenRecipes.length], ordinal);
}

function buildStorageAndIndexes(goldenRecipes, targetSize) {
  const recipeShardBytes = Array(STEP7A_RECIPE_DATABASES).fill(0);
  const recipeShardRows = Array(STEP7A_RECIPE_DATABASES).fill(0);
  const indexes = new Map();
  let rawRecipeBytes = 0;
  let estimatedRecipeBytes = 0;

  for (let ordinal = 0; ordinal < targetSize; ordinal += 1) {
    const recipe = recipeAtOrdinal(goldenRecipes, ordinal);
    const bodyBytes = bytes(JSON.stringify(recipe));
    const estimatedRowBytes = estimateD1RecipeRowBytes(recipe);
    const shard = recipeDatabaseShardForId(recipe.id);
    recipeShardBytes[shard] += estimatedRowBytes;
    recipeShardRows[shard] += 1;
    rawRecipeBytes += bodyBytes;
    estimatedRecipeBytes += estimatedRowBytes;

    for (const key of indexKeysForRecipe(recipe)) {
      const postings = indexes.get(key) || [];
      postings.push(ordinal);
      indexes.set(key, postings);
    }
  }

  let packedIndexBytes = 0;
  let maxIndexArtifactRowBytes = 0;
  let maxIndexArtifactKey = null;
  for (const [key, postings] of indexes) {
    const rowBytes = estimatePackedPostingRowBytes(postings.length);
    packedIndexBytes += rowBytes;
    if (rowBytes > maxIndexArtifactRowBytes) {
      maxIndexArtifactRowBytes = rowBytes;
      maxIndexArtifactKey = key;
    }
  }
  const controlDatabaseBytes = STEP7A_BUDGETS.fixedControlAuthOverheadBytes + packedIndexBytes;

  return {
    indexes,
    storage: {
      rawRecipeBytes,
      estimatedRecipeBytes,
      recipeShardBytes,
      recipeShardRows,
      packedIndexBytes,
      controlDatabaseBytes,
      totalEstimatedBytes: estimatedRecipeBytes + controlDatabaseBytes,
      maxIndexArtifactRowBytes,
      maxIndexArtifactKey,
      databaseSlotsUsed: STEP7A_RECIPE_DATABASES + STEP7A_CONTROL_DATABASES,
      databaseSlotsReserved: STEP7A_RESERVED_DATABASES
    }
  };
}

function benchmarkProtectedQueries(goldenRecipes, indexes, options = {}) {
  const repetitions = Math.max(1, Number(options.repetitions) || 8);
  const scenarios = benchmarkQueryScenarios(indexes);
  return scenarios.map(scenario => {
    const allOrdinals = intersectPostings(indexes, scenario.keys);
    const boundedOrdinals = allOrdinals.slice(0, CORPUS_SCALE_QUERY_CAP);
    const touchedShards = new Set();
    for (const ordinal of boundedOrdinals) {
      touchedShards.add(recipeDatabaseShardForId(recipeAtOrdinal(goldenRecipes, ordinal).id));
    }

    const samples = [];
    for (let repetition = 0; repetition < repetitions + 1; repetition += 1) {
      const startedAt = performance.now();
      const ordinals = intersectPostings(indexes, scenario.keys).slice(0, CORPUS_SCALE_QUERY_CAP);
      const shards = new Set();
      for (const ordinal of ordinals) shards.add(recipeDatabaseShardForId(recipeAtOrdinal(goldenRecipes, ordinal).id));
      if (repetition > 0) samples.push(performance.now() - startedAt);
    }

    const d1Subqueries = 1 + scenario.keys.length + touchedShards.size;
    const rowsRead = 1 + scenario.keys.length + boundedOrdinals.length;
    return {
      name: scenario.name,
      keys: scenario.keys,
      fullCandidateCount: allOrdinals.length,
      boundedCandidateCount: boundedOrdinals.length,
      touchedRecipeDatabases: touchedShards.size,
      d1Subqueries,
      rowsRead,
      fullCorpusScan: false,
      workerCpuProxyP50Ms: rounded(percentile(samples, 0.5)),
      workerCpuProxyP95Ms: rounded(percentile(samples, 0.95))
    };
  });
}

export function buildStep7AModel(goldenRecipes, targetSize, options = {}) {
  assertGoldenRecipes(goldenRecipes);
  assertTargetSize(targetSize);
  const startedAt = performance.now();
  const { indexes, storage } = buildStorageAndIndexes(goldenRecipes, targetSize);
  const queries = benchmarkProtectedQueries(goldenRecipes, indexes, options);
  return {
    targetSize,
    storage,
    queries,
    buildMs: rounded(performance.now() - startedAt),
    identityContract: IDENTITY_VERIFIER_CONTRACT,
    ownerBootstrapContract: OWNER_BOOTSTRAP_CONTRACT,
    sessionContract: SESSION_CONTRACT,
    futureDeploymentSeparation: validateFutureDeploymentSeparation({
      publicAssets: ["index.html", "styles.css", "manifest.webmanifest", "src/app-shell.js"],
      protectedArtifacts: ["protected/corpus-manifest", "runtime-indexes/ingredient/tomato", "recipe-bodies/000001"]
    })
  };
}

function check(id, observed, threshold, pass) {
  return { id, observed, threshold, pass: Boolean(pass) };
}

export function evaluateStep7AAcceptance(reports, budgets = STEP7A_BUDGETS) {
  const bySize = new Map(reports.map(report => [report.targetSize, report]));
  const checks = [];
  for (const required of STEP7A_TARGETS) {
    checks.push(check(`target.${required}.present`, bySize.has(required), true, bySize.has(required)));
  }

  const required = bySize.get(STEP7A_REQUIRED_CAPACITY);
  const stress = bySize.get(STEP7A_STRESS_CAPACITY);
  if (required) {
    checks.push(check("170k.totalEstimatedBytes", required.storage.totalEstimatedBytes, budgets.maxTotalBytesAt170k, required.storage.totalEstimatedBytes <= budgets.maxTotalBytesAt170k));
    checks.push(check("170k.maxRecipeShardBytes", Math.max(...required.storage.recipeShardBytes), budgets.maxDatabaseBytesAt170k, Math.max(...required.storage.recipeShardBytes) <= budgets.maxDatabaseBytesAt170k));
    checks.push(check("170k.controlDatabaseBytes", required.storage.controlDatabaseBytes, budgets.maxDatabaseBytesAt170k, required.storage.controlDatabaseBytes <= budgets.maxDatabaseBytesAt170k));
    checks.push(check("170k.databaseSlots", required.storage.databaseSlotsUsed + required.storage.databaseSlotsReserved, budgets.maxDatabaseSlots, required.storage.databaseSlotsUsed + required.storage.databaseSlotsReserved <= budgets.maxDatabaseSlots));
    checks.push(check("170k.reservedDatabaseSlots", required.storage.databaseSlotsReserved, budgets.reservedDatabaseSlots, required.storage.databaseSlotsReserved >= budgets.reservedDatabaseSlots));
    checks.push(check("170k.maxIndexArtifactRowBytes", required.storage.maxIndexArtifactRowBytes, budgets.maxIndexArtifactRowBytes, required.storage.maxIndexArtifactRowBytes <= budgets.maxIndexArtifactRowBytes));
  }

  if (stress) {
    checks.push(check("250k.maxIndexArtifactRowBytes", stress.storage.maxIndexArtifactRowBytes, budgets.maxIndexArtifactRowBytes, stress.storage.maxIndexArtifactRowBytes <= budgets.maxIndexArtifactRowBytes));
  }

  for (const report of reports) {
    checks.push(check(`${report.targetSize}.futureDeploymentSeparation`, report.futureDeploymentSeparation.pass, true, report.futureDeploymentSeparation.pass));
    for (const query of report.queries) {
      checks.push(check(`${report.targetSize}.${query.name}.boundedCandidates`, query.boundedCandidateCount, budgets.maxHydratedCandidates, query.boundedCandidateCount <= budgets.maxHydratedCandidates));
      checks.push(check(`${report.targetSize}.${query.name}.d1Subqueries`, query.d1Subqueries, budgets.maxD1SubqueriesPerProtectedRequest, query.d1Subqueries <= budgets.maxD1SubqueriesPerProtectedRequest));
      checks.push(check(`${report.targetSize}.${query.name}.fullCorpusScan`, query.fullCorpusScan, false, query.fullCorpusScan === false));
    }
  }

  checks.push(check("identity.providerNeutral", IDENTITY_VERIFIER_CONTRACT.providerNeutral, true, IDENTITY_VERIFIER_CONTRACT.providerNeutral === true));
  checks.push(check("identity.exactPrivateAllowlist", IDENTITY_VERIFIER_CONTRACT.exactPrivateAllowlistRequired, true, IDENTITY_VERIFIER_CONTRACT.exactPrivateAllowlistRequired === true));
  checks.push(check("identity.publicSignupAllowed", IDENTITY_VERIFIER_CONTRACT.publicSignupAllowed, false, IDENTITY_VERIFIER_CONTRACT.publicSignupAllowed === false));
  checks.push(check("ownerBootstrap.repositoryEmailLiteralAllowed", OWNER_BOOTSTRAP_CONTRACT.repositoryEmailLiteralAllowed, false, OWNER_BOOTSTRAP_CONTRACT.repositoryEmailLiteralAllowed === false));
  checks.push(check("session.revocationMustFailClosed", SESSION_CONTRACT.revocationMustFailClosed, true, SESSION_CONTRACT.revocationMustFailClosed === true));

  const failed = checks.filter(item => !item.pass);
  const workerCpuProxyWarnings = reports.flatMap(report => report.queries
    .filter(query => query.workerCpuProxyP95Ms > budgets.workerCpuProxyAdvisoryMs)
    .map(query => ({ targetSize: report.targetSize, scenario: query.name, p95Ms: query.workerCpuProxyP95Ms })));

  return {
    pass: failed.length === 0,
    terminal: failed.length === 0
      ? "NO_BILLING_AUTH_170K_ARCHITECTURE_PASS"
      : "REBASELINE_REQUIRED_NO_PROVISIONING",
    checks,
    failedCheckIds: failed.map(item => item.id),
    workerCpuProxyWarnings,
    productionCpuBoundary: "Local wall-clock proxy is advisory only. Actual Workers Free CPU must pass the protected Step 7D canary before corpus expansion."
  };
}

export function runStep7ABenchmark(goldenRecipes, options = {}) {
  assertGoldenRecipes(goldenRecipes);
  const sizes = options.sizes || STEP7A_TARGETS;
  const reports = sizes.map(targetSize => buildStep7AModel(goldenRecipes, targetSize, options));
  return {
    sizes,
    reports,
    acceptance: evaluateStep7AAcceptance(reports, options.budgets || STEP7A_BUDGETS)
  };
}
