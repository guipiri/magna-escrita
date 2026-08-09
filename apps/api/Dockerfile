# Stage 1: Pruner - Isolate workspace files needed for api
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@^2.9.6
COPY . .
RUN turbo prune api --docker

# Stage 2: Builder - Install dependencies and build project
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# First copy pruned package manifest files for optimal layer caching
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile

# Copy pruned workspace source files
COPY --from=pruner /app/out/full/ .

# Generate Prisma Client
RUN yarn workspace api prisma:generate

# Build packages and API app
RUN yarn turbo run build --filter=api...

# Stage 3: Runner - Production image
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl poppler-utils
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Hardening: create unprivileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy root node_modules and built dependencies
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

USER nestjs

EXPOSE 8080

CMD ["node", "apps/api/dist/src/main.js"]
