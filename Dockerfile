# [Stage 1] Builder: Install dependencies & Build
FROM node:24-trixie-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# [Stage 2] Web Server: Lightweight
FROM node:24-trixie-slim AS web
WORKDIR /app
RUN apt-get update && apt-get install -y dumb-init --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app /app
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]

# [Stage 3] Worker: Debian + Chromium
FROM node:24-trixie-slim AS worker

WORKDIR /app

# 1. Install Chromium and utilities
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    dumb-init \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Configure Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

COPY --from=builder --chown=node:node /app /app

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/worker.js"]
