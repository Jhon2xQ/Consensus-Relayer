# API Documentation — Semaphore Relayer

Documentación de la API REST del relayer Semaphore sobre Optimism. Sin eventos, sin SSE, sin auth. Validación de proofs on-chain con relay opcional a `RECORD_ENDPOINT`.

---

## Formato de Respuesta

Todas las respuestas usan el envelope `ApiResponse`:

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "timestamp": 1712000000000
}
```

Errores: `success: false`, `data: detalles según el tipo de error`.

---

## Endpoints

Base: `http://localhost:3000/api/semaphore`

### Grupos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/groups` | Crear grupo. Body: `{ admin?, merkleTreeDuration? }` |
| GET | `/groups/counter` | Total de grupos creados |
| GET | `/groups/:groupId` | Info del grupo (admin, depth, root, size, duration) |
| POST | `/groups/:groupId/accept-admin` | Aceptar admin pendiente |
| PUT | `/groups/:groupId/admin` | Transferir admin. Body: `{ newAdmin }` |

### Miembros

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/members` | Agregar miembro. Body: `{ groupId, identityCommitment }` |
| POST | `/members/batch` | Agregar múltiples. Body: `{ groupId, identityCommitments[] }` |
| DELETE | `/members` | Eliminar miembro. Body: `{ groupId, identityCommitment, merkleProofSiblings[] }` |
| PUT | `/members` | Actualizar commitment. Body: `{ groupId, identityCommitment, newIdentityCommitment, merkleProofSiblings[] }` |
| GET | `/members/check?groupId=&identityCommitment=` | Verificar si es miembro |

### Proofs

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/proofs/validate` | Validar proof on-chain. Body: `{ groupId, proof }` |
| POST | `/proofs/verify` | Verificar proof (read-only, sin gas). Body: `{ groupId, proof }` |

`validate` ejecuta la tx on-chain. Si `RECORD_ENDPOINT` está configurado, relayea el resultado automáticamente (fire & forget).

### Utilidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/verifier` | Dirección del contrato verificador |

---

## Proof (SemaphoreProof)

Todos los campos numéricos van como string (BigInt):

```json
{
  "merkleTreeDepth": "20",
  "merkleTreeRoot": "12345678901234567890",
  "nullifier": "11111111111111111111111111111111",
  "message": "22222222222222222222222222222222",
  "scope": "33333333333333333333333333333333",
  "points": ["v0","v1","v2","v3","v4","v5","v6","v7"]
}
```

---

## Record Relay

Al validar un proof exitosamente, si `RECORD_ENDPOINT` está configurado, se envía:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| groupId | string | ID del grupo |
| nullifier | string | Nullifier del proof |
| message | string | Mensaje del proof |
| scope | string | Scope del proof |
| transactionHash | string\|null | Hash de la tx on-chain |

Endpoint idempotente por `nullifier`. El relay es fire & forget: si falla, el endpoint responde igual (la tx ya está minteada).

---

## Manejo de Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Validation error (Zod) | `data.details` con fieldErrors |
| 4xx | DomainException / HTTPException | `message` describe el error |
| 500 | Error interno | `message: "Internal server error"` |

---

## Arquitectura

```
src/
├── domain/           Interfaces, tipos puros, excepciones
├── application/      Use-cases (uno por acción), DTOs
├── infrastructure/   BlockchainService, RecordRelayService
├── presentation/     Controller, Zod schemas, middlewares
├── common/           Config (env, blockchain, ABI, CORS), tipos globales
├── routes/           Rutas con wiring manual por constructor
└── index.ts          Bootstrap
```

Sin DI containers, sin decoradores, sin `reflect-metadata`.

---

## Notas

- BigInts se reciben/envián como strings (JSON no soporta BigInt nativo)
- Direcciones Ethereum: `0x` + 40 caracteres hex
- Los endpoints de escritura requieren fondos para gas en la wallet configurada
- `RECORD_ENDPOINT` es opcional; si no está configurado, el relay se saltea
