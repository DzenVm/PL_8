<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\PalladiumDecisionProvider;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

if (PHP_SAPI !== 'cli') {
    exit(64);
}

try {
    $config = Config::fromEnvironment(dirname(__DIR__) . '/public');
    if ($config->palladium === null) {
        throw new RuntimeException('Palladium is not configured.');
    }
    $decision = (new PalladiumDecisionProvider($config->palladium))->decide([
        'tracking' => ['gclid' => 'pl8-server-smoke-' . time()],
        'client' => [
            'ip' => getenv('PL8_SMOKE_CLIENT_IP') ?: '1.1.1.1',
            'host' => getenv('PL8_SMOKE_CLIENT_HOST') ?: 'studiadesi.site',
            'user_agent' => 'PL8 controlled server-side smoke test',
            'accept' => 'text/html',
            'accept_language' => 'en',
            'referer' => '',
        ],
    ]);
    fwrite(STDOUT, sprintf(
        "OK: Palladium returned %s in %d ms.\n",
        $decision->decision,
        $decision->latencyMs,
    ));
} catch (Throwable $error) {
    fwrite(STDERR, 'Palladium smoke failed: ' . $error->getMessage() . "\n");
    exit(70);
}
