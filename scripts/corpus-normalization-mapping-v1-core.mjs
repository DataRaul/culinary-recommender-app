const MAPPING_STATES = new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING","AMBIGUOUS","UNKNOWN"]);

export function normalizeToken(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
}

export function parseDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const s = value.trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const match = /^(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours))?(?:\s*(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes))?$/.exec(s);
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] || 0) * 60 + Number(match[2] || 0);
}

function state(state, value = null, detail = {}) {
  if (!MAPPING_STATES.has(state)) throw new Error("INVALID_MAPPING_STATE_" + state);
  return { state, value, ...detail };
}

function hasValue(value) {
  return (typeof value === "string" && value.trim() !== "") || (typeof value === "number" && Number.isFinite(value));
}

export function mapDifficulty(raw, config) {
  if (!hasValue(raw)) return state("UNKNOWN");
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) {
    return state("EXACT_SOURCE_NORMALIZATION", { scale: config.difficultyScales.numeric, level: numeric }, { sourceField: "difficulty" });
  }
  const token = normalizeToken(raw);
  if (["easy","medium","hard"].includes(token)) {
    return state("EXACT_SOURCE_NORMALIZATION", { scale: config.difficultyScales.labels, label: token.toUpperCase() }, { sourceField: "difficulty" });
  }
  return state("AMBIGUOUS", null, { sourceField: "difficulty", raw: normalizeText(raw) });
}

export function mapCategory(raw, config) {
  if (!hasValue(raw)) {
    return {
      dishCategory: state("UNKNOWN"),
      mealRoles: state("UNKNOWN", [])
    };
  }
  const token = normalizeToken(raw);
  const rule = config.categoryMappings[token];
  if (!rule) {
    return {
      dishCategory: state("AMBIGUOUS", null, { sourceField: "category", raw: normalizeText(raw) }),
      mealRoles: state("AMBIGUOUS", [], { sourceField: "category", raw: normalizeText(raw) })
    };
  }
  return {
    dishCategory: rule.dishCategory
      ? state("REVIEWED_MAPPING", rule.dishCategory, { sourceField: "category", raw: normalizeText(raw) })
      : state("UNKNOWN", null, { sourceField: "category", raw: normalizeText(raw) }),
    mealRoles: rule.mealRoles.length
      ? state("REVIEWED_MAPPING", [...rule.mealRoles], { sourceField: "category", raw: normalizeText(raw) })
      : state("UNKNOWN", [], { sourceField: "category", raw: normalizeText(raw) })
  };
}

export function mapRecord(record, config) {
  const raw = structuredClone(record.raw ?? {});
  const category = mapCategory(raw.category, config);

  const country = hasValue(raw.country)
    ? state("EXACT_SOURCE_NORMALIZATION", normalizeText(String(raw.country)), { sourceField: "country" })
    : state("UNKNOWN");

  const prepMinutes = Number.isFinite(raw.prepMinutes)
    ? state("EXACT_SOURCE_NORMALIZATION", raw.prepMinutes, { sourceField: "prepMinutes" })
    : state("UNKNOWN");

  const cookMinutes = Number.isFinite(raw.cookMinutes)
    ? state("EXACT_SOURCE_NORMALIZATION", raw.cookMinutes, { sourceField: "cookMinutes" })
    : state("UNKNOWN");

  let totalMinutes = state("UNKNOWN");
  if (Number.isFinite(raw.totalMinutes)) {
    totalMinutes = state("EXACT_SOURCE_NORMALIZATION", raw.totalMinutes, { sourceField: "totalMinutes" });
  } else if (Number.isFinite(raw.prepMinutes) && Number.isFinite(raw.cookMinutes)) {
    totalMinutes = state("REVIEWED_MAPPING", raw.prepMinutes + raw.cookMinutes, { derivedFrom: ["prepMinutes","cookMinutes"] });
  } else if (hasValue(raw.totalTime)) {
    const parsed = parseDurationMinutes(raw.totalTime);
    totalMinutes = parsed == null
      ? state("AMBIGUOUS", null, { sourceField: "totalTime", raw: normalizeText(raw.totalTime) })
      : state("EXACT_SOURCE_NORMALIZATION", parsed, { sourceField: "totalTime", raw: normalizeText(raw.totalTime) });
  }

  const servings = Number.isFinite(raw.baseServings) && raw.baseServings > 0
    ? state("EXACT_SOURCE_NORMALIZATION", raw.baseServings, { sourceField: "baseServings" })
    : hasValue(raw.baseServings)
      ? state("AMBIGUOUS", null, { sourceField: "baseServings", raw: raw.baseServings })
      : state("UNKNOWN");

  return {
    overlaySchemaVersion: "CULINARY_CORPUS_NORMALIZATION_OVERLAY_RECORD_V1",
    identity: {
      layer: record.layer,
      cohortId: record.cohortId,
      sourceSystem: record.sourceSystem,
      sourceRecordKey: record.sourceRecordKey
    },
    sourceHints: raw,
    canonical: {
      geography: {
        country,
        region: state("UNKNOWN")
      },
      culinary: {
        tradition: state("UNKNOWN"),
        dishCategory: category.dishCategory,
        mealRoles: category.mealRoles,
        techniqueFamilies: state("UNKNOWN", []),
        difficulty: mapDifficulty(raw.difficulty, config)
      },
      time: {
        prepMinutes,
        cookMinutes,
        totalMinutes
      },
      serving: {
        servings
      },
      dietary: {
        reviewedTags: state("UNKNOWN", [])
      }
    }
  };
}

export function validateOverlayRecord(overlay, config) {
  const states = [];
  const walk = value => {
    if (!value || typeof value !== "object") return;
    if (typeof value.state === "string") states.push(value.state);
    for (const child of Object.values(value)) walk(child);
  };
  walk(overlay.canonical);
  if (states.some(s => !MAPPING_STATES.has(s))) return false;

  const dish = overlay.canonical.culinary.dishCategory;
  if (dish.value != null && !config.dishCategoryVocabulary.includes(dish.value)) return false;
  const roles = overlay.canonical.culinary.mealRoles.value ?? [];
  if (!Array.isArray(roles) || roles.some(v => !config.mealRoleVocabulary.includes(v))) return false;

  if (overlay.canonical.geography.region.state !== "UNKNOWN") return false;
  if (overlay.canonical.culinary.tradition.state !== "UNKNOWN") return false;
  if (overlay.canonical.dietary.reviewedTags.state !== "UNKNOWN") return false;
  return true;
}

export function stateCounts(overlays) {
  const counts = {};
  const visit = (dimension, node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.state === "string") {
      counts[dimension] ||= { EXACT_SOURCE_NORMALIZATION:0, REVIEWED_MAPPING:0, AMBIGUOUS:0, UNKNOWN:0 };
      counts[dimension][node.state]++;
      return;
    }
    for (const [key,value] of Object.entries(node)) visit(dimension ? dimension + "." + key : key, value);
  };
  for (const overlay of overlays) visit("", overlay.canonical);
  return counts;
}
