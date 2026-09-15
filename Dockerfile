FROM node:20-bookworm-slim

# Install OpenJDK runtime (default-jre-headless), wget, unzip, curl for JADX decompiler
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jre-headless \
    wget \
    unzip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install official JADX CLI decompiler
ENV JADX_VERSION=1.5.0
RUN wget -q "https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip" -O /tmp/jadx.zip \
    && mkdir -p /opt/jadx \
    && unzip -q /tmp/jadx.zip -d /opt/jadx \
    && rm /tmp/jadx.zip \
    && ln -s /opt/jadx/bin/jadx /usr/local/bin/jadx \
    && chmod +x /opt/jadx/bin/jadx

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
COPY .npmrc ./

# Install dependencies cleanly
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build Next.js fullstack production bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Create storage directory for APK analysis
RUN mkdir -p /app/storage/jobs

EXPOSE 3000

ENV PORT=3000
CMD ["sh", "-c", "npx next start -p ${PORT:-3000} -H 0.0.0.0"]
