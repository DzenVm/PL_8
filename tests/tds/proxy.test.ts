import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../../proxy";

const baseEnvironment = {
  TDS_ENABLED: "true",
  TDS_TARGET_URL: "https://tracker.example/campaign?fixed=value",
  TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
  TDS_CORRELATION_PARAM: "sub_id_6",
  TDS_DECISION_URL: "https://events.example/v4/index.php",
  TDS_SHARED_SECRET: "s".repeat(32),
  TDS_KEY_ID: "pl8-v1",
  TDS_SITE_ID: "PL_8",
  TDS_TIMEOUT_MS: "1200",
  TDS_ERROR_FALLBACK: "target",
};

function applyEnvironment(overrides: Record<string, string> = {}) {
  for (const [name, value] of Object.entries({ ...baseEnvironment, ...overrides })) {
    vi.stubEnv(name, value);
  }
}

function decisionResponse(decision: "allow" | "deny" = "allow") {
  return vi.fn(async (_url: URL, init: RequestInit) => {
    const request = JSON.parse(String(init.body));
    return new Response(JSON.stringify({
      schema_version: 1,
      decision,
      correlation_id: request.correlation_id,
      ...(decision === "allow" ? { target: "https://tracker.example/from-palladium" } : {}),
      reason: decision === "allow" ? "palladium_allowed" : "palladium_denied",
      latency_ms: 25,
    }), { status: 200 });
  });
}

