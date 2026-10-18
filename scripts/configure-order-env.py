#!/usr/bin/env python3
"""Interactive server-only configuration. No credentials in arguments or output."""
import base64,datetime,getpass,json,os,re,shlex,shutil,stat,tempfile,urllib.error,urllib.parse,urllib.request,sys
from pathlib import Path

PROJECT_HOST='ruvhllbbytjkxkzvusyb.supabase.co'
ENV_FILE=Path('/var/www/sporto/.env.local')

class SetupError(ValueError):
    """Only fixed, credential-free diagnostic messages may use this exception."""

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None

def read_values(contents):
    result={}
    for line in contents.splitlines():
        line=line.strip()
        if line.startswith('export '):line=line[7:]
        if not line or line.startswith('#') or '=' not in line:continue
        key,value=line.split('=',1)
        try:parts=shlex.split(value,comments=True);result[key.strip()]=parts[0] if parts else ''
        except ValueError:result[key.strip()]=''
    return result

def normalize_key(value):
    # Some terminals retain bracketed-paste mode during a hidden getpass prompt.
    value=value.strip()
    if value.startswith('\x1b[200~') and value.endswith('\x1b[201~'):
        value=value[6:-6].strip()
    if len(value)>1 and value[0]==value[-1] and value[0] in ('"',"'"):
        value=value[1:-1].strip()
    return value

def key_variable(key):
    if not key:raise SetupError('Получен пустой ввод. Вставь скопированный ключ через Command+V после приглашения и нажми Enter.')
    if key.startswith('sb_publishable_'):raise SetupError('Получен Publishable key. Нужен нижний ключ из раздела Secret keys.')
    if key.startswith('sb_secret_') and any(c in key for c in ('•','…','*')):
        raise SetupError('Получено скрытое отображение ключа с точками. Используй кнопку Copy API key, а не копирование текста поля.')
    if key.startswith('sb_secret_') and any(c.isspace() or ord(c)<32 for c in key):
        raise SetupError('При вставке появились пробелы или управляющие символы. Скопируй ключ заново через Copy API key и вставь один раз.')
    if re.fullmatch(r'sb_secret_[A-Za-z0-9_-]+',key):return 'SUPABASE_SECRET_KEY'
    if re.fullmatch(r'[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',key):
        try:payload=json.loads(base64.urlsafe_b64decode(key.split('.')[1]+'==='))
        except (ValueError,TypeError):payload={}
        if isinstance(payload,dict) and payload.get('role')=='service_role':return 'SUPABASE_SERVICE_ROLE_KEY'
    raise SetupError('Тип ключа не распознан. Скопируй целиком Secret key (sb_secret_...) или legacy service_role через кнопку Copy. Публичный ключ не подходит.')

def verify_key(url,key):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme!='https' or parsed.hostname!=PROJECT_HOST or parsed.username or parsed.password or parsed.port not in (None,443) or parsed.query or parsed.fragment or parsed.path not in ('','/'):
        raise SetupError('URL проекта в серверном env отсутствует или не соответствует HTTPS-проекту SPORTO. Ключ ещё не проверялся. Файл не изменён.')
    headers={'apikey':key}
    if not key.startswith('sb_secret_'):headers['Authorization']='Bearer '+key
    request=urllib.request.Request('https://'+PROJECT_HOST+'/rest/v1/order_requests?select=id&limit=0',headers=headers)
    try:
        with urllib.request.build_opener(NoRedirect()).open(request,timeout=15) as response:
            if response.status!=200 or json.loads(response.read(1024))!=[]:
                raise SetupError('Supabase вернул неожиданный ответ при проверке таблицы заявок. Файл не изменён.')
    except urllib.error.HTTPError as error:
        reasons={401:'Supabase отклонил ключ: проверь, что он целиком скопирован из проекта sporto-b2b и не отозван.',
                 403:'Supabase запретил доступ к таблице заявок. Нужно проверить права серверного ключа.',
                 404:'Supabase не нашёл таблицу заявок или REST-маршрут. Нужно проверить схему базы.'}
        raise SetupError('Проверка Supabase: HTTP '+str(error.code)+'. '+reasons.get(error.code,'Запрос к Supabase завершился ошибкой.')+' Файл не изменён.') from None
    except (urllib.error.URLError,TimeoutError):
        raise SetupError('Сервер не смог соединиться с Supabase: сеть, DNS, TLS или тайм-аут. Это не доказывает, что ключ неверный. Файл не изменён.') from None
    except (json.JSONDecodeError,UnicodeError):
        raise SetupError('Supabase вернул некорректный ответ. Файл не изменён.') from None

