# Hotel-Backend — Agent Guide

## Stack

- **Runtime**: Bun (v1.3+) — `bun` everywhere, NOT npm/pnpm/yarn
- **Framework**: Hono v4 — traditional router, not JSX
- **Language**: TypeScript (ES2020, ESNext modules, bundler resolution)
- **ORM**: Prisma 7 with `@prisma/adapter-pg` — generated client at `generated/prisma`
- **Auth**: better-auth v1 with Prisma adapter, email+password, admin plugin
- **DI**: tsyringe v4 — `@injectable()` / `@inject()` decorators; `experimentalDecorators` + `emitDecoratorMetadata` enabled
- **Validation**: Zod v4 — schemas in `presentation/schemas/`
- **Storage**: AWS SDK v3 S3 client (MinIO-compatible endpoint in dev)
- **Linter**: Biome — `biome check .` (no ESLint/Prettier)
- **Testing**: Vitest v4 — globals API, `vitest/globals` in tsconfig types

## Architecture

Clean Architecture / Hexagonal — strict layer separation:

```
src/
├── domain/          # Entities, repository interfaces, exceptions
│   ├── entities/    # Plain TS classes, no framework deps
│   ├── interfaces/  # Repository contracts (IHabitacionRepository, etc.)
│   └── exceptions/  # DomainException subclasses with static factories
├── application/     # Use cases & DTOs
│   ├── use-cases/   # One file per action (create-*, find-*, list-*, update-*, delete-*)
│   ├── dtos/        # Input/output interfaces + mapper functions (toXxxDto)
│   └── paginations/ # PaginatedResult, PaginationParams interfaces
├── infrastructure/  # Repositories, mappers, services
│   ├── repositories/  # Implement interfaces, use PrismaClient
│   ├── mappers/       # Prisma rows → domain entities (mapXxxFromPrisma)
│   └── services/      # S3UploadService (static methods)
├── presentation/    # Controllers, schemas, middlewares, ApiResponse
│   ├── controllers/ # @injectable(), receive use cases via constructor
│   ├── schemas/     # Zod schemas for request validation
│   └── middlewares/ # validSchema, validParams, validQuery, auth, parseFormData
├── common/          # Config, DI container, types, utils
│   ├── IoC/         # container.ts (registerDependencies), tokens.ts (Symbols)
│   ├── libraries/   # prisma.ts, auth.ts, s3.ts
│   ├── configs/     # env.config.ts, cors.config.ts
│   ├── types/       # AppContext, AppVariables, AppHono
│   ├── constants/   # roles.ts
│   └── utils/       # codigo-generator.ts
├── routes/          # Route definitions — createXxxRoutes() functions
└── index.ts         # Entrypoint: register DI, create Hono app, mount routes
```

## Layer Examples

### `domain/entities/` — Plain class with constructor, zero framework deps

```ts
// habitacion.entity.ts
import type { TipoHabitacion } from "./tipo-habitacion.entity";

export class Habitacion {
  constructor(
    public readonly id: string,
    public readonly nroHabitacion: string,
    public readonly tipoHabitacion: TipoHabitacion,
    public readonly piso: number,
    public readonly feature: string | null,
    public readonly amenities: string | null,
    public readonly urlImagen: string[] | null,
    public readonly estado: boolean,
    public readonly descripcion: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
```

### `domain/interfaces/` — Repository contract (interface I prefix)

```ts
// habitacion.repository.interface.ts
import type { Habitacion } from "../entities/habitacion.entity";
import type { PaginatedResult } from "../../application/paginations/api.pagination";

export interface CreateHabitacionParams {
  nroHabitacion: string;
  tipoHabitacionId: string;
  piso: number;
  feature?: string | null;
  amenities?: string | null;
  urlImagen?: string[] | null;
  estado?: boolean;
  descripcion?: string | null;
}

export interface IHabitacionRepository {
  create(data: CreateHabitacionParams): Promise<Habitacion>;
  findAll(): Promise<Habitacion[]>;
  findById(id: string): Promise<Habitacion | null>;
  findByNumero(numero: string): Promise<Habitacion | null>;
  update(id: string, data: UpdateHabitacionParams): Promise<Habitacion>;
  delete(id: string): Promise<void>;
  hasRelatedRecords(id: string): Promise<boolean>;
}
```

