import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  PORTABLE_CORPUS_DEFAULT_METADATA_SHARD_SIZE,
  PORTABLE_CORPUS_DEFAULT_VERSION,
  createPortableCorpusArtifactStream
} from "./corpus-scale-step3-core.mjs";

function parseArgs(argv) {
  const options = {
    output: ".tmp/corpus-scale-step3",
    version: PORTABLE_CORPUS_DEFAULT_VERSION,
    metadataShardSize: PORTABLE_CORPUS_DEFAULT_METADATA_SHARD_SIZE
  };
  for (const arg of argv) {
    if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
    else if (arg.startsWith("--version=")) options.version = arg.slice("--version=".length) || options.version;
    else if (arg.startsWith("--metadata-shard-size=")) {
      options.metadataShardSize = Number(arg.slice("--metadata-shard-size=".length));
    }
  }
  if (!Number.isInteger(options.metadataShardSize) || options.metadataShardSize <= 0) {
    throw new Error("--metadata-shard-size must be a positive integer");
  }
  return options;
}

const args = parseArgs(process.argv.slice(2));
const outputRoot = resolve(args.output);
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const summary = {
  outputRoot,
  corpusVersion: args.version,
  recipeCount: ALL_RECIPES.length,
  artifactCount: 0,
  detailObjectCount: 0,
  metadataShardCount: 0,
  indexObjectCount: 0,
  bytesWritten: 0,
  manifest: null
};

for (const artifact of createPortableCorpusArtifactStream(ALL_RECIPES, {
  version: args.version,
  metadataShardSize: args.metadataShardSize
})) {
  const destination = resolve(outputRoot, artifact.path);
  if (!destination.startsWith(`${outputRoot}/`)) throw new Error(`artifact escaped output root: ${artifact.path}`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, artifact.content, "utf8");
  summary.artifactCount += 1;
  summary.bytesWritten += Buffer.byteLength(artifact.content, "utf8");
  if (artifact.kind === "detail") summary.detailObjectCount += 1;
  else if (artifact.kind === "metadata") summary.metadataShardCount += 1;
  else if (artifact.kind === "index") summary.indexObjectCount += 1;
  else if (artifact.kind === "manifest") summary.manifest = artifact.path;
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
