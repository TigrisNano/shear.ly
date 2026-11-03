FROM node:22-alpine

WORKDIR /app

COPY server.js .

ARG APP_VERSION=unknown
ENV APP_VERSION=$APP_VERSION
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
