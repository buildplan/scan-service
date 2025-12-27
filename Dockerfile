# [Stage 1] Builder: Install dependencies & Build
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# -----------------------------------------------------------

# [Stage 2] Web Server: Lightweight Stable Debian
FROM node:22-bookworm-slim AS web
WORKDIR /app
# Install dumb-init
RUN apt-get update && apt-get install -y dumb-init --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app /app
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]

# -----------------------------------------------------------

# [Stage 3] Worker: Debian + Chrome .deb (The Fix)
FROM node:22-bookworm-slim AS worker

WORKDIR /app

# 1. Install utilities to download Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    dumb-init \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Download and Install Google Chrome Stable directly
# We use 'apt-get install ./google-chrome.deb' to resolve dependencies automatically
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# 3. Configure Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    NODE_ENV=production

COPY --from=builder --chown=node:node /app /app

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/worker.js"]
