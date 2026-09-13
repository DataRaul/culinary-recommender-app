import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(ROOT, "step8b-canary.html"), "utf8");

test("Step 8B canary preserves a legitimate zero shard-query count", () => {
  assert.match(
    page,
    /Number\(freeLimit\.body\?\.metrics\?\.shardQueries \?\? -1\) !== 0/
  );
  assert.doesNotMatch(
    page,
    /Number\(freeLimit\.body\?\.metrics\?\.shardQueries \|\| -1\) !== 0/
  );
});
