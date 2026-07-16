#FROM node:22-alpine AS build
#WORKDIR /app
#COPY package*.json ./
#RUN npm install
#COPY . .
#RUN npm run build

#FROM nginx:1.25-alpine
#COPY --from=build /app/dist /usr/share/nginx/html
#COPY nginx.conf /etc/nginx/conf.d/default.conf
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]


FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./

# 1. Badala ya 'npm install', tumia 'npm ci' kwa ajili ya build zilizo salama na za haraka zaidi
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

# 2. Hakikisha umeruhusu usomaji mzuri wa file za Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 3. Hakikisha una faili la 'nginx.conf' kwenye root ya project yako
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
