import { readFileSync, writeFileSync } from "node:fs";

const xmlPath = process.argv[2];
const targetsPath = process.argv[3];
const outputPath = process.argv[4] || "ciqual-b4-candidates.json";
if (!xmlPath || !targetsPath) throw new Error("Usage: node scripts/discover-ciqual-candidates.mjs <alim.xml> <targets.json> [output]");

const xml = readFileSync(xmlPath, "utf8");
const targets = JSON.parse(readFileSync(targetsPath, "utf8"));

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
const normalize = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/œ/g, "oe")
  .toLowerCase();

const blocks = xml.split(/<\/(?:alim|ALIM)>/i).filter(block => /<alim_code>/i.test(block));
if (blocks.length < 3000) throw new Error(`Unexpected Ciqual alim XML structure: found ${blocks.length} food records`);

const foods = blocks.map(block => ({
  alimCode: tag(block, "alim_code"),
  nameFr: tag(block, "alim_nom_fr"),
  nameEn: tag(block, "alim_nom_eng"),
  scientificName: tag(block, "alim_nom_sci"),
  groupCode: tag(block, "alim_grp_code"),
  subgroupCode: tag(block, "alim_ssgrp_code"),
  subsubgroupCode: tag(block, "alim_ssssgrp_code")
})).filter(food => food.alimCode);

const candidates = {};
for (const [canonicalIngredientId, queries] of Object.entries(targets)) {
  const scored = new Map();
  for (const food of foods) {
    const haystack = normalize(`${food.nameEn} ${food.nameFr} ${food.scientificName}`);
    let score = 0;
    const matchedQueries = [];
    for (const query of queries) {
      const q = normalize(query);
      if (haystack.includes(q)) {
        matchedQueries.push(query);
        score += q.split(/\s+/).length * 10 + Math.min(8, q.length / 5);
      } else {
        const tokens = q.split(/\s+/).filter(token => token.length > 2);
        const hits = tokens.filter(token => haystack.includes(token)).length;
        if (hits && hits === tokens.length) {
          matchedQueries.push(query);
          score += hits * 5;
        }
      }
    }
    if (score > 0) scored.set(food.alimCode, { ...food, score: Number(score.toFixed(2)), matchedQueries });
  }
  candidates[canonicalIngredientId] = [...scored.values()]
    .sort((a, b) => b.score - a.score || a.nameEn.localeCompare(b.nameEn) || Number(a.alimCode) - Number(b.alimCode))
    .slice(0, 12);
}

const result = {
  source: {
    id: "anses-ciqual-2025",
    name: "ANSES-Ciqual 2025 food composition table",
    releaseDate: "2025-11-19",
    datasetDoi: "10.57745/RDMHWY",
    alimFileDoi: "10.57745/OH8KXC",
    license: "Etalab Open Licence 2.0",
    attribution: "Anses. 2025. Table de composition nutritionnelle des aliments Ciqual"
  },
  extraction: {
    foodCount: foods.length,
    targetCount: Object.keys(targets).length,
    queryCount: Object.values(targets).reduce((sum, queries) => sum + queries.length, 0)
  },
  candidates
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Scanned ${foods.length} Ciqual foods for ${result.extraction.targetCount} canonical targets.`);
