#!/usr/bin/env bash
set -euo pipefail
# Read-only: presence flags only. Neither secrets nor recipient addresses are printed.
order_target="root@217.26.149.55"
ssh -o ConnectTimeout=10 "$order_target" python3 - <<'PY'
import base64,json,shlex,subprocess
from pathlib import Path

def inspect(path):
    if not path.is_file(): return {'filePresent':False}
    values={}
    for line in path.read_text().splitlines():
        line=line.strip()
        if line.startswith('export '):line=line[7:]
        if not line or line.startswith('#') or '=' not in line:continue
        key,value=line.split('=',1)
        try:parts=shlex.split(value,comments=True);values[key.strip()]=parts[0] if parts else ''
        except ValueError:values[key.strip()]=''
    present=lambda *keys:any(bool(values.get(k,'').strip()) for k in keys)
    key=values.get('SUPABASE_SECRET_KEY') or values.get('SUPABASE_SERVICE_ROLE_KEY','')
    public=key.startswith('sb_publishable_')
    if key.count('.')==2:
        try:public=public or json.loads(base64.urlsafe_b64decode(key.split('.')[1]+'===')) .get('role')=='anon'
        except (ValueError,TypeError,AttributeError):pass
    return {'filePresent':True,'serverKeyPresent':present('SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY'),'publicKeyUsedAsServerKey':public,'supabaseUrlPresent':present('SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','VITE_SUPABASE_URL'),'resend':{'selected':values.get('ORDER_EMAIL_PROVIDER')=='resend','apiKey':present('RESEND_API_KEY'),'sender':present('ORDER_EMAIL_FROM'),'replyTo':present('ORDER_EMAIL_REPLY_TO'),'adminRecipient':present('ORDER_ADMIN_EMAIL','VITE_ADMIN_EMAIL')},'email':{'service':present('EMAILJS_SERVICE_ID','VITE_EMAILJS_SERVICE_ID'),'publicKey':present('EMAILJS_PUBLIC_KEY','VITE_EMAILJS_PUBLIC_KEY'),'privateKeyOptional':present('EMAILJS_PRIVATE_KEY'),'customerTemplate':present('EMAILJS_TEMPLATE_ORDER_CONFIRMATION'),'adminTemplate':present('EMAILJS_TEMPLATE_ADMIN','VITE_EMAILJS_TEMPLATE_ADMIN'),'adminRecipient':present('ORDER_ADMIN_EMAIL','VITE_ADMIN_EMAIL')}}
active=subprocess.check_output(['systemctl','show','sporto','-p','WorkingDirectory','--value'],text=True).strip()
result={'sourceConfig':inspect(Path('/var/www/sporto/.env.local'))}
if active and active.startswith('/var/www/sporto'):
    result['runningReleaseConfig']=inspect(Path(active)/'.env.local')
else:result['runningReleaseConfig']={'filePresent':False,'unexpectedWorkingDirectory':True}
print(json.dumps(result,indent=2))
PY
