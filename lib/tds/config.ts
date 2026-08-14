import type { TdsConfig } from "./types";

const DEFAULT_TIMEOUT_MS = 1_200;
const MIN_TIMEOUT_MS = 500;
const MAX_TIMEOUT_MS = 2_500;
const PL8_CORRELATION_PARAMETER = "sub_id_6";
const keyIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const siteIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

function utf8ByteLength(value: string) {
  return Buffer.byteLength(value, "utf8");
}

function normalizedUrl(
  value: string | undefined,
  options: { allowSearch: boolean },
) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash ||
      (!options.allowSearch && url.search) ||
      (url.port && url.port !== "443")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseTimeout(value: string | undefined) {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, parsed));
}

export function readTdsConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): TdsConfig {
  const enabled = environment.TDS_ENABLED === "true";
  const targetUrl = normalizedUrl(environment.TDS_TARGET_URL, {
    allowSearch: true,
  });
  const configuredDecisionUrl = normalizedUrl(environment.TDS_DECISION_URL, {
    allowSearch: false,
  });
  const allowedTargetHosts = new Set(
    (environment.TDS_ALLOWED_TARGET_HOSTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const correlationParameter =
    environment.TDS_CORRELATION_PARAM ?? PL8_CORRELATION_PARAMETER;
  const rawSharedSecret = environment.TDS_SHARED_SECRET;
  const configuredSharedSecret = rawSharedSecret === "" ? null : rawSharedSecret ?? null;
  const keyId = environment.TDS_KEY_ID || null;
  const siteId = environment.TDS_SITE_ID || null;
  const errorFallback = environment.TDS_ERROR_FALLBACK === "site" ? "site" : "target";

  let configurationError: string | null = null;
  if (enabled && !targetUrl) configurationError = "TARGET_URL_INVALID";
  else if (enabled && allowedTargetHosts.size === 0)
    configurationError = "TARGET_ALLOWLIST_EMPTY";
  else if (
    enabled
    && targetUrl
    && !allowedTargetHosts.has(new URL(targetUrl).hostname.toLowerCase())
  ) configurationError = "TARGET_URL_NOT_ALLOWED";
  else if (correlationParameter !== PL8_CORRELATION_PARAMETER)
    configurationError = "CORRELATION_PARAMETER_INVALID";
  let decisionConfigurationError: string | null = null;
  const decisionConfigurationStarted = Boolean(
    environment.TDS_DECISION_URL || configuredSharedSecret || keyId || siteId,
  );
  if (environment.TDS_DECISION_URL && !configuredDecisionUrl) {
    decisionConfigurationError = "DECISION_URL_INVALID";
  } else if (
    configuredSharedSecret &&
    (utf8ByteLength(configuredSharedSecret) < 32 ||
      utf8ByteLength(configuredSharedSecret) > 4_096)
  ) {
    decisionConfigurationError = "DECISION_SECRET_INVALID";
  } else if (keyId && !keyIdPattern.test(keyId)) {
    decisionConfigurationError = "DECISION_KEY_ID_INVALID";
  } else if (siteId && !siteIdPattern.test(siteId)) {
    decisionConfigurationError = "DECISION_SITE_ID_INVALID";
  } else if (
    decisionConfigurationStarted &&
    (!configuredDecisionUrl || !configuredSharedSecret || !keyId || !siteId)
  ) {
    decisionConfigurationError = "DECISION_AUTH_INCOMPLETE";
  } else if (enabled && !decisionConfigurationStarted) {
    decisionConfigurationError = "DECISION_AUTH_REQUIRED";
  }

  const decisionUrl = decisionConfigurationError ? null : configuredDecisionUrl;
  const sharedSecret = decisionConfigurationError
    ? null
    : configuredSharedSecret;

  return {
    enabled,
    targetUrl,
    allowedTargetHosts,
    correlationParameter,
    decisionUrl,
    sharedSecret,
    keyId: decisionConfigurationError ? null : keyId,
    siteId: decisionConfigurationError ? null : siteId,
    timeoutMs: parseTimeout(environment.TDS_TIMEOUT_MS),
    errorFallback,
    configurationError,
    decisionConfigurationError,
  };
}
