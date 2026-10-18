import importlib.util, tempfile, stat, base64, json
from pathlib import Path
from unittest.mock import patch, mock_open
from urllib.error import HTTPError, URLError
spec=importlib.util.spec_from_file_location('helper', 'scripts/configure-order-env.py')
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
assert helper.key_variable('sb_secret_TEST')=='SUPABASE_SECRET_KEY'
assert helper.normalize_key('\x1b[200~sb_secret_TEST\x1b[201~')=='sb_secret_TEST'
assert helper.normalize_key(' "sb_secret_TEST" ')=='sb_secret_TEST'
for invalid,reason in [('', 'пустой'),('sb_publishable_TEST','Publishable'),('sb_secret_TEST•••','скрытое'),('sb_secret_TEST\t','символы')]:
    try: helper.key_variable(invalid)
    except helper.SetupError as error: assert reason in str(error)
    else: raise AssertionError('Invalid pasted input accepted')
payload=base64.urlsafe_b64encode(json.dumps({'role':'service_role'}).encode()).decode().rstrip('=')
assert helper.key_variable('header.'+payload+'.signature')=='SUPABASE_SERVICE_ROLE_KEY'
for invalid in ['sb_publishable_TEST','invalid','header.eyJyb2xlIjoiYW5vbiJ9.signature']:
    try: helper.key_variable(invalid)
    except ValueError: pass
    else: raise AssertionError('Public or invalid key accepted')
for url in ['http://'+helper.PROJECT_HOST,'https://example.invalid','https://'+helper.PROJECT_HOST+'/other','https://'+helper.PROJECT_HOST+'?redirect=1']:
    try: helper.verify_key(url,'sb_secret_TEST')
    except ValueError: pass
    else: raise AssertionError('Untrusted destination accepted')
for value in ['x\ny','$SECRET','$(command)',"a'b"]:
    try: helper.env_value(value)
    except ValueError: pass
    else: raise AssertionError('Unsafe dotenv value accepted')
for failure,expected in [(HTTPError('https://example.invalid/SECRET',401,'SECRET',{},None),'HTTP 401'),
                         (HTTPError('https://example.invalid/SECRET',403,'SECRET',{},None),'HTTP 403'),
                         (HTTPError('https://example.invalid/SECRET',404,'SECRET',{},None),'HTTP 404'),
                         (URLError('SECRET'),'DNS'),(TimeoutError('SECRET'),'тайм-аут')]:
    with patch.object(helper.urllib.request,'build_opener') as opener:
        opener.return_value.open.side_effect=failure
        try: helper.verify_key('https://'+helper.PROJECT_HOST,'sb_secret_SECRET')
        except helper.SetupError as error:
            assert expected in str(error)
            assert 'SECRET' not in str(error)
        else: raise AssertionError('Failed request accepted')
with tempfile.TemporaryDirectory() as directory:
    path=Path(directory)/'.env.local'
    original='# Existing configuration\nOTHER=value\nSUPABASE_SECRET_KEY=old\n'
    path.write_text(original)
    backup=helper.apply_file(path,{'SUPABASE_SECRET_KEY':'sb_secret_TEST'})
    assert backup.read_text()==original
    assert helper.read_values(path.read_text())=={'OTHER':'value','SUPABASE_SECRET_KEY':'sb_secret_TEST'}
    assert stat.S_IMODE(path.stat().st_mode)==0o600
    assert stat.S_IMODE(backup.stat().st_mode)==0o600
    before=path.read_text()
    try: helper.apply_file(path,{'SUPABASE_SECRET_KEY':'bad\nvalue'})
    except ValueError: pass
    else: raise AssertionError('Invalid value accepted')
    assert path.read_text()==before
    link=Path(directory)/'linked';link.symlink_to(path)
    try: helper.apply_file(link,{'SUPABASE_SECRET_KEY':'sb_secret_TEST'})
    except ValueError: pass
    else: raise AssertionError('Symlink accepted')
    original=path.read_text()
    with patch.object(helper,'ENV_FILE',path), patch.object(helper.getpass,'getpass',side_effect=['re_TEST','orders@example.invalid','admin@example.invalid','support@example.invalid']), patch('builtins.open',mock_open()), patch('builtins.print') as output:
        helper.email_main()
        assert 're_TEST' not in str(output.call_args_list)
    values=helper.read_values(path.read_text())
    assert values['ORDER_EMAIL_PROVIDER']=='resend'
    assert values['SUPABASE_SECRET_KEY']=='sb_secret_TEST'
    assert values['ORDER_ADMIN_EMAIL']=='admin@example.invalid'
    before=path.read_text()
    with patch.object(helper,'ENV_FILE',path), patch.object(helper.getpass,'getpass',side_effect=['re_TEST','invalid']), patch('builtins.open',mock_open()), patch('builtins.print'):
        try: helper.email_main()
        except helper.SetupError: pass
        else: raise AssertionError('Invalid email accepted')
    assert path.read_text()==before
print('PASS: server key types, HTTPS project restriction, safe dotenv, exact backup, permissions, unchanged file on invalid input. No network requests.')
