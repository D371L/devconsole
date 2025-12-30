# Исправление ошибки деплоя на DigitalOcean

## Проблема

DigitalOcean определяет приложение как **Web Service** вместо **Static Site**, что вызывает ошибки при деплое.

## Решение

### Вариант 1: Изменить тип компонента в UI (Рекомендуется)

1. Зайдите в DigitalOcean App Platform
2. Откройте ваше приложение
3. Перейдите в раздел **Settings**
4. В секции **Components** найдите ваш компонент
5. Нажмите **Edit** на компоненте
6. Измените **Component Type** с **Web Service** на **Static Site**
7. Убедитесь что настройки:
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **HTTP Port**: оставьте **пустым**
8. Сохраните изменения
9. Запустите новый деплой

### Вариант 2: Удалить и пересоздать компонент

1. Удалите существующий компонент **Web Service**
2. Добавьте новый компонент типа **Static Site**
3. Настройте:
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - Источник: GitHub репозиторий
4. Сохраните и задеплойте

### Вариант 3: Использовать конфигурационный файл

1. Обновите файл `.do/app.yaml` в репозитории (замените `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME`)
2. В DigitalOcean App Platform выберите **Settings** → **App Spec**
3. Нажмите **Edit** и вставьте содержимое `.do/app.yaml`
4. Сохраните - DigitalOcean пересоздаст компоненты правильно

## Почему это происходит?

DigitalOcean автоматически определяет тип приложения по buildpack'ам. Если он видит `package.json` с Node.js зависимостями, он может создать **Web Service** вместо **Static Site**.

Статический сайт не требует запуска Node.js процесса - просто отдает HTML/CSS/JS файлы из папки `dist`.

## Проверка после исправления

После изменения типа на Static Site:
- ✅ Build должен завершиться успешно
- ✅ Deploy должен пройти без ошибок
- ✅ Приложение будет доступно по URL
- ✅ Не будет предупреждений о "no way to start a node process"


