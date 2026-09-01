import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const targetPath = process.argv[3] || "scripts/usda-b8-unlock-targets.json";
const outputPath = process.argv[4] || "usda-b8-candidates.json";
if (!root) throw new Error("Usage: node scripts/usda-b8-discover.mjs <csv-dir> [targets-json] [output]");
const targets = JSON.parse(readFileSync(targetPath, "utf8"));

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
const foundation=parseCsv(readFileSync(join(root,"foundation_food.csv"),"utf8"));
const foods=parseCsv(readFileSync(join(root,"food.csv"),"utf8"));
const foundationByFdc=new Map(foundation.map(row=>[String(row.fdc_id).trim(),row]));
const catalogue=foods.filter(row=>foundationByFdc.has(String(row.fdc_id).trim())).map(row=>{
  const fdcId=String(row.fdc_id).trim();
  const foundationRow=foundationByFdc.get(fdcId);
  return {fdcId,ndbNumber:String(foundationRow.ndb_number||"").trim().replace(/^0+/,"")||null,description:row.description||null,publicationDate:row.publication_date||null};
});
const normalize=value=>String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const score=(description,queries)=>{
  const d=normalize(description); let s=0;
  for(const query of queries){const q=normalize(query); if(d===q)s=Math.max(s,100); if(d.startsWith(q))s=Math.max(s,90); if(d.includes(q))s=Math.max(s,70);}
  for(const preferred of ["raw","dry","dried","ground","firm","plain"]) if(d.includes(preferred)) s+=2;
  return s;
};
const results={};
for(const [ingredientId,target] of Object.entries(targets)){
  const candidates=catalogue.filter(item=>target.queries.some(q=>normalize(item.description).includes(normalize(q))))
    .map(item=>({...item,score:score(item.description,target.queries)}))
    .sort((a,b)=>b.score-a.score||String(a.description).localeCompare(String(b.description))||Number(a.fdcId)-Number(b.fdcId))
    .slice(0,25);
  results[ingredientId]={...target,candidates};
}
const report={schemaVersion:"usda-foundation-b8-discovery-v1",source:{name:"USDA FoodData Central — Foundation Foods",releaseDate:"2026-04-30",releaseVersion:"15.0",archive:"FoodData_Central_foundation_food_csv_2026-04-30.zip"},rules:{discoveryOnly:true,noAutomaticPromotion:true,manualFoodFormReviewRequired:true},targetCount:Object.keys(targets).length,foundationCatalogueCount:catalogue.length,results};
writeFileSync(outputPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
