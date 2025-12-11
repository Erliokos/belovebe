# Backend Dockerfile
FROM node:20.19-alpine AS builder
WORKDIR /app

# Копируем package файлы и Prisma схему
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
FROM node:20.19-alpine
WORKDIR /app

# Устанавливаем необходимые пакеты
RUN apk add --no-cache wget curl

# Копируем package файлы и Prisma схему
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm install --omit=dev

# Копируем собранный код и Prisma Client из билдера
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Генерируем Prisma Client для production
RUN npm run prisma:generate

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

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
