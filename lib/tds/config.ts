import type { TdsConfig } from "./types";

const DEFAULT_TIMEOUT_MS = 900;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 2_000;
const PL8_CORRELATION_PARAMETER = "sub_id_6";
const keyIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

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
  const configuredEventUrl = normalizedUrl(environment.TDS_EVENT_URL, {
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
  const keyId = environment.TDS_KEY_ID || "pl8-v1";

  let configurationError: string | null = null;
  if (enabled && !targetUrl) configurationError = "TARGET_URL_INVALID";
  else if (enabled && allowedTargetHosts.size === 0)
    configurationError = "TARGET_ALLOWLIST_EMPTY";
  else if (correlationParameter !== PL8_CORRELATION_PARAMETER)
    configurationError = "CORRELATION_PARAMETER_INVALID";
  let eventConfigurationError: string | null = null;
  if (
    (configuredEventUrl && !configuredSharedSecret) ||
    (!configuredEventUrl && configuredSharedSecret)
  ) {
    eventConfigurationError = "EVENT_AUTH_INCOMPLETE";
  } else if (environment.TDS_EVENT_URL && !configuredEventUrl) {
    eventConfigurationError = "EVENT_URL_INVALID";
  } else if (
    configuredSharedSecret &&
    (utf8ByteLength(configuredSharedSecret) < 32 ||
      utf8ByteLength(configuredSharedSecret) > 4_096)
  ) {
    eventConfigurationError = "EVENT_SECRET_INVALID";
  } else if (!keyIdPattern.test(keyId)) {
    eventConfigurationError = "EVENT_KEY_ID_INVALID";
  }

  const eventUrl = eventConfigurationError ? null : configuredEventUrl;
  const sharedSecret = eventConfigurationError
    ? null
    : configuredSharedSecret;

  return {
    enabled,
    targetUrl,
    allowedTargetHosts,
    correlationParameter,
    eventUrl,
    sharedSecret,
    keyId,
    timeoutMs: parseTimeout(environment.TDS_TIMEOUT_MS),
    configurationError,
    eventConfigurationError,
  };
}
