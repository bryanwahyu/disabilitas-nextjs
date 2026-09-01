# syntax=docker/dockerfile:1

# Node 22 wajib: @tanstack/react-start dan paket intinya menuntut >=22.12.0.
# Menurunkannya ke node:20 membuat install gagal dengan EBADENGINE.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# VITE_* di-inline ke bundle saat build (sama seperti NEXT_PUBLIC_* dulu).
# Menyetelnya sebagai env runtime container TIDAK berpengaruh — harus build-arg.
ARG VITE_API_BASE_URL
ARG VITE_CENTRIFUGO_URL
ARG VITE_SITE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_CENTRIFUGO_URL=${VITE_CENTRIFUGO_URL}
ENV VITE_SITE_URL=${VITE_SITE_URL}
ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp

# .output sudah self-contained — Nitro membundel dependency yang dipakai,
# jadi tidak perlu menyalin node_modules.
COPY --from=builder --chown=nodeapp:nodejs /app/.output ./.output

USER nodeapp

EXPOSE 3000

# Catatan operasional: proses ini jadi PID 1. Insiden 2026-07-25 (node PID 1
# tanpa reaper → 4635 zombie → PID table server shared penuh → semua tenant
# down) terjadi persis karena itu. `init: true` di docker-compose WAJIB tetap
# ada; jangan andalkan Dockerfile ini saja.
CMD ["node", ".output/server/index.mjs"]
