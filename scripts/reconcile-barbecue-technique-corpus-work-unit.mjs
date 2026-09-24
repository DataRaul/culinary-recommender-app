import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { deriveBarbecueWorkUnitState, validateBarbecueWorkUnitState } from "./barbecue-technique-corpus-work-unit-lifecycle.mjs";

const statePath=process.env.YT_BBQ_STATE_PATH || "data/generated/barbecue-technique-corpus-state.json";
const workPath=process.env.YT_BBQ_WORK_UNIT_STATE_PATH || "data/generated/barbecue-technique-corpus-work-unit-state.json";
const primaryOutcome=process.env.YT_BBQ_PRIMARY_OUTCOME || "success";
const state=JSON.parse(await readFile(statePath,"utf8"));
const work=validateBarbecueWorkUnitState(deriveBarbecueWorkUnitState(state,{primaryOutcome}));
await mkdir(dirname(workPath),{recursive:true});
await writeFile(workPath,`${JSON.stringify(work,null,2)}\n`,"utf8");
console.log(JSON.stringify(work));
