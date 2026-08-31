import { readFileSync, writeFileSync } from "node:fs";

const [alimPath, constPath, compoPath, targetsPath, outputPath = "ciqual-b4-reviewed.json"] = process.argv.slice(2);
if (!alimPath || !constPath || !compoPath || !targetsPath) {
  throw new Error("Usage: node scripts/extract-ciqual-b4.mjs <alim.xml> <const.xml> <compo.xml> <reviewed-targets.json> [output]");
}

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
const records = (xml, closingTag, markerTag) => xml
  .split(new RegExp(`<\\/${closingTag}>`, "i"))
  .filter(block => new RegExp(`<${markerTag}>`, "i").test(block));

const parseTeneur = raw => {
  const text = String(raw || "").trim();
  if (!text || text === "-" || /^trace$/i.test(text)) return { value: null, raw: text || null, qualifier: text ? text.toLowerCase() : "missing" };
  const normalized = text.replace(",", ".");
  if (/^[<>]/.test(normalized)) {
    const value = Number(normalized.slice(1));
    return { value: Number.isFinite(value) ? null : null, raw: text, qualifier: normalized[0] === "<" ? "below_limit" : "above_limit", limit: Number.isFinite(value) ? value : null };
  }
  const value = Number(normalized);
  return { value: Number.isFinite(value) ? value : null, raw: text, qualifier: Number.isFinite(value) ? "numeric" : "unparsed" };
};

const alimXml = readFileSync(alimPath, "utf8");
const constXml = readFileSync(constPath, "utf8");
const compoXml = readFileSync(compoPath, "utf8");
const targets = JSON.parse(readFileSync(targetsPath, "utf8"));

const foods = new Map(records(alimXml, "ALIM", "alim_code").map(block => {
  const item = {
    alimCode: tag(block, "alim_code"),
    nameFr: tag(block, "alim_nom_fr"),
    nameEn: tag(block, "alim_nom_eng"),
    scientificName: tag(block, "alim_nom_sci")
  };
  return [item.alimCode, item];
}));
const components = new Map(records(constXml, "CONST", "const_code").map(block => {
  const item = {
    constCode: tag(block, "const_code"),
    nameFr: tag(block, "const_nom_fr"),
    nameEn: tag(block, "const_nom_eng"),
    infoodsCode: tag(block, "code_INFOODS")
  };
  return [item.constCode, item];
}));

const tracked = {
  energyKcal: "333",
  energyKcalEu1169: "328",
  proteinG: "25000",
  carbohydrateG: "31000",
  fatG: "40000",
  fibreG: "34100"
};
const expectedInfoods = {
  energyKcal: "ENERC",
  energyKcalEu1169: "ENERC",
  proteinG: "PROCNT",
  carbohydrateG: "CHOAVL",
  fatG: "FAT",
  fibreG: "FIB-"
};
for (const [key, code] of Object.entries(tracked)) {
  const component = components.get(code);
  if (!component) throw new Error(`Missing Ciqual component ${code} for ${key}`);
  if (component.infoodsCode !== expectedInfoods[key]) throw new Error(`Unexpected INFOODS code for ${key}: ${component.infoodsCode}`);
}

const wantedFoodCodes = new Set(Object.values(targets).map(item => item.alimCode));
const wantedComponentCodes = new Set(Object.values(tracked));
const composition = new Map();
for (const block of records(compoXml, "COMPO", "alim_code")) {
  const alimCode = tag(block, "alim_code");
  const constCode = tag(block, "const_code");
  if (!wantedFoodCodes.has(alimCode) || !wantedComponentCodes.has(constCode)) continue;
  const key = `${alimCode}:${constCode}`;
  composition.set(key, {
    ...parseTeneur(tag(block, "teneur")),
    min: tag(block, "min") || null,
    max: tag(block, "max") || null,
    confidenceCode: tag(block, "code_confiance") || null,
    sourceCode: tag(block, "source_code") || null
  });
}

const output = {};
for (const [canonicalIngredientId, target] of Object.entries(targets)) {
  const food = foods.get(target.alimCode);
  if (!food) throw new Error(`Reviewed Ciqual food code ${target.alimCode} missing for ${canonicalIngredientId}`);
  const fields = {};
  for (const [key, constCode] of Object.entries(tracked)) {
    const record = composition.get(`${target.alimCode}:${constCode}`) || { value: null, raw: null, qualifier: "missing", min: null, max: null, confidenceCode: null, sourceCode: null };
    fields[key] = { ...record, constCode, infoodsCode: components.get(constCode).infoodsCode };
  }
  output[canonicalIngredientId] = {
    canonicalIngredientId,
    alimCode: target.alimCode,
    food,
    review: { match: target.match, description: target.description, notes: target.notes },
    per100g: Object.fromEntries(Object.entries(fields).map(([key, record]) => [key, record.value])),
    evidence: fields
  };
}

const result = {
  source: {
    id: "anses-ciqual-2025",
    name: "ANSES-Ciqual 2025 food composition table",
    releaseDate: "2025-11-19",
    version: "1.0",
    datasetDoi: "10.57745/RDMHWY",
    license: "Etalab Open Licence 2.0",
    attribution: "Anses. 2025. Table de composition nutritionnelle des aliments Ciqual"
  },
  components: Object.fromEntries(Object.entries(tracked).map(([key, code]) => [key, components.get(code)])),
  reviewedCount: Object.keys(output).length,
  records: output
};
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Extracted ${result.reviewedCount} reviewed Ciqual foods across ${Object.keys(tracked).length} tracked composition fields.`);
