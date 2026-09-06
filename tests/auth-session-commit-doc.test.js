import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("real-session commit diagnostic documentation preserves privacy and no-cost boundaries", () => {
  const doc = readFileSync(new URL("../docs/CORPUS_SCALE_STEP7E_AUTH_SESSION_COMMIT_DIAGNOSTIC.md", import.meta.url), "utf8");
  assert.match(doc, /BOUNDED LIVE DIAGNOSTIC/);
  assert.match(doc, /no billing/i);
  assert.match(doc, /no new D1 database or recipe-body shard/i);
  assert.match(doc, /no public ForkRecipe activation/i);
  assert.match(doc, /never reports account ID, email, Google credential, session token, cookie value/i);
});
