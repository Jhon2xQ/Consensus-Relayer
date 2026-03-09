# Dockerfile para Semaphore Relayer API

# Stage 1: Base
FROM oven/bun:1.3.4-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 3: Build (si necesitas compilar)
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Si tuvieras un build step, lo ejecutarías aquí
# RUN bun run build

# Stage 4: Production
FROM base AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

# Copiar dependencias de producción
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=bunuser:bunuser . .

# Cambiar a usuario no-root
USER bunuser

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Comando de inicio
CMD ["bun", "run", "src/index.ts"]