### `domain/exceptions/` — Static factory subclasses of DomainException

```ts
// habitacion.exception.ts
import { DomainException } from "./domain.exception";

export class HabitacionException extends DomainException {
  static notFoundById(): HabitacionException {
    return new HabitacionException("Habitación no encontrada", 404);
  }
  static duplicateNumero(): HabitacionException {
    return new HabitacionException("Ya existe una habitación con ese número", 409);
  }
  static tipoNotFound(): HabitacionException {
    return new HabitacionException("Tipo de habitación no encontrado", 404);
  }
}
```

### `application/use-cases/` — One action per file, injectable, uses repository via DI

```ts
// create-habitacion.use-case.ts
import { inject, injectable } from "tsyringe";
import type { IHabitacionRepository } from "../../../domain/interfaces/habitacion.repository.interface";
import { HabitacionException } from "../../../domain/exceptions/habitacion.exception";
import { CreateHabitacionDto, HabitacionDto, toHabitacionDto } from "../../dtos/habitacion.dto";
import { DI_TOKENS } from "../../../common/IoC/tokens";

@injectable()
export class CreateHabitacionUseCase {
  constructor(
    @inject(DI_TOKENS.IHabitacionRepository) private repository: IHabitacionRepository,
    @inject(DI_TOKENS.ITipoHabitacionRepository)
    private tipoHabitacionRepository: ITipoHabitacionRepository,
  ) {}

  async execute(input: CreateHabitacionDto): Promise<HabitacionDto> {
    const tipoHabitacion = await this.tipoHabitacionRepository.findById(input.tipo_habitacion_id);
    if (!tipoHabitacion) throw HabitacionException.tipoNotFound();
    const existing = await this.repository.findByNumero(input.nro_habitacion);
    if (existing) throw HabitacionException.duplicateNumero();
    const habitacion = await this.repository.create({
      nroHabitacion: input.nro_habitacion,
      tipoHabitacionId: input.tipo_habitacion_id,
      piso: input.piso,
      feature: input.feature ?? null,
      amenities: input.amenities ?? null,
      estado: input.estado ?? false,
    });
    return toHabitacionDto(habitacion);
  }
}
```

### `application/dtos/` — Input/output interfaces + mapper function

```ts
// habitacion.dto.ts
import type { Habitacion } from "../../domain/entities/habitacion.entity";
import type { TipoHabitacionDto } from "./tipo-habitacion.dto";
import { toTipoHabitacionDto } from "./tipo-habitacion.dto";

export interface CreateHabitacionDto {
  nro_habitacion: string; // snake_case en API
  tipo_habitacion_id: string;
  piso: number;
  feature?: string;
  imagenes?: File[];
}

export interface HabitacionDto {
  id: string;
  nro_habitacion: string;
  tipo_habitacion: TipoHabitacionDto;
  piso: number;
  feature: string | null;
  created_at: string;
  updated_at: string;
}

export function toHabitacionDto(h: Habitacion): HabitacionDto {
  return {
    id: h.id,
    nro_habitacion: h.nroHabitacion, // camelCase → snake_case
    tipo_habitacion: toTipoHabitacionDto(h.tipoHabitacion),
    piso: h.piso,
    feature: h.feature,
    created_at: h.createdAt.toISOString(),
    updated_at: h.updatedAt.toISOString(),
  };
}
```

### `infrastructure/repositories/` — Implements interface, injects PrismaClient

```ts
// habitacion.repository.ts
import { inject, injectable } from "tsyringe";
import { PrismaClient } from "../../../generated/prisma/client";
import { Habitacion } from "../../domain/entities/habitacion.entity";
import { IHabitacionRepository, CreateHabitacionParams } from "../../domain/interfaces/habitacion.repository.interface";
import { mapHabitacionFromPrisma } from "../mappers/habitacion.mapper";
import { DI_TOKENS } from "../../common/IoC/tokens";

@injectable()
export class HabitacionRepository implements IHabitacionRepository {
  constructor(@inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient) {}

  async create(data: CreateHabitacionParams): Promise<Habitacion> {
    const result = await this.prisma.habitacion.create({
      data: {
        nroHabitacion: data.nroHabitacion,
        tipoHabitacionId: data.tipoHabitacionId,
        piso: data.piso,
      },
      include: { tipo: true },
    });
    return mapHabitacionFromPrisma(result);
  }
  // findById, findByNumero, update, delete follow the same pattern
}
```

