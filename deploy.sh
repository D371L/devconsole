#!/bin/bash

# Скрипт деплоя на VPS
# Использование: ./deploy.sh

set -e  # Остановить при ошибке

echo "🚀 Начинаем деплой DevConsole..."

# Получаем путь к скрипту
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Обновляем код
echo "📥 Обновляем код из Git..."
git pull origin main || echo "⚠️  Git pull failed, продолжаем..."

# Backend
echo "⚙️  Обновляем Backend..."
cd backend
npm install --production
echo "✅ Backend зависимости установлены"

# Перезапускаем backend через PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Перезапускаем Backend API..."
    pm2 restart devconsole-api || pm2 start server.js --name devconsole-api
    echo "✅ Backend перезапущен"
else
    echo "⚠️  PM2 не найден, пропускаем перезапуск backend"
fi

# Frontend
echo "⚙️  Собираем Frontend..."
cd ..
npm install
npm run build
echo "✅ Frontend собран"

# Копируем файлы
if [ -d "/var/www/devconsole-dist" ]; then
    echo "📦 Копируем файлы frontend..."
    rm -rf /var/www/devconsole-dist/*
    cp -r dist/* /var/www/devconsole-dist/
    echo "✅ Frontend файлы скопированы"
else
    echo "⚠️  Директория /var/www/devconsole-dist не найдена"
    echo "Создайте её и укажите в конфигурации Nginx"
fi

# Перезапускаем Nginx
if command -v nginx &> /dev/null; then
    echo "🔄 Проверяем конфигурацию Nginx..."
    nginx -t && systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "⚠️  Nginx не найден"
fi

echo "🎉 Деплой завершен успешно!"
echo ""
echo "Проверьте приложение:"
echo "  - Frontend: http://your-domain/"
echo "  - API Health: http://your-domain/api/health"
echo ""
echo "Логи Backend: pm2 logs devconsole-api"
echo "Логи Nginx: tail -f /var/log/nginx/error.log"

