import test from "node:test";
import assert from "node:assert/strict";

import { createSessionToken } from "../src/server/auth-core.mjs";
import { onRequestGet as getStep7ePilot } from "../functions/api/step7e/pilot.js";
import {
  STEP7E_EXPECTED_CHUNK_COUNT,
  STEP7E_EXPECTED_FINGERPRINT,
  expectedStep7eChunk,
  publicStep7eManifest
} from "../src/server/step7e-pilot.mjs";

const ORIGIN = "https://culinary-recommender-app.pages.dev";
const SECRET = "0123456789abcdef0123456789abcdef";

function account() {
  return {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  };
}

function chunkMetadataRows() {
  return Array.from({ length: STEP7E_EXPECTED_CHUNK_COUNT }, (_, index) => {
    const descriptor = expectedStep7eChunk(index);
    return {
      chunk_index: index,
      first_ordinal: descriptor.firstOrdinal,
      recipe_count: descriptor.recipeCount,
      chunk_sha256: descriptor.chunkSha256,
      total_body_bytes: descriptor.bodyBytes,
      source_commit: publicStep7eManifest().sourceCommit
    };
  });
}

class AuditFakeD1 {
  constructor({
    failSchemaReads = 0,
    failChunkReads = 0,
    failRecipeCountReads = 0,
    failBodyBytesReads = 0,
    tablesPresent = true,
    chunkRows = chunkMetadataRows()
  } = {}) {
    this.account = account();
    this.failSchemaReads = failSchemaReads;
    this.failChunkReads = failChunkReads;
    this.failRecipeCountReads = failRecipeCountReads;
    this.failBodyBytesReads = failBodyBytesReads;
    this.tablesPresent = tablesPresent;
    this.chunkRows = chunkRows;
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) {
        args = values;
        return this;
      },
      async all() {
        if (sql.includes("FROM sqlite_schema")) {
          if (db.failSchemaReads > 0) {
            db.failSchemaReads -= 1;
            throw new Error("transient schema read");
          }
          return {
            results: db.tablesPresent
              ? [{ name: "step7e_source_pilot" }, { name: "step7e_source_pilot_chunks" }]
              : [],
            meta: { rows_read: db.tablesPresent ? 2 : 0, rows_written: 0 }
          };
        }
        if (sql.includes("FROM step7e_source_pilot_chunks")) {
          if (db.failChunkReads > 0) {
            db.failChunkReads -= 1;
            throw new Error("transient chunk metadata read");
          }
          return {
            results: db.chunkRows,
            meta: { rows_read: db.chunkRows.length, rows_written: 0, size_after: 5_931_008 }
          };
        }
        throw new Error(`Unhandled all SQL: ${sql}`);
      },
      async first() {
        if (sql.startsWith("SELECT account_id") && sql.includes("FROM invited_accounts")) {
          return db.account.account_id === args[0] ? db.account : null;
        }
        if (sql.includes("SELECT COUNT(*) AS recipe_count") && sql.includes("FROM step7e_source_pilot")) {
          if (db.failRecipeCountReads > 0) {
            db.failRecipeCountReads -= 1;
            throw new Error("transient recipe count read");
          }
          return { recipe_count: publicStep7eManifest().liveRecipeCount };
        }
        if (sql.includes("SUM(body_bytes)") && sql.includes("FROM step7e_source_pilot")) {
          if (db.failBodyBytesReads > 0) {
            db.failBodyBytesReads -= 1;
            throw new Error("transient body bytes read");
          }
          return { total_body_bytes: publicStep7eManifest().totalBodyBytes };
        }
        throw new Error(`Unhandled first SQL: ${sql}`);
      }
    };
  }
}

async function authenticatedRequest(db) {
  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    accountId: db.account.account_id,
    sessionVersion: db.account.session_version,
    nowEpochSeconds: now,
    ttlSeconds: 3600
  }, SECRET);
  return new Request(`${ORIGIN}/api/step7e-pilot`, {
    headers: { cookie: `__Host-culinary_session=${token}` }
  });
}

test("Step 7E final audit retries one transient read and still proves the exact pilot", async () => {
  const db = new AuditFakeD1({ failRecipeCountReads: 1 });
  const response = await getStep7ePilot({
    request: await authenticatedRequest(db),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db }
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.ready, true);
  assert.equal(body.recipeCount, 500);
  assert.equal(body.chunkCount, 50);
  assert.equal(body.fingerprint, STEP7E_EXPECTED_FINGERPRINT);
  assert.equal(body.bootstrapRequired, false);
  assert.equal(body.terminalCandidate, "STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS");
  assert.deepEqual(body.metrics.auditReadAttempts, {
    schema: 1,
    chunkMetadata: 1,
    recipeCount: 2,
    bodyBytes: 1
  });
});

test("Step 7E final audit classifies a persistent body-byte read failure and never bootstraps ambiguously", async () => {
  const db = new AuditFakeD1({ failBodyBytesReads: 2 });
  const response = await getStep7ePilot({
    request: await authenticatedRequest(db),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db }
  });

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.ready, false);
  assert.equal(body.error, "STEP7E_AUDIT_BODY_BYTES_READ_FAILED");
  assert.equal(body.auditReadAttempts, 2);
  assert.equal(body.bootstrapRequired, false);
  assert.equal(body.protectedDataReturned, false);
  assert.equal(JSON.stringify(body).includes("transient body bytes read"), false);
});

test("Step 7E positively classifies absent pilot tables as bootstrap-required", async () => {
  const db = new AuditFakeD1({ tablesPresent: false });
  const response = await getStep7ePilot({
    request: await authenticatedRequest(db),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db }
  });

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "STEP7E_PILOT_NOT_INITIALIZED");
  assert.equal(body.bootstrapRequired, true);
  assert.equal(body.missingChunkIndices.length, 50);
  assert.deepEqual(body.missingTables.sort(), ["step7e_source_pilot", "step7e_source_pilot_chunks"]);
});

test("Step 7E identifies only genuinely missing chunk indices for bounded bootstrap", async () => {
  const rows = chunkMetadataRows().slice(0, 49);
  const db = new AuditFakeD1({ chunkRows: rows });
  const response = await getStep7ePilot({
    request: await authenticatedRequest(db),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db }
  });

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "STEP7E_PILOT_INCOMPLETE_OR_MISMATCH");
  assert.equal(body.bootstrapRequired, true);
  assert.deepEqual(body.missingChunkIndices, [49]);
});
