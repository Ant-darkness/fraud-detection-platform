# Stage 1: Build the React application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files na kusakinisha dependencies
COPY package*.json ./
RUN npm ci

# Copy codes zote na kujenga static files (dist)
COPY . .
RUN npm run build

# Stage 2: Serve the production assets using Nginx
FROM nginx:1.25-alpine
# Copy custom nginx configuration (kama ipo, au tumia default kwa single page apps)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file la config kuzuia React Router "404 Not Found" kwenye refresh
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
