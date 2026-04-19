FROM node:25-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

FROM node:25-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]