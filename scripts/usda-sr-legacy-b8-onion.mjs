import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const outputPath = process.argv[3] || "usda-sr-legacy-b8-onion.json";
if (!root) throw new Error("Usage: node scripts/usda-sr-legacy-b8-onion.mjs <csv-dir> [output]");

function parseCsv(text) {
  const rows=[]; let row=[], field="", quoted=false;
  for (let i=0;i<text.length;i++) {
    const ch=text[i];
    if (quoted) {
      if (ch==='"' && text[i+1]==='"') { field+='"'; i++; }
      else if (ch==='"') quoted=false;
      else field+=ch;
    } else if (ch==='"') quoted=true;
    else if (ch===',') { row.push(field); field=""; }
    else if (ch==='\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row=[]; field=""; }
    else field+=ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers=(rows.shift()||[]).map(v=>v.trim().toLowerCase());
  return rows.filter(r=>r.some(Boolean)).map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??""])));
}

const sr=parseCsv(readFileSync(join(root,"sr_legacy_food.csv"),"utf8"));
const foods=parseCsv(readFileSync(join(root,"food.csv"),"utf8"));
const portions=parseCsv(readFileSync(join(root,"food_portion.csv"),"utf8"));
const measures=parseCsv(readFileSync(join(root,"measure_unit.csv"),"utf8"));
const measureById=new Map(measures.map(row=>[String(row.id).trim(),row]));
const foodByFdc=new Map(foods.map(row=>[String(row.fdc_id).trim(),row]));

const target=sr.find(row => String(row.ndb_number||"").trim().replace(/^0+/,"")==="11282");
if (!target) throw new Error("SR Legacy NDB 11282 not found");
const fdcId=String(target.fdc_id).trim();
const food=foodByFdc.get(fdcId);
if (!food) throw new Error(`Food row missing for SR Legacy onion FDC ${fdcId}`);
if (food.description !== "Onions, raw") throw new Error(`Unexpected SR Legacy onion description: ${food.description}`);

const portionRows=portions.filter(row=>String(row.fdc_id).trim()===fdcId).map(row=>{
  const measureUnitId=String(row.measure_unit_id||"").trim();
  const measure=measureById.get(measureUnitId)||{};
  return {
    id: row.id || null,
    amount: Number(row.amount),
    gramWeight: Number(row.gram_weight),
    measureUnitId: measureUnitId || null,
    measureUnit: measure.name || null,
    abbreviation: measure.abbreviation || null,
    modifier: row.modifier || null,
    portionDescription: row.portion_description || null,
    sequenceNumber: row.sequence_number ? Number(row.sequence_number) : null,
    dataPoints: row.data_points ? Number(row.data_points) : null,
    minYearAcquired: row.min_year_acquired || null
  };
}).sort((a,b)=>(a.sequenceNumber??999)-(b.sequenceNumber??999)||a.gramWeight-b.gramWeight);

const result={
  schemaVersion:"usda-sr-legacy-b8-onion-v1",
  source:{
    name:"USDA FoodData Central — SR Legacy",
    releaseDate:"2018-04",
    archive:"FoodData_Central_sr_legacy_food_csv_2018-04.zip",
    sourceUrl:"https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip",
    licence:"CC0-1.0 / U.S. public domain"
  },
  food:{fdcId,ndbNumber:"11282",description:food.description,publicationDate:food.publication_date||null},
  portions:portionRows
};
writeFileSync(outputPath,`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify(result,null,2));
