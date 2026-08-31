import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const outputPath = process.argv[3] || "usda-foundation-candidates.json";
if (!root) throw new Error("Usage: node scripts/discover-usda-foundation-candidates.mjs <csv-dir> [output]");

const TARGETS = {
  olive_oil: { includeAny: ["olive oil"] },
  onion: { includeAny: ["onion"] },
  garlic: { includeAny: ["garlic"] },
  tomato: { includeAny: ["tomato"] },
  potato: { includeAny: ["potato"] },
  sweet_potato: { includeAny: ["sweet potato"] },
  bell_pepper: { includeAny: ["bell pepper", "sweet pepper"] },
  spinach: { includeAny: ["spinach"] },
  carrot: { includeAny: ["carrot"] },
  broccoli: { includeAny: ["broccoli"] },
  cauliflower: { includeAny: ["cauliflower"] },
  cucumber: { includeAny: ["cucumber"] },
  mushroom: { includeAny: ["mushroom"] },
  chickpeas: { includeAny: ["chickpea", "garbanzo"] },
  lentils: { includeAny: ["lentil"] },
  eggs: { includeAny: ["egg"] },
  milk: { includeAny: ["milk"] },
  greek_yogurt: { includeAny: ["yogurt", "yoghurt"] },
  salmon: { includeAny: ["salmon"] },
  cod: { includeAny: ["cod"] },
  hake: { includeAny: ["hake"] },
  tofu_firm: { includeAny: ["tofu"] },
  quinoa: { includeAny: ["quinoa"] },
  oats: { includeAny: ["oat"] },
  rice: { includeAny: ["rice"] },
  pineapple: { includeAny: ["pineapple"] },
  mango: { includeAny: ["mango"] },
  apple: { includeAny: ["apple"] },
  lemon: { includeAny: ["lemon"] },
  lime: { includeAny: ["lime"] },
  orange: { includeAny: ["orange"] }
};

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ""; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.filter(r => r.some(Boolean)).map(values => Object.fromEntries(headers.map((h, idx) => [h.trim().toLowerCase(), values[idx] ?? ""])));
}

const csvFiles = readdirSync(root).filter(name => name.endsWith(".csv"));
const tables = new Map(csvFiles.map(name => [name, parseCsv(readFileSync(join(root, name), "utf8"))]));
const foundation = tables.get("foundation_food.csv");
const food = tables.get("food.csv");
if (!foundation || !food) throw new Error("Expected foundation_food.csv and food.csv");

const foundationByFdc = new Map(foundation.map(row => [String(row.fdc_id).trim(), row]));
const catalogue = food
  .filter(row => foundationByFdc.has(String(row.fdc_id).trim()))
  .map(row => {
    const fdcId = String(row.fdc_id).trim();
    const foundationRow = foundationByFdc.get(fdcId);
    return {
      fdcId,
      ndbNumber: String(foundationRow.ndb_number || "").trim().replace(/^0+/, "") || null,
      description: row.description || null,
      publicationDate: row.publication_date || null,
      dataType: row.data_type || "Foundation"
    };
  });

const normalize = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const scoreCandidate = (description, spec) => {
  const normalized = normalize(description);
  let score = 0;
  for (const phrase of spec.includeAny) {
    const p = normalize(phrase);
    if (normalized === p) score += 100;
    if (normalized.startsWith(`${p},`) || normalized.startsWith(`${p} `)) score += 30;
    if (normalized.includes(p)) score += 10;
  }
  for (const preferred of ["raw", "whole", "fresh", "cooked", "canned", "drained", "plain"]) {
    if (normalized.includes(preferred)) score += 1;
  }
  return score;
};

const candidates = {};
for (const [ingredientId, spec] of Object.entries(TARGETS)) {
  const matches = catalogue
    .filter(item => spec.includeAny.some(phrase => normalize(item.description).includes(normalize(phrase))))
    .map(item => ({ ...item, score: scoreCandidate(item.description, spec) }))
    .sort((a, b) => b.score - a.score || String(a.description).localeCompare(String(b.description)) || Number(a.fdcId) - Number(b.fdcId));
  candidates[ingredientId] = matches.slice(0, 25);
}

const result = {
  source: {
    name: "USDA FoodData Central — Foundation Foods",
    releaseDate: "2026-04-30",
    releaseVersion: "15.0",
    archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip"
  },
  targetCount: Object.keys(TARGETS).length,
  foundationCatalogueCount: catalogue.length,
  candidates
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Discovered candidate lists for ${Object.keys(TARGETS).length} canonical ingredients across ${catalogue.length} Foundation foods.`);
