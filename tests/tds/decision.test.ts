import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readTdsConfig } from "../../lib/tds/config";
import { requestTdsDecision } from "../../lib/tds/decision";

const correlationId = "11111111-2222-4333-8444-555555555555";
const client = {
  ip: "203.0.113.10",
  host: "studiadesi.site",
  user_agent: "Mozilla/5.0 Test Browser",
  accept: "text/html",
  accept_language: "tr-TR",
  referer: "",
  headers: {},
};

function configuredEnvironment() {
  return {
    TDS_ENABLED: "true",
    TDS_TARGET_URL: "https://tracker.example/campaign",
    TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
    TDS_DECISION_URL: "https://events.example/v4/index.php",
    TDS_SHARED_SECRET: "unit-test-secret".padEnd(32, "s"),
    TDS_KEY_ID: "test-v1",
    TDS_SITE_ID: "PL_8",
    TDS_TIMEOUT_MS: "1200",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestTdsDecision", () => {
  it("sends one signed server-side decision request with truthful client context", async () => {
    const environment = configuredEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schema_version: 1,
      decision: "allow",
      correlation_id: correlationId,
      target: "https://tracker.example/allowed",
      reason: "palladium_allowed",
      latency_ms: 42,
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const outcome = await requestTdsDecision(
      readTdsConfig(environment),
      { gclid: "123abc" },
      client,
      correlationId,
    );

    expect(outcome).toEqual({
      kind: "allow",
      target: "https://tracker.example/allowed",
      reason: "palladium_allowed",
      latencyMs: 42,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://events.example/v4/index.php");
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("error");
    const payload = JSON.parse(String(init.body));
    expect(payload.client).toEqual(client);
    expect(payload.tracking).toEqual({ gclid: "123abc" });

    const headers = new Headers(init.headers);
    const body = String(init.body);
    const canonical = [
      "v1",
      "POST",
      url.host,
      url.pathname,
      headers.get("X-TDS-Timestamp"),
      headers.get("X-TDS-Nonce"),
      headers.get("X-Correlation-ID"),
      createHash("sha256").update(body).digest("hex"),
    ].join("\n");
    expect(headers.get("X-TDS-Signature")).toBe(
      `v1=${createHmac("sha256", environment.TDS_SHARED_SECRET)
        .update(canonical)
        .digest("base64url")}`,
    );
  });

  it("maps Palladium deny without a target", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schema_version: 1,
      decision: "deny",
      correlation_id: correlationId,
      reason: "palladium_denied",
      latency_ms: 31,
    }), { status: 200 })));
    await expect(requestTdsDecision(
      readTdsConfig(configuredEnvironment()),
      { gclid: "123abc" },
      client,
      correlationId,
    )).resolves.toEqual({
      kind: "deny",
      reason: "palladium_denied",
      latencyMs: 31,
    });
  });

  it.each([
    ["network", vi.fn().mockRejectedValue(new TypeError("network")), "decision_network_error"],
    ["upstream", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })), "decision_http_502"],
    ["malformed", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })), "decision_network_error"],
  ])("returns a technical outcome for %s failure", async (_name, fetchMock, reason) => {
    vi.stubGlobal("fetch", fetchMock);
    const outcome = await requestTdsDecision(
      readTdsConfig(configuredEnvironment()),
      { gclid: "123abc" },
      client,
      correlationId,
    );
    expect(outcome).toEqual({ kind: "error", reason });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      schema_version: 1,
      decision: "allow",
      correlation_id: correlationId,
      target: "https://evil.example/",
      reason: "palladium_allowed",
    },
    {
      schema_version: 1,
      decision: "allow",
      correlation_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      target: "https://tracker.example/",
      reason: "palladium_allowed",
    },
  ])("rejects an untrusted decision response", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
    const outcome = await requestTdsDecision(
      readTdsConfig(configuredEnvironment()),
      { gclid: "123abc" },
      client,
      correlationId,
    );
    expect(outcome.kind).toBe("error");
  });
});
