import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const endpoint = new URL(
  process.env.PL8_LIVE_ENDPOINT ??
    "https://api.studiadesi.site/v4/index.php",
);
const secretFile = process.env.PL8_LIVE_SECRET_FILE;
const siteId = process.env.TDS_LIVE_SITE_ID ?? "PL_8";
const keyId = process.env.TDS_LIVE_KEY_ID ?? "pl8-v1";

if (!secretFile) throw new Error("PL8_LIVE_SECRET_FILE is required");

const secret = (await readFile(secretFile, "utf8")).replace(/[\r\n]+$/, "");
const timeoutMs = 5_000;
const correlationId = randomUUID();
const nonce = randomUUID();
const timestamp = Math.floor(Date.now() / 1000).toString();
const marker = `pl8-live-smoke-${Date.now()}`;
const body = JSON.stringify({
  schema_version: 1,
  site_id: siteId,
  correlation_id: correlationId,
  occurred_at: new Date().toISOString(),
  path: "/",
  tracking: { gclid: marker, utm_source: "controlled-smoke" },
  client: {
    ip: process.env.PL8_LIVE_CLIENT_IP ?? "203.0.113.10",
    host: process.env.PL8_LIVE_CLIENT_HOST ?? "studiadesi.site",
    user_agent: "PL8 controlled server-side smoke test",
    accept: "application/json",
    accept_language: "en",
    referer: "",
  },
});
const bodyHash = createHash("sha256").update(body).digest("hex");
const canonical = [
  "v1",
  "POST",
  endpoint.host.toLowerCase(),
  endpoint.pathname,
  timestamp,
  nonce,
  correlationId,
  bodyHash,
].join("\n");
const signature = createHmac("sha256", secret)
  .update(canonical)
  .digest("base64url");
const headers = {
  "Content-Type": "application/json",
  "X-TDS-Key-Id": keyId,
  "X-TDS-Timestamp": timestamp,
  "X-TDS-Nonce": nonce,
  "X-Correlation-ID": correlationId,
  "X-TDS-Signature": `v1=${signature}`,
};

const signed = await fetch(endpoint, {
  method: "POST",
  headers,
  body,
  redirect: "manual",
  signal: AbortSignal.timeout(timeoutMs),
});
const replay = await fetch(endpoint, {
  method: "POST",
  headers,
  body,
  redirect: "manual",
  signal: AbortSignal.timeout(timeoutMs),
});
const unsigned = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
  redirect: "manual",
  signal: AbortSignal.timeout(timeoutMs),
});
const method = await fetch(endpoint, {
  method: "GET",
  redirect: "manual",
  signal: AbortSignal.timeout(timeoutMs),
});

const result = {
  signed: signed.status,
  replay: replay.status,
  unsigned: unsigned.status,
  method: method.status,
  signed_body: await signed.text(),
  correlation_id: correlationId,
  marker,
};

console.log(JSON.stringify(result));

if (
  result.signed !== 200 ||
  result.replay !== 409 ||
  result.unsigned !== 401 ||
  result.method !== 405 ||
  !result.signed_body.includes(`\"correlation_id\":\"${correlationId}\"`)
) {
  process.exitCode = 1;
}
