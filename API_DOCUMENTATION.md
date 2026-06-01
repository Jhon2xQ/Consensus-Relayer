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

#### POST /groups — 201

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

- `admin`: la dirección enviada en el body, o `"msg.sender"` si no se envió.
- `merkleTreeDuration`: `null` si no se especificó.

#### GET /groups/counter — 200

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

#### GET /groups/:groupId — 200

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

```json
{
  "success": true,
  "message": "Group admin accepted",
  "data": {
    "groupId": "1",
    "transaction": {
      "txHash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### PUT /groups/:groupId/admin — 200

```json
{
  "success": true,
  "message": "Group admin updated",
  "data": {
    "groupId": "1",
    "newAdmin": "0xdef...789",
    "transaction": {
      "txHash": "0xabc...123",
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

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/members` | Agregar miembro. Body: `{ groupId, identityCommitment }` |
| POST | `/members/batch` | Agregar múltiples. Body: `{ groupId, identityCommitments[] }` |
| DELETE | `/members` | Eliminar miembro. Body: `{ groupId, identityCommitment, merkleProofSiblings[] }` |
| PUT | `/members` | Actualizar commitment. Body: `{ groupId, identityCommitment, newIdentityCommitment, merkleProofSiblings[] }` |
| GET | `/members/check?groupId=&identityCommitment=` | Verificar si es miembro |

#### POST /members — 201

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
      "gasUsed": "21000"
    }
  },
  "timestamp": 1712000000000
}
```

#### POST /members/batch — 201

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
      "gasUsed": "42000"
    }
  },
  "timestamp": 1712000000000
}
```

#### DELETE /members — 200

```json
{
  "success": true,
  "message": "Member removed from group",
  "data": {
    "groupId": "1",
    "identityCommitment": "1234567890",
    "transaction": {
      "txHash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### PUT /members — 200

```json
{
  "success": true,
  "message": "Member updated",
  "data": {
    "groupId": "1",
    "oldIdentityCommitment": "1234567890",
    "newIdentityCommitment": "9876543210",
    "transaction": {
      "txHash": "0xabc...123",
      "blockNumber": "12345678",
      "gasUsed": "21000",
      "status": "success"
    }
  },
  "timestamp": 1712000000000
}
```

#### GET /members/check?groupId=1&identityCommitment=1234567890 — 200

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

---

### Proofs

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/proofs/validate` | Validar proof on-chain. Body: `{ groupId, proof }` |
| POST | `/proofs/verify` | Verificar proof (read-only, sin gas). Body: `{ groupId, proof }` |

`validate` ejecuta la tx on-chain. Si `RECORD_ENDPOINT` está configurado, relayea el resultado automáticamente (fire & forget).

#### POST /proofs/validate — 200

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

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/verifier` | Dirección del contrato verificador |

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

### 400 — Validation Error (Zod)

```json
{
  "success": false,
  "message": "Validation error",
  "data": {
    "details": {
      "fieldErrors": {
        "groupId": ["Expected string, received number"]
      },
      "formErrors": []
    }
  },
  "timestamp": 1712000000000
}
```

### 4xx — DomainException / HTTPException

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
- El campo `transaction` en algunos endpoints incluye `status` (createGroup, validateProof, accept-admin, etc.) y en otros no (addMember, addMembers), según la semántica de cada operación
