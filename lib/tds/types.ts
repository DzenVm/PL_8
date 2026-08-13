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
  eventUrl: string | null;
  sharedSecret: string | null;
  keyId: string | null;
  siteId: string | null;
  timeoutMs: number;
  configurationError: string | null;
  eventConfigurationError: string | null;
};

export type TdsEvent = {
  schema_version: 1;
  site_id: string;
  correlation_id: string;
  occurred_at: string;
  path: "/";
  tracking: TrackingParameters;
};
