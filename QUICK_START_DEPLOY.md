# ⚡ Быстрый деплой на DigitalOcean

## Что нужно сделать прямо сейчас

### 1. Подготовьте репозиторий

```bash
# Убедитесь что код в GitHub
git add .
git commit -m "Prepare for DigitalOcean deployment"
git push origin main
```

### 2. Создайте приложение в DigitalOcean

1. Зайдите на https://cloud.digitalocean.com/apps
2. Нажмите **Create App**
3. Выберите **GitHub** → выберите ваш репозиторий → ветку `main`
4. DigitalOcean автоматически определит что это Node.js проект

### 3. Настройте Build

Оставьте настройки по умолчанию или укажите:
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`

### 4. Добавьте базу данных

1. В разделе **Resources** нажмите **Add Resource**
2. Выберите **Database** → **PostgreSQL**
3. Выберите план (Development - $12/мес)
4. Название: `devconsole-db`

### 5. Добавьте переменные окружения

В **Settings** → **App-Level Environment Variables**:
- `GEMINI_API_KEY` = ваш ключ (Scope: RUN_TIME, Type: SECRET)

### 6. Деплой

Нажмите **Create Resources** и подождите 5-10 минут.

## Что получится

✅ Frontend приложение доступно по URL  
✅ PostgreSQL база данных создана  
✅ Автоматический деплой при каждом push  

## Важно знать

**Приложение работает с LocalStorage** по умолчанию. База данных создана, но для её использования нужно создать backend API в будущем.

Сейчас всё будет работать на LocalStorage браузера - этого достаточно для начала!

## После деплоя

1. Откройте URL вашего приложения
2. Войдите с тестовыми данными:
   - Username: `admin`
   - Password: `password`

## Стоимость

- Frontend: **$0/месяц** (бесплатно!)
- PostgreSQL: **$12/месяц**

Итого: **$12/месяц** (можно начать бесплатно без БД)

---

Подробная инструкция: [DEPLOY.md](./DEPLOY.md)

