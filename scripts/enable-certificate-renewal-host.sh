#!/usr/bin/env bash
set -euo pipefail
ssh -o ConnectTimeout=10 root@217.26.149.55 bash -s <<'REMOTE'
set -euo pipefail
exec 9>/run/lock/sporto-deploy.lock
flock -n 9 || { echo 'Another deployment/domain operation is running.'; exit 1; }
nginx -t
command -v certbot >/dev/null
renewal=/etc/letsencrypt/renewal/sporto.md.conf
test -f "$renewal"
test -d /var/www/sporto-acme/.well-known/acme-challenge
backup_dir="/var/backups/sporto-renewal/$(date -u +%Y%m%dT%H%M%SZ)-$$"
install -d -m 700 "$backup_dir"
cp -a "$renewal" "$backup_dir/sporto.md.conf"
challenge_name="sporto-check-$(openssl rand -hex 12)"
challenge_path="/var/www/sporto-acme/.well-known/acme-challenge/$challenge_name"
hook=/etc/letsencrypt/renewal-hooks/deploy/sporto-nginx-reload.sh
if test -f "$hook"; then cp -a "$hook" "$backup_dir/previous-hook"; fi
success=false
finish() {
  status=$?
  trap - EXIT
  rm -f -- "$challenge_path"
  if test "$success" != true; then
    cp -a "$backup_dir/sporto.md.conf" "$renewal"
    if test -f "$backup_dir/previous-hook"; then cp -a "$backup_dir/previous-hook" "$hook"; else rm -f -- "$hook"; fi
    echo "Renewal setup failed; previous renewal configuration restored. Backup: $backup_dir"
  fi
  exit "$status"
}
trap finish EXIT
printf '%s' "$challenge_name" > "$challenge_path"
chmod 644 "$challenge_path"
for domain in sporto.md www.sporto.md; do
  received=$(curl -fsS --noproxy '*' --max-time 30 "http://$domain/.well-known/acme-challenge/$challenge_name")
  test "$received" = "$challenge_name" || { echo 'DNS/ACME webroot is not ready. No certificate changed.'; exit 1; }
done
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > "$hook" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
# Other certificates must not reload Sporto's nginx unexpectedly.
if [[ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/sporto.md ]]; then
  /usr/sbin/nginx -t
  /usr/bin/systemctl reload nginx
fi
HOOK
chmod 750 "$hook"
# reconfigure performs a staging renewal before saving the new authenticator.
certbot reconfigure --non-interactive --cert-name sporto.md \
  --authenticator webroot --preferred-challenges http \
  --webroot-path /var/www/sporto-acme
grep -Eq '^authenticator\s*=\s*webroot\s*$' "$renewal"
certbot renew --non-interactive --cert-name sporto.md --dry-run --run-deploy-hooks
systemctl enable --now certbot.timer
systemctl is-enabled --quiet certbot.timer
systemctl is-active --quiet certbot.timer
nginx -t
curl -fsS --noproxy '*' --max-time 30 https://www.sporto.md/api/health >/dev/null
success=true
echo "Certificate automatic renewal verified. Renewal backup: $backup_dir"
echo 'Webroot validation, dry-run, nginx reload hook and certbot.timer passed.'
REMOTE
