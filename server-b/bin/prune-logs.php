<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\ConfigException;
use PL8\Telemetry\PrivacySafeEventLogger;
use PL8\Telemetry\StorageException;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

if (PHP_SAPI !== 'cli') {
    exit(64);
}

try {
    $config = Config::fromEnvironment(dirname(__DIR__) . '/public');
    if ($config->eventLogDir === null || $config->logHmacKey === null) {
        fwrite(STDERR, "Shared TDS telemetry logging is not configured.\n");
        exit(78);
    }

    $logger = new PrivacySafeEventLogger(
        $config->eventLogDir,
        $config->logHmacKey,
        $config->logRetentionDays,
    );
    $logger->pruneExpired();
} catch (ConfigException $exception) {
    fwrite(STDERR, "Shared TDS telemetry retention configuration is invalid.\n");
    exit(78);
} catch (StorageException $exception) {
    fwrite(STDERR, "Shared TDS telemetry retention cleanup failed.\n");
    exit(74);
} catch (Throwable $exception) {
    fwrite(STDERR, "Shared TDS telemetry retention cleanup failed unexpectedly.\n");
    exit(70);
}
