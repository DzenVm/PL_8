export const triggerParameterNames = ["gclid", "gbraid", "wbraid"] as const;

export const forwardedParameterNames = [
  ...triggerParameterNames,
  "gad_source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type TriggerParameterName = (typeof triggerParameterNames)[number];
export type ForwardedParameterName = (typeof forwardedParameterNames)[number];
export type TrackingParameters = Partial<Record<ForwardedParameterName, string>>;

export type TdsConfig = {
  enabled: boolean;
  targetUrl: string | null;
  allowedTargetHosts: ReadonlySet<string>;
  correlationParameter: string;
  decisionUrl: string | null;
  sharedSecret: string | null;
  keyId: string | null;
  siteId: string | null;
  cloudflareProxyToken: string | null;
  timeoutMs: number;
  errorFallback: "site" | "target";
  configurationError: string | null;
  decisionConfigurationError: string | null;
};

export type TdsClientContext = {
  ip: string;
  host: string;
  user_agent: string;
  accept: string;
  accept_language: string;
  referer: string;
  headers: Record<string, string>;
};

export type TdsDecisionRequest = {
  schema_version: 1;
  site_id: string;
  correlation_id: string;
  occurred_at: string;
  path: "/";
  tracking: TrackingParameters;
  client: TdsClientContext;
};

export type TdsDecisionResponse = {
  schema_version: 1;
  decision: "allow" | "deny" | "error";
  correlation_id: string;
  target?: string;
  reason: string;
  latency_ms?: number;
};
