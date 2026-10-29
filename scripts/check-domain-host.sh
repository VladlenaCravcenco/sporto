#!/usr/bin/env bash
set -euo pipefail
# Read-only inventory; do not print full nginx configuration or environment values.
ssh -o ConnectTimeout=10 root@217.26.149.55 python3 - <<'PY'
import json,re,subprocess
from pathlib import Path
result={}
nginx=subprocess.run(['nginx','-T'],capture_output=True,text=True)
config='\n'.join(line.split('#',1)[0] for line in nginx.stdout.splitlines())
result['nginxConfigValid']=nginx.returncode==0
result['domainMentioned']=bool(re.search(r'server_name\s+[^;]*\bsporto\.md\b',config))
result['httpsListenerPresent']=bool(re.search(r'listen\s+[^;]*\b443\b',config))
result['http2Configured']=bool(re.search(r'(?:listen\s+[^;]*\bhttp2\b|http2\s+on)',config))
result['compressionConfigured']=bool(re.search(r'gzip\s+on',config))
result['noindexConfigured']=bool(re.search(r'X-Robots-Tag[^;]*noindex',config,re.I))
result['certbotInstalled']=subprocess.run(['sh','-c','command -v certbot >/dev/null'],capture_output=True).returncode==0
result['serviceEnabled']=subprocess.run(['systemctl','is-enabled','--quiet','sporto'],capture_output=True).returncode==0
result['serviceActive']=subprocess.run(['systemctl','is-active','--quiet','sporto'],capture_output=True).returncode==0
active=subprocess.run(['systemctl','show','sporto','-p','WorkingDirectory','--value'],capture_output=True,text=True).stdout.strip()
result['managedReleaseActive']=active.startswith('/var/www/sporto-releases/sporto-')
result['productionEnvPresent']=Path('/var/www/sporto/.env.local').is_file()
version=subprocess.run(['nginx','-v'],capture_output=True,text=True)
match=re.search(r'nginx/[0-9.]+',version.stderr+version.stdout)
result['nginxVersion']=match.group(0) if match else 'unknown'
os_values={}
for line in Path('/etc/os-release').read_text().splitlines() if Path('/etc/os-release').is_file() else []:
    if '=' in line:
        name,value=line.split('=',1)
        if name in ('ID','VERSION_ID'):os_values[name]=value.strip('"')
result['operatingSystem']=os_values
result['sitesEnabledDirectoryPresent']=Path('/etc/nginx/sites-enabled').is_dir()
result['confDirectoryPresent']=Path('/etc/nginx/conf.d').is_dir()
# Output public routing directives only; never include certificate contents, passwords or full config.
result['serverNames']=sorted(set(re.findall(r'^\s*server_name\s+([A-Za-z0-9_. *\-]+);',config,re.M)))
result['listeners']=sorted(set(re.findall(r'^\s*listen\s+([A-Za-z0-9_. :\[\]\-]+);',config,re.M)))
result['appPort3000Mentioned']=bool(re.search(r'proxy_pass\s+http://(?:127\.0\.0\.1|localhost):3000\s*;',config))
# These are inventory flags across all nginx servers, not proof that the Sporto vhost is ready.
print(json.dumps(result,indent=2))
PY
