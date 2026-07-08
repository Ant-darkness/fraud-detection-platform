# Stage 1: Build the React application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files na kusakinisha dependencies
COPY package*.json ./
RUN npm ci

# TAMKO MUHIMU: Tunapokea URL wakati wa build na kuiweka kwenye Environment ya Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy codes zote na kujenga static files (dist)
COPY . .
RUN npm run build

# Stage 2: Serve the production assets using Nginx
FROM nginx:1.25-alpine

# Copy file la config kuzuia React Router "404 Not Found" kwenye refresh
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Copy static assets kutoka stage ya kwanza kwenda Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
