<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli' || count($argv) !== 3) {
    fwrite(STDERR, "usage: import-legacy-palladium.php <legacy-index.php> <private-dir>\n");
    exit(64);
}

$source = realpath($argv[1]);
$destination = realpath($argv[2]);
if ($source === false || !is_file($source) || is_link($source)) {
    fwrite(STDERR, "legacy source must be a regular non-symlink file\n");
    exit(65);
}
if ($destination === false || !is_dir($destination) || is_link($destination)) {
    fwrite(STDERR, "destination must be an existing regular directory\n");
    exit(65);
}

$legacy = file_get_contents($source);
if ($legacy === false || strlen($legacy) > 262144) {
    fwrite(STDERR, "legacy source cannot be read safely\n");
    exit(66);
}

$constants = [
    'PALLADIUM_CLIENT_ID' => 'palladium-client-id',
    'PALLADIUM_CLIENT_COMPANY' => 'palladium-client-company',
    'PALLADIUM_CLIENT_SECRET' => 'palladium-client-secret',
];

foreach ($constants as $constant => $filename) {
    $quoted = '/const\\s+' . preg_quote($constant, '/') . '\\s*=\\s*([\'\"])(.*?)\\1\\s*;/s';
    $numeric = '/const\\s+' . preg_quote($constant, '/') . '\\s*=\\s*([0-9]+)\\s*;/';
    if (preg_match($quoted, $legacy, $match) === 1) {
        $value = $match[2];
    } elseif (preg_match($numeric, $legacy, $match) === 1) {
        $value = $match[1];
    } else {
        fwrite(STDERR, "required Palladium constant is missing\n");
        exit(67);
    }
    if ($value === '' || strlen($value) > 4096 || preg_match('/[\\x00-\\x1f\\x7f]/', $value) === 1) {
        fwrite(STDERR, "a Palladium credential is invalid\n");
        exit(67);
    }

    $target = $destination . DIRECTORY_SEPARATOR . $filename;
    if ((file_exists($target) || is_link($target)) && (!is_file($target) || is_link($target))) {
        fwrite(STDERR, "unsafe credential target\n");
        exit(65);
    }
    $temporary = tempnam($destination, $filename . '.new.');
    if ($temporary === false) {
        fwrite(STDERR, "credential staging failed\n");
        exit(73);
    }
    try {
        if (file_put_contents($temporary, $value . "\n", LOCK_EX) === false || !chmod($temporary, 0600)) {
            throw new RuntimeException('credential write failed');
        }
        if (!rename($temporary, $target)) {
            throw new RuntimeException('credential commit failed');
        }
    } catch (Throwable) {
        @unlink($temporary);
        fwrite(STDERR, "credential installation failed\n");
        exit(73);
    }
}

fwrite(STDOUT, "OK: three Palladium credentials installed without disclosure.\n");
