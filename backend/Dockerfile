# Backend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Устанавливаем OpenSSL для Prisma
RUN apk add --no-cache openssl wget curl

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Production образ
FROM node:20-alpine
WORKDIR /app

# Устанавливаем OpenSSL и утилиты
RUN apk add --no-cache openssl wget curl

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm install --omit=dev

# Копируем собранный код и node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Создаем entrypoint скрипт
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'echo "Generating Prisma Client..."' >> /app/entrypoint.sh && \
    echo 'npx prisma generate' >> /app/entrypoint.sh && \
    echo 'echo "Running migrations..."' >> /app/entrypoint.sh && \
    echo 'npx prisma migrate deploy || echo "Migrations failed, continuing..."' >> /app/entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
