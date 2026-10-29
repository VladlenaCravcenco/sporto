import ast,base64,json,tempfile
from pathlib import Path
source=Path('scripts/check-order-host.sh').read_text().split("<<'PY'\n",1)[1].rsplit('\nPY',1)[0]
module=ast.parse(source)
read_only=ast.Module(body=[node for node in module.body if isinstance(node,(ast.Import,ast.ImportFrom,ast.FunctionDef))],type_ignores=[])
namespace={}
exec(compile(read_only,'check-order-host','exec'),namespace)
inspect=namespace['inspect']
with tempfile.TemporaryDirectory(prefix='sporto-host-config-') as directory:
    path=Path(directory)/'.env.local'
    assert inspect(path)=={'filePresent':False}
    secret='SECRET_VALUE_MUST_NOT_APPEAR'
    path.write_text('SUPABASE_SERVICE_ROLE_KEY="'+secret+'"\nexport NEXT_PUBLIC_SUPABASE_URL=https://example.invalid\nVITE_EMAILJS_SERVICE_ID=service\nVITE_EMAILJS_PUBLIC_KEY="public#key"\nEMAILJS_TEMPLATE_ORDER_CONFIRMATION=customer\nVITE_EMAILJS_TEMPLATE_ADMIN=admin\nVITE_ADMIN_EMAIL=qa@example.invalid\n')
    result=inspect(path)
    assert result['serverKeyPresent'] and result['supabaseUrlPresent'] and not result['publicKeyUsedAsServerKey']
    assert all(value for key,value in result['email'].items() if key!='privateKeyOptional')
    encoded=json.dumps(result)
    assert secret not in encoded and 'qa@example.invalid' not in encoded and 'public#key' not in encoded
    payload=base64.urlsafe_b64encode(json.dumps({'role':'anon'}).encode()).decode().rstrip('=')
    path.write_text('SUPABASE_SERVICE_ROLE_KEY=head.'+payload+'.signature\n')
    assert inspect(path)['publicKeyUsedAsServerKey']
    path.write_text('SUPABASE_SERVICE_ROLE_KEY=sb_publishable_fake\nEMAILJS_SERVICE_ID= # not configured\n')
    result=inspect(path)
    assert result['publicKeyUsedAsServerKey'] and not result['email']['service']
print('PASS: host checker parses source/release env without revealing credentials or addresses; public/anon detection and supported email aliases.')
