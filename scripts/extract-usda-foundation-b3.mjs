import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const targetPath = process.argv[3] || "scripts/usda-foundation-b3-targets.json";
const outputPath = process.argv[4] || "usda-foundation-b3-extract.json";
if (!root) throw new Error("Usage: node scripts/extract-usda-foundation-b3.mjs <csv-dir> [targets-json] [output]");

const targets = JSON.parse(readFileSync(targetPath, "utf8"));

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
  const headers = (rows.shift() || []).map(value => value.trim().toLowerCase());
  return rows.filter(r => r.some(Boolean)).map(values => Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ""])));
}

const table = name => parseCsv(readFileSync(join(root, name), "utf8"));
const foundation = table("foundation_food.csv");
const foods = table("food.csv");
const foodNutrients = table("food_nutrient.csv");
const portions = table("food_portion.csv");
const measureUnits = table("measure_unit.csv");

const targetByNdb = new Map(Object.entries(targets).map(([ingredientId, spec]) => [String(spec.ndbNumber), { ingredientId, ...spec }]));
const foodByFdc = new Map(foods.map(row => [String(row.fdc_id).trim(), row]));
const measureById = new Map(measureUnits.map(row => [String(row.id).trim(), row]));
const fdcToTarget = new Map();
const records = {};

for (const row of foundation) {
  const ndb = String(row.ndb_number || "").trim().replace(/^0+/, "") || "0";
  const target = targetByNdb.get(ndb);
  if (!target) continue;
  const fdcId = String(row.fdc_id).trim();
  const food = foodByFdc.get(fdcId);
  if (!food) throw new Error(`Missing food row for ${target.ingredientId} / FDC ${fdcId}`);
  const description = food.description || null;
  if (description !== target.expectedDescription) {
    throw new Error(`${target.ingredientId}: expected description ${JSON.stringify(target.expectedDescription)}, found ${JSON.stringify(description)}`);
  }
  fdcToTarget.set(fdcId, target.ingredientId);
  records[target.ingredientId] = {
    fdcId,
    ndbNumber: ndb,
    description,
    publicationDate: food.publication_date || null,
    per100g: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null },
    nutrientIds: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null },
    portions: []
  };
}

const energyPriority = ["2048", "2047", "1008"];
const nutrientToField = new Map([["1003","proteinG"],["1004","fatG"],["1005","carbohydrateG"],["1079","fibreG"]]);
const energyCandidates = new Map();

for (const row of foodNutrients) {
  const fdcId = String(row.fdc_id).trim();
  const ingredientId = fdcToTarget.get(fdcId);
  if (!ingredientId) continue;
  const nutrientId = String(row.nutrient_id).trim();
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) continue;
  if (energyPriority.includes(nutrientId)) {
    if (!energyCandidates.has(ingredientId)) energyCandidates.set(ingredientId, new Map());
    energyCandidates.get(ingredientId).set(nutrientId, amount);
    continue;
  }
  const field = nutrientToField.get(nutrientId);
  if (!field) continue;
  records[ingredientId].per100g[field] = amount;
  records[ingredientId].nutrientIds[field] = nutrientId;
}

for (const ingredientId of Object.keys(records)) {
  const candidates = energyCandidates.get(ingredientId) || new Map();
  const selectedId = energyPriority.find(id => candidates.has(id)) || null;
  if (selectedId) {
    records[ingredientId].per100g.energyKcal = candidates.get(selectedId);
    records[ingredientId].nutrientIds.energyKcal = selectedId;
  }
}

for (const row of portions) {
  const fdcId = String(row.fdc_id).trim();
  const ingredientId = fdcToTarget.get(fdcId);
  if (!ingredientId) continue;
  const amount = Number(row.amount);
  const gramWeight = Number(row.gram_weight);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(gramWeight) || gramWeight <= 0) continue;
  const measureUnitId = String(row.measure_unit_id || "").trim();
  const measure = measureById.get(measureUnitId) || {};
  records[ingredientId].portions.push({
    amount,
    gramWeight,
    gramsPerUnit: Number((gramWeight / amount).toFixed(6)),
    measureUnitId: measureUnitId || null,
    measureUnit: measure.name || null,
    abbreviation: measure.abbreviation || null,
    modifier: row.modifier || null,
    portionDescription: row.portion_description || null,
    dataPoints: row.data_points ? Number(row.data_points) : null,
    minYearAcquired: row.min_year_acquired || null
  });
}

for (const record of Object.values(records)) record.portions.sort((a,b) =>
  String(a.measureUnit || a.modifier || "").localeCompare(String(b.measureUnit || b.modifier || "")) || a.gramWeight - b.gramWeight
);

const missing = Object.keys(targets).filter(id => !records[id]);
if (missing.length) throw new Error(`Reviewed targets missing from Foundation release: ${missing.join(", ")}`);

const result = {
  source: {
    name: "USDA FoodData Central — Foundation Foods",
    releaseDate: "2026-04-30",
    releaseVersion: "15.0",
    archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip"
  },
  targetCount: Object.keys(targets).length,
  records
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted ${Object.keys(records).length} reviewed Foundation B3 records.`);
