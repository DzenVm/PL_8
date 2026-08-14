<?php

declare(strict_types=1);

namespace PL8\Telemetry;

use DateTimeImmutable;
use DateTimeZone;
use JsonException;
use RuntimeException;
use Throwable;

final class ConfigException extends RuntimeException
{
}

final class StorageException extends RuntimeException
{
}

final class UpstreamException extends RuntimeException
{
}

final class PalladiumConfig
{
    /** @param list<string> $allowedTargetHosts */
    public function __construct(
        public string $url,
        public string $clientId,
        public string $clientCompany,
        public string $clientSecret,
        public array $allowedTargetHosts,
        public int $connectTimeoutMs = 350,
        public int $timeoutMs = 800,
    ) {
        $parts = parse_url($this->url);
        if (
            $parts === false
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || !isset($parts['host'])
            || $parts['host'] === ''
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])
            || (isset($parts['port']) && $parts['port'] !== 443)
        ) {
            throw new ConfigException('The Palladium URL must be one HTTPS URL without credentials, query, or fragment.');
        }
        foreach (['client ID' => $this->clientId, 'client company' => $this->clientCompany, 'client secret' => $this->clientSecret] as $label => $value) {
            if ($value === '' || strlen($value) > 4096 || preg_match('/[\x00-\x1f\x7f]/', $value) === 1) {
                throw new ConfigException(sprintf('The Palladium %s is invalid.', $label));
            }
        }
        if ($this->allowedTargetHosts === [] || count($this->allowedTargetHosts) > 100) {
            throw new ConfigException('Configure between 1 and 100 Palladium target hosts.');
        }
        $normalizedHosts = [];
        foreach ($this->allowedTargetHosts as $host) {
            $normalized = strtolower(trim($host));
            if (
                $normalized === ''
                || strlen($normalized) > 253
                || filter_var($normalized, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false
            ) {
                throw new ConfigException('A Palladium target host is invalid.');
            }
            $normalizedHosts[$normalized] = true;
        }
        $this->allowedTargetHosts = array_keys($normalizedHosts);
        if ($this->connectTimeoutMs < 100 || $this->connectTimeoutMs > 1500) {
            throw new ConfigException('The Palladium connect timeout must be between 100 and 1500 milliseconds.');
        }
        if ($this->timeoutMs < $this->connectTimeoutMs || $this->timeoutMs > 2000) {
            throw new ConfigException('The Palladium timeout must be at least the connect timeout and at most 2000 milliseconds.');
        }
    }
}

final class DecisionResult
{
    public function __construct(
        public string $decision,
        public ?string $target,
        public string $reason,
        public int $latencyMs,
    ) {
        if (!in_array($this->decision, ['allow', 'deny'], true)) {
            throw new RuntimeException('The decision is invalid.');
        }
    }
}

interface DecisionProvider
{
    /** @param array<string, mixed> $event */
    public function decide(array $event): DecisionResult;
}

final class ClientConfig
{
    public function __construct(
        public string $siteId,
        public string $keyId,
        public string $hmacSecret,
    ) {
        if (preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/D', $this->siteId) !== 1) {
            throw new ConfigException('The site ID is invalid.');
        }
        if (preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/D', $this->keyId) !== 1) {
            throw new ConfigException('The key ID is invalid.');
        }
        Config::assertKey($this->hmacSecret, 'request HMAC key');
    }
}

final class Config
{
    public const SIGNATURE_VERSION = 'v1';

    public string $canonicalHost;
    public string $canonicalPath;

    /** @var array<string, ClientConfig> */
    private array $clientsByKeyId = [];

    /**
     * @param list<ClientConfig> $clients
     */
    public function __construct(
        public array $clients,
        public string $endpointUrl,
        public string $nonceStoreDir,
        public ?string $eventLogDir = null,
        public ?string $logHmacKey = null,
        public int $logRetentionDays = 30,
        public int $maxClockSkewSeconds = 60,
        public int $maxBodyBytes = 4096,
        public ?PalladiumConfig $palladium = null,
    ) {
        if ($this->clients === [] || count($this->clients) > 1000) {
            throw new ConfigException('Configure between 1 and 1000 telemetry clients.');
        }

        $siteIds = [];
        foreach ($this->clients as $client) {
            if (!$client instanceof ClientConfig) {
                throw new ConfigException('Every telemetry client must be a ClientConfig.');
            }
            if (isset($this->clientsByKeyId[$client->keyId]) || isset($siteIds[$client->siteId])) {
                throw new ConfigException('Client site IDs and key IDs must be unique.');
            }
            $this->clientsByKeyId[$client->keyId] = $client;
            $siteIds[$client->siteId] = true;
        }

        [$this->canonicalHost, $this->canonicalPath] = self::parseEndpointUrl($this->endpointUrl);

        if ($this->maxClockSkewSeconds < 15 || $this->maxClockSkewSeconds > 300) {
            throw new ConfigException('The maximum clock skew must be between 15 and 300 seconds.');
        }
        if ($this->maxBodyBytes < 1024 || $this->maxBodyBytes > 16384) {
            throw new ConfigException('The maximum body size must be between 1024 and 16384 bytes.');
        }

        $resolvedNonceDir = realpath($this->nonceStoreDir);
        if ($resolvedNonceDir === false || !is_dir($resolvedNonceDir) || !is_writable($resolvedNonceDir)) {
            throw new ConfigException('The nonce store directory must exist and be writable.');
        }
        $this->nonceStoreDir = $resolvedNonceDir;

        if ($this->logRetentionDays < 1 || $this->logRetentionDays > 90) {
            throw new ConfigException('The log retention must be between 1 and 90 days.');
        }
        if (($this->eventLogDir === null) !== ($this->logHmacKey === null)) {
            throw new ConfigException('The event log directory and separate log HMAC key must be configured together.');
        }

        if ($this->eventLogDir !== null && $this->logHmacKey !== null) {
            self::assertKey($this->logHmacKey, 'log HMAC key');
            foreach ($this->clients as $client) {
                if (hash_equals($client->hmacSecret, $this->logHmacKey)) {
                    throw new ConfigException('Request and log HMAC keys must be different.');
                }
            }

            $resolvedLogDir = realpath($this->eventLogDir);
            if ($resolvedLogDir === false || !is_dir($resolvedLogDir) || !is_writable($resolvedLogDir)) {
                throw new ConfigException('The event log directory must exist and be writable.');
            }
            $this->eventLogDir = $resolvedLogDir;
        }
    }

