<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\ConfigException;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

if (PHP_SAPI !== 'cli') {
    exit(64);
}

function usage(): void
{
    fwrite(STDERR, "usage: add-site.php <site-id> <key-id> --secret-stdin\n");
    exit(64);
}

function fail(string $message, int $status = 70): void
{
    fwrite(STDERR, $message . "\n");
    exit($status);
}

function validSiteId(string $value): bool
{
    return preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/', $value) === 1;
}

function validKeyId(string $value): bool
{
    return preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/', $value) === 1;
}

/** @param array<mixed> $value */
function isList(array $value): bool
{
    return $value === [] || array_keys($value) === range(0, count($value) - 1);
}

/** @param array<string, mixed> $config */
function migrateLegacyClientRegistry(array $config): array
{
    $hasRegistry = array_key_exists('clients', $config);
    $hasLegacy = array_key_exists('key_id', $config)
        || array_key_exists('hmac_secret', $config)
        || array_key_exists('hmac_secret_file', $config);
    if ($hasRegistry && $hasLegacy) {
        throw new RuntimeException('The runtime config mixes legacy and multi-site client configuration.');
    }
    if (!$hasLegacy) {
        return $config;
    }

    $legacyClient = [
        'site_id' => 'PL_8',
        'key_id' => $config['key_id'] ?? null,
    ];
    if (array_key_exists('hmac_secret_file', $config)) {
        $legacyClient['hmac_secret_file'] = $config['hmac_secret_file'];
    } else {
        $legacyClient['hmac_secret'] = $config['hmac_secret'] ?? null;
    }
    $config['clients'] = [$legacyClient];
    unset($config['key_id'], $config['hmac_secret'], $config['hmac_secret_file']);

    return $config;
}

/** @param array<string, mixed> $config */
function appendClient(array $config, string $siteId, string $keyId, string $keyFile): array
{
    $config = migrateLegacyClientRegistry($config);
    $clients = $config['clients'] ?? null;
    if (!is_array($clients) || !isList($clients) || $clients === []) {
        throw new RuntimeException('The runtime config has no valid client registry.');
    }

    foreach ($clients as $client) {
        if (!is_array($client) || isList($client)) {
            throw new RuntimeException('The runtime config has an invalid client entry.');
        }
        if (($client['site_id'] ?? null) === $siteId) {
            throw new RuntimeException('The site ID is already registered.');
        }
        if (($client['key_id'] ?? null) === $keyId) {
            throw new RuntimeException('The key ID is already registered.');
        }
    }

    $clients[] = [
        'site_id' => $siteId,
        'key_id' => $keyId,
        'hmac_secret_file' => $keyFile,
    ];
    $config['clients'] = $clients;

    return $config;
}

function restoreEnvironment(string $name, string|false $previous): void
{
    if ($previous === false) {
        putenv($name);
        return;
    }
    putenv($name . '=' . $previous);
}

if ($argc !== 4 || $argv[3] !== '--secret-stdin') {
    usage();
}

$siteId = $argv[1];
$keyId = $argv[2];
if (!validSiteId($siteId)) {
    fail('The site ID is invalid.', 64);
}
if (!validKeyId($keyId)) {
    fail('The key ID is invalid.', 64);
}

$secretInput = stream_get_contents(STDIN);
if ($secretInput === false) {
    fail('The site secret could not be read.', 65);
}
$secret = rtrim($secretInput, "\r\n");
if (str_contains($secret, "\n") || str_contains($secret, "\r")) {
    fail('The site secret must be one line.', 64);
}
try {
    Config::assertKey($secret, 'site HMAC key');
} catch (ConfigException) {
    fail('The site secret must contain between 32 and 4096 bytes.', 64);
}

$configuredRuntime = getenv('TDS_TELEMETRY_CONFIG_FILE');
if ($configuredRuntime === false || $configuredRuntime === '') {
    $configuredRuntime = getenv('PL8_TDS_CONFIG_FILE');
}
if ($configuredRuntime === false || $configuredRuntime === '' || !str_starts_with($configuredRuntime, DIRECTORY_SEPARATOR)) {
    fail('TDS_TELEMETRY_CONFIG_FILE must name the absolute shared runtime file.', 64);
}
$runtimeFile = realpath($configuredRuntime);
if ($runtimeFile === false || !is_file($runtimeFile) || is_link($runtimeFile) || !is_readable($runtimeFile) || !is_writable($runtimeFile)) {
    fail('The shared runtime file is unavailable or unsafe.', 65);
}
$runtimeDirectory = dirname($runtimeFile);
if (is_link($runtimeDirectory) || !is_dir($runtimeDirectory) || !is_writable($runtimeDirectory)) {
    fail('The shared runtime directory is unavailable or unsafe.', 65);
}

