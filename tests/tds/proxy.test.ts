import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../../proxy";

const baseEnvironment = {
  TDS_ENABLED: "true",
  TDS_TARGET_URL: "https://tracker.example/campaign?fixed=value",
  TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
  TDS_CORRELATION_PARAM: "sub_id_6",
};

function applyEnvironment(overrides: Record<string, string> = {}) {
  for (const [name, value] of Object.entries({
    ...baseEnvironment,
    ...overrides,
  })) {
    vi.stubEnv(name, value);
  }
}

function runProxy(
  url: string,
  userAgent = "Test Browser",
  method: "GET" | "HEAD" | "POST" = "GET",
) {
  const waitUntil = vi.fn();
  const response = proxy(
    new NextRequest(url, { headers: { "user-agent": userAgent }, method }),
    { waitUntil } as never,
  );
  return { response, waitUntil };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy routing", () => {
  it.each(["gclid", "gbraid", "wbraid"])(
    "redirects a root request with %s",
    (name) => {
      applyEnvironment();
      const { response } = runProxy(`https://studiadesi.site/?${name}=123abc`);
      const destination = new URL(response.headers.get("location") ?? "");

      expect(response.status).toBe(307);
      expect(destination.searchParams.get(name)).toBe("123abc");
      expect(destination.searchParams.get("sub_id_6")).toMatch(
        /^[0-9a-f-]{36}$/,
      );
      expect(response.headers.get("cache-control")).toContain("no-store");
    },
  );

  it.each<string>([
    "https://studiadesi.site/",
    "https://studiadesi.site/?utm_source=google",
    "https://studiadesi.site/kontakt?gclid=123abc",
    "https://studiadesi.site/?gclid=",
  ])("serves the ordinary site without an eligible ad identifier: %s", (url) => {
    applyEnvironment();
    const { response, waitUntil } = runProxy(url);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("does not make routing depend on User-Agent", () => {
    applyEnvironment();
    const chrome = runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Mozilla/5.0 Chrome/140",
    ).response;
    const crawler = runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "AdsBot-Google",
    ).response;
    const chromeDestination = new URL(chrome.headers.get("location") ?? "");
    const crawlerDestination = new URL(crawler.headers.get("location") ?? "");
    chromeDestination.searchParams.delete("sub_id_6");
    crawlerDestination.searchParams.delete("sub_id_6");

    expect(chrome.status).toBe(crawler.status);
    expect(chromeDestination.toString()).toBe(crawlerDestination.toString());
  });

  it("routes even if optional telemetry is not configured", () => {
    applyEnvironment();
    const { response, waitUntil } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
    );
    expect(response.status).toBe(307);
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("routes when optional telemetry is only half configured", () => {
    applyEnvironment({ TDS_SHARED_SECRET: "configured-without-url" });
    const { response, waitUntil } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
    );
    expect(response.status).toBe(307);
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("schedules one telemetry event without delaying the redirect", () => {
    applyEnvironment({
      TDS_EVENT_URL: "https://events.example/v4/index.php",
      TDS_SHARED_SECRET: "s".repeat(32),
      TDS_KEY_ID: "pl8-v1",
      TDS_SITE_ID: "PL_8",
    });
    const { response, waitUntil } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
    );
    expect(response.status).toBe(307);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
  });

  it.each<Record<string, string>>([
    {
      TDS_SHARED_SECRET: "too-short",
      TDS_EVENT_URL: "https://events.example/v4/index.php",
    },
    {
      TDS_SHARED_SECRET: "s".repeat(32),
      TDS_EVENT_URL: "https://events.example/v4/index.php",
      TDS_KEY_ID: "bad key",
      TDS_SITE_ID: "PL_8",
    },
    {
      TDS_SHARED_SECRET: "s".repeat(32),
      TDS_EVENT_URL: "https://events.example/v4/index.php",
      TDS_KEY_ID: "pl8-v1",
      TDS_SITE_ID: "bad site id",
    },
  ])("keeps routing when telemetry credentials are invalid: %o", (overrides) => {
    applyEnvironment(overrides);
    const { response, waitUntil } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
    );
    expect(response.status).toBe(307);
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("keeps GET and HEAD routing consistent", () => {
    applyEnvironment();
    const getResponse = runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Test Browser",
      "GET",
    ).response;
    const headResponse = runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Test Browser",
      "HEAD",
    ).response;
    expect(getResponse.status).toBe(307);
    expect(headResponse.status).toBe(307);
  });

  it("does not route POST requests", () => {
    applyEnvironment();
    const { response } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
      "Test Browser",
      "POST",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("fails to the normal site when the fixed target is invalid", () => {
    applyEnvironment({ TDS_TARGET_URL: "https://foreign.example/campaign" });
    const { response } = runProxy(
      "https://studiadesi.site/?gclid=123abc",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