    public function clientForKeyId(string $keyId): ?ClientConfig
    {
        return $this->clientsByKeyId[$keyId] ?? null;
    }

    /**
     * Load one shared JSON config and its per-site key files outside the public root.
     */
    public static function fromEnvironment(string $publicRoot): self
    {
        $configFile = self::env('TDS_TELEMETRY_CONFIG_FILE') ?? self::env('PL8_TDS_CONFIG_FILE');
        if ($configFile === null) {
            throw new ConfigException('The telemetry config file is required.');
        }

        $resolvedConfigFile = self::resolvedExternalFile($configFile, $publicRoot, 'config', false);
        $rawConfig = file_get_contents($resolvedConfigFile);
        if ($rawConfig === false) {
            throw new ConfigException('The config file could not be read.');
        }

        try {
            $config = json_decode($rawConfig, true, 12, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new ConfigException('The config file is not valid JSON.', 0, $exception);
        }

        if (!is_array($config) || self::isList($config)) {
            throw new ConfigException('The config file must contain a JSON object.');
        }

        $allowedKeys = [
            'clients',
            'key_id',
            'hmac_secret',
            'hmac_secret_file',
            'endpoint_url',
            'nonce_store_dir',
            'event_log_dir',
            'log_hmac_key',
            'log_hmac_key_file',
            'log_retention_days',
            'max_clock_skew_seconds',
            'max_body_bytes',
            'palladium',
        ];
        if (array_diff(array_keys($config), $allowedKeys) !== []) {
            throw new ConfigException('The config file contains unsupported keys.');
        }

        $mapping = [
            'TDS_TELEMETRY_ENDPOINT_URL' => 'endpoint_url',
            'TDS_TELEMETRY_NONCE_STORE_DIR' => 'nonce_store_dir',
            'TDS_TELEMETRY_EVENT_LOG_DIR' => 'event_log_dir',
            'TDS_TELEMETRY_LOG_HMAC_KEY' => 'log_hmac_key',
            'TDS_TELEMETRY_LOG_HMAC_KEY_FILE' => 'log_hmac_key_file',
            'TDS_TELEMETRY_LOG_RETENTION_DAYS' => 'log_retention_days',
            'TDS_TELEMETRY_MAX_CLOCK_SKEW_SECONDS' => 'max_clock_skew_seconds',
            'TDS_TELEMETRY_MAX_BODY_BYTES' => 'max_body_bytes',
        ];
        foreach ($mapping as $environmentName => $configName) {
            $value = self::env($environmentName);
            if ($value !== null) {
                $config[$configName] = $value;
            }
        }

        $hasClientRegistry = array_key_exists('clients', $config);
        $hasLegacyClient = array_key_exists('key_id', $config)
            || array_key_exists('hmac_secret', $config)
            || array_key_exists('hmac_secret_file', $config);
        if ($hasClientRegistry && $hasLegacyClient) {
            throw new ConfigException('Do not mix the client registry with legacy single-site keys.');
        }

        // Transitional support lets the first multisite code deployment preserve
        // the already-live PL_8 runtime file. The file is then migrated atomically.
        $rawClients = $config['clients'] ?? ($hasLegacyClient ? [[
            'site_id' => 'PL_8',
            'key_id' => $config['key_id'] ?? null,
            'hmac_secret' => $config['hmac_secret'] ?? null,
            'hmac_secret_file' => $config['hmac_secret_file'] ?? null,
        ]] : null);
        if (!is_array($rawClients) || !self::isList($rawClients) || $rawClients === []) {
            throw new ConfigException('Config key "clients" must be a nonempty array.');
        }

        $clients = [];
        foreach ($rawClients as $rawClient) {
            if (!is_array($rawClient) || self::isList($rawClient)) {
                throw new ConfigException('Every client config must be an object.');
            }
            $clientKeys = ['site_id', 'key_id', 'hmac_secret', 'hmac_secret_file'];
            if (array_diff(array_keys($rawClient), $clientKeys) !== []) {
                throw new ConfigException('A client config contains unsupported keys.');
            }
            $rawClient = array_filter($rawClient, static fn (mixed $value): bool => $value !== null);
            $secret = self::loadKey($rawClient, 'hmac_secret', 'hmac_secret_file', $publicRoot, true);
            $clients[] = new ClientConfig(
                self::requiredString($rawClient, 'site_id'),
                self::requiredString($rawClient, 'key_id'),
                $secret ?? '',
            );
        }

        $logDir = self::optionalString($config, 'event_log_dir');
        $logKey = self::loadKey($config, 'log_hmac_key', 'log_hmac_key_file', $publicRoot, false);
        $resolvedNonceDir = self::resolvedExternalDirectory(
            self::requiredString($config, 'nonce_store_dir'),
            $publicRoot,
            'nonce store',
        );
        $resolvedLogDir = $logDir === null
            ? null
            : self::resolvedExternalDirectory($logDir, $publicRoot, 'event log');

        $palladium = null;
        if (array_key_exists('palladium', $config)) {
            $rawPalladium = $config['palladium'];
            if (!is_array($rawPalladium) || self::isList($rawPalladium)) {
                throw new ConfigException('Config key "palladium" must be an object.');
            }
            $palladiumKeys = [
                'url',
                'client_id',
                'client_id_file',
                'client_company',
                'client_company_file',
                'client_secret',
                'client_secret_file',
                'allowed_target_hosts',
                'connect_timeout_ms',
                'timeout_ms',
            ];
            if (array_diff(array_keys($rawPalladium), $palladiumKeys) !== []) {
                throw new ConfigException('The Palladium config contains unsupported keys.');
            }
            $targetHosts = $rawPalladium['allowed_target_hosts'] ?? null;
            if (!is_array($targetHosts) || !self::isList($targetHosts)) {
                throw new ConfigException('Palladium allowed target hosts must be an array.');
            }
            $palladium = new PalladiumConfig(
                self::requiredString($rawPalladium, 'url'),
                self::loadCredential($rawPalladium, 'client_id', 'client_id_file', $publicRoot),
                self::loadCredential($rawPalladium, 'client_company', 'client_company_file', $publicRoot),
                self::loadCredential($rawPalladium, 'client_secret', 'client_secret_file', $publicRoot),
                array_values(array_map(static fn (mixed $host): string => is_string($host) ? $host : '', $targetHosts)),
                self::integer($rawPalladium, 'connect_timeout_ms', 350),
                self::integer($rawPalladium, 'timeout_ms', 800),
            );
        }

        return new self(
            $clients,
            self::requiredString($config, 'endpoint_url'),
            $resolvedNonceDir,
            $resolvedLogDir,
            $logKey,
            self::integer($config, 'log_retention_days', 30),
            self::integer($config, 'max_clock_skew_seconds', 60),
            self::integer($config, 'max_body_bytes', 4096),
            $palladium,
        );
    }

    public static function assertKey(string $key, string $label): void
    {
        if (strlen($key) < 32 || strlen($key) > 4096) {
            throw new ConfigException(sprintf('The %s must contain between 32 and 4096 bytes.', $label));
        }
    }

    /** @return array{string, string} */
    private static function parseEndpointUrl(string $url): array
    {
        if ($url === '' || preg_match('/[\x00-\x20\x7f]/', $url) === 1) {
            throw new ConfigException('The endpoint URL is invalid.');
        }

        $parts = parse_url($url);
        if (
            $parts === false
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || !isset($parts['host'])
            || $parts['host'] === ''
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])
            || (isset($parts['port']) && $parts['port'] !== 443)
        ) {
            throw new ConfigException('The endpoint must be one HTTPS URL on port 443 without credentials, query, or fragment.');
        }

