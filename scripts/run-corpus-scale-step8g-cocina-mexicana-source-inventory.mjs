import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ORA_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const COLLECTION = "cocina-mexicana";
const EXPECTED_COLLECTION_COUNT = 6476;
const SCHEMA = "CORPUS_SCALE_STEP8G_COCINA_MEXICANA_SOURCE_INVENTORY_V1";

function args(argv) {
  const out = { ora: null, output: ".tmp/step8g-cocina-mexicana-source-inventory" };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) out.ora = arg.slice(6);
    else if (arg.startsWith("--out=")) out.output = arg.slice(6) || out.output;
    else throw new Error(`UNKNOWN_ARGUMENT_${arg}`);
  }
  if (!out.ora) throw new Error("ORA_ROOT_REQUIRED");
  return out;
}

function commitAt(root) {
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function key(row) {
  return [row.collection, row.source_url, row.source_title, row.author, String(row.source_year ?? ""), row.license]
    .map(value => String(value ?? "").trim()).join("\u001f");
}

function identity(row) {
  return {
    collection: String(row.collection ?? ""),
    sourceUrl: String(row.source_url ?? ""),
    sourceTitle: String(row.source_title ?? ""),
    sourceAuthor: String(row.author ?? ""),
    sourceYear: String(row.source_year ?? ""),
    licenseId: String(row.license ?? "")
  };
}

function parseable(row) {
  const body = String(row.body ?? "");
  return Boolean(String(row.title ?? "").trim()) && /## Ingredients/i.test(body) && /## Directions/i.test(body);
}

const options = args(process.argv.slice(2));
const root = resolve(options.ora);
const commit = commitAt(root);
if (commit !== ORA_COMMIT) throw new Error(`ORA_PIN_MISMATCH_${commit}`);

const manifest = JSON.parse(await readFile(resolve(root, "collections", COLLECTION, "manifest.json"), "utf8"));
const rows = (await readFile(resolve(root, "collections", COLLECTION, "recipes.jsonl"), "utf8"))
  .split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
if (manifest.slug !== COLLECTION || Number(manifest.recipe_count) !== EXPECTED_COLLECTION_COUNT) throw new Error("COLLECTION_MANIFEST_MISMATCH");
if (rows.length !== EXPECTED_COLLECTION_COUNT) throw new Error(`COLLECTION_COUNT_${rows.length}`);
if (rows.some(row => row.collection !== COLLECTION)) throw new Error("COLLECTION_IDENTITY_MISMATCH");

const groups = new Map();
for (const row of rows) {
  const sourceKey = key(row);
  if (!groups.has(sourceKey)) groups.set(sourceKey, []);
  groups.get(sourceKey).push(row);
}

const sourceGroups = [...groups.values()].map(groupRows => {
  const first = groupRows[0];
  const id = identity(first);
  const parseableCount = groupRows.filter(parseable).length;
  return {
    ...id,
    recipeCount: groupRows.length,
    parseableRecipeCount: parseableCount,
    parseableRecipeRatio: parseableCount / groupRows.length,
    publicDomainMetadataPass: groupRows.every(row => row.license === "public-domain"),
    completeIdentityPass: Boolean(id.sourceUrl && id.sourceTitle && id.sourceAuthor && id.sourceYear),
    distinctSlugCount: new Set(groupRows.map(row => String(row.slug ?? ""))).size,
    distinctTitleCount: new Set(groupRows.map(row => String(row.title ?? ""))).size
  };
}).sort((a, b) => b.recipeCount - a.recipeCount || a.sourceTitle.localeCompare(b.sourceTitle));

const result = {
  schema: SCHEMA,
  date: "2026-09-17",
  pass: true,
  terminal: "STEP_8G_COCINA_MEXICANA_SOURCE_INVENTORY_COMPLETE_NO_RIGHTS_CLEARANCE",
  sourceRepository: ORA_REPOSITORY,
  sourceCommit: ORA_COMMIT,
  collection: COLLECTION,
  collectionRecipeCount: rows.length,
  sourceGroupCount: sourceGroups.length,
  sourceGroups,
  interpretation: "This bounded inventory identifies exact pinned source groups and structural metadata only. It does not clear rights, earn ingestion, or authorize protected writes.",
  boundaries: {
    sourceRightsCleared: false,
    attributionClassificationComplete: false,
    measurementEarned: false,
    liveD1WritesPerformed: 0,
    protectedPopulationAuthorized: false,
    publicRuntimeChangeAuthorized: false,
    thirdShardAuthorized: false,
    billingExpansionAuthorized: false
  }
};

await mkdir(resolve(options.output), { recursive: true });
await writeFile(resolve(options.output, "source-inventory.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  terminal: result.terminal,
  collectionRecipeCount: result.collectionRecipeCount,
  sourceGroupCount: result.sourceGroupCount,
  sourceGroups: result.sourceGroups.map(({ sourceTitle, sourceAuthor, sourceYear, sourceUrl, recipeCount, parseableRecipeRatio, publicDomainMetadataPass, completeIdentityPass }) => ({ sourceTitle, sourceAuthor, sourceYear, sourceUrl, recipeCount, parseableRecipeRatio, publicDomainMetadataPass, completeIdentityPass }))
}, null, 2)}\n`);
