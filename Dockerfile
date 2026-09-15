FROM python:3.11-slim

# Install OpenJDK 17 (headless), wget, unzip for JADX decompiler and AXML analysis
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    wget \
    unzip \
    curl \
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

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code and rules
COPY backend /app/backend

# Create runtime storage directories
RUN mkdir -p /app/storage/jobs

EXPOSE 8000

ENV PORT=8000
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