async function runProxy(
  url: string,
  userAgent = "Test Browser",
  method: "GET" | "HEAD" | "POST" = "GET",
  extraHeaders: Record<string, string> = {},
) {
  return proxy(new NextRequest(url, {
    headers: {
      "user-agent": userAgent,
      "x-vercel-forwarded-for": "203.0.113.10",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "tr-TR",
      "accept-encoding": "gzip, br",
      "sec-ch-ua": '"Chromium";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-ch-ua-full-version-list": '"Chromium";v="140.0.7339.0"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "upgrade-insecure-requests": "1",
      cookie: "consent=accepted",
      ...extraHeaders,
    },
    method,
  }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("proxy routing", () => {
  it.each(["gclid", "gbraid", "wbraid"])(
    "redirects a root request with %s only after Palladium allow",
    async (name) => {
      applyEnvironment();
      const fetchMock = decisionResponse("allow");
      vi.stubGlobal("fetch", fetchMock);
      const response = await runProxy(`https://studiadesi.site/?${name}=123abc`);
      const destination = new URL(response.headers.get("location") ?? "");

      expect(response.status).toBe(307);
      expect(destination.pathname).toBe("/from-palladium");
      expect(destination.searchParams.get(name)).toBe("123abc");
      expect(destination.searchParams.get("sub_id_6")).toMatch(/^[0-9a-f-]{36}$/);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each<string>([
    "https://studiadesi.site/",
    "https://studiadesi.site/?utm_source=google",
    "https://studiadesi.site/kontakt?gclid=123abc",
    "https://studiadesi.site/?gclid=",
  ])("serves the ordinary site without an eligible ad identifier: %s", async (url) => {
    applyEnvironment();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await runProxy(url);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves the ordinary site after Palladium deny", async () => {
    applyEnvironment();
    vi.stubGlobal("fetch", decisionResponse("deny"));
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await runProxy("https://studiadesi.site/?gclid=123abc");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-correlation-id")).toMatch(/^[0-9a-f-]{36}$/);
    const record = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(record).toMatchObject({
      event: "tds_decision_received",
      decision: "deny",
      reason: "palladium_denied",
      latency_ms: 25,
    });
    expect(record.correlation_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(record)).not.toContain("123abc");
  });

  it("preserves paid traffic on a technical error when fallback is target", async () => {
    applyEnvironment({ TDS_ERROR_FALLBACK: "target" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await runProxy("https://studiadesi.site/?gclid=123abc");
    const destination = new URL(response.headers.get("location") ?? "");
    expect(response.status).toBe(307);
    expect(destination.pathname).toBe("/campaign");
  });

  it("never bypasses Palladium on a technical error when fallback is site", async () => {
    applyEnvironment({ TDS_ERROR_FALLBACK: "site" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await runProxy("https://studiadesi.site/?gclid=123abc");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("forwards Vercel's anti-spoofed client IP and the authentic User-Agent", async () => {
    applyEnvironment();
    const fetchMock = decisionResponse("allow");
    vi.stubGlobal("fetch", fetchMock);
    await runProxy("https://studiadesi.site/?gclid=123abc", "AdsBot-Google");
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.client.ip).toBe("203.0.113.10");
    expect(request.client.user_agent).toBe("AdsBot-Google");
    expect(request.client.headers).toMatchObject({
      "accept-encoding": "gzip, br",
      "sec-ch-ua": '"Chromium";v="140"',
      "sec-fetch-mode": "navigate",
      "sec-ch-ua-full-version-list": '"Chromium";v="140.0.7339.0"',
      cookie: "consent=accepted",
    });
  });

  it("uses Cloudflare's client IP only with the verified proxy marker", async () => {
    applyEnvironment({ TDS_CF_PROXY_TOKEN: "cf-proxy-secret" });
    const fetchMock = decisionResponse("allow");
    vi.stubGlobal("fetch", fetchMock);
    await runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Test Browser",
      "GET",
      {
        "cf-connecting-ip": "188.125.171.218",
        "x-pl8-cf-verified": "cf-proxy-secret",
      },
    );
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.client.ip).toBe("188.125.171.218");
  });

  it("does not trust an unverified Cloudflare client IP", async () => {
    applyEnvironment({ TDS_CF_PROXY_TOKEN: "cf-proxy-secret" });
    const fetchMock = decisionResponse("allow");
    vi.stubGlobal("fetch", fetchMock);
    await runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Test Browser",
      "GET",
      { "cf-connecting-ip": "188.125.171.218" },
    );
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.client.ip).toBe("203.0.113.10");
  });

  it("does not make its own decision depend on User-Agent", async () => {
    applyEnvironment();
    vi.stubGlobal("fetch", decisionResponse("allow"));
    const chrome = await runProxy("https://studiadesi.site/?gclid=123abc", "Mozilla/5.0 Chrome/140");
    const crawler = await runProxy("https://studiadesi.site/?gclid=123abc", "AdsBot-Google");
    const chromeDestination = new URL(chrome.headers.get("location") ?? "");
    const crawlerDestination = new URL(crawler.headers.get("location") ?? "");
    chromeDestination.searchParams.delete("sub_id_6");
    crawlerDestination.searchParams.delete("sub_id_6");
    expect(chrome.status).toBe(crawler.status);
    expect(chromeDestination.toString()).toBe(crawlerDestination.toString());
  });

  it("fails to the ordinary site when decision authentication is incomplete", async () => {
    applyEnvironment({ TDS_SHARED_SECRET: "too-short" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await runProxy("https://studiadesi.site/?gclid=123abc");
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps GET and HEAD routing consistent", async () => {
    applyEnvironment();
    vi.stubGlobal("fetch", decisionResponse("allow"));
    const getResponse = await runProxy("https://studiadesi.site/?gclid=123abc", "Test Browser", "GET");
    const headResponse = await runProxy("https://studiadesi.site/?gclid=123abc", "Test Browser", "HEAD");
    expect(getResponse.status).toBe(307);
    expect(headResponse.status).toBe(307);
  });

  it("does not route POST requests", async () => {
    applyEnvironment();
    const response = await runProxy("https://studiadesi.site/?gclid=123abc", "Test Browser", "POST");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("fails to the normal site when the fixed target is invalid", async () => {
    applyEnvironment({ TDS_TARGET_URL: "https://foreign.example/campaign" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await runProxy("https://studiadesi.site/?gclid=123abc");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
