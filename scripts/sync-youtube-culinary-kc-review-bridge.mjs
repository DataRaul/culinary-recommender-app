import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertPolicySafeDurableObject } from "./youtube-culinary-discovery-control-plane.mjs";

export const KC_REVIEW_BRIDGE_REPOSITORY = "DataRaul/knowledge-core";
export const KC_REVIEW_BRIDGE_PATH = "exports/culinary/youtube-culinary-canonical-review-bridge.json";
export const KC_REVIEW_BRIDGE_SCHEMA = "youtube-culinary-canonical-review-bridge-v1";
export const KC_REVIEW_AUTHORITY = "KNOWLEDGE_CORE_ATLAS_REVIEW";
export const KC_REVIEW_SYNC_SECRET = "CULINARY_KC_REVIEW_READ_TOKEN";
export const KC_REVIEW_SYNC_ENABLE_VAR = "CULINARY_KC_REVIEW_SYNC_ENABLED";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(THIS_DIR, "..");
const DEFAULT_OUTPUT = "data/generated/youtube-culinary-canonical-review-bridge.json";
const ALLOWED_OUTCOME_KEYS = new Set([
  "packetId", "reviewPairKey", "reviewDecision", "reviewAuthority", "decisionReason", "reviewRoute",
  "requiredEvidenceTerms", "independentNonYoutubeEvidence", "rightsProvenanceSafetyClear", "appAuthoringEligible",
  "lifecycleAdvanced", "lifecycleStateAfter", "retryable", "knowledgeCoreCommit"
]);

function isEnabled(value) {
  return /^(1|true|yes)$/i.test(String(value ?? ""));
}

function validateOutcome(outcome) {
  if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) throw new Error("KC review outcome must be an object");
  for (const key of Object.keys(outcome)) if (!ALLOWED_OUTCOME_KEYS.has(key)) throw new Error(`KC review outcome contains unapproved field ${key}`);
  if (!/^yt-cul-review-[a-f0-9]{24}$/.test(outcome.packetId || "")) throw new Error("KC review outcome packetId is invalid");
  if (!/^yt-cul-pair-[a-f0-9]{24}$/.test(outcome.reviewPairKey || "")) throw new Error("KC review outcome reviewPairKey is invalid");
  if (!["ACCEPTED", "REJECTED", "HELD"].includes(outcome.reviewDecision)) throw new Error("KC review outcome decision is invalid");
  if (outcome.reviewAuthority !== KC_REVIEW_AUTHORITY) throw new Error("KC review outcome authority is invalid");
  if (typeof outcome.decisionReason !== "string" || !outcome.decisionReason.trim()) throw new Error("KC review outcome decisionReason is required");
  if (!Array.isArray(outcome.requiredEvidenceTerms) || outcome.requiredEvidenceTerms.some(term => typeof term !== "string" || !term.trim())) throw new Error("KC review outcome requiredEvidenceTerms is invalid");
  if (outcome.appAuthoringEligible === true) {
    if (outcome.reviewDecision !== "ACCEPTED" || outcome.independentNonYoutubeEvidence !== true || outcome.rightsProvenanceSafetyClear !== true || outcome.lifecycleStateAfter !== "APP_AUTHORING_ELIGIBLE") {
      throw new Error("KC bridge cannot grant app-authoring eligibility without full canonical clearance");
    }
  }
  return outcome;
}

export function validateKcReviewBridge(bridge) {
  if (!bridge || typeof bridge !== "object" || Array.isArray(bridge)) throw new Error("KC review bridge must be an object");
  if (bridge.schemaVersion !== KC_REVIEW_BRIDGE_SCHEMA) throw new Error("KC review bridge schema is invalid");
  if (typeof bridge.knowledgeCoreCommit !== "string" || !bridge.knowledgeCoreCommit.trim()) throw new Error("KC review bridge knowledgeCoreCommit is required");
  if (typeof bridge.generatedAt !== "string" || !Number.isFinite(Date.parse(bridge.generatedAt))) throw new Error("KC review bridge generatedAt is invalid");
  if (!Array.isArray(bridge.outcomes)) throw new Error("KC review bridge outcomes must be an array");
  bridge.outcomes.forEach(validateOutcome);
  assertPolicySafeDurableObject(bridge);
  return bridge;
}

export async function syncCanonicalReviewBridge({
  fetchImpl = fetch,
  enabled = process.env[KC_REVIEW_SYNC_ENABLE_VAR],
  token = process.env[KC_REVIEW_SYNC_SECRET],
  outputPath = process.env.YT_CUL_CANONICAL_REVIEW_BRIDGE_PATH || DEFAULT_OUTPUT
} = {}) {
  if (!isEnabled(enabled)) return { status: "KC_REVIEW_SYNC_DISABLED", fetched: false, outcomes: 0 };
  if (typeof token !== "string" || token.length < 10) throw new Error(`${KC_REVIEW_SYNC_SECRET} is required when ${KC_REVIEW_SYNC_ENABLE_VAR}=true`);
  const url = `https://api.github.com/repos/${KC_REVIEW_BRIDGE_REPOSITORY}/contents/${KC_REVIEW_BRIDGE_PATH}?ref=main`;
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github.raw+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "CulinaryRecommenderKcReviewSync/1.0"
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Knowledge Core review bridge fetch failed HTTP ${response.status}`);
  const bridge = validateKcReviewBridge(JSON.parse(await response.text()));
  const target = join(REPO_ROOT, outputPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(bridge, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return { status: "KC_REVIEW_SYNC_PASS", fetched: true, outcomes: bridge.outcomes.length, knowledgeCoreCommit: bridge.knowledgeCoreCommit };
}

async function main() {
  try {
    const result = await syncCanonicalReviewBridge();
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
