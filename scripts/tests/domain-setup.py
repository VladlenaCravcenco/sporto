"""Run the installation transaction entirely in a temporary filesystem with mocked services."""
import os,tempfile,subprocess,shutil
from pathlib import Path
source=Path('scripts/prepare-domain-server.sh').read_text()
config=Path('scripts/nginx/sporto-domain.conf').read_text()
assert 'listen 443 ssl http2' in config
assert 'server_name www.sporto.md;' in config
assert 'location ^~ /.well-known/acme-challenge/' in config
assert 'default "";' in config and 'noindex, nofollow' in config
assert 'proxy_set_header X-Forwarded-Proto $scheme;' in config
assert '--retry-connrefused' in source and '--retry-max-time 20' in source

for failure in ['', 'noindex', 'http2', 'config', 'not-loaded']:
 with tempfile.TemporaryDirectory(prefix='sporto-domain-test-') as temporary:
  root=Path(temporary);bin_dir=root/'bin';bin_dir.mkdir()
  mappings={'/etc/nginx':str(root/'nginx'),'/etc/letsencrypt':str(root/'certs'),'/var/backups/sporto-domain':str(root/'backups'),'/var/www/sporto-acme':str(root/'acme'),'/run/lock/sporto-deploy.lock':str(root/'deploy.lock')}
  script=source
  for original,replacement in mappings.items():script=script.replace(original,replacement)
  (root/'run.sh').write_text(script);(root/'sporto-domain.conf').write_text(config)
  target=root/'nginx/conf.d/sporto-domain.conf';target.parent.mkdir(parents=True)
  original='# Managed by SPORTO domain setup.\n# previous fixture\n'
  target.write_text(original)
  cert=root/'certs/live/sporto.md';cert.mkdir(parents=True)
  for name in ['fullchain.pem','privkey.pem']:(cert/name).write_text('fixture')
  mocks={
   'id':'#!/bin/sh\necho 0\n',
   'flock':'#!/bin/sh\nexit 0\n',
   'systemctl':'#!/bin/sh\nexit 0\n',
   'openssl':'#!/bin/sh\necho "Hostname does match certificate"\n',
   'nginx':'''#!/bin/sh
if [ "$1" = -T ]; then
 if [ "$FAILURE" = not-loaded ]; then echo '# configuration file fixture:'; else echo "# configuration file $TEST_TARGET:"; fi
 exit 0
fi
if [ "$FAILURE" = config ] && grep -q 'server_name www.sporto.md' "$TEST_TARGET"; then exit 1; fi
exit 0
''',
   'curl':'''#!/usr/bin/env python3
import sys,os
from pathlib import Path
a=sys.argv[1:];url=next(x for x in a if x.startswith(('http://','https://')))
if '-w' in a:
 print('1.1' if os.environ['FAILURE']=='http2' else '2',end='');raise SystemExit()
if '-o' in a and a[a.index('-o')+1]!='/dev/null':Path(a[a.index('-o')+1]).write_text('SPORTO')
if '-D' in a:
 headers='HTTP/2 200\\n'
 if url.startswith('https://sporto.md') or url.startswith('http://www.sporto.md'):headers='HTTP/1.1 308\\nlocation: https://www.sporto.md/ru\\n'
 if url.startswith('http://127.0.0.1') or os.environ['FAILURE']=='noindex':headers+='X-Robots-Tag: noindex, nofollow\\n'
 Path(a[a.index('-D')+1]).write_text(headers)
'''}
  for name,contents in mocks.items():p=bin_dir/name;p.write_text(contents);p.chmod(0o755)
  env={**os.environ,'PATH':str(bin_dir)+os.pathsep+os.environ['PATH'],'FAILURE':failure,'TEST_TARGET':str(target)}
  result=subprocess.run(['bash',str(root/'run.sh')],env=env,capture_output=True,text=True)
  assert result.returncode==(0 if not failure else 1),(failure,result.stdout,result.stderr)
  assert target.read_text()==(config if not failure else original),failure
  backups=list((root/'backups').glob('*/previous-domain.conf'))
  assert len(backups)==1 and backups[0].read_text()==original
print('PASS: domain config transaction, protected backup, nginx syntax failure/HTTP2/noindex failures restore previous file. All services/network mocked; no server changes.')
