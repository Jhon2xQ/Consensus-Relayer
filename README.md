# Semaphore Relayer API

API REST para interactuar con el protocolo Semaphore (Zero-Knowledge Proofs) en Optimism, con sistema de escucha y broadcasting de eventos en tiempo real.

## Descripción

Este relayer actúa como intermediario entre aplicaciones cliente y el contrato inteligente Semaphore desplegado en Optimism. Proporciona:

- API REST para gestionar grupos, miembros y validación de pruebas ZK
- Sistema de eventos en tiempo real que captura y transmite validaciones de pruebas
- Broadcasting vía Server-Sent Events (SSE) a múltiples clientes simultáneos

## Instalación

### Desarrollo

#### Requisitos

- Bun >= 1.0.0
- Cuenta con fondos en Optimism (Mainnet o Sepolia)
- Contrato Semaphore desplegado

#### Pasos

1. Clonar e instalar:

```bash
git clone <repo-url>
cd Consensus-Relayer
bun install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=3000
NODE_ENV=development
RPC_URL=https://opt-sepolia.g.alchemy.com/v2/TU_API_KEY
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
```

4. Ejecutar:

```bash
bun run dev
```

Servidor disponible en `http://localhost:3000`

### Producción

#### Docker Compose (Recomendado)

```nginx
server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Para SSE
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```
