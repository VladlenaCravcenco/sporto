#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != "--email" ) ]]; then
  echo 'Usage: bash scripts/configure-order-host.sh [--email]' >&2
  exit 1
fi
order_target="root@217.26.149.55"
order_remote="/tmp/sporto-order-env-$(date +%Y%m%d%H%M%S)-$$.py"
cleanup() { ssh -o ConnectTimeout=10 "$order_target" rm -f -- "$order_remote" >/dev/null 2>&1 || true; }
trap cleanup EXIT
# Only the program is copied. Keys are entered directly on the server's SSH terminal.
scp scripts/configure-order-env.py "$order_target:$order_remote"
ssh -t -o ConnectTimeout=10 "$order_target" python3 "$order_remote" "$@"