        $host = strtolower($parts['host']);

        $path = $parts['path'] ?? '/';
        if ($path === '' || $path[0] !== '/') {
            throw new ConfigException('The endpoint path is invalid.');
        }

        return [$host, $path];
    }

    private static function env(string $name): ?string
    {
        $value = getenv($name);
        return $value === false || $value === '' ? null : $value;
    }

    /** @param array<string, mixed> $config */
    private static function optionalString(array $config, string $key): ?string
    {
        if (!array_key_exists($key, $config) || $config[$key] === '') {
            return null;
        }

        if (!is_string($config[$key])) {
            throw new ConfigException(sprintf('Config key "%s" must be a string.', $key));
        }

        return $config[$key];
    }

    /** @param array<string, mixed> $config */
    private static function requiredString(array $config, string $key): string
    {
        $value = self::optionalString($config, $key);
        if ($value === null) {
            throw new ConfigException(sprintf('Config key "%s" is required.', $key));
        }

        return $value;
    }

    /** @param array<string, mixed> $config */
    private static function integer(array $config, string $key, int $default): int
    {
        if (!array_key_exists($key, $config) || $config[$key] === '') {
            return $default;
        }

        $value = filter_var($config[$key], FILTER_VALIDATE_INT);
        if ($value === false) {
            throw new ConfigException(sprintf('Config key "%s" must be an integer.', $key));
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $config
     */
    private static function loadKey(
        array $config,
        string $inlineName,
        string $fileName,
        string $publicRoot,
        bool $required,
    ): ?string {
        $inline = self::optionalString($config, $inlineName);
        $file = self::optionalString($config, $fileName);

        if ($inline !== null && $file !== null) {
            throw new ConfigException(sprintf('Configure only one source for key "%s".', $inlineName));
        }
        if ($required && $inline === null && $file === null) {
            throw new ConfigException(sprintf('A source for key "%s" is required.', $inlineName));
        }
        if ($inline !== null) {
            return $inline;
        }
        if ($file === null) {
            return null;
        }

        $resolved = self::resolvedExternalFile($file, $publicRoot, $inlineName, false);
        $contents = file_get_contents($resolved);
        if ($contents === false) {
            throw new ConfigException(sprintf('Key file "%s" could not be read.', $inlineName));
        }

        return rtrim($contents, "\r\n");
    }

    /** @param array<string, mixed> $config */
    private static function loadCredential(
        array $config,
        string $inlineName,
        string $fileName,
        string $publicRoot,
    ): string {
        $inline = self::optionalString($config, $inlineName);
        $file = self::optionalString($config, $fileName);
        if (($inline === null) === ($file === null)) {
            throw new ConfigException(sprintf('Configure exactly one source for Palladium credential "%s".', $inlineName));
        }
        if ($inline !== null) {
            return $inline;
        }
        $resolved = self::resolvedExternalFile((string) $file, $publicRoot, $inlineName, false);
        $contents = file_get_contents($resolved);
        if ($contents === false) {
            throw new ConfigException(sprintf('Palladium credential "%s" could not be read.', $inlineName));
        }
        return rtrim($contents, "\r\n");
    }

    private static function resolvedExternalFile(
        string $path,
        string $publicRoot,
        string $label,
        bool $requireWritable,
    ): string {
        if (!str_starts_with($path, DIRECTORY_SEPARATOR)) {
            throw new ConfigException(sprintf('The %s file path must be absolute.', $label));
        }

        $resolved = realpath($path);
        if (
            $resolved === false
            || !is_file($resolved)
            || !is_readable($resolved)
            || ($requireWritable && !is_writable($resolved))
            || self::pathIsWithin($resolved, $publicRoot)
        ) {
            throw new ConfigException(sprintf('The %s file has unsafe permissions or location.', $label));
        }

        return $resolved;
    }

    private static function resolvedExternalDirectory(string $path, string $publicRoot, string $label): string
    {
        if (!str_starts_with($path, DIRECTORY_SEPARATOR)) {
            throw new ConfigException(sprintf('The %s directory path must be absolute.', $label));
        }

        $resolved = realpath($path);
        if (
            $resolved === false
            || !is_dir($resolved)
            || !is_writable($resolved)
            || self::pathIsWithin($resolved, $publicRoot)
        ) {
            throw new ConfigException(sprintf('The %s directory has unsafe permissions or location.', $label));
        }

        return $resolved;
    }

    private static function pathIsWithin(string $path, string $directory): bool
    {
        $resolvedDirectory = realpath($directory);
        $resolvedPath = realpath($path);
        if ($resolvedDirectory === false || $resolvedPath === false) {
            return false;
        }

        $prefix = rtrim($resolvedDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        return $resolvedPath === $resolvedDirectory || str_starts_with($resolvedPath, $prefix);
    }

    /** @param array<mixed> $value */
    private static function isList(array $value): bool
    {
        return $value === [] || array_keys($value) === range(0, count($value) - 1);
    }
}

final class HttpRequest
{
    /** @param array<string, string> $headers */
    public function __construct(
        public string $method,
        public string $host,
        public string $path,
        public array $headers,
        public string $body,
        public bool $bodyExceededLimit = false,
    ) {
    }

    public static function fromGlobals(int $maxBodyBytes): self
    {
        $contentLength = $_SERVER['CONTENT_LENGTH'] ?? null;
        $exceeded = is_string($contentLength)
            && preg_match('/^[0-9]+$/D', $contentLength) === 1
            && (int) $contentLength > $maxBodyBytes;

        $body = '';
        if (!$exceeded) {
            $readBody = file_get_contents('php://input', false, null, 0, $maxBodyBytes + 1);
            $body = $readBody === false ? '' : $readBody;
            $exceeded = strlen($body) > $maxBodyBytes;
        }

        $requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '');
        $uriParts = parse_url($requestUri);
        $path = is_array($uriParts) && !isset($uriParts['query']) && !isset($uriParts['fragment'])
            ? (string) ($uriParts['path'] ?? '')
            : '';

        return new self(
            (string) ($_SERVER['REQUEST_METHOD'] ?? ''),
            strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')),
            $path,
            self::headersFromGlobals(),
            $body,
            $exceeded,
        );
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    /** @return array<string, string> */
    private static function headersFromGlobals(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!is_string($value)) {
                continue;
            }

            if (str_starts_with($key, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($key, 5)))] = $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE']) && is_string($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        return $headers;
    }
}

