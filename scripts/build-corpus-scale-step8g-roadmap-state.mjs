import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  const options = {
    input: "config/corpus_scale_step8_roadmap.json",
    output: ".tmp/step8g-forkrecipe-prewrite/corpus_scale_step8_roadmap.next.json"
  };
  for (const arg of argv) {
    if (arg.startsWith("--input=")) options.input = arg.slice("--input=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length);
  }
  return options;
}

export function reconcileStep8GRoadmapState(roadmap) {
  const next = structuredClone(roadmap);
  const gate8f = next.gates.find(gate => gate.id === "8F");
  const gate8g = next.gates.find(gate => gate.id === "8G");
  if (!gate8f) throw new Error("Step 8F gate missing from roadmap");
  if (!gate8g) throw new Error("Step 8G gate missing from roadmap");

  const step8fComplete = gate8f.terminal === "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED"
    && gate8f.decisionInput?.runtimeActivationAuthorized === true
    && gate8f.decisionInput?.publicRuntimeChanged === true;

  next.status = step8fComplete
    ? "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PASS__8G_ACTIVE"
    : "STEP8A_COMPLETE__8B_PASS__8C_PASS__8D_PASS__8E_PASS__8F_PARKED__8G_ACTIVE";

  for (const ref of [
    "docs/CORPUS_SCALE_STEP8G_PROTECTED_SCALE_LOOP.md",
    "docs/CORPUS_SCALE_STEP8G_FORKRECIPE_PREWRITE.md",
    "data/generated/step8g/forkrecipe-prewrite-evidence.json"
  ]) if (!next.evidenceBasis.includes(ref)) next.evidenceBasis.push(ref);

  if (!step8fComplete) {
    gate8f.status = "PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION";
    gate8f.parked = true;
    gate8f.blockingActiveLane = false;
    gate8f.resumeOnlyOnExplicitOwnerRequest = true;
    gate8f.decisionInput.runtimeActivationAuthorized = false;
    gate8f.decisionInput.publicRuntimeChanged = false;
  }

  gate8g.status = "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP";
  gate8g.humanRequired = false;
  gate8g.publicRuntimeChangeAllowed = false;

  next.currentHumanGate = step8fComplete ? {
    id: "NONE",
    status: "NO_HUMAN_GATE_CURRENTLY_REQUIRED",
    reason: "Step 8F exact one-record public activation is complete. Step 8G remains independently active and must not infer broader public-admission authority.",
    completedGate: "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED"
  } : {
    id: "NONE",
    status: "NO_HUMAN_GATE_CURRENTLY_REQUIRED",
    reason: "Step 8F is intentionally parked and non-blocking while Step 8G protected-scale work remains available.",
    nextReservedHumanGate: "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION",
    parkedGateStatus: "PARKED_NOT_AUTHORIZED",
    resumeOnlyOnExplicitOwnerRequest: true
  };
  return next;
}

const args = parseArgs(process.argv.slice(2));
const input = JSON.parse(await readFile(resolve(args.input), "utf8"));
const output = reconcileStep8GRoadmapState(input);
await mkdir(dirname(resolve(args.output)), { recursive: true });
await writeFile(resolve(args.output), `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ status: output.status, gate8f: output.gates.find(gate => gate.id === "8F").status, gate8g: output.gates.find(gate => gate.id === "8G").status, currentHumanGate: output.currentHumanGate.id, latestIteration: output.gates.find(gate => gate.id === "8G").latestIteration?.layerVersion ?? null }, null, 2)}\n`);
