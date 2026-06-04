# API Documentation — Semaphore Relayer

REST API del Semaphore ZK Relayer sobre Optimism. Sin eventos, sin SSE, sin auth. Validación de proofs on-chain con relay opcional a `RECORD_ENDPOINT`.

---

## Tabla Resumen

Base: `http://localhost:3000`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/semaphore/groups` | Crear grupo |
| GET | `/api/semaphore/groups/counter` | Total de grupos creados |
| GET | `/api/semaphore/groups/:groupId` | Info del grupo |
| POST | `/api/semaphore/groups/:groupId/accept-admin` | Aceptar admin pendiente |
| PUT | `/api/semaphore/groups/:groupId/admin` | Transferir admin |
| PUT | `/api/semaphore/groups/:groupId/merkle-tree-duration` | Actualizar duración del merkle tree |
| POST | `/api/semaphore/members` | Agregar miembro |
| POST | `/api/semaphore/members/batch` | Agregar múltiples miembros |
| DELETE | `/api/semaphore/members` | Eliminar miembro |
| PUT | `/api/semaphore/members` | Actualizar commitment de miembro |
| GET | `/api/semaphore/members/check` | Verificar si es miembro |
| GET | `/api/semaphore/groups/:groupId/index-of` | Índice de un miembro dentro del merkle tree |
| POST | `/api/semaphore/proofs/validate` | Validar proof on-chain (con tx) |
| POST | `/api/semaphore/proofs/verify` | Verificar proof (read-only, sin gas) |
| GET | `/api/semaphore/verifier` | Dirección del verificador |

---

## Formato de Respuesta

Todas las respuestas — exitosas o de error — usan el envelope `ApiResponse`:

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { },
  "timestamp": 1712000000000
}
```

Campos:

- `success`: `true` en éxito, `false` en error.
- `message`: descripción humana del resultado.
- `data`: payload. En éxito contiene el recurso; en error es `null` o contiene `details` (ver Errores).
- `timestamp`: epoch en milisegundos (`Date.now()`).

---

## Endpoints

### Health

#### GET /health — 200

Indica que el servicio está corriendo. No consulta la red.

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-04T15:00:00.000Z",
    "contract": {
      "type": "Semaphore",
      "address": "0xabc...def"
    }
  },
  "timestamp": 1712000000000
}
```

---

### Grupos

Base: `/api/semaphore`

#### POST /groups — 201

Crea un grupo. `admin` y `merkleTreeDuration` son opcionales; si no se pasan, el admin se resuelve al address de la wallet configurada y `merkleTreeDuration` queda en `null`.

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `admin` | string (address) | No | Address del admin. Si se omite, se usa `msg.sender`. |
| `merkleTreeDuration` | string (uint256) | No | Duración en segundos. `null` si se omite. |

```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "groupId": "1",
    "admin": "0xabc...def",
    "merkleTreeDuration": "604800",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": 12345678,
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

Si `merkleTreeDuration` se omite, el campo queda explícitamente en `null`:

```json
"merkleTreeDuration": null
```

#### GET /groups/counter — 200

Devuelve el contador de grupos. La lectura es del contador del contrato.

```json
{
  "success": true,
  "message": "Group counter retrieved successfully",
  "data": {
    "totalGroups": "5",
    "nextGroupId": "5"
  },
  "timestamp": 1712000000000
}
```

- `totalGroups`: cantidad de grupos existentes (todos los groupIds `< totalGroups` están creados).
- `nextGroupId`: el groupId que se asignará al próximo grupo creado. Idéntico a `totalGroups` porque la numeración es contigua desde 0.

#### GET /groups/:groupId — 200

Lee info on-chain del grupo. `merkleTreeDuration`/`merkleTreeDepth`/`merkleTreeRoot`/`merkleTreeSize` pueden ser `null` si el grupo todavía no inicializó su merkle tree.

```json
{
  "success": true,
  "message": "Group info retrieved successfully",
  "data": {
    "id": "1",
    "admin": "0xabc...def",
    "merkleTreeDuration": "604800",
    "merkleTreeDepth": 20,
    "merkleTreeRoot": "12345678901234567890",
    "merkleTreeSize": "42"
  },
  "timestamp": 1712000000000
}
```

#### POST /groups/:groupId/accept-admin — 200

El `pendingAdmin` acepta la transferencia. El endpoint valida on-chain que el caller sea el `pendingAdmin` antes de broadcastear.

