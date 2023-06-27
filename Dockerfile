FROM node:18-alpine AS base
WORKDIR /project
COPY . .
RUN npm ci

FROM base AS test
CMD [ "npx", "jest", "--coverage" ]

FROM base AS build
RUN npm run build

FROM build AS prod
RUN npm ci --omit=dev
CMD ["npm", "run", "start"]
EXPOSE 3000