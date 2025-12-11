# Инструкция по деплою на Linux сервер

## Предварительные требования

- Linux сервер с установленными Docker и Docker Compose
- Nginx установлен и настроен
- SSL сертификаты (Let's Encrypt)
- Домен настроен и указывает на IP сервера

## Шаги деплоя

### 1. Подготовка сервера

```bash
# Клонируем репозиторий
git clone <your-repo-url> /opt/belovebe
cd /opt/belovebe

# Создаем файл .env для production
cat > .env << EOF
JWT_SECRET=your-very-secure-jwt-secret-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
POSTGRES_USER=belovebe
POSTGRES_PASSWORD=your-secure-postgres-password
POSTGRES_DB=belovebe
CORS_ORIGIN=https://belovebe.ru,https://www.belovebe.ru
VITE_API_URL=
EOF
```

### 2. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/belovebe.ru`:

```nginx
server {
    listen 443 ssl;
    server_name belovebe.ru www.belovebe.ru;

    # --- API BACKEND ---
    location /server/ {
        # Убираем префикс /server из пути
        rewrite ^/server(/.*)$ $1 break;
        
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # --- FRONTEND (React, Vite и т.п.) ---
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    ssl_certificate /etc/letsencrypt/live/belovebe.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/belovebe.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.belovebe.ru) {
        return 301 https://$host$request_uri;
    }
    if ($host = belovebe.ru) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name belovebe.ru www.belovebe.ru;
    return 404;
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/belovebe.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Запуск Docker контейнеров

```bash
cd /opt/belovebe

# Собираем и запускаем контейнеры
docker-compose -f docker-compose.prod.yml up -d --build

# Выполняем миграции и seed (если нужно)
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed

# Проверяем логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Проверка работы

- Frontend: https://belovebe.ru
- Backend API: https://belovebe.ru/server/api/health
- Swagger: https://belovebe.ru/server/api-docs

### 5. Автозапуск при перезагрузке сервера

Docker Compose уже настроен с `restart: unless-stopped`, но для полной надежности:

```bash
# Создаем systemd service
sudo nano /etc/systemd/system/belovebe.service
```

Содержимое файла:

```ini
[Unit]
Description=belovebe Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/belovebe
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable belovebe.service
sudo systemctl start belovebe.service
```

## Обновление приложения

```bash
cd /opt/belovebe
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy
```

## Мониторинг

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats
```

## Резервное копирование базы данных

```bash
# Создание бэкапа
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U belovebe belovebe > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U belovebe belovebe < backup.sql
```

## Важные замечания

1. **Безопасность**: 
   - Обязательно измените `JWT_SECRET` и `POSTGRES_PASSWORD` на безопасные значения
   - Ограничьте `CORS_ORIGIN` только вашими доменами
   - Используйте firewall для ограничения доступа к портам 4000 и 3002 только с localhost

2. **Firewall**:
   ```bash
   # Разрешаем только HTTP/HTTPS
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Telegram Web App**: 
   - Убедитесь, что домен добавлен в настройки Telegram бота
   - Проверьте, что `TELEGRAM_BOT_TOKEN` правильный

4. **Nginx и Docker**: 
   - Nginx должен проксировать на `127.0.0.1:4000` и `127.0.0.1:3002`
   - Docker контейнеры должны быть доступны на этих портах только локально

