import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runner = await readFile(new URL("../step8g-v8007-populate.html", import.meta.url), "utf8");

test("v8007 historical hydration canaries normalize markdown-derived IDs", () => {
  assert.ok(runner.includes('const historicalSlug=String(appendMd?`${row.slug}.md`:row.slug||row.title).replace(/\\.md$/i,"");'));
  assert.ok(runner.includes('"ora_abbott_1864_",true'));
  assert.ok(runner.includes('"ora_bosse_watanna_1914_",true'));
  assert.ok(runner.includes('"ora_turabi_1864_",false'));
  assert.ok(!runner.includes('return `${prefix}${slug(appendMd?`${row.slug}.md`:row.slug||row.title)}`;'));
});
