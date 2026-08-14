<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\ConfigException;
use PL8\Telemetry\HttpRequest;
use PL8\Telemetry\HttpResponse;
use PL8\Telemetry\TelemetryEndpoint;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

try {
    $config = Config::fromEnvironment(__DIR__);
    $request = HttpRequest::fromGlobals($config->maxBodyBytes);
    TelemetryEndpoint::withConfig($config)->handle($request)->emit();
} catch (ConfigException) {
    HttpResponse::json(500, [
        'schema_version' => 1,
        'error' => 'configuration_error',
    ])->emit();
} catch (Throwable) {
    HttpResponse::json(500, [
        'schema_version' => 1,
        'error' => 'internal_error',
    ])->emit();
}
