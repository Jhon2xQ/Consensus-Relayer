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

CMD ["bun", "run", "src/index.ts"]
