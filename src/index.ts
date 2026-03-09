import "reflect-metadata";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { app } from "./routes";
import { errorHandler } from "./middleware/error-handler";
import { container } from "./config/container";
import { TOKENS } from "./config/tokens";
import type { IEventService } from "./interfaces/event-service.interface";

// CORS
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Error handler global
app.onError(errorHandler);

// Not Found
app.notFound((c) => {
  return c.json({ success: false, error: "Not Found" }, 404);
});

const port = process.env.PORT || 3000;

// Start event listener
const eventService = container.resolve<IEventService>(TOKENS.EventService);
eventService.startListening().catch((error) => {
  console.error("❌ Failed to start event listener:", error);
});

console.log(`
🚀 Server running at http://localhost:${port}
📦 Dependency Injection: tsyringe active
🔧 Contract: Semaphore ZK
🎧 Event Listener: ProofValidated active
`);

export default {
  port,
  fetch: app.fetch,
};