### `infrastructure/mappers/` — Prisma row → domain entity

```ts
// habitacion.mapper.ts
import { Habitacion } from "../../domain/entities/habitacion.entity";
import { mapTipoHabitacionFromPrisma } from "./tipo-habitacion.mapper";

type HabitacionPrismaRow = {
  id: string;
  nroHabitacion: string;
  piso: number;
  feature: string | null;
  amenities: string | null;
  urlImagen: string[] | null;
  estado: boolean;
  descripcion: string | null;
  createdAt: Date;
  updatedAt: Date;
  tipo: { id: string; nombre: string; createdAt: Date; updatedAt: Date };
};

export function mapHabitacionFromPrisma(data: HabitacionPrismaRow): Habitacion {
  return new Habitacion(
    data.id,
    data.nroHabitacion,
    mapTipoHabitacionFromPrisma(data.tipo),
    data.piso,
    data.feature,
    data.amenities,
    data.urlImagen,
    data.estado,
    data.descripcion,
    data.createdAt,
    data.updatedAt,
  );
}
```

### `presentation/controllers/` — Injectable, receives use cases, uses `c.get("validData")`

```ts
// habitacion.controller.ts
import { injectable } from "tsyringe";
import { AppContext } from "../../common/types/app.types";
import { ApiResponse } from "../api.response";
import { CreateHabitacionUseCase } from "../../application/use-cases/habitacion/create-habitacion.use-case";
import type { CreateHabitacionDto } from "../../application/dtos/habitacion.dto";

@injectable()
export class HabitacionController {
  constructor(private createUseCase: CreateHabitacionUseCase) {}

  async create(c: AppContext) {
    const input = c.get("validData") as CreateHabitacionDto;
    const result = await this.createUseCase.execute(input);
    return c.json(ApiResponse.success("Habitación creada exitosamente", result), 201);
  }
}
```

### `presentation/schemas/` — Zod schemas for request validation

```ts
// habitacion.schema.ts
import { z } from "zod";
import { PaginationQuerySchema } from "./pagination.schema";

export const CreateHabitacionSchema = z.object({
  nro_habitacion: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .pipe(z.string().min(1).max(10)),
  tipo_habitacion_id: z.uuid(),
  piso: z.number().int().positive(),
  feature: z.string().optional(),
  imagenes: z.array(z.instanceof(File)).optional().default([]),
});

export const ListHabitacionQuerySchema = PaginationQuerySchema.extend({
  numero: z.string().optional(),
  tipo: z.string().optional(),
});
```

### `routes/` — Resolves controller, wires middleware + handler

```ts
// habitacion.routes.ts
import { Hono } from "hono";
import { container } from "tsyringe";
import { HabitacionController } from "../presentation/controllers/habitacion.controller";
import { validSchema, validQuery } from "../presentation/middlewares/valid.middleware";
import { CreateHabitacionSchema, ListHabitacionQuerySchema } from "../presentation/schemas/habitacion.schema";

export function createHabitacionRoutes() {
  const ctrl = container.resolve(HabitacionController);
  const router = new Hono();
  router.get("/", validQuery(ListHabitacionQuerySchema), (c) => ctrl.listPaginated(c));
  router.post("/", validSchema(CreateHabitacionSchema), (c) => ctrl.create(c));
  router.get("/:id", (c) => ctrl.findById(c));
  router.put("/:id", validSchema(UpdateHabitacionSchema), (c) => ctrl.update(c));
  router.delete("/:id", (c) => ctrl.delete(c));
  return router;
}
```

### `common/IoC/` — Token registry + dependency registration

```ts
// tokens.ts
export const DI_TOKENS = {
  PrismaClient: Symbol.for("PrismaClient"),
  IHabitacionRepository: Symbol.for("IHabitacionRepository"),
  ITipoHabitacionRepository: Symbol.for("ITipoHabitacionRepository"),
  // ... one Symbol per interface
} as const;

// container.ts
export function registerDependencies(prisma: PrismaClient): void {
  container.registerInstance(DI_TOKENS.PrismaClient, prisma);
  container.registerSingleton(DI_TOKENS.IHabitacionRepository, HabitacionRepository);
  container.registerSingleton(CreateHabitacionUseCase, CreateHabitacionUseCase);
  container.registerSingleton(HabitacionController, HabitacionController);
}
```

