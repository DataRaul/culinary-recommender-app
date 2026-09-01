import { readFileSync, writeFileSync } from "node:fs";

const [alimPath, targetsPath, outputPath = "ciqual-b7-candidates.json"] = process.argv.slice(2);
if (!alimPath || !targetsPath) throw new Error("Usage: node scripts/ciqual-b7-discover.mjs <alim.xml> <targets.json> [output]");

const decode = value => String(value || "")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&apos;", "'")
  .trim();
const tag = (block, name) => {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decode(match[1]) : "";
};
const records = xml => xml
  .split(/<\/ALIM>/i)
  .filter(block => /<alim_code>/i.test(block));
const normalize = value => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const foods = records(readFileSync(alimPath, "utf8")).map(block => ({
  alimCode: tag(block, "alim_code"),
  nameFr: tag(block, "alim_nom_fr"),
  nameEn: tag(block, "alim_nom_eng"),
  scientificName: tag(block, "alim_nom_sci") || null
}));
const targets = JSON.parse(readFileSync(targetsPath, "utf8"));

function scoreQuery(query, food) {
  const q = normalize(query);
  const en = normalize(food.nameEn);
  const fr = normalize(food.nameFr);
  const sci = normalize(food.scientificName);
  let score = 0;
  for (const value of [en, fr, sci]) {
    if (!value || !q) continue;
    if (value === q) score = Math.max(score, 100);
    if (value.startsWith(`${q} `)) score = Math.max(score, 90);
    if (value.includes(q)) score = Math.max(score, 75);
    const words = q.split(" ").filter(Boolean);
    if (words.length && words.every(word => value.includes(word))) score = Math.max(score, 65 + Math.min(10, words.length * 2));
  }
  return score;
}

const results = {};
for (const [ingredientId, target] of Object.entries(targets)) {
  const candidates = foods
    .map(food => ({
      ...food,
      score: Math.max(...target.queries.map(query => scoreQuery(query, food))),
      matchedQueries: target.queries.filter(query => scoreQuery(query, food) > 0)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.nameEn.localeCompare(b.nameEn) || a.alimCode.localeCompare(b.alimCode))
    .slice(0, 25);
  results[ingredientId] = { ...target, candidates };
}

const report = {
  schemaVersion: "ciqual-b7-recipe-unlock-discovery-v1",
  source: {
    dataset: "ANSES-Ciqual 2025",
    datasetDoi: "10.57745/RDMHWY",
    foodCatalogueDoi: "10.57745/OH8KXC",
    foodCatalogueMd5: "8e1171d63cee4b6010cfce25dd29243d"
  },
  rules: {
    discoveryOnly: true,
    noAutomaticPromotion: true,
    prioritizeRecipeUnlocks: true,
    requireManualFoodFormReview: true
  },
  targetCount: Object.keys(targets).length,
  results
};
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
