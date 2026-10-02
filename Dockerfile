# Multi-stage Docker build for NONONICK Universal AI Editor
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install dependencies
RUN npm install

# Copy source code and assets
COPY . .

# Build Vite frontend assets
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install tsx + production dependencies
COPY package.json bun.lock* ./
RUN npm install --omit=dev && npm install -g tsx

# Copy built frontend assets and required server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/openapi.json ./openapi.json

# Create non-root user for security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["tsx", "server.ts"]
