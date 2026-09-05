import test from "node:test";
import assert from "node:assert/strict";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { createSessionToken } from "../src/server/auth-core.mjs";
import {
  STEP7D_EXPECTED_RECIPE_COUNT,
  serializeStep7dOracleRows,
  step7dOracleFingerprint
} from "../src/server/step7d-oracle.mjs";
import { onRequestPost as bootstrapStep7d } from "../functions/api/step7d/bootstrap.js";
import { onRequestGet as readStep7d } from "../functions/api/step7d/oracle.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";
const SECRET = "0123456789abcdef0123456789abcdef";

class Step7dFakeD1 {
  constructor(account) {
    this.account = account;
    this.oracle = [];
    this.accountReads = 0;
    this.oracleReads = 0;
    this.oracleWrites = 0;
  }

  sizeAfter() {
    return this.oracle.reduce((sum, row) => sum + row.body_bytes + 128, 0);
  }

  meta({ rowsRead = 0, rowsWritten = 0, changes = 0 } = {}) {
    return {
      duration: 0.1,
      rows_read: rowsRead,
      rows_written: rowsWritten,
      changes,
      size_after: this.sizeAfter()
    };
  }

  prepare(sql) {
    const db = this;
    let args = [];
    const statement = {
      bind(...values) {
        args = values;
        return statement;
      },
      async first() {
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE account_id = ?")) {
          db.accountReads += 1;
          return db.account?.account_id === args[0] ? { ...db.account } : null;
        }
        if (sql === "SELECT COUNT(*) AS count FROM step7d_recipe_oracle") {
          db.oracleReads += 1;
          return { count: db.oracle.length };
        }
        throw new Error(`Unhandled first SQL: ${sql}`);
      },
      async all() {
        if (sql.includes("FROM step7d_recipe_oracle WHERE recipe_id = ?")) {
          db.oracleReads += 1;
          const found = db.oracle.find(row => row.recipe_id === args[0]);
          return { results: found ? [{ ...found }] : [], meta: db.meta({ rowsRead: found ? 1 : 0 }) };
        }
        if (sql.includes("FROM step7d_recipe_oracle ORDER BY ordinal ASC LIMIT 1")) {
          db.oracleReads += 1;
          const first = [...db.oracle].sort((a, b) => a.ordinal - b.ordinal)[0];
          return { results: first ? [{ ...first }] : [], meta: db.meta({ rowsRead: first ? 1 : 0 }) };
        }
        if (sql.includes("FROM step7d_recipe_oracle ORDER BY ordinal ASC")) {
          db.oracleReads += 1;
          const rows = [...db.oracle].sort((a, b) => a.ordinal - b.ordinal).map(row => ({ ...row }));
          return { results: rows, meta: db.meta({ rowsRead: rows.length }) };
        }
        throw new Error(`Unhandled all SQL: ${sql}`);
      },
      async run() {
        if (sql.includes("CREATE TABLE IF NOT EXISTS step7d_recipe_oracle")) {
          return { success: true, meta: db.meta() };
        }
        if (sql.startsWith("INSERT INTO step7d_recipe_oracle")) {
          const [ordinal, recipeId, bodyJson, bodyBytes] = args;
          if (db.oracle.some(row => row.ordinal === ordinal || row.recipe_id === recipeId)) {
            throw new Error("duplicate oracle row");
          }
          db.oracle.push({ ordinal, recipe_id: recipeId, body_json: bodyJson, body_bytes: bodyBytes });
          db.oracleWrites += 1;
          return { success: true, meta: db.meta({ rowsWritten: 1, changes: 1 }) };
        }
        throw new Error(`Unhandled run SQL: ${sql}`);
      }
    };
    return statement;
  }

  async batch(statements) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }
}

function ownerAccount(version = 1) {
  return {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: version
  };
}

async function sessionToken(accountId = "owner-account", version = 1) {
  return createSessionToken({ accountId, sessionVersion: version, ttlSeconds: 3600 }, SECRET);
}

function request(path, token, { method = "GET", origin = null } = {}) {
  const headers = {};
  if (token) headers.cookie = `__Host-culinary_session=${token}`;
  if (origin) headers.origin = origin;
  return new Request(`${ORIGIN}${path}`, { method, headers });
}

function env(db) {
  return { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db };
}

test("Step 7D golden oracle is exactly the reviewed 84-record corpus", async () => {
  assert.equal(ALL_RECIPES.length, STEP7D_EXPECTED_RECIPE_COUNT);
  const rows = serializeStep7dOracleRows(ALL_RECIPES);
  assert.equal(new Set(rows.map(row => row.recipeId)).size, STEP7D_EXPECTED_RECIPE_COUNT);
  assert.match(await step7dOracleFingerprint(rows), /^[0-9a-f]{64}$/);
});

