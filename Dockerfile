FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image — Node.js + FFmpeg only
FROM node:22-alpine AS runner
WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy Next.js standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy full node_modules for server.mjs dependencies (socket.io, archiver)
# that aren't traced by Next.js standalone output
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy custom server (Socket.IO integration)
COPY --chown=nextjs:nodejs server.mjs ./

# Create upload directory
RUN mkdir -p /tmp/uploads \
    && chown -R nextjs:nodejs /tmp/uploads /app

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_FOLDER=/tmp/uploads

EXPOSE 3000

# Single process — custom server handles both HTTP and WebSocket
CMD ["node", "server.mjs"]