final class HttpResponse
{
    /**
     * @param array<string, string> $headers
     * @param null|array<string, mixed> $payload
     */
    public function __construct(
        public int $status,
        public array $headers,
        public ?array $payload,
    ) {
    }

    public static function noContent(): self
    {
        return new self(204, self::securityHeaders(false), null);
    }

    /** @param array<string, mixed> $payload @param array<string, string> $additionalHeaders */
    public static function json(int $status, array $payload, array $additionalHeaders = []): self
    {
        return new self($status, array_merge(self::securityHeaders(true), $additionalHeaders), $payload);
    }

    public function emit(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value, true);
        }

        if ($this->payload === null) {
            return;
        }

        try {
            echo json_encode($this->payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
        } catch (JsonException) {
            echo '{"error":"response_encoding_error"}' . "\n";
        }
    }

    /** @return array<string, string> */
    private static function securityHeaders(bool $json): array
    {
        $headers = [
            'Cache-Control' => 'no-store, private, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
            'Referrer-Policy' => 'no-referrer',
            'X-Robots-Tag' => 'noindex, nofollow, nosnippet, noarchive',
        ];

        if ($json) {
            $headers['Content-Type'] = 'application/json; charset=utf-8';
        }

        return $headers;
    }
}

final class FileNonceStore
{
    public function __construct(
        private string $directory,
        private int $retentionSeconds,
    ) {
    }

