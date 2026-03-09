// src/routes/event.routes.ts
import { Hono } from "hono";
import { container } from "tsyringe";
import { EventController } from "../controllers/event.controller";

const eventRoutes = new Hono();
const eventController = container.resolve(EventController);

// SSE endpoint para escuchar eventos en tiempo real
eventRoutes.get("/stream", eventController.subscribeToEvents);

// Endpoint para obtener eventos recientes (polling)
eventRoutes.get("/recent", eventController.getRecentEvents);

export { eventRoutes };
