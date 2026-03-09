import { Hono } from "hono";
import { semaphoreRoutes } from "./semaphore.routes";
import { eventRoutes } from "./event.routes";

const app = new Hono();

// Health check
app.get("/health", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    di: "tsyringe-active",
    features: ["semaphore-zk", "event-streaming"],
    contract: {
      type: "Semaphore",
      address: process.env.CONTRACT_ADDRESS,
    },
  });
});

// API Routes
app.route("/api/semaphore", semaphoreRoutes);
app.route("/api/events", eventRoutes);

export { app };
