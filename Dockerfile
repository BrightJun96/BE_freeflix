#DEV
FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm i -g pnpm
RUN pnpm i

COPY src src

RUN #pnpm run build

CMD ["pnpm","run","start:dev"]

#PRODUCTION
FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./


RUN npm i -g pnpm
RUN pnpm install --prod

COPY --from=development /usr/src/app/dist ./dist

COPY . .

CMD ["pnpm", "run", "start:prod"]
