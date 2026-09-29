# Проверка security migration на staging

Forward migration: `src/database/2026-08-20_harden_public_access.sql`  
Emergency rollback: `src/database/2026-08-20_harden_public_access_rollback.sql`

Не запускать forward migration напрямую в production. Rollback восстанавливает небезопасную модель доступа и предназначен только для аварийного восстановления staging.

## До запуска

- [ ] Создать отдельный закрытый Supabase staging project или безопасную копию production schema/data без реальных персональных данных.
- [ ] Подтвердить, что Auth содержит тестового администратора `sporto-admin@gmail.com` и отдельного обычного пользователя.
- [ ] Сохранить экспорт `pg_policies`, table/function grants и Storage policies staging.
- [ ] Подтвердить наличие таблиц, перечисленных в migration, и buckets `brand-logos`, `product-images`.
- [ ] Убедиться, что staging использует отдельные URL/anon key и не связан с production frontend.

## Запуск

1. Открыть staging Supabase → SQL Editor.
2. Выполнить `2026-08-20_harden_public_access.sql` целиком одной транзакцией.
3. Сохранить вывод SQL Editor. При любой ошибке не выполнять отдельные фрагменты вручную: исправить причину и повторить файл целиком.

## Проверка доступа

- [ ] Без сессии читаются активные `products`, публичный контент и публичные изображения.
- [ ] Без сессии не читаются неактивные `products`.
- [ ] `anon` не может INSERT/UPDATE/DELETE в десяти защищённых public-таблицах.
- [ ] `anon` не может загружать, изменять или удалять объекты в `brand-logos` и `product-images`.
- [ ] Обычный authenticated user читает публичные данные, но не может выполнять admin INSERT/UPDATE/DELETE.
- [ ] Обычный authenticated user не может загружать, изменять или удалять файлы.
- [ ] `sporto-admin@gmail.com` может создавать, редактировать и удалять товар, атрибут, категорию, бренд, баннер, FAQ и page content.
- [ ] Администратор может загрузить и заменить brand logo и product image.
- [ ] `PUBLIC`, `anon` и `authenticated` не имеют EXECUTE на `public.rls_auto_enable()`.

## Функциональный smoke test

- [ ] Открываются Home, Catalog, ProductDetail, BrandPage, About, turnkey и maintenance на `ro` и `ru`.
- [ ] Работают поиск, фильтры, категории, подкатегории и динамические характеристики товара.
- [ ] Работают admin login, список товаров, импорт, CRUD контента и Storage uploads.
- [ ] Регистрация, вход и редактирование собственного client profile не сломаны.
- [ ] Order request создаётся через защищённый API endpoint; admin видит и меняет его статус.
- [ ] В console/network нет RLS errors для разрешённых операций.

## Решение о production

- [ ] Повторно экспортировать policies/grants после теста и приложить к результатам staging.
- [ ] Зафиксировать commit/deployment, результаты тестов и процедуру отката.
- [ ] Получить отдельное подтверждение перед применением к production.
- [ ] После production deployment немедленно повторить access tests и smoke test.

