#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
domain_target=root@217.26.149.55
domain_remote="/tmp/sporto-domain-$(date +%Y%m%d%H%M%S)-$$"
ssh -o ConnectTimeout=10 "$domain_target" mkdir -m 700 "$domain_remote"
cleanup() { ssh -o ConnectTimeout=10 "$domain_target" rm -rf -- "$domain_remote" >/dev/null 2>&1 || true; }
trap cleanup EXIT
scp scripts/prepare-domain-server.sh scripts/nginx/sporto-domain.conf "$domain_target:$domain_remote/"
ssh -o ConnectTimeout=10 "$domain_target" bash "$domain_remote/prepare-domain-server.sh"
