const nonEmpty = value => typeof value === "string" && value.trim().length > 0;

const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[char]));

const safeHttpUrl = value => {
  if (!nonEmpty(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

const licenseDisplay = value => {
  if (value === "CC-BY-SA-4.0") return "CC BY-SA 4.0";
  return String(value || "");
};

export function inspectPublicAttributionSource(source = {}) {
  const requirement = source.publicAttributionRequirement;
  const state = source.publicAttributionState;

  if (source.sourceExpressionPersisted === true || (source.rawExpressionRetention && source.rawExpressionRetention !== "NONE")) {
    return { allowed: false, required: requirement === "REQUIRED", reason: "PROTECTED_EXPRESSION_PERSISTED" };
  }

  if (requirement === "UNKNOWN" || state === "UNKNOWN") {
    return { allowed: false, required: false, reason: "ATTRIBUTION_UNKNOWN" };
  }

  if (requirement === "NOT_REQUIRED") {
    if (state !== "NOT_APPLICABLE") {
      return { allowed: false, required: false, reason: "ATTRIBUTION_STATE_INVALID_FOR_NOT_REQUIRED" };
    }
    return { allowed: true, required: false, reason: "ATTRIBUTION_NOT_REQUIRED", notice: null };
  }

  if (requirement !== "REQUIRED") {
    return { allowed: false, required: false, reason: "ATTRIBUTION_REQUIREMENT_UNCLASSIFIED" };
  }

  if (state !== "READY") {
    return {
      allowed: false,
      required: true,
      reason: state === "UNSATISFIABLE" ? "ATTRIBUTION_REQUIRED_UNSATISFIABLE" : "ATTRIBUTION_REQUIRED_NOT_READY"
    };
  }

  const url = safeHttpUrl(source.url);
  if (!nonEmpty(source.attributionLabel) || !nonEmpty(source.attributionLicenseOrBasis) || !url) {
    return { allowed: false, required: true, reason: "ATTRIBUTION_REQUIRED_FIELDS_MISSING" };
  }

  return {
    allowed: true,
    required: true,
    reason: "ATTRIBUTION_REQUIRED_READY",
    notice: {
      attributionLabel: source.attributionLabel.trim(),
      sourceUrl: url,
      attributionLicenseOrBasis: source.attributionLicenseOrBasis.trim(),
      publisherLedgerKey: nonEmpty(source.publisherLedgerKey) ? source.publisherLedgerKey.trim() : null
    }
  };
}

export function buildRecipeFamilyAttributionBundle(candidate = {}, observations = []) {
  const ids = Array.isArray(candidate.provenanceObservationIds)
    ? [...new Set(candidate.provenanceObservationIds.filter(nonEmpty))]
    : [];

  if (!nonEmpty(candidate.projectionId) || !ids.length) {
    return { allowed: false, reason: "CANDIDATE_PROVENANCE_MISSING", notices: [], internalProvenanceObservationIds: ids };
  }

  if (candidate.rightsState !== "PROJECT_AUTHORED_EXPRESSION_FROM_NORMALIZED_FACTUAL_EVIDENCE") {
    return { allowed: false, reason: "CANDIDATE_RIGHTS_STATE_UNSUPPORTED", notices: [], internalProvenanceObservationIds: ids };
  }

  const byId = new Map(
    observations
      .filter(row => row && nonEmpty(row.observationId))
      .map(row => [row.observationId, row])
  );

  const selected = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (!row?.source) {
      return { allowed: false, reason: "CANDIDATE_PROVENANCE_OBSERVATION_MISSING", notices: [], internalProvenanceObservationIds: ids };
    }
    selected.push(row);
  }

  const decisions = selected.map(row => ({
    observationId: row.observationId,
    decision: inspectPublicAttributionSource(row.source)
  }));
  const blocked = decisions.find(row => !row.decision.allowed);
  if (blocked) {
    return {
      allowed: false,
      reason: blocked.decision.reason,
      blockedObservationId: blocked.observationId,
      notices: [],
      internalProvenanceObservationIds: ids
    };
  }

  const notices = decisions
    .filter(row => row.decision.required)
    .map(row => ({
      observationId: row.observationId,
      ...row.decision.notice
    }));

  return {
    allowed: true,
    reason: notices.length ? "ATTRIBUTION_READY" : "ATTRIBUTION_NOT_REQUIRED",
    candidateProjectionId: candidate.projectionId,
    notices,
    sourceClassKeys: [...new Set(notices.map(item => item.publisherLedgerKey).filter(Boolean))].sort(),
    internalProvenanceObservationIds: ids,
    transformationNotice: "Project-authored recipe candidate synthesized from normalized factual evidence; no third-party source expression is retained."
  };
}

export function renderRecipeFamilyAttributionBundle(bundle = {}) {
  if (bundle.allowed !== true || !Array.isArray(bundle.notices) || bundle.notices.length === 0) return "";
  const items = bundle.notices.map(item =>
    '<li><a href="' + escapeHtml(item.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(item.attributionLabel) + '</a> · ' + escapeHtml(item.attributionLicenseOrBasis) + '</li>'
  ).join("");

  return '<div class="micro external-source recipe-family-attribution" data-recipe-family-attribution="ready">' +
    '<p>Evidence attribution for this project-authored recipe candidate:</p><ul>' + items + '</ul>' +
    '<p>' + escapeHtml(bundle.transformationNotice) + '</p></div>';
}

export function recipeFamilyPublicRuntimeAdmission(candidate = {}, observations = [], options = {}) {
  const attribution = buildRecipeFamilyAttributionBundle(candidate, observations);
  const separatelyAuthorized =
    options.publicAdmissionAuthorized === true &&
    candidate.activationAuthority === "PUBLIC_RUNTIME_AUTHORIZED";

  return {
    allowed: attribution.allowed === true && separatelyAuthorized,
    reason: attribution.allowed !== true
      ? attribution.reason
      : separatelyAuthorized
        ? "PUBLIC_RUNTIME_ADMISSION_AUTHORIZED"
        : "PUBLIC_RUNTIME_ADMISSION_NOT_SEPARATELY_AUTHORIZED",
    attribution
  };
}

export function inspectExternalRecipeProvenance(provenance = {}) {
  if (provenance.sourceType !== "EXTERNAL_OPEN_RECIPE") {
    return { allowed: true, reason: "NOT_EXTERNAL_OPEN_RECIPE" };
  }

  const sourceUrl = safeHttpUrl(provenance.sourceUrl);
  const licenseUrl = safeHttpUrl(provenance.licenseUrl);
  const revisionUrl = provenance.sourceRevisionUrl == null ? null : safeHttpUrl(provenance.sourceRevisionUrl);

  if (
    !nonEmpty(provenance.sourceName) ||
    !sourceUrl ||
    !nonEmpty(provenance.license) ||
    !licenseUrl ||
    !nonEmpty(provenance.attribution) ||
    !nonEmpty(provenance.transformation)
  ) {
    return { allowed: false, reason: "EXTERNAL_ATTRIBUTION_REQUIRED_FIELDS_MISSING" };
  }

  if (provenance.sourceRevisionUrl != null && !revisionUrl) {
    return { allowed: false, reason: "EXTERNAL_IMMUTABLE_SOURCE_LOCATOR_INVALID" };
  }

  return {
    allowed: true,
    reason: "EXTERNAL_ATTRIBUTION_READY",
    notice: {
      sourceName: provenance.sourceName,
      sourceUrl,
      sourceRevisionUrl: revisionUrl,
      sourceRevisionId: provenance.sourceRevisionId,
      license: licenseDisplay(provenance.license),
      licenseUrl,
      attribution: provenance.attribution,
      transformation: provenance.transformation
    }
  };
}

export function renderExternalRecipeProvenance(provenance = {}, options = {}) {
  const decision = inspectExternalRecipeProvenance(provenance);
  if (!decision.allowed || !decision.notice) return "";

  const notice = decision.notice;
  const revision = notice.sourceRevisionUrl
    ? ' · <a href="' + escapeHtml(notice.sourceRevisionUrl) + '" target="_blank" rel="noopener noreferrer">revision ' +
      escapeHtml(notice.sourceRevisionId ?? "source snapshot") + '</a>'
    : "";

  const nutritionNotice = nonEmpty(options.nutritionNotice) ? " " + options.nutritionNotice.trim() : "";

  return '<p class="micro external-source">Adapted from <a href="' + escapeHtml(notice.sourceUrl) +
    '" target="_blank" rel="noopener noreferrer">' + escapeHtml(notice.sourceName) + '</a>' +
    revision + ' · <a href="' + escapeHtml(notice.licenseUrl) +
    '" target="_blank" rel="noopener noreferrer">' + escapeHtml(notice.license) + '</a>. ' +
    escapeHtml(notice.attribution) + ' ' + escapeHtml(notice.transformation) + escapeHtml(nutritionNotice) + '</p>';
}
