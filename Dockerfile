# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN npx drizzle-kit migrate
RUN npx drizzle-kit push

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]