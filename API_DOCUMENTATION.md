# API Documentation - Semaphore Relayer

Documentación completa de la API REST para el protocolo Semaphore con sistema de eventos en tiempo real.

## Tabla de Contenidos

1. [Formato de Respuesta](#formato-de-respuesta)
2. [Endpoints de Grupos](#endpoints-de-grupos)
3. [Endpoints de Miembros](#endpoints-de-miembros)
4. [Endpoints de Pruebas ZK](#endpoints-de-pruebas-zk)
5. [Sistema de Eventos en Tiempo Real](#sistema-de-eventos-en-tiempo-real)
6. [Arquitectura](#arquitectura)
7. [Ejemplos de Clientes](#ejemplos-de-clientes)
8. [Ejemplos de Integración](#ejemplos-de-integración)
9. [Manejo de Errores](#manejo-de-errores)

---

## Formato de Respuesta

Todas las respuestas siguen este formato estandarizado:

```json
{
  "success": true | false,
  "message": "Mensaje descriptivo",
  "data": { ... } | null,
  "timestamp": 1234567890
}
```

## Base URLs

```
http://localhost:3000/api/semaphore  # Endpoints de Semaphore
http://localhost:3000/api/events     # Endpoints de Eventos
```

---

## Endpoints de Grupos

### 1. Crear Grupo

**POST** `/api/semaphore/groups`

Crea un nuevo grupo Semaphore.

**Body:**

```json
{
  "admin": "0x1234567890123456789012345678901234567890", // Opcional
  "merkleTreeDuration": "3600" // Opcional, en segundos
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "groupId": "1",
    "admin": "0x1234567890123456789012345678901234567890",
    "merkleTreeDuration": "3600",
    "transaction": {
      "hash": "0xabc...",
      "blockNumber": 12345,
      "gasUsed": "150000",
      "status": "success"
    }
  },
  "timestamp": 1234567890
}
```

### 2. Obtener Contador de Grupos

**GET** `/api/semaphore/groups/counter`

Obtiene el número total de grupos creados.

**Respuesta:**

```json
{
  "success": true,
  "message": "Group counter retrieved successfully",
  "data": {
    "totalGroups": "5",
    "nextGroupId": "5"
  },
  "timestamp": 1234567890
}
```

### 3. Obtener Información de Grupo

**GET** `/api/semaphore/groups/:groupId`

Obtiene información completa de un grupo.

**Respuesta:**

```json
{
  "success": true,
  "message": "Group info retrieved successfully",
  "data": {
    "id": "1",
    "admin": "0x1234567890123456789012345678901234567890",
    "merkleTreeDuration": "3600",
    "merkleTreeDepth": 20,
    "merkleTreeRoot": "12345678901234567890",
    "merkleTreeSize": "10"
  },
  "timestamp": 1234567890
}
```

### 4. Aceptar Administración

**POST** `/api/semaphore/groups/:groupId/accept-admin`

Acepta la administración de un grupo transferido.

### 5. Actualizar Administrador

**PUT** `/api/semaphore/groups/:groupId/admin`

Transfiere la administración a una nueva dirección.

**Body:**

```json
{
  "newAdmin": "0x9876543210987654321098765432109876543210"
}
```

---

## Endpoints de Miembros

### 6. Agregar Miembro

**POST** `/api/semaphore/members`

Agrega un miembro a un grupo.

**Body:**

```json
{
  "groupId": "1",
  "identityCommitment": "123456789012345678901234567890"
}
```

### 7. Agregar Múltiples Miembros

**POST** `/api/semaphore/members/batch`

Agrega múltiples miembros en una transacción.

**Body:**

```json
{
  "groupId": "1",
  "identityCommitments": ["111111111111111111111111111111", "222222222222222222222222222222"]
}
```

### 8. Eliminar Miembro

**DELETE** `/api/semaphore/members`

Elimina un miembro del grupo.

**Body:**

```json
{
  "groupId": "1",
  "identityCommitment": "123456789012345678901234567890",
  "merkleProofSiblings": ["111111111111111111111111111111"]
}
```

### 9. Actualizar Miembro

**PUT** `/api/semaphore/members`

Actualiza el identity commitment de un miembro.

**Body:**

```json
{
  "groupId": "1",
  "identityCommitment": "123456789012345678901234567890",
  "newIdentityCommitment": "999999999999999999999999999999",
  "merkleProofSiblings": ["111111111111111111111111111111"]
}
```

### 10. Verificar Pertenencia

**GET** `/api/semaphore/members/check?groupId=1&identityCommitment=123...`

Verifica si un identity commitment es miembro de un grupo.

**Respuesta:**

```json
{
  "success": true,
  "message": "Member check completed",
  "data": {
    "groupId": "1",
    "identityCommitment": "123456789012345678901234567890",
    "hasMember": true
  },
  "timestamp": 1234567890
}
```

---

## Endpoints de Pruebas ZK

### 11. Validar Prueba (On-chain)

**POST** `/api/semaphore/proofs/validate`

Valida una prueba ZK en blockchain. **Emite el evento ProofValidated**.

**Body:**

```json
{
  "groupId": "1",
  "proof": {
    "merkleTreeDepth": "20",
    "merkleTreeRoot": "12345678901234567890",
    "nullifier": "11111111111111111111111111111111",
    "message": "22222222222222222222222222222222",
    "scope": "33333333333333333333333333333333",
    "points": [
      "1111111111111111111111111111",
      "2222222222222222222222222222",
      "3333333333333333333333333333",
      "4444444444444444444444444444",
      "5555555555555555555555555555",
      "6666666666666666666666666666",
      "7777777777777777777777777777",
      "8888888888888888888888888888"
    ]
  }
}
```

**Respuesta:**

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
      "hash": "0xstu...",
      "blockNumber": 12352,
      "gasUsed": "300000",
      "status": "success"
    }
  },
  "timestamp": 1234567890
}
```

### 12. Verificar Prueba (Off-chain)

**POST** `/api/semaphore/proofs/verify`

Verifica una prueba sin registrarla en blockchain (sin gas).

**Body:** Igual que `validate`

**Respuesta:**

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
  "timestamp": 1234567890
}
```

### 13. Obtener Verificador

**GET** `/api/semaphore/verifier`

Obtiene la dirección del contrato verificador ZK.

**Respuesta:**

```json
{
  "success": true,
  "message": "Verifier address retrieved successfully",
  "data": {
    "verifierAddress": "0x1234567890123456789012345678901234567890"
  },
  "timestamp": 1234567890
}
```

---

## Sistema de Eventos en Tiempo Real

### Descripción

El servidor escucha automáticamente el evento `ProofValidated` del contrato Semaphore. Cuando se valida una prueba (voto), el evento se captura y transmite en tiempo real a todos los clientes conectados.

### Evento ProofValidated

Cuando se llama a `validateProof()` en el contrato, se emite:

```solidity
emit ProofValidated(
  groupId,
  proof.merkleTreeDepth,
  proof.merkleTreeRoot,
  proof.nullifier,
  proof.message,
  proof.scope,
  proof.points
);
```

### 14. Stream de Eventos (SSE)

**GET** `/api/events/stream`

Conexión persistente Server-Sent Events para recibir eventos en tiempo real.

**Características:**

- Múltiples clientes simultáneos
- Heartbeat cada 30 segundos
- Reconexión automática
- Sin límite de tiempo

**Uso:**

```javascript
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("connected", (event) => {
  console.log("✅ Conectado");
});

eventSource.addEventListener("ProofValidated", (event) => {
  const data = JSON.parse(event.data);
  console.log("🎉 Nuevo voto:", data.data);
});

eventSource.addEventListener("heartbeat", (event) => {
  console.log("💓 Heartbeat");
});
```

**Eventos Recibidos:**

1. **connected** - Confirmación de conexión

```json
{
  "type": "connected",
  "message": "Connected to ProofValidated event stream",
  "timestamp": 1234567890
}
```

2. **ProofValidated** - Evento de prueba validada

```json
{
  "type": "ProofValidated",
  "data": {
    "groupId": "1",
    "merkleTreeDepth": "20",
    "merkleTreeRoot": "12345678901234567890",
    "nullifier": "11111111111111111111111111111111",
    "message": "22222222222222222222222222222222",
    "scope": "33333333333333333333333333333333",
    "points": ["...", "...", "...", "...", "...", "...", "...", "..."],
    "blockNumber": "12352",
    "transactionHash": "0xabc123...",
    "timestamp": 1234567890
  }
}
```

3. **heartbeat** - Mantiene conexión viva

```json
{
  "timestamp": 1234567890
}
```

### 15. Eventos Recientes

**GET** `/api/events/recent?limit=10`

Obtiene eventos recientes almacenados en memoria (últimos 100).

**Query Parameters:**

- `limit`: Número de eventos (default: 10, máximo: 100)

**Respuesta:**

```json
{
  "success": true,
  "message": "Recent events retrieved successfully",
  "data": {
    "events": [
      {
        "groupId": "1",
        "nullifier": "11111111111111111111111111111111",
        "message": "22222222222222222222222222222222",
        "transactionHash": "0xabc123...",
        "timestamp": 1234567890
      }
    ],
    "count": 1
  },
  "timestamp": 1234567890
}
```

---

## Arquitectura

### Flujo de Eventos

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN (Optimism)                        │
│                                                                 │
│  Smart Contract: Semaphore                                      │
│  ├─ validateProof() llamado                                     │
│  └─ emit ProofValidated(groupId, depth, root, nullifier, ...)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ viem.watchContractEvent
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RELAYER API (Bun + Hono)                     │
│                                                                 │
│  EventService (Singleton)                                       │
│  ├─ Escucha eventos del contrato                               │
│  ├─ Almacena últimos 100 eventos en memoria                    │
│  └─ Notifica a todos los listeners suscritos                   │
│                         │                                       │
│                         ▼                                       │
│  EventController                                                │
│  ├─ GET /api/events/stream (SSE)                               │
│  └─ GET /api/events/recent (Polling)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Server-Sent Events (SSE)
                         │ o HTTP Polling
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTES (Red Privada)                       │
│                                                                 │
│  ├─ Browser (JavaScript/HTML)                                  │
│  ├─ Node.js/Bun (TypeScript)                                   │
│  ├─ Python (sseclient-py)                                      │
│  └─ Dashboards, Notificaciones, Bases de Datos, etc.          │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes

**EventService** (`src/services/event.service.ts`)

- Escucha eventos del contrato usando `viem.watchContractEvent`
- Mantiene lista de listeners suscritos
- Almacena últimos 100 eventos en memoria
- Broadcasting a todos los clientes conectados

**EventController** (`src/controllers/event.controller.ts`)

- Endpoint SSE para streaming en tiempo real
- Endpoint HTTP para eventos recientes
- Manejo de conexiones y desconexiones

**Ventajas:**

- Desacoplado: Los clientes no se conectan directamente a blockchain
- Escalable: Múltiples clientes sin sobrecargar el RPC
- Eficiente: Un solo listener sirve a todos los clientes
- Simple: No requiere infraestructura adicional (Redis, RabbitMQ)

---

## Ejemplos de Clientes

### Cliente Browser (JavaScript)

```javascript
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("connected", (event) => {
  console.log("✅ Conectado");
});

eventSource.addEventListener("ProofValidated", (event) => {
  const data = JSON.parse(event.data);
  console.log("🎉 Nuevo voto:", data.data);

  // Procesar evento
  const { groupId, nullifier, message, transactionHash } = data.data;
});

eventSource.onerror = (error) => {
  console.error("❌ Error:", error);
  eventSource.close();
};
```

### Cliente Node.js/TypeScript

```typescript
import { EventSource } from "eventsource";

const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", (event) => {
  const data = JSON.parse(event.data);
  const { groupId, nullifier, message, transactionHash } = data.data;

  console.log(`Vote in group ${groupId}: ${nullifier}`);
});
```

### Cliente Python

```python
from sseclient import SSEClient
import json

url = "http://localhost:3000/api/events/stream"
messages = SSEClient(url)

for msg in messages:
    if msg.event == "ProofValidated":
        data = json.loads(msg.data)
        print(f"Nuevo voto: {data['data']['nullifier']}")
```

### Cliente cURL (Testing)

```bash
curl -N http://localhost:3000/api/events/stream
```

### Cliente HTML Completo

Ver archivo: `examples/event-listener-client.html`

---

## Ejemplos de Integración

### 1. Dashboard React en Tiempo Real

```tsx
import { useEffect, useState } from "react";

export function VoteDashboard() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/api/events/stream");

    eventSource.addEventListener("connected", () => setConnected(true));

    eventSource.addEventListener("ProofValidated", (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [data.data, ...prev].slice(0, 50));
    });

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div>
      <h1>🗳️ Votos en Tiempo Real</h1>
      <div>Estado: {connected ? "🟢 Conectado" : "🔴 Desconectado"}</div>
      {events.map((event, i) => (
        <div key={i}>
          <p>Grupo: {event.groupId}</p>
          <p>TX: {event.transactionHash}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Guardar en Base de Datos

```typescript
import { EventSource } from "eventsource";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const data = JSON.parse(event.data);

  await prisma.vote.create({
    data: {
      groupId: BigInt(data.data.groupId),
      nullifier: data.data.nullifier,
      message: data.data.message,
      transactionHash: data.data.transactionHash,
      timestamp: new Date(data.data.timestamp),
    },
  });
});
```

### 3. Webhook a Sistema Externo

```typescript
import { EventSource } from "eventsource";
import axios from "axios";

const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const data = JSON.parse(event.data);

  await axios.post("https://tu-sistema.com/webhook/vote", {
    event: "proof_validated",
    data: data.data,
  });
});
```

### 4. Discord Bot

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { EventSource } from "eventsource";

const discord = new Client({ intents: [GatewayIntentBits.Guilds] });
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const data = JSON.parse(event.data);
  const channel = discord.channels.cache.get("CHANNEL_ID");

  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [
        {
          title: "🗳️ Nuevo Voto Validado",
          fields: [
            { name: "Grupo", value: data.data.groupId },
            { name: "TX", value: data.data.transactionHash },
          ],
          color: 0x00ff00,
        },
      ],
    });
  }
});
```

### 5. Telegram Bot

```typescript
import TelegramBot from "node-telegram-bot-api";
import { EventSource } from "eventsource";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!);
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const data = JSON.parse(event.data);

  await bot.sendMessage(CHAT_ID, `🗳️ Nuevo Voto\nGrupo: ${data.data.groupId}\nTX: ${data.data.transactionHash}`);
});
```

### 6. Logging y Auditoría

```typescript
import { EventSource } from "eventsource";
import fs from "fs/promises";

const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: JSON.parse(event.data),
  };

  await fs.appendFile("votes.log", JSON.stringify(logEntry) + "\n");
});
```

### 7. Estadísticas en Tiempo Real

```typescript
const stats = { totalVotes: 0, votesByGroup: new Map() };
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", (event) => {
  const data = JSON.parse(event.data);
  stats.totalVotes++;
  stats.votesByGroup.set(data.data.groupId, (stats.votesByGroup.get(data.data.groupId) || 0) + 1);
  console.log("📊 Stats:", stats);
});
```

### 8. Redis Pub/Sub (Escalabilidad)

```typescript
import { EventSource } from "eventsource";
import Redis from "ioredis";

const redis = new Redis();
const eventSource = new EventSource("http://localhost:3000/api/events/stream");

eventSource.addEventListener("ProofValidated", async (event) => {
  const data = JSON.parse(event.data);
  await redis.publish("semaphore:proof-validated", JSON.stringify(data.data));
});

// En otro servicio:
const subscriber = new Redis();
subscriber.subscribe("semaphore:proof-validated");
subscriber.on("message", (channel, message) => {
  const event = JSON.parse(message);
  console.log("Received:", event);
});
```

---

## Manejo de Errores

### Error de Validación (400)

```json
{
  "success": false,
  "message": "Validation error",
  "data": {
    "details": {
      "fieldErrors": {
        "groupId": ["Expected string, received number"]
      }
    }
  },
  "timestamp": 1234567890
}
```

### Error HTTP (4xx)

```json
{
  "success": false,
  "message": "Invalid admin address format",
  "data": null,
  "timestamp": 1234567890
}
```

### Error Interno (500)

```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "timestamp": 1234567890
}
```

---

## Escenario de Prueba Completo

### 1. Conectar al Stream

```bash
curl -N http://localhost:3000/api/events/stream
```

### 2. Crear Grupo

```bash
curl -X POST http://localhost:3000/api/semaphore/groups \
  -H "Content-Type: application/json" \
  -d '{"admin": "0xYourAddress"}' | jq .
```

### 3. Agregar Miembros

```bash
curl -X POST http://localhost:3000/api/semaphore/members/batch \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "1",
    "identityCommitments": ["123456789012345678901234567890"]
  }' | jq .
```

### 4. Validar Prueba

```bash
curl -X POST http://localhost:3000/api/semaphore/proofs/validate \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "1",
    "proof": {
      "merkleTreeDepth": "20",
      "merkleTreeRoot": "12345678901234567890",
      "nullifier": "11111111111111111111111111111111",
      "message": "22222222222222222222222222222222",
      "scope": "33333333333333333333333333333333",
      "points": ["1111...", "2222...", "3333...", "4444...", "5555...", "6666...", "7777...", "8888..."]
    }
  }' | jq .
```

### 5. Observar Evento

En la terminal del paso 1, verás el evento `ProofValidated` inmediatamente.

---

## Notas Importantes

1. Todos los valores numéricos grandes (BigInt) se envían y reciben como strings
2. Las direcciones Ethereum deben estar en formato `0x` + 40 caracteres hex
3. Los endpoints de escritura requieren fondos para gas
4. El timestamp está en milisegundos desde epoch Unix
5. El servidor escucha automáticamente eventos al iniciar
6. Múltiples clientes pueden conectarse simultáneamente
7. Los últimos 100 eventos se mantienen en memoria
8. SSE es ideal para comunicación unidireccional servidor → cliente

---

## Casos de Uso

- Dashboard de votación en tiempo real
- Notificaciones push cuando se registra un voto
- Auditoría y logging de todas las validaciones
- Integración con sistemas externos (Discord, Telegram, webhooks)
- Analytics y estadísticas en vivo
- Sincronización con bases de datos
- Sistemas de alertas y monitoreo
