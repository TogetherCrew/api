FROM node:16 as builder

WORKDIR /user/app
COPY package.json ./
RUN npm install 
COPY ./ ./
RUN npm run build

FROM node:16

WORKDIR /user/app
COPY package.json ./
RUN npm install --only=production
COPY --from=builder /user/app/lib/ ./lib

CMD ["bash", "-c", "npm run start"]
