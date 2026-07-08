FROM node:22-alpine

WORKDIR /gienah

COPY . . 

RUN yarn install

RUN yarn build

CMD [ "npx", "serve", "-s", "build" ]