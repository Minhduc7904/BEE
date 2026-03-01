# =========================
# Builder stage
# =========================
FROM node:20-slim AS builder

WORKDIR /app

# Install system deps (cần cho playwright build)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install deps
RUN npm ci

# Copy source
COPY . .

# Generate prisma
RUN npx prisma generate

# Build app
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:20-slim

WORKDIR /app

# Cài system dependencies cho Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libasound2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Đặt PLAYWRIGHT_BROWSERS_PATH vào trong /app để chown bao phủ được
# Tránh trường hợp install với root nhưng chạy với nestjs không tìm thấy browser
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright-browsers

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production deps
RUN npm ci --omit=dev && \
    npx prisma generate

# Install Playwright browser vào /app/.playwright-browsers
RUN npx playwright install chromium --with-deps

# Copy build từ builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Tạo user an toàn và chown toàn bộ /app (bao gồm .playwright-browsers)
RUN groupadd -r nodejs && useradd -r -g nodejs -m nestjs
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode===200?0:1))"

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]