export function currentHandoverInvariants(handover) {
  const compatibility = handover?.status === "POINTER_ONLY" ? (handover?.compatibility_invariants ?? {}) : {};
  const live = handover?.live_protected_state ?? {};
  const text = JSON.stringify(handover ?? {});

  const publicRuntimeRecipeCount = Number.isFinite(Number(compatibility.public_runtime_recipe_count))
    ? Number(compatibility.public_runtime_recipe_count)
    : Number.isFinite(Number(live.public_runtime_recipe_count))
      ? Number(live.public_runtime_recipe_count)
    : /(?:public runtime remains|public runtime[^"]*)\s*85\s*recipes/i.test(text)
      ? 85
      : null;

  const publicRuntimeChanged = typeof compatibility.public_runtime_changed === "boolean"
    ? compatibility.public_runtime_changed
    : typeof live.public_runtime_changed === "boolean"
      ? live.public_runtime_changed
    : /public runtime remains\s*85\s*recipes|does not authorize public\/runtime admission/i.test(text)
      ? false
      : null;

  const shardCount = Number.isFinite(Number(compatibility.shard_count))
    ? Number(compatibility.shard_count)
    : Number.isFinite(Number(live.shard_count))
      ? Number(live.shard_count)
    : /exactly\s*2\s*D1\s*shards|exactly\s*two\s*D1\s*shards/i.test(text)
      ? 2
      : null;

  const thirdShardUsed = typeof compatibility.third_shard_used === "boolean"
    ? compatibility.third_shard_used
    : typeof live.third_shard_used === "boolean"
      ? live.third_shard_used
    : /no third D1 shard|exactly\s*(?:2|two)\s*D1\s*shards/i.test(text)
      ? false
      : null;

  const billingExpansion = typeof compatibility.billing_expansion === "boolean"
    ? compatibility.billing_expansion
    : typeof live.billing_expansion === "boolean"
      ? live.billing_expansion
    : handover?.lane?.billing === "NO_BILLING_AUTHORIZATION" || /no paid infrastructure|no billing authorization/i.test(text)
      ? false
      : null;

  const publicAdmissionAuthorized = typeof compatibility.public_admission_authorized === "boolean"
    ? compatibility.public_admission_authorized
    : /automatic public.*admission[^"]*(?:true|authorized)|public runtime activation[^"]*authorized/i.test(text)
      ? true
    : /not authorized|does not authorize public\/runtime admission|public activation[^"]*separately gated/i.test(text)
      ? false
      : null;

  return {
    publicRuntimeRecipeCount,
    publicRuntimeChanged,
    shardCount,
    thirdShardUsed,
    billingExpansion,
    publicAdmissionAuthorized
  };
}
