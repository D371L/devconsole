# 🚀 Деплой на VPS (Ubuntu/Debian)

Простая инструкция для деплоя Full-Stack приложения на VPS сервер.

## Преимущества VPS

- ✅ **Проще** - один сервер, полный контроль
- ✅ **Дешевле** - от $4-6/месяц (DigitalOcean Droplet)
- ✅ **Быстрее** - нет лишних абстракций
- ✅ **Гибче** - можно настроить как угодно

## Что нужно

- VPS с Ubuntu 20.04+ или Debian 11+
- SSH доступ к серверу
- Доменное имя (опционально, можно использовать IP)

## Шаг 1: Подготовка сервера

### Подключитесь к серверу

```bash
ssh root@your_server_ip
```

### Обновите систему

```bash
apt update && apt upgrade -y
```

### Установите необходимые пакеты

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql nginx certbot python3-certbot-nginx git

# Проверьте установку
node --version
npm --version
psql --version
```

## Шаг 2: Настройка PostgreSQL

### Создайте базу данных и пользователя

```bash
sudo -u postgres psql

# В psql консоли:
CREATE DATABASE devconsole;
CREATE USER devconsole_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE devconsole TO devconsole_user;
\q
```

### Инициализируйте схему

```bash
# Скопируйте schema.sql на сервер или выполните вручную
sudo -u postgres psql devconsole < database/schema.sql

# Или вручную:
sudo -u postgres psql devconsole
# Вставьте содержимое database/schema.sql
\q
```

## Шаг 3: Настройка Backend API

### Клонируйте репозиторий

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git devconsole
cd devconsole
```

### Настройте Backend

```bash
cd backend
npm install

# Создайте .env файл
nano .env
```

**Содержимое `.env`:**
```env
DATABASE_URL=postgresql://devconsole_user:your_secure_password@localhost:5432/devconsole
PORT=8080
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key
```

### Установите PM2 для управления процессом

```bash
npm install -g pm2

# Запустите backend
cd /var/www/devconsole/backend
pm2 start server.js --name devconsole-api
pm2 save
pm2 startup  # Следуйте инструкциям для автозапуска
```

## Шаг 4: Настройка Frontend

### Соберите frontend

```bash
cd /var/www/devconsole

# Создайте .env.local
nano .env.local
```

**Содержимое `.env.local`:**
```env
VITE_API_URL=http://your_domain_or_ip:8080/api
GEMINI_API_KEY=your_gemini_api_key
```

```bash
# Установите зависимости и соберите
npm install
npm run build

# Создайте директорию для статических файлов
mkdir -p /var/www/devconsole-dist
cp -r dist/* /var/www/devconsole-dist/
```

## Шаг 5: Настройка Nginx

### Создайте конфигурацию Nginx

```bash
nano /etc/nginx/sites-available/devconsole
```

**Содержимое:**

```nginx
server {
    listen 80;
    server_name your_domain.com;  # или ваш IP адрес

    # Frontend (Static files)
    location / {
        root /var/www/devconsole-dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080/health;
        proxy_set_header Host $host;
    }
}
```

### Активируйте конфигурацию

```bash
ln -s /etc/nginx/sites-available/devconsole /etc/nginx/sites-enabled/
nginx -t  # Проверка конфигурации
systemctl restart nginx
```

## Шаг 6: SSL сертификат (опционально, но рекомендуется)

Если у вас есть доменное имя:

```bash
certbot --nginx -d your_domain.com
```

Сертификат будет автоматически обновляться.

## Шаг 7: Обновление приложения

### Автоматическое обновление (опционально)

Создайте скрипт для деплоя:

```bash
nano /var/www/devconsole/deploy.sh
```

**Содержимое:**

```bash
#!/bin/bash
cd /var/www/devconsole
git pull origin main

# Backend
cd backend
npm install
pm2 restart devconsole-api

# Frontend
cd ..
npm install
npm run build
rm -rf /var/www/devconsole-dist/*
cp -r dist/* /var/www/devconsole-dist/
```

```bash
chmod +x /var/www/devconsole/deploy.sh
```

### Ручное обновление

```bash
cd /var/www/devconsole
git pull origin main

# Backend
cd backend
npm install
pm2 restart devconsole-api

# Frontend
cd ..
npm install
npm run build
rm -rf /var/www/devconsole-dist/*
cp -r dist/* /var/www/devconsole-dist/
```

## Проверка работы

### Проверьте backend

```bash
curl http://localhost:8080/health
# Должен вернуть: {"status":"ok","timestamp":"..."}
```

### Проверьте frontend

Откройте в браузере:
- `http://your_domain_or_ip` - должно показать приложение
- `http://your_domain_or_ip/api/health` - должно вернуть статус API

## Мониторинг

### PM2 команды

```bash
pm2 status              # Статус процессов
pm2 logs devconsole-api # Логи backend
pm2 monit               # Мониторинг в реальном времени
pm2 restart devconsole-api  # Перезапуск
pm2 stop devconsole-api     # Остановка
```

### Логи Nginx

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Безопасность

### Firewall (UFW)

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Настройка PostgreSQL

Отредактируйте `/etc/postgresql/*/main/pg_hba.conf` для безопасности.

## Структура на сервере

```
/var/www/devconsole/
├── backend/          # Backend код
│   ├── server.js
│   ├── .env
│   └── node_modules/
├── dist/             # Собранный frontend (временно)
├── deploy.sh         # Скрипт деплоя
└── ...

/var/www/devconsole-dist/  # Статические файлы для Nginx
├── index.html
├── assets/
└── ...
```

## Полезные команды

```bash
# Перезапуск всех сервисов
systemctl restart nginx
pm2 restart devconsole-api

# Проверка статуса
systemctl status nginx
pm2 status

# Просмотр логов
pm2 logs devconsole-api --lines 50
journalctl -u nginx -f
```

## Troubleshooting

### Backend не запускается

```bash
cd /var/www/devconsole/backend
node server.js  # Запустите вручную чтобы увидеть ошибки
```

### Frontend не работает

```bash
# Проверьте что файлы скопированы
ls -la /var/www/devconsole-dist/

# Проверьте права доступа
chown -R www-data:www-data /var/www/devconsole-dist/
```

### Nginx ошибки

```bash
nginx -t  # Проверка конфигурации
systemctl status nginx
```

## Автоматизация деплоя (GitHub Actions - опционально)

Можно настроить автоматический деплой при push в main:

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/devconsole
            ./deploy.sh
```

## Готово! 🎉

После выполнения всех шагов ваше приложение будет доступно по адресу:
- `http://your_domain_or_ip` (или `https://` если настроен SSL)

## Стоимость

- VPS (Basic Droplet): **$4-6/месяц**
- Домен (опционально): **$10-15/год**

**Итого**: ~$4-6/месяц (намного дешевле чем App Platform!)

