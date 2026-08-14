# Shared signed TDS decision endpoint

This PHP 8.0+ service is one server-to-server decision endpoint for many sites. A valid ad click flows from the site's Vercel Proxy to this endpoint and then to Palladium. Palladium's `allow` or `deny` decision is returned to the site; the browser never receives Server B or Palladium credentials.

One endpoint can serve PL_8 and later sites. Each site has a unique `site_id`, `key_id`, and HMAC key. The endpoint has no CORS support, browser token, JavaScript probe, crawler-name branch, fabricated browser headers, or arbitrary redirect target. TLS verification is mandatory and Palladium targets are restricted to configured HTTPS hosts.

## Request and decision

Only `POST application/json` is accepted. The signed body contains:

```json
{
  "schema_version": 1,
  "site_id": "PL_8",
  "correlation_id": "11111111-2222-4333-8444-555555555555",
  "occurred_at": "2027-01-15T08:00:00.000Z",
  "path": "/",
  "tracking": { "gclid": "example-click-id", "utm_source": "google" },
  "client": {
    "ip": "203.0.113.10",
    "host": "studiadesi.site",
    "user_agent": "Mozilla/5.0 ...",
    "accept": "text/html,...",
    "accept_language": "uk-UA,...",
    "referer": "https://www.google.com/"
  }
}
```

The client context must come from the original request. Server B must not invent or normalize it to look like another browser. Allowed tracking keys are `gclid`, `gbraid`, `wbraid`, `gad_source`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`; at least one of the first three is required.

Required authentication headers are `X-TDS-Key-Id`, `X-TDS-Timestamp`, `X-TDS-Nonce`, `X-Correlation-ID`, and `X-TDS-Signature`. The signature is `v1=` plus an unpadded base64url HMAC-SHA256 of:

```text
v1
POST
<lowercase endpoint host>
<endpoint path>
<timestamp>
<nonce>
<correlation_id>
<lowercase SHA-256 hex of exact raw body>
```

Palladium decisions return HTTP 200 with `Cache-Control: no-store`:

```json
{
  "schema_version": 1,
  "decision": "allow",
  "correlation_id": "11111111-2222-4333-8444-555555555555",
  "target": "https://dzentds.top/current-campaign",
  "reason": "palladium_allowed",
  "latency_ms": 125
}
```

`deny` has no target. Palladium network errors, timeouts, invalid responses, or invalid targets return HTTP 502 with decision `error`. Vercel owns the explicit technical-error fallback policy. Authentication/schema errors use 400/401/409/413/415; storage errors use 503.

## Multisite runtime

`TDS_TELEMETRY_CONFIG_FILE` points to one JSON file outside the web root. It contains the site registry, shared storage, and one Palladium account:

```json
{
  "clients": [
    {
      "site_id": "PL_8",
      "key_id": "pl8-v1",
      "hmac_secret_file": "/home/account/service/private/clients/pl8-v1.key"
    }
  ],
  "endpoint_url": "https://api.example.test/v4/index.php",
  "nonce_store_dir": "/home/account/service/private/nonces",
  "event_log_dir": "/home/account/service/private/events",
  "log_hmac_key_file": "/home/account/service/private/log-hmac.key",
  "log_retention_days": 30,
  "max_clock_skew_seconds": 60,
  "max_body_bytes": 8192,
  "palladium": {
    "url": "https://rbl.palladium.expert",
    "client_id_file": "/home/account/service/private/palladium-client-id",
    "client_company_file": "/home/account/service/private/palladium-client-company",
    "client_secret_file": "/home/account/service/private/palladium-client-secret",
    "allowed_target_hosts": ["dzentds.top"],
    "connect_timeout_ms": 350,
    "timeout_ms": 800
  }
}
```

All key and Palladium credential files must be regular `0600` files outside the web root. TLS verification stays enabled. The configured Palladium URL and returned target must both be HTTPS; no redirects are followed.

Adding a site does not create another Server B endpoint, Palladium copy, or retention task:

1. Generate one request HMAC key for the site.
2. Add its `site_id`, `key_id`, and key-file path to the shared registry atomically.
3. Validate the full config with PHP 8.4.
4. Add the matching server-only values to that site's Vercel project.
5. Verify the complete path in Preview before enabling production.

## Retention

Daily UTC JSONL logs contain a correlation ID, timestamps/path, readable allowed campaign parameters, and keyed hashes of click IDs. They do not contain raw click IDs, IP addresses, user agents, or Palladium credentials. One scheduled cleanup covers every site using this endpoint:

```cron
17 3 * * * TDS_TELEMETRY_CONFIG_FILE=/home/dzenmedv/api.studiadesi.site/private/runtime.json /usr/local/php84/bin/php /home/dzenmedv/api.studiadesi.site/app/current/bin/prune-logs.php >>/home/dzenmedv/api.studiadesi.site/private/retention-cron.log 2>&1
```

The cleanup keeps 30 days by default, ignores unrelated files and symlinks, and must be monitored. It is one task for the shared endpoint, not one task per domain.

## Deployment checks

Use the host's explicit PHP 8.4 binary:

```sh
/usr/local/php84/bin/php tests/self-test.php
TDS_TELEMETRY_CONFIG_FILE=/home/dzenmedv/api.studiadesi.site/private/runtime.json /usr/local/php84/bin/php bin/validate-config.php
```

Deploy code as a versioned release outside `/www`; only `www/v4/index.php` is public. Update credential files and `runtime.json` by atomic replacement. Then verify a signed request returns a 200 decision, a replay returns 409, an unsigned request returns 401, and Palladium records the same controlled click.

For the one-time PL_8 migration only, `deploy/import-legacy-palladium.php` can read the three Palladium constants from the retired PHP implementation and atomically install them as private `0600` files. It never prints their values. Remove the temporary legacy source immediately after a successful import.
