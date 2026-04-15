FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

RUN npm install --workspace=packages/api

COPY packages/api/ ./packages/api/

WORKDIR /app/packages/api
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]