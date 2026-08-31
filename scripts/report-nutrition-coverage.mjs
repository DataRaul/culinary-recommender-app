import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

const audit = buildNutritionCoverageAudit(ALL_RECIPES, publicNutritionSource);
process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
