# Backend Dockerfile
FROM node:18-alpine3.18 AS builder
WORKDIR /app

# Устанавливаем OpenSSL 1.1 для Prisma
RUN apk add --no-cache openssl1.1-compat

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npm run prisma:generate

# Собираем проект
RUN npm run build

# Production образ
FROM node:18-alpine3.18
WORKDIR /app

# Устанавливаем OpenSSL 1.1 для Prisma
RUN apk add --no-cache openssl1.1-compat

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm install --omit=dev

# Копируем собранный код и Prisma Client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Генерируем Prisma Client для production
RUN npm run prisma:generate

# Устанавливаем wget и curl для healthcheck
RUN apk add --no-cache wget curl

EXPOSE 4000

# Создаем entrypoint скрипт
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'echo "Generating Prisma Client..."' >> /app/entrypoint.sh && \
    echo 'npm run prisma:generate' >> /app/entrypoint.sh && \
    echo 'echo "Running migrations..."' >> /app/entrypoint.sh && \
    echo 'npm run prisma:migrate:deploy || echo "Migrations failed, continuing..."' >> /app/entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
