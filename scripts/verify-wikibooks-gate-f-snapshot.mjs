import fs from "node:fs/promises";

const API = "https://en.wikibooks.org/w/api.php";
const USER_AGENT = "culinary-recommender-app/1.1 (https://github.com/DataRaul/culinary-recommender-app)";
const manifest = JSON.parse(await fs.readFile(new URL("./wikibooks-gate-f-snapshot-v1.json", import.meta.url), "utf8"));

const fetchRevision = async revid => {
  const url = new URL(API);
  for (const [key, value] of Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    revids: revid,
    prop: "revisions",
    rvprop: "ids|timestamp|content",
    rvslots: "main"
  })) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Wikibooks API ${response.status} for revision ${revid}`);
  const data = await response.json();
  const page = data.query?.pages?.[0];
  const revision = page?.revisions?.[0];
  return {
    pageid: page?.pageid,
    title: page?.title,
    revid: revision?.revid,
    timestamp: revision?.timestamp,
    wikitext: revision?.slots?.main?.content || ""
  };
};

const results = [];
for (const expected of manifest.records) {
  const actual = await fetchRevision(expected.revid);
  const failures = [];
  if (actual.pageid !== expected.pageid) failures.push(`pageid:${actual.pageid}`);
  if (actual.title !== expected.title) failures.push(`title:${actual.title}`);
  if (actual.revid !== expected.revid) failures.push(`revid:${actual.revid}`);
  if (actual.timestamp !== expected.timestamp) failures.push(`timestamp:${actual.timestamp}`);
  if (!/==\s*Ingredients\s*==/i.test(actual.wikitext)) failures.push("missing Ingredients section");
  if (!/==\s*(Procedure|Preparation)\s*==/i.test(actual.wikitext)) failures.push("missing Procedure/Preparation section");
  if (/\{\{\s*Incomplete recipe/i.test(actual.wikitext)) failures.push("source marked incomplete");
  results.push({ id: expected.id, pageid: actual.pageid, revid: actual.revid, timestamp: actual.timestamp, failures });
  await new Promise(resolve => setTimeout(resolve, 120));
}

const failed = results.filter(row => row.failures.length);
console.log(JSON.stringify({
  schemaVersion: "wikibooks-gate-f-snapshot-verification-v1",
  checked: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
}, null, 2));

if (failed.length) process.exitCode = 1;
