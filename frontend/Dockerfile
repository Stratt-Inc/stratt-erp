# ── Deps stage ───────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN npm install -g pnpm@10.6.5

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build stage ───────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@10.6.5

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096
ARG NEXT_PUBLIC_API_URL=https://api.stratt.fr
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# ── Runtime stage ─────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
