import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const outputPath = process.argv[3] || "usda-foundation-extract.json";
if (!root) throw new Error("Usage: node scripts/extract-usda-foundation.mjs <csv-dir> [output]");

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

const csvFiles = readdirSync(root).filter(name => name.endsWith(".csv"));
const tables = new Map();
for (const name of csvFiles) {
  const rows = parseCsv(readFileSync(join(root, name), "utf8"));
  tables.set(name, rows);
}

const normalizedKey = key => String(key || "").trim().toLowerCase();
function rowValue(row, wantedKey) {
  const wanted = normalizedKey(wantedKey);
  const actual = Object.keys(row || {}).find(key => normalizedKey(key) === wanted);
  return actual ? row[actual] : undefined;
}

function findTable(required) {
  for (const [name, rows] of tables) {
    const keys = new Set(Object.keys(rows[0] || {}).map(normalizedKey));
    if (required.every(key => keys.has(normalizedKey(key)))) return { name, rows };
  }
  throw new Error(`Could not locate table with columns: ${required.join(", ")}`);
}

const ndbTable = tables.has("foundation_food.csv")
  ? { name: "foundation_food.csv", rows: tables.get("foundation_food.csv") }
  : findTable(["fdc_id", "ndb_number"]);
const foodTable = tables.has("food.csv")
  ? { name: "food.csv", rows: tables.get("food.csv") }
  : findTable(["fdc_id", "description"]);
const nutrientTable = tables.has("food_nutrient.csv")
  ? { name: "food_nutrient.csv", rows: tables.get("food_nutrient.csv") }
  : findTable(["fdc_id", "nutrient_id", "amount"]);

const targetByNdb = new Map(Object.entries(TARGETS).map(([ingredientId, ndb]) => [ndb, ingredientId]));
const fdcToIngredient = new Map();
const identities = {};

for (const row of ndbTable.rows) {
  const ndb = String(rowValue(row, "ndb_number") || "").trim().replace(/^0+/, "") || "0";
  const ingredientId = targetByNdb.get(ndb);
  if (!ingredientId) continue;
  const fdcId = String(rowValue(row, "fdc_id") || "").trim();
  if (!fdcId) continue;
  fdcToIngredient.set(fdcId, ingredientId);
  identities[ingredientId] = { ndbNumber: ndb, fdcId };
}

const foodByFdc = new Map(foodTable.rows.map(row => [String(rowValue(row, "fdc_id") || "").trim(), row]));
for (const [fdcId, ingredientId] of fdcToIngredient) {
  const food = foodByFdc.get(fdcId) || {};
  identities[ingredientId].description = rowValue(food, "description") || null;
  identities[ingredientId].publicationDate = rowValue(food, "publication_date") || null;
  identities[ingredientId].dataType = rowValue(food, "data_type") || "Foundation";
}

const wantedNutrients = new Set(["1003", "1004", "1005", "1008", "1079", "2047", "2048"]);
const nutrients = Object.fromEntries(Object.keys(TARGETS).map(id => [id, []]));
for (const row of nutrientTable.rows) {
  const fdcId = String(rowValue(row, "fdc_id") || "").trim();
  const ingredientId = fdcToIngredient.get(fdcId);
  if (!ingredientId) continue;
  const nutrientId = String(rowValue(row, "nutrient_id") || "").trim();
  if (!wantedNutrients.has(nutrientId)) continue;
  const amountRaw = rowValue(row, "amount");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) continue;
  const numericOrNull = key => {
    const raw = rowValue(row, key);
    if (raw === undefined || raw === null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  nutrients[ingredientId].push({
    nutrientId,
    amount,
    dataPoints: numericOrNull("data_points"),
    derivationId: rowValue(row, "derivation_id") || null,
    min: numericOrNull("min"),
    max: numericOrNull("max"),
    median: numericOrNull("median")
  });
}

const missingIdentities = Object.keys(TARGETS).filter(id => !identities[id]);
if (missingIdentities.length) {
  const sample = ndbTable.rows.slice(0, 5).map(row => ({
    fdcId: rowValue(row, "fdc_id"),
    ndbNumber: rowValue(row, "ndb_number")
  }));
  throw new Error(`Missing mapped NDB identities: ${missingIdentities.join(", ")}; table=${ndbTable.name}; sample=${JSON.stringify(sample)}`);
}

const result = {
  source: {
    name: "USDA FoodData Central — Foundation Foods",
    releaseDate: "2026-04-30",
    releaseVersion: "15.0",
    archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip",
    sourceUrl: "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip"
  },
  extraction: {
    identityTable: ndbTable.name,
    foodTable: foodTable.name,
    nutrientTable: nutrientTable.name,
    targetCount: Object.keys(TARGETS).length
  },
  identities,
  nutrients
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted ${Object.keys(identities).length} mapped Foundation foods to ${outputPath}.`);