test("authenticated same-origin bootstrap writes and verifies the 84-record D1 oracle idempotently", async () => {
  const db = new Step7dFakeD1(ownerAccount());
  const token = await sessionToken();
  const first = await bootstrapStep7d({
    request: request("/api/step7d/bootstrap", token, { method: "POST", origin: ORIGIN }),
    env: env(db)
  });
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.idempotent, false);
  assert.equal(firstBody.recipeCount, STEP7D_EXPECTED_RECIPE_COUNT);
  assert.equal(db.oracleWrites, STEP7D_EXPECTED_RECIPE_COUNT);
  assert.equal(db.oracle.length, STEP7D_EXPECTED_RECIPE_COUNT);
  assert.equal(firstBody.metrics.writeBatch.rowsWritten, STEP7D_EXPECTED_RECIPE_COUNT);

  const writesBeforeSecond = db.oracleWrites;
  const second = await bootstrapStep7d({
    request: request("/api/step7d/bootstrap", token, { method: "POST", origin: ORIGIN }),
    env: env(db)
  });
  assert.equal(second.status, 200);
  const secondBody = await second.json();
  assert.equal(secondBody.idempotent, true);
  assert.equal(secondBody.fingerprint, firstBody.fingerprint);
  assert.equal(db.oracleWrites, writesBeforeSecond);
});

test("protected Step 7D audit and sample require a valid current account and read D1 only after auth", async () => {
  const db = new Step7dFakeD1(ownerAccount());
  const token = await sessionToken();
  await bootstrapStep7d({
    request: request("/api/step7d/bootstrap", token, { method: "POST", origin: ORIGIN }),
    env: env(db)
  });

  const audit = await readStep7d({ request: request("/api/step7d/oracle", token), env: env(db) });
  assert.equal(audit.status, 200);
  const auditBody = await audit.json();
  assert.equal(auditBody.oracleReady, true);
  assert.equal(auditBody.recipeCount, STEP7D_EXPECTED_RECIPE_COUNT);
  assert.equal(auditBody.authenticated, true);
  assert.equal(auditBody.protectedDataReturned, false);
  assert.equal(auditBody.metrics.d1.rowsRead, STEP7D_EXPECTED_RECIPE_COUNT);

  const sample = await readStep7d({ request: request("/api/step7d/oracle?sample=1", token), env: env(db) });
  assert.equal(sample.status, 200);
  const sampleBody = await sample.json();
  assert.equal(sampleBody.protectedDataReturned, true);
  assert.equal(sampleBody.recipe.id, ALL_RECIPES[0].id);
  assert.equal(sampleBody.metrics.d1.rowsRead, 1);
});

test("unauthenticated and non-member sessions cannot reach protected oracle data", async () => {
  const db = new Step7dFakeD1(ownerAccount());
  const noSession = await readStep7d({ request: request("/api/step7d/oracle", null), env: env(db) });
  assert.equal(noSession.status, 401);
  assert.equal((await noSession.json()).reason, "NO_SESSION");
  assert.equal(db.accountReads, 0);
  assert.equal(db.oracleReads, 0);

  const unknownToken = await sessionToken("not-invited-account", 1);
  const unknown = await readStep7d({ request: request("/api/step7d/oracle", unknownToken), env: env(db) });
  assert.equal(unknown.status, 401);
  assert.equal((await unknown.json()).reason, "ACCOUNT_DISABLED");
  assert.equal(db.oracleReads, 0);
});

test("revoked session and simulated Free-limit failure both fail closed without recipe data", async () => {
  const db = new Step7dFakeD1(ownerAccount());
  const token = await sessionToken();
  await bootstrapStep7d({
    request: request("/api/step7d/bootstrap", token, { method: "POST", origin: ORIGIN }),
    env: env(db)
  });

  const readsBeforeLimit = db.oracleReads;
  const limited = await readStep7d({
    request: request("/api/step7d/oracle?simulate=free-limit", token),
    env: env(db)
  });
  assert.equal(limited.status, 503);
  const limitedBody = await limited.json();
  assert.equal(limitedBody.error, "FREE_LIMIT_FAIL_CLOSED");
  assert.equal(limitedBody.protectedDataReturned, false);
  assert.equal(limitedBody.metrics.oracleQueries, 0);
  assert.equal(db.oracleReads, readsBeforeLimit);

  db.account.session_version = 2;
  const revoked = await readStep7d({ request: request("/api/step7d/oracle", token), env: env(db) });
  assert.equal(revoked.status, 401);
  const revokedBody = await revoked.json();
  assert.equal(revokedBody.reason, "SESSION_REVOKED");
  assert.match(revoked.headers.get("set-cookie") || "", /Max-Age=0/);
  assert.equal(db.oracleReads, readsBeforeLimit);
});

test("Step 7D bootstrap rejects cross-origin mutation before auth or D1 writes", async () => {
  const db = new Step7dFakeD1(ownerAccount());
  const token = await sessionToken();
  const response = await bootstrapStep7d({
    request: request("/api/step7d/bootstrap", token, {
      method: "POST",
      origin: "https://attacker.example"
    }),
    env: env(db)
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "INVALID_ORIGIN");
  assert.equal(db.accountReads, 0);
  assert.equal(db.oracleWrites, 0);
});
