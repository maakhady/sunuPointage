# Étape de build
FROM node:20.18.1 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine

COPY --from=builder /app/dist/sunu-pointage /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]