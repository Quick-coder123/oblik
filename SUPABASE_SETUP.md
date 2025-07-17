# Інструкції для налаштування Supabase

## 1. Створення проєкту в Supabase

1. Перейдіть на [https://supabase.com](https://supabase.com)
2. Зареєструйтесь або увійдіть в акаунт
3. Натисніть "New Project"
4. Заповніть дані проєкту:
   - Organization: оберіть вашу організацію
   - Project name: `oblik-clients`
   - Database password: створіть надійний пароль
   - Region: оберіть найближчий регіон
5. Натисніть "Create new project"

## 2. Налаштування бази даних

1. Відкрийте ваш проєкт в Supabase
2. Перейдіть в розділ "SQL Editor"
3. Створіть новий запит та скопіюйте вміст файлу `supabase-setup.sql`
4. Виконайте запит (кнопка "Run")

## 3. Налаштування конфігурації

1. В проєкті Supabase перейдіть в "Settings" → "API"
2. Скопіюйте наступні дані:
   - **Project URL** (щось на кшталт: `https://your-project.supabase.co`)
   - **anon public key** (довгий ключ, який починається з `eyJ...`)

3. Відкрийте файл `supabase-config.js` та замініть:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Замініть на ваш URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Замініть на ваш ключ
   ```

## 4. Налаштування безпеки (опційно)

Якщо потрібна аутентифікація:

1. Перейдіть в "Authentication" → "Settings"
2. Налаштуйте провайдерів аутентифікації (Email, Google, тощо)
3. Оновіть політики RLS в `supabase-setup.sql` відповідно до ваших потреб

## 5. Тестування

1. Відкрийте сайт в браузері
2. Спробуйте додати нового клієнта
3. Перевірте, чи з'являються дані в Supabase Dashboard → "Table Editor" → "clients"

## 6. Налаштування домену (для продакшн)

1. В Supabase перейдіть в "Settings" → "Custom Domains"
2. Додайте ваш домен та налаштуйте DNS записи
3. Оновіть CORS налаштування якщо потрібно

## Fallback режим

Якщо Supabase недоступний, система автоматично переключається на:
1. Локальне збереження (localStorage)
2. Резервний файл data.json

## Структура таблиці clients

| Поле | Тип | Опис |
|------|-----|------|
| id | SERIAL | Унікальний ідентифікатор |
| name | VARCHAR(255) | ПІБ клієнта |
| inn | VARCHAR(50) | ІПН (унікальний) |
| org | VARCHAR(255) | Організація |
| open_date | VARCHAR(10) | Дата відкриття (DD/MM/YYYY) |
| activation_date | VARCHAR(10) | Дата активації (DD/MM/YYYY) |
| card_status | VARCHAR(50) | Статус карти |
| passport | BOOLEAN | Чи є паспорт |
| survey | BOOLEAN | Чи є опитувальник |
| contract | BOOLEAN | Чи є договір |
| comments | TEXT | Коментарі |
| created_at | TIMESTAMP | Час створення |
| updated_at | TIMESTAMP | Час оновлення |
