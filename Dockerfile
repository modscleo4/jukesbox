FROM node:20-alpine

WORKDIR /app

COPY . .
RUN rm -f .env

RUN apk add --no-cache ffmpeg

RUN apk add --no-cache build-base python3 ; \
  npm ci; \
  npx prisma generate; \
  npm run build; \
  npm prune --production; \
  apk del build-base python3;

CMD ["npm", "run", "start"]
