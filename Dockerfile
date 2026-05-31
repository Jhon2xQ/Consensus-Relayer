# Stage 1: Dependencies
FROM oven/bun:1.3.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 2: Production
FROM oven/bun:1.3.4-alpine AS production

RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules
COPY --chown=bunuser:bunuser . .

USER bunuser
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