$lockFile = $runtimeDirectory . DIRECTORY_SEPARATOR . '.add-site.lock';
if (is_link($lockFile)) {
    fail('The shared runtime lock path is unsafe.', 65);
}
$lock = fopen($lockFile, 'c');
if ($lock === false || !flock($lock, LOCK_EX)) {
    fail('The shared runtime is busy.', 75);
}
chmod($lockFile, 0600);

$keyTemporary = null;
$runtimeTemporary = null;
$keyFile = null;
$keyCommitted = false;

try {
    $rawRuntime = file_get_contents($runtimeFile);
    if ($rawRuntime === false || strlen($rawRuntime) > 1_048_576) {
        throw new RuntimeException('The shared runtime file could not be read safely.');
    }
    $runtime = json_decode($rawRuntime, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($runtime) || isList($runtime)) {
        throw new RuntimeException('The shared runtime must contain a JSON object.');
    }

    $keyDirectory = $runtimeDirectory . DIRECTORY_SEPARATOR . 'clients';
    if (!file_exists($keyDirectory) && !mkdir($keyDirectory, 0700, true) && !is_dir($keyDirectory)) {
        throw new RuntimeException('The site-key directory could not be created.');
    }
    $keyDirectory = realpath($keyDirectory);
    if ($keyDirectory === false || is_link($keyDirectory) || !is_dir($keyDirectory) || !is_writable($keyDirectory)) {
        throw new RuntimeException('The site-key directory is unavailable or unsafe.');
    }

    $keyFile = $keyDirectory . DIRECTORY_SEPARATOR . $keyId . '.key';
    if (file_exists($keyFile) || is_link($keyFile)) {
        throw new RuntimeException('The site key already exists.');
    }

    $runtime = appendClient($runtime, $siteId, $keyId, $keyFile);
    $encodedRuntime = json_encode(
        $runtime,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
    ) . "\n";

    $keyTemporary = tempnam($keyDirectory, '.new-key-');
    $runtimeTemporary = tempnam($runtimeDirectory, '.new-runtime-');
    if ($keyTemporary === false || $runtimeTemporary === false) {
        throw new RuntimeException('The updated site registration could not be staged.');
    }
    if (
        file_put_contents($keyTemporary, $secret . "\n", LOCK_EX) === false
        || !chmod($keyTemporary, 0600)
        || file_put_contents($runtimeTemporary, $encodedRuntime, LOCK_EX) === false
        || !chmod($runtimeTemporary, 0600)
    ) {
        throw new RuntimeException('The updated site registration could not be written.');
    }

    if (!rename($keyTemporary, $keyFile)) {
        throw new RuntimeException('The site key could not be committed.');
    }
    $keyTemporary = null;
    $keyCommitted = true;

    $previousRuntimeEnvironment = getenv('TDS_TELEMETRY_CONFIG_FILE');
    putenv('TDS_TELEMETRY_CONFIG_FILE=' . $runtimeTemporary);
    try {
        Config::fromEnvironment(dirname(__DIR__) . '/public');
    } finally {
        restoreEnvironment('TDS_TELEMETRY_CONFIG_FILE', $previousRuntimeEnvironment);
    }

    if (!rename($runtimeTemporary, $runtimeFile)) {
        throw new RuntimeException('The shared runtime could not be committed.');
    }
    $runtimeTemporary = null;

    fwrite(STDOUT, sprintf("OK: registered site_id=%s key_id=%s.\n", $siteId, $keyId));
} catch (Throwable $exception) {
    if ($keyCommitted) {
        if (is_string($keyFile)) {
            @unlink($keyFile);
        }
    }
    fail('Site registration failed: ' . $exception->getMessage(), 70);
} finally {
    if (is_string($keyTemporary)) {
        @unlink($keyTemporary);
    }
    if (is_string($runtimeTemporary)) {
        @unlink($runtimeTemporary);
    }
    flock($lock, LOCK_UN);
    fclose($lock);
}
