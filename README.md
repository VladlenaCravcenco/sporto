# SPORTO

Интернет-магазин на Next.js, TypeScript и Supabase. Публичные страницы — `app/`, интерфейс админки и общие компоненты — `src/app/`, серверные обработчики — `app/api/` и `api/`.

## Локальный запуск

```bash
npm ci
npm run next:dev
```

Сайт: http://localhost:3000. Заявки: http://localhost:3000/admin/requests.
Настройки перечислены в `.env.example`; локальные значения хранятся в `.env.local`.

## Проверка и публикация

```bash
npm run next:build
bash scripts/deploy-host.sh
```

Рабочий сайт: https://www.sporto.md. Деплой проверяет новую версию и сохраняет предыдущий релиз для отката. Не запускайте production-сборку одновременно с локальным dev-сервером.

Изменения базы выполняются отдельно через Supabase SQL Editor. Исторические SQL-скрипты вынесены из проекта; их удаление не меняет рабочую базу.

## Поддержка

- [Настройки и восстановление](docs/operations.md)
- [Письма о заявках](docs/email/setup.md)
- [Поиск каталога](docs/search-optimization.md)
- [Изображения](docs/image-optimization.md)
- [Авторство и лицензии](ATTRIBUTIONS.md)

Серверные ключи Supabase и Resend должны оставаться на сервере, без префиксов `VITE_` и `NEXT_PUBLIC_`. Не добавляйте `.env.local` и резервные копии с секретами в Git.
