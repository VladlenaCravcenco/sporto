#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
target="root@217.26.149.55"
release="sporto-$(date +%Y%m%d-%H%M%S)"
archive="$(mktemp -t sporto-deploy)"
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
# Serialize deployments before inspecting or deleting releases.
exec 9>/run/lock/sporto-deploy.lock
flock -n 9 || { echo "Another Sporto deployment is running."; exit 1; }
previous_workdir=$(systemctl show sporto -p WorkingDirectory --value)
test -n "$previous_workdir"
prune_releases() {
  python3 - "$previous_workdir" "$1" <<'PRUNE'
from pathlib import Path
import re, shutil, sys
root = Path('/var/www/sporto-releases').resolve()
root.mkdir(parents=True, exist_ok=True)
releases = sorted((p for p in root.iterdir() if re.fullmatch(r'sporto-\d{8}-\d{6}', p.name)
                   and p.is_dir() and not p.is_symlink()), reverse=True)
def owning_release(value):
    path = Path(value).resolve()
    return next((p for p in releases if p == path or p in path.parents), None)
active = owning_release(sys.argv[1])
new = owning_release(sys.argv[2]) if sys.argv[2] else None
keep = {p for p in (active, new) if p}
if not new:
    # Prefer a release previously validated by this deployment script.
    older = [p for p in releases if p != active and (active is None or p.name < active.name)]
    fallback = next((p for p in older if (p / '.deploy-healthy').is_file()), None)
    # Compatibility with releases created before health markers existed.
    fallback = fallback or next((p for p in older if (p / '.next/standalone/server.js').is_file()), None)
    if fallback: keep.add(fallback)
# Unknown service layouts must never trigger automatic deletion.
if not active:
    print('Cleanup skipped: active service is outside the managed releases directory.')
else:
    for path in releases:
        if path not in keep:
            print('Removing old release:', path.name, flush=True)
            shutil.rmtree(path)
PRUNE
}
prune_releases ""
# Both bytes and inodes are needed for npm installation and Next.js builds.
available_kb=$(df -Pk /var/www/sporto-releases | awk 'NR==2 {print $4}')
available_inodes=$(df -Pi /var/www/sporto-releases | awk 'NR==2 {print $4}')
if (( available_kb < 3145728 || available_inodes < 150000 )); then
  rm -f "/tmp/$release.tar.gz"
  echo "Deployment stopped: need at least 3 GiB and 150000 free inodes. Active site unchanged."
  df -h /var/www/sporto-releases
  df -i /var/www/sporto-releases
  exit 1
fi
test ! -e "$release_dir" || { echo "Release already exists: $release"; exit 1; }
switched=false
success=false
finish() {
  status=$?
  trap - EXIT
  rm -f "/tmp/$release.tar.gz"
  if test "$success" != true; then
    if test "$switched" = true; then
      rollback || { echo "Rollback failed; preserving release for recovery."; exit "$status"; }
    fi
    actual=$(systemctl show sporto -p WorkingDirectory --value) || actual=""
    if test -n "$actual" && test "$actual" != "$release_dir/.next/standalone"; then
      rm -rf -- "$release_dir"
    fi
  fi
  exit "$status"
}
trap finish EXIT
test -f /var/www/sporto/.env.local
id sporto >/dev/null
mkdir "$release_dir"
tar -xzf "/tmp/$release.tar.gz" -C "$release_dir"
install -m 600 -o sporto -g sporto /var/www/sporto/.env.local "$release_dir/.env.local"
chown -R sporto:sporto "$release_dir"
runuser -u sporto -- bash -c 'cd "$1" && npm ci && node scripts/check-search-db.cjs && npm run next:build' bash "$release_dir"
test -f "$release_dir/.next/standalone/server.js"
cp -a "$release_dir/public" "$release_dir/.next/standalone/public"
cp -a "$release_dir/.next/static" "$release_dir/.next/standalone/.next/static"
install -m 600 -o sporto -g sporto "$release_dir/.env.local" "$release_dir/.next/standalone/.env.local"
chown -R sporto:sporto "$release_dir/.next"
mkdir -p /etc/systemd/system/sporto.service.d
override=/etc/systemd/system/sporto.service.d/99-release.conf
if test -f "$override"; then cp -a "$override" "$release_dir/previous-release.conf"; fi
rollback() {
  if test -f "$release_dir/previous-release.conf"; then
    cp -a "$release_dir/previous-release.conf" "$override" || return 1
  else
    rm -f "$override" || return 1
  fi
  systemctl daemon-reload || return 1
  systemctl restart sporto || return 1
  switched=false
}
switched=true
cat > "$override" <<UNIT
[Service]
WorkingDirectory=$release_dir/.next/standalone
ExecStart=
ExecStart=/usr/bin/node $release_dir/.next/standalone/server.js
UNIT
systemctl daemon-reload
systemctl restart sporto
healthy=false
for attempt in {1..20}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then healthy=true; break; fi
  sleep 1
done
if test "$healthy" != true; then
  echo "Startup failed; restoring previous release."
  exit 1
fi
if ! curl -fsS --max-time 60 http://127.0.0.1:3000/ru/catalog > "$release_dir/catalog-check.html" ||
   ! grep -q 'data-product-card' "$release_dir/catalog-check.html"; then
  echo "Catalog check failed; restoring previous release."
  exit 1
fi
if ! curl -fsS --max-time 30 'http://127.0.0.1:3000/api/search?q=insportline&lang=ro' > "$release_dir/search-check.json" ||
   ! node -e 'const r=require(process.argv[1]); if (!r.result || !Array.isArray(r.result.hits) || r.result.hits.length>8 || !Number.isFinite(r.result.total)) process.exit(1)' "$release_dir/search-check.json"; then
  echo "Search check failed; restoring previous release."
  exit 1
fi
touch "$release_dir/.deploy-healthy"
success=true
# Keep only the newly validated release and the one we just replaced.
prune_releases "$release_dir"
# Build-only files are not required by the standalone server.
rm -rf -- "$release_dir/node_modules" "$release_dir/.next/cache"
rm -f "$release_dir/catalog-check.html" "$release_dir/search-check.json"
echo "Disk after deployment:"
df -h /var/www/sporto-releases
echo "Deployed: $release"
echo "Open http://217.26.149.55/ru"
REMOTE
