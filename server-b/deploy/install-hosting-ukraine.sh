#!/bin/sh

set -eu
umask 077

if [ "$#" -ne 2 ]; then
  echo "usage: install-hosting-ukraine.sh <staging-dir> <release-id>" >&2
  exit 64
fi

requested_staging_dir=$1
release_id=$2

case "$release_id" in
  *[!0-9A-Za-z._-]* | "" | "." | ".." | [!0-9A-Za-z]* | *[!0-9A-Za-z])
    echo "invalid release id" >&2
    exit 64
    ;;
esac

base=/home/dzenmedv/api.studiadesi.site
staging_root=/home/dzenmedv
app_dir=$base/app
private_dir=$base/private
web_dir=$base/www
release_dir=$app_dir/releases/$release_id
php84=/usr/local/php84/bin/php

release_parent=$(dirname "$release_dir")
if [ "$release_parent" != "$app_dir/releases" ]; then
  echo "unsafe release path" >&2
  exit 65
fi

staging_dir=$(realpath "$requested_staging_dir")
case "$staging_dir" in
  "$staging_root"/pl8-telemetry-stage-*) ;;
  *)
    echo "unsafe staging directory" >&2
    exit 65
    ;;
esac

if [ ! -d "$staging_dir" ] || [ -L "$staging_dir" ] || [ "$(stat -c %U "$staging_dir")" != "$(id -un)" ]; then
  echo "unsafe staging directory ownership or type" >&2
  exit 65
fi

for required_path in \
  src/TelemetryEndpoint.php \
  bin/prune-logs.php \
  bin/validate-config.php \
  tests/self-test.php \
  deploy/hosting-ukraine-index.php \
  deploy/runtime.json
do
  required_file=$staging_dir/$required_path
  if [ ! -f "$required_file" ] || [ -L "$required_file" ] || [ "$(stat -c %U "$required_file")" != "$(id -un)" ]; then
    echo "unsafe staged file: $required_path" >&2
    exit 66
  fi
done

if [ ! -x "$php84" ]; then
  echo "PHP 8.4 is unavailable" >&2
  exit 69
fi

if [ -e "$release_dir" ] || [ -L "$release_dir" ]; then
  echo "release already exists: $release_dir" >&2
  exit 73
fi

for existing_file in "$private_dir/runtime.json" "$private_dir/request-hmac.key" "$private_dir/log-hmac.key" "$web_dir/v4/index.php"
do
  if [ -e "$existing_file" ] && { [ ! -f "$existing_file" ] || [ -L "$existing_file" ]; }; then
    echo "unsafe existing file: $existing_file" >&2
    exit 65
  fi
done
if [ -e "$app_dir/current" ] && [ ! -L "$app_dir/current" ]; then
  echo "unsafe existing current release pointer" >&2
  exit 65
