import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildP3ActivationSummary } from "./culinary-brain-p3-tapioca-bounded-activation-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).filter(arg => arg.startsWith("--")).map(arg => {
  const [key, ...value] = arg.slice(2).split("=");
  return [key, value.join("=")];
}));
if (!args.unitools) throw new Error("P3_ACTIVATION_UNITOOLS_ROOT_REQUIRED");

const root = resolve(args.unitools);
const commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (commit !== "1d09e9548d957dd0375301146a86dddf5e269c1b") throw new Error("P3_ACTIVATION_SOURCE_COMMIT_MISMATCH");
const blob = execFileSync("git", ["-C", root, "hash-object", "unitools-recipes-v1.json"], { encoding: "utf8" }).trim();
if (blob !== "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") throw new Error("P3_ACTIVATION_SOURCE_BLOB_MISMATCH");

const read = path => JSON.parse(readFileSync(path, "utf8"));
const summary = buildP3ActivationSummary({
  contract: read("config/culinary_brain_p3_tapioca_bounded_activation_v1.json"),
  dataset: read(resolve(root, "unitools-recipes-v1.json")),
  candidateArtifact: read("data/generated/culinary-brain-c4-tapioca-p3-candidate-v1.json")
});
writeFileSync(args.output || "/tmp/p3-activation-summary.json", JSON.stringify(summary, null, 2) + "\n");
console.log(summary.terminal);
