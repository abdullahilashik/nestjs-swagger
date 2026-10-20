# --- Stage 1: Dependencies (for caching) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 3: Production deps only ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Stage 4: Production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tini

# Copy prod node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Copy Drizzle migrations (if you run them at startup)
COPY --from=builder /app/drizzle ./drizzle
# COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts (only if you run drizzle-kit)

# Non-root user
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]