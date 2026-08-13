import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readTdsConfig } from "../../lib/tds/config";
import { sendTdsEvent } from "../../lib/tds/event";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendTdsEvent", () => {
  it("sends one signed server-side request without browser fingerprint fields", async () => {
    const testSecret = "unit-test-secret".padEnd(32, "s");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const config = readTdsConfig({
      TDS_ENABLED: "true",
      TDS_TARGET_URL: "https://tracker.example/campaign",
      TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
      TDS_EVENT_URL: "https://events.example/v4/index.php",
      TDS_SHARED_SECRET: testSecret,
      TDS_KEY_ID: "test-v1",
      TDS_TIMEOUT_MS: "900",
    });

    await sendTdsEvent(
      config,
      { gclid: "123abc" },
      "11111111-2222-4333-8444-555555555555",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://events.example/v4/index.php");
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("error");
    expect(init.body).not.toContain("user_agent");
    expect(init.body).not.toContain("client_ip");
    expect(new Headers(init.headers).get("X-TDS-Signature")).toMatch(/^v1=/);
    expect(new Headers(init.headers).get("X-TDS-Key-Id")).toBe("test-v1");

    const headers = new Headers(init.headers);
    const signature = headers.get("X-TDS-Signature")?.slice(3);
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
    expect(signature).toBe(
      createHmac("sha256", testSecret)
        .update(canonical)
        .digest("base64url"),
    );
  });

  it("does nothing when the event integration is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const config = readTdsConfig({
      TDS_ENABLED: "true",
      TDS_TARGET_URL: "https://tracker.example/campaign",
      TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
    });

    await sendTdsEvent(config, { gclid: "123abc" }, crypto.randomUUID());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["network rejection", vi.fn().mockRejectedValue(new TypeError("network"))],
    ["server error", vi.fn().mockResolvedValue(new Response(null, { status: 503 }))],
  ])("absorbs %s because telemetry never gates routing", async (_name, fetchMock) => {
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const config = readTdsConfig({
      TDS_ENABLED: "true",
      TDS_TARGET_URL: "https://tracker.example/campaign",
      TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
      TDS_EVENT_URL: "https://events.example/v4/index.php",
      TDS_SHARED_SECRET: "s".repeat(32),
    });

    await expect(
      sendTdsEvent(config, { gclid: "123abc" }, crypto.randomUUID()),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