    public function claim(string $keyId, string $nonce, int $timestamp): bool
    {
        $this->removeExpiredEntries($timestamp);
        $path = $this->directory . DIRECTORY_SEPARATOR . hash('sha256', $keyId . "\n" . $nonce) . '.nonce';
        $handle = @fopen($path, 'x');
        if ($handle === false) {
            if (is_file($path)) {
                return false;
            }
            throw new StorageException('The nonce store is unavailable.');
        }

        try {
            $value = (string) $timestamp;
            if (fwrite($handle, $value) !== strlen($value)) {
                throw new StorageException('The nonce could not be persisted.');
            }
        } finally {
            fclose($handle);
        }

        @chmod($path, 0600);
        return true;
    }

    private function removeExpiredEntries(int $now): void
    {
        if (random_int(1, 100) !== 1) {
            return;
        }

        $entries = glob($this->directory . DIRECTORY_SEPARATOR . '*.nonce');
        if ($entries === false) {
            return;
        }

        $cutoff = $now - $this->retentionSeconds;
        foreach (array_slice($entries, 0, 100) as $entry) {
            $storedAt = file_get_contents($entry);
            if (
                is_string($storedAt)
                && preg_match('/^[0-9]{10}$/D', $storedAt) === 1
                && (int) $storedAt < $cutoff
            ) {
                @unlink($entry);
            }
        }
    }
}

interface PalladiumTransport
{
    /**
     * @param array<string, mixed> $payload
     * @return array{status:int, body:string, latency_ms:int}
     */
    public function postForm(
        string $url,
        array $payload,
        int $connectTimeoutMs,
        int $timeoutMs,
    ): array;
}

final class CurlPalladiumTransport implements PalladiumTransport
{
    public function postForm(
        string $url,
        array $payload,
        int $connectTimeoutMs,
        int $timeoutMs,
    ): array {
        if (!function_exists('curl_init')) {
            throw new UpstreamException('The cURL extension is unavailable.');
        }

        $curl = curl_init($url);
        if ($curl === false) {
            throw new UpstreamException('The Palladium request could not be initialized.');
        }

        $startedAt = hrtime(true);
        try {
            if (!curl_setopt_array($curl, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($payload, '', '&', PHP_QUERY_RFC3986),
                CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
                CURLOPT_CONNECTTIMEOUT_MS => $connectTimeoutMs,
                CURLOPT_TIMEOUT_MS => $timeoutMs,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_MAXREDIRS => 0,
                CURLOPT_FORBID_REUSE => true,
                CURLOPT_NOSIGNAL => true,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            ])) {
                throw new UpstreamException('The Palladium request could not be configured.');
            }

            $body = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
            if (!is_string($body)) {
                throw new UpstreamException('The Palladium request failed.');
            }
            if (strlen($body) > 65536) {
                throw new UpstreamException('The Palladium response is too large.');
            }

            return [
                'status' => $status,
                'body' => $body,
                'latency_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
            ];
        } finally {
            curl_close($curl);
        }
    }
}

final class PalladiumDecisionProvider implements DecisionProvider
{
    private PalladiumTransport $transport;

    public function __construct(
        private PalladiumConfig $config,
        ?PalladiumTransport $transport = null,
    ) {
        $this->transport = $transport ?? new CurlPalladiumTransport();
    }

