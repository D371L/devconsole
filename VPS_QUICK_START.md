# ⚡ Быстрый старт: Деплой на VPS (5 минут)

## Минимальные требования

- VPS с Ubuntu 20.04+ или Debian 11+
- SSH доступ
- 1GB RAM минимум

## Команды для копирования (все сразу)

```bash
# 1. Подключитесь к серверу
ssh root@your_server_ip

# 2. Установите всё необходимое
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql nginx git

# 3. Создайте базу данных
sudo -u postgres psql << EOF
CREATE DATABASE devconsole;
CREATE USER devconsole_user WITH PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE devconsole TO devconsole_user;
\q
EOF

# 4. Клонируйте проект
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git devconsole
cd devconsole

# 5. Настройте Backend
cd backend
npm install
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://devconsole_user:change_this_password@localhost:5432/devconsole
PORT=8080
NODE_ENV=production
GEMINI_API_KEY=your_gemini_key_here
ENVEOF

# 6. Инициализируйте базу данных
sudo -u postgres psql devconsole < ../database/schema.sql

# 7. Запустите Backend
npm install -g pm2
pm2 start server.js --name devconsole-api
pm2 save
pm2 startup  # Выполните команду которую покажет

# 8. Настройте Frontend
cd ..
cat > .env.local << 'ENVEOF'
VITE_API_URL=/api
GEMINI_API_KEY=your_gemini_key_here
ENVEOF

npm install
npm run build

# 9. Скопируйте файлы frontend
mkdir -p /var/www/devconsole-dist
cp -r dist/* /var/www/devconsole-dist/

# 10. Настройте Nginx
cat > /etc/nginx/sites-available/devconsole << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /var/www/devconsole-dist;
        try_files $uri $uri/ /index.html;
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
}
NGINXEOF

ln -s /etc/nginx/sites-available/devconsole /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 11. Настройте firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 12. Готово! Проверьте:
curl http://localhost:8080/health  # Backend health
curl http://localhost/api/health    # Через Nginx
curl http://localhost/              # Frontend
```

## Что дальше?

После выполнения команд:
1. Откройте `http://your_server_ip` в браузере
2. Войдите: `admin` / `password`
3. Готово! 🎉

## Обновление приложения

```bash
cd /var/www/devconsole
./deploy.sh
```

Или вручную:
```bash
cd /var/www/devconsole
git pull
cd backend && npm install && pm2 restart devconsole-api
cd .. && npm install && npm run build
rm -rf /var/www/devconsole-dist/* && cp -r dist/* /var/www/devconsole-dist/
```

## Полезные команды

```bash
pm2 logs devconsole-api      # Логи backend
pm2 status                   # Статус процессов
systemctl status nginx       # Статус Nginx
nginx -t                     # Проверка конфигурации
```

## SSL сертификат (опционально)

Если есть домен:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

---

**Важно:** Замените:
- `YOUR_USERNAME/YOUR_REPO` - на ваш GitHub репозиторий
- `change_this_password` - на надежный пароль БД
- `your_gemini_key_here` - на ваш API ключ Gemini
- `your_server_ip` - на IP вашего сервера
