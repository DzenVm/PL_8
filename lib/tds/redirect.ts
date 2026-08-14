import {
  forwardedParameterNames,
  type TdsConfig,
  type TrackingParameters,
} from "./types";

const MAX_REDIRECT_URL_LENGTH = 8_192;

export function buildCampaignRedirect(
  config: TdsConfig,
  tracking: TrackingParameters,
  correlationId: string,
  targetUrl: string | null = config.targetUrl,
  sourceHost: string | null = null,
): URL | null {
  if (
    !config.enabled ||
    config.configurationError ||
    !targetUrl ||
    !config.allowedTargetHosts.size
  ) {
    return null;
  }

  try {
    const target = new URL(targetUrl);
    const normalizedHost = target.hostname.toLowerCase();
    if (
      target.protocol !== "https:" ||
      !config.allowedTargetHosts.has(normalizedHost) ||
      target.username ||
      target.password ||
      target.hash ||
      (target.port && target.port !== "443")
    ) {
      return null;
    }

    for (const name of [...forwardedParameterNames, "source"]) {
      target.searchParams.delete(name);
    }
    target.searchParams.delete(config.correlationParameter);

    for (const [name, value] of Object.entries(tracking)) {
      if (value) target.searchParams.set(name, value);
    }
    target.searchParams.set(config.correlationParameter, correlationId);
    if (sourceHost && /^[A-Za-z0-9.-]{1,253}$/.test(sourceHost)) {
      target.searchParams.set("source", sourceHost.toLowerCase());
    }

    return target.toString().length <= MAX_REDIRECT_URL_LENGTH ? target : null;
  } catch {
    return null;
  }
}
