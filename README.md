# Semaphore Relayer API

API REST para interactuar con el protocolo Semaphore (Zero-Knowledge Proofs) en Optimism. Actúa como relayer firmando transacciones on-chain con una wallet configurada.

## Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Blockchain**: viem (Optimism / Optimism Sepolia)
- **Validación**: Zod
- **Arquitectura**: Hexagonal (Clean Architecture)

## Arranque rápido

```bash
bun install
cp .env.example .env
# editar .env con tus valores
bun run dev
```

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `RPC_URL` | ✅ | URL del RPC (Alchemy/Infura) |
| `PRIVATE_KEY` | ✅ | Wallet que firma tx (`0x...` 64 hex) |
| `CONTRACT_ADDRESS` | ✅ | Dirección del contrato Semaphore (`0x...` 40 hex) |
| `PORT` | ❌ | Puerto (default: 3000) |
| `NODE_ENV` | ❌ | `development` → Sepolia, `production` → Mainnet |
| `RECORD_ENDPOINT` | ❌ | URL para relay de proofs validados |

## Endpoints

### Semaphore Groups
```
POST   /api/semaphore/groups                     Crear grupo
GET    /api/semaphore/groups/counter             Contador de grupos
GET    /api/semaphore/groups/:groupId            Info del grupo
POST   /api/semaphore/groups/:groupId/accept-admin  Aceptar admin
PUT    /api/semaphore/groups/:groupId/admin      Actualizar admin
```

### Members
```
POST   /api/semaphore/members                    Agregar miembro
POST   /api/semaphore/members/batch              Agregar múltiples
DELETE /api/semaphore/members                    Remover miembro
PUT    /api/semaphore/members                    Actualizar miembro
GET    /api/semaphore/members/check              Verificar miembro
```

### Proofs
```
POST   /api/semaphore/proofs/validate            Validar proof on-chain + relay
POST   /api/semaphore/proofs/verify              Verificar proof (read-only)
```

### Utilidades
```
GET    /api/semaphore/verifier                   Dirección del verifier
GET    /health                                   Health check
```

## Relay de records

Si se configura `RECORD_ENDPOINT`, cada `validateProof` exitoso envía un POST al endpoint con:

```json
{
  "groupId": "...",
  "nullifier": "...",
  "message": "...",
  "scope": "...",
  "transactionHash": "0x..."
}
```

Endpoint idempotente por `nullifier`. El relay es *fire & forget*: si falla no afecta la respuesta del relayer.

## Arquitectura

```
src/
├── domain/            Entidades, interfaces (puertos), excepciones
├── application/       Use-cases (uno por acción), DTOs
├── infrastructure/    BlockchainService, RecordRelayService
├── presentation/      Controller, schemas Zod, middlewares
├── common/            Config (env, blockchain, ABI), tipos compartidos
├── routes/            Definición de rutas con wiring manual
└── index.ts           Entrypoint
```

Sin DI containers, sin decoradores, sin `reflect-metadata`. Wiring manual por constructor.
