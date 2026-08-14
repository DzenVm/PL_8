<?php

declare(strict_types=1);

use PL8\Telemetry\Config;
use PL8\Telemetry\ConfigException;
use PL8\Telemetry\ClientConfig;
use PL8\Telemetry\DecisionProvider;
use PL8\Telemetry\DecisionResult;
use PL8\Telemetry\FileNonceStore;
use PL8\Telemetry\HttpRequest;
use PL8\Telemetry\PalladiumConfig;
use PL8\Telemetry\PalladiumDecisionProvider;
use PL8\Telemetry\PalladiumFormEncoder;
use PL8\Telemetry\PalladiumTransport;
use PL8\Telemetry\PrivacySafeEventLogger;
use PL8\Telemetry\TelemetryEndpoint;

require dirname(__DIR__) . '/src/TelemetryEndpoint.php';

$tests = 0;
$failures = [];
$temporaryDirectory = sys_get_temp_dir() . '/pl8-telemetry-test-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700, true) && !is_dir($temporaryDirectory)) {
    echo "Could not create temporary test directory.\n";
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

function assertTrueValue(string $name, bool $actual): void
{
    assertSameValue($name, $actual, true);
}

/** @param list<string> $names */
function clearEnvironment(array $names): void
{
    foreach ($names as $name) {
        putenv($name);
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
        if (is_dir($path)) {
            removeTestTree($path);
        } else {
            unlink($path);
        }
    }
    rmdir($directory);
}

