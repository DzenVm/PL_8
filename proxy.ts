import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { readTdsConfig } from "./lib/tds/config";
import { sendTdsEvent } from "./lib/tds/event";
import { buildCampaignRedirect } from "./lib/tds/redirect";
import { extractTrackingParameters } from "./lib/tds/tracking";

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

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const isEligibleRequest =
    (request.method === "GET" || request.method === "HEAD") &&
    request.nextUrl.pathname === "/";

  if (!isEligibleRequest) return normalSiteResponse(request);

  const tracking = extractTrackingParameters(request.nextUrl.searchParams);
  if (!tracking) return normalSiteResponse(request);

  const tdsConfig = readTdsConfig();
  const correlationId = crypto.randomUUID();
  const destination = buildCampaignRedirect(
    tdsConfig,
    tracking,
    correlationId,
  );

  if (!destination) {
    if (tdsConfig.enabled) {
      console.warn(
        JSON.stringify({
          event: "tds_route_skipped",
          correlation_id: correlationId,
          error: tdsConfig.configurationError ?? "TARGET_REJECTED",
        }),
      );
    }
    return normalSiteResponse(request);
  }

  if (
    tdsConfig.eventUrl &&
    tdsConfig.sharedSecret &&
    tdsConfig.keyId &&
    tdsConfig.siteId
  ) {
    event.waitUntil(sendTdsEvent(tdsConfig, tracking, correlationId));
  } else if (tdsConfig.eventConfigurationError) {
    console.warn(
      JSON.stringify({
        event: "tds_event_disabled",
        correlation_id: correlationId,
        error: tdsConfig.eventConfigurationError,
      }),
    );
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
