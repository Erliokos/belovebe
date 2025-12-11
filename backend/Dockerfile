# Backend Dockerfile
# ----------------------
# Используем Node.js 20 (Prisma 7 поддерживает только >=20.19)
FROM node:20.19-alpine AS builder
WORKDIR /app

# Устанавливаем OpenSSL 1.1 для Prisma
RUN apk add --no-cache openssl1.1-compat

# Копируем package файлы и Prisma схему
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npm run prisma:generate

# Собираем проект
RUN npm run build

# ----------------------
# Production образ
FROM node:20.19-alpine
WORKDIR /app

# Устанавливаем OpenSSL 1.1 для Prisma
RUN apk add --no-cache openssl1.1-compat wget curl

# Копируем package файлы и Prisma схему
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm install --omit=dev

# Копируем собранный код и Prisma Client из билдера
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Генерируем Prisma Client для production (если необходимо)
RUN npm run prisma:generate

# Экспонируем порт
EXPOSE 4000

# Создаем entrypoint скрипт для генерации Prisma Client и миграций
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'echo "Generating Prisma Client..."' >> /app/entrypoint.sh && \
    echo 'npm run prisma:generate' >> /app/entrypoint.sh && \
    echo 'echo "Running migrations..."' >> /app/entrypoint.sh && \
    echo 'npm run prisma:migrate:deploy || echo "Migrations failed, continuing..."' >> /app/entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Запуск entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
