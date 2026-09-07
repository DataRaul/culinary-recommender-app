import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { deriveWorkUnitState, validateWorkUnitState } from "./youtube-culinary-work-unit-lifecycle.mjs";

const dailyStatePath = process.env.YT_CUL_DAILY_STATE_PATH || "data/generated/youtube-culinary-daily-discovery-state.json";
const lifecycleStatePath = process.env.YT_CUL_WORK_UNIT_STATE_PATH || "data/generated/youtube-culinary-work-unit-state.json";
const primaryOutcome = process.env.YT_CUL_PRIMARY_OUTCOME || "success";

const dailyState = JSON.parse(await readFile(dailyStatePath, "utf8"));
const lifecycleState = validateWorkUnitState(deriveWorkUnitState(dailyState, { primaryOutcome }));

await mkdir(dirname(lifecycleStatePath), { recursive: true });
await writeFile(lifecycleStatePath, `${JSON.stringify(lifecycleState, null, 2)}\n`, "utf8");

process.stdout.write(`${JSON.stringify(lifecycleState)}\n`);
