import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildR3Summary } from "./protected-corpus-recommendation-expansion-r3-machine-acceptance-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
for (const key of ["contract", "r2", "candidate", "unitools", "summary"]) {
  if (!args[key]) throw new Error("R3_ARGUMENT_REQUIRED_" + key);
}
const read = path => readFile(resolve(path), "utf8").then(JSON.parse);
const [contract, r2, candidateArtifact, dataset] = await Promise.all([
  read(args.contract),
  read(args.r2),
  read(args.candidate),
  read(resolve(args.unitools, "unitools-recipes-v1.json"))
]);
const observedCommit = execFileSync("git", ["-C", resolve(args.unitools), "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const observedBlob = execFileSync("git", ["hash-object", resolve(args.unitools, "unitools-recipes-v1.json")], { encoding: "utf8" }).trim();
if (observedCommit !== contract.source.commit || observedBlob !== contract.source.dataBlobSha) throw new Error("R3_SOURCE_PIN_MISMATCH");

const summary = buildR3Summary({ contract, r2, dataset, candidateArtifact });
await mkdir(dirname(resolve(args.summary)), { recursive: true });
await writeFile(resolve(args.summary), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write("R3_MACHINE_ACCEPTANCE_SUMMARY=" + JSON.stringify(summary) + "\n");
