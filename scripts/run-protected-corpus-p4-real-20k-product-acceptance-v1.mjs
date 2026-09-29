import { readFile, writeFile } from "node:fs/promises";
import { PUBLIC_RUNTIME_RECIPES, PUBLIC_EXTERNAL_RECIPES } from "../src/data/corpus-v1.js";
import {
  measureCurrentV8018,
  buildP4MachineBaseline,
  validateP4Summary
} from "./protected-corpus-p4-real-20k-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const readJson = async path => JSON.parse(await readFile(path, "utf8"));

for (const key of ["contract","p1","p2","c4","p3","mapping","nutrition","output"]) {
  if (!args[key]) throw new Error("Missing --" + key);
}

const [contract,p1,p2,c4,p3,mappingFull,nutritionFull] = await Promise.all([
  readJson(args.contract),
  readJson(args.p1),
  readJson(args.p2),
  readJson(args.c4),
  readJson(args.p3),
  readJson(args.mapping),
  readJson(args.nutrition)
]);

const currentV8018 = measureCurrentV8018({ contract, mappingFull, nutritionFull });
const summary = buildP4MachineBaseline({
  contract,
  p1,
  p2,
  c4,
  p3,
  currentV8018,
  publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length,
  publicExternalRecipeCount: PUBLIC_EXTERNAL_RECIPES.length,
  p3CandidatePresent: PUBLIC_RUNTIME_RECIPES.some(recipe => recipe.id === "unitools_pao_de_queijo")
});

const errors = validateP4Summary(summary);
if (errors.length) throw new Error("P4_SUMMARY_INVALID__" + errors.join(","));
await writeFile(args.output, JSON.stringify(summary, null, 2) + "\n");
process.stdout.write(JSON.stringify(summary) + "\n");
