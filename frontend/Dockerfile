FROM node:22-alpine AS dev
RUN apk add --no-cache curl
WORKDIR /app
COPY ./app/package*.json ./
RUN npm install
COPY ./app/. .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

FROM node:22-alpine AS build
WORKDIR /app
COPY ./app/package*.json ./
RUN npm install
COPY ./app/. .
RUN npm run build

FROM nginx:1.27 AS prod
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/. /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]