import { createHash, createHmac, randomUUID } from "node:crypto";
import type { TdsConfig, TdsEvent, TrackingParameters } from "./types";

function base64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function canonicalSignatureInput(
  endpoint: URL,
  timestamp: string,
  nonce: string,
  correlationId: string,
  body: string,
) {
  const bodyHash = createHash("sha256").update(body).digest("hex");
  return [
    "v1",
    "POST",
    endpoint.host.toLowerCase(),
    endpoint.pathname,
    timestamp,
    nonce,
    correlationId,
    bodyHash,
  ].join("\n");
}

export async function sendTdsEvent(
  config: TdsConfig,
  tracking: TrackingParameters,
  correlationId: string,
) {
  if (
    !config.eventUrl ||
    !config.sharedSecret ||
    !config.keyId ||
    !config.siteId
  ) return;

  try {
    const endpoint = new URL(config.eventUrl);
    const timestamp = Math.floor(Date.now() / 1_000).toString();
    const nonce = randomUUID();
    const event: TdsEvent = {
      schema_version: 1,
      site_id: config.siteId,
      correlation_id: correlationId,
      occurred_at: new Date().toISOString(),
      path: "/",
      tracking,
    };
    const body = JSON.stringify(event);
    const signature = base64Url(
      createHmac("sha256", config.sharedSecret)
        .update(
          canonicalSignatureInput(
            endpoint,
            timestamp,
            nonce,
            correlationId,
            body,
          ),
        )
        .digest(),
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TDS-Key-Id": config.keyId,
        "X-TDS-Timestamp": timestamp,
        "X-TDS-Nonce": nonce,
        "X-Correlation-ID": correlationId,
        "X-TDS-Signature": `v1=${signature}`,
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      console.warn(
        JSON.stringify({
          event: "tds_event_failed",
          correlation_id: correlationId,
          status: response.status,
        }),
      );
    }
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "tds_event_failed",
        correlation_id: correlationId,
        error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      }),
    );
  }
}
