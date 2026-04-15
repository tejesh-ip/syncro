FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install --workspace=packages/frontend

COPY packages/frontend/ ./packages/frontend/

WORKDIR /app/packages/frontend
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/packages/frontend/next.config.ts ./
COPY --from=builder /app/packages/frontend/public ./public
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "packages/frontend/server.js"]