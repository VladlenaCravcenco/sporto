#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" = 0 || { echo 'Root access required.'; exit 1; }
exec 9>/run/lock/sporto-deploy.lock
flock -n 9 || { echo 'Deployment/domain setup already running.'; exit 1; }
nginx -t
systemctl is-active --quiet sporto
test -d /etc/nginx/conf.d
test -f /etc/letsencrypt/live/sporto.md/fullchain.pem
test -f /etc/letsencrypt/live/sporto.md/privkey.pem
openssl x509 -in /etc/letsencrypt/live/sporto.md/fullchain.pem -noout -checkend 604800
for domain in sporto.md www.sporto.md; do
  openssl x509 -in /etc/letsencrypt/live/sporto.md/fullchain.pem -noout -checkhost "$domain" | grep -F 'does match certificate'
done
script_dir=$(cd "$(dirname "$0")" && pwd)
source_conf="$script_dir/sporto-domain.conf"
target_conf=/etc/nginx/conf.d/sporto-domain.conf
test -f "$source_conf"
test ! -L "$target_conf" || { echo 'Unexpected symlink; stopped.'; exit 1; }
if test -f "$target_conf" && ! head -n 1 "$target_conf" | grep -q '^# Managed by SPORTO domain setup'; then
  echo 'Existing unmanaged configuration; stopped.'; exit 1
fi
# Refuse other domain vhosts, including configs loaded outside conf.d.
python3 - "$target_conf" <<'PY'
import re,subprocess,sys
result=subprocess.run(['nginx','-T'],capture_output=True,text=True,check=True)
current=''
for line in result.stdout.splitlines():
    match=re.match(r'# configuration file (.*):$',line)
    if match: current=match.group(1);continue
    code=line.split('#',1)[0]
    if current!=sys.argv[1] and re.search(r'\bserver_name\s+[^;]*\b(?:www\.)?sporto\.md\b',code):
        raise SystemExit('Another Sporto domain vhost already exists. No changes made.')
PY
backup_dir="/var/backups/sporto-domain/$(date -u +%Y%m%dT%H%M%SZ)-$$"
install -d -m 700 "$backup_dir"
cp -a /etc/nginx "$backup_dir/nginx"
previous=false
if test -f "$target_conf"; then cp -a "$target_conf" "$backup_dir/previous-domain.conf"; previous=true; fi
cat > "$backup_dir/rollback.sh" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail
backup_dir=$(cd "$(dirname "$0")" && pwd)
exec 9>/run/lock/sporto-deploy.lock
flock -n 9 || { echo 'Another deployment/domain operation is running.'; exit 1; }
target=/etc/nginx/conf.d/sporto-domain.conf
if test -f "$backup_dir/previous-domain.conf"; then
  cp -a "$backup_dir/previous-domain.conf" "$target"
else
  rm -f -- "$target"
fi
nginx -t && systemctl reload nginx
ROLLBACK
chmod 700 "$backup_dir/rollback.sh"
installed=false
success=false
finish() {
  status=$?
  trap - EXIT
  if test "$installed" = true && test "$success" != true; then
    if test "$previous" = true; then cp -a "$backup_dir/previous-domain.conf" "$target_conf"; else rm -f -- "$target_conf"; fi
    nginx -t && systemctl reload nginx || echo "Automatic rollback failed. Backup: $backup_dir"
  fi
  exit "$status"
}
trap finish EXIT
install -d -m 755 /var/www/sporto-acme/.well-known/acme-challenge
installed=true
install -m 644 "$source_conf" "$target_conf"
nginx -t
nginx -T 2>/dev/null | grep -F "# configuration file $target_conf:" >/dev/null || {
  echo 'Nginx did not load the new domain file; rolling back.'; exit 1;
}
systemctl reload nginx
# Resolve locally: real trusted TLS is verified while public DNS still serves the old site.
# reload signals the master asynchronously; allow new workers to bind the new TLS listener.
curl -fsS --retry 8 --retry-connrefused --retry-delay 1 --retry-max-time 20 --noproxy '*' --resolve www.sporto.md:443:127.0.0.1 --max-time 60 https://www.sporto.md/ru -o "$backup_dir/home-check.html"
grep -q 'SPORTO' "$backup_dir/home-check.html"
http_version=$(curl -fsS --http2 --noproxy '*' --resolve www.sporto.md:443:127.0.0.1 --max-time 30 -o /dev/null -w '%{http_version}' https://www.sporto.md/api/health)
test "$http_version" = 2 || { echo 'HTTP/2 verification failed; rolling back.'; exit 1; }
curl -sS --noproxy '*' --resolve www.sporto.md:443:127.0.0.1 --max-time 30 -D "$backup_dir/public-headers" -o /dev/null https://www.sporto.md/ro
if grep -qi '^X-Robots-Tag:.*noindex' "$backup_dir/public-headers"; then
  echo 'Public domain still has staging noindex; rolling back.'; exit 1
fi
curl -sS --noproxy '*' --resolve sporto.md:443:127.0.0.1 --max-time 20 -D "$backup_dir/apex-headers" -o /dev/null https://sporto.md/ru
grep -qi '^location: https://www.sporto.md/ru' "$backup_dir/apex-headers"
curl -sS --noproxy '*' --resolve www.sporto.md:80:127.0.0.1 --max-time 20 -D "$backup_dir/http-headers" -o /dev/null http://www.sporto.md/ru
grep -qi '^location: https://www.sporto.md/ru' "$backup_dir/http-headers"
curl -sS --noproxy '*' --max-time 20 -D "$backup_dir/ip-headers" -o /dev/null http://127.0.0.1/ru -H 'Host: 217.26.149.55'
grep -qi '^X-Robots-Tag:.*noindex' "$backup_dir/ip-headers"
success=true
rm -f "$backup_dir/home-check.html"
echo "HTTPS domain prepared. DNS has not changed. Backup and rollback: $backup_dir"
echo "Run for rollback: bash $backup_dir/rollback.sh"
echo 'Automatic certificate renewal must still be configured after DNS switching.'