def env_value(value):
    # No dotenv interpolation or newlines; key/service/template/email formats use these characters.
    if value and not re.fullmatch(r'[A-Za-z0-9_@.+:/=\-]+',value):
        raise ValueError('Значение содержит неподдерживаемые символы. Файл не изменён.')
    return "'"+value+"'"

def update_contents(contents,updates):
    retained=[]
    for line in contents.splitlines():
        match=re.match(r'\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=',line)
        if not match or match.group(1) not in updates:retained.append(line)
    return '\n'.join(retained).rstrip()+'\n\n# Server order configuration\n'+''.join(k+'='+env_value(v)+'\n' for k,v in updates.items())

def apply_file(path,updates):
    if path.is_symlink():raise ValueError('Неожиданная символическая ссылка вместо env. Файл не изменён.')
    contents=path.read_text();updated=update_contents(contents,updates);metadata=path.stat()
    backup=path.with_name(path.name+'.before-orders-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    fd=os.open(backup,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'w') as stream:stream.write(contents)
    os.chown(backup,metadata.st_uid,metadata.st_gid)
    fd,temporary=tempfile.mkstemp(prefix='.order-env-',dir=path.parent)
    try:
        os.fchmod(fd,0o600);os.fchown(fd,metadata.st_uid,metadata.st_gid)
        with os.fdopen(fd,'w') as stream:stream.write(updated);stream.flush();os.fsync(stream.fileno())
        os.replace(temporary,path)
    finally:
        if os.path.exists(temporary):os.unlink(temporary)
    return backup

def main():
    # getpass must not fall back to an echoing stdin.
    with open('/dev/tty','r'):pass
    current=read_values(ENV_FILE.read_text())
    print('Настройка заявок SPORTO. Ключи вводятся скрыто; записи и письма не отправляются.')
    key=normalize_key(getpass.getpass('Supabase Secret key: '));variable=key_variable(key)
    print('Формат серверного ключа распознан. Проверяю доступ к Supabase...')
    verify_key(current.get('SUPABASE_URL') or current.get('NEXT_PUBLIC_SUPABASE_URL') or current.get('VITE_SUPABASE_URL') or '',key)
    updates={variable:key}
    if variable=='SUPABASE_SERVICE_ROLE_KEY':updates['SUPABASE_SECRET_KEY']=''
    print('Доступ к таблице заявок подтверждён запросом без чтения записей.')
    backup=apply_file(ENV_FILE,updates)
    print('Конфигурация сохранена с правами 600. Резервная копия: '+str(backup))
    print('Текущий релиз не изменён. Теперь нужен деплой, затем проверка сохранения и уведомлений.')

def email_main():
    with open('/dev/tty','r'):pass
    print('Настройка Resend для заявок. Письма не отправляются; домен отправителя должен быть подтверждён в Resend.')
    key=normalize_key(getpass.getpass('Resend API key: '))
    if not re.fullmatch(r're_[A-Za-z0-9_-]+',key):raise SetupError('Нужен полный API key Resend (re_...). Файл не изменён.')
    updates={'ORDER_EMAIL_PROVIDER':'resend','RESEND_API_KEY':key}
    for name,label in [('ORDER_EMAIL_FROM','Email отправителя на подтверждённом домене'),('ORDER_ADMIN_EMAIL','Email администратора для новых заявок'),('ORDER_EMAIL_REPLY_TO','Email для ответов клиентов')]:
        value=getpass.getpass(label+': ').strip()
        if not re.fullmatch(r'[A-Za-z0-9_.+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}',value):
            raise SetupError('Некорректный email в настройках уведомлений. Файл не изменён.')
        updates[name]=value
    backup=apply_file(ENV_FILE,updates)
    print('Настройки Resend сохранены с правами 600. Резервная копия: '+str(backup))
    print('Ключ и подтверждение домена ещё не проверены сервисом. Текущий релиз не изменён. После деплоя нужна проверка доставки писем.')

if __name__=='__main__':
    try:
        if sys.argv[1:]==['--email']:email_main()
        elif not sys.argv[1:]:main()
        else:raise SetupError('Неизвестные параметры запуска.')
    except KeyboardInterrupt:print('\nНастройка прервана.');raise SystemExit(130)
    except SetupError as error:print('Настройка не завершена. '+str(error));raise SystemExit(1)
    except Exception:print('Настройка не завершена. Проверь тип ключа, доступ к проекту и обязательные поля. Секреты не выводятся.');raise SystemExit(1)
