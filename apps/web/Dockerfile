FROM node:25-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/web/ ./apps/web/
RUN cd apps/web && npm run build

FROM node:25-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]