function base64Url(string $bytes): string
{
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function correlationId(int $seed): string
{
    return sprintf('11111111-2222-4333-8444-%012d', $seed);
}

function nonceId(int $seed): string
{
    return sprintf('aaaaaaaa-bbbb-4ccc-8ddd-%012d', $seed);
}

/** @return array<string, mixed> */
function validEvent(int $seed = 1): array
{
    return [
        'schema_version' => 1,
        'site_id' => 'PL_8',
        'correlation_id' => correlationId($seed),
        'occurred_at' => '2027-01-15T08:00:00.000Z',
        'path' => '/',
        'tracking' => [
            'gclid' => 'raw-click-id-123abc',
            'utm_source' => 'google',
            'utm_campaign' => 'sandbox',
        ],
    ];
}

/** @return array<string, mixed> */
function validDecisionEvent(int $seed = 1): array
{
    $event = validEvent($seed);
    $event['client'] = [
        'accept' => 'text/html,application/xhtml+xml',
        'accept_language' => 'tr-TR,tr;q=0.9',
        'host' => 'studiadesi.site',
        'ip' => '203.0.113.10',
        'referer' => '',
        'user_agent' => 'Mozilla/5.0 Test Browser',
        'headers' => [
            'accept' => 'text/html,application/xhtml+xml',
            'accept-encoding' => 'gzip, br',
            'accept-language' => 'tr-TR,tr;q=0.9',
            'sec-ch-ua' => '"Chromium";v="140"',
            'sec-ch-ua-full-version-list' => '"Chromium";v="140.0.7339.0"',
            'sec-ch-ua-mobile' => '?0',
            'sec-ch-ua-platform' => '"macOS"',
            'sec-fetch-dest' => 'document',
            'sec-fetch-mode' => 'navigate',
            'sec-fetch-site' => 'none',
            'upgrade-insecure-requests' => '1',
            'user-agent' => 'Mozilla/5.0 Test Browser',
            'cookie' => 'consent=accepted',
        ],
    ];
    return $event;
}

final class FakePalladiumTransport implements PalladiumTransport
{
    /** @var array<string, mixed>|null */
    public ?array $lastPayload = null;

    public function __construct(
        private int $status,
        private string $body,
        private int $latencyMs = 42,
    ) {
    }

    public function postForm(string $url, array $payload, int $connectTimeoutMs, int $timeoutMs): array
    {
        $this->lastPayload = $payload;
        return ['status' => $this->status, 'body' => $this->body, 'latency_ms' => $this->latencyMs];
    }
}

final class FakeDecisionProvider implements DecisionProvider
{
    public function __construct(private DecisionResult|Throwable $result)
    {
    }

    public function decide(array $event): DecisionResult
    {
        if ($this->result instanceof Throwable) {
            throw $this->result;
        }
        return $this->result;
    }
}

/** @param array<string, mixed> $event */
function signedRequest(
    Config $config,
    array $event,
    int $now,
    int $seed,
    string $keyId = 'pl8-v1',
): HttpRequest
{
    $client = $config->clientForKeyId($keyId);
    if ($client === null) {
        throw new RuntimeException('Test client is not configured.');
    }
    $body = json_encode($event, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    $timestamp = (string) $now;
    $nonce = nonceId($seed);
    $correlation = (string) $event['correlation_id'];
    $canonical = TelemetryEndpoint::canonicalMessage(
        $config->canonicalHost,
        $config->canonicalPath,
        $timestamp,
        $nonce,
        $correlation,
        hash('sha256', $body),
    );

    return new HttpRequest(
        'POST',
        $config->canonicalHost,
        $config->canonicalPath,
        [
            'content-type' => 'application/json',
            'x-tds-key-id' => $client->keyId,
            'x-tds-timestamp' => $timestamp,
            'x-tds-nonce' => $nonce,
            'x-correlation-id' => $correlation,
            'x-tds-signature' => 'v1=' . base64Url(hash_hmac('sha256', $canonical, $client->hmacSecret, true)),
        ],
        $body,
    );
}

$nonceDirectory = $temporaryDirectory . '/nonces';
mkdir($nonceDirectory, 0700);
$eventLogDirectory = $temporaryDirectory . '/event-logs';
mkdir($eventLogDirectory, 0700);

$requestKey = str_repeat('r', 32);
$secondRequestKey = str_repeat('p', 32);
$logKey = str_repeat('l', 32);
$now = 1_800_000_000;
$expiredLogFile = $eventLogDirectory . '/pl8-events-' . gmdate('Y-m-d', $now - (30 * 86400)) . '.jsonl';
$recentLogFile = $eventLogDirectory . '/pl8-events-' . gmdate('Y-m-d', $now - (29 * 86400)) . '.jsonl';
$currentLogFile = $eventLogDirectory . '/tds-events-' . gmdate('Y-m-d', $now) . '.jsonl';
$unrelatedLogFile = $eventLogDirectory . '/operator-notes.jsonl';
file_put_contents($expiredLogFile, "expired\n");
file_put_contents($recentLogFile, "recent\n");
file_put_contents($currentLogFile, "{\"seed\":true}\n");
file_put_contents($unrelatedLogFile, "untouched\n");
$config = new Config(
    [
        new ClientConfig('PL_8', 'pl8-v1', $requestKey),
        new ClientConfig('PL_9', 'pl9-v1', $secondRequestKey),
    ],
    'https://events.example.test/v4/index.php',
    $nonceDirectory,
    $eventLogDirectory,
    $logKey,
    30,
    60,
    4096,
);
$endpoint = TelemetryEndpoint::withConfig($config);

$validRequest = signedRequest($config, validEvent(1), $now, 1);
$validResponse = $endpoint->handle($validRequest, $now);
assertSameValue('valid status', $validResponse->status, 204);
assertSameValue('204 has no payload', $validResponse->payload, null);
assertTrueValue('204 is no-store', str_contains($validResponse->headers['Cache-Control'] ?? '', 'no-store'));
assertSameValue('no CORS header', array_key_exists('Access-Control-Allow-Origin', $validResponse->headers), false);
assertSameValue('no redirect header', array_key_exists('Location', $validResponse->headers), false);

$logContents = file_get_contents($currentLogFile);
assertTrueValue('one JSONL line appended', is_string($logContents) && substr_count($logContents, "\n") === 2);
assertSameValue('expired daily log removed', file_exists($expiredLogFile), false);
assertSameValue('retention-boundary daily log kept', file_get_contents($recentLogFile), "recent\n");
assertSameValue('unrelated file untouched', file_get_contents($unrelatedLogFile), "untouched\n");
assertSameValue('raw click ID absent', is_string($logContents) && str_contains($logContents, 'raw-click-id-123abc'), false);
assertSameValue('IP absent', is_string($logContents) && str_contains($logContents, 'client_ip'), false);
assertSameValue('UA absent', is_string($logContents) && str_contains($logContents, 'user_agent'), false);
$logLines = explode("\n", trim((string) $logContents));
assertSameValue('existing active log content preserved', $logLines[0] ?? null, '{"seed":true}');
$logRecord = json_decode($logLines[1] ?? '', true, 8, JSON_THROW_ON_ERROR);
$expectedClickHash = 'h1:' . base64Url(hash_hmac('sha256', "PL_8\nraw-click-id-123abc", $logKey, true));
assertSameValue('click ID uses separate keyed hash', $logRecord['tracking']['gclid_hash'] ?? null, $expectedClickHash);
assertSameValue('UTM retained', $logRecord['tracking']['utm_source'] ?? null, 'google');
assertSameValue('correlation retained', $logRecord['correlation_id'] ?? null, correlationId(1));

$secondSiteEvent = validEvent(1);
$secondSiteEvent['site_id'] = 'PL_9';
$secondSiteResponse = $endpoint->handle(signedRequest($config, $secondSiteEvent, $now, 1, 'pl9-v1'), $now);
assertSameValue('second site accepted by the same endpoint', $secondSiteResponse->status, 204);
$wrongSiteEvent = validEvent(14);
$wrongSiteEvent['site_id'] = 'PL_9';
assertSameValue(
    'site cannot use another site key',
    $endpoint->handle(signedRequest($config, $wrongSiteEvent, $now, 14), $now)->status,
    400,
);
$unknownClientRequest = signedRequest($config, validEvent(15), $now, 15);
$unknownClientRequest->headers['x-tds-key-id'] = 'unknown-v1';
assertSameValue('unknown client key ID rejected', $endpoint->handle($unknownClientRequest, $now)->status, 401);

$decisionNonceDirectory = $temporaryDirectory . '/decision-nonces';
mkdir($decisionNonceDirectory, 0700);
$palladiumConfig = new PalladiumConfig(
    'https://rbl.palladium.expert',
    'client-id',
    'client-company',
    'client-secret',
    ['dzentds.top'],
    350,
    800,
);
$decisionConfig = new Config(
    [new ClientConfig('PL_8', 'pl8-v1', $requestKey)],
    'https://events.example.test/v4/index.php',
    $decisionNonceDirectory,
    null,
    null,
    30,
    60,
    8192,
    $palladiumConfig,
);
$allowEndpoint = new TelemetryEndpoint(
    $decisionConfig,
    new FileNonceStore($decisionNonceDirectory, 600),
    new PrivacySafeEventLogger(null, null, 30),
    new FakeDecisionProvider(new DecisionResult('allow', 'https://dzentds.top/campaign', 'palladium_allowed', 37)),
);
$allowEvent = validDecisionEvent(20);
$allowResponse = $allowEndpoint->handle(signedRequest($decisionConfig, $allowEvent, $now, 20), $now);
assertSameValue('decision allow status', $allowResponse->status, 200);
assertSameValue('decision allow enum', $allowResponse->payload['decision'] ?? null, 'allow');
assertSameValue('decision target returned', $allowResponse->payload['target'] ?? null, 'https://dzentds.top/campaign');
assertSameValue('decision correlation returned', $allowResponse->payload['correlation_id'] ?? null, correlationId(20));
assertSameValue('decision latency returned', $allowResponse->payload['latency_ms'] ?? null, 37);
assertTrueValue('decision response is no-store', str_contains($allowResponse->headers['Cache-Control'] ?? '', 'no-store'));

$denyEndpoint = new TelemetryEndpoint(
    $decisionConfig,
    new FileNonceStore($decisionNonceDirectory, 600),
    new PrivacySafeEventLogger(null, null, 30),
    new FakeDecisionProvider(new DecisionResult('deny', null, 'palladium_denied', 25)),
);
$denyResponse = $denyEndpoint->handle(signedRequest($decisionConfig, validDecisionEvent(21), $now, 21), $now);
assertSameValue('decision deny status', $denyResponse->status, 200);
assertSameValue('decision deny enum', $denyResponse->payload['decision'] ?? null, 'deny');
assertSameValue('decision deny has no target', array_key_exists('target', $denyResponse->payload ?? []), false);

$errorEndpoint = new TelemetryEndpoint(
    $decisionConfig,
    new FileNonceStore($decisionNonceDirectory, 600),
    new PrivacySafeEventLogger(null, null, 30),
    new FakeDecisionProvider(new RuntimeException('upstream failed')),
);
$errorResponse = $errorEndpoint->handle(signedRequest($decisionConfig, validDecisionEvent(22), $now, 22), $now);
assertSameValue('decision technical error status', $errorResponse->status, 502);
assertSameValue('decision technical error enum', $errorResponse->payload['decision'] ?? null, 'error');
assertSameValue('decision technical error reason', $errorResponse->payload['reason'] ?? null, 'palladium_unavailable');

$missingClientResponse = $allowEndpoint->handle(signedRequest($decisionConfig, validEvent(23), $now, 23), $now);
assertSameValue('decision requires client context', $missingClientResponse->status, 400);
$badIpEvent = validDecisionEvent(24);
$badIpEvent['client']['ip'] = 'not-an-ip';
$badIpResponse = $allowEndpoint->handle(signedRequest($decisionConfig, $badIpEvent, $now, 24), $now);
assertSameValue('decision rejects invalid client IP', $badIpResponse->status, 400);

$allowTransport = new FakePalladiumTransport(200, json_encode([
    'result' => true,
    'mode' => 1,
    'target' => 'https://dzentds.top/d4h9Jb',
], JSON_THROW_ON_ERROR));
$provider = new PalladiumDecisionProvider($palladiumConfig, $allowTransport);
$providerAllow = $provider->decide(validDecisionEvent(25));
assertSameValue('Palladium allow mapped', $providerAllow->decision, 'allow');
assertSameValue('Palladium allow target mapped', $providerAllow->target, 'https://dzentds.top/d4h9Jb');
assertSameValue('Palladium payload uses real IP', $allowTransport->lastPayload['server']['REMOTE_ADDR'] ?? null, '203.0.113.10');
assertSameValue('Palladium payload uses real UA', $allowTransport->lastPayload['server']['HTTP_USER_AGENT'] ?? null, 'Mozilla/5.0 Test Browser');
assertSameValue('Palladium payload forwards truthful client hints', $allowTransport->lastPayload['server']['HTTP_SEC_CH_UA'] ?? null, '"Chromium";v="140"');
assertSameValue('Palladium payload forwards extended client hints', $allowTransport->lastPayload['server']['HTTP_SEC_CH_UA_FULL_VERSION_LIST'] ?? null, '"Chromium";v="140.0.7339.0"');
assertSameValue('Palladium payload forwards truthful fetch context', $allowTransport->lastPayload['server']['HTTP_SEC_FETCH_MODE'] ?? null, 'navigate');
assertSameValue('Palladium payload forwards cookie header', $allowTransport->lastPayload['server']['HTTP_COOKIE'] ?? null, 'consent=accepted');
assertSameValue('Palladium payload matches GET request collector', $allowTransport->lastPayload['request'] ?? null, []);
assertSameValue(
    'Palladium payload keeps click ID in query',
    $allowTransport->lastPayload['server']['QUERY_STRING'] ?? null,
    'gclid=raw-click-id-123abc&utm_source=google&utm_campaign=sandbox',
);
assertSameValue('Palladium payload forwards truthful client hints', array_key_exists('HTTP_SEC_CH_UA', $allowTransport->lastPayload['server'] ?? []), true);
assertSameValue('Palladium payload follows official header allowlist', array_key_exists('REQUEST_METHOD', $allowTransport->lastPayload['server'] ?? []), false);
assertSameValue('Palladium auth client ID mapped', $allowTransport->lastPayload['auth']['clientId'] ?? null, 'client-id');
assertSameValue(
    'Palladium form encoding matches downloaded integration',
    PalladiumFormEncoder::encode(['server' => ['HTTP_USER_AGENT' => 'Browser Test']]),
    'server%5BHTTP_USER_AGENT%5D=Browser+Test',
);

$denyTransport = new FakePalladiumTransport(200, '{"result":false}');
$providerDeny = (new PalladiumDecisionProvider($palladiumConfig, $denyTransport))->decide(validDecisionEvent(26));
assertSameValue('Palladium deny mapped', $providerDeny->decision, 'deny');
$numericAllow = (new PalladiumDecisionProvider(
    $palladiumConfig,
    new FakePalladiumTransport(200, '{"result":1,"mode":"1","target":"https://dzentds.top/numeric"}'),
))->decide(validDecisionEvent(27));
assertSameValue('Palladium numeric allow mapped', $numericAllow->decision, 'allow');
$stringDeny = (new PalladiumDecisionProvider(
    $palladiumConfig,
    new FakePalladiumTransport(200, '{"result":"0"}'),
))->decide(validDecisionEvent(28));
assertSameValue('Palladium string deny mapped', $stringDeny->decision, 'deny');
foreach ([
    new FakePalladiumTransport(500, '{}'),
    new FakePalladiumTransport(200, 'not-json'),
    new FakePalladiumTransport(200, '{"result":true,"mode":1,"target":"https://evil.example/"}'),
    new FakePalladiumTransport(200, '{"result":true,"mode":0,"target":"https://dzentds.top/"}'),
] as $index => $badTransport) {
    try {
        (new PalladiumDecisionProvider($palladiumConfig, $badTransport))->decide(validDecisionEvent(30 + $index));
        assertTrueValue('Palladium invalid response rejected ' . $index, false);
    } catch (Throwable) {
        assertTrueValue('Palladium invalid response rejected ' . $index, true);
    }
}

$cronLogDirectory = $temporaryDirectory . '/cron-logs';
mkdir($cronLogDirectory, 0700);
$cronExpired = $cronLogDirectory . '/pl8-events-' . gmdate('Y-m-d', $now - (30 * 86400)) . '.jsonl';
$cronRecent = $cronLogDirectory . '/pl8-events-' . gmdate('Y-m-d', $now - (5 * 86400)) . '.jsonl';
$cronUnrelated = $cronLogDirectory . '/pl8-events-manual-backup.jsonl';
$cronSymlink = $cronLogDirectory . '/pl8-events-' . gmdate('Y-m-d', $now - (31 * 86400)) . '.jsonl';
$cronSymlinkTarget = $temporaryDirectory . '/symlink-target';
file_put_contents($cronExpired, "expired-without-new-event\n");
file_put_contents($cronRecent, "recent-without-new-event\n");
file_put_contents($cronUnrelated, "unrelated-without-new-event\n");
file_put_contents($cronSymlinkTarget, "symlink-target\n");
$symlinkSupported = function_exists('symlink') && @symlink($cronSymlinkTarget, $cronSymlink);
$cronLogger = new \PL8\Telemetry\PrivacySafeEventLogger($cronLogDirectory, $logKey, 30);
$cronLogger->pruneExpired($now);
assertSameValue('standalone cleanup removes expired log without event', file_exists($cronExpired), false);
assertSameValue('standalone cleanup keeps recent log without event', file_get_contents($cronRecent), "recent-without-new-event\n");
assertSameValue('standalone cleanup ignores nonmatching file', file_get_contents($cronUnrelated), "unrelated-without-new-event\n");
if ($symlinkSupported) {
    assertSameValue('standalone cleanup does not follow/delete symlink', file_get_contents($cronSymlinkTarget), "symlink-target\n");
    assertSameValue('standalone cleanup leaves symlink itself alone', is_link($cronSymlink), true);
}

// Fixed vector generated with the Node.js crypto operations used by PL_8/lib/tds/event.ts.
$vectorSecret = '0123456789abcdef0123456789abcdef';
$vectorBody = '{"schema_version":1,"site_id":"PL_8","correlation_id":"11111111-2222-4333-8444-555555555555","occurred_at":"2027-01-15T08:00:00.000Z","path":"/","tracking":{"gclid":"vector-click","utm_source":"google"}}';
$vectorBodyHash = '8e29dbef7b2f03509998b466c8917f90a404dad448734c37cd5b5671ae8a91ec';
$vectorCanonical = TelemetryEndpoint::canonicalMessage(
    'events.example.test',
    '/v4/index.php',
    '1800000000',
    'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    '11111111-2222-4333-8444-555555555555',
    $vectorBodyHash,
);
$vectorSignature = base64Url(hash_hmac('sha256', $vectorCanonical, $vectorSecret, true));
assertSameValue('Node/PHP fixed body hash', hash('sha256', $vectorBody), $vectorBodyHash);
assertSameValue('Node/PHP fixed signature', $vectorSignature, '-tLl5aZFNd-OGUDMOFkpO31aQA6ibR7SUHeGSK2yhB4');
$vectorNonceDirectory = $temporaryDirectory . '/vector-nonces';
mkdir($vectorNonceDirectory, 0700);
$vectorConfig = new Config(
    [new ClientConfig('PL_8', 'vector-v1', $vectorSecret)],
    'https://events.example.test:443/v4/index.php',
    $vectorNonceDirectory,
);
$vectorResponse = TelemetryEndpoint::withConfig($vectorConfig)->handle(new HttpRequest(
    'POST',
    'events.example.test',
    '/v4/index.php',
    [
        'content-type' => 'application/json',
        'x-tds-key-id' => 'vector-v1',
        'x-tds-timestamp' => '1800000000',
        'x-tds-nonce' => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        'x-correlation-id' => '11111111-2222-4333-8444-555555555555',
        'x-tds-signature' => 'v1=' . $vectorSignature,
    ],
    $vectorBody,
), $now);
assertSameValue('Node/PHP fixed vector accepted', $vectorResponse->status, 204);

$replayResponse = $endpoint->handle($validRequest, $now);
assertSameValue('replay status', $replayResponse->status, 409);
assertSameValue('replay code', $replayResponse->payload['error'] ?? null, 'replay_detected');

$bodyHashRequest = signedRequest($config, validEvent(2), $now, 2);
$bodyHashResponse = $endpoint->handle(new HttpRequest(
    'POST',
    $bodyHashRequest->host,
    $bodyHashRequest->path,
    $bodyHashRequest->headers,
    $bodyHashRequest->body . "\n",
), $now);
assertSameValue('changed raw body rejected', $bodyHashResponse->status, 401);

$wrongSignatureRequest = signedRequest($config, validEvent(3), $now, 3);
$wrongSignatureRequest->headers['x-tds-signature'] = 'v1=' . str_repeat('A', 43);
assertSameValue('wrong signature rejected', $endpoint->handle($wrongSignatureRequest, $now)->status, 401);

$expiredRequest = signedRequest($config, validEvent(4), $now - 61, 4);
$expiredResponse = $endpoint->handle($expiredRequest, $now);
assertSameValue('expired status', $expiredResponse->status, 401);
assertSameValue('expired code', $expiredResponse->payload['error'] ?? null, 'request_expired');

$wrongHostRequest = signedRequest($config, validEvent(5), $now, 5);
$wrongHostRequest->host = 'wrong.example.test';
assertSameValue('wrong host rejected', $endpoint->handle($wrongHostRequest, $now)->status, 401);

$wrongPathRequest = signedRequest($config, validEvent(6), $now, 6);
$wrongPathRequest->path = '/other.php';
assertSameValue('wrong path rejected', $endpoint->handle($wrongPathRequest, $now)->status, 401);

$extraFieldEvent = validEvent(7);
$extraFieldEvent['unexpected'] = true;
$extraFieldResponse = $endpoint->handle(signedRequest($config, $extraFieldEvent, $now, 7), $now);
assertSameValue('extra top-level field status', $extraFieldResponse->status, 400);
assertSameValue('extra top-level field code', $extraFieldResponse->payload['error'] ?? null, 'invalid_schema');

$extraTrackingEvent = validEvent(8);
$extraTrackingEvent['tracking']['user_agent'] = 'not allowed';
$extraTrackingResponse = $endpoint->handle(signedRequest($config, $extraTrackingEvent, $now, 8), $now);
assertSameValue('extra tracking field status', $extraTrackingResponse->status, 400);
assertSameValue('extra tracking field code', $extraTrackingResponse->payload['error'] ?? null, 'invalid_tracking');

$missingTriggerEvent = validEvent(9);
$missingTriggerEvent['tracking'] = ['utm_source' => 'google'];
$missingTriggerResponse = $endpoint->handle(signedRequest($config, $missingTriggerEvent, $now, 9), $now);
assertSameValue('missing trigger status', $missingTriggerResponse->status, 400);
assertSameValue('missing trigger code', $missingTriggerResponse->payload['error'] ?? null, 'missing_tracking_trigger');

$mismatchedCorrelationEvent = validEvent(10);
$mismatchedCorrelationRequest = signedRequest($config, $mismatchedCorrelationEvent, $now, 10);
$mismatchedCorrelationRequest->headers['x-correlation-id'] = correlationId(11);
$canonical = TelemetryEndpoint::canonicalMessage(
    $config->canonicalHost,
    $config->canonicalPath,
    (string) $now,
    nonceId(10),
    correlationId(11),
    hash('sha256', $mismatchedCorrelationRequest->body),
);
$mismatchedCorrelationRequest->headers['x-tds-signature'] = 'v1=' . base64Url(
    hash_hmac('sha256', $canonical, $requestKey, true),
);
assertSameValue('body/header correlation mismatch rejected', $endpoint->handle($mismatchedCorrelationRequest, $now)->status, 400);

$invalidNonceRequest = signedRequest($config, validEvent(12), $now, 12);
$invalidNonceRequest->headers['x-tds-nonce'] = 'not-a-uuid';
assertSameValue('invalid nonce rejected', $endpoint->handle($invalidNonceRequest, $now)->status, 401);

$getResponse = $endpoint->handle(new HttpRequest('GET', $config->canonicalHost, $config->canonicalPath, [], ''), $now);
assertSameValue('GET rejected', $getResponse->status, 405);
assertSameValue('GET Allow header', $getResponse->headers['Allow'] ?? null, 'POST');
$mediaResponse = $endpoint->handle(new HttpRequest('POST', $config->canonicalHost, $config->canonicalPath, ['content-type' => 'text/plain'], '{}'), $now);
assertSameValue('wrong media type rejected', $mediaResponse->status, 415);
$largeResponse = $endpoint->handle(new HttpRequest('POST', $config->canonicalHost, $config->canonicalPath, ['content-type' => 'application/json'], '', true), $now);
assertSameValue('oversize body rejected', $largeResponse->status, 413);

$dropOnlyNonceDirectory = $temporaryDirectory . '/drop-only-nonces';
mkdir($dropOnlyNonceDirectory, 0700);
$dropOnlyConfig = new Config(
    [new ClientConfig('PL_8', 'pl8-v1', $requestKey)],
    'https://events.example.test/v4/index.php',
    $dropOnlyNonceDirectory,
);
$dropOnlyResponse = TelemetryEndpoint::withConfig($dropOnlyConfig)->handle(
    signedRequest($dropOnlyConfig, validEvent(13), $now, 13),
    $now,
);
assertSameValue('logging is optional', $dropOnlyResponse->status, 204);

try {
    new Config([new ClientConfig('PL_8', 'pl8-v1', $requestKey)], 'http://events.example.test/v4/index.php', $nonceDirectory);
    assertTrueValue('HTTP endpoint rejected', false);
} catch (ConfigException) {
    assertTrueValue('HTTP endpoint rejected', true);
}
try {
    new Config([new ClientConfig('PL_8', 'pl8-v1', $requestKey)], 'https://events.example.test/v4/index.php', $nonceDirectory, $eventLogDirectory, $requestKey);
    assertTrueValue('same request/log key rejected', false);
} catch (ConfigException) {
    assertTrueValue('same request/log key rejected', true);
}
try {
    new Config([new ClientConfig('PL_8', 'pl8-v1', $requestKey)], 'https://events.example.test/v4/index.php', $nonceDirectory, $eventLogDirectory, $logKey, 91);
    assertTrueValue('retention over 90 days rejected', false);
} catch (ConfigException) {
    assertTrueValue('retention over 90 days rejected', true);
}
try {
    new Config([new ClientConfig('PL_8', 'pl8-v1', $requestKey)], 'https://events.example.test/v4/index.php', $nonceDirectory, $eventLogDirectory, $logKey, 0);
    assertTrueValue('zero-day retention rejected', false);
} catch (ConfigException) {
    assertTrueValue('zero-day retention rejected', true);
}
try {
    new Config([
        new ClientConfig('PL_8', 'duplicate-v1', $requestKey),
        new ClientConfig('PL_9', 'duplicate-v1', $secondRequestKey),
    ], 'https://events.example.test/v4/index.php', $nonceDirectory);
    assertTrueValue('duplicate client key ID rejected', false);
} catch (ConfigException) {
    assertTrueValue('duplicate client key ID rejected', true);
}

$environmentNames = [
    'TDS_TELEMETRY_CONFIG_FILE',
    'TDS_TELEMETRY_ENDPOINT_URL',
    'TDS_TELEMETRY_NONCE_STORE_DIR',
    'TDS_TELEMETRY_EVENT_LOG_DIR',
    'TDS_TELEMETRY_LOG_HMAC_KEY',
    'TDS_TELEMETRY_LOG_HMAC_KEY_FILE',
    'TDS_TELEMETRY_LOG_RETENTION_DAYS',
    'TDS_TELEMETRY_MAX_CLOCK_SKEW_SECONDS',
    'TDS_TELEMETRY_MAX_BODY_BYTES',
    'PL8_TDS_CONFIG_FILE',
];
clearEnvironment($environmentNames);
$publicRoot = $temporaryDirectory . '/public';
$configNonceDirectory = $temporaryDirectory . '/config-nonces';
mkdir($publicRoot, 0700);
mkdir($configNonceDirectory, 0700);
$requestKeyFile = $temporaryDirectory . '/request-key';
$logKeyFile = $temporaryDirectory . '/log-key';
$palladiumClientIdFile = $temporaryDirectory . '/palladium-client-id';
$palladiumCompanyFile = $temporaryDirectory . '/palladium-company';
$palladiumSecretFile = $temporaryDirectory . '/palladium-secret';
file_put_contents($requestKeyFile, str_repeat('q', 32) . "\n");
file_put_contents($logKeyFile, str_repeat('z', 32) . "\n");
file_put_contents($palladiumClientIdFile, "config-client-id\n");
file_put_contents($palladiumCompanyFile, "config-company\n");
file_put_contents($palladiumSecretFile, "config-secret\n");
$configFile = $temporaryDirectory . '/runtime.json';
file_put_contents($configFile, json_encode([
    'clients' => [[
        'site_id' => 'PL_8',
        'key_id' => 'config-v1',
        'hmac_secret_file' => $requestKeyFile,
    ]],
    'endpoint_url' => 'https://events.config.test/v4/index.php',
    'nonce_store_dir' => $configNonceDirectory,
    'event_log_dir' => $eventLogDirectory,
    'log_hmac_key_file' => $logKeyFile,
    'log_retention_days' => 30,
    'max_clock_skew_seconds' => 75,
    'max_body_bytes' => 8192,
    'palladium' => [
        'url' => 'https://rbl.palladium.expert',
        'client_id_file' => $palladiumClientIdFile,
        'client_company_file' => $palladiumCompanyFile,
        'client_secret_file' => $palladiumSecretFile,
        'allowed_target_hosts' => ['dzentds.top'],
        'connect_timeout_ms' => 350,
        'timeout_ms' => 800,
    ],
], JSON_THROW_ON_ERROR));
putenv('TDS_TELEMETRY_CONFIG_FILE=' . $configFile);
$loadedConfig = Config::fromEnvironment($publicRoot);
$loadedClient = $loadedConfig->clientForKeyId('config-v1');
assertSameValue('external config site ID', $loadedClient?->siteId, 'PL_8');
assertSameValue('external request key newline stripped', $loadedClient?->hmacSecret, str_repeat('q', 32));
assertSameValue('external log key newline stripped', $loadedConfig->logHmacKey, str_repeat('z', 32));
assertSameValue('external endpoint host', $loadedConfig->canonicalHost, 'events.config.test');
assertSameValue('external endpoint path', $loadedConfig->canonicalPath, '/v4/index.php');
assertSameValue('external log retention', $loadedConfig->logRetentionDays, 30);
assertSameValue('external Palladium client ID loaded', $loadedConfig->palladium?->clientId, 'config-client-id');
assertSameValue('external Palladium company loaded', $loadedConfig->palladium?->clientCompany, 'config-company');
assertSameValue('external Palladium secret loaded', $loadedConfig->palladium?->clientSecret, 'config-secret');
assertSameValue('external Palladium timeout loaded', $loadedConfig->palladium?->timeoutMs, 800);

$unsafePalladiumConfigFile = $temporaryDirectory . '/unsafe-palladium-runtime.json';
$unsafePalladiumConfig = json_decode((string) file_get_contents($configFile), true, 8, JSON_THROW_ON_ERROR);
$unsafePalladiumConfig['palladium']['url'] = 'http://rbl.palladium.expert';
file_put_contents($unsafePalladiumConfigFile, json_encode($unsafePalladiumConfig, JSON_THROW_ON_ERROR));
putenv('TDS_TELEMETRY_CONFIG_FILE=' . $unsafePalladiumConfigFile);
try {
    Config::fromEnvironment($publicRoot);
    assertTrueValue('insecure Palladium URL rejected', false);
} catch (ConfigException) {
    assertTrueValue('insecure Palladium URL rejected', true);
}

$legacyConfigFile = $temporaryDirectory . '/legacy-runtime.json';
file_put_contents($legacyConfigFile, json_encode([
    'key_id' => 'pl8-legacy-v1',
    'hmac_secret_file' => $requestKeyFile,
    'endpoint_url' => 'https://events.config.test/v4/index.php',
    'nonce_store_dir' => $configNonceDirectory,
], JSON_THROW_ON_ERROR));
putenv('TDS_TELEMETRY_CONFIG_FILE=' . $legacyConfigFile);
$legacyConfig = Config::fromEnvironment($publicRoot);
assertSameValue('legacy PL_8 runtime migrates in memory', $legacyConfig->clientForKeyId('pl8-legacy-v1')?->siteId, 'PL_8');

$mixedConfigFile = $temporaryDirectory . '/mixed-runtime.json';
file_put_contents($mixedConfigFile, json_encode([
    'clients' => [[
        'site_id' => 'PL_8',
        'key_id' => 'config-v1',
        'hmac_secret_file' => $requestKeyFile,
    ]],
    'key_id' => 'legacy-v1',
    'endpoint_url' => 'https://events.config.test/v4/index.php',
    'nonce_store_dir' => $configNonceDirectory,
], JSON_THROW_ON_ERROR));
putenv('TDS_TELEMETRY_CONFIG_FILE=' . $mixedConfigFile);
try {
    Config::fromEnvironment($publicRoot);
    assertTrueValue('mixed legacy and client registry rejected', false);
} catch (ConfigException) {
    assertTrueValue('mixed legacy and client registry rejected', true);
}

$insidePublicConfig = $publicRoot . '/runtime.json';
file_put_contents($insidePublicConfig, '{}');
putenv('TDS_TELEMETRY_CONFIG_FILE=' . $insidePublicConfig);
try {
    Config::fromEnvironment($publicRoot);
    assertTrueValue('config inside public root rejected', false);
} catch (ConfigException) {
    assertTrueValue('config inside public root rejected', true);
}

clearEnvironment($environmentNames);
removeTestTree($temporaryDirectory);

if ($failures !== []) {
    foreach ($failures as $failure) {
        echo "FAIL: {$failure}\n";
    }
    echo sprintf("%d/%d tests failed.\n", count($failures), $tests);
    exit(1);
}

echo sprintf("OK: %d assertions passed.\n", $tests);
