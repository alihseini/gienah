FROM node:16.15.1

WORKDIR /gienah

COPY . . 

RUN yarn install

RUN yarn build

CMD [ "npx", "serve", "-s", "build" ]