### `index.ts` — Entrypoint: DI → app → routes → error handler

```ts
import "reflect-metadata";
import { Hono } from "hono";
import { registerDependencies } from "./common/IoC/container";
import { prisma } from "./common/libraries/prisma";
import { createHabitacionRoutes } from "./routes/habitacion.routes";

registerDependencies(prisma);
const app = new Hono();
const privateApi = new Hono();
privateApi.route("/habitaciones", createHabitacionRoutes());
app.route("/api/private", privateApi);
app.onError(errorHandler);
export default app;
```

### `test/` — Manual mock DI, no tsyringe

```ts
// habitacion.controller.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HabitacionController } from "../../src/presentation/controllers/habitacion.controller";
import { createMockContext } from "../helpers/mock-context";

describe("HabitacionController", () => {
  let controller: HabitacionController;
  let mockCreateUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCreateUseCase = { execute: vi.fn() };
    controller = new HabitacionController(mockCreateUseCase);
  });

  it("should create and return 201", async () => {
    const c = createMockContext();
    c.get = vi.fn().mockReturnValue({ nro_habitacion: "301", tipo_habitacion_id: "uuid", piso: 3 });
    mockCreateUseCase.execute.mockResolvedValue({ id: "test-id" });
    await controller.create(c);
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }), 201);
  });
});
```

## Key Conventions

### DI Pattern

- Repository interfaces in `domain/interfaces/` (prefixed with `I`), implemented in `infrastructure/repositories/`
- All registrations in `common/IoC/container.ts` as `[DI_TOKENS.IXxxRepository, XxxRepository]` and controllers + use cases as `container.registerSingleton(cls, cls)`
- Controllers inject use cases via constructor; use cases inject repositories via `@inject(DI_TOKENS.IXxxRepository)`
- **Tests do NOT use tsyringe** — they instantiate controllers/use cases with manual mock objects

### Routes

- Each module has a route factory function (e.g., `createHabitacionRoutes()`)
- Routes use middleware pattern: `validSchema(CreateXxxSchema) → controller.create`
- Validation via middleware only: `validSchema` (body), `validParams` (URL params), `validQuery` (query params)
- Validated data placed on `c.get("validData")`
- Private routes (auth): `/api/private/*` — **auth middleware is currently commented out**
- Public routes: `/api/public/*`

### Naming

- Repository methods: `create, findAll, findById, findByNumero, update, delete, hasRelatedRecords`
- Use case files: `{verb}-{entity}.use-case.ts` (kebab-case)
- Domain entities: plain classes with constructor, no methods
- DTOs: interfaces `CreateXxxDto`, `UpdateXxxDto` + `toXxxDto()` mapper functions
- Prisma mappers: `mapXxxFromPrisma(prismaRow)` — returned rows are passed through `include` for relations
- API uses snake_case (`nro_habitacion`, `tipo_habitacion_id`)
- Database uses Prisma's `@@map("tablename")` — Spanish plural table names
- Business/messages in **Spanish** (exceptions, validation errors, API responses)

## Commands

```sh
# Dev
bun run dev                  # Hot-reload via bun --hot

# Build (Docker uses this)
bun run build                # bun build → dist/

# Lint & Typecheck
bun run lint                 # biome check .
bun run lint:fix             # biome check --write .
bun run typecheck            # bunx tsc --noEmit

# Test
bun run test                 # vitest (watch mode)
bun run test:run             # vitest --run (single run)
bun test -- --reporter=verbose  # focused test output

# Prisma (ALWAYS use bunx --bun)
bun run prisma:generate      # bunx --bun prisma generate
bun run prisma:migrate       # bunx --bun prisma migrate dev
bun run prisma:reset         # bunx --bun prisma migrate reset
bun run prisma:studio        # bunx --bun prisma studio

# Auth
bun run auth:generate        # Generate better-auth config
```

## Prisma 7 Specifics

