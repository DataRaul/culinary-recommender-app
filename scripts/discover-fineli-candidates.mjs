import { readFileSync, writeFileSync } from "node:fs";

const targetsPath = process.argv[2];
const outputPath = process.argv[3] || "fineli-b4-candidates.json";
if (!targetsPath) throw new Error("Usage: node scripts/discover-fineli-candidates.mjs <targets.json> [output]");

const targets = JSON.parse(readFileSync(targetsPath, "utf8"));
const base = "https://fineli.fi/fineli/api/v1";

const fetchJson = async url => {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "culinary-recommender-app-evidence-extractor/1.0"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
};

const components = await fetchJson(`${base}/components/`);
const candidates = {};
for (const [canonicalIngredientId, queries] of Object.entries(targets)) {
  candidates[canonicalIngredientId] = [];
  for (const query of queries) {
    const url = `${base}/foods?q=${encodeURIComponent(query)}`;
    const payload = await fetchJson(url);
    candidates[canonicalIngredientId].push({ query, url, payload });
  }
}

const result = {
  source: {
    id: "fineli-thl-open-data",
    name: "Fineli — Finnish Institute for Health and Welfare (THL)",
    homepage: "https://fineli.fi/fineli/en/index",
    openDataPage: "https://fineli.fi/fineli/fi/avoin-data",
    apiBase: base,
    license: "CC BY 4.0",
    attribution: "Finnish Institute for Health and Welfare, Fineli"
  },
  extraction: {
    extractedAt: new Date().toISOString(),
    targetCount: Object.keys(targets).length,
    queryCount: Object.values(targets).reduce((sum, queries) => sum + queries.length, 0)
  },
  components,
  candidates
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Captured Fineli candidate responses for ${result.extraction.targetCount} canonical ingredients.`);
