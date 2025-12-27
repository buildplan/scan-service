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

# [Stage 3] Worker: Debian + Chrome .deb
FROM node:24-trixie-slim AS worker

WORKDIR /app

# Declare architecture variables (automatically set by buildx)
ARG TARGETARCH

# 1. Install utilities
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    dumb-init \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Download Chrome based on architecture
RUN if [ "$TARGETARCH" = "amd64" ]; then \
        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
        && apt-get update \
        && apt-get install -y ./google-chrome-stable_current_amd64.deb \
        && rm google-chrome-stable_current_amd64.deb; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_arm64.deb \
        && apt-get update \
        && apt-get install -y ./google-chrome-stable_current_arm64.deb \
        && rm google-chrome-stable_current_arm64.deb; \
    fi \
    && rm -rf /var/lib/apt/lists/*

# 3. Configure Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    NODE_ENV=production

COPY --from=builder --chown=node:node /app /app

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/worker.js"]
