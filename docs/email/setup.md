# Письма о заявках

Заявка сначала сохраняется в Supabase, затем сервер отправляет уведомления клиенту и администратору через Resend. Шаблоны находятся в `api/order-request.ts`: клиентский — на языке формы, административный — на русском.

В `/var/www/sporto/.env.local` нужны:

```dotenv
ORDER_EMAIL_PROVIDER=resend
RESEND_API_KEY=...
ORDER_EMAIL_FROM=orders@mail.sporto.md
ORDER_ADMIN_EMAIL=sportoadmin@gmail.com
ORDER_EMAIL_REPLY_TO=sportoadmin@gmail.com
```

Домен отправителя должен быть подтверждён в Resend. Ключи вводятся скрыто:

```bash
bash scripts/configure-order-host.sh --email
bash scripts/deploy-host.sh
bash scripts/check-order-host.sh
```

Supabase Auth отправляет письма входа и регистрации отдельно от уведомлений о заявках. Ошибка отправки уведомления не отменяет уже сохранённую заявку; при проверке доставки смотрите также журнал Resend.
