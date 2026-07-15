FROM node:22-alpine AS dependencies

WORKDIR /gienah

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /gienah

COPY --from=dependencies /gienah/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /gienah

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /gienah/public ./public
COPY --from=builder /gienah/.next ./.next
COPY --from=builder /gienah/node_modules ./node_modules
COPY --from=builder /gienah/package.json ./package.json
COPY --from=builder /gienah/yarn.lock ./yarn.lock

EXPOSE 3000

CMD ["yarn", "start", "--hostname", "0.0.0.0"]
