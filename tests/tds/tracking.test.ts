import { describe, expect, it } from "vitest";
import { extractTrackingParameters } from "../../lib/tds/tracking";

describe("extractTrackingParameters", () => {
  it.each(["gclid", "gbraid", "wbraid"])(
    "starts routing for a valid %s",
    (name) => {
      const parameters = new URLSearchParams({
        [name]: "123abc",
        utm_source: "google",
      });

      expect(extractTrackingParameters(parameters)).toEqual({
        [name]: "123abc",
        utm_source: "google",
      });
    },
  );

  it("does not start routing for UTM parameters alone", () => {
    expect(
      extractTrackingParameters(
        new URLSearchParams({ utm_source: "google", utm_campaign: "test" }),
      ),
    ).toBeNull();
  });

  it("does not accept case variants as click identifiers", () => {
    expect(
      extractTrackingParameters(new URLSearchParams({ GCLID: "123abc" })),
    ).toBeNull();
  });

  it.each([
    new URLSearchParams("gclid="),
    new URLSearchParams({ gclid: "x".repeat(513) }),
    new URLSearchParams("gclid=one&gclid=two"),
    new URLSearchParams({ gclid: "bad\u0000value" }),
  ])("rejects malformed or ambiguous click identifiers", (parameters) => {
    expect(extractTrackingParameters(parameters)).toBeNull();
  });

  it("keeps a valid identifier when another identifier is malformed", () => {
    expect(
      extractTrackingParameters(
        new URLSearchParams({ gclid: "", wbraid: "valid-wbraid" }),
      ),
    ).toEqual({ wbraid: "valid-wbraid" });
  });

  it("drops malformed optional fields without dropping the click", () => {
    expect(
      extractTrackingParameters(
        new URLSearchParams("gclid=123abc&utm_source=&utm_campaign=a&utm_campaign=b"),
      ),
    ).toEqual({ gclid: "123abc" });
  });

  it("uses UTF-8 byte limits compatible with PHP", () => {
    expect(
      extractTrackingParameters(
        new URLSearchParams({
          gclid: "123abc",
          utm_campaign: "ą".repeat(128),
        }),
      ),
    ).toEqual({ gclid: "123abc", utm_campaign: "ą".repeat(128) });

    expect(
      extractTrackingParameters(
        new URLSearchParams({
          gclid: "123abc",
          utm_campaign: "ą".repeat(129),
        }),
      ),
    ).toEqual({ gclid: "123abc" });
  });

  it("forwards only explicitly allowed tracking fields", () => {
    const parameters = new URLSearchParams({
      gclid: "123abc",
      redirect: "https://attacker.example",
      url: "https://attacker.example",
      sub_id_6: "attacker-value",
      arbitrary: "discard-me",
    });

    expect(extractTrackingParameters(parameters)).toEqual({ gclid: "123abc" });
  });
});
