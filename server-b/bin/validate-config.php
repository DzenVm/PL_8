<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\ConfigException;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

if (PHP_SAPI !== 'cli') {
    exit(64);
}

try {
    $config = Config::fromEnvironment(dirname(__DIR__) . '/public');
    fwrite(STDOUT, sprintf("OK: %d telemetry client(s) configured.\n", count($config->clients)));
} catch (ConfigException) {
    fwrite(STDERR, "Shared TDS telemetry configuration is invalid.\n");
    exit(78);
} catch (Throwable) {
    fwrite(STDERR, "Shared TDS telemetry configuration validation failed unexpectedly.\n");
    exit(70);
}
