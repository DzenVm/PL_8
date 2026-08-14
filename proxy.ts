import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readTdsConfig } from "./lib/tds/config";
import { requestTdsDecision } from "./lib/tds/decision";
import { buildCampaignRedirect } from "./lib/tds/redirect";
import { extractTrackingParameters } from "./lib/tds/tracking";
import type { TdsClientContext } from "./lib/tds/types";

function normalSiteResponse(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const contentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

function boundedHeader(value: string | null, maxLength: number) {
  if (!value) return "";
  const sanitized = value.replace(/[\u0000-\u001f\u007f]/g, "");
  return Buffer.from(sanitized, "utf8").subarray(0, maxLength).toString("utf8");
}

const palladiumHeaderNames = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "cookie",
  "dnt",
  "origin",
  "pragma",
  "referer",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "upgrade-insecure-requests",
  "user-agent",
  "x-requested-with",
] as const;

function clientContext(request: NextRequest): TdsClientContext {
  const forwardedIp = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")
    ?? "";
  const headers = Object.fromEntries(
    Array.from(request.headers.entries()).flatMap(([name, rawValue]) => {
      const isAllowed =
        palladiumHeaderNames.includes(name as (typeof palladiumHeaderNames)[number])
        || name.startsWith("sec-");
      if (!isAllowed) return [];
      const value = boundedHeader(rawValue, 512);
      return value === "" ? [] : [[name, value]];
    }),
  );

  return {
    ip: forwardedIp.split(",", 1)[0].trim(),
    host: boundedHeader(request.headers.get("host") ?? request.nextUrl.hostname, 253),
    user_agent: boundedHeader(request.headers.get("user-agent"), 512) || "unknown",
    accept: boundedHeader(request.headers.get("accept"), 512),
    accept_language: boundedHeader(request.headers.get("accept-language"), 256),
    referer: boundedHeader(request.headers.get("referer"), 1024),
    headers,
  };
}

export async function proxy(request: NextRequest) {
  const isEligibleRequest =
    (request.method === "GET" || request.method === "HEAD") &&
    request.nextUrl.pathname === "/";

  if (!isEligibleRequest) return normalSiteResponse(request);

  const tracking = extractTrackingParameters(request.nextUrl.searchParams);
  if (!tracking) return normalSiteResponse(request);

  const tdsConfig = readTdsConfig();
  const correlationId = crypto.randomUUID();
  if (
    !tdsConfig.enabled ||
    tdsConfig.configurationError ||
    tdsConfig.decisionConfigurationError
  ) {
    if (tdsConfig.enabled) {
      console.warn(
        JSON.stringify({
          event: "tds_route_skipped",
          correlation_id: correlationId,
          error:
            tdsConfig.configurationError
            ?? tdsConfig.decisionConfigurationError
            ?? "CONFIGURATION_INVALID",
        }),
      );
    }
    return normalSiteResponse(request);
  }

  const decision = await requestTdsDecision(
    tdsConfig,
    tracking,
    clientContext(request),
    correlationId,
  );
  console.info(
    JSON.stringify({
      event: "tds_decision_received",
      correlation_id: correlationId,
      decision: decision.kind,
      reason: decision.reason,
      ...("latencyMs" in decision && decision.latencyMs !== null
        ? { latency_ms: decision.latencyMs }
        : {}),
    }),
  );
  if (decision.kind === "deny") {
    const response = normalSiteResponse(request);
    response.headers.set("X-Correlation-ID", correlationId);
    return response;
  }

  let target = decision.kind === "allow" ? decision.target : null;
  if (decision.kind === "error") {
    console.warn(
      JSON.stringify({
        event: "tds_decision_failed",
        correlation_id: correlationId,
        error: decision.reason,
      }),
    );
    if (tdsConfig.errorFallback === "target") {
      target = tdsConfig.targetUrl;
    }
  }

  const destination = buildCampaignRedirect(
    tdsConfig,
    tracking,
    correlationId,
    target,
  );
  if (!destination) {
    const response = normalSiteResponse(request);
    response.headers.set("X-Correlation-ID", correlationId);
    return response;
  }

  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Correlation-ID", correlationId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|images/).*)",
  ],
};
