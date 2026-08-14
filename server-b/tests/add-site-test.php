<?php

declare(strict_types=1);

use PL8\Telemetry\Config;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

$tests = 0;
$failures = [];
$temporaryDirectory = sys_get_temp_dir() . '/tds-add-site-test-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700, true) && !is_dir($temporaryDirectory)) {
    fwrite(STDERR, "Could not create test directory.\n");
    exit(1);
}

/** @param mixed $actual @param mixed $expected */
function assertSameValue(string $name, mixed $actual, mixed $expected): void
{
    global $tests, $failures;
    $tests++;
    if ($actual !== $expected) {
        $failures[] = sprintf('%s: expected %s, got %s', $name, var_export($expected, true), var_export($actual, true));
    }
}

function removeTestTree(string $directory): void
{
    $entries = scandir($directory);
    if ($entries === false) {
        return;
    }
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        $path = $directory . DIRECTORY_SEPARATOR . $entry;
        if (is_dir($path) && !is_link($path)) {
            removeTestTree($path);
        } else {
            unlink($path);
        }
    }
    rmdir($directory);
}

/** @return array{int, string, string} */
function runAddSite(string $configFile, string $siteId, string $keyId, string $secret): array
{
    $command = [PHP_BINARY, dirname(__DIR__) . '/bin/add-site.php', $siteId, $keyId, '--secret-stdin'];
    $environment = $_ENV;
    $environment['TDS_TELEMETRY_CONFIG_FILE'] = $configFile;
    $process = proc_open(
        $command,
        [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ],
        $pipes,
        null,
        $environment,
        ['bypass_shell' => true],
    );
    if (!is_resource($process)) {
        throw new RuntimeException('Could not start add-site command.');
    }
    fwrite($pipes[0], $secret . "\n");
    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);

    return [$status, $stdout === false ? '' : $stdout, $stderr === false ? '' : $stderr];
}

try {
    $privateDirectory = $temporaryDirectory . '/private';
    $nonceDirectory = $privateDirectory . '/nonces';
    $eventDirectory = $privateDirectory . '/events';
    mkdir($nonceDirectory, 0700, true);
    mkdir($eventDirectory, 0700, true);
    $existingKey = $privateDirectory . '/request-hmac.key';
    $logKey = $privateDirectory . '/log-hmac.key';
    file_put_contents($existingKey, str_repeat('a', 32) . "\n");
    file_put_contents($logKey, str_repeat('b', 32) . "\n");
    chmod($existingKey, 0600);
    chmod($logKey, 0600);

    $runtimeFile = $privateDirectory . '/runtime.json';
    $initialRuntime = [
        'clients' => [[
            'site_id' => 'PL_8',
            'key_id' => 'pl8-v1',
            'hmac_secret_file' => $existingKey,
        ]],
        'endpoint_url' => 'https://events.example.test/v4/index.php',
        'nonce_store_dir' => $nonceDirectory,
        'event_log_dir' => $eventDirectory,
        'log_hmac_key_file' => $logKey,
        'log_retention_days' => 30,
        'max_clock_skew_seconds' => 60,
        'max_body_bytes' => 4096,
    ];
    file_put_contents($runtimeFile, json_encode($initialRuntime, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
    chmod($runtimeFile, 0600);

    $secret = str_repeat('s', 48);
    [$status, $stdout, $stderr] = runAddSite($runtimeFile, 'newsite_pl', 'newsite_pl-v1', $secret);
    assertSameValue('successful add-site status', $status, 0);
    assertSameValue('successful add-site output', $stdout, "OK: registered site_id=newsite_pl key_id=newsite_pl-v1.\n");
    assertSameValue('successful add-site stderr', $stderr, '');
    assertSameValue('secret is not printed', str_contains($stdout . $stderr, $secret), false);

    $storedRuntime = json_decode((string) file_get_contents($runtimeFile), true, 32, JSON_THROW_ON_ERROR);
    assertSameValue('client registry count', count($storedRuntime['clients']), 2);
    assertSameValue('new site ID', $storedRuntime['clients'][1]['site_id'], 'newsite_pl');
    assertSameValue('new key ID', $storedRuntime['clients'][1]['key_id'], 'newsite_pl-v1');
    $newKeyFile = $storedRuntime['clients'][1]['hmac_secret_file'];
    assertSameValue('new key is outside runtime directory children', basename(dirname($newKeyFile)), 'clients');
    assertSameValue('new key contents', rtrim((string) file_get_contents($newKeyFile), "\r\n"), $secret);
    assertSameValue('new key permissions', fileperms($newKeyFile) & 0777, 0600);

    $previousEnvironment = getenv('TDS_TELEMETRY_CONFIG_FILE');
    putenv('TDS_TELEMETRY_CONFIG_FILE=' . $runtimeFile);
    $loadedConfig = Config::fromEnvironment(dirname(__DIR__) . '/public');
    if ($previousEnvironment === false) {
        putenv('TDS_TELEMETRY_CONFIG_FILE');
    } else {
        putenv('TDS_TELEMETRY_CONFIG_FILE=' . $previousEnvironment);
    }
    assertSameValue('new client is loadable', count($loadedConfig->clients), 2);

    $beforeDuplicate = (string) file_get_contents($runtimeFile);
    [$duplicateStatus, $duplicateStdout, $duplicateStderr] = runAddSite($runtimeFile, 'newsite_pl', 'newsite_pl-v1', str_repeat('z', 48));
    assertSameValue('duplicate add-site status', $duplicateStatus, 70);
    assertSameValue('duplicate add-site has no stdout', $duplicateStdout, '');
    assertSameValue('duplicate add-site error', str_contains($duplicateStderr, 'already registered'), true);
    assertSameValue('duplicate add-site leaves runtime unchanged', (string) file_get_contents($runtimeFile), $beforeDuplicate);

    [$badStatus, $badStdout, $badStderr] = runAddSite($runtimeFile, 'secondsite_pl', 'secondsite_pl-v1', 'short');
    assertSameValue('short secret status', $badStatus, 64);
    assertSameValue('short secret has no stdout', $badStdout, '');
    assertSameValue('short secret error', str_contains($badStderr, 'between 32 and 4096 bytes'), true);
    assertSameValue('short secret leaves runtime unchanged', (string) file_get_contents($runtimeFile), $beforeDuplicate);
} catch (Throwable $error) {
    $failures[] = 'unexpected test exception: ' . $error->getMessage();
}

removeTestTree($temporaryDirectory);

if ($failures !== []) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

fwrite(STDOUT, sprintf("OK: %d add-site assertions passed.\n", $tests));