    public function decide(array $event): DecisionResult
    {
        /** @var array<string, string> $tracking */
        $tracking = $event['tracking'];
        /** @var array<string, string> $client */
        $client = $event['client'];
        $query = http_build_query($tracking, '', '&', PHP_QUERY_RFC3986);
        $requestUri = '/' . ($query === '' ? '' : '?' . $query);

        $server = [
            'REMOTE_ADDR' => $client['ip'],
            'REQUEST_METHOD' => 'GET',
            'REQUEST_SCHEME' => 'https',
            'SERVER_PROTOCOL' => 'HTTP/2',
            'SERVER_PORT' => '443',
            'REQUEST_URI' => $requestUri,
            'QUERY_STRING' => $query,
            'HTTP_HOST' => $client['host'],
            'HTTP_USER_AGENT' => $client['user_agent'],
            'bannerSource' => 'adwords',
        ];
        foreach ([
            'accept' => 'HTTP_ACCEPT',
            'accept_language' => 'HTTP_ACCEPT_LANGUAGE',
            'referer' => 'HTTP_REFERER',
        ] as $clientName => $serverName) {
            if (($client[$clientName] ?? '') !== '') {
                $server[$serverName] = $client[$clientName];
            }
        }

        $result = $this->transport->postForm(
            $this->config->url,
            [
                'request' => $tracking,
                'jsrequest' => [],
                'server' => $server,
                'auth' => [
                    'clientId' => $this->config->clientId,
                    'clientCompany' => $this->config->clientCompany,
                    'clientSecret' => $this->config->clientSecret,
                ],
            ],
            $this->config->connectTimeoutMs,
            $this->config->timeoutMs,
        );

        if ($result['status'] !== 200) {
            throw new UpstreamException('Palladium returned a non-200 response.');
        }
        try {
            $reply = json_decode($result['body'], true, 8, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new UpstreamException('Palladium returned invalid JSON.', 0, $exception);
        }
        if (!is_array($reply) || ($reply !== [] && array_keys($reply) === range(0, count($reply) - 1))) {
            throw new UpstreamException('Palladium returned an invalid response.');
        }
        if (($reply['result'] ?? null) === false) {
            return new DecisionResult('deny', null, 'palladium_denied', $result['latency_ms']);
        }
        if (($reply['result'] ?? null) !== true) {
            throw new UpstreamException('Palladium omitted its decision.');
        }

        $mode = filter_var($reply['mode'] ?? null, FILTER_VALIDATE_INT);
        $target = $reply['target'] ?? null;
        if (!in_array($mode, [1, 2, 3], true) || !is_string($target) || !$this->targetAllowed($target)) {
            throw new UpstreamException('Palladium returned an invalid target.');
        }

        return new DecisionResult('allow', $target, 'palladium_allowed', $result['latency_ms']);
    }

    private function targetAllowed(string $target): bool
    {
        if ($target === '' || strlen($target) > 8192 || preg_match('/[\x00-\x20\x7f]/', $target) === 1) {
            return false;
        }
        $parts = parse_url($target);
        return $parts !== false
            && strtolower((string) ($parts['scheme'] ?? '')) === 'https'
            && isset($parts['host'])
            && in_array(strtolower($parts['host']), $this->config->allowedTargetHosts, true)
            && !isset($parts['user'])
            && !isset($parts['pass'])
            && (!isset($parts['port']) || $parts['port'] === 443);
    }
}

final class PrivacySafeEventLogger
{
    private const CLICK_ID_FIELDS = ['gclid', 'gbraid', 'wbraid'];

    public function __construct(
        private ?string $eventLogDir,
        private ?string $logHmacKey,
        private int $retentionDays,
    ) {
    }

