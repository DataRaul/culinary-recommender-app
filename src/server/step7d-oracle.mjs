const encoder = new TextEncoder();

export const STEP7D_EXPECTED_RECIPE_COUNT = 84;
export const STEP7D_ORACLE_TABLE = "step7d_recipe_oracle";

export function serializeStep7dOracleRows(recipes) {
  if (!Array.isArray(recipes)) throw new Error("STEP7D_RECIPES_REQUIRED");
  return recipes.map((recipe, ordinal) => {
    const bodyJson = JSON.stringify(recipe);
    return {
      ordinal,
      recipeId: String(recipe?.id || ""),
      bodyJson,
      bodyBytes: encoder.encode(bodyJson).byteLength
    };
  });
}

export async function step7dOracleFingerprint(rows) {
  const payload = rows
    .map(row => `${Number(row.ordinal)}\u0000${String(row.recipeId ?? row.recipe_id ?? "")}\u0000${String(row.bodyJson ?? row.body_json ?? "")}`)
    .join("\n");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function summarizeD1Meta(meta = {}) {
  const numberOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
  return {
    durationMs: numberOrNull(meta.duration),
    rowsRead: numberOrNull(meta.rows_read),
    rowsWritten: numberOrNull(meta.rows_written),
    changes: numberOrNull(meta.changes),
    sizeAfterBytes: numberOrNull(meta.size_after)
  };
}

export function summarizeD1Batch(results = []) {
  let rowsRead = 0;
  let rowsWritten = 0;
  let changes = 0;
  let durationMs = 0;
  let sizeAfterBytes = null;
  for (const result of results) {
    const meta = summarizeD1Meta(result?.meta || {});
    rowsRead += meta.rowsRead || 0;
    rowsWritten += meta.rowsWritten || 0;
    changes += meta.changes || 0;
    durationMs += meta.durationMs || 0;
    if (meta.sizeAfterBytes !== null) sizeAfterBytes = meta.sizeAfterBytes;
  }
  return { durationMs, rowsRead, rowsWritten, changes, sizeAfterBytes, statements: results.length };
}

export function roundedElapsedMs(startedAt) {
  return Number((performance.now() - startedAt).toFixed(3));
}
