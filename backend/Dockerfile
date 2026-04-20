# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline 2>/dev/null \
    || npm ci --prefer-offline \
    || npm ci

COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
# Prisma seed (ts-node) imports ../src/common/* from prisma/*.ts; production image otherwise has no src/.
COPY --from=builder /app/src/common/administraciones-selector-excluidas.ts ./src/common/administraciones-selector-excluidas.ts

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
