import { describe, expect, it } from "vitest";
import { readTdsConfig } from "../../lib/tds/config";
import { buildCampaignRedirect } from "../../lib/tds/redirect";

const correlationId = "11111111-2222-4333-8444-555555555555";

function enabledConfig(
  overrides: Readonly<Record<string, string | undefined>> = {},
) {
  return readTdsConfig({
    TDS_ENABLED: "true",
    TDS_TARGET_URL: "https://tracker.example/campaign?fixed=value&sub_id_6=old",
    TDS_ALLOWED_TARGET_HOSTS: "tracker.example",
    TDS_CORRELATION_PARAM: "sub_id_6",
    ...overrides,
  });
}

describe("buildCampaignRedirect", () => {
  it("uses the fixed target and overwrites tracking and correlation fields", () => {
    const destination = buildCampaignRedirect(
      enabledConfig(),
      { gclid: "123abc", utm_source: "google" },
      correlationId,
    );

    expect(destination?.origin).toBe("https://tracker.example");
    expect(destination?.pathname).toBe("/campaign");
    expect(destination?.searchParams.get("fixed")).toBe("value");
    expect(destination?.searchParams.getAll("gclid")).toEqual(["123abc"]);
    expect(destination?.searchParams.getAll("sub_id_6")).toEqual([
      correlationId,
    ]);
  });

  it("removes stale reserved tracking values from the fixed target", () => {
    const destination = buildCampaignRedirect(
      enabledConfig({
        TDS_TARGET_URL:
          "https://tracker.example/campaign?fixed=value&wbraid=stale&utm_source=stale&sub_id_6=stale",
      }),
      { gclid: "fresh" },
      correlationId,
    );

    expect(destination?.searchParams.get("fixed")).toBe("value");
    expect(destination?.searchParams.get("gclid")).toBe("fresh");
    expect(destination?.searchParams.has("wbraid")).toBe(false);
    expect(destination?.searchParams.has("utm_source")).toBe(false);
    expect(destination?.searchParams.get("sub_id_6")).toBe(correlationId);
  });

  it.each([
    { TDS_ENABLED: "false" },
    { TDS_TARGET_URL: "http://tracker.example/campaign" },
    { TDS_TARGET_URL: "https://user:pass@tracker.example/campaign" },
    { TDS_TARGET_URL: "https://tracker.example/campaign#fragment" },
    { TDS_TARGET_URL: "https://foreign.example/campaign" },
    { TDS_ALLOWED_TARGET_HOSTS: "" },
    { TDS_CORRELATION_PARAM: "redirect" },
    { TDS_CORRELATION_PARAM: "sub_id_7" },
  ])("fails to the normal site for invalid configuration: %o", (override) => {
    expect(
      buildCampaignRedirect(
        enabledConfig(override),
        { gclid: "123abc" },
        correlationId,
      ),
    ).toBeNull();
  });
});
