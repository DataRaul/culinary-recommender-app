import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const outputPath = process.argv[3] || "usda-foundation-portions.json";
if (!root) throw new Error("Usage: node scripts/extract-usda-portions.mjs <csv-dir> [output]");

const TARGETS = {
  chicken_breast: "100304",
  black_beans: "100314",
  white_beans: "100316",
  pinto_beans: "100321",
  kidney_beans: "100318",
  green_beans: "11052",
  avocado: "100348",
  banana: "9040",
  tuna: "15121",
  cashews: "12087",
  almonds: "12061",
  walnuts: "12155",
  pumpkin_seeds: "12014",
  sunflower_seeds: "12036"
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
  return rows.filter(r => r.some(Boolean)).map(values => Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ""])));
}

const normalizedKey = key => String(key || "").trim().toLowerCase();
function rowValue(row, wantedKey) {
  const wanted = normalizedKey(wantedKey);
  const actual = Object.keys(row || {}).find(key => normalizedKey(key) === wanted);
  return actual ? row[actual] : undefined;
}

const tables = new Map();
for (const name of readdirSync(root).filter(name => name.endsWith(".csv"))) {
  tables.set(name, parseCsv(readFileSync(join(root, name), "utf8")));
}

function requireTable(name, requiredColumns) {
  const rows = tables.get(name);
  if (!rows) throw new Error(`Missing required USDA table: ${name}`);
  const keys = new Set(Object.keys(rows[0] || {}).map(normalizedKey));
  for (const key of requiredColumns) if (!keys.has(normalizedKey(key))) throw new Error(`${name} missing column ${key}`);
  return rows;
}

const foundationRows = requireTable("foundation_food.csv", ["fdc_id", "ndb_number"]);
const foodRows = requireTable("food.csv", ["fdc_id", "description"]);
const portionRows = requireTable("food_portion.csv", ["fdc_id", "amount", "gram_weight"]);
const measureRows = tables.get("measure_unit.csv") || [];

const targetByNdb = new Map(Object.entries(TARGETS).map(([ingredientId, ndb]) => [String(ndb), ingredientId]));
const fdcToIngredient = new Map();
const identities = {};
for (const row of foundationRows) {
  const ndb = String(rowValue(row, "ndb_number") || "").trim().replace(/^0+/, "") || "0";
  const ingredientId = targetByNdb.get(ndb);
  if (!ingredientId) continue;
  const fdcId = String(rowValue(row, "fdc_id") || "").trim();
  if (!fdcId) continue;
  fdcToIngredient.set(fdcId, ingredientId);
  identities[ingredientId] = { ndbNumber: ndb, fdcId };
}

const foodByFdc = new Map(foodRows.map(row => [String(rowValue(row, "fdc_id") || "").trim(), row]));
for (const [fdcId, ingredientId] of fdcToIngredient) {
  const food = foodByFdc.get(fdcId) || {};
  identities[ingredientId].description = rowValue(food, "description") || null;
}

const measures = new Map();
for (const row of measureRows) {
  const id = String(rowValue(row, "id") || "").trim();
  if (!id) continue;
  measures.set(id, {
    name: rowValue(row, "name") || null,
    abbreviation: rowValue(row, "abbreviation") || null
  });
}

const portions = Object.fromEntries(Object.keys(TARGETS).map(id => [id, []]));
for (const row of portionRows) {
  const fdcId = String(rowValue(row, "fdc_id") || "").trim();
  const ingredientId = fdcToIngredient.get(fdcId);
  if (!ingredientId) continue;
  const amount = Number(rowValue(row, "amount"));
  const gramWeight = Number(rowValue(row, "gram_weight"));
  if (!Number.isFinite(amount) || !Number.isFinite(gramWeight) || amount <= 0 || gramWeight <= 0) continue;
  const measureUnitId = String(rowValue(row, "measure_unit_id") || "").trim() || null;
  portions[ingredientId].push({
    amount,
    gramWeight,
    gramsPerUnit: Number((gramWeight / amount).toFixed(6)),
    measureUnitId,
    measureUnit: measureUnitId ? measures.get(measureUnitId) || null : null,
    portionDescription: rowValue(row, "portion_description") || null,
    modifier: rowValue(row, "modifier") || null,
    dataPoints: rowValue(row, "data_points") ? Number(rowValue(row, "data_points")) : null,
    footnote: rowValue(row, "footnote") || null,
    minYearAcquired: rowValue(row, "min_year_acquired") || null
  });
}

for (const rows of Object.values(portions)) rows.sort((a, b) =>
  String(a.portionDescription || a.modifier || a.measureUnit?.name || "").localeCompare(String(b.portionDescription || b.modifier || b.measureUnit?.name || "")) ||
  a.gramWeight - b.gramWeight
);

const missingIdentities = Object.keys(TARGETS).filter(id => !identities[id]);
if (missingIdentities.length) throw new Error(`Missing mapped NDB identities: ${missingIdentities.join(", ")}`);

const result = {
  source: {
    name: "USDA FoodData Central — Foundation Foods",
    releaseDate: "2026-04-30",
    releaseVersion: "15.0",
    archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip",
    sourceUrl: "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip"
  },
  extraction: {
    targetCount: Object.keys(TARGETS).length,
    portionTable: "food_portion.csv",
    measureUnitTablePresent: measureRows.length > 0
  },
  identities,
  portions
};

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted USDA portion rows for ${Object.values(portions).filter(rows => rows.length).length}/${Object.keys(TARGETS).length} mapped foods.`);
