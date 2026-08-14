import { createHash, createHmac, randomUUID } from "node:crypto";
import type {
  TdsClientContext,
  TdsConfig,
  TdsDecisionRequest,
  TdsDecisionResponse,
  TrackingParameters,
} from "./types";

export type TdsDecisionOutcome =
  | { kind: "allow"; target: string; reason: string; latencyMs: number | null }
  | { kind: "deny"; reason: string; latencyMs: number | null }
  | { kind: "error"; reason: string };

function base64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export function canonicalSignatureInput(
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

function safeReason(value: unknown) {
  return typeof value === "string" && /^[a-z0-9_]{1,64}$/.test(value)
    ? value
    : "invalid_response";
}

function safeLatency(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 60_000
    ? Number(value)
    : null;
}

function allowedTarget(config: TdsConfig, value: unknown) {
  if (typeof value !== "string" || value.length > 8_192) return null;
  try {
    const target = new URL(value);
    if (
      target.protocol !== "https:" ||
      target.username ||
      target.password ||
      target.hash ||
      (target.port && target.port !== "443") ||
      !config.allowedTargetHosts.has(target.hostname.toLowerCase())
    ) {
      return null;
    }
    return target.toString();
  } catch {
    return null;
  }
}

export async function requestTdsDecision(
  config: TdsConfig,
  tracking: TrackingParameters,
  client: TdsClientContext,
  correlationId: string,
): Promise<TdsDecisionOutcome> {
  if (
    !config.decisionUrl ||
    !config.sharedSecret ||
    !config.keyId ||
    !config.siteId
  ) {
    return { kind: "error", reason: "decision_not_configured" };
  }

  try {
    const endpoint = new URL(config.decisionUrl);
    const timestamp = Math.floor(Date.now() / 1_000).toString();
    const nonce = randomUUID();
    const decisionRequest: TdsDecisionRequest = {
      schema_version: 1,
      site_id: config.siteId,
      correlation_id: correlationId,
      occurred_at: new Date().toISOString(),
      path: "/",
      tracking,
      client,
    };
    const body = JSON.stringify(decisionRequest);
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

    if (response.status !== 200) {
      return { kind: "error", reason: `decision_http_${response.status}` };
    }

    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { kind: "error", reason: "decision_invalid_json" };
    }
    const decision = raw as Partial<TdsDecisionResponse>;
    if (
      decision.schema_version !== 1 ||
      decision.correlation_id !== correlationId
    ) {
      return { kind: "error", reason: "decision_invalid_correlation" };
    }

    const reason = safeReason(decision.reason);
    const latencyMs = safeLatency(decision.latency_ms);
    if (decision.decision === "deny") {
      return { kind: "deny", reason, latencyMs };
    }
    if (decision.decision === "allow") {
      const target = allowedTarget(config, decision.target);
      return target
        ? { kind: "allow", target, reason, latencyMs }
        : { kind: "error", reason: "decision_invalid_target" };
    }
    return { kind: "error", reason: "decision_invalid_enum" };
  } catch (error) {
    return {
      kind: "error",
      reason: error instanceof DOMException && error.name === "TimeoutError"
        ? "decision_timeout"
        : "decision_network_error",
    };
  }
}