    /** @param array<string, mixed> $event */
    public function store(array $event, int $receivedAt): void
    {
        if ($this->eventLogDir === null || $this->logHmacKey === null) {
            return;
        }

        /** @var array<string, string> $tracking */
        $tracking = $event['tracking'];
        $safeTracking = [];
        foreach ($tracking as $name => $value) {
            if (in_array($name, self::CLICK_ID_FIELDS, true)) {
                $safeTracking[$name . '_hash'] = 'h1:' . self::base64Url(
                    hash_hmac('sha256', $event['site_id'] . "\n" . $value, $this->logHmacKey, true),
                );
            } else {
                $safeTracking[$name] = $value;
            }
        }

        $record = [
            'schema_version' => 1,
            'received_at' => gmdate('Y-m-d\TH:i:s\Z', $receivedAt),
            'site_id' => $event['site_id'],
            'correlation_id' => $event['correlation_id'],
            'occurred_at' => $event['occurred_at'],
            'path' => $event['path'],
            'tracking' => $safeTracking,
        ];

        try {
            $line = json_encode($record, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
        } catch (JsonException $exception) {
            throw new StorageException('The privacy-safe event could not be encoded.', 0, $exception);
        }

        $this->pruneExpired($receivedAt);
        $eventLogFile = $this->eventLogDir
            . DIRECTORY_SEPARATOR
            . 'tds-events-'
            . gmdate('Y-m-d', $receivedAt)
            . '.jsonl';

        if (is_link($eventLogFile)) {
            throw new StorageException('The event log path is unsafe.');
        }

        $handle = @fopen($eventLogFile, 'x+b');
        if ($handle === false) {
            if (!is_file($eventLogFile) || is_link($eventLogFile)) {
                throw new StorageException('The event log is unavailable.');
            }
            $handle = @fopen($eventLogFile, 'ab');
            if ($handle === false) {
                throw new StorageException('The event log is unavailable.');
            }
        }
        @chmod($eventLogFile, 0600);

        try {
            if (!flock($handle, LOCK_EX | LOCK_NB)) {
                throw new StorageException('The event log is busy.');
            }

            $written = 0;
            $length = strlen($line);
            while ($written < $length) {
                $result = fwrite($handle, substr($line, $written));
                if ($result === false || $result === 0) {
                    throw new StorageException('The event log write failed.');
                }
                $written += $result;
            }

            if (!fflush($handle)) {
                throw new StorageException('The event log flush failed.');
            }
        } finally {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private static function base64Url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    /**
     * Remove only expired shared-TDS daily JSONL files. This is public so the same
     * retention implementation can run from cron even when no events arrive.
     */
    public function pruneExpired(?int $now = null): void
    {
        $now ??= time();
        if ($this->eventLogDir === null) {
            return;
        }

        // Keep the current UTC calendar date and the preceding N-1 dates.
        $cutoff = gmdate('Y-m-d', $now - (($this->retentionDays - 1) * 86400));
        $entries = [];
        foreach (['tds-events-', 'pl8-events-'] as $prefix) {
            $matched = glob($this->eventLogDir . DIRECTORY_SEPARATOR . $prefix . '????-??-??.jsonl');
            if ($matched === false) {
                throw new StorageException('The event log directory could not be scanned.');
            }
            $entries = array_merge($entries, $matched);
        }

        foreach ($entries as $entry) {
            $basename = basename($entry);
            if (preg_match('/^(?:tds|pl8)-events-([0-9]{4}-[0-9]{2}-[0-9]{2})\.jsonl$/D', $basename, $matches) !== 1) {
                continue;
            }
            if (!is_file($entry) || is_link($entry)) {
                continue;
            }

            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $matches[1], new DateTimeZone('UTC'));
            if ($date === false || $date->format('Y-m-d') !== $matches[1] || $matches[1] >= $cutoff) {
                continue;
            }

            if (!@unlink($entry) && file_exists($entry)) {
                throw new StorageException('An expired event log could not be removed.');
            }
        }
    }
}

final class TelemetryEndpoint
{
    private const TELEMETRY_TOP_LEVEL_FIELDS = [
        'correlation_id',
        'occurred_at',
        'path',
        'schema_version',
        'site_id',
        'tracking',
    ];
    private const DECISION_TOP_LEVEL_FIELDS = [
        'client',
        'correlation_id',
        'occurred_at',
        'path',
        'schema_version',
        'site_id',
        'tracking',
    ];
    private const CLIENT_FIELDS = [
        'accept',
        'accept_language',
        'host',
        'ip',
        'referer',
        'user_agent',
    ];
    private const TRACKING_FIELDS = [
        'gclid',
        'gbraid',
        'wbraid',
        'gad_source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
    ];
    private const TRIGGER_FIELDS = ['gclid', 'gbraid', 'wbraid'];

    public function __construct(
        private Config $config,
        private FileNonceStore $nonceStore,
        private PrivacySafeEventLogger $eventLogger,
        private ?DecisionProvider $decisionProvider = null,
    ) {
    }

    public static function withConfig(Config $config): self
    {
        return new self(
            $config,
            new FileNonceStore($config->nonceStoreDir, max(600, $config->maxClockSkewSeconds * 4)),
            new PrivacySafeEventLogger($config->eventLogDir, $config->logHmacKey, $config->logRetentionDays),
            $config->palladium === null ? null : new PalladiumDecisionProvider($config->palladium),
        );
    }

    public function handle(HttpRequest $request, ?int $now = null): HttpResponse
    {
        $now ??= time();

        if ($request->method !== 'POST') {
            return self::error(405, 'method_not_allowed', ['Allow' => 'POST']);
        }
        if ($request->bodyExceededLimit) {
            return self::error(413, 'request_too_large');
        }

        $contentType = $request->header('content-type');
        if ($contentType === null || preg_match('/^application\/json(?:\s*;\s*charset=utf-8)?$/i', trim($contentType)) !== 1) {
            return self::error(415, 'unsupported_media_type');
        }
        if ($request->body === '') {
            return self::error(400, 'invalid_json');
        }

        $keyId = $request->header('x-tds-key-id');
        $timestampHeader = $request->header('x-tds-timestamp');
        $nonce = $request->header('x-tds-nonce');
        $correlationHeader = $request->header('x-correlation-id');
        $signatureHeader = $request->header('x-tds-signature');

        if (
            $keyId === null
            || $timestampHeader === null
            || $nonce === null
            || $correlationHeader === null
            || $signatureHeader === null
        ) {
            return self::error(401, 'authentication_failed');
        }

        $client = $this->config->clientForKeyId($keyId);
        if (
            $client === null
            || preg_match('/^[0-9]{10}$/D', $timestampHeader) !== 1
            || !self::isUuidV4($nonce)
            || !self::isUuid($correlationHeader)
            || preg_match('/^v1=[A-Za-z0-9_-]{43}$/D', $signatureHeader) !== 1
            || strtolower($request->host) !== $this->config->canonicalHost
            || $request->path !== $this->config->canonicalPath
        ) {
            return self::error(401, 'authentication_failed');
        }

        $timestamp = (int) $timestampHeader;
        if (abs($now - $timestamp) > $this->config->maxClockSkewSeconds) {
            return self::error(401, 'request_expired');
        }

        $bodyHash = hash('sha256', $request->body);
        $canonical = self::canonicalMessage(
            $this->config->canonicalHost,
            $this->config->canonicalPath,
            $timestampHeader,
            $nonce,
            $correlationHeader,
            $bodyHash,
        );
        $expectedSignature = 'v1=' . self::base64Url(
            hash_hmac('sha256', $canonical, $client->hmacSecret, true),
        );
        if (!hash_equals($expectedSignature, $signatureHeader)) {
            return self::error(401, 'authentication_failed');
        }

        try {
            $event = json_decode($request->body, true, 8, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return self::error(400, 'invalid_json');
        }

        $schemaError = self::validateEvent(
            $event,
            $correlationHeader,
            $client->siteId,
            $this->decisionProvider !== null,
        );
        if ($schemaError !== null) {
            return self::error(400, $schemaError);
        }

        try {
            if (!$this->nonceStore->claim($client->keyId, $nonce, $now)) {
                return self::error(409, 'replay_detected');
            }
            /** @var array<string, mixed> $event */
            $this->eventLogger->store($event, $now);
        } catch (Throwable) {
            return self::error(503, 'telemetry_store_unavailable');
        }

        if ($this->decisionProvider === null) {
            return HttpResponse::noContent();
        }

        try {
            /** @var array<string, mixed> $event */
            $decision = $this->decisionProvider->decide($event);
        } catch (Throwable) {
            return HttpResponse::json(502, [
                'schema_version' => 1,
                'decision' => 'error',
                'correlation_id' => $correlationHeader,
                'reason' => 'palladium_unavailable',
            ]);
        }

        $payload = [
            'schema_version' => 1,
            'decision' => $decision->decision,
            'correlation_id' => $correlationHeader,
            'reason' => $decision->reason,
            'latency_ms' => $decision->latencyMs,
        ];
        if ($decision->target !== null) {
            $payload['target'] = $decision->target;
        }
        return HttpResponse::json(200, $payload);
    }

    public static function canonicalMessage(
        string $host,
        string $path,
        string $timestamp,
        string $nonce,
        string $correlationId,
        string $bodyHash,
    ): string {
        return implode("\n", [
            Config::SIGNATURE_VERSION,
            'POST',
            strtolower($host),
            $path,
            $timestamp,
            $nonce,
            $correlationId,
            $bodyHash,
        ]);
    }

    private static function validateEvent(
        mixed $event,
        string $correlationHeader,
        string $expectedSiteId,
        bool $requireClient,
    ): ?string
    {
        if (!is_array($event) || self::isList($event)) {
            return 'invalid_schema';
        }

        $keys = array_keys($event);
        sort($keys);
        $expectedKeys = $requireClient
            ? self::DECISION_TOP_LEVEL_FIELDS
            : self::TELEMETRY_TOP_LEVEL_FIELDS;
        if ($keys !== $expectedKeys) {
            return 'invalid_schema';
        }

        if (
            ($event['schema_version'] ?? null) !== 1
            || ($event['site_id'] ?? null) !== $expectedSiteId
            || ($event['path'] ?? null) !== '/'
            || !is_string($event['correlation_id'] ?? null)
            || $event['correlation_id'] !== $correlationHeader
            || !is_string($event['occurred_at'] ?? null)
            || !self::isIsoTimestamp($event['occurred_at'])
            || !is_array($event['tracking'] ?? null)
            || self::isList($event['tracking'])
        ) {
            return 'invalid_schema';
        }

        /** @var array<string, mixed> $tracking */
        $tracking = $event['tracking'];
        if (array_diff(array_keys($tracking), self::TRACKING_FIELDS) !== []) {
            return 'invalid_tracking';
        }

        $hasTrigger = false;
        $totalBytes = 0;
        foreach ($tracking as $name => $value) {
            if (!is_string($value) || !self::validTrackingValue($name, $value)) {
                return 'invalid_tracking';
            }

            $totalBytes += strlen($value);
            if ($totalBytes > 2048) {
                return 'invalid_tracking';
            }
            if (in_array($name, self::TRIGGER_FIELDS, true)) {
                $hasTrigger = true;
            }
        }

        if (!$hasTrigger) {
            return 'missing_tracking_trigger';
        }

        if ($requireClient) {
            if (!is_array($event['client'] ?? null) || self::isList($event['client'])) {
                return 'invalid_client_context';
            }
            /** @var array<string, mixed> $client */
            $client = $event['client'];
            $clientKeys = array_keys($client);
            sort($clientKeys);
            if ($clientKeys !== self::CLIENT_FIELDS) {
                return 'invalid_client_context';
            }
            foreach ($client as $name => $value) {
                if (!is_string($value) || strlen($value) > 1024 || preg_match('/[\x00-\x1f\x7f]/', $value) === 1) {
                    return 'invalid_client_context';
                }
            }
            if (
                filter_var($client['ip'], FILTER_VALIDATE_IP) === false
                || $client['user_agent'] === ''
                || $client['host'] === ''
                || strlen($client['host']) > 253
                || filter_var($client['host'], FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false
            ) {
                return 'invalid_client_context';
            }
        }

        return null;
    }

    private static function validTrackingValue(string $name, string $value): bool
    {
        $limit = in_array($name, self::TRIGGER_FIELDS, true) ? 512 : 256;
        return trim($value) !== ''
            && strlen($value) <= $limit
            && preg_match('/[\x00-\x1f\x7f]/', $value) !== 1;
    }

    private static function isIsoTimestamp(string $value): bool
    {
        if (preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/D', $value) !== 1) {
            return false;
        }

        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:s.v\Z', $value, new DateTimeZone('UTC'));
        return $parsed !== false && $parsed->format('Y-m-d\TH:i:s.v\Z') === $value;
    }

    private static function isUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/Di', $value) === 1;
    }

    private static function isUuidV4(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/Di', $value) === 1;
    }

    /** @param array<mixed> $value */
    private static function isList(array $value): bool
    {
        return $value === [] || array_keys($value) === range(0, count($value) - 1);
    }

    private static function base64Url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    /** @param array<string, string> $additionalHeaders */
    private static function error(int $status, string $code, array $additionalHeaders = []): HttpResponse
    {
        return HttpResponse::json($status, [
            'schema_version' => 1,
            'error' => $code,
        ], $additionalHeaders);
    }
}