fi
if [ -L "$app_dir/current" ]; then
  current_target=$(realpath "$app_dir/current")
  case "$current_target" in
    "$app_dir"/releases/*) ;;
    *)
      echo "unsafe existing current release target" >&2
      exit 65
      ;;
  esac
fi

"$php84" -l "$staging_dir/src/TelemetryEndpoint.php" >/dev/null
"$php84" -l "$staging_dir/bin/prune-logs.php" >/dev/null
"$php84" -l "$staging_dir/bin/validate-config.php" >/dev/null
"$php84" -l "$staging_dir/deploy/hosting-ukraine-index.php" >/dev/null
"$php84" "$staging_dir/tests/self-test.php"

had_app=0
had_private=0
had_v4=0
[ -e "$app_dir" ] && had_app=1
[ -e "$private_dir" ] && had_private=1
[ -e "$web_dir/v4" ] && had_v4=1

install -d -m 0700 "$app_dir" "$app_dir/releases" "$private_dir"
install -d -m 0700 "$private_dir/nonces" "$private_dir/events"

transaction_dir=$(mktemp -d "$private_dir/deploy-transaction.XXXXXXXX")
runtime_new=$transaction_dir/runtime.json
index_new=$transaction_dir/index.php
request_key_new=$transaction_dir/request-hmac.key
log_key_new=$transaction_dir/log-hmac.key
current_old=$transaction_dir/current.old
runtime_old=$transaction_dir/runtime.old
index_old=$transaction_dir/index.old
had_current=0
had_runtime=0
had_index=0
generated_request_key=0
generated_log_key=0
generated_cron_log=0
release_created=0
committed=0

early_cleanup() {
  status=$?
  trap - EXIT HUP INT TERM
  rm -rf "$transaction_dir"
  if [ "$had_private" -eq 0 ]; then
    rmdir "$private_dir/nonces" "$private_dir/events" "$private_dir" 2>/dev/null || true
  fi
  if [ "$had_app" -eq 0 ]; then
    rmdir "$app_dir/releases" "$app_dir" 2>/dev/null || true
  fi
  exit "$status"
}
trap early_cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

if [ -e "$app_dir/current" ] || [ -L "$app_dir/current" ]; then
  cp -a "$app_dir/current" "$current_old"
  had_current=1
fi
if [ -e "$private_dir/runtime.json" ]; then
  cp -p "$private_dir/runtime.json" "$runtime_old"
  had_runtime=1
fi
if [ -e "$web_dir/v4/index.php" ]; then
  cp -p "$web_dir/v4/index.php" "$index_old"
  had_index=1
fi

rollback() {
  status=$?
  trap - EXIT HUP INT TERM
  set +e
  if [ "$committed" -eq 0 ]; then
    rollback_failed=0
    if [ "$had_current" -eq 1 ]; then
      rm -f "$app_dir/current"
      cp -a "$current_old" "$app_dir/current" || rollback_failed=1
    else
      rm -f "$app_dir/current"
    fi
    if [ "$had_runtime" -eq 1 ]; then
      runtime_restore=$private_dir/runtime.json.restore.$$
      cp -p "$runtime_old" "$runtime_restore" && mv -Tf "$runtime_restore" "$private_dir/runtime.json" || rollback_failed=1
    else
      rm -f "$private_dir/runtime.json"
    fi
    if [ "$had_index" -eq 1 ]; then
      install -d -m 0755 "$web_dir/v4"
      index_restore=$web_dir/v4/index.php.restore.$$
      cp -p "$index_old" "$index_restore" && mv -Tf "$index_restore" "$web_dir/v4/index.php" || rollback_failed=1
    else
      rm -f "$web_dir/v4/index.php"
      if [ "$had_v4" -eq 0 ]; then rmdir "$web_dir/v4" 2>/dev/null || true; fi
    fi
    if [ "$release_created" -eq 1 ]; then
      rm -f "$release_dir/src/TelemetryEndpoint.php" "$release_dir/bin/prune-logs.php" "$release_dir/bin/validate-config.php"
      rmdir "$release_dir/src" "$release_dir/bin" "$release_dir" 2>/dev/null || true
    fi
    if [ "$generated_request_key" -eq 1 ]; then rm -f "$private_dir/request-hmac.key"; fi
    if [ "$generated_log_key" -eq 1 ]; then rm -f "$private_dir/log-hmac.key"; fi
    if [ "$generated_cron_log" -eq 1 ]; then rm -f "$private_dir/retention-cron.log"; fi
    if [ "$had_private" -eq 0 ]; then
      rmdir "$private_dir/nonces" "$private_dir/events" "$private_dir" 2>/dev/null || true
    fi
    if [ "$had_app" -eq 0 ]; then
      rmdir "$app_dir/releases" "$app_dir" 2>/dev/null || true
    fi
    if [ "$rollback_failed" -ne 0 ]; then
      echo "CRITICAL: PL_8 telemetry rollback was incomplete" >&2
    fi
  fi
  rm -rf "$transaction_dir"
  exit "$status"
}
trap rollback EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

if [ "$had_runtime" -eq 1 ]; then
  install -m 0600 "$runtime_old" "$runtime_new"
else
  install -m 0600 "$staging_dir/deploy/runtime.json" "$runtime_new"
fi
install -m 0600 "$staging_dir/deploy/hosting-ukraine-index.php" "$index_new"

install -d -m 0700 "$release_dir" "$release_dir/src" "$release_dir/bin"
release_created=1
install -m 0600 "$staging_dir/src/TelemetryEndpoint.php" "$release_dir/src/TelemetryEndpoint.php"
install -m 0700 "$staging_dir/bin/prune-logs.php" "$release_dir/bin/prune-logs.php"
install -m 0700 "$staging_dir/bin/validate-config.php" "$release_dir/bin/validate-config.php"

if [ ! -e "$private_dir/request-hmac.key" ]; then
  /usr/bin/openssl rand -base64 48 >"$request_key_new"
  request_key_bytes=$(tr -d '\r\n' <"$request_key_new" | wc -c)
  if [ "$request_key_bytes" -lt 32 ] || [ "$request_key_bytes" -gt 4096 ]; then
    echo "generated request key is invalid" >&2
    exit 70
  fi
  chmod 0600 "$request_key_new"
  mv -Tf "$request_key_new" "$private_dir/request-hmac.key"
  generated_request_key=1
fi
if [ ! -e "$private_dir/log-hmac.key" ]; then
  /usr/bin/openssl rand -base64 48 >"$log_key_new"
  log_key_bytes=$(tr -d '\r\n' <"$log_key_new" | wc -c)
  if [ "$log_key_bytes" -lt 32 ] || [ "$log_key_bytes" -gt 4096 ]; then
    echo "generated log key is invalid" >&2
    exit 70
  fi
  chmod 0600 "$log_key_new"
  mv -Tf "$log_key_new" "$private_dir/log-hmac.key"
  generated_log_key=1
fi
chmod 0600 "$private_dir/request-hmac.key" "$private_dir/log-hmac.key"
if [ ! -e "$private_dir/retention-cron.log" ]; then
  touch "$private_dir/retention-cron.log"
  generated_cron_log=1
fi
chmod 0600 "$private_dir/retention-cron.log"

TDS_TELEMETRY_CONFIG_FILE="$runtime_new" "$php84" "$release_dir/bin/prune-logs.php"

current_new=$transaction_dir/current.new
ln -s "$release_dir" "$current_new"
install -d -m 0755 "$web_dir/v4"

runtime_commit=$private_dir/runtime.json.new.$$
install -m 0600 "$runtime_new" "$runtime_commit"
mv -Tf "$runtime_commit" "$private_dir/runtime.json"
mv -Tf "$current_new" "$app_dir/current"
index_commit=$web_dir/v4/index.php.new.$$
install -m 0644 "$index_new" "$index_commit"
mv -Tf "$index_commit" "$web_dir/v4/index.php"

TDS_TELEMETRY_CONFIG_FILE="$private_dir/runtime.json" "$php84" "$app_dir/current/bin/prune-logs.php"

committed=1
echo "installed PL_8 telemetry release $release_id"
