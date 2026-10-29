import { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { EMAILJS, isEmailConfigured } from '../../lib/emailService';

const HTML_WELCOME = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px}
.box{background:#fff;max-width:560px;margin:0 auto;border:1px solid #e0e0e0}
.header{background:#000;padding:28px;text-align:center}
.header h1{color:#fff;margin:0;font-size:20px;letter-spacing:3px}
.header p{color:#666;font-size:11px;margin:6px 0 0;letter-spacing:2px}
.body{padding:28px}
.btn{display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:20px 0}
.link-box{background:#f5f5f5;border:1px solid #e0e0e0;padding:10px 14px;font-size:11px;color:#666;word-break:break-all;margin-top:8px}
.footer{padding:16px 28px;font-size:11px;color:#bbb;text-align:center;border-top:1px solid #f0f0f0}
</style></head>
<body>
<div class="box">
  <div class="header">
    <h1>SPORTOSFERA</h1>
    <p>B2B СПОРТИВНОЕ ОБОРУДОВАНИЕ</p>
  </div>
  <div class="body">
    <p style="font-size:15px;color:#111;margin:0 0 12px">Здравствуйте, <strong>{{to_name}}</strong>!</p>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 20px">
      Добро пожаловать в SPORTOSFERA — оптовую платформу спортивного оборудования.<br>
      Ваш аккаунт создан. Для завершения регистрации подтвердите ваш email:
    </p>
    <div style="text-align:center">
      <a href="{{verification_link}}" class="btn">Подтвердить email →</a>
    </div>
    <p style="font-size:12px;color:#999;margin:16px 0 4px">Или скопируйте ссылку в браузер:</p>
    <div class="link-box">{{verification_link}}</div>
    <p style="font-size:11px;color:#bbb;margin:16px 0 0">
      Ссылка действительна 48 часов. Если вы не регистрировались — просто проигнорируйте это письмо.
    </p>
  </div>
  <div class="footer">
    SPORTOSFERA S.R.L. · <a href="{{site_url}}" style="color:#bbb">sporto.md</a>
  </div>
</div>
</body></html>`;

const HTML_ORDER_ADMIN = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px}
.box{background:#fff;max-width:560px;margin:0 auto;border:1px solid #e0e0e0}
.header{background:#000;padding:20px 28px}
.header h1{color:#fff;margin:0;font-size:16px;letter-spacing:2px}
.section{padding:20px 28px;border-bottom:1px solid #f0f0f0}
.label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.value{font-size:14px;color:#111}
.grid{display:flex;gap:32px;margin-top:10px}
.items{background:#f9f9f9;padding:16px;font-size:12px;white-space:pre-wrap;color:#333;line-height:1.8;margin-top:8px}
.total{background:#000;color:#fff;padding:12px 28px;display:flex;justify-content:space-between;align-items:center}
.btn{display:inline-block;background:#000;color:#fff;text-decoration:none;padding:10px 24px;font-size:12px;letter-spacing:1px;margin-top:16px}
.footer{padding:14px 28px;font-size:11px;color:#999;text-align:center}
</style></head>
<body>
<div class="box">
  <div class="header">
    <h1>📦 НОВАЯ ЗАЯВКА — SPORTOSFERA</h1>
  </div>

  <div class="section">
    <div class="label">Номер заявки / Дата</div>
    <div class="value">#{{order_id}} &nbsp;·&nbsp; {{order_date}}</div>
  </div>

  <div class="section">
    <div class="label">Клиент</div>
    <div class="value">{{client_name}}</div>
    <div style="margin-top:10px">
      <div class="label">Компания</div>
      <div class="value">{{client_company}}</div>
    </div>
    <div class="grid">
      <div>
        <div class="label">Email</div>
        <div class="value">{{client_email}}</div>
      </div>
      <div>
        <div class="label">Телефон</div>
        <div class="value">{{client_phone}}</div>
      </div>
    </div>
    <div style="margin-top:10px">
      <div class="label">Адрес доставки</div>
      <div class="value">{{delivery_address}}</div>
    </div>
    <div style="margin-top:10px">
      <div class="label">Примечание</div>
      <div class="value">{{notes}}</div>
    </div>
  </div>

  <div class="section">
    <div class="label">Товары — {{total_items}} позиций</div>
    <div class="items">{{items_list}}</div>
  </div>

  <div class="total">
    <span style="font-size:12px;letter-spacing:1px">ИТОГО</span>
    <span style="font-size:20px">{{total_price}} MDL</span>
  </div>

  <div class="section" style="text-align:center">
    <a href="{{admin_url}}" class="btn">Открыть в админпанели →</a>
  </div>

  <div class="footer">SPORTOSFERA S.R.L. · sporto.md</div>
</div>
</body></html>`;

export function AdminEmailSetup() {
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen]     = useState<string | null>('t1');

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const configured = isEmailConfigured();

  const ENV_EXAMPLE = [
    'VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxx',
    'VITE_EMAILJS_SERVICE_ID=service_odgatyo',
    'VITE_EMAILJS_TEMPLATE_WELCOME=template_xxxxxxx',
    'VITE_EMAILJS_TEMPLATE_ADMIN=template_xxxxxxx',
    'VITE_ADMIN_EMAIL=sportoadmin@gmail.com',
  ].join('\n');

  const TEMPLATES = [
    {
      id:      't1',
      badge:   'Template 1',
      title:   'Подтверждение регистрации',
      who:     'Клиенту — сразу после регистрации',
      to:      '{{to_email}}',
      subject: 'Добро пожаловать в SPORTOSFERA — подтвердите email',
      html:    HTML_WELCOME,
      vars: [
        { v: '{{to_email}}',          d: 'email клиента' },
        { v: '{{to_name}}',           d: 'имя клиента' },
        { v: '{{verification_link}}', d: 'ссылка для подтверждения' },
        { v: '{{site_url}}',          d: 'адрес сайта' },
      ],
    },
    {
      id:      't2',
      badge:   'Template 2',
      title:   'Уведомление о новой заявке',
      who:     'Вам (админу) — при каждой новой заявке',
      to:      '{{to_email}}',
      subject: '📦 Новая заявка #{{order_id}} — {{client_name}}',
      html:    HTML_ORDER_ADMIN,
      vars: [
        { v: '{{to_email}}',         d: 'ваш email (admin)' },
        { v: '{{order_id}}',         d: 'номер заявки' },
        { v: '{{order_date}}',       d: 'дата и время' },
        { v: '{{client_name}}',      d: 'имя клиента' },
        { v: '{{client_email}}',     d: 'email клиента' },
        { v: '{{client_phone}}',     d: 'телефон' },
        { v: '{{client_company}}',   d: 'компания' },
        { v: '{{delivery_address}}', d: 'адрес доставки' },
        { v: '{{notes}}',            d: 'примечание' },
        { v: '{{total_items}}',      d: 'кол-во позиций' },
        { v: '{{total_price}}',      d: 'сумма MDL' },
        { v: '{{items_list}}',       d: 'список товаров' },
        { v: '{{admin_url}}',        d: 'ссылка в админку' },
      ],
    },
  ];

  return (
    <div className="admin-section">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="admin-section-heading">
          <Mail className="w-5 h-5 admin-muted" />
          <div>
            <h1 className="text-sm admin-ink">Настройка EmailJS</h1>
            <p className="text-xs admin-muted mt-0.5">2 шаблона · service_odgatyo · ~10 минут</p>
          </div>
          {configured ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Настроено
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Не настроено
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px admin-muted-surface border admin-border mb-6">
          {[
            { n: '1', t: 'Сервис уже подключён', sub: 'service_odgatyo · Gmail' },
            { n: '2', t: 'Создать Template 1', sub: 'Welcome · регистрация' },
            { n: '3', t: 'Создать Template 2', sub: 'Order Admin · заявки' },
            { n: '4', t: 'Добавить .env', sub: '5 переменных' },
          ].map(s => (
            <div key={s.n} className="admin-surface p-4">
              <div className="text-xs admin-muted mb-1">Шаг {s.n}</div>
              <div className="text-xs admin-ink">{s.t}</div>
              <div className="text-xs admin-muted mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-6">
          {TEMPLATES.map(tpl => (
            <div key={tpl.id} className="admin-surface border admin-border">

              <button
                onClick={() => setOpen(open === tpl.id ? null : tpl.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left admin-hover-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs admin-on-solid admin-solid px-2 py-0.5 ">{tpl.badge}</span>
                  <div>
                    <div className="text-sm admin-ink">{tpl.title}</div>
                    <div className="text-xs admin-muted mt-0.5">{tpl.who}</div>
                  </div>
                </div>
                {open === tpl.id
                  ? <ChevronUp className="w-4 h-4 admin-muted flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 admin-muted flex-shrink-0" />
                }
              </button>

              {open === tpl.id && (
                <div className="border-t admin-border px-5 pb-6 pt-4 space-y-5">

                  <div className="admin-canvas border admin-border p-4 text-xs admin-muted leading-relaxed">
                    <span className="admin-ink">Как создать: </span>
                    <a href="https://dashboard.emailjs.com/admin/templates" target="_blank" rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-1">
                      EmailJS Dashboard → Email Templates <ExternalLink className="w-3 h-3" />
                    </a>
                    {' '}→ <strong>Create New Template</strong> → вставьте данные ниже → <strong>Save</strong>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'To Email', val: tpl.to,      key: `to-${tpl.id}` },
                      { label: 'Subject',  val: tpl.subject,  key: `sub-${tpl.id}` },
                    ].map(f => (
                      <div key={f.key}>
                        <p className="text-xs admin-muted   mb-1">{f.label}</p>
                        <div className="flex items-center gap-2 admin-canvas border admin-border px-3 py-2">
                          <code className="text-xs admin-ink flex-1 truncate">{f.val}</code>
                          <button onClick={() => copy(f.val, f.key)}
                            className="admin-muted admin-hover-ink transition-colors flex-shrink-0">
                            {copied === f.key
                              ? <Check className="w-3 h-3 text-green-500" />
                              : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs admin-muted  ">
                        HTML Body — вставьте в поле <strong>Content</strong>
                      </p>
                      <button onClick={() => copy(tpl.html, `html-${tpl.id}`)}
                        className="flex items-center gap-1.5 text-xs admin-solid admin-on-solid px-3 py-1.5 admin-hover-solid transition-colors">
                        {copied === `html-${tpl.id}`
                          ? <><Check className="w-3 h-3" /> Скопировано</>
                          : <><Copy className="w-3 h-3" /> Скопировать HTML</>}
                      </button>
                    </div>
                    <pre className="admin-canvas border admin-border p-3 text-xs admin-muted overflow-x-auto max-h-36 leading-relaxed select-all">
                      {tpl.html}
                    </pre>
                  </div>

                  <div>
                    <p className="text-xs admin-muted   mb-2">
                      Переменные в шаблоне
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {tpl.vars.map(v => (
                        <div key={v.v} className="flex items-center gap-2 px-3 py-1.5 admin-canvas border admin-border">
                          <code className="text-xs admin-ink flex-shrink-0">{v.v}</code>
                          <span className="text-xs admin-muted">— {v.d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

        <div className="admin-surface border admin-border">
          <div className="px-5 py-4 border-b admin-border">
            <p className="text-sm admin-ink">Переменные окружения (.env)</p>
            <p className="text-xs admin-muted mt-0.5">
              После создания шаблонов — добавьте в <code className="admin-muted-surface px-1">.env</code> или Vercel → Environment Variables
            </p>
          </div>
          <div className="p-5 space-y-3">

            {[
              { key: 'VITE_EMAILJS_PUBLIC_KEY',       hint: 'EmailJS Dashboard → Account → General → Public Key',   current: EMAILJS.publicKey },
              { key: 'VITE_EMAILJS_SERVICE_ID',        hint: 'Уже известен: service_odgatyo',                        current: EMAILJS.serviceId },
              { key: 'VITE_EMAILJS_TEMPLATE_WELCOME',  hint: 'Template ID шаблона 1 (template_xxxxxxx)',             current: EMAILJS.tplWelcome },
              { key: 'VITE_EMAILJS_TEMPLATE_ADMIN',    hint: 'Template ID шаблона 2 (template_xxxxxxx)',             current: EMAILJS.tplAdmin },
              { key: 'VITE_ADMIN_EMAIL',               hint: 'Ваш email — куда приходят уведомления о заявках',     current: EMAILJS.adminEmail },
            ].map(({ key, hint, current }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <code className="text-xs admin-ink">{key}</code>
                  {current && current !== '' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Задан
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 admin-canvas border admin-border px-3 py-2">
                  <code className="text-xs admin-muted flex-1">{key}=ваш_ключ_здесь</code>
                  <button onClick={() => copy(`${key}=`, key)}
                    className="admin-muted admin-hover-ink transition-colors flex-shrink-0">
                    {copied === key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs admin-muted mt-1">{hint}</p>
              </div>
            ))}

            <div className="pt-2 border-t admin-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs admin-muted  ">Скопировать шаблон .env</p>
                <button onClick={() => copy(ENV_EXAMPLE, 'envall')}
                  className="flex items-center gap-1.5 text-xs admin-solid admin-on-solid px-3 py-1.5 admin-hover-solid transition-colors">
                  {copied === 'envall'
                    ? <><Check className="w-3 h-3" /> Скопировано</>
                    : <><Copy className="w-3 h-3" /> Скопировать</>}
                </button>
              </div>
              <pre className="admin-canvas border admin-border p-3 text-xs admin-muted leading-relaxed select-all">
                {ENV_EXAMPLE}
              </pre>
            </div>
          </div>
        </div>

        {configured && (
          <div className="mt-4 admin-solid admin-on-solid p-5 flex items-start gap-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm mb-1">Всё настроено!</p>
              <p className="text-xs admin-muted leading-relaxed">
                При регистрации клиент получит письмо с подтверждением.
                При каждой новой заявке вам придёт уведомление на <strong>{EMAILJS.adminEmail}</strong>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
