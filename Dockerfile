FROM node:17

WORKDIR /usr/src/app

RUN apk update
RUN apk add ffmpeg

RUN npm ci

CMD ["npm", "run", "start"]
