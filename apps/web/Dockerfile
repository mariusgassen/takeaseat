FROM node:25-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

RUN npm ci

COPY . .

RUN npm run generate --workspace=@takeaseat/types
RUN npm run build --workspace=@takeaseat/web

FROM node:25-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
