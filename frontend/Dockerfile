# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# ARG для переменных окружения во время сборки
# Если VITE_API_URL не указан, будет использован относительный путь /server
ARG VITE_API_URL
ARG VITE_YANDEX_MAPS_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY

# Собираем приложение
RUN npm run build

# Production образ с nginx
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

