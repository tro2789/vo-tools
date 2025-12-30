FROM node:20-alpine AS base

# Install dependencies for both Node and Python
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

# Production image - includes both Node and Python
FROM python:3.11-slim AS runner
WORKDIR /app

# Install system dependencies (Node.js, FFmpeg, supervisor)
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python API
COPY app.py ./

# Setup Next.js
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create supervisor config
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf \
    && echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'user=root' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo '' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo '[program:nextjs]' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'command=node server.js' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo '' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo '[program:flask]' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'command=gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 app:app' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf \
    && echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000 5000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
