#!/usr/bin/env bash
set -euo pipefail
# Update only the managed shipping-cost section; preserve the rest and keep a rollback file.
delivery_backup="${1:-}"
if [[ -n "$delivery_backup" && "$delivery_backup" != /var/backups/sporto-delivery/*.json ]]; then
  echo "Usage: bash scripts/update-delivery-host.sh [backup path for rollback]" >&2
  exit 1
fi
ssh -o ConnectTimeout=10 root@217.26.149.55 python3 - "$delivery_backup" <<'PY' 
import json,shlex,urllib.request,urllib.error,os,re,sys
from pathlib import Path
from datetime import datetime,timezone

def main():
    env={}
    for line in Path('/var/www/sporto/.env.local').read_text().splitlines():
        line=line.strip()
        if line.startswith('export '):line=line[7:]
        if not line or line.startswith('#') or '=' not in line:continue
        k,v=line.split('=',1);parts=shlex.split(v,comments=True);env[k.strip()]=parts[0] if parts else ''
    url=env.get('SUPABASE_URL') or env.get('NEXT_PUBLIC_SUPABASE_URL') or env.get('VITE_SUPABASE_URL')
    key=env.get('SUPABASE_SECRET_KEY') or env.get('SUPABASE_SERVICE_ROLE_KEY')
    if url!='https://ruvhllbbytjkxkzvusyb.supabase.co' or not key:raise ValueError('configuration')
    headers={'apikey':key,'Content-Type':'application/json'}
    if not key.startswith('sb_secret_'):headers['Authorization']='Bearer '+key
    endpoint=url+'/rest/v1/page_content?page=eq.legal%3Adelivery&key=eq.data'
    def request(method,body=None):
        req=urllib.request.Request(endpoint,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
        with urllib.request.urlopen(req,timeout=20) as response:return json.load(response) if method=='GET' else response.read()
    rows=request('GET')
    if len(rows)!=1:raise ValueError('expected one existing delivery row')
    original=rows[0]['value']
    rollback=sys.argv[1] if len(sys.argv)>1 else ''
    if rollback:
        saved=Path(rollback).resolve()
        if saved.parent!=Path('/var/backups/sporto-delivery') or saved.suffix!='.json':raise ValueError('backup path')
        record=json.loads(saved.read_text())
        if record.get('page')!='legal:delivery' or record.get('key')!='data':raise ValueError('backup record')
        restored=record['value'];json.loads(restored)
        request('PATCH',{'value':restored})
        if request('GET')[0]['value']!=restored:raise ValueError('rollback verification')
        print('Previous delivery text restored and verified.');return
    content=json.loads(original)
    sections={
      'content_ro':('## 3. Costuri de livrare','• **Republica Moldova**: 100 MDL pentru comenzi sub 500 MDL\n• **Republica Moldova**: GRATIS pentru comenzi de la 500 MDL inclusiv\n• **Instalare**: conform ofertei (pentru aparate de fitness)'),
      'content_ru':('## 3. Стоимость доставки','• **Вся Молдова**: 100 MDL при сумме заказа менее 500 MDL\n• **Вся Молдова**: БЕСПЛАТНО при сумме заказа от 500 MDL включительно\n• **Установка**: по коммерческому предложению (для тренажёров)')}
    for field,(heading,body) in sections.items():
        # Stored content can contain literal backslash-n separators.
        text=content[field];sep='\n' if '\n' in text else '\\n'
        normalized=text.replace('\\n','\n') if sep=='\\n' else text
        pattern=re.escape(heading)+r'\n.*?(?=\n## |\Z)'
        normalized,n=re.subn(pattern,lambda _:heading+'\n\n'+body+'\n',normalized,flags=re.S)
        if n!=1:raise ValueError('delivery section missing or ambiguous')
        content[field]=normalized.replace('\n','\\n') if sep=='\\n' else normalized
    updated=json.dumps(content,ensure_ascii=False)
    if json.loads(original)==content:
        print('Delivery policy already matches. No changes.');return
    folder=Path('/var/backups/sporto-delivery');folder.mkdir(mode=0o700,parents=True,exist_ok=True)
    backup=folder/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+str(os.getpid())+'.json')
    with open(backup,'x',encoding='utf-8') as f:
        os.chmod(backup,0o600);json.dump({'page':'legal:delivery','key':'data','value':original},f,ensure_ascii=False)
    request('PATCH',{'value':updated})
    if request('GET')[0]['value']!=updated:raise ValueError('verification')
    print('RO/RU delivery costs updated and verified. Backup: '+str(backup))
try:main()
except Exception:
    print('Update failed. No secrets shown. Check configuration, access and delivery section headings.')
    raise SystemExit(1)
PY