```json
{
  "success": true,
  "message": "Group admin accepted",
  "data": {
    "groupId": "1",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### PUT /groups/:groupId/admin — 200

Transfiere el admin. Body validado con `UpdateGroupAdminSchema` (address EIP-55).

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `newAdmin` | string (address) | Sí | Address del nuevo admin. Checksum EIP-55. |

```json
{
  "success": true,
  "message": "Group admin updated",
  "data": {
    "groupId": "1",
    "newAdmin": "0xdef...789",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### PUT /groups/:groupId/merkle-tree-duration — 200

Actualiza la duración del merkle tree del grupo.

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `newMerkleTreeDuration` | string (uint256) | Sí | Nueva duración en segundos. |

```json
{
  "success": true,
  "message": "Group merkle tree duration updated",
  "data": {
    "groupId": "1",
    "newMerkleTreeDuration": "604800",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```


---

### Miembros

#### POST /members — 201

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `identityCommitment` | string (uint256) | Sí | Commitment del miembro. |

```json
{
  "success": true,
  "message": "Member added to group",
  "data": {
    "groupId": "1",
    "identityCommitment": "1234567890",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": 12345678,
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### POST /members/batch — 201

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `identityCommitments` | string[] (uint256) | Sí | Array de commitments. Vacío = error 400 (el contrato también revierte). |

```json
{
  "success": true,
  "message": "3 members added to group",
  "data": {
    "groupId": "1",
    "count": 3,
    "identityCommitments": [
      "1111111111",
      "2222222222",
      "3333333333"
    ],
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": 12345678,
      "gasUsed": "42000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### DELETE /members — 200

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `identityCommitment` | string (uint256) | Sí | Commitment a eliminar. |
| `merkleProofSiblings` | string[] (uint256) | Sí | Siblings del merkle proof. |

```json
{
  "success": true,
  "message": "Member removed from group",
  "data": {
    "groupId": "1",
    "identityCommitment": "1234567890",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### PUT /members — 200

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `identityCommitment` | string (uint256) | Sí | Commitment actual. |
| `newIdentityCommitment` | string (uint256) | Sí | Nuevo commitment. |
| `merkleProofSiblings` | string[] (uint256) | Sí | Siblings del merkle proof. |

```json
{
  "success": true,
  "message": "Member updated",
  "data": {
    "groupId": "1",
    "oldIdentityCommitment": "1234567890",
    "newIdentityCommitment": "9876543210",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### GET /members/check?groupId=&identityCommitment= — 200

Query:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `identityCommitment` | string (uint256) | Sí | Commitment a verificar. |

```json
{
  "success": true,
  "message": "Member check completed",
  "data": {
    "groupId": "1",
    "identityCommitment": "1234567890",
    "hasMember": true
  },
  "timestamp": 1712000000000
}
```

#### GET /groups/:groupId/index-of?identityCommitment= — 200

Devuelve el índice (0-based) de un miembro dentro del merkle tree del grupo. Si no es miembro, el contrato revierte.

Query:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `identityCommitment` | string (uint256) | Sí | Commitment a buscar. |

```json
{
  "success": true,
  "message": "Member index retrieved successfully",
  "data": {
    "groupId": "1",
    "identityCommitment": "1234567890",
    "index": "42"
  },
  "timestamp": 1712000000000
}
```

---

### Proofs

`validate` ejecuta la tx on-chain. Si `RECORD_ENDPOINT` está configurado, relayea el resultado automáticamente (fire & forget — un fallo del relay no afecta la respuesta).

`verify` es read-only (no consume gas).

#### POST /proofs/validate — 200

Body:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `groupId` | string (uint256) | Sí | ID del grupo. |
| `proof` | object (SemaphoreProof) | Sí | Proof ZK. Ver sección `SemaphoreProof` más abajo. |

```json
{
  "success": true,
  "message": "Proof validated on-chain",
  "data": {
    "groupId": "1",
    "nullifier": "11111111111111111111111111111111",
    "message": "22222222222222222222222222222222",
    "scope": "33333333333333333333333333333333",
    "transaction": {
      "hash": "0xabc...123",
      "blockNumber": 12345678,
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### POST /proofs/verify — 200

```json
{
  "success": true,
  "message": "Proof verification completed",
  "data": {
    "groupId": "1",
    "isValid": true,
    "proof": {
      "nullifier": "11111111111111111111111111111111",
      "message": "22222222222222222222222222222222",
      "scope": "33333333333333333333333333333333"
    }
  },
  "timestamp": 1712000000000
}
```

Nota: `/proofs/verify` solo devuelve los campos semánticos del proof (`nullifier`, `message`, `scope`), no el proof completo.

---

### Utilidades

#### GET /verifier — 200

```json
{
  "success": true,
  "message": "Verifier address retrieved successfully",
  "data": {
    "verifierAddress": "0xabc...def"
  },
  "timestamp": 1712000000000
}
```

---

## SemaphoreProof (proof como objeto)

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

El proof SIEMPRE se manda como objeto, nunca aplanado a `proofNullifier`, `proofScope`, etc.

---

## Record Relay

Al validar un proof exitosamente, si `RECORD_ENDPOINT` está configurado, se envía un POST con:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| groupId | string | ID del grupo |
| nullifier | string | Nullifier del proof |
| message | string | Mensaje del proof |
| scope | string | Scope del proof |
| transactionHash | string | Hash de la tx on-chain (siempre presente) |

El endpoint destino debe ser idempotente por `nullifier`. El relay es fire & forget: si falla, el endpoint responde igual (la tx ya está minteada).

---

## Manejo de Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Validation error (Zod) | `data.details` con array de issues |
| 400 | Path param inválido (no convertible a bigint) | `message` describe el error |
| 4xx | `DomainException` / `HTTPException` | `message` describe el error |
| 500 | Error interno | `message: "Internal server error"` |

### 400 — Validation Error (Zod)

Todos los controllers usan el mismo formato de detalles. Cada item tiene `field` (path joined con `.`), `message` y `code`:

```json
{
  "success": false,
  "message": "Validation error",
  "data": {
    "details": [
      {
        "field": "newAdmin",
        "message": "Invalid address format",
        "code": "custom"
      }
    ]
  },
  "timestamp": 1712000000000
}
```

Si hay varios issues a la vez (por ejemplo body con varios campos inválidos), todos aparecen en el array `details`.

### 4xx — DomainException / HTTPException / notFound

```json
{
  "success": false,
  "message": "Group not found",
  "data": null,
  "timestamp": 1712000000000
}
```

### 500 — Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "timestamp": 1712000000000
}
```

---

## Convenciones de Shapes

- **BigInts** se reciben/envían como strings (JSON no soporta BigInt nativo).
- **Direcciones Ethereum**: `0x` + 40 caracteres hex, normalizadas a EIP-55 checksum en el output.
- **Transacciones on-chain** devuelven siempre un objeto `transaction` con `hash` (no `txHash`), `blockNumber`, `gasUsed` y `status` (`"success"` o `"reverted"`).
- **Path params numéricos** (`:groupId`, etc.) se validan con `parsePathParam` y un input inválido (no entero) devuelve 400, nunca 500.

---

## Arquitectura

```
src/
├── domain/           Interfaces, tipos puros, excepciones
├── application/      Use-cases (uno por acción), DTOs
├── infrastructure/   BlockchainService, RecordRelayService
├── presentation/     Controller, Zod schemas, middlewares (error-handler)
├── common/           Helpers compartidos (responses, parse-path-param)
├── routes/           Rutas con wiring manual por constructor
└── index.ts          Bootstrap
```

Sin DI containers, sin decoradores, sin `reflect-metadata`.

---

## Breaking Changes

Los siguientes cambios son **breaking** respecto a versiones anteriores. Clientes que dependan de las formas viejas deben migrar.

| Cambio | Antes | Ahora | Impacto |
|--------|-------|-------|---------|
| Campo `txHash` | `transaction.txHash` | `transaction.hash` | Cualquier cliente que lea `txHash` se rompe. Renombrar a `hash`. |
| `merkleTreeDuration` omitido | Campo ausente o `undefined` | Campo presente y explícitamente `null` | Clientes deben aceptar `null`, no `undefined`. |
| `transaction.status` | Ausente en algunos endpoints (addMember, addMembers) | Siempre presente en endpoints de escritura | No es breaking estrictamente (campo nuevo), pero clientes que asuman forma fija deben ignorar campos extra. |
| Error handler format | `data.details.fieldErrors` / `data.details.formErrors` (Zod 3 `flatten()`) | `data.details: Array<{ field, message, code }>` (Zod 4 `.issues`) | Clientes que parsean `data.details` deben migrar de objeto a array. |
| `/health` response | Objeto crudo sin envelope | `ApiResponse` envelope con `success`/`message`/`data`/`timestamp` | Clientes que asuman `status` en la raíz deben leerlo desde `data.status`. |
| `addMembers` con array vacío | `parse` aceptaba array vacío | 400 con `details` indicando campo requerido | Clientes que mandaban `[]` ahora reciben error. |
| `validateProof` `transactionHash` en relay | `string \| null` | `string` (siempre presente) | Clientes del endpoint externo deben aceptar `string`, no `string \| null`. |

### Recomendación de versionado

Si tenés clientes en producción que no podés migrar de inmediato, exponé este relayer bajo un prefijo versionado (`/v2/...`) y mantené el viejo contrato hasta migrar. La ABI del contrato on-chain NO cambió, así que un cliente puede coexistir con ambas versiones de la API.
