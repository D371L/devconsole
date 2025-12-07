# Быстрый деплой DevConsole на DigitalOcean

Это упрощенная инструкция для деплоя приложения как статического сайта с базой данных.

## Вариант 1: Только Frontend (без базы данных)

Самый простой способ - задеплоить только frontend, который будет использовать LocalStorage.

### Шаги:

1. **Подготовьте репозиторий на GitHub**
   - Убедитесь что весь код закоммичен
   - Запушьте в ветку `main`

2. **Создайте приложение в DigitalOcean:**
   - Зайдите в [App Platform](https://cloud.digitalocean.com/apps)
   - Нажмите **Create App**
   - Выберите **GitHub** и авторизуйтесь
   - Выберите ваш репозиторий
   - Выберите ветку `main`

3. **Настройте Build:**
   - DigitalOcean автоматически определит что это Node.js проект
   - Убедитесь что:
     - **Build Command**: `npm install && npm run build`
     - **Output Directory**: `dist`
     - **HTTP Port**: оставьте пустым (статика)

4. **Добавьте переменные окружения:**
   - В разделе **Environment Variables** добавьте:
     - `GEMINI_API_KEY` = ваш ключ от Google Gemini
     - Scope: **Run Time**

5. **Деплой:**
   - Нажмите **Next** → **Create Resources**
   - Дождитесь завершения (5-10 минут)
   - Готово! Ваше приложение будет доступно по адресу вида: `devconsole-xxxxx.ondigitalocean.app`

## Вариант 2: Frontend + PostgreSQL база данных

Если хотите использовать базу данных для будущей миграции:

### Шаги 1-4: такие же как в Варианте 1

5. **Добавьте базу данных:**
   - После настройки frontend, в разделе **Resources** нажмите **Add Resource**
   - Выберите **Database**
   - Выберите **PostgreSQL**
   - Выберите план (Development - $12/мес или Production)
   - Название: `devconsole-db`

6. **Инициализация базы данных:**
   - После создания БД, подключитесь к ней через DigitalOcean Console
   - Или используйте переменную окружения `devconsole-db.DATABASE_URL`
   - Выполните SQL из файла `database/schema.sql`

7. **Деплой:**
   - Нажмите **Create Resources**
   - Дождитесь завершения

## Важные моменты

### Переменная окружения GEMINI_API_KEY

- **Важно:** Добавьте ключ в разделе Environment Variables
- Scope должен быть **Run Time** (для использования в браузере)
- В production лучше использовать **SECRET** тип для безопасности

### LocalStorage vs Database

- По умолчанию приложение использует **LocalStorage**
- База данных будет доступна для будущего использования
- Для перехода на БД нужно будет создать backend API

### Стоимость

- **Статический сайт:** $0/месяц (бесплатно!)
- **PostgreSQL (Development):** $12/месяц
- **PostgreSQL (Production):** от $15/месяц

### После деплоя

1. Приложение будет доступно по URL вида: `devconsole-xxxxx.ondigitalocean.app`
2. Все изменения в `main` ветке будут автоматически деплоиться
3. Логи можно смотреть в разделе **Runtime Logs**

## Troubleshooting

### Build fails

- Проверьте что все зависимости указаны в `package.json`
- Убедитесь что `npm run build` работает локально
- Проверьте логи в разделе **Build Logs**

### Environment variable not working

- Убедитесь что scope установлен как **Run Time**
- Перезапустите приложение после добавления переменных
- Проверьте что переменная доступна в `process.env`

### Database connection

- База данных создается автоматически
- Connection string доступен через переменную `devconsole-db.DATABASE_URL`
- Для использования нужен backend API

## Следующие шаги (опционально)

Если хотите использовать PostgreSQL вместо LocalStorage:

1. Создайте простой backend API (Node.js/Express)
2. Добавьте его в App Platform как Web Service
3. Адаптируйте frontend для работы с API
4. Мигрируйте данные из LocalStorage в PostgreSQL

Но для начала статический сайт с LocalStorage отлично подойдет!

