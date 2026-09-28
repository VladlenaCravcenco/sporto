#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
target="root@217.26.149.55"
release="sporto-$(date +%Y%m%d-%H%M%S)"
archive="$(mktemp -t sporto-deploy).tar.gz"
trap 'rm -f "$archive"' EXIT
# Include the current working files, including changes not committed to Git.
python3 - "$archive" <<'PY'
import subprocess, sys, tarfile
paths = subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z']).decode().split('\0')
with tarfile.open(sys.argv[1], 'w:gz') as out:
    for path in sorted(set(paths)):
        if not path or any(part.startswith('.env') for part in path.split('/')):
            continue
        if path.startswith(('.git/', '.next/', 'node_modules/', 'dist/', '.codex/', '.agents/')):
            continue
        import os
        if os.path.isfile(path):
            out.add(path, arcname=path, recursive=False)
PY
scp "$archive" "$target:/tmp/$release.tar.gz"
ssh "$target" bash -s -- "$release" <<'REMOTE'
set -euo pipefail
release="$1"
release_dir="/var/www/sporto-releases/$release"
test -f /var/www/sporto/.env.local
id sporto >/dev/null
mkdir -p "$release_dir"
tar -xzf "/tmp/$release.tar.gz" -C "$release_dir"
install -m 600 -o sporto -g sporto /var/www/sporto/.env.local "$release_dir/.env.local"
chown -R sporto:sporto "$release_dir"
runuser -u sporto -- bash -c 'cd "$1" && npm ci && npm run next:build' bash "$release_dir"
test -f "$release_dir/.next/standalone/server.js"
cp -a "$release_dir/public" "$release_dir/.next/standalone/public"
cp -a "$release_dir/.next/static" "$release_dir/.next/standalone/.next/static"
install -m 600 -o sporto -g sporto "$release_dir/.env.local" "$release_dir/.next/standalone/.env.local"
chown -R sporto:sporto "$release_dir/.next"
mkdir -p /etc/systemd/system/sporto.service.d
override=/etc/systemd/system/sporto.service.d/99-release.conf
if test -f "$override"; then cp -a "$override" "$release_dir/previous-release.conf"; fi
cat > "$override" <<UNIT
[Service]
WorkingDirectory=$release_dir/.next/standalone
ExecStart=
ExecStart=/usr/bin/node $release_dir/.next/standalone/server.js
UNIT
systemctl daemon-reload
rollback() {
  if test -f "$release_dir/previous-release.conf"; then
    cp -a "$release_dir/previous-release.conf" "$override"
  else
    rm -f "$override"
  fi
  systemctl daemon-reload
  systemctl restart sporto
}
if ! systemctl restart sporto; then rollback; exit 1; fi
healthy=false
for attempt in {1..20}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then healthy=true; break; fi
  sleep 1
done
if test "$healthy" != true; then
  rollback
  echo "Startup failed; previous release restored."
  exit 1
fi
if ! curl -fsS --max-time 60 http://127.0.0.1:3000/ru/catalog > "$release_dir/catalog-check.html" ||
   ! grep -q 'data-product-card' "$release_dir/catalog-check.html"; then
  rollback
  echo "Catalog check failed; previous release restored."
  exit 1
fi
echo "Deployed: $release"
echo "Open http://217.26.149.55/ru"
REMOTE
