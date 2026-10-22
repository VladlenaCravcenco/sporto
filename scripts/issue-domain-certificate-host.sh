#!/usr/bin/env bash
set -euo pipefail
# DNS validation issues the certificate before the domain points at this server.
# No nginx configuration, application environment or DNS records are changed here.
ssh -t -o ConnectTimeout=10 root@217.26.149.55 'bash -c '\''
set -euo pipefail
test "$(id -u)" = 0 || { echo "Run as root."; exit 1; }
command -v apt-get >/dev/null || { echo "Expected Ubuntu/Debian package manager."; exit 1; }
nginx -t
systemctl is-active --quiet sporto || { echo "Sporto service is not active."; exit 1; }
exec 9>/run/lock/sporto-domain-certificate.lock
flock -n 9 || { echo "Another domain certificate operation is running."; exit 1; }
if ! command -v certbot >/dev/null; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot
fi
echo "Получаем сертификат до переключения сайта. Nginx и DNS не меняются."
echo "Certbot попросит TXT-записи. Не нажимай Enter до проверки каждой записи в DNS."
echo "После переключения DNS нужно отдельно включить автоматическое продление через webroot."
certbot certonly --manual --preferred-challenges dns --cert-name sporto.md \
  --key-type ecdsa --agree-tos --email sportoadmin@gmail.com \
  -d sporto.md -d www.sporto.md
echo "Сертификат получен. Текущий сайт и настройки Nginx не переключались."
openssl x509 -in /etc/letsencrypt/live/sporto.md/fullchain.pem -noout -dates -ext subjectAltName
'\'''