- Config file is `prisma.config.ts` (not kept in `package.json`)
- Generated client lives at `generated/prisma/client`, import as:
  ```ts
  import { PrismaClient } from "../../../generated/prisma/client";
  ```
- Adapter: `@prisma/adapter-pg` wrapping raw `pg` driver
- Schema uses `prisma-client` generator (not `prisma-client-js`)
- All `prisma` commands must use `bunx --bun prisma ...`
- Migration history: 39+ migrations — do NOT squash or delete without explicit request

## Auth

- better-auth configured in `common/libraries/auth.ts`
- Handled at `/api/auth/*` via `auth.handler(c.req.raw)`
- Uses `admin` plugin with default role `ADMIN`
- Available roles: `ADMIN`, `RECEPCIONISTA`, `SIN_ACCESO`
- Auth middleware (`auth.middleware.ts`) currently **commented out** in `index.ts` — `privateApi.use("*", authMiddleware)` is disabled
- `requireRoles()` middleware available for route-level role checking
- Better Auth session types via `auth.$Infer.Session`

## Testing

- Tests in `test/` directory, mirrors `src/` structure
- `test/setup.ts` only does `import "reflect-metadata"`
- Vitest globals enabled (`describe`, `it`, `expect`, `vi` — no imports needed)
- **No tsyringe in tests** — manual constructor injection with `vi.fn()` mocks
- Use `createMockContext()` from `test/helpers/mock-context.ts` to construct `AppContext`
- Fixtures in `test/helpers/` (e.g., `habitacion-fixtures.ts`, `mock-prisma.ts`)
- Coverage excludes: `node_modules`, `generated`, `prisma`, `test`, `*.test.ts`, `*.config.ts`

## Deployment

- Docker image based on `oven/bun:1.3.4-alpine`
- Entrypoint (`entrypoint.sh`): runs `prisma migrate deploy` then starts server
- `docker-compose.yaml`:
  - `postgres:17-alpine` — healthcheck before app starts
  - `backend-app` — build from Dockerfile, depends on postgres healthy
- S3 dev: MinIO-compatible endpoint at `http://localhost:8333`
- Environment: `.env` file (see `.env.example`) — DATABASE*URL, BETTER_AUTH*_, TRUSTED*ORIGINS, S3*_

## API Structure

```
/api/health                           # Health check
/api/auth/*                           # better-auth endpoints
/api/public/habitaciones              # Public room search
/api/public/tipos-habitacion          # Public room types
/api/private/habitaciones             # CRUD
/api/private/tipos-habitacion         # CRUD
/api/private/reservas                 # CRUD + cancel/estado
/api/private/huespedes                # CRUD
/api/private/pagos                    # CRUD
/api/private/canales                  # CRUD
/api/private/tarifas                  # CRUD
/api/private/muebles                  # CRUD
/api/private/categorias-mueble        # CRUD
/api/private/promociones              # CRUD
/api/private/productos                # CRUD
/api/private/folios                   # CRUD + consumos
/api/private/bar/insumos              # CRUD + movimientos
/api/private/bar/movimientos
/api/private/cocina/insumos           # CRUD + movimientos
/api/private/cocina/movimientos
/api/private/internacionalizaciones   # CRUD
```

## Response Format

All endpoints return `ApiResponse` envelope:

```json
{ "success": true, "message": "...", "data": ..., "timestamp": 1712000000000 }
```

## Gotchas

- **Prisma import**: Always from `generated/prisma/client`, never from `@prisma/client`
- **Decorators enabled**: `tsconfig.json` has `experimentalDecorators: true` — required for tsyringe
- **Auth disabled**: `privateApi.use("*", authMiddleware)` is commented out — all private routes are currently unprotected
- **ESM + Bun**: Use `bun run`, not `node`; moduleResolution is `bundler`
- **Biome only**: No ESLint or Prettier config — lint with `bun run lint`
- **Snake_case in API**: DTOs and request bodies use `snake_case` (mapped to `camelCase` in domain)
- **Spanish domain**: Enums, exceptions, validation messages, API responses are all in Spanish
- **Image uploads**: Use `parseFormDataMiddleware` + S3; images arrive as `File[]` via `multipart/form-data`
- **Paginated queries**: `PaginationQuerySchema` parses string query params, returns numeric; filtering params vary per module
